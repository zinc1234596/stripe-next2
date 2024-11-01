import { NextResponse } from "next/server";
import { getCurrentMonthRevenue, getMerchantName, getStripeClients, MerchantRevenue } from "@/services/stripe";
import { getDateRange } from "@/utils/currency";
import moment from 'moment-timezone';

export async function GET(request: Request) {
  try {
    const defaultTimezone = process.env.DEFAULT_TIMEZONE || "Asia/Shanghai";
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || defaultTimezone;
    
    // 获取年月参数，默认为当前年月
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

    // 并行获取所有商户的收入数据
    const merchantsData = await Promise.all(
      stripeClients.map(async (stripe): Promise<MerchantRevenue> => {
        const merchantName = await getMerchantName(stripe);
        const revenue = await getCurrentMonthRevenue(stripe, dateRange);
        return { merchantName, revenue };
      })
    );

    // 计算总收入
    const totalRevenue: Record<string, number> = {};
    merchantsData.forEach(({ revenue }) => {
      Object.entries(revenue).forEach(([currency, amount]) => {
        totalRevenue[currency] = (totalRevenue[currency] || 0) + amount;
      });
    });

    return NextResponse.json({ 
      merchants: merchantsData,
      totalRevenue,
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
