import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  employee: 'Employee',
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: 'badge-role-admin',
  project_manager: 'badge-role-pm',
  employee: 'badge-role-employee',
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export type Permission =
  | 'employees.manage'
  | 'attendance.viewAll'
  | 'attendance.export'
  | 'leave.review'
  | 'projects.manage'
  | 'tasks.manage'
  | 'activity.viewAll'
  | 'workspace.manage';

const PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    'employees.manage',
    'attendance.viewAll',
    'attendance.export',
    'leave.review',
    'projects.manage',
    'tasks.manage',
    'activity.viewAll',
    'workspace.manage',
  ]),
  project_manager: new Set<Permission>([
    'attendance.viewAll',
    'attendance.export',
    'leave.review',
    'projects.manage',
    'tasks.manage',
    'activity.viewAll',
  ]),
  employee: new Set<Permission>(),
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  return role ? PERMISSIONS[role].has(permission) : false;
}
