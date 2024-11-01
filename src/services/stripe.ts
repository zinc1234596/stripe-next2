import Stripe from "stripe";
import { convertToProperUnits, DateRange } from "@/utils/currency";

export async function getCurrentMonthRevenue(
  stripe: Stripe, 
  dateRange: DateRange
) {
  const revenue: Record<string, number> = {};
  
  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(dateRange.startDate.getTime() / 1000),
      lte: Math.floor(dateRange.endDate.getTime() / 1000),
    },
    limit: 100,
  });

  charges.data.forEach((charge) => {
    if (charge.status === "succeeded" && !charge.refunded) {
      const currency = charge.currency.toUpperCase();
      revenue[currency] = (revenue[currency] || 0) + charge.amount;
    }
  });

  return Object.fromEntries(
    Object.entries(revenue).map(([currency, amount]) => [
      currency,
      convertToProperUnits(currency, amount),
    ])
  );
}

// ... 其他 Stripe 相关函数 