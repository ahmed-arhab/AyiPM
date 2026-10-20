import type {
  AttendanceStatus,
  LeaveStatus,
  LeaveType,
  NotificationCategory,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@/types';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
  color: string;
}

export const PROJECT_STATUS: Record<ProjectStatus, StatusMeta> = {
  planning: { label: 'Planning', tone: 'purple', color: '#B4BECC' },
  in_progress: { label: 'In Progress', tone: 'info', color: '#677386' },
  in_review: { label: 'In Review', tone: 'warning', color: '#8C97A8' },
  on_hold: { label: 'On Hold', tone: 'danger', color: '#4B5567' },
  completed: { label: 'Completed', tone: 'success', color: '#353E4E' },
};

export const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  backlog: { label: 'To Do', tone: 'neutral', color: '#B4BECC' },
  in_progress: { label: 'In Progress', tone: 'info', color: '#8C97A8' },
  review: { label: 'Review', tone: 'warning', color: '#677386' },
  done: { label: 'Completed', tone: 'success', color: '#353E4E' },
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];

export const TASK_PRIORITY: Record<TaskPriority, StatusMeta & { rank: number }> = {
  urgent: { label: 'Urgent', tone: 'danger', color: '#353E4E', rank: 0 },
  high: { label: 'High', tone: 'warning', color: '#4B5567', rank: 1 },
  medium: { label: 'Medium', tone: 'info', color: '#8C97A8', rank: 2 },
  low: { label: 'Low', tone: 'neutral', color: '#B4BECC', rank: 3 },
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export const ATTENDANCE_STATUS: Record<AttendanceStatus, StatusMeta> = {
  present: { label: 'Present', tone: 'success', color: '#4B5567' },
  late: { label: 'Late', tone: 'warning', color: '#677386' },
  half_day: { label: 'Half Day', tone: 'warning', color: '#8C97A8' },
  absent: { label: 'Absent', tone: 'danger', color: '#353E4E' },
  leave: { label: 'On Leave', tone: 'info', color: '#B4BECC' },
};

export const LEAVE_STATUS: Record<LeaveStatus, StatusMeta> = {
  pending: { label: 'Pending Review', tone: 'warning', color: '#8C97A8' },
  approved: { label: 'Approved', tone: 'success', color: '#4B5567' },
  rejected: { label: 'Rejected', tone: 'danger', color: '#353E4E' },
};

export const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'Casual', 'Unpaid'];

export const NOTIFICATION_CATEGORY: Record<NotificationCategory, StatusMeta> = {
  task: { label: 'Task', tone: 'info', color: '#353E4E' },
  project: { label: 'Project', tone: 'purple', color: '#4B5567' },
  leave: { label: 'Leave', tone: 'warning', color: '#677386' },
  attendance: { label: 'Attendance', tone: 'success', color: '#8C97A8' },
  system: { label: 'System', tone: 'neutral', color: '#B4BECC' },
};

export const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
  purple: 'badge-purple',
};
