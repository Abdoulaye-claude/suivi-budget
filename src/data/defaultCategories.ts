import type { Category } from '../types';

// Ordered categorical palette (fixed hue order — never reassigned per-instance).
export const CATEGORY_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'logement', name: 'Logement', color: CATEGORY_PALETTE[0], kind: 'depense' },
  { id: 'alimentation', name: 'Alimentation', color: CATEGORY_PALETTE[1], kind: 'depense' },
  { id: 'transport', name: 'Transport', color: CATEGORY_PALETTE[2], kind: 'depense' },
  { id: 'loisirs', name: 'Loisirs', color: CATEGORY_PALETTE[3], kind: 'depense' },
  { id: 'sante', name: 'Santé', color: CATEGORY_PALETTE[4], kind: 'depense' },
  { id: 'abonnements', name: 'Abonnements', color: CATEGORY_PALETTE[5], kind: 'depense' },
  { id: 'shopping', name: 'Shopping', color: CATEGORY_PALETTE[6], kind: 'depense' },
  { id: 'autres', name: 'Autres', color: CATEGORY_PALETTE[7], kind: 'depense' },
  { id: 'salaire', name: 'Salaire', color: CATEGORY_PALETTE[0], kind: 'revenu' },
  { id: 'freelance', name: 'Freelance', color: CATEGORY_PALETTE[2], kind: 'revenu' },
  { id: 'remboursements', name: 'Remboursements', color: CATEGORY_PALETTE[4], kind: 'revenu' },
  { id: 'autres-revenus', name: 'Autres revenus', color: CATEGORY_PALETTE[5], kind: 'revenu' },
];
