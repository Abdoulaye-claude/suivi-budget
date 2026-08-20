import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addMonthsIso,
  currentMonthStart,
  dayLabelFr,
  isCurrentRealMonth,
  isInMonth,
  monthLabelFr,
  monthShortLabelFr,
  monthsRange,
  nextMonth,
  parseISODate,
  previousMonth,
  statusForDate,
  todayISO,
  tomorrowISO,
  toISODate,
} from './date';

describe('date helpers with a fixed clock (2026-08-19)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19)); // 19 août 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('todayISO returns today in yyyy-MM-dd', () => {
    expect(todayISO()).toBe('2026-08-19');
  });

  it('tomorrowISO returns the next calendar day', () => {
    expect(tomorrowISO()).toBe('2026-08-20');
  });

  it('tomorrowISO rolls over to the next month correctly', () => {
    vi.setSystemTime(new Date(2026, 7, 31)); // 31 août
    expect(tomorrowISO()).toBe('2026-09-01');
  });

  describe('statusForDate', () => {
    it('marks a past date as realized', () => {
      expect(statusForDate('2026-08-01')).toBe('reel');
    });

    it('marks today as realized', () => {
      expect(statusForDate('2026-08-19')).toBe('reel');
    });

    it('marks a future date as planned', () => {
      expect(statusForDate('2026-08-20')).toBe('prevu');
    });
  });

  it('currentMonthStart returns the first day of the current month', () => {
    expect(toISODate(currentMonthStart())).toBe('2026-08-01');
  });

  it('isCurrentRealMonth is true for the current month and false otherwise', () => {
    expect(isCurrentRealMonth(new Date(2026, 7, 1))).toBe(true);
    expect(isCurrentRealMonth(new Date(2026, 8, 1))).toBe(false);
  });
});

describe('date helpers independent of the clock', () => {
  it('toISODate / parseISODate round-trip', () => {
    const iso = '2026-03-05';
    expect(toISODate(parseISODate(iso))).toBe(iso);
  });

  it('addMonthsIso adds whole months, including year rollover', () => {
    expect(addMonthsIso('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonthsIso('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonthsIso('2026-06-15', -2)).toBe('2026-04-15');
  });

  it('nextMonth / previousMonth normalize to the 1st and roll over years', () => {
    expect(toISODate(nextMonth(new Date(2026, 11, 15)))).toBe('2027-01-01');
    expect(toISODate(previousMonth(new Date(2026, 0, 15)))).toBe('2025-12-01');
  });

  it('isInMonth matches only dates within the given month', () => {
    const month = new Date(2026, 7, 1); // août 2026
    expect(isInMonth('2026-08-01', month)).toBe(true);
    expect(isInMonth('2026-08-31', month)).toBe(true);
    expect(isInMonth('2026-07-31', month)).toBe(false);
    expect(isInMonth('2026-09-01', month)).toBe(false);
  });

  it('monthsRange returns `count` consecutive months ending at `end`, ascending', () => {
    const range = monthsRange(new Date(2026, 7, 15), 3); // ends in August 2026
    expect(range.map(toISODate)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
  });

  it('monthsRange handles a single month', () => {
    const range = monthsRange(new Date(2026, 0, 10), 1);
    expect(range.map(toISODate)).toEqual(['2026-01-01']);
  });

  it('monthLabelFr capitalizes the French month name', () => {
    expect(monthLabelFr(new Date(2026, 7, 1))).toBe('Août 2026');
  });

  it('monthShortLabelFr capitalizes the short French month label', () => {
    expect(monthShortLabelFr(new Date(2026, 7, 1))).toBe('Août 26');
  });

  it('dayLabelFr formats a day and short month', () => {
    expect(dayLabelFr('2026-08-05')).toBe('5 août');
  });
});
