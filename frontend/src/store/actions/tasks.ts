import { createId, nowIso } from '@/lib/id';
import { hasPermission } from '@/constants/roles';
import { TASK_PRIORITY, TASK_STATUS } from '@/constants/status';
import type { ActionResult, Employee, Task, TaskHistoryEntry, TaskInput, TaskStatus, TaskUpdate } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { logActivity } from './activity';
import { notify } from './notifications';

export function canManageTasks(user: Employee | undefined): boolean {
  return hasPermission(user?.role, 'tasks.manage');
}

export function canMoveTask(user: Employee | undefined, task: Task): boolean {
  return Boolean(user) && (canManageTasks(user) || task.assigneeId === user?.id);
}

function historyEntry(actorId: string, action: string): TaskHistoryEntry {
  return { id: createId('th'), actorId, action, createdAt: nowIso() };
}

function nextOrder(tasks: Task[], status: TaskStatus): number {
  return tasks.reduce((max, t) => (t.status === status ? Math.max(max, t.order) : max), -1) + 1;
}

function validateTask(input: TaskUpdate): string | undefined {
  if (input.title !== undefined && !input.title.trim()) return 'Task title is required.';
  if (input.projectId !== undefined && !getState().projects.some((p) => p.id === input.projectId)) return 'Select a valid project.';
  if (input.dueDate !== undefined && !input.dueDate) return 'Due date is required.';
  if (input.assigneeId && !getState().employees.some((e) => e.id === input.assigneeId && e.status === 'active')) {
    return 'Select an active assignee.';
  }
  return undefined;
}

function ensureProjectMember(projectId: string, employeeId?: string) {
  if (!employeeId) return;
  const project = getState().projects.find((p) => p.id === projectId);
  if (project && !project.members.includes(employeeId)) {
    setState((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, members: [...p.members, employeeId], updatedAt: nowIso() } : p)),
    }));
  }
}

function notifyAssignee(task: Task, actor: Employee) {
  if (!task.assigneeId || task.assigneeId === actor.id) return;
  notify([task.assigneeId], {
    title: 'Task assigned to you',
    message: `${actor.name} assigned you "${task.title}".`,
    category: 'task',
    priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'normal',
    link: `/tasks?task=${task.id}`,
    senderId: actor.id,
  });
}

