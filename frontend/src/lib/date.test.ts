import { describe, expect, it } from 'vitest';
import {
  addDaysKey,
  byNewest,
  daysBetweenInclusive,
  daysUntil,
  eachDateKey,
  endOfMonthKey,
  formatDate,
  formatDayMonth,
  formatDuration,
  formatHours,
  formatRelativeTime,
  groupByDay,
  isOverdue,
  isSameMonth,
  parseDateKey,
  secondsSince,
  startOfMonthKey,
  startOfWeek,
  toDateKey,
  todayInTimeZone,
} from './date';

// vitest.config.ts runs the tests in America/New_York. In 2026 its clocks go forward on 8 March and back on 1 November.
it('runs in the time zone set in vitest.config.ts', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York');
});

describe('toDateKey and parseDateKey', () => {
  it('formats a local date with zero-padded month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('parses a key as local midnight, not UTC midnight', () => {
    const d = parseDateKey('2026-01-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 0, 1, 0]);
  });

  it('round-trips keys on the days the clocks change', () => {
    ['2026-03-08', '2026-11-01'].forEach((key) => expect(toDateKey(parseDateKey(key))).toBe(key));
  });
});

describe('todayInTimeZone', () => {
  it('gives the date in the requested zone, not the machine one', () => {
    const now = new Date('2026-10-22T20:00:00Z');
    expect(todayInTimeZone('UTC', now)).toBe('2026-10-22');
    expect(todayInTimeZone('Asia/Kolkata', now)).toBe('2026-10-23');
    expect(todayInTimeZone('America/Los_Angeles', now)).toBe('2026-10-22');
  });

  it('switches at midnight in that zone', () => {
    // Midnight in Kolkata (UTC+5:30) is 18:30 UTC.
    expect(todayInTimeZone('Asia/Kolkata', new Date('2026-10-22T18:29:59Z'))).toBe('2026-10-22');
    expect(todayInTimeZone('Asia/Kolkata', new Date('2026-10-22T18:30:00Z'))).toBe('2026-10-23');
  });

  it('handles zones a whole day apart from each other', () => {
    const now = new Date('2026-10-22T10:30:00Z');
    expect(todayInTimeZone('Pacific/Kiritimati', now)).toBe('2026-10-23');
    expect(todayInTimeZone('Pacific/Pago_Pago', now)).toBe('2026-10-21');
  });

  it('rolls over the year', () => {
    expect(todayInTimeZone('Asia/Tokyo', new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });

  it('falls back to the local date for a zone it does not know', () => {
    const now = new Date(2026, 9, 22, 12);
    expect(todayInTimeZone('Not/A_Zone', now)).toBe('2026-10-22');
    expect(todayInTimeZone('', now)).toBe('2026-10-22');
  });
});

describe('addDaysKey', () => {
  it('adds and subtracts days', () => {
    expect(addDaysKey('2026-10-22', 1)).toBe('2026-10-23');
    expect(addDaysKey('2026-10-22', -1)).toBe('2026-10-21');
    expect(addDaysKey('2026-10-22', 0)).toBe('2026-10-22');
    expect(addDaysKey('2026-01-01', 365)).toBe('2027-01-01');
  });

  it('crosses month, year and leap-day boundaries', () => {
    expect(addDaysKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysKey('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('moves one calendar day at a time across daylight saving changes', () => {
    expect(addDaysKey('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysKey('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDaysKey('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDaysKey('2026-10-31', 2)).toBe('2026-11-02');
  });
});

describe('startOfMonthKey', () => {
  it('gives the first day of the month', () => {
    expect(startOfMonthKey('2026-10-22')).toBe('2026-10-01');
    expect(startOfMonthKey('2026-10-01')).toBe('2026-10-01');
  });

  it('offsets by whole months across years', () => {
    expect(startOfMonthKey('2026-10-22', -1)).toBe('2026-09-01');
    expect(startOfMonthKey('2026-01-15', -1)).toBe('2025-12-01');
    expect(startOfMonthKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(startOfMonthKey('2026-10-22', -12)).toBe('2025-10-01');
  });

  it('does not skip a short month when starting from the 31st', () => {
    expect(startOfMonthKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(startOfMonthKey('2026-03-31', -1)).toBe('2026-02-01');
  });
});

describe('endOfMonthKey', () => {
  it('gives the last day of 30- and 31-day months', () => {
    expect(endOfMonthKey('2026-10-22')).toBe('2026-10-31');
    expect(endOfMonthKey('2026-04-01')).toBe('2026-04-30');
    expect(endOfMonthKey('2026-12-05')).toBe('2026-12-31');
  });

  it('follows the leap-year rules for February', () => {
    expect(endOfMonthKey('2026-02-10')).toBe('2026-02-28');
    expect(endOfMonthKey('2028-02-10')).toBe('2028-02-29');
    expect(endOfMonthKey('2100-02-01')).toBe('2100-02-28');
    expect(endOfMonthKey('2000-02-01')).toBe('2000-02-29');
  });
});

describe('daysBetweenInclusive', () => {
  it('counts both ends', () => {
    expect(daysBetweenInclusive('2026-10-22', '2026-10-22')).toBe(1);
    expect(daysBetweenInclusive('2026-10-22', '2026-10-23')).toBe(2);
    expect(daysBetweenInclusive('2026-01-30', '2026-02-02')).toBe(4);
  });

  it('counts leap years', () => {
    expect(daysBetweenInclusive('2026-01-01', '2026-12-31')).toBe(365);
    expect(daysBetweenInclusive('2028-01-01', '2028-12-31')).toBe(366);
  });

  it('is 0 when the end is before the start or a key is invalid', () => {
    expect(daysBetweenInclusive('2026-10-23', '2026-10-22')).toBe(0);
    expect(daysBetweenInclusive('not-a-date', '2026-10-22')).toBe(0);
    expect(daysBetweenInclusive('2026-10-22', 'not-a-date')).toBe(0);
  });

  it('counts the 23- and 25-hour days when the clocks change as whole days', () => {
    expect(daysBetweenInclusive('2026-03-08', '2026-03-09')).toBe(2);
    expect(daysBetweenInclusive('2026-03-01', '2026-03-31')).toBe(31);
    expect(daysBetweenInclusive('2026-11-01', '2026-11-02')).toBe(2);
    expect(daysBetweenInclusive('2026-10-01', '2026-11-30')).toBe(61);
  });
});

describe('eachDateKey', () => {
  it('lists every day in the range, both ends included', () => {
    expect(eachDateKey('2026-10-22', '2026-10-22')).toEqual(['2026-10-22']);
    expect(eachDateKey('2028-02-27', '2028-03-01')).toEqual(['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01']);
  });

  it('is empty when the end is before the start', () => {
    expect(eachDateKey('2026-10-23', '2026-10-22')).toEqual([]);
  });

  it('neither repeats nor skips a day when the clocks change', () => {
    expect(eachDateKey('2026-03-07', '2026-03-10')).toEqual(['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);
    expect(eachDateKey('2026-10-31', '2026-11-02')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('covers a whole year with distinct days', () => {
    const keys = eachDateKey('2026-01-01', '2026-12-31');
    expect(keys).toHaveLength(365);
    expect(new Set(keys).size).toBe(365);
    expect(keys.at(-1)).toBe('2026-12-31');
  });
});

describe('startOfWeek', () => {
  const thursday = new Date(2026, 9, 22, 15, 30);

  it('returns local midnight on the first day of the week', () => {
    const start = startOfWeek(thursday, 'Monday');
    expect(toDateKey(start)).toBe('2026-10-19');
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(toDateKey(startOfWeek(thursday, 'Sunday'))).toBe('2026-10-18');
  });

  it('starts weeks on Monday by default', () => {
    expect(startOfWeek(thursday)).toEqual(startOfWeek(thursday, 'Monday'));
  });

  it('keeps a day that is already the first day of the week', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 9, 19, 23, 59), 'Monday'))).toBe('2026-10-19');
    expect(toDateKey(startOfWeek(new Date(2026, 9, 18, 0, 0), 'Sunday'))).toBe('2026-10-18');
  });

  it('goes back six days from the last day of the week', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 9, 25), 'Monday'))).toBe('2026-10-19');
    expect(toDateKey(startOfWeek(new Date(2026, 9, 24), 'Sunday'))).toBe('2026-10-18');
  });

  it('crosses the year boundary', () => {
    expect(toDateKey(startOfWeek(new Date(2027, 0, 1), 'Monday'))).toBe('2026-12-28');
  });

  it('lands on midnight of the right day in weeks with a clock change', () => {
    const afterFallBack = startOfWeek(new Date(2026, 10, 4, 12), 'Sunday');
    expect(toDateKey(afterFallBack)).toBe('2026-11-01');
    expect(afterFallBack.getHours()).toBe(0);
    const afterSpringForward = startOfWeek(new Date(2026, 2, 10, 12), 'Sunday');
    expect(toDateKey(afterSpringForward)).toBe('2026-03-08');
    expect(afterSpringForward.getHours()).toBe(0);
  });

  it('does not change the date passed in', () => {
    const d = new Date(thursday);
    startOfWeek(d, 'Sunday');
    expect(d).toEqual(thursday);
  });
});

describe('daysUntil and isOverdue', () => {
  it('compares calendar days, ignoring the time of day', () => {
    const lateEvening = new Date(2026, 9, 22, 23, 59);
    expect(daysUntil('2026-10-22', lateEvening)).toBe(0);
    expect(daysUntil('2026-10-23', lateEvening)).toBe(1);
    expect(daysUntil('2026-10-21', new Date(2026, 9, 22, 0, 1))).toBe(-1);
  });

  it('counts whole days across a clock change', () => {
    expect(daysUntil('2026-03-09', new Date(2026, 2, 7, 23))).toBe(2);
    expect(daysUntil('2026-11-02', new Date(2026, 9, 31, 1))).toBe(2);
  });

  it('is overdue only from the day after the date', () => {
    const now = new Date(2026, 9, 22, 18);
    expect(isOverdue('2026-10-22', now)).toBe(false);
    expect(isOverdue('2026-10-21', now)).toBe(true);
  });
});

describe('isSameMonth', () => {
  it('matches the month and the year', () => {
    const ref = new Date(2026, 9, 31, 23);
    expect(isSameMonth('2026-10-01', ref)).toBe(true);
    expect(isSameMonth('2026-11-01', ref)).toBe(false);
    expect(isSameMonth('2025-10-15', ref)).toBe(false);
  });
});

describe('formatDate and formatDayMonth', () => {
  it('formats a date key in each date format', () => {
    expect(formatDate('2026-03-08')).toBe('2026-03-08');
    expect(formatDate('2026-03-08', 'DD/MM/YYYY')).toBe('08/03/2026');
    expect(formatDate('2026-03-08', 'MM/DD/YYYY')).toBe('03/08/2026');
  });

  it('keeps the day of a date key instead of reading it as UTC midnight', () => {
    // new Date('2026-01-01') is UTC midnight, which is still 31 December in New York.
    expect(formatDate('2026-01-01')).toBe('2026-01-01');
  });

  it('shows timestamps on their local day', () => {
    expect(formatDate('2026-03-10T03:30:00Z')).toBe('2026-03-09');
    expect(formatDate(new Date(2026, 11, 31, 23, 59), 'DD/MM/YYYY')).toBe('31/12/2026');
  });

  it('shows a dash for missing or invalid values', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('not a date')).toBe('—');
    expect(formatDayMonth(undefined)).toBe('—');
  });

  it('drops the year and keeps the order of the format', () => {
    expect(formatDayMonth('2026-03-08')).toBe('03-08');
    expect(formatDayMonth('2026-03-08', 'DD/MM/YYYY')).toBe('08/03');
    expect(formatDayMonth('2026-03-08', 'MM/DD/YYYY')).toBe('03/08');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-22T16:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it('says "Just now" for the first 45 seconds, and for times slightly in the future', () => {
    expect(formatRelativeTime(ago(0), now)).toBe('Just now');
    expect(formatRelativeTime(ago(44 * SECOND), now)).toBe('Just now');
    expect(formatRelativeTime(ago(-30 * SECOND), now)).toBe('Just now');
  });

  it('never shows "0m ago"', () => {
    expect(formatRelativeTime(ago(45 * SECOND), now)).toBe('1m ago');
    expect(formatRelativeTime(ago(59 * SECOND), now)).toBe('1m ago');
  });

  it('uses minutes, hours and days as the gap grows', () => {
    expect(formatRelativeTime(ago(5 * MINUTE), now)).toBe('5m ago');
    expect(formatRelativeTime(ago(59 * MINUTE), now)).toBe('59m ago');
    expect(formatRelativeTime(ago(HOUR), now)).toBe('1h ago');
    expect(formatRelativeTime(ago(23 * HOUR), now)).toBe('23h ago');
    expect(formatRelativeTime(ago(DAY), now)).toBe('Yesterday');
    expect(formatRelativeTime(ago(6 * DAY), now)).toBe('6d ago');
  });

  it('shows the date from a week ago', () => {
    expect(formatRelativeTime(ago(7 * DAY), now)).toBe('Oct 15');
  });

  it('shows a dash for an invalid timestamp', () => {
    expect(formatRelativeTime('soon', now)).toBe('—');
  });
});

describe('secondsSince and formatDuration', () => {
  const now = new Date('2026-10-22T09:00:00Z');

  it('counts whole seconds and never goes negative', () => {
    expect(secondsSince('2026-10-22T08:58:30Z', now)).toBe(90);
    expect(secondsSince('2026-10-22T08:59:58.500Z', now)).toBe(1);
    expect(secondsSince('2026-10-22T09:00:05Z', now)).toBe(0);
    expect(secondsSince('not a date', now)).toBe(0);
  });

  it('formats a duration as hours, minutes and seconds', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatDuration(59.9)).toBe('00:00:59');
    expect(formatDuration(-5)).toBe('00:00:00');
    expect(formatDuration(100 * 3600)).toBe('100:00:00');
  });
});

describe('formatHours', () => {
  it('shows a dash when there is nothing to show', () => {
    [undefined, Number.NaN, 0, -1].forEach((hours) => expect(formatHours(hours)).toBe('—'));
  });

  it('shows minutes below an hour, at least one', () => {
    expect(formatHours(0.5)).toBe('30 mins');
    expect(formatHours(1 / 60)).toBe('1 min');
    expect(formatHours(0.001)).toBe('1 min');
  });

  it('shows hours to one decimal place', () => {
    expect(formatHours(1)).toBe('1.0 hrs');
    expect(formatHours(7.56)).toBe('7.6 hrs');
  });
});

describe('byNewest', () => {
  it('sorts newest first', () => {
    const items = [{ createdAt: '2026-10-20T10:00:00Z' }, { createdAt: '2026-10-22T10:00:00Z' }, { createdAt: '2026-10-21T10:00:00Z' }];
    expect([...items].sort(byNewest).map((i) => i.createdAt.slice(0, 10))).toEqual(['2026-10-22', '2026-10-21', '2026-10-20']);
  });
});

describe('groupByDay', () => {
  const now = new Date(2026, 9, 22, 9, 0);
  const at = (...parts: [number, number, number, number?, number?]) => ({ createdAt: new Date(...parts).toISOString() });

  it('returns no groups for no items', () => {
    expect(groupByDay([], now)).toEqual([]);
  });

  it('groups items by local day and labels the days', () => {
    const items = [at(2026, 9, 22, 8), at(2026, 9, 22, 0, 5), at(2026, 9, 21, 23, 30), at(2026, 9, 15, 12), at(2025, 11, 31, 10)];
    const groups = groupByDay(items, now);
    expect(groups.map((g) => [g.key, g.label, g.items.length])).toEqual([
      ['2026-10-22', 'Today', 2],
      ['2026-10-21', 'Yesterday', 1],
      ['2026-10-15', 'Thursday, Oct 15', 1],
      ['2025-12-31', 'Wednesday, Dec 31, 2025', 1],
    ]);
    expect(groups[0].items).toEqual([items[0], items[1]]);
  });

  it('uses the local day, not the UTC one', () => {
    // 02:30 UTC on the 22nd is 22:30 on the 21st in New York.
    const [group] = groupByDay([{ createdAt: '2026-10-22T02:30:00Z' }], now);
    expect(group.key).toBe('2026-10-21');
    expect(group.label).toBe('Yesterday');
  });

  it('keeps one group per day even when the items are not in order', () => {
    const items = [at(2026, 9, 22, 8), at(2026, 9, 20, 8), at(2026, 9, 22, 7)];
    const groups = groupByDay(items, now);
    expect(groups.map((g) => g.key)).toEqual(['2026-10-22', '2026-10-20']);
    expect(groups[0].items).toEqual([items[0], items[2]]);
  });

  it('finds yesterday across a month boundary and a clock change', () => {
    const [group] = groupByDay([at(2026, 9, 31, 20)], new Date(2026, 10, 1, 8));
    expect(group.label).toBe('Yesterday');
  });

  it('puts items with an invalid date in an "Unknown date" group', () => {
    const groups = groupByDay([{ createdAt: 'garbage' }, at(2026, 9, 22, 8)], now);
    expect(groups.map((g) => [g.key, g.label])).toEqual([
      ['unknown', 'Unknown date'],
      ['2026-10-22', 'Today'],
    ]);
  });
});
