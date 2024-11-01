import { DailyStats, RevenueBreakdown } from "@/services/stripe";
import { RevenueBreakdownView } from "./RevenueBreakdownView";
import { RevenueChart } from "./Charts/RevenueChart";
import { 
  ChartBarIcon, 
  TableCellsIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

interface MerchantCardProps {
  merchantName: string;
  revenue: Record<string, number>;
  dailyStats: DailyStats[];
  revenueBreakdown: RevenueBreakdown;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MerchantCard({
  merchantName,
  revenue,
  dailyStats,
  revenueBreakdown,
  isExpanded,
  onToggleExpand
}: MerchantCardProps) {
  // 获取主要货币
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

      {/* 基础收入信息 - 更紧凑的布局 */}
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
          {/* 图表和收入明细 */}
          <div className="space-y-3">
            {/* 收入趋势图表 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center p-2 border-b">
                <ChartBarIcon className="h-4 w-4 text-gray-400 mr-1" />
                <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
              </div>
              <div className="p-2">
                <div className="h-[200px]"> {/* 减小图表高度 */}
                  <RevenueChart
                    data={dailyStats}
                    currency={getPrimaryCurrency()}
                  />
                </div>
              </div>
            </div>

            {/* 收入明细 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center p-2 border-b">
                <ChartPieIcon className="h-4 w-4 text-gray-400 mr-1" />
                <h3 className="text-sm font-semibold text-gray-900">Revenue Breakdown</h3>
              </div>
              <div className="p-2">
                <RevenueBreakdownView breakdown={revenueBreakdown} />
              </div>
            </div>
          </div>

          {/* 每日统计表格 - 使用更紧凑的表格样式 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center p-2 border-b">
              <TableCellsIcon className="h-4 w-4 text-gray-400 mr-1" />
              <h3 className="text-sm font-semibold text-gray-900">Daily Stats</h3>
            </div>
            <div className="p-2">
              <div className="overflow-x-auto max-h-[200px]"> {/* 限制表格高度并添加滚动 */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 