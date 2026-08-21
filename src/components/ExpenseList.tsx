import type { Category, Expense } from '../types';
import { dayLabelFr } from '../lib/date';
import { formatAmount } from '../lib/format';
import { getCategoryIcon } from '../data/categoryIcons';

interface Props {
  title: string;
  expenses: Expense[];
  categories: Category[];
  emptyLabel: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onDuplicate: (expense: Expense) => void;
  currency: string;
}

export function ExpenseList({
  title,
  expenses,
  categories,
  emptyLabel,
  onEdit,
  onDelete,
  onDuplicate,
  currency,
}: Props) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="expense-list">
      <h4 className="expense-list__title">
        {title} <span className="expense-list__count">({expenses.length})</span>
      </h4>
      {expenses.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <ul className="expense-list__items">
          {expenses.map((expense) => {
            const category = categoryById.get(expense.categoryId);
            const label = expense.description || category?.name || 'Dépense';
            return (
              <li key={expense.id} className="expense-row">
                <span
                  className="expense-row__dot"
                  style={{ backgroundColor: category?.color ?? '#898781' }}
                  aria-hidden="true"
                />
                <span className="expense-row__icon" aria-hidden="true">
                  {getCategoryIcon(expense.categoryId)}
                </span>
                <div className="expense-row__main">
                  <span className="expense-row__description">
                    {expense.description || category?.name || 'Dépense'}
                    {expense.recurrenceId && (
                      <span className="expense-row__badge" title="Dépense récurrente">
                        🔁
                      </span>
                    )}
                  </span>
                  <span className="expense-row__meta">
                    {category?.name ?? 'Sans catégorie'} · {dayLabelFr(expense.date)}
                  </span>
                </div>
                <span
                  className={
                    expense.type === 'revenu'
                      ? 'expense-row__amount expense-row__amount--revenu'
                      : 'expense-row__amount'
                  }
                >
                  {expense.type === 'revenu' ? '+ ' : '− '}
                  {formatAmount(expense.amount, currency)}
                </span>
                <div className="expense-row__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onDuplicate(expense)}
                    aria-label={`Dupliquer « ${label} »`}
                    title="Dupliquer aujourd'hui"
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onEdit(expense)}
                    aria-label={`Modifier « ${label} »`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => onDelete(expense)}
                    aria-label={`Supprimer « ${label} »`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
