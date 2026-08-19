export type ExpenseStatus = 'reel' | 'prevu';
export type ExpenseType = 'depense' | 'revenu';

export interface Category {
  id: string;
  name: string;
  color: string;
  kind: ExpenseType;
  budget?: number;
}

export interface Expense {
  id: string;
  date: string; // ISO 'yyyy-MM-dd'
  amount: number;
  categoryId: string;
  description: string;
  status: ExpenseStatus;
  type: ExpenseType;
  recurrenceId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}
