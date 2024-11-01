import Stripe from "stripe";
import { convertToProperUnits, DateRange } from "@/utils/currency";

export interface MerchantRevenue {
  merchantName: string;
  revenue: Record<string, number>;
}

export async function getMerchantName(stripe: Stripe): Promise<string> {
  try {
    const account = await stripe.accounts.retrieve();
    return account.settings?.dashboard?.display_name || 
           account.business_profile?.name || 
           'Unknown Merchant';
  } catch (error) {
    console.error('Error fetching merchant name:', error);
    return 'Unknown Merchant';
  }
}

export async function getCurrentMonthRevenue(
  stripe: Stripe, 
  dateRange: DateRange
): Promise<Record<string, number>> {
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

export function getStripeClients(): Stripe[] {
  const stripeClients: Stripe[] = [];
  let index = 1;

  while (true) {
    const key = process.env[`STRIPE_SECRET_KEY_${index}`];
    if (!key) break;
    
    stripeClients.push(new Stripe(key));
    index++;
  }

  return stripeClients;
}

// ... 其他 Stripe 相关函数 