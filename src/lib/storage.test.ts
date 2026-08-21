import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import {
  loadCategories,
  loadCurrency,
  loadExpenses,
  loadNotificationsEnabled,
  loadSavingsGoals,
  loadSyncedAccountId,
  loadThemePreference,
  saveCategories,
  saveCurrency,
  saveExpenses,
  saveNotificationsEnabled,
  saveSavingsGoals,
  saveSyncedAccountId,
  saveThemePreference,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('loadExpenses', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadExpenses()).toEqual([]);
  });

  it('defaults missing `type` to "depense" (pre-income-tracking data)', () => {
    localStorage.setItem(
      'budget-tracker:expenses',
      JSON.stringify([{ id: '1', date: '2026-08-01', amount: 10, categoryId: 'logement', description: '', status: 'reel' }]),
    );

    const expenses = loadExpenses();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].type).toBe('depense');
  });

  it('preserves an explicit `type` already present', () => {
    localStorage.setItem(
      'budget-tracker:expenses',
      JSON.stringify([{ id: '1', date: '2026-08-01', amount: 10, categoryId: 'salaire', description: '', status: 'reel', type: 'revenu' }]),
    );

    expect(loadExpenses()[0].type).toBe('revenu');
  });

  it('falls back to an empty array on corrupted JSON', () => {
    localStorage.setItem('budget-tracker:expenses', '{not valid json');
    expect(loadExpenses()).toEqual([]);
  });
});

describe('saveExpenses / loadExpenses round-trip', () => {
  it('persists and reloads expenses unchanged', () => {
    const expenses = [
      { id: '1', date: '2026-08-01', amount: 42, categoryId: 'logement', description: 'Loyer', status: 'reel' as const, type: 'depense' as const },
    ];
    saveExpenses(expenses);
    expect(loadExpenses()).toEqual(expenses);
  });
});

describe('loadCategories', () => {
  it('returns all default categories on a fresh install', () => {
    const categories = loadCategories();
    expect(categories).toEqual(DEFAULT_CATEGORIES);
  });

  it('defaults missing `kind` to "depense" (pre-income-tracking data)', () => {
    localStorage.setItem(
      'budget-tracker:categories',
      JSON.stringify([{ id: 'logement', name: 'Logement', color: '#2a78d6' }]),
    );

    const categories = loadCategories();
    const logement = categories.find((c) => c.id === 'logement');

    expect(logement?.kind).toBe('depense');
  });

  it('merges in missing default categories (e.g. income ones) on first load after an update', () => {
    localStorage.setItem(
      'budget-tracker:categories',
      JSON.stringify([{ id: 'logement', name: 'Logement', color: '#2a78d6', kind: 'depense' }]),
    );

    const categories = loadCategories();

    expect(categories.length).toBe(DEFAULT_CATEGORIES.length);
    expect(categories.some((c) => c.id === 'salaire')).toBe(true);
  });

  it('does NOT re-add a default category a user deliberately deleted, on a later load', () => {
    // First load performs the one-time migration merge.
    localStorage.setItem(
      'budget-tracker:categories',
      JSON.stringify([{ id: 'logement', name: 'Logement', color: '#2a78d6', kind: 'depense' }]),
    );
    loadCategories();

    // User deletes "salaire" and the app persists the result, as App.tsx would.
    const afterDeletion = loadCategories().filter((c) => c.id !== 'salaire');
    saveCategories(afterDeletion);

    // A later reload must NOT bring "salaire" back.
    const reloaded = loadCategories();
    expect(reloaded.some((c) => c.id === 'salaire')).toBe(false);
  });

  it('falls back to the default categories on corrupted JSON', () => {
    localStorage.setItem('budget-tracker:categories', '{not valid json');
    expect(loadCategories()).toEqual(DEFAULT_CATEGORIES);
  });
});

describe('simple preference round-trips', () => {
  it('theme preference defaults to "system" and persists explicit choices', () => {
    expect(loadThemePreference()).toBe('system');
    saveThemePreference('dark');
    expect(loadThemePreference()).toBe('dark');
  });

  it('currency defaults to EUR and persists explicit choices', () => {
    expect(loadCurrency()).toBe('EUR');
    saveCurrency('USD');
    expect(loadCurrency()).toBe('USD');
  });

  it('notifications preference defaults to disabled and persists', () => {
    expect(loadNotificationsEnabled()).toBe(false);
    saveNotificationsEnabled(true);
    expect(loadNotificationsEnabled()).toBe(true);
  });

  it('savings goals default to an empty list and persist', () => {
    expect(loadSavingsGoals()).toEqual([]);
    const goals = [{ id: 'g1', name: 'Vacances', targetAmount: 1000, savedAmount: 100 }];
    saveSavingsGoals(goals);
    expect(loadSavingsGoals()).toEqual(goals);
  });

  it('synced account id defaults to null and persists once set', () => {
    expect(loadSyncedAccountId()).toBeNull();
    saveSyncedAccountId('user-123');
    expect(loadSyncedAccountId()).toBe('user-123');
  });
});
