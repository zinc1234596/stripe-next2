export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  HKD: 'HK$',
  // Add more currency symbols as needed
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

// Format currency amount
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  
  // Special handling for certain currency display formats
  switch (currency) {
    case 'JPY':
      return `${symbol}${Math.round(amount)}`; // JPY doesn't show decimal points
    case 'HKD':
      return `${symbol}${amount.toFixed(2)}`; // HKD symbol appears in front
    default:
      return `${symbol}${amount.toFixed(2)}`;
  }
} 