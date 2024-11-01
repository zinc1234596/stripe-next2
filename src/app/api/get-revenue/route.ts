import { NextResponse } from "next/server";
import { getCurrentMonthRevenue, getMerchantName, getStripeClients, MerchantRevenue } from "@/services/stripe";
import { getCurrentMonthDateRange } from "@/utils/currency";

export async function GET(request: Request) {
  try {
    const defaultTimezone = process.env.DEFAULT_TIMEZONE || "Asia/Shanghai";
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || defaultTimezone;

    // 获取所有 Stripe 客户端
    const stripeClients = getStripeClients();

    if (stripeClients.length === 0) {
      return NextResponse.json(
        { error: "No Stripe keys configured" },
        { status: 400 }
      );
    }

    const dateRange = getCurrentMonthDateRange(timezone);

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
