import { describe, expect, it } from 'vitest';
import type { Task, TaskHistoryEntry } from '@/types';
import { countCompletionsByWeek, taskCompletedAt } from './utils';

let nextId = 0;

function entry(action: string, createdAt: string): TaskHistoryEntry {
  nextId += 1;
  return { id: `h${nextId}`, actorId: 'u1', action, createdAt };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  nextId += 1;
  return {
    id: `t${nextId}`,
    projectId: 'p1',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'done',
    dueDate: '2026-10-30',
    order: 0,
    comments: [],
    history: [],
    createdBy: 'u1',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
    ...overrides,
  };
}

/** A done task whose history says it was completed at `when` (a local date, as people read the chart). */
const completedAt = (when: Date, overrides: Partial<Task> = {}) =>
  makeTask({ history: [entry('Created task', '2026-01-01T09:00:00Z'), entry('Moved to Completed', when.toISOString())], ...overrides });

describe('taskCompletedAt', () => {
  const now = new Date('2026-10-22T16:00:00Z');

  it('is undefined for a task that is not done', () => {
    const task = makeTask({
      status: 'review',
      history: [entry('Moved to Completed', '2026-10-10T12:00:00Z'), entry('Moved to Review', '2026-10-11T12:00:00Z')],
    });
    expect(taskCompletedAt(task, now)).toBeUndefined();
  });

  it('reads the time the task was moved to Completed', () => {
    const task = makeTask({
      history: [
        entry('Created task', '2026-10-01T09:00:00Z'),
        entry('Moved to In Progress', '2026-10-05T09:00:00Z'),
        entry('Moved to Completed', '2026-10-10T12:00:00Z'),
        entry('Priority set to High', '2026-10-12T09:00:00Z'),
      ],
    });
    expect(taskCompletedAt(task, now)).toEqual(new Date('2026-10-10T12:00:00Z'));
  });

  it('uses the latest completion of a task that was reopened, whatever order the history is in', () => {
    const task = makeTask({
      history: [
        entry('Moved to Completed', '2026-10-15T12:00:00Z'),
        entry('Moved to Review', '2026-10-12T12:00:00Z'),
        entry('Moved to Completed', '2026-10-10T12:00:00Z'),
      ],
    });
    expect(taskCompletedAt(task, now)).toEqual(new Date('2026-10-15T12:00:00Z'));
  });

  it('uses the creation time of a task created straight into Completed', () => {
    const task = makeTask({
      createdAt: '2026-10-03T09:00:00Z',
      history: [entry('Created task', '2026-10-03T09:00:00Z'), entry('Moved to project Website', '2026-10-20T09:00:00Z')],
    });
    expect(taskCompletedAt(task, now)).toEqual(new Date('2026-10-03T09:00:00Z'));
  });

  it('uses now when the board has moved the task to done before its history caught up', () => {
    const task = makeTask({ history: [entry('Moved to Review', '2026-10-20T09:00:00Z')] });
    expect(taskCompletedAt(task, now)).toEqual(now);
  });

  it('never returns a time after now, even if the server clock is ahead', () => {
    const task = makeTask({ history: [entry('Moved to Completed', '2026-10-22T16:05:00Z')] });
    expect(taskCompletedAt(task, now)).toEqual(now);
  });

  it('skips history entries with an invalid time', () => {
    const task = makeTask({ history: [entry('Moved to Completed', '2026-10-10T12:00:00Z'), entry('Moved to Review', 'garbage')] });
    expect(taskCompletedAt(task, now)).toEqual(new Date('2026-10-10T12:00:00Z'));
  });

  it('is undefined when there is no valid time at all', () => {
    expect(taskCompletedAt(makeTask({ createdAt: 'garbage' }), now)).toBeUndefined();
  });
});

