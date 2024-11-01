import Stripe from "stripe";
import { convertToProperUnits, DateRange } from "@/utils/currency";
import moment from "moment-timezone";
import { getPaymentTypeByInterval, PAYMENT_TYPES } from "@/config/paymentTypes";

export interface MerchantRevenue {
  merchantName: string;
  revenue: Record<string, number>;
}

export interface DailyStats {
  date: string;
  orderCount: number;
  revenue: Record<string, number>;
}

export interface RevenueBreakdown {
  oneTime: Record<string, number>;
  subscription: {
    [key: string]: Record<string, number>;
  };
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

export async function getDailyStats(
  stripe: Stripe,
  dateRange: DateRange,
  timezone: string
): Promise<DailyStats[]> {
  const dailyStats: Record<string, DailyStats> = {};
  
  // 初始化每一天的数据
  const startDate = moment(dateRange.startDate).tz(timezone);
  const endDate = moment(dateRange.endDate).tz(timezone);
  
  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    const dateStr = date.format('YYYY-MM-DD');
    dailyStats[dateStr] = {
      date: dateStr,
      orderCount: 0,
      revenue: {},
    };
  }

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(dateRange.startDate.getTime() / 1000),
        lte: Math.floor(dateRange.endDate.getTime() / 1000),
      },
      limit: 100,
      starting_after: startingAfter,
    });

    charges.data.forEach((charge) => {
      if (charge.status === "succeeded" && !charge.refunded) {
        const chargeDate = moment.unix(charge.created).tz(timezone).format('YYYY-MM-DD');
        const currency = charge.currency.toUpperCase();
        const amount = convertToProperUnits(currency, charge.amount);

        if (dailyStats[chargeDate]) {
          dailyStats[chargeDate].orderCount++;
          dailyStats[chargeDate].revenue[currency] = 
            (dailyStats[chargeDate].revenue[currency] || 0) + amount;
        }
      }
    });

    hasMore = charges.has_more;
    if (hasMore && charges.data.length > 0) {
      startingAfter = charges.data[charges.data.length - 1].id;
    }
  }

  // 将对象转换为数组并按日期排序
  return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRevenueBreakdown(
  stripe: Stripe,
  dateRange: DateRange
): Promise<RevenueBreakdown> {
  const breakdown: RevenueBreakdown = {
    oneTime: {},
    subscription: PAYMENT_TYPES.reduce((acc, type) => {
      if (type.interval) {
        acc[type.id] = {};
      }
      return acc;
    }, {} as Record<string, Record<string, number>>)
  };

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(dateRange.startDate.getTime() / 1000),
        lte: Math.floor(dateRange.endDate.getTime() / 1000),
      },
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.invoice'],
    });

    for (const charge of charges.data) {
      if (charge.status !== "succeeded" || charge.refunded) continue;

      const currency = charge.currency.toUpperCase();
      const amount = convertToProperUnits(currency, charge.amount);

      // 检查是否是订阅付款
      const invoice = charge.invoice as Stripe.Invoice;
      if (invoice && invoice.subscription) {
        // 获取订阅详情
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        const intervalCount = subscription.items.data[0]?.price?.recurring?.interval_count || 1;
        
        // 构建完整的 interval 字符串
        const fullInterval = intervalCount > 1 ? `${intervalCount}-${interval}` : interval;
        const paymentType = getPaymentTypeByInterval(fullInterval);

        if (paymentType && paymentType.id !== 'oneTime') {
          breakdown.subscription[paymentType.id][currency] = 
            (breakdown.subscription[paymentType.id][currency] || 0) + amount;
        }
      } else {
        // 一次性付款
        breakdown.oneTime[currency] = (breakdown.oneTime[currency] || 0) + amount;
      }
    }

    hasMore = charges.has_more;
    if (hasMore && charges.data.length > 0) {
      startingAfter = charges.data[charges.data.length - 1].id;
    }
  }

  return breakdown;
}

// ... 其他 Stripe 相关函数 