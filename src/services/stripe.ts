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

export interface AnalyticsData {
  date: string;
  revenue: number;
  orderCount: number;
  cumulativeRevenue: number;
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

// 添加新的接口定义
interface TimeSlice {
  start: number;
  end: number;
}

// 添加时间分片函数
function createTimeSlices(startDate: Date, endDate: Date, sliceCount: number = 4): TimeSlice[] {
  const totalTime = endDate.getTime() - startDate.getTime();
  const sliceSize = Math.floor(totalTime / sliceCount);
  
  return Array.from({ length: sliceCount }, (_, i) => ({
    start: Math.floor((startDate.getTime() + (sliceSize * i)) / 1000),
    end: Math.floor((startDate.getTime() + (sliceSize * (i + 1))) / 1000)
  }));
}

// 修改 getDailyStats 函数，支持并行请求
export async function getDailyStats(
  stripe: Stripe,
  dateRange: DateRange,
  timezone: string
): Promise<DailyStats[]> {
  const dailyStats: Record<string, DailyStats> = {};
  
  // 初始化每日数据
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

  // 创建时间分片
  const timeSlices = createTimeSlices(dateRange.startDate, dateRange.endDate);
  
  // 并行请求每个时间分片的数据
  const slicePromises = timeSlices.map(async (slice) => {
    const chargesBySlice: Stripe.Charge[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const charges = await stripe.charges.list({
        created: {
          gte: slice.start,
          lte: slice.end,
        },
        limit: 100,
        starting_after: startingAfter,
      });

      chargesBySlice.push(...charges.data);
      hasMore = charges.has_more;
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    return chargesBySlice;
  });

  // 等待所有分片数据获取完成
  const allCharges = (await Promise.all(slicePromises)).flat();

  // 处理获取到的数据
  allCharges.forEach((charge) => {
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

  return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
}

// 同样修改 getRevenueBreakdown 函数
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

  const timeSlices = createTimeSlices(dateRange.startDate, dateRange.endDate);
  
  const slicePromises = timeSlices.map(async (slice) => {
    const chargesBySlice: Array<{charge: Stripe.Charge, subscription?: Stripe.Subscription}> = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const charges = await stripe.charges.list({
        created: {
          gte: slice.start,
          lte: slice.end,
        },
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.invoice'],
      });

      // 并行获取订阅信息
      const chargesWithSubs = await Promise.all(
        charges.data.map(async (charge) => {
          const invoice = charge.invoice as Stripe.Invoice;
          let subscription: Stripe.Subscription | undefined;
          
          if (invoice && invoice.subscription) {
            subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          }
          
          return { charge, subscription };
        })
      );

      chargesBySlice.push(...chargesWithSubs);
      hasMore = charges.has_more;
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    return chargesBySlice;
  });

  const allCharges = (await Promise.all(slicePromises)).flat();

  // 处理所有数据
  allCharges.forEach(({charge, subscription}) => {
    if (charge.status !== "succeeded" || charge.refunded) return;

    const currency = charge.currency.toUpperCase();
    const amount = convertToProperUnits(currency, charge.amount);

    if (subscription) {
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const intervalCount = subscription.items.data[0]?.price?.recurring?.interval_count || 1;
      const fullInterval = intervalCount > 1 ? `${intervalCount}-${interval}` : interval;
      const paymentType = getPaymentTypeByInterval(fullInterval);

      if (paymentType && paymentType.id !== 'oneTime') {
        breakdown.subscription[paymentType.id][currency] = 
          (breakdown.subscription[paymentType.id][currency] || 0) + amount;
      }
    } else {
      breakdown.oneTime[currency] = (breakdown.oneTime[currency] || 0) + amount;
    }
  });

  return breakdown;
}

export async function getAnalyticsData(stripe: Stripe, startDate: Date, endDate: Date): Promise<AnalyticsData[]> {
  const payments = await stripe.paymentIntents.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    },
    limit: 100,
  });

  // 按日期组织数据
  const dailyData: { [key: string]: AnalyticsData } = {};
  let cumulativeRevenue = 0;

  payments.data.forEach((payment) => {
    const date = new Date(payment.created * 1000).toISOString().split('T')[0];
    
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        revenue: 0,
        orderCount: 0,
        cumulativeRevenue: 0,
      };
    }

    if (payment.status === 'succeeded') {
      dailyData[date].revenue += payment.amount / 100;
      dailyData[date].orderCount += 1;
    }
  });

  // 计算累计收入
  const sortedDates = Object.keys(dailyData).sort();
  sortedDates.forEach((date) => {
    cumulativeRevenue += dailyData[date].revenue;
    dailyData[date].cumulativeRevenue = cumulativeRevenue;
  });

  return Object.values(dailyData);
}

// ... 其他 Stripe 相关函数 