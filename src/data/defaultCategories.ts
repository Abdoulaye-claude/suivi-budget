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
  { id: 'logement', name: 'Logement', color: CATEGORY_PALETTE[0] },
  { id: 'alimentation', name: 'Alimentation', color: CATEGORY_PALETTE[1] },
  { id: 'transport', name: 'Transport', color: CATEGORY_PALETTE[2] },
  { id: 'loisirs', name: 'Loisirs', color: CATEGORY_PALETTE[3] },
  { id: 'sante', name: 'Santé', color: CATEGORY_PALETTE[4] },
  { id: 'abonnements', name: 'Abonnements', color: CATEGORY_PALETTE[5] },
  { id: 'shopping', name: 'Shopping', color: CATEGORY_PALETTE[6] },
  { id: 'autres', name: 'Autres', color: CATEGORY_PALETTE[7] },
];
