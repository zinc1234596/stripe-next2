export interface PaymentType {
  id: string;
  name: string;
  description: string;
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
    description: 'Monthly recurring payments'
  },
  {
    id: 'annual',
    name: 'Annual Subscription',
    description: 'Annual recurring payments'
  }
];

export const DEFAULT_PAYMENT_TYPE = 'oneTime'; 