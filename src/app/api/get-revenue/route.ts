import { NextResponse } from "next/server";
import { getCurrentMonthRevenue, getMerchantName, getStripeClients, MerchantRevenue, getDailyStats } from "@/services/stripe";
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
      stripeClients.map(async (stripe): Promise<{
        merchantName: string;
        revenue: Record<string, number>;
        dailyStats: any[];
      }> => {
        const [merchantName, revenue, dailyStats] = await Promise.all([
          getMerchantName(stripe),
          getCurrentMonthRevenue(stripe, dateRange),
          getDailyStats(stripe, dateRange, timezone)
        ]);
        return { merchantName, revenue, dailyStats };
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

    return NextResponse.json({ 
      merchants: merchantsData,
      totalRevenue,
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
