import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export function todayISO(): string {
  return format(startOfToday(), 'yyyy-MM-dd');
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
