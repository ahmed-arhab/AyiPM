import { memoizeOne } from '@/lib/store';
import { isSameYear, toDateKey } from '@/lib/date';
import { percent } from '@/lib/format';
import { DEFAULT_PREFERENCES, LANGUAGE_STORAGE_KEY } from '@/constants/defaults';
import { storage } from '@/lib/storage';
import type {
  Employee,
  LeaveAllowance,
  LeaveBalance,
  LeaveRequest,
  NotificationItem,
  Project,
  Task,
  UserPreferences,
} from '@/types';
import type { AppState } from './state';
import { isSessionActive } from './session';

export const selectCurrentUser = (s: AppState): Employee | undefined =>
  isSessionActive(s.session) ? s.employees.find((e) => e.id === s.session?.userId && e.status === 'active') : undefined;

export const selectPendingInviteIds = memoizeOne((employees: Employee[]) => new Set(employees.filter((e) => e.invited).map((e) => e.id)));

export const selectEmployeesById = memoizeOne(
  (employees: Employee[]) => new Map(employees.map((e) => [e.id, e]))
);

export const selectProjectsById = memoizeOne(
  (projects: Project[]) => new Map(projects.map((p) => [p.id, p]))
);

export const selectActiveEmployees = memoizeOne((employees: Employee[]) => employees.filter((e) => e.status === 'active'));

export interface ProjectProgress {
  total: number;
  done: number;
  progress: number;
}

export const selectProjectProgress = memoizeOne((projects: Project[], tasks: Task[]) => {
  const counts = new Map<string, { total: number; done: number }>();
  tasks.forEach((t) => {
    const entry = counts.get(t.projectId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (t.status === 'done') entry.done += 1;
    counts.set(t.projectId, entry);
  });
  const result = new Map<string, ProjectProgress>();
  projects.forEach((p) => {
    const { total, done } = counts.get(p.id) ?? { total: 0, done: 0 };
    result.set(p.id, { total, done, progress: p.status === 'completed' ? 100 : percent(done, total) });
  });
  return result;
});

export const selectTasksByAssignee = memoizeOne((tasks: Task[]) => {
  const map = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (!t.assigneeId) return;
    const list = map.get(t.assigneeId) ?? [];
    list.push(t);
    map.set(t.assigneeId, list);
  });
  return map;
});

export const selectProjectsByMember = memoizeOne((projects: Project[]) => {
  const map = new Map<string, Project[]>();
  projects.forEach((p) =>
    p.members.forEach((id) => {
      const list = map.get(id) ?? [];
      list.push(p);
      map.set(id, list);
    })
  );
  return map;
});

const selectNotificationsForUser = memoizeOne((notifications: NotificationItem[], userId: string | undefined) =>
  userId ? notifications.filter((n) => n.recipientId === userId) : []
);

export const selectMyNotifications = (s: AppState): NotificationItem[] =>
  selectNotificationsForUser(s.notifications, s.session?.userId);

export const selectUnreadCount = (s: AppState): number => selectMyNotifications(s).filter((n) => !n.read).length;

export const selectMyPreferences = (s: AppState): UserPreferences => {
  const storedLang = storage.readRaw(LANGUAGE_STORAGE_KEY) || DEFAULT_PREFERENCES.language;
  if (s.session && s.preferences[s.session.userId]) {
    const userPref = s.preferences[s.session.userId];
    return {
      ...DEFAULT_PREFERENCES,
      ...userPref,
      language: userPref.language || storedLang,
    };
  }
  return {
    ...DEFAULT_PREFERENCES,
    language: storedLang,
  };
};

export function computeLeaveBalance(
  requests: LeaveRequest[],
  employeeId: string,
  allowance: LeaveAllowance,
  ref: Date = new Date()
): LeaveBalance {
  const used = { Annual: 0, Sick: 0, Casual: 0, Unpaid: 0 };
  requests.forEach((r) => {
    if (r.employeeId === employeeId && r.status === 'approved' && isSameYear(r.startDate, ref)) {
      used[r.leaveType] += r.days;
    }
  });
  return {
    annual: { total: allowance.annual, used: used.Annual },
    sick: { total: allowance.sick, used: used.Sick },
    casual: { total: allowance.casual, used: used.Casual },
  };
}

export const selectTodayAttendanceCount = (s: AppState): number => {
  const today = toDateKey();
  return s.attendance.filter((a) => a.date === today && (a.status === 'present' || a.status === 'late' || a.status === 'half_day')).length;
};

export interface NavCounts {
  activeEmployees: number;
  attendanceToday: string;
  pendingLeaves: number;
  activeProjects: number;
  openTasks: number;
  unreadNotifications: number;
}

export const selectNavCounts = (s: AppState): NavCounts => {
  const active = s.employees.filter((e) => e.status === 'active').length;
  return {
    activeEmployees: active,
    attendanceToday: `${selectTodayAttendanceCount(s)}/${active}`,
    pendingLeaves: s.leaveRequests.filter((r) => r.status === 'pending').length,
    activeProjects: s.projects.filter((p) => p.status !== 'completed').length,
    openTasks: s.tasks.filter((t) => t.status !== 'done').length,
    unreadNotifications: selectUnreadCount(s),
  };
};
