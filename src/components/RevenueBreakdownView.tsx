import { RevenueBreakdown } from "@/services/stripe";
import { PAYMENT_TYPES } from "@/config/paymentTypes";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRef, useState, useEffect } from 'react';

interface RevenueBreakdownViewProps {
  breakdown: RevenueBreakdown;
  isOverview?: boolean;
}

export function RevenueBreakdownView({ breakdown, isOverview = false }: RevenueBreakdownViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // 检查某个付款类型是否有数据
  const hasDataForPaymentType = (typeId: string) => {
    if (typeId === 'oneTime') {
      return Object.keys(breakdown.oneTime).length > 0;
    }
    return Object.keys(breakdown.subscription[typeId] || {}).length > 0;
  };

  // 获取所有有数据的付款类型
  const activeTypes = PAYMENT_TYPES.filter(type => hasDataForPaymentType(type.id));

  // 检查滚动按钮的显示状态
  const checkScroll = () => {
    if (isOverview) return;
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setShowScrollButtons(hasOverflow);
      setShowLeftButton(container.scrollLeft > 0);
      setShowRightButton(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  useEffect(() => {
    if (!isOverview) {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [breakdown, isOverview]);

  // 处理滚动
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth / 2;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 监听滚动事件
  const handleScrollEvent = () => {
    if (!isOverview) {
      checkScroll();
    }
  };

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

  if (isOverview) {
    // 总览模式：竖直排列
    return (
      <div className="grid grid-cols-1 gap-4">
        {activeTypes.map(type => (
          <div 
            key={type.id} 
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="text-sm font-medium text-gray-700 mb-2">{type.name}</div>
            <div className="space-y-2">
              {renderPaymentTypeContent(type)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 商户卡片模式：水平滚动
  return (
    <div className="relative">
      {showScrollButtons && showLeftButton && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
        >
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>
      )}
      
      {showScrollButtons && showRightButton && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScrollEvent}
        className="flex overflow-x-auto scrollbar-hide gap-2 relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {activeTypes.map(type => (
          <div 
            key={type.id} 
            className="flex-none w-[200px] bg-gray-50 rounded-lg p-2"
          >
            <div className="text-xs font-medium text-gray-600 mb-1">{type.name}</div>
            <div className="text-xs space-y-1">
              {renderPaymentTypeContent(type)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 