import { describe, expect, it } from 'vitest';
import type { LeaveRequest, WeekStart } from '@/types';
import { isSameCalendarMonth, leaveByDay, monthGridKeys, monthKeyPrefix, monthOf, shiftMonth } from './calendar';

describe('monthOf, shiftMonth and isSameCalendarMonth', () => {
  it('reads the local month, 0-based', () => {
    expect(monthOf(new Date(2026, 9, 22))).toEqual({ year: 2026, month: 9 });
    expect(monthOf(new Date(2026, 11, 31, 23, 59))).toEqual({ year: 2026, month: 11 });
  });

  it('shifts across year boundaries in both directions', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 9 }, -22)).toEqual({ year: 2024, month: 11 });
    expect(shiftMonth({ year: 2026, month: 9 }, 0)).toEqual({ year: 2026, month: 9 });
  });

  it('compares the year as well as the month', () => {
    expect(isSameCalendarMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(isSameCalendarMonth({ year: 2026, month: 9 }, { year: 2025, month: 9 })).toBe(false);
  });
});

describe('monthKeyPrefix', () => {
  it('pads the 1-based month', () => {
    expect(monthKeyPrefix({ year: 2026, month: 0 })).toBe('2026-01');
    expect(monthKeyPrefix({ year: 2026, month: 11 })).toBe('2026-12');
  });
});

describe('monthGridKeys', () => {
  it('pads October 2026 to whole weeks for each week start', () => {
    // 1 October 2026 is a Thursday and the 31st a Saturday.
    const monday = monthGridKeys({ year: 2026, month: 9 }, 'Monday');
    expect([monday.length, monday[0], monday.at(-1)]).toEqual([35, '2026-09-28', '2026-11-01']);
    const sunday = monthGridKeys({ year: 2026, month: 9 }, 'Sunday');
    expect([sunday.length, sunday[0], sunday.at(-1)]).toEqual([35, '2026-09-27', '2026-10-31']);
  });

  it('adds no padding to a month that fills exactly four weeks', () => {
    // February 2026 starts on a Sunday and ends on a Saturday.
    const keys = monthGridKeys({ year: 2026, month: 1 }, 'Sunday');
    expect([keys.length, keys[0], keys.at(-1)]).toEqual([28, '2026-02-01', '2026-02-28']);
    expect(monthGridKeys({ year: 2026, month: 1 }, 'Monday')).toHaveLength(35);
  });

  it('uses six rows when the month needs them', () => {
    // August 2026 starts on a Saturday and ends on a Monday.
    const keys = monthGridKeys({ year: 2026, month: 7 }, 'Monday');
    expect([keys.length, keys[0], keys.at(-1)]).toEqual([42, '2026-07-27', '2026-09-06']);
  });

  const utcDay = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  const months = Array.from({ length: 36 }, (_, i) => ({ year: 2026 + Math.floor(i / 12), month: i % 12 }));
  const cases = months.flatMap((month) =>
    (['Monday', 'Sunday'] as WeekStart[]).map((weekStart) => ({ ...month, label: monthKeyPrefix(month), weekStart }))
  );

  it.each(cases)('covers $label in whole weeks starting on $weekStart', ({ year, month, weekStart }) => {
    const keys = monthGridKeys({ year, month }, weekStart);
    expect(keys.length % 7).toBe(0);
    expect(keys.length).toBeGreaterThanOrEqual(28);
    expect(keys.length).toBeLessThanOrEqual(42);
    // Consecutive calendar days, counted without the local time zone, so no day repeats or goes missing at a DST change.
    keys.slice(1).forEach((key, i) => expect(utcDay(key) - utcDay(keys[i])).toBe(1));
    expect(new Date(utcDay(keys[0]) * 86_400_000).getUTCDay()).toBe(weekStart === 'Sunday' ? 0 : 1);
    const prefix = monthKeyPrefix({ year, month });
    const inMonth = keys.filter((key) => key.startsWith(prefix));
    expect(inMonth[0]).toBe(`${prefix}-01`);
    expect(inMonth).toHaveLength(new Date(year, month + 1, 0).getDate());
    // Fewer than a week of padding on each side.
    expect(keys.indexOf(inMonth[0])).toBeLessThan(7);
    expect(keys.length - 1 - keys.indexOf(inMonth.at(-1)!)).toBeLessThan(7);
  });
});

