import { NextResponse } from "next/server";
import Stripe from "stripe";
import moment from "moment-timezone";

// 辅助函数：将金额转换为适当的单位
function convertToProperUnits(currency: string, amount: number): number {
  const zeroDenominationCurrencies = ["JPY", "KRW", "VND"];
  const convertedAmount = zeroDenominationCurrencies.includes(currency)
    ? amount
    : amount / 100;
  return Number(convertedAmount.toFixed(2));
}

// 获取收入统计
async function getRevenue(
  stripe: Stripe,
  dateRange: { startDate: Date; endDate: Date }
): Promise<Record<string, number>> {
  const currencyRevenue: Record<string, number> = {};
  
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
      currencyRevenue[currency] = (currencyRevenue[currency] || 0) + charge.amount;
    }
  });

  return Object.fromEntries(
    Object.entries(currencyRevenue).map(([currency, amount]) => [
      currency,
      convertToProperUnits(currency, amount),
    ])
  );
}

// 获取支出统计
async function getPayouts(
  stripe: Stripe,
  dateRange: { startDate: Date; endDate: Date }
): Promise<Record<string, number>> {
  const currencyPayouts: Record<string, number> = {};

  const payouts = await stripe.payouts.list({
    created: {
      gte: Math.floor(dateRange.startDate.getTime() / 1000),
      lte: Math.floor(dateRange.endDate.getTime() / 1000),
    },
    status: "paid",
    limit: 100,
  });

  payouts.data.forEach((payout) => {
    const currency = payout.currency.toUpperCase();
    currencyPayouts[currency] = (currencyPayouts[currency] || 0) + payout.amount;
  });

  return Object.fromEntries(
    Object.entries(currencyPayouts).map(([currency, amount]) => [
      currency,
      convertToProperUnits(currency, amount),
    ])
  );
}

// 获取每日收入
async function getDailyRevenue(
  stripe: Stripe,
  dateRange: { startDate: Date; endDate: Date },
  tz: string
): Promise<Record<string, Record<string, number>>> {
  const dailyRevenue: Record<string, Record<string, number>> = {};
  const startDate = moment(dateRange.startDate).tz(tz).startOf("day");
  const endDate = moment(dateRange.endDate).tz(tz).endOf("day");

  for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, "day")) {
    const dayStart = date.clone().startOf("day");
    const dayEnd = date.clone().endOf("day");
    const dayRevenue = await getRevenue(stripe, {
      startDate: dayStart.toDate(),
      endDate: dayEnd.toDate(),
    });
    dailyRevenue[date.format("YYYY-MM-DD")] = dayRevenue;
  }

  return dailyRevenue;
}

// 获取订阅收入
async function getSubscriptionRevenue(
  stripe: Stripe,
  dateRange: { startDate: Date; endDate: Date }
) {
  const subscriptionRevenue = {
    created: {} as Record<string, number>,
    updated: {} as Record<string, number>,
  };

  const subscriptions = await stripe.subscriptions.list({
    created: {
      lte: Math.floor(dateRange.endDate.getTime() / 1000),
    },
    status: "active",
    limit: 100,
    expand: ["data.latest_invoice"],
  });

  subscriptions.data.forEach((subscription) => {
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    if (!invoice || invoice.created < dateRange.startDate.getTime() / 1000) {
      return;
    }

    const amount = invoice.amount_paid || 0;
    const currency = subscription.currency.toUpperCase();
    
    if (subscription.created >= dateRange.startDate.getTime() / 1000) {
      subscriptionRevenue.created[currency] = (subscriptionRevenue.created[currency] || 0) + 
        convertToProperUnits(currency, amount);
    } else {
      subscriptionRevenue.updated[currency] = (subscriptionRevenue.updated[currency] || 0) + 
        convertToProperUnits(currency, amount);
    }
  });

  return subscriptionRevenue;
}

// 获取订阅类型收入
async function getSubscriptionTypeRevenue(
  stripe: Stripe,
  dateRange: { startDate: Date; endDate: Date }
) {
  const typeRevenue = {
    annual: {} as Record<string, number>,
    monthly: {} as Record<string, number>,
  };

  const subscriptions = await stripe.subscriptions.list({
    created: {
      gte: Math.floor(dateRange.startDate.getTime() / 1000),
      lte: Math.floor(dateRange.endDate.getTime() / 1000),
    },
    limit: 100,
    expand: ["data.latest_invoice"],
  });

  subscriptions.data.forEach((subscription) => {
    const amount = (subscription.latest_invoice as Stripe.Invoice)?.amount_paid || 0;
    const currency = subscription.currency.toUpperCase();
    const interval = subscription.items.data[0]?.plan.interval;

    if (interval === "year") {
      typeRevenue.annual[currency] = (typeRevenue.annual[currency] || 0) + 
        convertToProperUnits(currency, amount);
    } else if (interval === "month") {
      typeRevenue.monthly[currency] = (typeRevenue.monthly[currency] || 0) + 
        convertToProperUnits(currency, amount);
    }
  });

  return typeRevenue;
}

// 获取待处理的订阅
async function getPendingSubscriptions(stripe: Stripe, tz: string) {
  const now = moment().tz(tz);
  const endOfMonth = now.clone().endOf("month");

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    current_period_end: {
      lte: endOfMonth.unix(),
    },
    limit: 100,
  });

  const summary = {
    count: subscriptions.data.length,
    totalAmount: {} as Record<string, number>,
  };

  subscriptions.data.forEach((sub) => {
    const amount = convertToProperUnits(
      sub.currency,
      sub.items.data[0]?.price?.unit_amount || 0
    );
    const currency = sub.currency.toUpperCase();
    summary.totalAmount[currency] = (summary.totalAmount[currency] || 0) + amount;
  });

  return summary;
}

