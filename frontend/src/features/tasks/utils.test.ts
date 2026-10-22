import { describe, expect, it } from 'vitest';
import type { Project, Task, TaskStatus } from '@/types';
import { DEFAULT_FILTERS, UNASSIGNED, dueLabel, filterTasks, getDueState, hasActiveFilters, sortTasks, toColumnIndex } from './utils';

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    projectId: 'p1',
    title: `Task ${id}`,
    description: '',
    priority: 'medium',
    status: 'backlog',
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

const project = (id: string, name: string) => ({ id, name }) as Project;
const ids = (tasks: Task[]) => tasks.map((t) => t.id);

describe('filterTasks', () => {
  const tasks = [
    makeTask('design', {
      title: 'Design login page',
      description: 'Use the new brand colours',
      assigneeId: 'u1',
      priority: 'high',
      status: 'in_progress',
    }),
    makeTask('notes', { projectId: 'p2', title: 'Write release notes', assigneeId: 'u2', priority: 'low' }),
    makeTask('bug', { title: 'Fix checkout bug', description: 'Payments fail on Safari', priority: 'urgent', status: 'review' }),
    makeTask('ship', { projectId: 'p2', title: 'Ship v2', assigneeId: 'u1', priority: 'high', status: 'done' }),
  ];
  const context = { userId: 'u1', projectsById: new Map([project('p1', 'Website'), project('p2', 'Mobile app')].map((p) => [p.id, p])) };
  const filter = (filters: Partial<typeof DEFAULT_FILTERS>) => ids(filterTasks(tasks, { ...DEFAULT_FILTERS, ...filters }, context));

  it('keeps every task, in order, when no filter is set', () => {
    expect(filter({})).toEqual(['design', 'notes', 'bug', 'ship']);
  });

  it('returns nothing for no tasks', () => {
    expect(filterTasks([], DEFAULT_FILTERS, context)).toEqual([]);
  });

  it('searches the title, description and project name, ignoring case and surrounding spaces', () => {
    expect(filter({ query: '  LOGIN ' })).toEqual(['design']);
    expect(filter({ query: 'safari' })).toEqual(['bug']);
    expect(filter({ query: 'mobile' })).toEqual(['notes', 'ship']);
    expect(filter({ query: 'nothing like this' })).toEqual([]);
  });

  it('still searches title and description when the project is unknown', () => {
    const orphan = makeTask('orphan', { projectId: 'gone', title: 'Old task' });
    expect(ids(filterTasks([orphan], { ...DEFAULT_FILTERS, query: 'old' }, context))).toEqual(['orphan']);
  });

  it('filters by project, priority and status', () => {
    expect(filter({ projectId: 'p1' })).toEqual(['design', 'bug']);
    expect(filter({ priority: 'high' })).toEqual(['design', 'ship']);
    expect(filter({ status: 'done' })).toEqual(['ship']);
  });

  it('filters by assignee, by unassigned and by the current user', () => {
    expect(filter({ assigneeId: 'u2' })).toEqual(['notes']);
    expect(filter({ assigneeId: UNASSIGNED })).toEqual(['bug']);
    expect(filter({ mine: true })).toEqual(['design', 'ship']);
  });

  it('requires every filter to match', () => {
    expect(filter({ projectId: 'p1', mine: true })).toEqual(['design']);
    expect(filter({ projectId: 'p2', priority: 'high', query: 'ship' })).toEqual(['ship']);
    expect(filter({ mine: true, assigneeId: 'u2' })).toEqual([]);
  });
});

describe('hasActiveFilters', () => {
  it('ignores the sort order and a blank search', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'title', query: '   ' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, mine: true })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: 'x' })).toBe(true);
  });
});

describe('sortTasks', () => {
  const tasks = [
    makeTask('a', { title: 'banana', dueDate: '2026-11-02', priority: 'low', updatedAt: '2026-10-20T10:00:00Z' }),
    makeTask('b', { title: 'Apple', dueDate: '2026-11-01', priority: 'medium', updatedAt: '2026-10-22T08:00:00Z' }),
    makeTask('c', { title: 'cherry', dueDate: '2026-11-01', priority: 'urgent', updatedAt: '2026-10-21T10:00:00Z' }),
    makeTask('d', { title: 'apple', dueDate: '2026-11-03', priority: 'urgent', updatedAt: '2026-10-22T09:00:00Z' }),
  ];

  it('sorts by due date, then by priority', () => {
    expect(ids(sortTasks(tasks, 'due'))).toEqual(['c', 'b', 'a', 'd']);
  });

  it('sorts by priority, then by due date', () => {
    expect(ids(sortTasks(tasks, 'priority'))).toEqual(['c', 'd', 'b', 'a']);
  });

  it('sorts by title ignoring case, keeping the order of equal titles', () => {
    expect(ids(sortTasks(tasks, 'title'))).toEqual(['b', 'd', 'a', 'c']);
  });

  it('puts the most recently updated first', () => {
    expect(ids(sortTasks(tasks, 'updated'))).toEqual(['d', 'b', 'c', 'a']);
  });

  it('returns a new list and leaves the input alone', () => {
    const before = ids(tasks);
    const sorted = sortTasks(tasks, 'title');
    expect(sorted).not.toBe(tasks);
    expect(ids(tasks)).toEqual(before);
    expect(sortTasks([], 'due')).toEqual([]);
  });
});

