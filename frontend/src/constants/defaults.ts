import type { UserPreferences, WorkspaceSettings } from '@/types';

export const STORAGE_KEY = 'ayipm:v3:state';
export const THEME_STORAGE_KEY = 'ayipm:v2:theme';
export const LANGUAGE_STORAGE_KEY = 'ayipm:v2:language';
export const LEGACY_STORAGE_KEYS = ['ayipm:v2:state'];
export const LEGACY_STORAGE_PREFIX = 'ayipm_';

export const MAX_ACTIVITY_ITEMS = 500;
export const MAX_NOTIFICATIONS_PER_USER = 100;

export const DEFAULT_WORKSPACE: WorkspaceSettings = {
  companyName: 'AyiPM',
  timezone: 'Asia/Colombo',
  workDayStart: '09:00',
  gracePeriodMinutes: 15,
  halfDayThresholdHours: 4.5,
  leaveAllowance: { annual: 20, sick: 10, casual: 7 },
  employeeIdPrefix: 'AX',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'English (US)',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '12h',
  weekStart: 'Monday',
  notificationCategories: {
    task: true,
    project: true,
    leave: true,
    attendance: true,
    system: true,
  },
};

export const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Quality Assurance', 'Operations', 'Human Resources', 'Finance', 'Sales', 'Marketing'];

export const LANGUAGES = ['English (US)', 'English (UK)', 'Sinhala', 'Tamil'];

export const TIMEZONES = ['Asia/Colombo', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC'];
