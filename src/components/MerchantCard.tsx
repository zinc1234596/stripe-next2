import { DailyStats, RevenueBreakdown } from "@/services/stripe";
import { RevenueBreakdownView } from "./RevenueBreakdownView";

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
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{merchantName}</h2>
        <button
          onClick={onToggleExpand}
          className="text-blue-500 hover:text-blue-700"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Total Revenue</h3>
        {Object.entries(revenue).map(([currency, amount]) => (
          <div key={currency} className="flex justify-between py-1">
            <span>{currency}:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {isExpanded && (
        <>
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
                  {dailyStats.map((day) => (
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

          <div>
            <h3 className="font-semibold mt-4">Revenue Breakdown</h3>
            <RevenueBreakdownView breakdown={revenueBreakdown} />
          </div>
        </>
      )}
    </div>
  );
} 