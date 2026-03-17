export type UserRole = 'treasurer' | 'counter' | 'pastor';
export type OfferingStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  church_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Church {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Denomination {
  id: string;
  offering_id: string;
  note_500: number;
  note_200: number;
  note_100: number;
  note_50: number;
  note_20: number;
  note_10: number;
  total_notes: number;
}

export interface Offering {
  id: string;
  church_id: string;
  date: string;
  total_amount: number;
  status: OfferingStatus;
  counted_by_user_id: string;
  verified_by_user_id: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  denominations?: Denomination;
  counted_by?: Profile;
  verified_by?: Profile;
}

export interface DenominationInput {
  value: number;
  label: string;
  count: number;
  field: keyof Pick<Denomination, 'note_500' | 'note_200' | 'note_100' | 'note_50' | 'note_20' | 'note_10'>;
}

export const DENOMINATIONS: Omit<DenominationInput, 'count'>[] = [
  { value: 500, label: '₹500', field: 'note_500' },
  { value: 200, label: '₹200', field: 'note_200' },
  { value: 100, label: '₹100', field: 'note_100' },
  { value: 50, label: '₹50', field: 'note_50' },
  { value: 20, label: '₹20', field: 'note_20' },
  { value: 10, label: '₹10', field: 'note_10' },
];

export type ExpenseCategory =
  | 'Utilities'
  | 'Staff & Salaries'
  | 'Maintenance'
  | 'Ministry'
  | 'Charity / Outreach'
  | 'Supplies'
  | 'Events'
  | 'Miscellaneous';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface Expense {
  id: string;
  church_id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities',
  'Staff & Salaries',
  'Maintenance',
  'Ministry',
  'Charity / Outreach',
  'Supplies',
  'Events',
  'Miscellaneous',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
];
