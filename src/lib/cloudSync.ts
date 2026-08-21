import { supabase } from './supabaseClient';
import { loadSyncedAccountId, saveSyncedAccountId, type ThemePreference } from './storage';
import type { Category, Expense, SavingsGoal } from '../types';

export type CloudTable = 'categories' | 'expenses' | 'savings_goals' | 'settings';

export interface CloudSettings {
  currency: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
}

export interface LocalSnapshot {
  expenses: Expense[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  currency: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
}

export interface CloudSnapshot {
  expenses: Expense[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  settings: CloudSettings | null;
}

interface CategoryRow {
  user_id: string;
  id: string;
  name: string;
  color: string;
  kind: string;
  budget: number | null;
}

interface ExpenseRow {
  user_id: string;
  id: string;
  date: string;
  amount: number;
  category_id: string;
  description: string;
  status: string;
  type: string;
  recurrence_id: string | null;
}

interface SavingsGoalRow {
  user_id: string;
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
}

interface SettingsRow {
  user_id: string;
  currency: string;
  theme: string;
  notifications_enabled: boolean;
}

function categoryToRow(userId: string, category: Category): CategoryRow {
  return {
    user_id: userId,
    id: category.id,
    name: category.name,
    color: category.color,
    kind: category.kind,
    budget: category.budget ?? null,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    kind: row.kind as Category['kind'],
    budget: row.budget ?? undefined,
  };
}

function expenseToRow(userId: string, expense: Expense): ExpenseRow {
  return {
    user_id: userId,
    id: expense.id,
    date: expense.date,
    amount: expense.amount,
    category_id: expense.categoryId,
    description: expense.description,
    status: expense.status,
    type: expense.type,
    recurrence_id: expense.recurrenceId ?? null,
  };
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    categoryId: row.category_id,
    description: row.description,
    status: row.status as Expense['status'],
    type: row.type as Expense['type'],
    recurrenceId: row.recurrence_id ?? undefined,
  };
}

function savingsGoalToRow(userId: string, goal: SavingsGoal): SavingsGoalRow {
  return {
    user_id: userId,
    id: goal.id,
    name: goal.name,
    target_amount: goal.targetAmount,
    saved_amount: goal.savedAmount,
  };
}

function rowToSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    savedAmount: row.saved_amount,
  };
}

function rowToSettings(row: SettingsRow): CloudSettings {
  return {
    currency: row.currency,
    theme: row.theme as ThemePreference,
    notificationsEnabled: row.notifications_enabled,
  };
}

export async function fetchAllCloudData(userId: string): Promise<CloudSnapshot> {
  if (!supabase) return { expenses: [], categories: [], savingsGoals: [], settings: null };

  const [expensesRes, categoriesRes, savingsGoalsRes, settingsRes] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('savings_goals').select('*').eq('user_id', userId),
    supabase.from('settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  return {
    expenses: ((expensesRes.data as ExpenseRow[] | null) ?? []).map(rowToExpense),
    categories: ((categoriesRes.data as CategoryRow[] | null) ?? []).map(rowToCategory),
    savingsGoals: ((savingsGoalsRes.data as SavingsGoalRow[] | null) ?? []).map(rowToSavingsGoal),
    settings: settingsRes.data ? rowToSettings(settingsRes.data as SettingsRow) : null,
  };
}

export async function pushLocalDataToCloud(userId: string, snapshot: LocalSnapshot): Promise<void> {
  if (!supabase) return;

  await Promise.all([
    upsertExpenses(userId, snapshot.expenses),
    upsertCategories(userId, snapshot.categories),
    upsertSavingsGoals(userId, snapshot.savingsGoals),
    upsertSettings(userId, {
      currency: snapshot.currency,
      theme: snapshot.theme,
      notificationsEnabled: snapshot.notificationsEnabled,
    }),
  ]);
}

