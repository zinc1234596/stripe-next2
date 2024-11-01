import { DailyStats, RevenueBreakdown } from "@/services/stripe";
import { RevenueBreakdownView } from "./RevenueBreakdownView";
import { RevenueChart } from "./Charts/RevenueChart";
import { 
  ChartBarIcon, 
  TableCellsIcon,
  ChartPieIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useState } from "react";
import { formatCurrency } from '@/utils/currencySymbols';
interface MerchantCardProps {
  merchantName: string;
  revenue: Record<string, number>;
  dailyStats: DailyStats[];
  revenueBreakdown: RevenueBreakdown;
}

type ViewMode = 'chart' | 'table';

export function MerchantCard({
  merchantName,
  revenue,
  dailyStats,
  revenueBreakdown,
}: MerchantCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [loading, setLoading] = useState(false);

  const getPrimaryCurrency = () => {
    return Object.keys(revenue)[0] || 'USD';
  };

  const hasNoRevenue = Object.values(revenue).every(amount => amount === 0) || 
                      Object.keys(revenue).length === 0;

  if (hasNoRevenue) {
    return (
      <div className="bg-gray-50 backdrop-blur-lg rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-gray-900">{merchantName}</h2>
          <div className="text-amber-500">
            <ExclamationCircleIcon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
          <BanknotesIcon className="h-12 w-12 text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No revenue recorded this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between flex-wrap gap-2 px-4">
            <span className="min-w-[120px]">{merchantName}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(revenue).map(([currency, amount]) => (
                <span 
                  key={currency}
                  className="text-base font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md"
                >
                  {formatCurrency(amount, currency)}
                </span>
              ))}
            </div>
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {/* 收入明细 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center p-2 border-b">
            <ChartPieIcon className="h-4 w-4 text-gray-400 mr-1" />
            <h3 className="text-sm font-semibold text-gray-900">Revenue Breakdown</h3>
          </div>
          <div className="p-2">
            <RevenueBreakdownView 
              breakdown={revenueBreakdown} 
              isOverview={false}
            />
          </div>
        </div>

        {/* 数据视图切换 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center">
              {viewMode === 'chart' ? (
                <ChartBarIcon className="h-4 w-4 text-gray-400 mr-1" />
              ) : (
                <TableCellsIcon className="h-4 w-4 text-gray-400 mr-1" />
              )}
              <h3 className="text-sm font-semibold text-gray-900">
                {viewMode === 'chart' ? 'Revenue Trend' : 'Daily Stats'}
              </h3>
            </div>
            <button
              onClick={() => setViewMode(prev => prev === 'chart' ? 'table' : 'chart')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Switch View"
            >
              <ArrowPathIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <div className="p-2">
            {viewMode === 'chart' ? (
              <div className="h-40">
                <RevenueChart
                  data={dailyStats}
                  currency={Object.keys(revenue)[0]}
                  compact={true}
                  loading={loading}
                />
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[200px]">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Orders</th>
                      <th className="px-2 py-1 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-2 py-1">{day.date}</td>
                        <td className="px-2 py-1">{day.orderCount}</td>
                        <td className="px-2 py-1">
                          {Object.entries(day.revenue).map(([currency, amount]) => (
                            <div key={currency} className="whitespace-nowrap">
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
    </div>
  );
} 