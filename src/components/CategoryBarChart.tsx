import { formatAmount } from '../lib/format';
import { getCategoryIcon } from '../data/categoryIcons';

interface BarDatum {
  id: string;
  name: string;
  color: string;
  amount: number;
}

interface Props {
  data: BarDatum[];
}

export function CategoryBarChart({ data }: Props) {
  const filtered = data.filter((d) => d.amount > 0).sort((a, b) => b.amount - a.amount);
  const max = filtered.reduce((m, d) => Math.max(m, d.amount), 0);

  if (filtered.length === 0) {
    return <p className="empty-state">Aucune dépense pour cette sélection.</p>;
  }

  return (
    <div className="bar-chart" role="img" aria-label="Répartition des dépenses par catégorie">
      {filtered.map((d) => {
        const widthPct = max > 0 ? Math.max((d.amount / max) * 100, 3) : 0;
        return (
          <div className="bar-chart__row" key={d.id}>
            <div className="bar-chart__label">
              <span className="bar-chart__dot" style={{ backgroundColor: d.color }} aria-hidden="true" />
              <span aria-hidden="true">{getCategoryIcon(d.id)}</span>
              <span>{d.name}</span>
            </div>
            <div className="bar-chart__track">
              <div
                className="bar-chart__fill"
                style={{ width: `${widthPct}%`, backgroundColor: d.color }}
              />
            </div>
            <span className="bar-chart__value">{formatAmount(d.amount)}</span>
          </div>
        );
      })}
    </div>
  );
}
