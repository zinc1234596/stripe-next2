import { DailyStats, RevenueBreakdown } from "@/services/stripe";
import { RevenueBreakdownView } from "./RevenueBreakdownView";
import { RevenueChart } from "./Charts/RevenueChart";
import { 
  ChartBarIcon, 
  TableCellsIcon,
  ChartPieIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useState } from "react";

interface MerchantCardProps {
  merchantName: string;
  revenue: Record<string, number>;
  dailyStats: DailyStats[];
  revenueBreakdown: RevenueBreakdown;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type ViewMode = 'chart' | 'table';

export function MerchantCard({
  merchantName,
  revenue,
  dailyStats,
  revenueBreakdown,
  isExpanded,
  onToggleExpand
}: MerchantCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const getPrimaryCurrency = () => {
    return Object.keys(revenue)[0] || 'USD';
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 shadow-sm space-y-3">
      {/* 头部信息 */}
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-bold text-gray-900">{merchantName}</h2>
        <button
          onClick={onToggleExpand}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* 基础收入信息 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(revenue).map(([currency, amount]) => (
          <div key={currency} className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-500">{currency}</div>
            <div className="text-sm font-semibold text-gray-900">
              ${amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {isExpanded && (
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
                compact={true}
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
                <div className="h-[200px]">
                  <RevenueChart
                    data={dailyStats}
                    currency={getPrimaryCurrency()}
                    compact={true}
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
      )}
    </div>
  );
} 