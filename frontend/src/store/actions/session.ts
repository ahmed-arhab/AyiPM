import { api, type ApiResult } from '@/lib/api';
import { endOfMonthKey, startOfMonthKey, todayInTimeZone } from '@/lib/date';
import { DEFAULT_WORKSPACE } from '@/constants/defaults';
import type {
  ActivityLogItem,
  AttendanceRecord,
  BootstrapPayload,
  Employee,
  LeaveBalance,
  LeaveRequest,
  NotificationItem,
  Project,
  Task,
} from '@/types';
import { getState, setState } from '../appStore';
import type { AppState } from '../state';

// The Activity page and dashboard filter this in the browser; the API returns at most 500 entries per page.
const ACTIVITY_PAGE_SIZE = 500;

export function applyBootstrap(payload: BootstrapPayload): void {
  setState({
    needsSetup: payload.needsSetup,
    session: payload.user && payload.expiresAt ? { userId: payload.user.id, expiresAt: payload.expiresAt } : null,
    employees: payload.employees,
    workspace: payload.workspace ? { ...DEFAULT_WORKSPACE, ...payload.workspace } : DEFAULT_WORKSPACE,
    preferences: payload.user && payload.preferences ? { [payload.user.id]: payload.preferences } : {},
    twoFactor: payload.twoFactor,
  });
}

export function clearSession(): void {
  setState({
    session: null,
    employees: [],
    projects: [],
    tasks: [],
    leaveRequests: [],
    leaveBalances: {},
    attendance: [],
    attendanceSince: null,
    activityLog: [],
    notifications: [],
    preferences: {},
    twoFactor: null,
    newRecoveryCodes: null,
  });
}

// A 401 from any endpoint means the server-side session is gone, so mirror that locally.
export function handleUnauthorized<T>(result: ApiResult<T>): ApiResult<T> {
  if (!result.ok && result.status === 401 && getState().session) clearSession();
  return result;
}

// Attendance loads from the start of last month to the end of this one, which covers this month's summary (with any
// approved leave later in the month) and the recent daily log. "Today" is the workspace's, which the server dates
// check-ins by.
function recentAttendanceRange(): { from: string; to: string } {
  const today = todayInTimeZone(getState().workspace.timezone);
  return { from: startOfMonthKey(today, -1), to: endOfMonthKey(today) };
}

/** Everyone's records with `attendance.viewAll`, otherwise your own; both dates are inclusive. */
export function fetchAttendance(from: string, to: string, employeeId?: string): Promise<ApiResult<AttendanceRecord[]>> {
  const query = new URLSearchParams({ from, to, ...(employeeId && { employeeId }) });
  return api<AttendanceRecord[]>('GET', `/api/attendance?${query}`);
}

/** Replaces the records dated from `from` to `to` with the server's and keeps the rest. */
export function withAttendance(s: AppState, from: string, to: string, records: AttendanceRecord[]): Partial<AppState> {
  return {
    attendance: [...records, ...s.attendance.filter((r) => r.date < from || r.date > to)],
    attendanceSince: s.attendanceSince && s.attendanceSince < from ? s.attendanceSince : from,
  };
}

/** Loads everything the workspace shares (projects, tasks, leave, attendance, notifications, activity) for the signed-in user. */
export async function loadWorkspaceData(): Promise<void> {
  const { session } = getState();
  if (!session) return;
  const range = recentAttendanceRange();
  const [projects, tasks, leaveRequests, leaveBalance, attendance, notifications, activityLog] = await Promise.all([
    api<Project[]>('GET', '/api/projects'),
    api<Task[]>('GET', '/api/tasks'),
    api<LeaveRequest[]>('GET', '/api/leave'),
    api<LeaveBalance>('GET', '/api/leave/balance'),
    fetchAttendance(range.from, range.to),
    api<NotificationItem[]>('GET', '/api/notifications'),
    api<ActivityLogItem[]>('GET', `/api/activity?size=${ACTIVITY_PAGE_SIZE}`),
  ]);
  if ([projects, tasks, leaveRequests, leaveBalance, attendance, notifications, activityLog].some((r) => !r.ok && r.status === 401)) {
    clearSession();
    return;
  }
  setState((s) => ({
    ...(projects.ok && { projects: projects.data }),
    ...(tasks.ok && { tasks: tasks.data }),
    ...(leaveRequests.ok && { leaveRequests: leaveRequests.data }),
    ...(leaveBalance.ok && { leaveBalances: { ...s.leaveBalances, [session.userId]: leaveBalance.data } }),
    ...(attendance.ok && withAttendance(s, range.from, range.to, attendance.data)),
    ...(notifications.ok && { notifications: notifications.data }),
    ...(activityLog.ok && { activityLog: activityLog.data }),
  }));
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

/** Re-reads recent attendance, for after an approval writes leave days. */
export async function refreshAttendance(): Promise<void> {
  if (!getState().session) return;
  const { from, to } = recentAttendanceRange();
  const result = handleUnauthorized(await fetchAttendance(from, to));
  if (result.ok) setState((s) => withAttendance(s, from, to, result.data));
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
