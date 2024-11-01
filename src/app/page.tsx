"use client";
import { useState } from "react";
import moment from "moment-timezone";

interface MerchantRevenue {
  merchantName: string;
  revenue: Record<string, number>;
}

export default function Home() {
  const [merchantsData, setMerchantsData] = useState<MerchantRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [dailyTotals, setDailyTotals] = useState<any[]>([]);
  
  // 添加年月选择状态
  const now = moment().tz(timezone);
  const [selectedYear, setSelectedYear] = useState(now.year());
  const [selectedMonth, setSelectedMonth] = useState(now.month());

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // 生成年份选项（前后5年）
  const years = Array.from(
    { length: 11 },
    (_, i) => now.year() - 5 + i
  );

  // 生成月份选项
  const months = moment.months();

  const commonTimezones = [
    "Asia/Shanghai",
    "Asia/Tokyo",
    "America/New_York",
    "Europe/London",
    "UTC"
  ];

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>

        <div className="space-y-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            {/* 时区选择 */}
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="p-2 border rounded"
            >
              {commonTimezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>

            {/* 年份选择 */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2 border rounded"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* 月份选择 */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="p-2 border rounded"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <button
              onClick={fetchRevenue}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Loading..." : "Fetch Revenue"}
            </button>
          </div>

          {period && (
            <div className="text-sm text-gray-600">
              Period: {moment(period.start).format('YYYY-MM-DD HH:mm')} to{' '}
              {moment(period.end).format('YYYY-MM-DD HH:mm')} ({timezone})
            </div>
          )}

          {error && <div className="text-red-500">{error}</div>}

          {/* 商户收入列表 */}
          {merchantsData.map((merchant, index) => (
            <div key={index} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">{merchant.merchantName}</h2>
              {Object.entries(merchant.revenue).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between py-1">
                  <span>{currency}:</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}

          {/* 总收入 */}
          {Object.keys(totalRevenue).length > 0 && (
            <div className="bg-white p-4 rounded shadow border-t-4 border-blue-500">
              <h2 className="text-xl font-bold mb-4">Total Revenue (All Merchants)</h2>
              {Object.entries(totalRevenue).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between py-1">
                  <span>{currency}:</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 添加每日统计表格 */}
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
