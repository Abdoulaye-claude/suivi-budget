export type ExpenseStatus = 'reel' | 'prevu';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  date: string; // ISO 'yyyy-MM-dd'
  amount: number;
  categoryId: string;
  description: string;
  status: ExpenseStatus;
  recurrenceId?: string;
}
