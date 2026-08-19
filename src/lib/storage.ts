import type { Category, Expense, SavingsGoal } from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';

const EXPENSES_KEY = 'budget-tracker:expenses';
const CATEGORIES_KEY = 'budget-tracker:categories';
const THEME_KEY = 'budget-tracker:theme';
const CURRENCY_KEY = 'budget-tracker:currency';
const SAVINGS_GOALS_KEY = 'budget-tracker:savings-goals';
const ONBOARDED_KEY = 'budget-tracker:onboarded';
const NOTIFICATIONS_ENABLED_KEY = 'budget-tracker:notifications-enabled';
const LAST_NOTIFIED_KEY = 'budget-tracker:last-notified';

export type ThemePreference = 'system' | 'light' | 'dark';

export function loadThemePreference(): ThemePreference {
  const raw = localStorage.getItem(THEME_KEY);
  return raw === 'light' || raw === 'dark' ? raw : 'system';
}

export function saveThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadCurrency(): string {
  return localStorage.getItem(CURRENCY_KEY) ?? 'EUR';
}

export function saveCurrency(currency: string): void {
  localStorage.setItem(CURRENCY_KEY, currency);
}

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Expense[];
    // Migration: expenses saved before income tracking have no `type`.
    return parsed.map((expense) => ({ ...expense, type: expense.type ?? 'depense' }));
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw) as Category[];
    // Migration: categories saved before income tracking have no `kind`.
    const migrated = parsed.map((category) => ({ ...category, kind: category.kind ?? 'depense' }));
    // Merge in default categories (e.g. income ones) missing from older saves.
    const existingIds = new Set(migrated.map((c) => c.id));
    const missingDefaults = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
    return [...migrated, ...missingDefaults];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(SAVINGS_GOALS_KEY);
    return raw ? (JSON.parse(raw) as SavingsGoal[]) : [];
  } catch {
    return [];
  }
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

export function loadNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === '1';
}

export function saveNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? '1' : '0');
}

export function loadLastNotifiedDate(): string | null {
  return localStorage.getItem(LAST_NOTIFIED_KEY);
}

export function saveLastNotifiedDate(date: string): void {
  localStorage.setItem(LAST_NOTIFIED_KEY, date);
}
