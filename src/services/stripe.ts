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
  
  const charges = await parallelPaginatedList(
    (params) => stripe.charges.list(params),
    {
      created: {
        gte: Math.floor(dateRange.startDate.getTime() / 1000),
        lte: Math.floor(dateRange.endDate.getTime() / 1000),
      }
    }
  );

  charges.forEach((charge) => {
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

  const charges = await parallelPaginatedList(
    (params) => stripe.charges.list(params),
    {
      created: {
        gte: Math.floor(dateRange.startDate.getTime() / 1000),
        lte: Math.floor(dateRange.endDate.getTime() / 1000),
      }
    }
  );

  charges.forEach((charge) => {
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

  const charges = await parallelPaginatedList(
    (params) => stripe.charges.list(params),
    {
      created: {
        gte: Math.floor(dateRange.startDate.getTime() / 1000),
        lte: Math.floor(dateRange.endDate.getTime() / 1000),
      },
      expand: ['data.invoice']
    }
  );

  // 收集所有需要查询的订阅ID
  const subscriptionIds = new Set<string>();
  charges.forEach(charge => {
    const invoice = charge.invoice as Stripe.Invoice;
    if (invoice?.subscription) {
      subscriptionIds.add(invoice.subscription as string);
    }
  });

  // 并行获取所有订阅信息
  const subscriptions = await Promise.all(
    Array.from(subscriptionIds).map(id => 
      stripe.subscriptions.retrieve(id).catch(() => null)
    )
  );

  // 创建订阅查找映射
  const subscriptionMap = new Map(
    subscriptions
      .filter(Boolean)
      .map(sub => [sub!.id, sub])
  );

  // 处理所有 charges
  for (const charge of charges) {
    if (charge.status !== "succeeded" || charge.refunded) continue;

    const currency = charge.currency.toUpperCase();
    const amount = convertToProperUnits(currency, charge.amount);

    const invoice = charge.invoice as Stripe.Invoice;
    if (invoice?.subscription) {
      const subscription = subscriptionMap.get(invoice.subscription as string);
      if (subscription) {
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        const intervalCount = subscription.items.data[0]?.price?.recurring?.interval_count || 1;
        const fullInterval = intervalCount > 1 ? `${intervalCount}-${interval}` : interval;
        const paymentType = getPaymentTypeByInterval(fullInterval);

        if (paymentType && paymentType.id !== 'oneTime') {
          breakdown.subscription[paymentType.id][currency] = 
            (breakdown.subscription[paymentType.id][currency] || 0) + amount;
        }
      }
    } else {
      breakdown.oneTime[currency] = (breakdown.oneTime[currency] || 0) + amount;
    }
  }

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

// 添加一个通用的并行分页函数
async function parallelPaginatedList<T>(
  listFn: (params: any) => Promise<Stripe.ApiList<T>>,
  params: any,
  maxParallelRequests = 10
): Promise<T[]> {
  // 首先获取第一页来得到总数
  const firstPage = await listFn({ ...params, limit: 100 });
  // @ts-ignore
  const totalPages = Math.ceil(firstPage.total_count! / 100);
  
  // 创建所有页面的请求数组
  const pagePromises: Promise<Stripe.ApiList<T>>[] = [Promise.resolve(firstPage)];
  
  // 并行请求其他页面
  for (let i = 1; i < totalPages; i++) {
    pagePromises.push(
      listFn({
        ...params,
        limit: 100,
        // @ts-ignore
        starting_after: firstPage.data[(i - 1) * 100]?.id
      })
    );
    
    // 控制并发数
    if (pagePromises.length >= maxParallelRequests) {
      await Promise.all(pagePromises);
    }
  }

  const results = await Promise.all(pagePromises);
  return results.flatMap(result => result.data);
}

// ... 其他 Stripe 相关函数 