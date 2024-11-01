import moment from 'moment-timezone';

// Currency-related utility functions
export function convertToProperUnits(currency: string, amount: number): number {
  const zeroDenominationCurrencies = ["JPY", "KRW", "VND"];
  const convertedAmount = zeroDenominationCurrencies.includes(currency)
    ? amount
    : amount / 100;
  return Number(convertedAmount.toFixed(2));
}

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export function getCurrentMonthDateRange(timezone: string): DateRange {
  const now = moment().tz(timezone);
  return {
    startDate: now.clone().startOf("month").toDate(),
    endDate: now.clone().endOf("month").toDate(),
  };
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return {};
  }
}

export function convertTotalRevenue(
  totalRevenue: Record<string, number>,
  exchangeRates: Record<string, number>
): Record<string, Record<string, number>> {
  const targetCurrencies = ["USD", "CNY", "HKD"];
  const converted: Record<string, Record<string, number>> = {};

  Object.entries(totalRevenue).forEach(([sourceCurrency, amount]) => {
    converted[sourceCurrency] = {
      [sourceCurrency]: amount,
    };

    targetCurrencies.forEach((targetCurrency) => {
      if (sourceCurrency !== targetCurrency) {
        const rate = exchangeRates[targetCurrency] / exchangeRates[sourceCurrency];
        converted[sourceCurrency][targetCurrency] = Number((amount * rate).toFixed(2));
      }
    });
  });

  return converted;
}

export function convertTotalPayoutsToCNY(
  totalPayouts: Record<string, number>,
  exchangeRates: Record<string, number>
): number {
  let totalCNY = 0;
  Object.entries(totalPayouts).forEach(([currency, amount]) => {
    if (currency === "CNY") {
      totalCNY += amount;
    } else {
      const rate = exchangeRates["CNY"] / exchangeRates[currency];
      totalCNY += amount * rate;
    }
  });
  return Number(totalCNY.toFixed(2));
}

export function getDateRange(timezone: string, year: number, month: number): DateRange {
  const date = moment().tz(timezone).year(year).month(month);
  return {
    startDate: date.clone().startOf("month").toDate(),
    endDate: date.clone().endOf("month").toDate(),
  };
}

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

// Get exchange rate data
export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    const data: ExchangeRateResponse = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return {};
  }
}

// Convert currency amount
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates[fromCurrency] || !rates[toCurrency]) return amount;

  const amountInUSD = amount / rates[fromCurrency];
  return Number((amountInUSD * rates[toCurrency]).toFixed(2));
}

// Convert revenue records to specified currency
export function convertRevenue(
  revenue: Record<string, number>,
  targetCurrency: string,
  rates: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  result[targetCurrency] = Object.entries(revenue).reduce((total, [currency, amount]) => {
    return total + convertCurrency(amount, currency, targetCurrency, rates);
  }, 0);
  return result;
}

// Merge multiple revenue records and convert to specified currency
export function mergeAndConvertRevenues(
  revenues: Record<string, number>[],
  targetCurrency: string,
  rates: Record<string, number>
): Record<string, number> {
  const merged = revenues.reduce((total, current) => {
    Object.entries(current).forEach(([currency, amount]) => {
      if (!total[currency]) total[currency] = 0;
      total[currency] += amount;
    });
    return total;
  }, {} as Record<string, number>);

  return convertRevenue(merged, targetCurrency, rates);
} 