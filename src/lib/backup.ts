import type { Category, Expense, SavingsGoal } from '../types';

export interface BackupData {
  version: 1;
  exportedAt: string;
  currency: string;
  expenses: Expense[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
}

export function buildBackup(
  expenses: Expense[],
  categories: Category[],
  savingsGoals: SavingsGoal[],
  currency: string,
): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    currency,
    expenses,
    categories,
    savingsGoals,
  };
}

export function downloadBackup(filename: string, backup: BackupData): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== 'object' || !Array.isArray(data.expenses) || !Array.isArray(data.categories)) {
          reject(new Error("Ce fichier ne ressemble pas à une sauvegarde valide."));
          return;
        }
        resolve(data as BackupData);
      } catch {
        reject(new Error("Ce fichier n'est pas un JSON valide."));
      }
    };
    reader.readAsText(file);
  });
}
