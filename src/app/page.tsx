"use client";
import { useState } from "react";
import moment from "moment-timezone";
import { PAYMENT_TYPES, PaymentType } from "@/config/paymentTypes";

interface MerchantRevenue {
  merchantName: string;
  revenue: Record<string, number>;
  dailyStats: DailyStats[];
  revenueBreakdown: RevenueBreakdown;
}

interface DailyStats {
  date: string;
  orderCount: number;
  revenue: Record<string, number>;
}

interface RevenueBreakdown {
  oneTime: Record<string, number>;
  subscription: {
    monthly: Record<string, number>;
    annual: Record<string, number>;
  };
}

export default function Home() {
  const [merchantsData, setMerchantsData] = useState<MerchantRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [dailyTotals, setDailyTotals] = useState<any[]>([]);
  const [totalBreakdown, setTotalBreakdown] = useState<RevenueBreakdown>({
    oneTime: {},
    subscription: { monthly: {}, annual: {} }
  });
  
  // 添加年月选择状态
  const now = moment().tz(timezone);
  const [selectedYear, setSelectedYear] = useState(now.year());
  const [selectedMonth, setSelectedMonth] = useState(now.month());

  // 添加展开/折叠状态
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);

  // 添加支付类型选择状态
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<Set<string>>(
    new Set([PAYMENT_TYPES[0].id])
  );

  // 验证是否至少选择了一个支付类型
  const isValidSelection = selectedPaymentTypes.size > 0;

  // 处理支付类型选择
  const handlePaymentTypeChange = (typeId: string) => {
    setSelectedPaymentTypes(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(typeId)) {
        if (newSelection.size > 1) {
          newSelection.delete(typeId);
        }
      } else {
        newSelection.add(typeId);
      }
      return newSelection;
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

  // 渲染收入明细的辅助函数
  const renderRevenueBreakdown = (breakdown: RevenueBreakdown) => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {selectedPaymentTypes.has('oneTime') && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">One-Time Payments</h3>
            {Object.entries(breakdown.oneTime).map(([currency, amount]) => (
              <div key={currency} className="flex justify-between py-1">
                <span>{currency}:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(breakdown.oneTime).length === 0 && (
              <div className="text-gray-500">No one-time payments</div>
            )}
          </div>
        )}
        
        {selectedPaymentTypes.has('monthly') && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Monthly Subscriptions</h3>
            {Object.entries(breakdown.subscription.monthly).map(([currency, amount]) => (
              <div key={currency} className="flex justify-between py-1">
                <span>{currency}:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(breakdown.subscription.monthly).length === 0 && (
              <div className="text-gray-500">No monthly subscriptions</div>
            )}
          </div>
        )}
        
        {selectedPaymentTypes.has('annual') && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Annual Subscriptions</h3>
            {Object.entries(breakdown.subscription.annual).map(([currency, amount]) => (
              <div key={currency} className="flex justify-between py-1">
                <span>{currency}:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(breakdown.subscription.annual).length === 0 && (
              <div className="text-gray-500">No annual subscriptions</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>

        <div className="space-y-4">
          {/* 添加支付类型选择 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Payment Types</h2>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_TYPES.map((type) => (
                <label
                  key={type.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPaymentTypes.has(type.id)}
                    onChange={() => handlePaymentTypeChange(type.id)}
                    className="form-checkbox h-5 w-5 text-blue-500"
                  />
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 时区和日期选择 */}
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
            <div key={index} className="bg-white p-4 rounded shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{merchant.merchantName}</h2>
                <button
                  onClick={() => setExpandedMerchant(
                    expandedMerchant === merchant.merchantName ? null : merchant.merchantName
                  )}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {expandedMerchant === merchant.merchantName ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {/* 商户总收入 */}
              <div className="space-y-2">
                <h3 className="font-semibold">Total Revenue</h3>
                {Object.entries(merchant.revenue).map(([currency, amount]) => (
                  <div key={currency} className="flex justify-between py-1">
                    <span>{currency}:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* 商户每日统计 */}
              {expandedMerchant === merchant.merchantName && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Daily Statistics</h3>
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
                        {merchant.dailyStats.map((day) => (
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

              {expandedMerchant === merchant.merchantName && (
                <>
                  <h3 className="font-semibold mt-4">Revenue Breakdown</h3>
                  {renderRevenueBreakdown(merchant.revenueBreakdown)}
                </>
              )}
            </div>
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

              {/* 添加总收入明细 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* 一次性付款 */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">One-Time Payments</h4>
                    {Object.entries(totalBreakdown.oneTime).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between py-1">
                        <span>{currency}:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(totalBreakdown.oneTime).length === 0 && (
                      <div className="text-gray-500">No one-time payments</div>
                    )}
                  </div>

                  {/* 月度订阅 */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Monthly Subscriptions</h4>
                    {Object.entries(totalBreakdown.subscription.monthly).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between py-1">
                        <span>{currency}:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(totalBreakdown.subscription.monthly).length === 0 && (
                      <div className="text-gray-500">No monthly subscriptions</div>
                    )}
                  </div>

                  {/* 年度订阅 */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Annual Subscriptions</h4>
                    {Object.entries(totalBreakdown.subscription.annual).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between py-1">
                        <span>{currency}:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(totalBreakdown.subscription.annual).length === 0 && (
                      <div className="text-gray-500">No annual subscriptions</div>
                    )}
                  </div>
                </div>

                {/* 添加百分比统计 */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Revenue Distribution</h4>
                  {Object.entries(totalRevenue).map(([currency, totalAmount]) => {
                    const selectedAmounts = {
                      oneTime: selectedPaymentTypes.has('oneTime') ? totalBreakdown.oneTime[currency] || 0 : 0,
                      monthly: selectedPaymentTypes.has('monthly') ? totalBreakdown.subscription.monthly[currency] || 0 : 0,
                      annual: selectedPaymentTypes.has('annual') ? totalBreakdown.subscription.annual[currency] || 0 : 0,
                    };

                    const selectedTotal = Object.values(selectedAmounts).reduce((a, b) => a + b, 0);

                    return (
                      <div key={currency} className="mb-3">
                        <div className="font-medium">{currency}</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {selectedPaymentTypes.has('oneTime') && (
                            <div>
                              One-Time: {((selectedAmounts.oneTime / selectedTotal) * 100).toFixed(1)}%
                            </div>
                          )}
                          {selectedPaymentTypes.has('monthly') && (
                            <div>
                              Monthly: {((selectedAmounts.monthly / selectedTotal) * 100).toFixed(1)}%
                            </div>
                          )}
                          {selectedPaymentTypes.has('annual') && (
                            <div>
                              Annual: {((selectedAmounts.annual / selectedTotal) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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

          {/* 总收入明细 */}
          {Object.keys(totalBreakdown.oneTime).length > 0 && (
            <div className="bg-white p-4 rounded shadow mt-6">
              <h2 className="text-xl font-bold mb-4">Total Revenue Breakdown</h2>
              {renderRevenueBreakdown(totalBreakdown)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
