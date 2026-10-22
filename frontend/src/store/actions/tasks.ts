import { api } from '@/lib/api';
import { mapWithConcurrency } from '@/lib/async';
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
  const result = await sendUpdate(id, update);
  if (result.ok) void refreshActivity();
  return result;
}

async function sendUpdate(id: string, update: TaskUpdate): Promise<ActionResult<Task>> {
  // An empty assigneeId unassigns the task, as diffTaskUpdate sends it.
  const result = handleUnauthorized(await api<Task>('PATCH', `/api/tasks/${id}`, update));
  if (!result.ok) return result;
  upsertTasks([result.data]);
  addAssigneeToProject(result.data);
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
    await reloadTasks();
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
  const result = await sendDelete(id);
  if (result.ok) void refreshActivity();
  return result;
}

async function sendDelete(id: string): Promise<ActionResult> {
  const result = handleUnauthorized(await api<null>('DELETE', `/api/tasks/${id}`));
  if (!result.ok) return result;
  setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  return ok();
}

async function reloadTasks(): Promise<void> {
  const result = handleUnauthorized(await api<Task[]>('GET', '/api/tasks'));
  if (result.ok) setState({ tasks: result.data });
}

export interface BulkTaskResult {
  succeeded: string[];
  failed: { id: string; error: string }[];
}

// The API has no bulk endpoint, so bulk actions send one request per task, a few at a time. Each task then gets its
// own history entry, activity entry and notifications, exactly as if it had been changed on its own.
const BULK_CONCURRENCY = 4;

async function runBulk(ids: string[], run: (id: string) => Promise<ActionResult<unknown>>, concurrency = BULK_CONCURRENCY): Promise<BulkTaskResult> {
  const results = await mapWithConcurrency(ids, concurrency, async (id) => {
    // A 401 ends the session part way through; don't keep sending requests that will all fail.
    if (!getState().session) return fail('You must be signed in to do that.');
    return run(id);
  });
  const outcome: BulkTaskResult = { succeeded: [], failed: [] };
  results.forEach((result, i) => {
    if (result.ok) outcome.succeeded.push(ids[i]);
    else outcome.failed.push({ id: ids[i], error: result.error });
  });
  // Re-read the tasks so the list reflects what the server now has, including changes other people made meanwhile.
  await reloadTasks();
  if (outcome.succeeded.length > 0) void refreshActivity();
  return outcome;
}

/** Only the fields of `update` that would change `task`, so tasks that already match aren't sent at all. */
function changedFields(task: Task, update: TaskUpdate): TaskUpdate {
  const patch: TaskUpdate = {};
  if (update.status !== undefined && update.status !== task.status) patch.status = update.status;
  if (update.priority !== undefined && update.priority !== task.priority) patch.priority = update.priority;
  if (update.assigneeId !== undefined && update.assigneeId !== (task.assigneeId ?? '')) patch.assigneeId = update.assigneeId;
  return patch;
}

/**
 * Sets the status, priority or assignee (an empty assigneeId unassigns) of several tasks. Tasks that fail don't stop
 * the others; the result says which ones succeeded and why the rest failed.
 */
export async function updateTasks(ids: string[], update: Pick<TaskUpdate, 'status' | 'priority' | 'assigneeId'>): Promise<ActionResult<BulkTaskResult>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  // A status change puts the task at the end of its new column. The server works that position out per request, so
  // concurrent moves into the same column can land on the same position; send those one at a time.
  const concurrency = update.status ? 1 : BULK_CONCURRENCY;
  return ok(
    await runBulk(
      ids,
      async (id) => {
        const task = getState().tasks.find((t) => t.id === id);
        if (!task) return fail('Task not found.');
        const patch = changedFields(task, update);
        return Object.keys(patch).length === 0 ? ok(task) : sendUpdate(id, patch);
      },
      concurrency
    )
  );
}

export async function deleteTasks(ids: string[]): Promise<ActionResult<BulkTaskResult>> {
  const auth = authorize('tasks.manage');
  if (!auth.ok) return auth;
  return ok(await runBulk(ids, sendDelete));
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
