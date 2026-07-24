import { useEffect, useMemo, useState } from 'react';
import type { Category, Expense } from './types';
import { loadCategories, loadExpenses, saveCategories, saveExpenses } from './lib/storage';
import {
  currentMonthStart,
  isCurrentRealMonth,
  isInMonth,
  nextMonth,
  previousMonth,
  todayISO,
  toISODate,
} from './lib/date';
import { buildExpensesCsv, downloadCsv } from './lib/csv';
import { MonthNavigator } from './components/MonthNavigator';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { MonthSummary } from './components/MonthSummary';
import { CategoryManager } from './components/CategoryManager';
import { RecurringDeleteDialog } from './components/RecurringDeleteDialog';
import './App.css';

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(currentMonthStart());
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => saveCategories(categories), [categories]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isInMonth(e.date, currentMonth)),
    [expenses, currentMonth],
  );

  const realizedExpenses = useMemo(
    () =>
      monthExpenses
        .filter((e) => e.status === 'reel')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [monthExpenses],
  );
  const plannedExpenses = useMemo(
    () =>
      monthExpenses
        .filter((e) => e.status === 'prevu')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [monthExpenses],
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

  function handleDeleteCategory(id: string) {
    if (usedCategoryIds.has(id)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleExportCsv() {
    const csv = buildExpensesCsv(expenses, categories);
    downloadCsv(`suivi-budget-${toISODate(new Date())}.csv`, csv);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>💶 Suivi de Budget</h1>
        <div className="app__header-actions">
          <button type="button" className="btn" onClick={handleExportCsv} disabled={expenses.length === 0}>
            📤 Exporter CSV
          </button>
          <button type="button" className="btn" onClick={() => setShowCategoryManager(true)}>
            🏷️ Catégories
          </button>
        </div>
      </header>

      <MonthNavigator
        month={currentMonth}
        onPrev={() => setCurrentMonth((m) => previousMonth(m))}
        onNext={() => setCurrentMonth((m) => nextMonth(m))}
        onToday={() => setCurrentMonth(currentMonthStart())}
      />

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
          <div className="panel">
            <ExpenseList
              title="Dépenses réalisées"
              expenses={realizedExpenses}
              categories={categories}
              emptyLabel="Aucune dépense réalisée ce mois-ci."
              onEdit={setEditingExpense}
              onDelete={handleRequestDelete}
            />
          </div>
          <div className="panel">
            <ExpenseList
              title="Dépenses prévues"
              expenses={plannedExpenses}
              categories={categories}
              emptyLabel="Aucune dépense prévue ce mois-ci."
              onEdit={setEditingExpense}
              onDelete={handleRequestDelete}
            />
          </div>
        </section>

        <section className="app__column">
          <div className="panel">
            <MonthSummary expenses={monthExpenses} categories={categories} />
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
          onDelete={handleDeleteCategory}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {pendingDelete && (
        <RecurringDeleteDialog
          onDeleteOne={handleDeleteOne}
          onDeleteSeries={handleDeleteSeries}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
