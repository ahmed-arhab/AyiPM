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
  TwoFactorStatus,
  UserPreferences,
  WorkspaceSettings,
} from '@/types';
import { DEFAULT_WORKSPACE } from '@/constants/defaults';

// Attendance is the last thing still saved in the browser, until the attendance API (#103) lands.
export interface PersistedState {
  attendance: AttendanceRecord[];
}

// Loaded from the backend after sign-in and cleared on sign-out.
export interface ServerState {
  session: Session | null;
  employees: Employee[];
  workspace: WorkspaceSettings;
  needsSetup: boolean;
  projects: Project[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  activityLog: ActivityLogItem[];
  notifications: NotificationItem[];
  // Only the signed-in person's entry is filled in.
  preferences: Record<string, UserPreferences>;
  twoFactor: TwoFactorStatus | null;
  googleSignIn: boolean;
}

export interface AppState extends PersistedState, ServerState {
  hydrated: boolean;
  theme: ThemeMode;
  // Shown once, then forgotten. Kept here so they survive the redirect after signing in.
  newRecoveryCodes: string[] | null;
}

export const PERSISTED_KEYS: (keyof PersistedState)[] = ['attendance'];

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
    twoFactor: null,
    googleSignIn: false,
    newRecoveryCodes: null,
  };
}
