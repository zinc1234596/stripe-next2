import moment from 'moment-timezone';

// 处理货币相关的工具函数
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