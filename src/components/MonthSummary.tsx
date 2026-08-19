import { useMemo, useState } from 'react';
import type { Category, Expense, ExpenseStatus } from '../types';
import { formatAmount } from '../lib/format';
import { CategoryPieChart } from './CategoryPieChart';

interface Props {
  expenses: Expense[];
  categories: Category[];
  currency: string;
}

export function MonthSummary({ expenses, categories, currency }: Props) {
  const [view, setView] = useState<ExpenseStatus>('reel');

  const { revenus: revenusReel, depenses: depensesReel } = useMemo(
    () => splitTotals(expenses.filter((e) => e.status === 'reel')),
    [expenses],
  );
  const { revenus: revenusPrevu, depenses: depensesPrevu } = useMemo(
    () => splitTotals(expenses.filter((e) => e.status === 'prevu')),
    [expenses],
  );
  const soldeReel = revenusReel - depensesReel;
  const soldePrevu = soldeReel + (revenusPrevu - depensesPrevu);

  const chartData = useMemo(() => {
    const relevant = expenses.filter((e) => e.status === view && e.type === 'depense');
    return categories
      .filter((cat) => cat.kind === 'depense')
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        amount: sum(relevant.filter((e) => e.categoryId === cat.id)),
      }));
  }, [expenses, categories, view]);

  return (
    <div className="month-summary">
      <div className="stat-row">
        <div className="stat-tile stat-tile--income">
          <span className="stat-tile__label" title="L'argent déjà reçu ce mois-ci">
            💰 Revenus réalisés
          </span>
          <span className="stat-tile__value">{formatAmount(revenusReel, currency)}</span>
        </div>
        <div className="stat-tile stat-tile--expense">
          <span className="stat-tile__label" title="L'argent déjà dépensé ce mois-ci">
            💸 Dépenses réalisées
          </span>
          <span className="stat-tile__value">{formatAmount(depensesReel, currency)}</span>
        </div>
        <div className="stat-tile stat-tile--accent">
          <span className="stat-tile__label" title="Ce qu'il vous reste réellement, là, maintenant">
            ⚖️ Solde actuel
          </span>
          <span
            className="stat-tile__value"
            style={soldeReel < 0 ? { color: 'var(--danger)' } : undefined}
          >
            {formatAmount(soldeReel, currency)}
          </span>
        </div>
        <div className="stat-tile stat-tile--income stat-tile--muted">
          <span className="stat-tile__label" title="L'argent que vous attendez encore ce mois-ci">
            🗓️ Revenus prévus
          </span>
          <span className="stat-tile__value">{formatAmount(revenusPrevu, currency)}</span>
        </div>
        <div className="stat-tile stat-tile--expense stat-tile--muted">
          <span className="stat-tile__label" title="Les dépenses à venir que vous avez planifiées">
            🗓️ Dépenses prévues
          </span>
          <span className="stat-tile__value">{formatAmount(depensesPrevu, currency)}</span>
        </div>
        <div className="stat-tile stat-tile--accent stat-tile--muted">
          <span
            className="stat-tile__label"
            title="Ce qu'il vous restera à la fin du mois si tout se passe comme prévu"
          >
            🗓️ Solde prévu
          </span>
          <span
            className="stat-tile__value"
            style={soldePrevu < 0 ? { color: 'var(--danger)' } : undefined}
          >
            {formatAmount(soldePrevu, currency)}
          </span>
        </div>
      </div>

      <div id="category-chart-capture">
        <div className="chart-header">
          <h3 className="panel-title">Répartition des dépenses par catégorie</h3>
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
        <CategoryPieChart data={chartData} currency={currency} />
      </div>
    </div>
  );
}

function sum(expenses: Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}

function splitTotals(expenses: Expense[]): { revenus: number; depenses: number } {
  return {
    revenus: sum(expenses.filter((e) => e.type === 'revenu')),
    depenses: sum(expenses.filter((e) => e.type === 'depense')),
  };
}
