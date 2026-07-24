import { useState } from 'react';
import type { Category } from '../types';
import { CATEGORY_PALETTE } from '../data/defaultCategories';
import { getCategoryIcon } from '../data/categoryIcons';

interface Props {
  categories: Category[];
  usedCategoryIds: Set<string>;
  onAdd: (category: Category) => void;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function CategoryManager({
  categories,
  usedCategoryIds,
  onAdd,
  onRename,
  onRecolor,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(pickNextColor(categories));

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ id: crypto.randomUUID(), name: trimmed, color });
    setName('');
    setColor(pickNextColor([...categories, { id: '', name: '', color }]));
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

        <ul className="category-manager__list">
          {categories.map((cat) => (
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
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => onDelete(cat.id)}
                disabled={usedCategoryIds.has(cat.id)}
                aria-label={`Supprimer ${cat.name}`}
                title={usedCategoryIds.has(cat.id) ? 'Utilisée par des dépenses' : 'Supprimer'}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <form className="category-manager__add" onSubmit={handleAdd}>
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
