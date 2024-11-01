import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentMonthRevenue } from "@/services/stripe";
import { getCurrentMonthDateRange } from "@/utils/currency";

export async function GET(request: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const defaultTimezone = process.env.DEFAULT_TIMEZONE || "Asia/Shanghai";

    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe key not configured" },
        { status: 400 }
      );
    }

    // 从 URL 参数获取时区，如果没有则使用默认时区
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || defaultTimezone;

    const stripe = new Stripe(stripeKey);
    const dateRange = getCurrentMonthDateRange(timezone);

    const revenue = await getCurrentMonthRevenue(stripe, dateRange);

    return NextResponse.json({ 
      revenue,
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
