import { useMemo, useState } from 'react';
import type { Category, Expense, ExpenseStatus } from '../types';
import { formatAmount } from '../lib/format';
import { CategoryBarChart } from './CategoryBarChart';

interface Props {
  expenses: Expense[];
  categories: Category[];
}

export function MonthSummary({ expenses, categories }: Props) {
  const [view, setView] = useState<ExpenseStatus>('reel');

  const totalReel = useMemo(
    () => sum(expenses.filter((e) => e.status === 'reel')),
    [expenses],
  );
  const totalPrevu = useMemo(
    () => sum(expenses.filter((e) => e.status === 'prevu')),
    [expenses],
  );

  const chartData = useMemo(() => {
    const relevant = expenses.filter((e) => e.status === view);
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      amount: sum(relevant.filter((e) => e.categoryId === cat.id)),
    }));
  }, [expenses, categories, view]);

  return (
    <div className="month-summary">
      <div className="stat-row">
        <div className="stat-tile stat-tile--realized">
          <span className="stat-tile__label">✅ Réalisé</span>
          <span className="stat-tile__value">{formatAmount(totalReel)}</span>
        </div>
        <div className="stat-tile stat-tile--planned">
          <span className="stat-tile__label">🗓️ Prévu</span>
          <span className="stat-tile__value">{formatAmount(totalPrevu)}</span>
        </div>
        <div className="stat-tile stat-tile--accent">
          <span className="stat-tile__label">💶 Total du mois</span>
          <span className="stat-tile__value">{formatAmount(totalReel + totalPrevu)}</span>
        </div>
      </div>

      <div className="chart-header">
        <h3 className="panel-title">Répartition par catégorie</h3>
        <div className="segmented segmented--compact" role="radiogroup" aria-label="Vue du graphique">
          <button
            type="button"
            className={view === 'reel' ? 'segmented__option is-active' : 'segmented__option'}
            onClick={() => setView('reel')}
          >
            Réalisées
          </button>
          <button
            type="button"
            className={view === 'prevu' ? 'segmented__option is-active' : 'segmented__option'}
            onClick={() => setView('prevu')}
          >
            Prévues
          </button>
        </div>
      </div>
      <CategoryBarChart data={chartData} />
    </div>
  );
}

function sum(expenses: Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}