describe('leaveByDay', () => {
  const names: Record<string, string> = { zoe: 'Zoe', adam: 'Adam', bea: 'Bea', cleo: 'Cleo' };
  const nameOf = (id: string) => names[id] ?? id;
  let nextId = 0;
  const leave = (employeeId: string, status: LeaveRequest['status'], startDate: string, endDate = startDate): LeaveRequest => {
    nextId += 1;
    return { id: `r${nextId}`, employeeId, leaveType: 'Annual', startDate, endDate, days: 1, reason: '', status, appliedOn: '2026-09-01' };
  };
  const summary = (byDay: Map<string, LeaveRequest[]>) =>
    Object.fromEntries([...byDay].map(([key, list]) => [key, list.map((r) => `${r.employeeId}:${r.status}`)]));

  it('is empty when there is no leave', () => {
    expect(leaveByDay([], '2026-10-01', '2026-10-31', nameOf).size).toBe(0);
  });

  it('lists approved and pending leave on every day it covers, and leaves out rejected leave', () => {
    const requests = [
      leave('zoe', 'approved', '2026-10-20', '2026-10-21'),
      leave('adam', 'pending', '2026-10-21'),
      leave('bea', 'rejected', '2026-10-21'),
    ];
    expect(summary(leaveByDay(requests, '2026-10-01', '2026-10-31', nameOf))).toEqual({
      '2026-10-20': ['zoe:approved'],
      '2026-10-21': ['zoe:approved', 'adam:pending'],
    });
  });

  it('clips leave to the range and skips leave outside it', () => {
    const requests = [
      leave('zoe', 'approved', '2026-09-29', '2026-10-02'),
      leave('adam', 'approved', '2026-10-31', '2026-11-03'),
      leave('bea', 'approved', '2026-09-01', '2026-09-30'),
      leave('cleo', 'approved', '2026-11-02'),
    ];
    expect([...leaveByDay(requests, '2026-10-01', '2026-11-01', nameOf).keys()].sort()).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('includes leave that starts or ends exactly on the edges of the range', () => {
    const requests = [leave('zoe', 'approved', '2026-09-28', '2026-10-01'), leave('adam', 'pending', '2026-10-31', '2026-11-02')];
    expect(summary(leaveByDay(requests, '2026-10-01', '2026-10-31', nameOf))).toEqual({
      '2026-10-01': ['zoe:approved'],
      '2026-10-31': ['adam:pending'],
    });
  });

  it('shows each person once a day, preferring approved leave over a pending request', () => {
    const requests = [
      leave('zoe', 'pending', '2026-10-22', '2026-10-23'),
      leave('zoe', 'approved', '2026-10-21', '2026-10-22'),
      leave('adam', 'approved', '2026-10-22'),
      leave('adam', 'pending', '2026-10-22'),
    ];
    const byDay = leaveByDay(requests, '2026-10-01', '2026-10-31', nameOf);
    expect(summary(byDay)).toEqual({
      '2026-10-21': ['zoe:approved'],
      '2026-10-22': ['adam:approved', 'zoe:approved'],
      '2026-10-23': ['zoe:pending'],
    });
    expect(byDay.get('2026-10-22')?.map((r) => r.id)).toEqual([requests[2].id, requests[1].id]);
  });

  it('sorts each day approved first, then by name', () => {
    const requests = [
      leave('zoe', 'pending', '2026-10-22'),
      leave('cleo', 'approved', '2026-10-22'),
      leave('adam', 'pending', '2026-10-22'),
      leave('bea', 'approved', '2026-10-22'),
    ];
    expect(summary(leaveByDay(requests, '2026-10-22', '2026-10-22', nameOf))).toEqual({
      '2026-10-22': ['bea:approved', 'cleo:approved', 'adam:pending', 'zoe:pending'],
    });
  });

  it('keeps every day of leave that spans a daylight saving change', () => {
    const byDay = leaveByDay([leave('zoe', 'approved', '2026-10-31', '2026-11-02')], '2026-10-26', '2026-11-08', nameOf);
    expect([...byDay.keys()]).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
  });
});
