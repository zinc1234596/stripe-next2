import { RevenueBreakdown } from "@/services/stripe";
import { PAYMENT_TYPES } from "@/config/paymentTypes";

interface RevenueBreakdownViewProps {
  breakdown: RevenueBreakdown;
}

export function RevenueBreakdownView({ breakdown }: RevenueBreakdownViewProps) {
  // 检查某个付款类型是否有数据
  const hasDataForPaymentType = (typeId: string) => {
    if (typeId === 'oneTime') {
      return Object.keys(breakdown.oneTime).length > 0;
    }
    return Object.keys(breakdown.subscription[typeId] || {}).length > 0;
  };

  // 获取所有有数据的付款类型
  const activeTypes = PAYMENT_TYPES.filter(type => hasDataForPaymentType(type.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {activeTypes.map(type => (
          <div key={type.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">{type.name}</h3>
            {type.id === 'oneTime' ? (
              Object.entries(breakdown.oneTime).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between py-1">
                  <span>{currency}:</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              Object.entries(breakdown.subscription[type.id] || {}).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between py-1">
                  <span>{currency}:</span>
                  <span>${Number(amount).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 