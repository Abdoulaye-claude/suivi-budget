import { useMemo, useState } from 'react';
import type { Expense } from '../types';
import { isInMonth, monthLabelFr } from '../lib/date';
import { formatAmount } from '../lib/format';
import { useModalDialog } from '../lib/useModalDialog';

interface Props {
  expenses: Expense[];
  currency: string;
  onClose: () => void;
}

export function AnnualView({ expenses, currency, onClose }: Props) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const modalRef = useModalDialog<HTMLDivElement>(onClose);

  const rows = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(year, i, 1);
      const monthExpenses = expenses.filter((e) => e.status === 'reel' && isInMonth(e.date, month));
      const revenus = monthExpenses
        .filter((e) => e.type === 'revenu')
        .reduce((sum, e) => sum + e.amount, 0);
      const depenses = monthExpenses
        .filter((e) => e.type === 'depense')
        .reduce((sum, e) => sum + e.amount, 0);
      return { month, revenus, depenses, solde: revenus - depenses };
    });
  }, [expenses, year]);

  const totals = rows.reduce(
    (acc, r) => ({
      revenus: acc.revenus + r.revenus,
      depenses: acc.depenses + r.depenses,
      solde: acc.solde + r.solde,
    }),
    { revenus: 0, depenses: 0, solde: 0 },
  );

  const isCurrentMonth = (month: Date) => {
    const now = new Date();
    return month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--wide"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="annual-view-title"
        tabIndex={-1}
      >
        <div className="modal__header">
          <h3 className="panel-title" id="annual-view-title">
            📅 Vue annuelle
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="annual-view__year-nav">
          <button type="button" className="month-nav__arrow" onClick={() => setYear((y) => y - 1)} aria-label="Année précédente">
            ‹
          </button>
          <span className="annual-view__year">{year}</span>
          <button type="button" className="month-nav__arrow" onClick={() => setYear((y) => y + 1)} aria-label="Année suivante">
            ›
          </button>
        </div>

        <div className="annual-view__table-wrap">
          <table className="annual-view__table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Revenus</th>
                <th>Dépenses</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month.toISOString()} className={isCurrentMonth(r.month) ? 'is-current' : undefined}>
                  <td>{monthLabelFr(r.month)}</td>
                  <td className="annual-view__amount annual-view__amount--income">
                    {formatAmount(r.revenus, currency)}
                  </td>
                  <td className="annual-view__amount annual-view__amount--expense">
                    {formatAmount(r.depenses, currency)}
                  </td>
                  <td
                    className="annual-view__amount"
                    style={r.solde < 0 ? { color: 'var(--danger)' } : undefined}
                  >
                    {formatAmount(r.solde, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="annual-view__amount annual-view__amount--income">
                  {formatAmount(totals.revenus, currency)}
                </td>
                <td className="annual-view__amount annual-view__amount--expense">
                  {formatAmount(totals.depenses, currency)}
                </td>
                <td
                  className="annual-view__amount"
                  style={totals.solde < 0 ? { color: 'var(--danger)' } : undefined}
                >
                  {formatAmount(totals.solde, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
