import type { LeaveAllowance } from './leave';
import type { NotificationCategory } from './notification';

export type ThemeMode = 'light' | 'dark' | 'device';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '12h' | '24h';
export type WeekStart = 'Monday' | 'Sunday';

export interface UserPreferences {
  language: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  notificationCategories: Record<NotificationCategory, boolean>;
}

export interface WorkspaceSettings {
  companyName: string;
  timezone: string;
  workDayStart: string;
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  leaveAllowance: LeaveAllowance;
  employeeIdPrefix: string;
}
