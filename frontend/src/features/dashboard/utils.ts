import { daysUntil } from '@/lib/date';
import { ROUTES } from '@/constants/navigation';
import { TASK_PRIORITY } from '@/constants/status';
import type { Project, Task } from '@/types';

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

export function buildDeadlines(projects: Project[], tasks: Task[], horizonDays = DEADLINE_HORIZON_DAYS, now: Date = new Date()): DeadlineItem[] {
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
