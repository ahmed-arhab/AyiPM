'use client';

import type { ReactNode } from 'react';
import { Briefcase, Shield, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/translations';
import {
  ATTENDANCE_STATUS,
  BADGE_TONE_CLASS,
  LEAVE_STATUS,
  NOTIFICATION_CATEGORY,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  type BadgeTone,
  type StatusMeta,
} from '@/constants/status';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '@/constants/roles';
import type { AttendanceStatus, LeaveStatus, NotificationCategory, ProjectStatus, TaskPriority, TaskStatus, UserRole } from '@/types';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({ tone = 'neutral', children, className, title }: BadgeProps) {
  return (
    <span className={cn('badge', BADGE_TONE_CLASS[tone], className)} title={title}>
      {children}
    </span>
  );
}

type StatusBadgeProps =
  | { kind: 'project'; value: ProjectStatus }
  | { kind: 'task'; value: TaskStatus }
  | { kind: 'priority'; value: TaskPriority }
  | { kind: 'attendance'; value: AttendanceStatus }
  | { kind: 'leave'; value: LeaveStatus }
  | { kind: 'notification'; value: NotificationCategory };

const STATUS_MAPS: Record<StatusBadgeProps['kind'], Record<string, StatusMeta>> = {
  project: PROJECT_STATUS,
  task: TASK_STATUS,
  priority: TASK_PRIORITY,
  attendance: ATTENDANCE_STATUS,
  leave: LEAVE_STATUS,
  notification: NOTIFICATION_CATEGORY,
};

export function StatusBadge(props: StatusBadgeProps) {
  const { t } = useT();
  const meta = STATUS_MAPS[props.kind][props.value];
  if (!meta) return null;
  return <Badge tone={meta.tone}>{t(meta.label)}</Badge>;
}

const ROLE_ICONS = { admin: Shield, project_manager: Briefcase, employee: User };

export function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useT();
  const Icon = ROLE_ICONS[role];
  return (
    <span className={cn('badge', ROLE_BADGE_CLASS[role])}>
      <Icon size={12} />
      {t(ROLE_LABELS[role])}
    </span>
  );
}
