import { useState } from 'react';
import type { SavingsGoal } from '../types';
import { formatAmount } from '../lib/format';

interface Props {
  goals: SavingsGoal[];
  currency: string;
  onAdd: (goal: SavingsGoal) => void;
  onUpdateSaved: (id: string, savedAmount: number) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoals({ goals, currency, onAdd, onUpdateSaved, onDelete }: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    const targetAmount = Number.parseFloat(target.replace(',', '.'));
    if (!trimmed || !Number.isFinite(targetAmount) || targetAmount <= 0) return;
    onAdd({ id: crypto.randomUUID(), name: trimmed, targetAmount, savedAmount: 0 });
    setName('');
    setTarget('');
  }

  function adjust(goal: SavingsGoal, delta: number) {
    const next = Math.max(0, Math.round((goal.savedAmount + delta) * 100) / 100);
    onUpdateSaved(goal.id, next);
  }

  return (
    <div className="savings-goals">
      {goals.length === 0 ? (
        <p className="empty-state">Aucun objectif d'épargne pour le moment.</p>
      ) : (
        <ul className="savings-goals__list">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
            const reached = goal.savedAmount >= goal.targetAmount;
            return (
              <li key={goal.id} className="savings-goal">
                <div className="savings-goal__header">
                  <span className="savings-goal__name">
                    {reached ? '🎉 ' : '🎯 '}
                    {goal.name}
                  </span>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => onDelete(goal.id)}
                    aria-label={`Supprimer l'objectif ${goal.name}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="savings-goal__track">
                  <div
                    className={reached ? 'savings-goal__fill is-reached' : 'savings-goal__fill'}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="savings-goal__footer">
                  <div className="savings-goal__amounts">
                    {formatAmount(goal.savedAmount, currency)} / {formatAmount(goal.targetAmount, currency)}
                    <span className="savings-goal__pct"> ({Math.round(pct)}%)</span>
                  </div>
                  <div className="savings-goal__stepper">
                    <button type="button" className="icon-btn" onClick={() => adjust(goal, -10)} aria-label="Retirer 10">
                      −10
                    </button>
                    <button type="button" className="icon-btn" onClick={() => adjust(goal, 10)} aria-label="Ajouter 10">
                      +10
                    </button>
                    <button type="button" className="icon-btn" onClick={() => adjust(goal, 50)} aria-label="Ajouter 50">
                      +50
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form className="savings-goals__add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nom de l'objectif"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Montant cible"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          Ajouter
        </button>
      </form>
    </div>
  );
}
