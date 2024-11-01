export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  HKD: 'HK$',
  // 可以继续添加其他货币符号
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

// 格式化货币金额
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  
  // 特殊处理某些货币的显示方式
  switch (currency) {
    case 'JPY':
      return `${symbol}${Math.round(amount)}`; // JPY 不显示小数点
    case 'HKD':
      return `${symbol}${amount.toFixed(2)}`; // HKD 显示在前面
    default:
      return `${symbol}${amount.toFixed(2)}`;
  }
} 