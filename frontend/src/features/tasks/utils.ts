import { TASK_PRIORITY, TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { daysUntil } from '@/lib/date';
import { matchesQuery } from '@/lib/format';
import { toCsv } from '@/lib/csv';
import type { FieldErrors } from '@/lib/validation';
import type { Employee, Project, Task, TaskInput, TaskPriority, TaskStatus, TaskUpdate } from '@/types';

export type TaskView = 'board' | 'list';
export type TaskSort = 'due' | 'priority' | 'title' | 'updated';

export const UNASSIGNED = 'unassigned';
export const DUE_SOON_DAYS = 2;

export interface TaskFilters {
  query: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority | '';
  status: TaskStatus | '';
  mine: boolean;
  sort: TaskSort;
}

export const DEFAULT_FILTERS: TaskFilters = {
  query: '',
  projectId: '',
  assigneeId: '',
  priority: '',
  status: '',
  mine: false,
  sort: 'due',
};

export const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
  { value: 'updated', label: 'Recently updated' },
];

export function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(filters.query.trim() || filters.projectId || filters.assigneeId || filters.priority || filters.status || filters.mine);
}

interface FilterContext {
  userId: string;
  projectsById: Map<string, Project>;
}

export function filterTasks(tasks: Task[], filters: Omit<TaskFilters, 'sort'>, { userId, projectsById }: FilterContext): Task[] {
  return tasks.filter((t) => {
    if (filters.projectId && t.projectId !== filters.projectId) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.mine && t.assigneeId !== userId) return false;
    if (filters.assigneeId === UNASSIGNED ? Boolean(t.assigneeId) : filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
    return matchesQuery(filters.query, t.title, t.description, projectsById.get(t.projectId)?.name);
  });
}

const byDue = (a: Task, b: Task) => a.dueDate.localeCompare(b.dueDate);

const COMPARATORS: Record<TaskSort, (a: Task, b: Task) => number> = {
  due: (a, b) => byDue(a, b) || TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank,
  priority: (a, b) => TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank || byDue(a, b),
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
};

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  return [...tasks].sort(COMPARATORS[sort]);
}

const TASKS_CSV_HEADER = ['Title', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date'];

export function buildTasksCsv(
  tasks: Task[],
  projectsById: Map<string, Project>,
  employeesById: Map<string, Employee>,
  formatDate: (value?: string) => string
): string {
  return toCsv([
    TASKS_CSV_HEADER,
    ...tasks.map((t) => [
      t.title,
      projectsById.get(t.projectId)?.name ?? '',
      (t.assigneeId && employeesById.get(t.assigneeId)?.name) ?? 'Unassigned',
      TASK_PRIORITY[t.priority].label,
      TASK_STATUS[t.status].label,
      formatDate(t.dueDate),
    ]),
  ]);
}

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(TASK_STATUS_ORDER.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>;
  tasks.forEach((t) => groups[t.status]?.push(t));
  TASK_STATUS_ORDER.forEach((s) => groups[s].sort((a, b) => a.order - b.order));
  return groups;
}

export function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

export type DueState = 'overdue' | 'soon' | 'normal' | 'done';

export function getDueState(task: Pick<Task, 'dueDate' | 'status'>, now: Date = new Date()): DueState {
  if (task.status === 'done') return 'done';
  const days = daysUntil(task.dueDate, now);
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'soon';
  return 'normal';
}

export function dueLabel(dueDate: string, now: Date = new Date()): string {
  const days = daysUntil(dueDate, now);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return '1 day overdue';
  if (days < 0) return `${-days} days overdue`;
  return `Due in ${days} days`;
}

// Converts a drop position among the visible (filtered) cards into an index within the full column.
export function toColumnIndex(allTasks: Task[], visible: Task[], status: TaskStatus, draggedId: string, visibleIndex: number): number {
  const full = allTasks.filter((t) => t.status === status && t.id !== draggedId).sort((a, b) => a.order - b.order);
  const shown = visible.filter((t) => t.id !== draggedId);
  if (visibleIndex < shown.length) {
    const index = full.indexOf(shown[visibleIndex]);
    return index === -1 ? full.length : index;
  }
  if (shown.length === 0) return full.length;
  const last = full.indexOf(shown[shown.length - 1]);
  return last === -1 ? full.length : last + 1;
}

export interface TaskFormValues {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export const TITLE_MAX_LENGTH = 120;

export function initialFormValues(task: Task | undefined, defaultProjectId: string): TaskFormValues {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId ?? '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    };
  }
  return { title: '', description: '', projectId: defaultProjectId, assigneeId: '', priority: 'medium', status: 'backlog', dueDate: '' };
}

export function validateTaskForm(values: TaskFormValues, isNew: boolean, today: string): FieldErrors<TaskFormValues> {
  const title = values.title.trim();
  return {
    title: !title
      ? 'Title is required'
      : title.length > TITLE_MAX_LENGTH
        ? `Keep the title under ${TITLE_MAX_LENGTH} characters`
        : undefined,
    projectId: values.projectId ? undefined : 'Select a project',
    dueDate: !values.dueDate ? 'Due date is required' : isNew && values.dueDate < today ? 'Due date cannot be in the past' : undefined,
  };
}

export function toTaskInput(values: TaskFormValues): TaskInput {
  return { ...values, title: values.title.trim(), description: values.description.trim(), assigneeId: values.assigneeId || undefined };
}

export function diffTaskUpdate(task: Task, values: TaskFormValues): TaskUpdate {
  const next = toTaskInput(values);
  const update: TaskUpdate = {};
  if (next.title !== task.title) update.title = next.title;
  if (next.description !== task.description) update.description = next.description;
  if (next.projectId !== task.projectId) update.projectId = next.projectId;
  if ((next.assigneeId ?? '') !== (task.assigneeId ?? '')) update.assigneeId = next.assigneeId ?? '';
  if (next.priority !== task.priority) update.priority = next.priority;
  if (next.status !== task.status) update.status = next.status;
  if (next.dueDate !== task.dueDate) update.dueDate = next.dueDate;
  return update;
}
