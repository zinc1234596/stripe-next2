"use client";
import { useState, useEffect } from "react";
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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

  // 计算总订单数
  const getTotalOrders = () => {
    return dailyTotals.reduce((sum, day) => sum + day.orderCount, 0);
  };

  // 获取主要货币
  const getPrimaryCurrency = () => {
    return Object.keys(totalRevenue)[0] || 'USD';
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Revenue Analytics</h1>

      <div className="space-y-6">
        <DateTimeSelector
          timezone={timezone}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onTimezoneChange={setTimezone}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          loading={loading}
          onFetch={fetchRevenue}
        />

        {period && (
          <div className="text-sm text-gray-600">
            Period: {moment(period.start).format('YYYY-MM-DD HH:mm')} to{' '}
            {moment(period.end).format('YYYY-MM-DD HH:mm')} ({timezone})
          </div>
        )}

        {error && <div className="text-red-500">{error}</div>}

        {/* 统计卡片 */}
        {Object.keys(totalRevenue).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={`$${Object.values(totalRevenue)[0].toFixed(2)}`}
              icon={<BanknotesIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Total Orders"
              value={getTotalOrders()}
              icon={<CreditCardIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Active Merchants"
              value={merchantsData.length}
              icon={<UserGroupIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Average Order Value"
              value={`$${(Object.values(totalRevenue)[0] / getTotalOrders()).toFixed(2)}`}
              icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            />
          </div>
        )}

        {/* 总体数据分析区域 */}
        {(dailyTotals.length > 0 || Object.keys(totalRevenue).length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm">
              <div className="flex items-center border-b pb-4">
                <ChartPieIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-xl font-bold">Revenue Breakdown</h2>
              </div>
              <div className="mt-4">
                <RevenueBreakdownView breakdown={totalBreakdown} />
              </div>
            </div>

            {/* 数据视图（图表/表格） */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm">
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
                    data={dailyTotals}
                    currency={getPrimaryCurrency()}
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
                        {dailyTotals.map((day) => (
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
          </div>
        )}

        {/* 商户列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchantsData.map((merchant, index) => (
            <MerchantCard
              key={index}
              {...merchant}
              isExpanded={expandedMerchants.has(merchant.merchantName)}
              onToggleExpand={() => handleToggleExpand(merchant.merchantName)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
