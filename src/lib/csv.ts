import type { Category, Expense } from '../types';

const DELIMITER = ';';

function escapeField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildExpensesCsv(expenses: Expense[], categories: Category[]): string {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const header = ['Date', 'Catégorie', 'Description', 'Montant', 'Statut'];
  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((expense) => [
      expense.date,
      categoryById.get(expense.categoryId)?.name ?? 'Sans catégorie',
      expense.description,
      expense.amount.toFixed(2).replace('.', ','),
      expense.status === 'reel' ? 'Réalisée' : 'Prévue',
    ]);

  const lines = [header, ...rows].map((row) => row.map(escapeField).join(DELIMITER));
  return '﻿' + lines.join('\r\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
