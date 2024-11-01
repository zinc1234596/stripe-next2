export interface PaymentType {
  id: string;
  name: string;
  description: string;
  interval?: string;  // stripe subscription interval
}

export const PAYMENT_TYPES: PaymentType[] = [
  {
    id: 'oneTime',
    name: 'One-Time Payment',
    description: 'Single payment transactions'
  },
  {
    id: 'monthly',
    name: 'Monthly Subscription',
    description: 'Monthly recurring payments',
    interval: 'month'
  },
  {
    id: 'quarterly',
    name: 'Quarterly Subscription',
    description: 'Quarterly recurring payments',
    interval: '3-month'
  },
  {
    id: 'semiannual',
    name: 'Semi-Annual Subscription',
    description: '6-month recurring payments',
    interval: '6-month'
  },
  {
    id: 'annual',
    name: 'Annual Subscription',
    description: 'Annual recurring payments',
    interval: 'year'
  }
];

// Helper function: Get payment type by interval
export function getPaymentTypeByInterval(interval?: string): PaymentType | undefined {
  if (!interval) return PAYMENT_TYPES[0]; // oneTime
  return PAYMENT_TYPES.find(type => type.interval === interval);
}

// Helper function: Get all subscription type IDs
export function getSubscriptionTypeIds(): string[] {
  return PAYMENT_TYPES.filter(type => type.interval).map(type => type.id);
}

export const DEFAULT_PAYMENT_TYPE = 'oneTime'; 