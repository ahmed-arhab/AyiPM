import { eachDateKey, toDateKey } from '@/lib/date';
import type { LeaveRequest, WeekStart } from '@/types';

/** A calendar month; `month` is 0-based like `Date#getMonth`. */
export interface CalendarMonth {
  year: number;
  month: number;
}

export function monthOf(d: Date = new Date()): CalendarMonth {
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  return monthOf(new Date(year, month + delta, 1));
}

export function isSameCalendarMonth(a: CalendarMonth, b: CalendarMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** The `YYYY-MM` prefix shared by every date key in the month. */
export function monthKeyPrefix({ year, month }: CalendarMonth): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/** Date keys for a month grid: whole weeks covering the month, starting on the user's week start. */
export function monthGridKeys({ year, month }: CalendarMonth, weekStart: WeekStart): string[] {
  const firstWeekday = weekStart === 'Sunday' ? 0 : 1;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = (first.getDay() - firstWeekday + 7) % 7;
  const trailing = (firstWeekday + 6 - last.getDay() + 7) % 7;
  return eachDateKey(toDateKey(new Date(year, month, 1 - leading)), toDateKey(new Date(year, month, last.getDate() + trailing)));
}

const isShown = (r: LeaveRequest) => r.status === 'approved' || r.status === 'pending';
const rank = (r: LeaveRequest) => (r.status === 'approved' ? 0 : 1);

/**
 * Approved and pending leave for each day from `fromKey` to `toKey` (rejected leave is left out).
 * Each person appears once per day: approved leave wins over a pending request for the same day.
 * Days are sorted approved first, then by name.
 */
export function leaveByDay(
  requests: LeaveRequest[],
  fromKey: string,
  toKey: string,
  nameOf: (employeeId: string) => string
): Map<string, LeaveRequest[]> {
  const days = new Map<string, Map<string, LeaveRequest>>();
  requests.forEach((r) => {
    if (!isShown(r) || r.endDate < fromKey || r.startDate > toKey) return;
    const start = r.startDate > fromKey ? r.startDate : fromKey;
    const end = r.endDate < toKey ? r.endDate : toKey;
    eachDateKey(start, end).forEach((key) => {
      let people = days.get(key);
      if (!people) {
        people = new Map();
        days.set(key, people);
      }
      const existing = people.get(r.employeeId);
      if (!existing || rank(r) < rank(existing)) people.set(r.employeeId, r);
    });
  });

  const result = new Map<string, LeaveRequest[]>();
  days.forEach((people, key) => {
    result.set(
      key,
      [...people.values()].sort((a, b) => rank(a) - rank(b) || nameOf(a.employeeId).localeCompare(nameOf(b.employeeId)))
    );
  });
  return result;
}
