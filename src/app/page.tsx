"use client";
import { useState, useEffect, useMemo } from "react";
import moment from "moment-timezone";
import { DateTimeSelector } from "@/components/DateTimeSelector";
import { MerchantCard } from "@/components/MerchantCard";
import { RevenueBreakdownView } from "@/components/RevenueBreakdownView";
import { DailyStats, RevenueBreakdown } from "@/services/stripe";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { StatCard } from "@/components/Cards/StatCard";
import { RevenueChart } from "@/components/Charts/RevenueChart";
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  TableCellsIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowPathIcon,
  TrophyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { fetchExchangeRates, convertRevenue, mergeAndConvertRevenues } from "@/utils/currency";
import { formatCurrency } from '@/utils/currencySymbols';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend as RechartsLegend } from 'recharts';
import { PAYMENT_TYPES } from "@/config/paymentTypes";

interface MerchantRevenue {
  merchantName: string;
  revenue: Record<string, number>;
  dailyStats: DailyStats[];
  revenueBreakdown: RevenueBreakdown;
}

export default function Home() {
  const [merchantsData, setMerchantsData] = useState<MerchantRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyStats[]>([]);
  const [totalBreakdown, setTotalBreakdown] = useState<RevenueBreakdown>({
    oneTime: {},
    subscription: {}
  });
  
  const now = moment().tz(timezone);
  const [selectedYear, setSelectedYear] = useState(now.year());
  const [selectedMonth, setSelectedMonth] = useState(now.month());
  const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(
    new Set(merchantsData.map(m => m.merchantName))
  );
  const [overviewMode, setOverviewMode] = useState<'chart' | 'table'>('chart');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isPrivate, setIsPrivate] = useState(false);

  // Supported currency list
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD'];

  // Get exchange rates data
  useEffect(() => {
    fetchExchangeRates(targetCurrency).then(setExchangeRates);
  }, [targetCurrency]);

  // Convert revenue data
  const convertedTotalRevenue = useMemo(() => {
    if (!Object.keys(exchangeRates).length) return totalRevenue;
    return convertRevenue(totalRevenue, targetCurrency, exchangeRates);
  }, [totalRevenue, targetCurrency, exchangeRates]);

  // Convert each merchant's revenue data
  const convertedMerchantsData = useMemo(() => {
    if (!Object.keys(exchangeRates).length) return merchantsData;
    return merchantsData.map(merchant => ({
      ...merchant,
      revenue: convertRevenue(merchant.revenue, targetCurrency, exchangeRates),
      dailyStats: merchant.dailyStats.map(day => ({
        ...day,
        revenue: convertRevenue(day.revenue, targetCurrency, exchangeRates),
      })),
    }));
  }, [merchantsData, targetCurrency, exchangeRates]);

  // Convert daily total revenue data
  const convertedDailyTotals = useMemo(() => {
    if (!Object.keys(exchangeRates).length) return dailyTotals;
    return dailyTotals.map(day => ({
      ...day,
      revenue: convertRevenue(day.revenue, targetCurrency, exchangeRates),
    }));
  }, [dailyTotals, targetCurrency, exchangeRates]);

  useEffect(() => {
    setExpandedMerchants(new Set(merchantsData.map(m => m.merchantName)));
  }, [merchantsData]);

  const handleToggleExpand = (merchantName: string) => {
    setExpandedMerchants(prev => {
      const next = new Set(prev);
      if (next.has(merchantName)) {
        next.delete(merchantName);
      } else {
        next.add(merchantName);
      }
      return next;
    });
  };

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear current data
      setMerchantsData([]);
      setTotalRevenue({});
      setPeriod(null);
      setDailyTotals([]);
      setTotalBreakdown({
        oneTime: {},
        subscription: {}
      });

      const response = await fetch(
        `/api/get-revenue?` + 
        `timezone=${encodeURIComponent(timezone)}` +
        `&year=${selectedYear}` +
        `&month=${selectedMonth}`
      );
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch revenue");
      }

      setMerchantsData(data.merchants);
      setTotalRevenue(data.totalRevenue);
      setPeriod(data.period);
      setDailyTotals(data.dailyTotals);
      setTotalBreakdown(data.totalBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total orders
  const getTotalOrders = () => {
    return dailyTotals.reduce((sum, day) => sum + day.orderCount, 0);
  };

  // Get primary currency
  const getPrimaryCurrency = () => {
    return Object.keys(totalRevenue)[0] || 'USD';
  };

  // Calculate data for the highest revenue day
  const getHighestRevenueDay = () => {
    if (!dailyTotals.length) return null;

    return dailyTotals.reduce((highest, current) => {
      const currentTotal = Object.values(current.revenue).reduce((sum, amount) => sum + amount, 0);
      const highestTotal = Object.values(highest.revenue).reduce((sum, amount) => sum + amount, 0);
      
      return currentTotal > highestTotal ? current : highest;
    }, dailyTotals[0]);
  };

  const highestDay = getHighestRevenueDay();
  const highestDayTotal = highestDay 
    ? Object.values(highestDay.revenue).reduce((sum, amount) => sum + amount, 0)
    : 0;

  // Add function to handle Revenue Breakdown data
  const getRevenueBreakdownData = () => {
    const data = [];
    
    // Add one-time revenue data
    const oneTimeTotal = Object.values(totalBreakdown.oneTime)[0] || 0;
    if (oneTimeTotal > 0) {
      data.push({
        name: 'One-time Revenue',
        value: oneTimeTotal,
      });
    }

    // Add subscription revenue data
    Object.entries(totalBreakdown.subscription).forEach(([type, revenue]) => {
      const amount = Object.values(revenue)[0] || 0;
      if (amount > 0) {
        let name = type;
        switch (type) {
          case 'monthly':
            name = 'Monthly Subscription';
            break;
          case 'quarterly':
            name = 'Quarterly Subscription';
            break;
          case 'yearly':
            name = 'Annual Subscription';
            break;
        }
        data.push({
          name,
          value: amount,
        });
      }
    });

    return data;
  };

  // Pie chart colors
  const COLORS = ['#818CF8', '#34D399', '#A855F7', '#60A5FA', '#F472B6'];

  const getPaymentTypeName = (typeId: string) => {
    const paymentType = PAYMENT_TYPES.find(type => type.id === typeId);
    return paymentType?.name || typeId;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`
              flex items-center justify-center
              w-10 h-10
              rounded-full
              transition-all duration-200
              ${isPrivate 
                ? 'bg-purple-100 text-purple-600' 
                : 'bg-purple-50 text-purple-400 hover:bg-purple-100 hover:text-purple-600'
              }
            `}
            title={isPrivate ? "Show Merchant Names" : "Hide Merchant Names"}
          >
            {isPrivate ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={fetchRevenue}
            disabled={loading}
            className={`
              flex items-center justify-center
              w-10 h-10
              rounded-full
              transition-all duration-200
              ${loading 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200'
              }
            `}
            title="Refresh Data"
          >
            <ArrowPathIcon 
              className={`h-5 w-5 ${loading 
                ? 'text-gray-400 animate-spin' 
                : 'text-indigo-600'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Parameter selection area - mobile optimization */}
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm">
          <div className="p-3">
            <DateTimeSelector
              timezone={timezone}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedCurrency={targetCurrency}
              onTimezoneChange={setTimezone}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
              onCurrencyChange={setTargetCurrency}
              loading={loading}
            />
          </div>
          {period && (
            <div className="border-t px-3 py-2 text-xs text-gray-500 bg-gray-50/50">
              Period: {moment(period.start).format('YYYY-MM-DD HH:mm')} to{' '}
              {moment(period.end).format('YYYY-MM-DD HH:mm')} ({timezone})
            </div>
          )}
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {/* Statistics card */}
        {Object.keys(convertedTotalRevenue).length > 0 && dailyTotals.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(Object.values(convertedTotalRevenue)[0], targetCurrency)}
              icon={<BanknotesIcon className="h-5 w-5" />}
              color="indigo"
              size="default"
            />
            <StatCard
              title="Total Orders"
              value={getTotalOrders()}
              icon={<CreditCardIcon className="h-4 w-4" />}
              color="gray"
              size="small"
            />
            <StatCard
              title="Active Merchants"
              value={merchantsData.length}
              icon={<UserGroupIcon className="h-5 w-5" />}
              color="gray"
              size="small"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(
                Object.values(convertedTotalRevenue)[0] / getTotalOrders(),
                targetCurrency
              )}
              icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
              color="gray"
              size="small"
            />
            <StatCard
              title="Highest Daily Revenue"
              value={formatCurrency(highestDayTotal, targetCurrency)}
              subtext={highestDay ? moment(highestDay.date).format('MMM D, YYYY') : ''}
              icon={<TrophyIcon className="h-5 w-5" />}
              color="gray"
              valueClassName="text-red-800"
              size="small"
            />
          </div>
        )}

        {/* Overall data analysis area - mobile vertical stacking */}
        {(dailyTotals.length > 0 || Object.keys(totalRevenue).length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Data view (chart/table) */}
            <div className="lg:col-span-12 xl:col-span-8 bg-white/80 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  {overviewMode === 'chart' ? (
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  ) : (
                    <TableCellsIcon className="h-5 w-5 text-gray-400 mr-2" />
                  )}
                  <h2 className="text-xl font-bold">
                    {overviewMode === 'chart' ? 'Revenue Trend' : 'Daily Statistics'}
                  </h2>
                </div>
                <button
                  onClick={() => setOverviewMode(prev => prev === 'chart' ? 'table' : 'chart')}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title={overviewMode === 'chart' ? 'Show Table' : 'Show Chart'}
                >
                  <ArrowPathIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="mt-4">
                {overviewMode === 'chart' ? (
                  <RevenueChart
                    data={convertedDailyTotals}
                    currency={targetCurrency}
                    loading={loading}
                  />
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Orders</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {convertedDailyTotals.map((day) => (
                          <tr key={day.date} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">{day.date}</td>
                            <td className="px-4 py-2">{day.orderCount}</td>
                            <td className="px-4 py-2">
                              {Object.entries(day.revenue).map(([currency, amount]) => (
                                <div key={currency}>
                                  {currency}: ${(amount as number).toFixed(2)}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="lg:col-span-12 xl:col-span-4 bg-white/80 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center border-b pb-4">
                <ChartPieIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-xl font-bold">Revenue Breakdown</h2>
              </div>
              <div className="flex flex-col h-[280px] mt-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getRevenueBreakdownData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getRevenueBreakdownData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex-1">
                  <div className="grid grid-cols-1 gap-2">
                    {getRevenueBreakdownData().map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-600">
                            {getPaymentTypeName(entry.name)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(entry.value, targetCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Merchant list - mobile single column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {convertedMerchantsData.map((merchant, index) => (
            <MerchantCard
              key={index}
              {...merchant}
              merchantName={isPrivate ? `Merchant ${index + 1}` : merchant.merchantName}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
