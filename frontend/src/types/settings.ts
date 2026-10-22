import type { ApiSchema, Narrowed } from './api-schema';
import type { NotificationCategory } from './notification';

// The theme stays in the browser. The backend sends the others as strings and accepts only these values.
export type ThemeMode = 'light' | 'dark' | 'device';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '12h' | '24h';
export type WeekStart = 'Monday' | 'Sunday';

export type UserPreferences = Narrowed<
  ApiSchema<'PreferencesResponse'>,
  {
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
    weekStart: WeekStart;
    notificationCategories: Record<NotificationCategory, boolean>;
  }
>;

export type WorkspaceSettings = ApiSchema<'WorkspaceSettings'>;
