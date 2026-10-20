import type {
  ActivityLogItem,
  AttendanceRecord,
  Employee,
  LeaveRequest,
  NotificationItem,
  Project,
  Session,
  Task,
  ThemeMode,
  UserPreferences,
  WorkspaceSettings,
} from '@/types';
import { DEFAULT_WORKSPACE } from '@/constants/defaults';

export interface PersistedState {
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  activityLog: ActivityLogItem[];
  notifications: NotificationItem[];
  preferences: Record<string, UserPreferences>;
}

export interface ServerState {
  session: Session | null;
  employees: Employee[];
  workspace: WorkspaceSettings;
  needsSetup: boolean;
}

export interface AppState extends PersistedState, ServerState {
  hydrated: boolean;
  theme: ThemeMode;
}

export const PERSISTED_KEYS: (keyof PersistedState)[] = [
  'projects',
  'tasks',
  'attendance',
  'leaveRequests',
  'activityLog',
  'notifications',
  'preferences',
];

export function createInitialState(): AppState {
  return {
    hydrated: false,
    theme: 'light',
    needsSetup: false,
    session: null,
    employees: [],
    workspace: DEFAULT_WORKSPACE,
    projects: [],
    tasks: [],
    attendance: [],
    leaveRequests: [],
    activityLog: [],
    notifications: [],
    preferences: {},
  };
}