export function createTask(input: TaskInput): ActionResult<Task> {
  const auth = authorize('tasks.manage');
  if (!auth.ok) return auth;
  const error = validateTask(input);
  if (error) return fail(error);

  const timestamp = nowIso();
  const task: Task = {
    ...input,
    id: createId('tsk'),
    title: input.title.trim(),
    description: input.description.trim(),
    assigneeId: input.assigneeId || undefined,
    order: nextOrder(getState().tasks, input.status),
    comments: [],
    history: [historyEntry(auth.data.id, 'Created task')],
    createdBy: auth.data.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  setState((s) => ({ tasks: [...s.tasks, task] }));
  ensureProjectMember(task.projectId, task.assigneeId);
  logActivity({ actor: auth.data, action: 'Created Task', entityType: 'task', entityId: task.id, entityName: task.title });
  notifyAssignee(task, auth.data);
  return ok(task);
}

function describeChanges(current: Task, update: TaskUpdate): string[] {
  const { employees, projects } = getState();
  const changes: string[] = [];
  if (update.title !== undefined && update.title !== current.title) changes.push('Renamed task');
  if (update.description !== undefined && update.description !== current.description) changes.push('Updated description');
  if (update.status && update.status !== current.status) changes.push(`Moved to ${TASK_STATUS[update.status].label}`);
  if (update.priority && update.priority !== current.priority) changes.push(`Priority set to ${TASK_PRIORITY[update.priority].label}`);
  if (update.dueDate && update.dueDate !== current.dueDate) changes.push(`Due date set to ${update.dueDate}`);
  if (update.projectId && update.projectId !== current.projectId) {
    changes.push(`Moved to project ${projects.find((p) => p.id === update.projectId)?.name ?? ''}`.trim());
  }
  if (update.assigneeId !== undefined && update.assigneeId !== current.assigneeId) {
    const name = employees.find((e) => e.id === update.assigneeId)?.name;
    changes.push(name ? `Assigned to ${name}` : 'Unassigned');
  }
  return changes;
}

export function updateTask(id: string, update: TaskUpdate): ActionResult<Task> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const actor = auth.data;
  const current = getState().tasks.find((t) => t.id === id);
  if (!current) return fail('Task not found.');

  const isManager = canManageTasks(actor);
  if (!isManager) {
    const onlyStatus = Object.keys(update).every((key) => key === 'status');
    if (current.assigneeId !== actor.id || !onlyStatus) return fail('You can only change the status of tasks assigned to you.');
  }
  const error = validateTask(update);
  if (error) return fail(error);

  const changes = describeChanges(current, update);
  if (changes.length === 0) return ok(current);

  const statusChanged = update.status !== undefined && update.status !== current.status;
  const updated: Task = {
    ...current,
    ...update,
    title: (update.title ?? current.title).trim(),
    assigneeId: update.assigneeId === undefined ? current.assigneeId : update.assigneeId || undefined,
    order: statusChanged && update.status ? nextOrder(getState().tasks, update.status) : current.order,
    history: [...current.history, ...changes.map((c) => historyEntry(actor.id, c))],
    updatedAt: nowIso(),
  };
  setState((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  ensureProjectMember(updated.projectId, updated.assigneeId);
  logActivity({ actor, action: 'Updated Task', entityType: 'task', entityId: id, entityName: updated.title, details: changes.join(' · ') });
  if (updated.assigneeId !== current.assigneeId) notifyAssignee(updated, actor);
  if (statusChanged && current.createdBy !== actor.id) {
    notify([current.createdBy], {
      title: 'Task status updated',
      message: `${actor.name} moved "${updated.title}" to ${TASK_STATUS[updated.status].label}.`,
      category: 'task',
      priority: 'low',
      link: `/tasks?task=${id}`,
      senderId: actor.id,
    });
  }
  return ok(updated);
}

export function moveTask(id: string, status: TaskStatus, targetIndex?: number): ActionResult {
  const auth = authorize();
  if (!auth.ok) return auth;
  const { tasks } = getState();
  const task = tasks.find((t) => t.id === id);
  if (!task) return fail('Task not found.');
  if (!canMoveTask(auth.data, task)) return fail('You can only move tasks assigned to you.');

  if (task.status !== status) {
    const result = updateTask(id, { status });
    if (!result.ok) return result;
  }
  if (targetIndex === undefined) return ok();

  const column = getState()
    .tasks.filter((t) => t.status === status && t.id !== id)
    .sort((a, b) => a.order - b.order);
  const moved = getState().tasks.find((t) => t.id === id);
  if (!moved) return ok();
  column.splice(Math.max(0, Math.min(targetIndex, column.length)), 0, moved);
  const orderById = new Map(column.map((t, index) => [t.id, index]));
  setState((s) => ({
    tasks: s.tasks.map((t) => {
      const order = orderById.get(t.id);
      return order === undefined || order === t.order ? t : { ...t, order };
    }),
  }));
  return ok();
}

export function deleteTask(id: string): ActionResult {
  const auth = authorize('tasks.manage');
  if (!auth.ok) return auth;
  const task = getState().tasks.find((t) => t.id === id);
  if (!task) return fail('Task not found.');
  setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  logActivity({ actor: auth.data, action: 'Deleted Task', entityType: 'task', entityId: id, entityName: task.title });
  return ok();
}

export function addTaskComment(id: string, text: string): ActionResult {
  const auth = authorize();
  if (!auth.ok) return auth;
  const body = text.trim();
  if (!body) return fail('Comment cannot be empty.');
  const task = getState().tasks.find((t) => t.id === id);
  if (!task) return fail('Task not found.');

  const comment = { id: createId('cmt'), authorId: auth.data.id, text: body, createdAt: nowIso() };
  setState((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, comments: [...t.comments, comment] } : t)) }));
  const recipients = [task.assigneeId, task.createdBy].filter((r): r is string => Boolean(r) && r !== auth.data.id);
  notify(recipients, {
    title: 'New comment',
    message: `${auth.data.name} commented on "${task.title}".`,
    category: 'task',
    priority: 'low',
    link: `/tasks?task=${id}`,
    senderId: auth.data.id,
  });
  return ok();
}
