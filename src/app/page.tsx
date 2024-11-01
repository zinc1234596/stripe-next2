"use client";
import { useState } from "react";
import moment from "moment-timezone";

export default function Home() {
  const [stripeKey, setStripeKey] = useState("");
  const [stats, setStats] = useState<any>({
    revenue: { total: {}, converted: {}, daily: {} },
    payouts: { total: {}, totalInCNY: 0 },
    subscriptions: {
      revenue: { created: {}, updated: {} },
      typeRevenue: { annual: {}, monthly: {} },
      pending: { count: 0, totalAmount: {} },
      estimatedRenewal: { currentMonth: { count: 0, revenue: {} }, nextMonth: { count: 0, revenue: {} } }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const fetchRevenue = async () => {
    if (!stripeKey) {
      setError("请输入Stripe Key");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStats({
        revenue: { total: {}, converted: {}, daily: {} },
        payouts: { total: {}, totalInCNY: 0 },
        subscriptions: {
          revenue: { created: {}, updated: {} },
          typeRevenue: { annual: {}, monthly: {} },
          pending: { count: 0, totalAmount: {} },
          estimatedRenewal: { currentMonth: { count: 0, revenue: {} }, nextMonth: { count: 0, revenue: {} } }
        }
      });

      const response = await fetch("/api/get-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stripeKey }),
      });

      if (!response.ok) {
        throw new Error("API 请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应数据");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const events = text.split('\n\n').filter(Boolean);

        for (const event of events) {
          const data = JSON.parse(event.replace('data: ', ''));
          
          switch (data.type) {
            case 'status':
              setStatus(data.message);
              break;
            case 'revenue':
              setStats(prev => ({ ...prev, revenue: { ...prev.revenue, total: data.data } }));
              break;
            case 'payouts':
              setStats(prev => ({ ...prev, payouts: { ...prev.payouts, total: data.data } }));
              break;
            case 'dailyRevenue':
              setStats(prev => ({ ...prev, revenue: { ...prev.revenue, daily: data.data } }));
              break;
            case 'subscriptionRevenue':
              setStats(prev => ({ ...prev, subscriptions: { ...prev.subscriptions, revenue: data.data } }));
              break;
            case 'subscriptionTypeRevenue':
              setStats(prev => ({ ...prev, subscriptions: { ...prev.subscriptions, typeRevenue: data.data } }));
              break;
            case 'pendingSubscriptions':
              setStats(prev => ({ ...prev, subscriptions: { ...prev.subscriptions, pending: data.data } }));
              break;
            case 'estimatedRenewal':
              setStats(prev => ({ ...prev, subscriptions: { ...prev.subscriptions, estimatedRenewal: data.data } }));
              break;
            case 'convertedRevenue':
              setStats(prev => ({ ...prev, revenue: { ...prev.revenue, converted: data.data } }));
              break;
            case 'totalInCNY':
              setStats(prev => ({ ...prev, payouts: { ...prev.payouts, totalInCNY: data.data } }));
              break;
            case 'error':
              setError(data.message);
              break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误");
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Stripe 收入统计</h1>

        <div className="space-y-4">
          <input
            type="password"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            placeholder="输入你的 Stripe Secret Key"
            className="w-full p-2 border rounded"
          />

          <button
            onClick={fetchRevenue}
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "加载中..." : "查询统计数据"}
          </button>

          {status && <div className="text-blue-500">{status}</div>}
          {error && <div className="text-red-500">{error}</div>}

          {/* 总收入 */}
          {Object.keys(stats.revenue.total).length > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">总收入</h2>
              {Object.entries(stats.revenue.total).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between py-1">
                  <span>{currency}:</span>
                  <span>${(amount as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 订阅收入 */}
          {(Object.keys(stats.subscriptions.revenue.created).length > 0 || 
            Object.keys(stats.subscriptions.revenue.updated).length > 0) && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">订阅收入</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">新订阅</h3>
                  {Object.entries(stats.subscriptions.revenue.created).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">续订</h3>
                  {Object.entries(stats.subscriptions.revenue.updated).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 订阅类型收入 */}
          {(Object.keys(stats.subscriptions.typeRevenue.annual).length > 0 || 
            Object.keys(stats.subscriptions.typeRevenue.monthly).length > 0) && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">订阅类型收入</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">年度订阅</h3>
                  {Object.entries(stats.subscriptions.typeRevenue.annual).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">月度订阅</h3>
                  {Object.entries(stats.subscriptions.typeRevenue.monthly).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 待续订数据 */}
          {stats.subscriptions.estimatedRenewal.currentMonth.count > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">预估续订收入</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">本月待续订</h3>
                  <div className="text-sm text-gray-600 mb-1">
                    数量: {stats.subscriptions.estimatedRenewal.currentMonth.count}
                  </div>
                  {Object.entries(stats.subscriptions.estimatedRenewal.currentMonth.revenue).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">下月待续订</h3>
                  <div className="text-sm text-gray-600 mb-1">
                    数量: {stats.subscriptions.estimatedRenewal.nextMonth.count}
                  </div>
                  {Object.entries(stats.subscriptions.estimatedRenewal.nextMonth.revenue).map(([currency, amount]) => (
                    <div key={currency} className="py-1">
                      {currency}: ${(amount as number).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 每日收入 */}
          {Object.keys(stats.revenue.daily).length > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">每日收入</h2>
              {Object.entries(stats.revenue.daily).map(([date, revenues]) => (
                <div key={date} className="mb-2">
                  <h3 className="font-semibold">{date}</h3>
                  {Object.entries(revenues as Record<string, number>).map(([currency, amount]) => (
                    <div key={`${date}-${currency}`} className="pl-4 py-1">
                      {currency}: ${amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