// 获取预估续订收入
async function getEstimatedRenewalRevenue(stripe: Stripe, tz: string) {
  const now = moment().tz(tz);
  const currentMonthEnd = now.clone().endOf("month");
  const nextMonthEnd = now.clone().add(1, "month").endOf("month");

  const currentMonthRenewal = {
    count: 0,
    revenue: {} as Record<string, number>,
  };

  const nextMonthRenewal = {
    count: 0,
    revenue: {} as Record<string, number>,
  };

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  subscriptions.data.forEach((sub) => {
    const renewalDate = moment.unix(sub.current_period_end).tz(tz);
    const amount = sub.items.data[0]?.price?.unit_amount || 0;
    const currency = sub.currency.toUpperCase();
    const convertedAmount = convertToProperUnits(currency, amount);

    if (renewalDate.isSameOrBefore(currentMonthEnd)) {
      currentMonthRenewal.count++;
      currentMonthRenewal.revenue[currency] = 
        (currentMonthRenewal.revenue[currency] || 0) + convertedAmount;
    } else if (renewalDate.isSameOrBefore(nextMonthEnd)) {
      nextMonthRenewal.count++;
      nextMonthRenewal.revenue[currency] = 
        (nextMonthRenewal.revenue[currency] || 0) + convertedAmount;
    }
  });

  return {
    currentMonth: currentMonthRenewal,
    nextMonth: nextMonthRenewal,
  };
}

// 获取汇率数据
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("获取汇率时出错:", error);
    return {};
  }
}

// 转换总收入为多种货币
function convertTotalRevenue(
  totalRevenue: Record<string, number>,
  exchangeRates: Record<string, number>
): Record<string, Record<string, number>> {
  const targetCurrencies = ["USD", "CNY", "HKD"];
  const converted: Record<string, Record<string, number>> = {};

  Object.entries(totalRevenue).forEach(([sourceCurrency, amount]) => {
    converted[sourceCurrency] = {
      [sourceCurrency]: amount,
    };

    targetCurrencies.forEach((targetCurrency) => {
      if (sourceCurrency !== targetCurrency) {
        const rate = exchangeRates[targetCurrency] / exchangeRates[sourceCurrency];
        converted[sourceCurrency][targetCurrency] = Number((amount * rate).toFixed(2));
      }
    });
  });

  return converted;
}

// 转换总支出为人民币
function convertTotalPayoutsToCNY(
  totalPayouts: Record<string, number>,
  exchangeRates: Record<string, number>
): number {
  let totalCNY = 0;
  Object.entries(totalPayouts).forEach(([currency, amount]) => {
    if (currency === "CNY") {
      totalCNY += amount;
    } else {
      const rate = exchangeRates["CNY"] / exchangeRates[currency];
      totalCNY += amount * rate;
    }
  });
  return Number(totalCNY.toFixed(2));
}

export async function POST(request: Request) {
  try {
    const { stripeKey } = await request.json();

    if (!stripeKey) {
      return NextResponse.json({ message: "缺少 Stripe Key" }, { status: 400 });
    }

    // 创建一个 TransformStream 用于流式传输
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // 创建响应
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // 异步处理数据
    (async () => {
      try {
        const stripe = new Stripe(stripeKey);
        const tz = "Asia/Shanghai";
        const now = moment().tz(tz);
        const startDate = now.clone().startOf("month").toDate();
        const endDate = now.clone().endOf("month").toDate();

        // 发送初始状态
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: '开始获取数据...' })}\n\n`));

        // 获取收入数据
        const revenue = await getRevenue(stripe, { startDate, endDate });
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'revenue', data: revenue })}\n\n`));

        // 获取支出数据
        const payouts = await getPayouts(stripe, { startDate, endDate });
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'payouts', data: payouts })}\n\n`));

        // 获取每日收入
        const dailyRevenue = await getDailyRevenue(stripe, { startDate, endDate }, tz);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'dailyRevenue', data: dailyRevenue })}\n\n`));

        // 获取订阅收入
        const subscriptionRevenue = await getSubscriptionRevenue(stripe, { startDate, endDate });
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'subscriptionRevenue', data: subscriptionRevenue })}\n\n`));

        // 获取订阅类型收入
        const subscriptionTypeRevenue = await getSubscriptionTypeRevenue(stripe, { startDate, endDate });
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'subscriptionTypeRevenue', data: subscriptionTypeRevenue })}\n\n`));

        // 获取待处理订阅
        const pendingSubscriptions = await getPendingSubscriptions(stripe, tz);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'pendingSubscriptions', data: pendingSubscriptions })}\n\n`));

        // 获取预估续订收入
        const estimatedRenewal = await getEstimatedRenewalRevenue(stripe, tz);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'estimatedRenewal', data: estimatedRenewal })}\n\n`));

        // 获取汇率数据
        const exchangeRates = await getExchangeRates();
        
        // 转换收入
        const convertedRevenue = convertTotalRevenue(revenue, exchangeRates);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'convertedRevenue', data: convertedRevenue })}\n\n`));

        // 转换支出
        const totalInCNY = convertTotalPayoutsToCNY(payouts, exchangeRates);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'totalInCNY', data: totalInCNY })}\n\n`));

        // 发送完成信号
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
      } catch (error) {
        // 发送错误信息
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '获取数据失败' })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
    return NextResponse.json({ message: "获取收入数据失败" }, { status: 500 });
  }
}
