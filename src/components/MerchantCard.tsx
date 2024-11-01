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
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm space-y-4">
      {/* 头部信息 */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{merchantName}</h2>
        <button
          onClick={onToggleExpand}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* 基础收入信息 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(revenue).map(([currency, amount]) => (
          <div key={currency} className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">{currency} Revenue</div>
            <div className="text-xl font-semibold text-gray-900">
              ${amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* 图表和收入明细并排 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 收入趋势图表 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex items-center p-4 border-b">
                <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              </div>
              <div className="p-4">
                <RevenueChart
                  data={dailyStats}
                  currency={getPrimaryCurrency()}
                />
              </div>
            </div>

            {/* 收入明细 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex items-center p-4 border-b">
                <ChartPieIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-semibold text-gray-900">Revenue Breakdown</h3>
              </div>
              <div className="p-4">
                <RevenueBreakdownView breakdown={revenueBreakdown} />
              </div>
            </div>
          </div>

          {/* 每日统计表格 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center p-4 border-b">
              <TableCellsIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-semibold text-gray-900">Daily Statistics</h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {day.date}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {day.orderCount}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
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
          </div>
        </div>
      )}
    </div>
  );
} 