export async function upsertExpenses(userId: string, expenses: Expense[]): Promise<void> {
  if (!supabase || expenses.length === 0) return;
  const rows = expenses.map((e) => expenseToRow(userId, e));
  const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteExpenses(userId: string, ids: string[]): Promise<void> {
  if (!supabase || ids.length === 0) return;
  const { error } = await supabase.from('expenses').delete().eq('user_id', userId).in('id', ids);
  if (error) throw error;
}

export async function upsertCategories(userId: string, categories: Category[]): Promise<void> {
  if (!supabase || categories.length === 0) return;
  const rows = categories.map((c) => categoryToRow(userId, c));
  const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('categories').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function upsertSavingsGoals(userId: string, goals: SavingsGoal[]): Promise<void> {
  if (!supabase || goals.length === 0) return;
  const rows = goals.map((g) => savingsGoalToRow(userId, g));
  const { error } = await supabase.from('savings_goals').upsert(rows, { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteSavingsGoal(userId: string, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('savings_goals').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function upsertSettings(userId: string, partial: Partial<CloudSettings>): Promise<void> {
  if (!supabase) return;
  const row: { user_id: string; currency?: string; theme?: string; notifications_enabled?: boolean } = {
    user_id: userId,
  };
  if (partial.currency !== undefined) row.currency = partial.currency;
  if (partial.theme !== undefined) row.theme = partial.theme;
  if (partial.notificationsEnabled !== undefined) row.notifications_enabled = partial.notificationsEnabled;
  const { error } = await supabase.from('settings').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Pure: union by id, remote wins on id conflict. */
export function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const remoteIds = new Set(remote.map((r) => r.id));
  return [...remote, ...local.filter((l) => !remoteIds.has(l.id))];
}

/**
 * Resolves the 3-way login transition:
 * - never synced on this device (no marker) or reconnecting as the same account:
 *   push local up if the cloud is empty, otherwise merge by id (cloud wins on conflict)
 *   and push the merged result back up so any local-only entries reach the cloud.
 * - a different account signing in on this device: discard local arrays, adopt cloud data only.
 */
export async function reconcileOnLogin(userId: string, local: LocalSnapshot): Promise<LocalSnapshot> {
  const cloud = await fetchAllCloudData(userId);
  const syncedId = loadSyncedAccountId();

  if (syncedId !== null && syncedId !== userId) {
    saveSyncedAccountId(userId);
    return {
      expenses: cloud.expenses,
      categories: cloud.categories,
      savingsGoals: cloud.savingsGoals,
      currency: cloud.settings?.currency ?? local.currency,
      theme: cloud.settings?.theme ?? local.theme,
      notificationsEnabled: cloud.settings?.notificationsEnabled ?? local.notificationsEnabled,
    };
  }

  saveSyncedAccountId(userId);

  const cloudIsEmpty =
    cloud.expenses.length === 0 &&
    cloud.categories.length === 0 &&
    cloud.savingsGoals.length === 0 &&
    cloud.settings === null;

  if (cloudIsEmpty) {
    await pushLocalDataToCloud(userId, local);
    return local;
  }

  const merged: LocalSnapshot = {
    expenses: mergeById(local.expenses, cloud.expenses),
    categories: mergeById(local.categories, cloud.categories),
    savingsGoals: mergeById(local.savingsGoals, cloud.savingsGoals),
    currency: cloud.settings?.currency ?? local.currency,
    theme: cloud.settings?.theme ?? local.theme,
    notificationsEnabled: cloud.settings?.notificationsEnabled ?? local.notificationsEnabled,
  };

  await pushLocalDataToCloud(userId, merged);

  return merged;
}

/**
 * Subscribes to realtime changes on all four synced tables for this user.
 * Calls `onTableChanged` with the table name on any insert/update/delete.
 * Returns an unsubscribe function.
 */
export function subscribeToCloudChanges(
  userId: string,
  onTableChanged: (table: CloudTable) => void,
): () => void {
  if (!supabase) return () => {};

  const tables: CloudTable[] = ['categories', 'expenses', 'savings_goals', 'settings'];
  const channel = supabase.channel(`cloud-sync-${userId}`);
  for (const table of tables) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      () => onTableChanged(table),
    );
  }
  channel.subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
