import { api, type ApiResult } from '@/lib/api';
import { DEFAULT_WORKSPACE } from '@/constants/defaults';
import type { ActivityLogItem, BootstrapPayload, Employee, LeaveRequest, NotificationItem, Project, Task } from '@/types';
import { getState, setState } from '../appStore';

// The Activity page and dashboard filter this in the browser; the API returns at most 500 entries per page.
const ACTIVITY_PAGE_SIZE = 500;

export function applyBootstrap(payload: BootstrapPayload): void {
  setState({
    needsSetup: payload.needsSetup,
    session: payload.user && payload.expiresAt ? { userId: payload.user.id, expiresAt: payload.expiresAt } : null,
    employees: payload.employees,
    workspace: payload.workspace ? { ...DEFAULT_WORKSPACE, ...payload.workspace } : DEFAULT_WORKSPACE,
    preferences: payload.user && payload.preferences ? { [payload.user.id]: payload.preferences } : {},
  });
}

export function clearSession(): void {
  setState({
    session: null,
    employees: [],
    projects: [],
    tasks: [],
    leaveRequests: [],
    activityLog: [],
    notifications: [],
    preferences: {},
  });
}

// A 401 from any endpoint means the server-side session is gone, so mirror that locally.
export function handleUnauthorized<T>(result: ApiResult<T>): ApiResult<T> {
  if (!result.ok && result.status === 401 && getState().session) clearSession();
  return result;
}

/** Loads everything the workspace shares (projects, tasks, leave, notifications, activity) for the signed-in user. */
export async function loadWorkspaceData(): Promise<void> {
  if (!getState().session) return;
  const [projects, tasks, leaveRequests, notifications, activityLog] = await Promise.all([
    api<Project[]>('GET', '/api/projects'),
    api<Task[]>('GET', '/api/tasks'),
    api<LeaveRequest[]>('GET', '/api/leave'),
    api<NotificationItem[]>('GET', '/api/notifications'),
    api<ActivityLogItem[]>('GET', `/api/activity?size=${ACTIVITY_PAGE_SIZE}`),
  ]);
  if ([projects, tasks, leaveRequests, notifications, activityLog].some((r) => !r.ok && r.status === 401)) {
    clearSession();
    return;
  }
  setState({
    ...(projects.ok && { projects: projects.data }),
    ...(tasks.ok && { tasks: tasks.data }),
    ...(leaveRequests.ok && { leaveRequests: leaveRequests.data }),
    ...(notifications.ok && { notifications: notifications.data }),
    ...(activityLog.ok && { activityLog: activityLog.data }),
  });
}

export async function refreshNotifications(): Promise<void> {
  if (!getState().session) return;
  const result = handleUnauthorized(await api<NotificationItem[]>('GET', '/api/notifications'));
  if (result.ok) setState({ notifications: result.data });
}

/** Re-reads the activity log, for after actions whose entries the server writes. */
export async function refreshActivity(): Promise<void> {
  if (!getState().session) return;
  const result = handleUnauthorized(await api<ActivityLogItem[]>('GET', `/api/activity?size=${ACTIVITY_PAGE_SIZE}`));
  if (result.ok) setState({ activityLog: result.data });
}

export async function refreshSession(): Promise<boolean> {
  const result = await api<BootstrapPayload>('GET', '/api/auth/session');
  if (!result.ok) return false;
  applyBootstrap(result.data);
  await loadWorkspaceData();
  return true;
}

export function upsertEmployee(employee: Employee): void {
  setState((s) => ({
    employees: s.employees.some((e) => e.id === employee.id)
      ? s.employees.map((e) => (e.id === employee.id ? employee : e))
      : [...s.employees, employee],
  }));
}
