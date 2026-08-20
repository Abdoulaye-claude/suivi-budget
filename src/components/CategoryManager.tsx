import { useState } from 'react';
import type { Category, ExpenseType } from '../types';
import { CATEGORY_PALETTE, DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { getCategoryIcon } from '../data/categoryIcons';

interface Props {
  categories: Category[];
  usedCategoryIds: Set<string>;
  onAdd: (category: Category) => void;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, color: string) => void;
  onSetBudget: (id: string, budget: number | undefined) => void;
  onDelete: (id: string) => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
}

export function CategoryManager({
  categories,
  usedCategoryIds,
  onAdd,
  onRename,
  onRecolor,
  onSetBudget,
  onDelete,
  onRestoreDefaults,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ExpenseType>('depense');
  const [color, setColor] = useState(pickNextColor(categories));

  const depenseCategories = categories.filter((c) => c.kind === 'depense');
  const revenuCategories = categories.filter((c) => c.kind === 'revenu');
  const existingIds = new Set(categories.map((c) => c.id));
  const missingDefaultsCount = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id)).length;

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ id: crypto.randomUUID(), name: trimmed, color, kind });
    setName('');
    setColor(pickNextColor([...categories, { id: '', name: '', color, kind }]));
  }

  function renderCategoryList(list: Category[]) {
    return (
      <ul className="category-manager__list">
        {list.map((cat) => (
          <li key={cat.id} className="category-manager__row">
            <span className="category-manager__icon" aria-hidden="true">
              {getCategoryIcon(cat.id)}
            </span>
            <input
              type="color"
              className="category-manager__swatch"
              value={cat.color}
              onChange={(e) => onRecolor(cat.id, e.target.value)}
              aria-label={`Couleur de ${cat.name}`}
            />
            <input
              type="text"
              className="category-manager__name"
              value={cat.name}
              onChange={(e) => onRename(cat.id, e.target.value)}
            />
            {cat.kind === 'depense' && (
              <input
                type="number"
                min={0}
                step="1"
                className="category-manager__budget"
                placeholder="Budget"
                value={cat.budget ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  onSetBudget(cat.id, raw === '' ? undefined : Math.max(0, Number(raw)));
                }}
                aria-label={`Budget mensuel de ${cat.name}`}
                title="Budget mensuel"
              />
            )}
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={() => onDelete(cat.id)}
              disabled={usedCategoryIds.has(cat.id)}
              aria-label={`Supprimer ${cat.name}`}
              title={usedCategoryIds.has(cat.id) ? 'Utilisée par des opérations' : 'Supprimer'}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="panel-title">Catégories</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {missingDefaultsCount > 0 && (
          <button type="button" className="btn category-manager__restore" onClick={onRestoreDefaults}>
            ↩️ Restaurer {missingDefaultsCount} catégorie{missingDefaultsCount > 1 ? 's' : ''} par défaut manquante
            {missingDefaultsCount > 1 ? 's' : ''}
          </button>
        )}

        <h4 className="category-manager__section">💸 Dépenses</h4>
        {renderCategoryList(depenseCategories)}

        <h4 className="category-manager__section">💰 Revenus</h4>
        {renderCategoryList(revenuCategories)}

        <form className="category-manager__add" onSubmit={handleAdd}>
          <div className="segmented segmented--compact" role="radiogroup" aria-label="Type de la nouvelle catégorie">
            <button
              type="button"
              className={kind === 'depense' ? 'segmented__option is-active' : 'segmented__option'}
              onClick={() => setKind('depense')}
              aria-pressed={kind === 'depense'}
            >
              Dépense
            </button>
            <button
              type="button"
              className={kind === 'revenu' ? 'segmented__option is-active' : 'segmented__option'}
              onClick={() => setKind('revenu')}
              aria-pressed={kind === 'revenu'}
            >
              Revenu
            </button>
          </div>
          <div className="category-manager__add-row">
            <input
              type="color"
              className="category-manager__swatch"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Couleur de la nouvelle catégorie"
            />
            <input
              type="text"
              placeholder="Nouvelle catégorie"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn--primary">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function pickNextColor(categories: Category[]): string {
  const used = new Set(categories.map((c) => c.color));
  const next = CATEGORY_PALETTE.find((c) => !used.has(c));
  return next ?? CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length];
}
