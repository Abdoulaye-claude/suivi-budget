const DEFAULT_ICONS: Record<string, string> = {
  logement: '🏠',
  alimentation: '🛒',
  transport: '🚗',
  loisirs: '🎉',
  sante: '💊',
  abonnements: '🔁',
  shopping: '🛍️',
  autres: '📦',
};

const FALLBACK_ICON = '🏷️';

export function getCategoryIcon(categoryId: string): string {
  return DEFAULT_ICONS[categoryId] ?? FALLBACK_ICON;
}
