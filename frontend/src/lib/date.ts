import type { DateFormat, TimeFormat } from '@/types';

const MS_PER_DAY = 86_400_000;

export function toDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Today's date key in a time zone, such as the workspace's, which the server dates attendance in. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    return toDateKey(now);
  }
}

export function addDaysKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** The first day of the month `offset` months from the one `dateKey` is in, e.g. (2026-10-22, -1) → 2026-09-01. */
export function startOfMonthKey(dateKey: string, offset = 0): string {
  const d = parseDateKey(dateKey);
  return toDateKey(new Date(d.getFullYear(), d.getMonth() + offset, 1));
}

export function endOfMonthKey(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function formatDate(value: string | Date | undefined, format: DateFormat = 'YYYY-MM-DD'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? (value.length === 10 ? parseDateKey(value) : new Date(value)) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (format === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
  if (format === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateLong(value: string | Date | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? (value.length === 10 ? parseDateKey(value) : new Date(value)) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value: string | Date | undefined, format: TimeFormat = '12h', withSeconds = false, locale = 'en-US'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: format === '12h',
  });
}

export function formatDateTime(value: string | undefined, dateFormat: DateFormat = 'YYYY-MM-DD', timeFormat: TimeFormat = '12h', locale = 'en-US'): string {
  if (!value) return '—';
  return `${formatDate(value, dateFormat)} ${formatTime(value, timeFormat, false, locale)}`;
}

export function formatRelativeTime(iso: string, now: Date = new Date(), locale = 'en-US'): string {
  const past = new Date(iso);
  if (Number.isNaN(past.getTime())) return '—';
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function secondsSince(startIso: string, now: Date = new Date()): number {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function formatHours(hours?: number): string {
  if (hours === undefined || Number.isNaN(hours) || hours <= 0) return '—';
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  return `${hours.toFixed(1)} hrs`;
}

export function graceDeadlineLabel(workDayStart: string, graceMinutes: number): string {
  const [h, m] = workDayStart.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, (m || 0) + graceMinutes, 0, 0);
  return formatTime(d, '24h');
}

export function daysBetweenInclusive(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey).getTime();
  const end = parseDateKey(endKey).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

export function eachDateKey(startKey: string, endKey: string): string[] {
  const days = daysBetweenInclusive(startKey, endKey);
  const start = parseDateKey(startKey);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateKey(d);
  });
}

export function daysUntil(dateKey: string, from: Date = new Date()): number {
  const target = parseDateKey(dateKey).getTime();
  const today = parseDateKey(toDateKey(from)).getTime();
  return Math.round((target - today) / MS_PER_DAY);
}

export function isOverdue(dateKey: string, from: Date = new Date()): boolean {
  return daysUntil(dateKey, from) < 0;
}

export function monthLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function isSameMonth(dateKey: string, ref: Date = new Date()): boolean {
  const d = parseDateKey(dateKey);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function byNewest<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

const UNKNOWN_DAY = 'unknown';

export function dayLabel(key: string, now: Date = new Date()): string {
  if (key === UNKNOWN_DAY) return 'Unknown date';
  if (key === toDateKey(now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === toDateKey(yesterday)) return 'Yesterday';
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function groupByDay<T extends { createdAt: string }>(items: T[], now: Date = new Date()): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  const index = new Map<string, DayGroup<T>>();
  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const key = Number.isNaN(date.getTime()) ? UNKNOWN_DAY : toDateKey(date);
    let group = index.get(key);
    if (!group) {
      group = { key, label: dayLabel(key, now), items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups;
}
