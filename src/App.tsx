import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Expense, SavingsGoal } from './types';
import {
  isOnboarded,
  loadCategories,
  loadCurrency,
  loadExpenses,
  loadLastNotifiedDate,
  loadNotificationsEnabled,
  loadSavingsGoals,
  loadThemePreference,
  markOnboarded,
  saveCategories,
  saveCurrency,
  saveExpenses,
  saveLastNotifiedDate,
  saveNotificationsEnabled,
  saveSavingsGoals,
  saveThemePreference,
  type ThemePreference,
} from './lib/storage';
import { CURRENCIES } from './data/currencies';
import { DEFAULT_CATEGORIES } from './data/defaultCategories';
import { fetchExchangeRate } from './lib/exchangeRate';
import { formatAmount } from './lib/format';
import {
  currentMonthStart,
  isCurrentRealMonth,
  isInMonth,
  nextMonth,
  previousMonth,
  statusForDate,
  todayISO,
  toISODate,
  tomorrowISO,
} from './lib/date';
import { MonthNavigator } from './components/MonthNavigator';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { MonthSummary } from './components/MonthSummary';
import { ExpenseTrendChart } from './components/ExpenseTrendChart';
import { CategoryBudgets } from './components/CategoryBudgets';
import { SavingsGoals } from './components/SavingsGoals';
import { AnnualView } from './components/AnnualView';
import { CategoryManager } from './components/CategoryManager';
import { RecurringDeleteDialog } from './components/RecurringDeleteDialog';
import { WelcomeBanner } from './components/WelcomeBanner';
import { AuthModal } from './components/AuthModal';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import './App.css';

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(currentMonthStart());
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(loadThemePreference);
  const [currency, setCurrency] = useState<string>(loadCurrency);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(loadSavingsGoals);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnnualView, setShowAnnualView] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(isOnboarded);
  const [notificationsEnabled, setNotificationsEnabled] = useState(loadNotificationsEnabled);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const settingsMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  function handleSignOut() {
    supabase?.auth.signOut();
  }

  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => saveCategories(categories), [categories]);
  useEffect(() => saveCurrency(currency), [currency]);
  useEffect(() => saveSavingsGoals(savingsGoals), [savingsGoals]);
  useEffect(() => saveNotificationsEnabled(notificationsEnabled), [notificationsEnabled]);

  useEffect(() => {
    if (expenses.length > 0 && !hasSeenOnboarding) {
      setHasSeenOnboarding(true);
      markOnboarded();
    }
  }, [expenses.length, hasSeenOnboarding]);

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    const today = todayISO();
    if (loadLastNotifiedDate() === today) return;
    const tomorrow = tomorrowISO();
    const dueSoon = expenses.filter((e) => e.status === 'prevu' && (e.date === today || e.date === tomorrow));
    if (dueSoon.length === 0) return;
    const total = dueSoon.reduce((sum, e) => sum + e.amount, 0);
    new Notification('Dépenses prévues bientôt', {
      body: `${dueSoon.length} opération(s) prévue(s) pour un total de ${formatAmount(total, currency)}.`,
      icon: '/icon-192.png',
    });
    saveLastNotifiedDate(today);
  }, [notificationsEnabled, expenses, currency]);

  useEffect(() => {
    // <details>/<summary> only toggles on a click on the summary itself, so the
    // settings dropdown otherwise stays open when clicking elsewhere on the page
    // or pressing Escape — both expected ways to dismiss a menu like this.
    function handlePointerDown(event: PointerEvent) {
      const menu = settingsMenuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    }
    function handleSettingsEscape(event: KeyboardEvent) {
      const menu = settingsMenuRef.current;
      if (event.key === 'Escape' && menu?.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleSettingsEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleSettingsEscape);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'n' && event.key !== 'N') return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (showCategoryManager || showAnnualView || pendingDelete) return;
      event.preventDefault();
      document.getElementById('expense-amount-input')?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCategoryManager, showAnnualView, pendingDelete]);

  useEffect(() => {
    saveThemePreference(theme);
    if (theme === 'system') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    function promoteDuePlanned() {
      setExpenses((prev) => {
        const today = todayISO();
        let changed = false;
        const next = prev.map((e) => {
          if (e.status === 'prevu' && e.date <= today) {
            changed = true;
            return { ...e, status: 'reel' as const };
          }
          return e;
        });
        return changed ? next : prev;
      });
    }

    promoteDuePlanned();
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') promoteDuePlanned();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isInMonth(e.date, currentMonth)),
    [expenses, currentMonth],
  );

  const soldeActuel = useMemo(() => {
    const realized = monthExpenses.filter((e) => e.status === 'reel');
    const revenus = realized.filter((e) => e.type === 'revenu').reduce((sum, e) => sum + e.amount, 0);
    const depenses = realized.filter((e) => e.type === 'depense').reduce((sum, e) => sum + e.amount, 0);
    return revenus - depenses;
  }, [monthExpenses]);

  const searchedMonthExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return monthExpenses;
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    return monthExpenses.filter((e) => {
      const categoryName = categoryById.get(e.categoryId)?.name ?? '';
      return (
        e.description.toLowerCase().includes(query) || categoryName.toLowerCase().includes(query)
      );
    });
  }, [monthExpenses, searchQuery, categories]);

  const realizedExpenses = useMemo(
    () =>
      searchedMonthExpenses
        .filter((e) => e.status === 'reel')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [searchedMonthExpenses],
  );
  const plannedExpenses = useMemo(
    () =>
      searchedMonthExpenses
        .filter((e) => e.status === 'prevu')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [searchedMonthExpenses],
  );

  const usedCategoryIds = useMemo(() => new Set(expenses.map((e) => e.categoryId)), [expenses]);

  const defaultDate = isCurrentRealMonth(currentMonth) ? todayISO() : toISODate(currentMonth);

  function handleSubmitExpenses(newExpenses: Expense[]) {
    setExpenses((prev) => {
      let next = prev;
      for (const expense of newExpenses) {
        const exists = next.some((e) => e.id === expense.id);
        next = exists
          ? next.map((e) => (e.id === expense.id ? expense : e))
          : [...next, expense];
      }
      return next;
    });
    setEditingExpense(null);
  }

  function handleDuplicate(expense: Expense) {
    const date = todayISO();
    setExpenses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date,
        amount: expense.amount,
        categoryId: expense.categoryId,
        description: expense.description,
        status: statusForDate(date),
        type: expense.type,
      },
    ]);
  }

  function handleRequestDelete(expense: Expense) {
    if (expense.recurrenceId) {
      setPendingDelete(expense);
      return;
    }
    if (!window.confirm('Supprimer cette dépense ?')) return;
    removeExpenses((e) => e.id !== expense.id);
  }

  function removeExpenses(keep: (expense: Expense) => boolean) {
    setExpenses((prev) => prev.filter(keep));
    setEditingExpense((current) => (current && !keep(current) ? null : current));
  }

  function handleDeleteOne() {
    if (!pendingDelete) return;
    removeExpenses((e) => e.id !== pendingDelete.id);
    setPendingDelete(null);
  }

  function handleDeleteSeries() {
    if (!pendingDelete) return;
    const { recurrenceId, date } = pendingDelete;
    removeExpenses((e) => !(e.recurrenceId === recurrenceId && e.date >= date));
    setPendingDelete(null);
  }

  function handleAddCategory(category: Category) {
    setCategories((prev) => [...prev, category]);
  }

  function handleRenameCategory(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function handleRecolorCategory(id: string, color: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));
  }

  function handleSetCategoryBudget(id: string, budget: number | undefined) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, budget } : c)));
  }

  function handleDeleteCategory(id: string) {
    if (usedCategoryIds.has(id)) return;
    const category = categories.find((c) => c.id === id);
    if (!window.confirm(`Supprimer la catégorie « ${category?.name ?? ''} » ?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleRestoreDefaultCategories() {
    setCategories((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const missing = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }

  function handleAddSavingsGoal(goal: SavingsGoal) {
    setSavingsGoals((prev) => [...prev, goal]);
  }

  function handleUpdateSavingsGoalSaved(id: string, savedAmount: number) {
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, savedAmount } : g)));
  }

  function handleDeleteSavingsGoal(id: string) {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const [{ buildExpensesWorkbook, downloadWorkbook }, { captureElementAsPng }] = await Promise.all([
        import('./lib/excelExport'),
        import('./lib/captureElement'),
      ]);
      const categoryChartElement = document.getElementById('category-chart-capture');
      const trendChartElement = document.getElementById('trend-chart-capture');
      const [categoryChartImage, trendChartImage] = await Promise.all([
        categoryChartElement ? captureElementAsPng(categoryChartElement) : null,
        trendChartElement ? captureElementAsPng(trendChartElement) : null,
      ]);
      const workbook = await buildExpensesWorkbook(expenses, categories, currency, [
        categoryChartImage,
        trendChartImage,
      ]);
      await downloadWorkbook(`suivi-budget-${toISODate(new Date())}.xlsx`, workbook);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportBackup() {
    const { buildBackup, downloadBackup } = await import('./lib/backup');
    const backup = buildBackup(expenses, categories, savingsGoals, currency);
    downloadBackup(`suivi-budget-sauvegarde-${toISODate(new Date())}.json`, backup);
  }

  async function handleImportBackupFile(file: File) {
    try {
      const { parseBackupFile } = await import('./lib/backup');
      const backup = await parseBackupFile(file);
      if (
        !window.confirm(
          `Restaurer cette sauvegarde du ${new Date(backup.exportedAt).toLocaleDateString('fr-FR')} ? Toutes les données actuelles (dépenses, catégories, objectifs) seront remplacées.`,
        )
      ) {
        return;
      }
      setExpenses(backup.expenses);
      setCategories(backup.categories);
      setSavingsGoals(backup.savingsGoals ?? []);
      if (backup.currency) setCurrency(backup.currency);
      window.alert('Sauvegarde restaurée avec succès.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Échec de la restauration.');
    }
  }

  async function handleChangeCurrency(nextCurrency: string) {
    if (nextCurrency === currency || !nextCurrency) return;

    if (expenses.length === 0) {
      setCurrency(nextCurrency);
      return;
    }

    setIsConvertingCurrency(true);
    try {
      const rate = await fetchExchangeRate(currency, nextCurrency);
      setExpenses((prev) =>
        prev.map((e) => ({ ...e, amount: Math.round(e.amount * rate * 100) / 100 })),
      );
      setCurrency(nextCurrency);
    } catch {
      window.alert(
        "Impossible de récupérer le taux de change automatiquement (vérifiez votre connexion internet). La devise n'a pas été changée.",
      );
    } finally {
      setIsConvertingCurrency(false);
    }
  }

  function handleDismissWelcome() {
    setHasSeenOnboarding(true);
    markOnboarded();
  }

  function handleLoadSampleData() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateFor = (day: number) => toISODate(new Date(year, month, day));
    const sample: Expense[] = [
      {
        id: crypto.randomUUID(),
        date: dateFor(1),
        amount: 2200,
        categoryId: 'salaire',
        description: 'Salaire',
        status: statusForDate(dateFor(1)),
        type: 'revenu',
      },
      {
        id: crypto.randomUUID(),
        date: dateFor(5),
        amount: 750,
        categoryId: 'logement',
        description: 'Loyer',
        status: statusForDate(dateFor(5)),
        type: 'depense',
      },
      {
        id: crypto.randomUUID(),
        date: dateFor(12),
        amount: 180,
        categoryId: 'alimentation',
        description: 'Courses',
        status: statusForDate(dateFor(12)),
        type: 'depense',
      },
      {
        id: crypto.randomUUID(),
        date: dateFor(18),
        amount: 15,
        categoryId: 'loisirs',
        description: 'Abonnement streaming',
        status: statusForDate(dateFor(18)),
        type: 'depense',
      },
      {
        id: crypto.randomUUID(),
        date: dateFor(27),
        amount: 60,
        categoryId: 'transport',
        description: 'Assurance auto',
        status: statusForDate(dateFor(27)),
        type: 'depense',
      },
    ];
    setExpenses((prev) => [...prev, ...sample]);
    setHasSeenOnboarding(true);
    markOnboarded();
  }

  async function handleToggleNotifications() {
    if (!notificationsEnabled) {
      if (typeof Notification === 'undefined') {
        window.alert('Les notifications ne sont pas prises en charge par ce navigateur.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        window.alert("Autorisation refusée. Vous pouvez l'activer depuis les réglages du navigateur.");
        return;
      }
    }
    setNotificationsEnabled((v) => !v);
  }

  function cycleTheme() {
    setTheme((current) =>
      current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system',
    );
  }

  const themeIcon = theme === 'system' ? '🖥️' : theme === 'light' ? '☀️' : '🌙';
  const themeLabel =
    theme === 'system' ? 'Thème : Système' : theme === 'light' ? 'Thème : Clair' : 'Thème : Sombre';

  return (
    <div className="app">
      <header className="app__header">
        <h1>💶 Suivi de Budget</h1>
        <div className="app__header-actions">
          <button
            type="button"
            className="btn"
            onClick={handleExportExcel}
            disabled={expenses.length === 0 || isExporting}
          >
            {isExporting ? '⏳ Export…' : '📤 Exporter Excel'}
          </button>
          <button type="button" className="btn" onClick={() => setShowCategoryManager(true)}>
            🏷️ Catégories
          </button>
          <button type="button" className="btn" onClick={() => setShowAnnualView(true)}>
            📅 Vue annuelle
          </button>
          {isSupabaseConfigured &&
            (session ? (
              <button type="button" className="btn" onClick={handleSignOut} title={session.user.email}>
                👤 Se déconnecter
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => setShowAuthModal(true)}>
                👤 Se connecter
              </button>
            ))}
          <details className="settings-menu" ref={settingsMenuRef}>
            <summary className="btn settings-menu__trigger" aria-label="Paramètres">
              ⚙️
            </summary>
            <div className="settings-menu__panel">
              <label className="settings-menu__row">
                <span>Devise</span>
                <select
                  className="currency-select"
                  value={currency}
                  onChange={(e) => handleChangeCurrency(e.target.value)}
                  disabled={isConvertingCurrency}
                  aria-label="Devise"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {isConvertingCurrency && (
                  <span className="currency-select__spinner" aria-live="polite">
                    ⏳
                  </span>
                )}
              </label>
              <button type="button" className="settings-menu__row settings-menu__row--button" onClick={cycleTheme}>
                <span>Thème</span>
                <span>
                  {themeIcon} {themeLabel.replace('Thème : ', '')}
                </span>
              </button>
              <button
                type="button"
                className="settings-menu__row settings-menu__row--button"
                onClick={handleToggleNotifications}
              >
                <span>🔔 Rappels de dépenses prévues</span>
                <span>{notificationsEnabled ? 'Activés' : 'Désactivés'}</span>
              </button>
              <div className="settings-menu__divider" />
              <button
                type="button"
                className="settings-menu__row settings-menu__row--button"
                onClick={handleExportBackup}
              >
                <span>💾 Sauvegarder mes données</span>
                <span>Fichier .json</span>
              </button>
              <button
                type="button"
                className="settings-menu__row settings-menu__row--button"
                onClick={() => backupFileInputRef.current?.click()}
              >
                <span>📂 Restaurer une sauvegarde</span>
                <span>Fichier .json</span>
              </button>
              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportBackupFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </details>
        </div>
      </header>

      {expenses.length === 0 && !hasSeenOnboarding && (
        <WelcomeBanner onLoadSample={handleLoadSampleData} onDismiss={handleDismissWelcome} />
      )}

      <MonthNavigator
        month={currentMonth}
        onPrev={() => setCurrentMonth((m) => previousMonth(m))}
        onNext={() => setCurrentMonth((m) => nextMonth(m))}
        onToday={() => setCurrentMonth(currentMonthStart())}
      />

      <div className="hero-balance">
        <span className="hero-balance__label">
          {soldeActuel >= 0 ? 'Il vous reste ce mois-ci' : 'Vous êtes en déficit ce mois-ci'}
        </span>
        <span
          className="hero-balance__value"
          style={{ color: soldeActuel < 0 ? 'var(--danger)' : 'var(--good)' }}
        >
          {formatAmount(soldeActuel, currency)}
        </span>
      </div>

      <main className="app__layout">
        <section className="app__column">
          <div className="panel">
            <ExpenseForm
              categories={categories}
              defaultDate={defaultDate}
              editingExpense={editingExpense}
              onSubmit={handleSubmitExpenses}
              onCancelEdit={() => setEditingExpense(null)}
            />
          </div>
          <div className="panel panel--search">
            <input
              type="search"
              className="search-input"
              placeholder="🔍 Rechercher une opération ou une catégorie…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher"
            />
          </div>
          <div className="panel">
            <ExpenseList
              title="Réalisées"
              expenses={realizedExpenses}
              categories={categories}
              emptyLabel={
                searchQuery
                  ? 'Aucune opération réalisée ne correspond à la recherche.'
                  : 'Aucune opération réalisée ce mois-ci.'
              }
              onEdit={setEditingExpense}
              onDelete={handleRequestDelete}
              onDuplicate={handleDuplicate}
              currency={currency}
            />
          </div>
          <div className="panel">
            <ExpenseList
              title="Prévues"
              expenses={plannedExpenses}
              categories={categories}
              emptyLabel={
                searchQuery
                  ? 'Aucune opération prévue ne correspond à la recherche.'
                  : 'Aucune opération prévue ce mois-ci.'
              }
              onEdit={setEditingExpense}
              onDelete={handleRequestDelete}
              onDuplicate={handleDuplicate}
              currency={currency}
            />
          </div>
          <div className="panel">
            <h3 className="panel-title">🎯 Objectifs d'épargne</h3>
            <SavingsGoals
              goals={savingsGoals}
              currency={currency}
              onAdd={handleAddSavingsGoal}
              onUpdateSaved={handleUpdateSavingsGoalSaved}
              onDelete={handleDeleteSavingsGoal}
            />
          </div>
        </section>

        <section className="app__column app__column--summary">
          <div className="panel">
            <MonthSummary expenses={monthExpenses} categories={categories} currency={currency} />
          </div>
          <div className="panel">
            <h3 className="panel-title">💳 Budgets par catégorie</h3>
            <CategoryBudgets
              expenses={monthExpenses}
              categories={categories}
              currency={currency}
              onSetBudget={handleSetCategoryBudget}
            />
          </div>
          <div className="panel">
            <ExpenseTrendChart expenses={expenses} currentMonth={currentMonth} currency={currency} />
          </div>
        </section>
      </main>

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          usedCategoryIds={usedCategoryIds}
          onAdd={handleAddCategory}
          onRename={handleRenameCategory}
          onRecolor={handleRecolorCategory}
          onSetBudget={handleSetCategoryBudget}
          onDelete={handleDeleteCategory}
          onRestoreDefaults={handleRestoreDefaultCategories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showAnnualView && (
        <AnnualView expenses={expenses} currency={currency} onClose={() => setShowAnnualView(false)} />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {pendingDelete && (
        <RecurringDeleteDialog
          onDeleteOne={handleDeleteOne}
          onDeleteSeries={handleDeleteSeries}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <footer className="app__footer">
        🔒 Vos données restent uniquement sur cet appareil — rien n'est envoyé à un serveur.
      </footer>
    </div>
  );
}
