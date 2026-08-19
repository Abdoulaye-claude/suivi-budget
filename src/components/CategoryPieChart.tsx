import { useState } from 'react';
import { formatAmount } from '../lib/format';
import { getCategoryIcon } from '../data/categoryIcons';

interface PieDatum {
  id: string;
  name: string;
  color: string;
  amount: number;
}

interface Props {
  data: PieDatum[];
  currency: string;
}

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 84;
const STROKE_WIDTH = 34;
const GAP_PX = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_LABEL_PCT = 8;

export function CategoryPieChart({ data, currency }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const filtered = data.filter((d) => d.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = filtered.reduce((sum, d) => sum + d.amount, 0);

  if (filtered.length === 0 || total <= 0) {
    return <p className="empty-state">Aucune dépense pour cette sélection.</p>;
  }

  let cumulativeAngle = 0;
  const segments = filtered.map((d) => {
    const fraction = d.amount / total;
    const pct = fraction * 100;
    const sliceLength = fraction * CIRCUMFERENCE;
    const dashLength = Math.max(sliceLength - GAP_PX, 0);
    const dashArray = `${dashLength} ${CIRCUMFERENCE - dashLength}`;
    const rotation = (cumulativeAngle / CIRCUMFERENCE) * 360 - 90;
    cumulativeAngle += sliceLength;
    return { ...d, pct, dashArray, rotation };
  });

  const hovered = segments.find((s) => s.id === hoverId) ?? null;

  return (
    <div className="pie-chart">
      <div className="pie-chart__figure">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="pie-chart__svg"
          role="img"
          aria-label={`Répartition des dépenses par catégorie : ${segments
            .map((s) => `${s.name} ${Math.round(s.pct)}%`)
            .join(', ')}`}
        >
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--gridline)" strokeWidth={STROKE_WIDTH} />
          {segments.map((s) => (
            <circle
              key={s.id}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={hoverId === s.id ? STROKE_WIDTH + 6 : STROKE_WIDTH}
              strokeDasharray={s.dashArray}
              strokeLinecap="butt"
              transform={`rotate(${s.rotation} ${CENTER} ${CENTER})`}
              className="pie-chart__segment"
              onPointerEnter={() => setHoverId(s.id)}
              onPointerLeave={() => setHoverId((current) => (current === s.id ? null : current))}
              tabIndex={0}
              onFocus={() => setHoverId(s.id)}
              onBlur={() => setHoverId((current) => (current === s.id ? null : current))}
            >
              <title>
                {s.name} — {formatAmount(s.amount, currency)} ({Math.round(s.pct)}%)
              </title>
            </circle>
          ))}

          {segments
            .filter((s) => s.pct >= MIN_LABEL_PCT)
            .map((s) => {
              const midAngle = ((s.rotation + (s.pct / 100) * 180) * Math.PI) / 180;
              const labelRadius = RADIUS;
              const lx = CENTER + labelRadius * Math.cos(midAngle);
              const ly = CENTER + labelRadius * Math.sin(midAngle);
              return (
                <text key={s.id} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="pie-chart__slice-label">
                  {Math.round(s.pct)}%
                </text>
              );
            })}

          <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="pie-chart__center-value">
            {formatAmount(total, currency)}
          </text>
          <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="pie-chart__center-label">
            {hovered ? hovered.name : 'Total'}
          </text>
        </svg>
      </div>

      <ul className="pie-chart__legend">
        {segments.map((s) => (
          <li
            key={s.id}
            className={hoverId === s.id ? 'pie-chart__legend-row is-active' : 'pie-chart__legend-row'}
            onPointerEnter={() => setHoverId(s.id)}
            onPointerLeave={() => setHoverId((current) => (current === s.id ? null : current))}
          >
            <span className="pie-chart__legend-dot" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="pie-chart__legend-icon" aria-hidden="true">
              {getCategoryIcon(s.id)}
            </span>
            <span className="pie-chart__legend-name">{s.name}</span>
            <span className="pie-chart__legend-pct">{Math.round(s.pct)}%</span>
            <span className="pie-chart__legend-amount">{formatAmount(s.amount, currency)}</span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Répartition des dépenses par catégorie</caption>
        <thead>
          <tr>
            <th scope="col">Catégorie</th>
            <th scope="col">Montant</th>
            <th scope="col">Pourcentage</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{formatAmount(s.amount, currency)}</td>
              <td>{Math.round(s.pct)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
