import { useEffect, useState } from 'react';
import type { Category, Expense, ExpenseStatus } from '../types';
import { addMonthsIso, todayISO } from '../lib/date';

interface Props {
  categories: Category[];
  defaultDate: string;
  editingExpense: Expense | null;
  onSubmit: (expenses: Expense[]) => void;
  onCancelEdit: () => void;
}

const MIN_OCCURRENCES = 2;
const MAX_OCCURRENCES = 36;

function statusForDate(iso: string): ExpenseStatus {
  return iso > todayISO() ? 'prevu' : 'reel';
}

export function ExpenseForm({
  categories,
  defaultDate,
  editingExpense,
  onSubmit,
  onCancelEdit,
}: Props) {
  const [date, setDate] = useState(defaultDate);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>(statusForDate(defaultDate));
  const [isRecurring, setIsRecurring] = useState(false);
  const [occurrences, setOccurrences] = useState(6);

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(String(editingExpense.amount));
      setCategoryId(editingExpense.categoryId);
      setDescription(editingExpense.description);
      setStatus(editingExpense.status);
      setIsRecurring(false);
    } else {
      setDate(defaultDate);
      setAmount('');
      setCategoryId((current) => current || categories[0]?.id || '');
      setDescription('');
      setStatus(statusForDate(defaultDate));
      setIsRecurring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingExpense, defaultDate]);

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setStatus(statusForDate(nextDate));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const numericAmount = Number.parseFloat(amount.replace(',', '.'));
    if (!date || !categoryId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    if (!editingExpense && isRecurring && occurrences >= MIN_OCCURRENCES) {
      const recurrenceId = crypto.randomUUID();
      const generated: Expense[] = Array.from({ length: occurrences }, (_, i) => {
        const occurrenceDate = addMonthsIso(date, i);
        return {
          id: crypto.randomUUID(),
          date: occurrenceDate,
          amount: numericAmount,
          categoryId,
          description: description.trim(),
          status: statusForDate(occurrenceDate),
          recurrenceId,
        };
      });
      onSubmit(generated);
    } else {
      onSubmit([
        {
          id: editingExpense?.id ?? crypto.randomUUID(),
          date,
          amount: numericAmount,
          categoryId,
          description: description.trim(),
          status,
          recurrenceId: editingExpense?.recurrenceId,
        },
      ]);
    }

    if (!editingExpense) {
      setAmount('');
      setDescription('');
      setIsRecurring(false);
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h3 className="panel-title">
        {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
      </h3>

      <div className="field-row">
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Montant</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Catégorie</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Description</span>
          <input
            type="text"
            placeholder="Ex : Courses de la semaine"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="field">
        <span>Statut</span>
        <div className="segmented" role="radiogroup" aria-label="Statut de la dépense">
          <button
            type="button"
            className={status === 'reel' ? 'segmented__option is-active' : 'segmented__option'}
            onClick={() => setStatus('reel')}
            aria-pressed={status === 'reel'}
          >
            Réalisée
          </button>
          <button
            type="button"
            className={status === 'prevu' ? 'segmented__option is-active' : 'segmented__option'}
            onClick={() => setStatus('prevu')}
            aria-pressed={status === 'prevu'}
          >
            Prévue
          </button>
        </div>
      </div>

      {!editingExpense && (
        <div className="recurring-field">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span>🔁 Répéter chaque mois</span>
          </label>
          {isRecurring && (
            <label className="recurring-field__count">
              <span>Nombre de mois</span>
              <input
                type="number"
                min={MIN_OCCURRENCES}
                max={MAX_OCCURRENCES}
                value={occurrences}
                onChange={(e) =>
                  setOccurrences(
                    Math.min(MAX_OCCURRENCES, Math.max(MIN_OCCURRENCES, Number(e.target.value) || MIN_OCCURRENCES)),
                  )
                }
              />
            </label>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          {editingExpense ? '💾 Enregistrer' : '➕ Ajouter'}
        </button>
        {editingExpense && (
          <button type="button" className="btn" onClick={onCancelEdit}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
