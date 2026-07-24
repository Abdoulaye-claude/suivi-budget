import { isCurrentRealMonth, monthLabelFr } from '../lib/date';

interface Props {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthNavigator({ month, onPrev, onNext, onToday }: Props) {
  return (
    <div className="month-nav">
      <button
        type="button"
        className="month-nav__arrow"
        onClick={onPrev}
        aria-label="Mois précédent"
      >
        ‹
      </button>
      <div className="month-nav__center">
        <h2 className="month-nav__label">{monthLabelFr(month)}</h2>
        {!isCurrentRealMonth(month) && (
          <button type="button" className="month-nav__today" onClick={onToday}>
            Aujourd'hui
          </button>
        )}
      </div>
      <button
        type="button"
        className="month-nav__arrow"
        onClick={onNext}
        aria-label="Mois suivant"
      >
        ›
      </button>
    </div>
  );
}
