import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ExpenseStatus } from '../types';

export function todayISO(): string {
  return format(startOfToday(), 'yyyy-MM-dd');
}

export function tomorrowISO(): string {
  return format(addDays(startOfToday(), 1), 'yyyy-MM-dd');
}

export function statusForDate(iso: string): ExpenseStatus {
  return iso > todayISO() ? 'prevu' : 'reel';
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function monthLabelFr(month: Date): string {
  const label = format(month, 'MMMM yyyy', { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthShortLabelFr(month: Date): string {
  const label = format(month, 'MMM yy', { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthsRange(end: Date, count: number): Date[] {
  const endMonth = startOfMonth(end);
  return Array.from({ length: count }, (_, i) => subMonths(endMonth, count - 1 - i));
}

export function dayLabelFr(iso: string): string {
  return format(parseISO(iso), 'd MMM', { locale: fr });
}

export function addMonthsIso(iso: string, months: number): string {
  return toISODate(addMonths(parseISO(iso), months));
}

export function nextMonth(month: Date): Date {
  return startOfMonth(addMonths(month, 1));
}

export function previousMonth(month: Date): Date {
  return startOfMonth(subMonths(month, 1));
}

export function isInMonth(iso: string, month: Date): boolean {
  return isSameMonth(parseISO(iso), month);
}

export function isCurrentRealMonth(month: Date): boolean {
  return isSameMonth(month, startOfToday());
}

export function currentMonthStart(): Date {
  return startOfMonth(startOfToday());
}