describe('toColumnIndex', () => {
  // Tasks in a column, listed out of order to show that `order` decides their position.
  const column = (status: TaskStatus, names: string[]) => names.map((name, order) => makeTask(name, { status, order })).reverse();

  const todo = column('backlog', ['a', 'hidden1', 'b', 'hidden2', 'c']);
  const byId = new Map(todo.map((t) => [t.id, t]));
  const pick = (...names: string[]) => names.map((name) => byId.get(name)!);
  const elsewhere = column('done', ['x', 'y']);
  const all = [...elsewhere, ...todo];

  it('maps positions directly when nothing is hidden', () => {
    const visible = pick('a', 'hidden1', 'b', 'hidden2', 'c');
    expect(toColumnIndex(all, visible, 'backlog', 'x', 0)).toBe(0);
    expect(toColumnIndex(all, visible, 'backlog', 'x', 3)).toBe(3);
    expect(toColumnIndex(all, visible, 'backlog', 'x', 5)).toBe(5);
  });

  it('drops before the card that is shown at that position when some cards are filtered out', () => {
    const visible = pick('a', 'b', 'c');
    expect(toColumnIndex(all, visible, 'backlog', 'x', 0)).toBe(0);
    expect(toColumnIndex(all, visible, 'backlog', 'x', 1)).toBe(2);
    expect(toColumnIndex(all, visible, 'backlog', 'x', 2)).toBe(4);
  });

  it('drops right after the last shown card, ahead of hidden cards below it', () => {
    expect(toColumnIndex(all, pick('a', 'b'), 'backlog', 'x', 2)).toBe(3);
    expect(toColumnIndex(all, pick('a', 'b', 'c'), 'backlog', 'x', 3)).toBe(5);
  });

  it('leaves the dragged card out when moving it within its own column', () => {
    const visible = pick('a', 'b', 'c');
    // Without "a" the column is hidden1, b, hidden2, c; dropping before "c" puts it at index 3.
    expect(toColumnIndex(all, visible, 'backlog', 'a', 1)).toBe(3);
    expect(toColumnIndex(all, visible, 'backlog', 'c', 2)).toBe(3);
  });

  it('drops at the end of the column when every card in it is hidden', () => {
    expect(toColumnIndex(all, [], 'backlog', 'x', 0)).toBe(5);
  });

  it('drops at the start of an empty column', () => {
    expect(toColumnIndex(all, [], 'review', 'a', 0)).toBe(0);
  });

  it('drops at the end when the shown cards are no longer in the column', () => {
    const stale = [makeTask('a', { order: 0 })];
    expect(toColumnIndex(all, stale, 'backlog', 'x', 0)).toBe(5);
    expect(toColumnIndex(all, stale, 'backlog', 'x', 1)).toBe(5);
  });
});

describe('getDueState and dueLabel', () => {
  const now = new Date(2026, 9, 22, 18, 0);

  it('marks open tasks overdue, due soon or normal', () => {
    expect(getDueState({ dueDate: '2026-10-21', status: 'backlog' }, now)).toBe('overdue');
    expect(getDueState({ dueDate: '2026-10-22', status: 'review' }, now)).toBe('soon');
    expect(getDueState({ dueDate: '2026-10-24', status: 'in_progress' }, now)).toBe('soon');
    expect(getDueState({ dueDate: '2026-10-25', status: 'backlog' }, now)).toBe('normal');
  });

  it('never marks a completed task overdue', () => {
    expect(getDueState({ dueDate: '2026-01-01', status: 'done' }, now)).toBe('done');
  });

  it('describes how far away the due date is', () => {
    expect(dueLabel('2026-10-22', now)).toBe('Due today');
    expect(dueLabel('2026-10-23', now)).toBe('Due tomorrow');
    expect(dueLabel('2026-10-27', now)).toBe('Due in 5 days');
    expect(dueLabel('2026-10-21', now)).toBe('1 day overdue');
    expect(dueLabel('2026-10-12', now)).toBe('10 days overdue');
  });
});
