import { api } from '@/lib/api';
import { hasPermission } from '@/constants/roles';
import type { ActionResult, Employee, Task, TaskInput, TaskStatus, TaskUpdate } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { handleUnauthorized, refreshActivity } from './session';

// The backend enforces these rules, keeps the history and sends notifications. These checks only decide what the
// UI offers.
export function canManageTasks(user: Employee | undefined): boolean {
  return hasPermission(user?.role, 'tasks.manage');
}

export function canMoveTask(user: Employee | undefined, task: Task): boolean {
  return Boolean(user) && (canManageTasks(user) || task.assigneeId === user?.id);
}

function upsertTasks(updated: Task[]) {
  const byId = new Map(updated.map((t) => [t.id, t]));
  setState((s) => {
    const known = new Set(s.tasks.map((t) => t.id));
    return {
      tasks: [...s.tasks.map((t) => byId.get(t.id) ?? t), ...updated.filter((t) => !known.has(t.id))],
    };
  });
}

// Assigning someone to a task adds them to its project on the server, so mirror that locally.
function addAssigneeToProject(task: Task) {
  if (!task.assigneeId) return;
  setState((s) => ({
    projects: s.projects.map((p) =>
      p.id === task.projectId && !p.members.includes(task.assigneeId!) ? { ...p, members: [...p.members, task.assigneeId!] } : p
    ),
  }));
}

export async function createTask(input: TaskInput): Promise<ActionResult<Task>> {
  const auth = authorize('tasks.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Task>('POST', '/api/tasks', input));
  if (!result.ok) return result;
  upsertTasks([result.data]);
  addAssigneeToProject(result.data);
  void refreshActivity();
  return ok(result.data);
}

export async function updateTask(id: string, update: TaskUpdate): Promise<ActionResult<Task>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  // An empty assigneeId unassigns the task, as diffTaskUpdate sends it.
  const result = handleUnauthorized(await api<Task>('PATCH', `/api/tasks/${id}`, update));
  if (!result.ok) return result;
  upsertTasks([result.data]);
  addAssigneeToProject(result.data);
  void refreshActivity();
  return ok(result.data);
}

/**
 * Moves a task on the board. The board updates straight away; if the server refuses, the tasks are reloaded so the
 * card goes back to where it was.
 */
export async function moveTask(id: string, status: TaskStatus, targetIndex?: number): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const task = getState().tasks.find((t) => t.id === id);
  if (!task) return fail('Task not found.');
  if (!canMoveTask(auth.data, task)) return fail('You can only move tasks assigned to you.');

  moveLocally(id, status, targetIndex);
  const result = handleUnauthorized(await api<Task[]>('POST', `/api/tasks/${id}/move`, { status, index: targetIndex }));
  if (!result.ok) {
    const reload = handleUnauthorized(await api<Task[]>('GET', '/api/tasks'));
    if (reload.ok) setState({ tasks: reload.data });
    return result;
  }
  upsertTasks(result.data);
  if (task.status !== status) void refreshActivity();
  return ok();
}

function moveLocally(id: string, status: TaskStatus, targetIndex?: number) {
  const { tasks } = getState();
  const moved = tasks.find((t) => t.id === id);
  if (!moved) return;
  const column = tasks.filter((t) => t.status === status && t.id !== id).sort((a, b) => a.order - b.order);
  const index = targetIndex === undefined ? column.length : Math.max(0, Math.min(targetIndex, column.length));
  column.splice(index, 0, { ...moved, status });
  const orderById = new Map(column.map((t, i) => [t.id, i]));
  setState((s) => ({
    tasks: s.tasks.map((t) => {
      const order = orderById.get(t.id);
      if (order === undefined) return t;
      return t.id === id ? { ...t, status, order } : order === t.order ? t : { ...t, order };
    }),
  }));
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const auth = authorize('tasks.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<null>('DELETE', `/api/tasks/${id}`));
  if (!result.ok) return result;
  setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  void refreshActivity();
  return ok();
}

export async function addTaskComment(id: string, text: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  if (!text.trim()) return fail('Comment cannot be empty.');
  const result = handleUnauthorized(await api<Task>('POST', `/api/tasks/${id}/comments`, { text }));
  if (!result.ok) return result;
  upsertTasks([result.data]);
  return ok();
}
