import Stripe from "stripe";
import moment from "moment-timezone";
import { convertToProperUnits } from "@/utils/currency";

export async function getSubscriptionRevenue(
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

export async function getSubscriptionTypeRevenue(
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
    expand: ["data.latest_invoice", "data.items.data.price"],
  });

  subscriptions.data.forEach((subscription) => {
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    if (!invoice) return;

    const amount = invoice.amount_paid || 0;
    const currency = subscription.currency.toUpperCase();
    const interval = subscription.items.data[0]?.price?.recurring?.interval;

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

export async function getPendingSubscriptions(stripe: Stripe, tz: string) {
  const now = moment().tz(tz);
  const endOfMonth = now.clone().endOf("month");

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    current_period_end: {
      lte: endOfMonth.unix(),
    },
    expand: ["data.items.data.price"],
    limit: 100,
  });

  const summary = {
    count: 0,
    totalAmount: {} as Record<string, number>,
  };

  subscriptions.data.forEach((subscription) => {
    const amount = subscription.items.data[0]?.price?.unit_amount || 0;
    const currency = subscription.currency.toUpperCase();
    
    summary.count++;
    summary.totalAmount[currency] = (summary.totalAmount[currency] || 0) + 
      convertToProperUnits(currency, amount);
  });

  // Round all amounts to 2 decimal places
  Object.keys(summary.totalAmount).forEach((currency) => {
    summary.totalAmount[currency] = Number(summary.totalAmount[currency].toFixed(2));
  });

  return summary;
}

export async function getEstimatedRenewalRevenue(stripe: Stripe, tz: string) {
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

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    });

    subscriptions.data.forEach((subscription) => {
      const renewalDate = moment.unix(subscription.current_period_end).tz(tz);
      const amount = subscription.items.data[0]?.price?.unit_amount || 0;
      const currency = subscription.currency.toUpperCase();
      const convertedAmount = convertToProperUnits(currency, amount);

      if (renewalDate.isSameOrBefore(currentMonthEnd)) {
        currentMonthRenewal.count++;
        currentMonthRenewal.revenue[currency] = (currentMonthRenewal.revenue[currency] || 0) + 
          convertedAmount;
      } else if (renewalDate.isSameOrBefore(nextMonthEnd)) {
        nextMonthRenewal.count++;
        nextMonthRenewal.revenue[currency] = (nextMonthRenewal.revenue[currency] || 0) + 
          convertedAmount;
      }
    });

    hasMore = subscriptions.has_more;
    if (hasMore && subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  // Round all amounts to 2 decimal places
  Object.keys(currentMonthRenewal.revenue).forEach((currency) => {
    currentMonthRenewal.revenue[currency] = Number(
      currentMonthRenewal.revenue[currency].toFixed(2)
    );
  });

  Object.keys(nextMonthRenewal.revenue).forEach((currency) => {
    nextMonthRenewal.revenue[currency] = Number(
      nextMonthRenewal.revenue[currency].toFixed(2)
    );
  });

  return {
    currentMonth: currentMonthRenewal,
    nextMonth: nextMonthRenewal,
  };
}

// Helper function
function roundAmounts(amounts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(amounts).map(([currency, amount]) => [
      currency,
      Number(amount.toFixed(2)),
    ])
  );
} 