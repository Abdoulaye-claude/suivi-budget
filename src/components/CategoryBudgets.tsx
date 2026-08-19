import { useEffect, useState } from 'react';
import type { Category, Expense } from '../types';
import { formatAmount } from '../lib/format';
import { getCategoryIcon } from '../data/categoryIcons';

interface Props {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  onSetBudget: (id: string, budget: number | undefined) => void;
}

export function CategoryBudgets({ expenses, categories, currency, onSetBudget }: Props) {
  const budgeted = categories.filter((c) => c.kind === 'depense' && c.budget && c.budget > 0);
  const unbudgeted = categories.filter((c) => c.kind === 'depense' && !(c.budget && c.budget > 0));

  const [categoryId, setCategoryId] = useState(unbudgeted[0]?.id ?? '');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!unbudgeted.some((c) => c.id === categoryId)) {
      setCategoryId(unbudgeted[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unbudgeted]);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!categoryId || !Number.isFinite(value) || value <= 0) return;
    onSetBudget(categoryId, value);
    setAmount('');
  }

  const rows = budgeted
    .map((cat) => {
      const spent = expenses
        .filter((e) => e.categoryId === cat.id && e.status === 'reel' && e.type === 'depense')
        .reduce((sum, e) => sum + e.amount, 0);
      const budget = cat.budget ?? 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      return { cat, spent, budget, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="budgets">
      {rows.length === 0 ? (
        <p className="empty-state">Aucun budget défini pour le moment.</p>
      ) : (
        <ul className="budget-list">
          {rows.map(({ cat, spent, budget, pct }) => {
            const level = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok';
            return (
              <li key={cat.id} className="budget-row">
                <div className="budget-row__header">
                  <span className="budget-row__icon" aria-hidden="true">
                    {getCategoryIcon(cat.id)}
                  </span>
                  <span className="budget-row__name">{cat.name}</span>
                  <span className="budget-row__amounts">
                    {formatAmount(spent, currency)} / {formatAmount(budget, currency)}
                  </span>
                </div>
                <div className="budget-row__track">
                  <div
                    className={`budget-row__fill budget-row__fill--${level}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {unbudgeted.length > 0 && (
        <form className="budgets__add" onSubmit={handleAdd}>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Catégorie à budgéter"
          >
            {unbudgeted.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Plafond"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Plafond mensuel"
          />
          <button type="submit" className="btn btn--primary">
            Définir
          </button>
        </form>
      )}
    </div>
  );
}
