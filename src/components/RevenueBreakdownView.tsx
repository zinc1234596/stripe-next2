import { RevenueBreakdown } from "@/services/stripe";
import { PAYMENT_TYPES } from "@/config/paymentTypes";

interface RevenueBreakdownViewProps {
  breakdown: RevenueBreakdown;
  compact?: boolean;
}

export function RevenueBreakdownView({ breakdown, compact = false }: RevenueBreakdownViewProps) {
  // 检查某个付款类型是否有数据
  const hasDataForPaymentType = (typeId: string) => {
    if (typeId === 'oneTime') {
      return Object.keys(breakdown.oneTime).length > 0;
    }
    return Object.keys(breakdown.subscription[typeId] || {}).length > 0;
  };

  // 获取所有有数据的付款类型
  const activeTypes = PAYMENT_TYPES.filter(type => hasDataForPaymentType(type.id));

  // 渲染付款类型的内容
  const renderPaymentTypeContent = (type: typeof PAYMENT_TYPES[0]) => {
    const data = type.id === 'oneTime' 
      ? breakdown.oneTime 
      : breakdown.subscription[type.id] || {};

    return Object.entries(data).map(([currency, amount]) => (
      <div key={currency} className="flex justify-between py-1">
        <span className="text-gray-600">{currency}:</span>
        <span className="font-medium">${Number(amount).toFixed(2)}</span>
      </div>
    ));
  };

  if (compact) {
    // 紧凑模式的布局
    return (
      <div className="space-y-3">
        {activeTypes.map(type => (
          <div key={type.id} className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs font-medium text-gray-600 mb-1">{type.name}</div>
            <div className="text-xs space-y-1">
              {renderPaymentTypeContent(type)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 常规模式的布局（用于总览）
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {activeTypes.map(type => (
          <div key={type.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">{type.name}</h3>
            {renderPaymentTypeContent(type)}
          </div>
        ))}
      </div>
    </div>
  );
} 