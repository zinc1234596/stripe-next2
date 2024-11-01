import { NextResponse } from "next/server";
import { getCurrentMonthRevenue, getMerchantName, getStripeClients, getRevenueBreakdown, getDailyStats } from "@/services/stripe";
import { getDateRange } from "@/utils/currency";
import moment from 'moment-timezone';

export const maxDuration = 60; // Set longer timeout duration in seconds

// If using Edge Runtime, you can add:
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const defaultTimezone = process.env.DEFAULT_TIMEZONE || "Asia/Shanghai";
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || defaultTimezone;
    
    const now = moment().tz(timezone);
    const year = parseInt(searchParams.get("year") || now.year().toString());
    const month = parseInt(searchParams.get("month") || (now.month() + 1).toString());

    const stripeClients = getStripeClients();

    if (stripeClients.length === 0) {
      return NextResponse.json(
        { error: "No Stripe keys configured" },
        { status: 400 }
      );
    }

    const dateRange = getDateRange(timezone, year, month);

    // Fetch all data in parallel
    const merchantsData = await Promise.all(
      stripeClients.map(async (stripe) => {
        const [merchantName, revenue, dailyStats, revenueBreakdown] = await Promise.all([
          getMerchantName(stripe),
          getCurrentMonthRevenue(stripe, dateRange).catch(err => {
            console.error(`Error getting revenue for merchant: ${err}`);
            return {};
          }),
          getDailyStats(stripe, dateRange, timezone).catch(err => {
            console.error(`Error getting daily stats: ${err}`);
            return [];
          }),
          getRevenueBreakdown(stripe, dateRange).catch(err => {
            console.error(`Error getting revenue breakdown: ${err}`);
            return { oneTime: {}, subscription: { monthly: {}, annual: {} } };
          })
        ]);
        return { merchantName, revenue, dailyStats, revenueBreakdown };
      })
    );

    // Calculate total revenue - using dailyTotals for accuracy
    const totalRevenue: Record<string, number> = {};
    const dailyTotals = mergeDailyStats(merchantsData.map(m => m.dailyStats));

    // Calculate total revenue through dailyTotals
    dailyTotals.forEach(dailyStat => {
      Object.entries(dailyStat.revenue).forEach(([currency, amount]) => {
        totalRevenue[currency] = (totalRevenue[currency] || 0) + (amount as number);
      });
    });

    // Add validation logs
    console.log('Daily totals:', dailyTotals);
    console.log('Calculated total revenue:', totalRevenue);

    // Merge revenue details from all merchants
    const totalBreakdown = {
      oneTime: {} as Record<string, number>,
      subscription: {
        monthly: {} as Record<string, number>,
        annual: {} as Record<string, number>,
      }
    };

    merchantsData.forEach(({ revenueBreakdown }) => {
      // Merge one-time payments
      Object.entries(revenueBreakdown.oneTime).forEach(([currency, amount]) => {
        totalBreakdown.oneTime[currency] = (totalBreakdown.oneTime[currency] || 0) + amount;
      });

      // Merge monthly subscriptions
      Object.entries(revenueBreakdown.subscription.monthly).forEach(([currency, amount]) => {
        totalBreakdown.subscription.monthly[currency] = 
          (totalBreakdown.subscription.monthly[currency] || 0) + amount;
      });

      // Merge annual subscriptions
      Object.entries(revenueBreakdown.subscription.annual).forEach(([currency, amount]) => {
        totalBreakdown.subscription.annual[currency] = 
          (totalBreakdown.subscription.annual[currency] || 0) + amount;
      });
    });

    console.log('Revenue data:', {
      totalRevenue,
      merchantCount: merchantsData.length,
      period: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString(),
      }
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

      // Merge order count
      mergedStats[dailyStat.date].orderCount += dailyStat.orderCount;

      // Merge revenue
      Object.entries(dailyStat.revenue).forEach(([currency, amount]) => {
        mergedStats[dailyStat.date].revenue[currency] = 
          (mergedStats[dailyStat.date].revenue[currency] || 0) + (amount as number);
      });
    });
  });

  // Convert merged data to array and sort by date
  return Object.values(mergedStats).sort((a, b) => a.date.localeCompare(b.date));
}
