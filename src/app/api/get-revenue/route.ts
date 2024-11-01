import { NextResponse } from "next/server";
import { getCurrentMonthRevenue, getMerchantName, getStripeClients, getRevenueBreakdown, getDailyStats } from "@/services/stripe";
import { getDateRange } from "@/utils/currency";
import moment from 'moment-timezone';

export async function GET(request: Request) {
  try {
    const defaultTimezone = process.env.DEFAULT_TIMEZONE || "Asia/Shanghai";
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || defaultTimezone;
    
    const now = moment().tz(timezone);
    const year = parseInt(searchParams.get("year") || now.year().toString());
    const month = parseInt(searchParams.get("month") || now.month().toString());

    const stripeClients = getStripeClients();

    if (stripeClients.length === 0) {
      return NextResponse.json(
        { error: "No Stripe keys configured" },
        { status: 400 }
      );
    }

    const dateRange = getDateRange(timezone, year, month);

    // 并行获取所有数据
    const merchantsData = await Promise.all(
      stripeClients.map(async (stripe) => {
        const [merchantName, revenue, dailyStats, revenueBreakdown] = await Promise.all([
          getMerchantName(stripe),
          getCurrentMonthRevenue(stripe, dateRange),
          getDailyStats(stripe, dateRange, timezone),
          getRevenueBreakdown(stripe, dateRange)
        ]);
        return { merchantName, revenue, dailyStats, revenueBreakdown };
      })
    );

    // 计算总收入
    const totalRevenue: Record<string, number> = {};
    merchantsData.forEach(({ revenue }) => {
      Object.entries(revenue).forEach(([currency, amount]) => {
        totalRevenue[currency] = (totalRevenue[currency] || 0) + amount;
      });
    });

    // 合并每日统计数据
    const dailyTotals = mergeDailyStats(merchantsData.map(m => m.dailyStats));

    // 合并所有商户的收入明细
    const totalBreakdown = {
      oneTime: {} as Record<string, number>,
      subscription: {
        monthly: {} as Record<string, number>,
        annual: {} as Record<string, number>,
      }
    };

    merchantsData.forEach(({ revenueBreakdown }) => {
      // 合并一次性付款
      Object.entries(revenueBreakdown.oneTime).forEach(([currency, amount]) => {
        totalBreakdown.oneTime[currency] = (totalBreakdown.oneTime[currency] || 0) + amount;
      });

      // 合并月付订阅
      Object.entries(revenueBreakdown.subscription.monthly).forEach(([currency, amount]) => {
        totalBreakdown.subscription.monthly[currency] = 
          (totalBreakdown.subscription.monthly[currency] || 0) + amount;
      });

      // 合并年付订阅
      Object.entries(revenueBreakdown.subscription.annual).forEach(([currency, amount]) => {
        totalBreakdown.subscription.annual[currency] = 
          (totalBreakdown.subscription.annual[currency] || 0) + amount;
      });
    });

    return NextResponse.json({ 
      merchants: merchantsData,
      totalRevenue,
      totalBreakdown,
      dailyTotals,
      timezone,
      period: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 }
    );
  }
}

function mergeDailyStats(allDailyStats: any[][]): any[] {
  const mergedStats: Record<string, any> = {};

  allDailyStats.forEach(merchantStats => {
    merchantStats.forEach(dailyStat => {
      if (!mergedStats[dailyStat.date]) {
        mergedStats[dailyStat.date] = {
          date: dailyStat.date,
          orderCount: 0,
          revenue: {},
        };
      }

      // 合并订单数量
      mergedStats[dailyStat.date].orderCount += dailyStat.orderCount;

      // 合并收入
      Object.entries(dailyStat.revenue).forEach(([currency, amount]) => {
        mergedStats[dailyStat.date].revenue[currency] = 
          (mergedStats[dailyStat.date].revenue[currency] || 0) + (amount as number);
      });
    });
  });

  // 将合并后的数据转换为数组并按日期排序
  return Object.values(mergedStats).sort((a, b) => a.date.localeCompare(b.date));
}