describe('countCompletionsByWeek', () => {
  // Thursday 22 October 2026, mid-afternoon in New York.
  const now = new Date(2026, 9, 22, 15);

  it('lists the last eight weeks, oldest first, ending with this week', () => {
    expect(countCompletionsByWeek([], 'Monday', now)).toEqual(
      ['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19'].map((weekStart) => ({
        weekStart,
        count: 0,
      }))
    );
    expect(countCompletionsByWeek([], 'Sunday', now).map((w) => w.weekStart)).toEqual([
      '2026-08-30',
      '2026-09-06',
      '2026-09-13',
      '2026-09-20',
      '2026-09-27',
      '2026-10-04',
      '2026-10-11',
      '2026-10-18',
    ]);
  });

  it('takes the number of weeks to show', () => {
    expect(countCompletionsByWeek([], 'Monday', now, 1)).toEqual([{ weekStart: '2026-10-19', count: 0 }]);
    expect(countCompletionsByWeek([], 'Monday', now, 0)).toEqual([]);
  });

  it('puts each completion in the week it falls in, using the week start', () => {
    const tasks = [
      completedAt(new Date(2026, 9, 19, 0, 0)), // the first moment of this week (Monday start)
      completedAt(new Date(2026, 9, 18, 23, 59, 59, 999)), // the last moment of last week (Monday start)
      completedAt(new Date(2026, 9, 22, 9)), // earlier today
      completedAt(new Date(2026, 9, 22, 15, 30)), // half an hour ahead of this clock
      completedAt(new Date(2026, 7, 31, 0, 0)), // the start of the oldest week shown (Monday start)
      completedAt(new Date(2026, 7, 30, 23)), // just before it
      completedAt(new Date(2026, 9, 20), { status: 'in_progress' }), // reopened since
    ];
    const counts = (weekStart: 'Monday' | 'Sunday') =>
      Object.fromEntries(
        countCompletionsByWeek(tasks, weekStart, now)
          .filter((w) => w.count > 0)
          .map((w) => [w.weekStart, w.count])
      );

    expect(counts('Monday')).toEqual({ '2026-08-31': 1, '2026-10-12': 1, '2026-10-19': 3 });
    expect(counts('Sunday')).toEqual({ '2026-08-30': 2, '2026-10-18': 4 });
  });

  it('keeps week starts on the right day when the clocks go forward', () => {
    // Clocks go forward on Sunday 8 March 2026 in New York, so that week is an hour shorter.
    const now = new Date(2026, 2, 19, 12);
    const tasks = [completedAt(new Date(2026, 2, 1, 23, 30)), completedAt(new Date(2026, 2, 8, 3))];
    expect(countCompletionsByWeek(tasks, 'Monday', now, 4)).toEqual([
      { weekStart: '2026-02-23', count: 1 },
      { weekStart: '2026-03-02', count: 1 },
      { weekStart: '2026-03-09', count: 0 },
      { weekStart: '2026-03-16', count: 0 },
    ]);
    expect(countCompletionsByWeek(tasks, 'Sunday', now, 3)).toEqual([
      { weekStart: '2026-03-01', count: 1 },
      { weekStart: '2026-03-08', count: 1 },
      { weekStart: '2026-03-15', count: 0 },
    ]);
  });

  it('keeps week starts on the right day when the clocks go back', () => {
    // Clocks go back on Sunday 1 November 2026 in New York, so that week is an hour longer.
    const now = new Date(2026, 10, 12, 12);
    const tasks = [completedAt(new Date(2026, 10, 1, 0, 30)), completedAt(new Date(2026, 10, 2, 0, 0))];
    expect(countCompletionsByWeek(tasks, 'Monday', now, 4)).toEqual([
      { weekStart: '2026-10-19', count: 0 },
      { weekStart: '2026-10-26', count: 1 },
      { weekStart: '2026-11-02', count: 1 },
      { weekStart: '2026-11-09', count: 0 },
    ]);
    expect(countCompletionsByWeek(tasks, 'Sunday', now, 3)).toEqual([
      { weekStart: '2026-10-25', count: 0 },
      { weekStart: '2026-11-01', count: 2 },
      { weekStart: '2026-11-08', count: 0 },
    ]);
  });
});
