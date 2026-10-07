import { Bell, Building2, Globe, Monitor, Moon, Palette, RotateCcw, Sun, type LucideIcon } from 'lucide-react';
import type { SegmentOption, SelectOption } from '@/components/ui';
import { LANGUAGES } from '@/constants/defaults';
import type { DateFormat, NotificationCategory, ThemeMode, TimeFormat, WeekStart } from '@/types';

export type SettingsSectionId = 'appearance' | 'regional' | 'notifications' | 'workspace' | 'reset';

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { id: 'regional', label: 'Language & region', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'workspace', label: 'Workspace', icon: Building2, adminOnly: true },
  { id: 'reset', label: 'Reset preferences', icon: RotateCcw },
];



export const THEME_LABELS: Record<ThemeMode, string> = { light: 'Light', dark: 'Dark', device: 'Device' };

export const LANGUAGE_OPTIONS: SelectOption[] = LANGUAGES.map((language) => ({ value: language, label: language }));

export const DATE_FORMATS: DateFormat[] = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'];

export const TIME_FORMAT_OPTIONS: SegmentOption<TimeFormat>[] = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

export const WEEK_START_OPTIONS: SegmentOption<WeekStart>[] = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Sunday', label: 'Sunday' },
];

export const NOTIFICATION_DESCRIPTIONS: Record<NotificationCategory, string> = {
  task: 'Task assignments, status changes and comments on your work.',
  project: 'When you are added to a project or a project you belong to changes.',
  leave: 'Leave requests you submit or need to review, and their decisions.',
  attendance: 'Attendance updates and check-in related alerts.',
  system: 'Account, role and security changes such as password resets.',
};

export const SECTION_BY_ID = Object.fromEntries(SETTINGS_SECTIONS.map((s) => [s.id, s])) as Record<SettingsSectionId, SettingsSectionMeta>;
