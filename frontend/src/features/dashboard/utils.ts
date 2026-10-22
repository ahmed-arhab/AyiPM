import { daysUntil, startOfWeek, toDateKey } from '@/lib/date';
import { ROUTES } from '@/constants/navigation';
import { TASK_PRIORITY, TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import type { Project, Task, TaskStatus, WeekStart } from '@/types';

export const DEADLINE_HORIZON_DAYS = 14;

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatToday(date: Date = new Date(), locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function isOpenTask(task: Task): boolean {
  return task.status !== 'done';
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  return isOpenTask(task) && Boolean(task.dueDate) && daysUntil(task.dueDate, now) < 0;
}

export function compareTasksByUrgency(a: Task, b: Task): number {
  return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank;
}

export interface DeadlineItem {
  id: string;
  kind: 'task' | 'project';
  title: string;
  date: string;
  href: string;
  projectId?: string;
}

export function buildDeadlines(
  projects: Project[],
  tasks: Task[],
  horizonDays = DEADLINE_HORIZON_DAYS,
  now: Date = new Date()
): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  projects.forEach((p) => {
    if (p.status === 'completed' || !p.endDate || daysUntil(p.endDate, now) > horizonDays) return;
    items.push({ id: p.id, kind: 'project', title: p.name, date: p.endDate, href: ROUTES.project(p.id) });
  });
  tasks.forEach((t) => {
    if (!isOpenTask(t) || !t.dueDate || daysUntil(t.dueDate, now) > horizonDays) return;
    items.push({ id: t.id, kind: 'task', title: t.title, date: t.dueDate, href: `${ROUTES.tasks}?task=${t.id}`, projectId: t.projectId });
  });
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

export const COMPLETION_TREND_WEEKS = 8;

export interface WeeklyCompletions {
  /** Date key (YYYY-MM-DD) of the first day of the week. */
  weekStart: string;
  count: number;
}

// When a task changes column the backend adds "Moved to <status label>" to its history (TaskService.update); the
// labels are the ones in TASK_STATUS.
const movedTo = (status: TaskStatus) => `Moved to ${TASK_STATUS[status].label}`;
const STATUS_MOVES = new Set(TASK_STATUS_ORDER.map(movedTo));
const MOVED_TO_DONE = movedTo('done');

/**
 * When a task that is done now was completed, read from its history; undefined if it is not done. A task that was
 * reopened and completed again counts from its latest completion, and one created straight into Completed counts
 * from when it was created.
 */
export function taskCompletedAt(task: Task, now: Date = new Date()): Date | undefined {
  if (task.status !== 'done') return undefined;
  let last: { action: string; time: number } | undefined;
  for (const entry of task.history) {
    const time = Date.parse(entry.createdAt);
    if (STATUS_MOVES.has(entry.action) && !Number.isNaN(time) && (!last || time >= last.time)) last = { action: entry.action, time };
  }
  let time: number;
  if (!last) time = Date.parse(task.createdAt);
  // Done here but not in the history yet: the board has just moved it and the server's copy is still on its way.
  else if (last.action !== MOVED_TO_DONE) time = now.getTime();
  else time = last.time;
  if (Number.isNaN(time)) return undefined;
  // A server clock slightly ahead of this one must not push a completion past the current week.
  return new Date(Math.min(time, now.getTime()));
}

/** How many of the tasks were completed in each of the last `weeks` weeks, oldest first, ending with this week. */
export function countCompletionsByWeek(
  tasks: Task[],
  weekStart: WeekStart,
  now: Date = new Date(),
  weeks = COMPLETION_TREND_WEEKS
): WeeklyCompletions[] {
  const thisWeek = startOfWeek(now, weekStart);
  const result = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(thisWeek.getDate() - 7 * (weeks - 1 - i));
    return { weekStart: toDateKey(start), count: 0 };
  });
  const byWeek = new Map(result.map((week) => [week.weekStart, week]));
  for (const task of tasks) {
    const completedAt = taskCompletedAt(task, now);
    const week = completedAt && byWeek.get(toDateKey(startOfWeek(completedAt, weekStart)));
    if (week) week.count += 1;
  }
  return result;
}
