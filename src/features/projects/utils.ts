import { daysUntil } from '@/lib/date';
import { matchesQuery, pluralize } from '@/lib/format';
import { toCsv } from '@/lib/csv';
import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS_ORDER } from '@/constants/status';
import type { ProjectProgress } from '@/store';
import type { Employee, Project, ProjectStatus, Task, TaskStatus } from '@/types';

export type ProjectSortKey = 'updated' | 'name' | 'deadline' | 'progress';
export type ProjectStatusFilter = ProjectStatus | 'all';
export type ProjectViewMode = 'grid' | 'table';

export const PROJECT_STATUS_KEYS = Object.keys(PROJECT_STATUS) as ProjectStatus[];

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUS_KEYS.map((value) => ({ value, label: PROJECT_STATUS[value].label }));

export const PROJECT_SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'progress', label: 'Progress (highest)' },
];

export function matchesProject(project: Project, query: string): boolean {
  return matchesQuery(query, project.name, project.client, project.description);
}

export function sortProjects(projects: Project[], key: ProjectSortKey, progress: Map<string, ProjectProgress>): Project[] {
  const list = [...projects];
  switch (key) {
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'deadline':
      return list.sort((a, b) => (a.endDate || '9999').localeCompare(b.endDate || '9999'));
    case 'progress':
      return list.sort((a, b) => (progress.get(b.id)?.progress ?? 0) - (progress.get(a.id)?.progress ?? 0));
    default:
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function countByStatus(projects: Project[]): Record<ProjectStatus, number> {
  const counts = Object.fromEntries(PROJECT_STATUS_KEYS.map((k) => [k, 0])) as Record<ProjectStatus, number>;
  projects.forEach((p) => {
    counts[p.status] += 1;
  });
  return counts;
}

export function resolveMembers(ids: string[], employeesById: Map<string, Employee>): Employee[] {
  const members: Employee[] = [];
  ids.forEach((id) => {
    const employee = employeesById.get(id);
    if (employee) members.push(employee);
  });
  return members;
}

const PROJECTS_CSV_HEADER = ['Name', 'Client', 'Status', 'Manager', 'Members', 'Start Date', 'End Date', 'Progress', 'Budget'];

export function buildProjectsCsv(
  projects: Project[],
  employeesById: Map<string, Employee>,
  progress: Map<string, ProjectProgress>,
  formatDate: (value?: string) => string
): string {
  return toCsv([
    PROJECTS_CSV_HEADER,
    ...projects.map((p) => [
      p.name,
      p.client,
      PROJECT_STATUS[p.status].label,
      (p.managerId && employeesById.get(p.managerId)?.name) ?? '',
      resolveMembers(p.members, employeesById)
        .map((m) => m.name)
        .join('; '),
      formatDate(p.startDate),
      formatDate(p.endDate),
      `${progress.get(p.id)?.progress ?? 0}%`,
      p.budget ?? '',
    ]),
  ]);
}

export function isManagerRole(employee: Employee): boolean {
  return employee.status === 'active' && (employee.role === 'admin' || employee.role === 'project_manager');
}

export function countTasksByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(TASK_STATUS_ORDER.map((s) => [s, 0])) as Record<TaskStatus, number>;
  tasks.forEach((t) => {
    counts[t.status] += 1;
  });
  return counts;
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(TASK_STATUS_ORDER.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>;
  tasks.forEach((t) => groups[t.status]?.push(t));
  TASK_STATUS_ORDER.forEach((s) =>
    groups[s].sort((a, b) => a.order - b.order || TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank)
  );
  return groups;
}

export type DeadlineTone = 'danger' | 'warning' | 'success' | 'muted';

export interface DeadlineInfo {
  label: string;
  tone: DeadlineTone;
  days: number | null;
}

export function describeDeadline(endDate: string | undefined, completed = false, now: Date = new Date()): DeadlineInfo {
  if (completed) return { label: 'Completed', tone: 'success', days: null };
  if (!endDate) return { label: 'No deadline', tone: 'muted', days: null };
  const days = daysUntil(endDate, now);
  if (days < 0) return { label: `Overdue by ${pluralize(-days, 'day')}`, tone: 'danger', days };
  if (days === 0) return { label: 'Due today', tone: 'warning', days };
  if (days <= 7) return { label: `${pluralize(days, 'day')} left`, tone: 'warning', days };
  return { label: `${pluralize(days, 'day')} left`, tone: 'muted', days };
}

export type DueTimelineKey = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'no_due_date' | 'completed';

export interface DueTimelineGroup {
  key: DueTimelineKey;
  label: string;
  description: string;
  tone: 'danger' | 'warning' | 'info' | 'primary' | 'muted' | 'success';
  tasks: Task[];
}

export function groupTasksByDueTimeline(tasks: Task[], now: Date = new Date()): DueTimelineGroup[] {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDueDate: Task[] = [];
  const completed: Task[] = [];

  tasks.forEach((task) => {
    if (task.status === 'done') {
      completed.push(task);
      return;
    }
    if (!task.dueDate) {
      noDueDate.push(task);
      return;
    }
    const days = daysUntil(task.dueDate, now);
    if (days < 0) {
      overdue.push(task);
    } else if (days === 0) {
      today.push(task);
    } else if (days === 1) {
      tomorrow.push(task);
    } else if (days <= 7) {
      thisWeek.push(task);
    } else {
      later.push(task);
    }
  });

  const sortByDue = (a: Task, b: Task) =>
    (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
    TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank;

  overdue.sort(sortByDue);
  today.sort(sortByDue);
  tomorrow.sort(sortByDue);
  thisWeek.sort(sortByDue);
  later.sort(sortByDue);
  noDueDate.sort((a, b) => TASK_PRIORITY[a.priority].rank - TASK_PRIORITY[b.priority].rank || a.title.localeCompare(b.title));
  completed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return [
    {
      key: 'overdue',
      label: 'Overdue',
      description: 'Past due date — needs immediate attention',
      tone: 'danger',
      tasks: overdue,
    },
    {
      key: 'today',
      label: 'Due Today',
      description: 'Must be completed before end of day',
      tone: 'warning',
      tasks: today,
    },
    {
      key: 'tomorrow',
      label: 'Due Tomorrow',
      description: 'Scheduled for tomorrow',
      tone: 'info',
      tasks: tomorrow,
    },
    {
      key: 'this_week',
      label: 'This Week',
      description: 'Due in the next 7 days',
      tone: 'primary',
      tasks: thisWeek,
    },
    {
      key: 'later',
      label: 'Later / Upcoming',
      description: 'Scheduled for upcoming dates',
      tone: 'muted',
      tasks: later,
    },
    {
      key: 'no_due_date',
      label: 'No Due Date',
      description: 'Unscheduled tasks',
      tone: 'muted',
      tasks: noDueDate,
    },
    {
      key: 'completed',
      label: 'Completed',
      description: 'Finished tasks',
      tone: 'success',
      tasks: completed,
    },
  ];
}

export function formatDueRelative(dueDate: string | undefined, completed = false, now: Date = new Date()): { label: string; overdue: boolean; isToday: boolean } {
  if (completed) return { label: 'Completed', overdue: false, isToday: false };
  if (!dueDate) return { label: 'No due date', overdue: false, isToday: false };
  const days = daysUntil(dueDate, now);
  if (days < 0) return { label: `${pluralize(-days, 'day')} overdue`, overdue: true, isToday: false };
  if (days === 0) return { label: 'Due today', overdue: false, isToday: true };
  if (days === 1) return { label: 'Tomorrow', overdue: false, isToday: false };
  if (days <= 7) return { label: `In ${days} days`, overdue: false, isToday: false };
  return { label: dueDate, overdue: false, isToday: false };
}

