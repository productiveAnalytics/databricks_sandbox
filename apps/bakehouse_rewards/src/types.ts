// Type definitions for Bakehouse Rewards App

export interface Customer {
  customerID: number;
  customer_name: string;
  email_address: string;
  points_available: number;
  total_spend: number;
  transaction_count: number;
  last_purchase_date: string;
}

export interface Reward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  icon: string;
}

export interface Redemption {
  redemption_id: number;
  customer_id: number;
  reward_name: string;
  points_redeemed: number;
  redeemed_at: string;
}

export interface Transaction {
  transactionID: number;
  product: string;
  quantity: number;
  totalPrice: number;
  dateTime: string;
}

export const REWARDS: Reward[] = [
  {
    id: 'croissant',
    name: 'Free Croissant',
    points_required: 50,
    description: 'Enjoy a freshly baked croissant on us',
    icon: '🥐'
  },
  {
    id: 'coffee',
    name: 'Free Coffee',
    points_required: 30,
    description: 'Perfect espresso or your favorite brew',
    icon: '☕'
  },
  {
    id: 'pastry-box',
    name: 'Pastry Box',
    points_required: 100,
    description: 'A selection of our finest pastries',
    icon: '🧺'
  }
];
