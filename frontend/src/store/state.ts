import type {
  ActivityLogItem,
  AttendanceRecord,
  Employee,
  LeaveBalance,
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

// Nothing is saved in the browser any more; #111 removes this and the code that saved it.
export interface PersistedState {}

// Loaded from the backend after sign-in and cleared on sign-out.
export interface ServerState {
  session: Session | null;
  employees: Employee[];
  workspace: WorkspaceSettings;
  needsSetup: boolean;
  projects: Project[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  // Keyed by employee. Yours loads with the workspace; someone else's when their profile shows it.
  leaveBalances: Record<string, LeaveBalance>;
  // Every visible record from attendanceSince on. Recent months load with the workspace; older ones on request.
  attendance: AttendanceRecord[];
  attendanceSince: string | null;
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

export const PERSISTED_KEYS: (keyof PersistedState)[] = [];

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
    leaveRequests: [],
    leaveBalances: {},
    attendance: [],
    attendanceSince: null,
    activityLog: [],
    notifications: [],
    preferences: {},
    twoFactor: null,
    googleSignIn: false,
    newRecoveryCodes: null,
  };
}
