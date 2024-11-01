"use client";
import { useState } from "react";
import moment from "moment-timezone";
import { DateTimeSelector } from "@/components/DateTimeSelector";
import { MerchantCard } from "@/components/MerchantCard";
import { RevenueBreakdownView } from "@/components/RevenueBreakdownView";
import { DailyStats, RevenueBreakdown } from "@/services/stripe";

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
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);

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

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>

        <div className="space-y-4">
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

          {/* 商户列表 */}
          {merchantsData.map((merchant, index) => (
            <MerchantCard
              key={index}
              {...merchant}
              isExpanded={expandedMerchant === merchant.merchantName}
              onToggleExpand={() => setExpandedMerchant(
                expandedMerchant === merchant.merchantName ? null : merchant.merchantName
              )}
            />
          ))}

          {/* 总收入和明细 */}
          {Object.keys(totalRevenue).length > 0 && (
            <div className="bg-white p-4 rounded shadow border-t-4 border-blue-500 space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Total Revenue (All Merchants)</h2>
                {Object.entries(totalRevenue).map(([currency, amount]) => (
                  <div key={currency} className="flex justify-between py-1">
                    <span>{currency}:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <RevenueBreakdownView breakdown={totalBreakdown} />
              </div>
            </div>
          )}

          {/* 每日统计表格 */}
          {dailyTotals.length > 0 && (
            <div className="bg-white p-4 rounded shadow mt-6">
              <h2 className="text-xl font-bold mb-4">Daily Statistics</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Orders</th>
                      <th className="px-4 py-2 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTotals.map((day) => (
                      <tr key={day.date} className="border-t">
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
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
