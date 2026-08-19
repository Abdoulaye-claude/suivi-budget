import { useMemo, useRef, useState } from 'react';
import type { Expense } from '../types';
import { isInMonth, monthShortLabelFr, monthsRange } from '../lib/date';
import { formatAmount } from '../lib/format';

interface Props {
  expenses: Expense[];
  currentMonth: Date;
  currency: string;
}

const DEFAULT_MONTHS = 6;
const MIN_MONTHS = 3;
const MAX_MONTHS = 12;

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { left: 68, right: 16, top: 26, bottom: 28 };
const INNER_WIDTH = WIDTH - PAD.left - PAD.right;
const INNER_HEIGHT = HEIGHT - PAD.top - PAD.bottom;

export function ExpenseTrendChart({ expenses, currentMonth, currency }: Props) {
  const [monthsCount, setMonthsCount] = useState(DEFAULT_MONTHS);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(() => {
    const months = monthsRange(currentMonth, monthsCount);
    return months.map((month) => ({
      month,
      total: expenses
        .filter((e) => e.type === 'depense' && e.status === 'reel' && isInMonth(e.date, month))
        .reduce((sum, e) => sum + e.amount, 0),
    }));
  }, [expenses, currentMonth, monthsCount]);

  const maxValue = Math.max(...points.map((p) => p.total), 0);
  const axisMax = niceCeil(maxValue);

  function x(i: number): number {
    if (points.length <= 1) return PAD.left + INNER_WIDTH / 2;
    return PAD.left + (i / (points.length - 1)) * INNER_WIDTH;
  }

  function y(value: number): number {
    if (axisMax <= 0) return PAD.top + INNER_HEIGHT;
    return PAD.top + INNER_HEIGHT - (value / axisMax) * INNER_HEIGHT;
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.total)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${x(points.length - 1)} ${PAD.top + INNER_HEIGHT} L ${x(0)} ${PAD.top + INNER_HEIGHT} Z`
      : '';

  const yTicks = [0, axisMax / 2, axisMax];

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(x(i) - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  }

  const hasData = maxValue > 0;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const lastIndex = points.length - 1;
  const lastPoint = points[lastIndex];

  return (
    <div className="trend-chart" id="trend-chart-capture">
      <div className="chart-header">
        <h3 className="panel-title">Évolution des dépenses</h3>
        <label className="trend-chart__months">
          <span>Mois affichés</span>
          <input
            type="number"
            min={MIN_MONTHS}
            max={MAX_MONTHS}
            value={monthsCount}
            onChange={(e) =>
              setMonthsCount(
                Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Number(e.target.value) || DEFAULT_MONTHS)),
              )
            }
          />
        </label>
      </div>

      {!hasData ? (
        <p className="empty-state">Aucune dépense réalisée sur cette période.</p>
      ) : (
        <>
          <svg
            ref={svgRef}
            className="trend-chart__svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Évolution des dépenses réalisées sur les ${monthsCount} derniers mois, de ${formatAmount(points[0].total, currency)} à ${formatAmount(lastPoint.total, currency)}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--gridline)"
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="trend-chart__axis-label">
                  {formatAmount(Math.round(tick), currency)}
                </text>
              </g>
            ))}

            {points.map((p, i) =>
              i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
                <text
                  key={i}
                  x={x(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="trend-chart__axis-label"
                >
                  {monthShortLabelFr(p.month)}
                </text>
              ) : null,
            )}

            <path d={areaPath} fill="var(--accent)" fillOpacity={0.1} stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(p.total)}
                r={i === lastIndex || i === hoverIndex ? 5 : 3}
                fill="var(--accent)"
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
            ))}

            <text
              x={x(lastIndex)}
              y={y(lastPoint.total) - 12}
              textAnchor="end"
              className="trend-chart__end-label"
            >
              {formatAmount(lastPoint.total, currency)}
            </text>

            {hoverIndex !== null && hovered && (
              <g>
                <line
                  x1={x(hoverIndex)}
                  x2={x(hoverIndex)}
                  y1={PAD.top}
                  y2={PAD.top + INNER_HEIGHT}
                  stroke="var(--baseline)"
                  strokeWidth={1}
                />
                {(() => {
                  const tooltipWidth = 116;
                  const tooltipX =
                    x(hoverIndex) + tooltipWidth + 12 > WIDTH
                      ? x(hoverIndex) - tooltipWidth - 10
                      : x(hoverIndex) + 10;
                  const tooltipY = Math.max(PAD.top, y(hovered.total) - 38);
                  return (
                    <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                      <rect
                        width={tooltipWidth}
                        height={40}
                        rx={8}
                        fill="var(--surface-1)"
                        stroke="var(--border)"
                      />
                      <text x={10} y={17} className="trend-chart__tooltip-value">
                        {formatAmount(hovered.total, currency)}
                      </text>
                      <text x={10} y={31} className="trend-chart__tooltip-label">
                        {monthShortLabelFr(hovered.month)}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>

          <table className="sr-only">
            <caption>Dépenses réalisées par mois</caption>
            <thead>
              <tr>
                <th scope="col">Mois</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <td>{monthShortLabelFr(p.month)}</td>
                  <td>{formatAmount(p.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const residual = value / magnitude;
  let niceResidual: number;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}
