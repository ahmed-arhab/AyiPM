import { matchesQuery } from '@/lib/format';
import { isValidEmail, type FieldErrors } from '@/lib/validation';
import { toDateKey } from '@/lib/date';
import { DEPARTMENTS } from '@/constants/defaults';
import type { Employee, EmployeeInput, EmployeeStatus, Project, UserRole } from '@/types';

export type TeamSort = 'name-asc' | 'name-desc' | 'role' | 'department' | 'newest';
export type TeamViewMode = 'grid' | 'table';
export type ProjectFilter = 'all' | 'unassigned' | (string & {});

export interface TeamFilters {
  department: string;
  role: 'all' | UserRole;
  status: 'all' | EmployeeStatus;
  project: ProjectFilter;
  sort: TeamSort;
}

export const DEFAULT_TEAM_FILTERS: TeamFilters = {
  department: 'all',
  role: 'all',
  status: 'all',
  project: 'all',
  sort: 'name-asc',
};

export const SORT_OPTIONS: { value: TeamSort; label: string }[] = [
  { value: 'name-asc', label: 'Name (A → Z)' },
  { value: 'name-desc', label: 'Name (Z → A)' },
  { value: 'role', label: 'Role' },
  { value: 'department', label: 'Department' },
  { value: 'newest', label: 'Newest joined' },
];

const ROLE_RANK: Record<UserRole, number> = { admin: 0, project_manager: 1, employee: 2 };

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full workspace access: onboards and deactivates members, manages roles, reviews leave, and configures workspace settings.',
  project_manager: 'Plans projects, assigns members, manages tasks, reviews leave requests and views team attendance.',
  employee: 'Works on assigned tasks, checks in and out for attendance, and requests leave.',
};

export function departmentOptions(employees: Employee[]): string[] {
  const set = new Set(DEPARTMENTS);
  employees.forEach((e) => e.department && set.add(e.department));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function compareMembers(sort: TeamSort) {
  return (a: Employee, b: Employee): number => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'role':
        return ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.name.localeCompare(b.name);
      case 'department':
        return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
      case 'newest':
        return (b.joinDate || b.createdAt).localeCompare(a.joinDate || a.createdAt);
      default:
        return a.name.localeCompare(b.name);
    }
  };
}

export function filterAndSortMembers(
  employees: Employee[],
  filters: TeamFilters,
  query: string,
  projectsByMember: Map<string, Project[]>
): Employee[] {
  return employees
    .filter((e) => {
      if (filters.department !== 'all' && e.department !== filters.department) return false;
      if (filters.role !== 'all' && e.role !== filters.role) return false;
      if (filters.status !== 'all' && e.status !== filters.status) return false;
      if (filters.project !== 'all') {
        const memberProjects = projectsByMember.get(e.id);
        if (filters.project === 'unassigned') {
          if (memberProjects && memberProjects.length > 0) return false;
        } else if (!memberProjects?.some((p) => p.id === filters.project)) {
          return false;
        }
      }
      return matchesQuery(query, e.name, e.email, e.employeeId, e.designation, e.department, e.location);
    })
    .sort(compareMembers(filters.sort));
}

export interface TeamStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  managers: number;
  staff: number;
  allocated: number;
}

export function computeTeamStats(employees: Employee[], projectsByMember: Map<string, Project[]>): TeamStats {
  const stats: TeamStats = { total: employees.length, active: 0, inactive: 0, admins: 0, managers: 0, staff: 0, allocated: 0 };
  employees.forEach((e) => {
    if (e.status === 'active') stats.active += 1;
    else stats.inactive += 1;
    if (e.role === 'admin') stats.admins += 1;
    else if (e.role === 'project_manager') stats.managers += 1;
    else stats.staff += 1;
    if ((projectsByMember.get(e.id)?.length ?? 0) > 0) stats.allocated += 1;
  });
  return stats;
}

export interface MemberFormValues {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
  phone: string;
  location: string;
  joinDate: string;
}

export function emptyMemberForm(): MemberFormValues {
  return {
    name: '',
    email: '',
    employeeId: '',
    department: DEPARTMENTS[0],
    designation: '',
    role: 'employee',
    phone: '',
    location: '',
    joinDate: toDateKey(),
  };
}

export function memberFormFromEmployee(e: Employee): MemberFormValues {
  return {
    name: e.name,
    email: e.email,
    employeeId: e.employeeId,
    department: e.department,
    designation: e.designation,
    role: e.role,
    phone: e.phone ?? '',
    location: e.location ?? '',
    joinDate: e.joinDate,
  };
}

export function validateMemberForm(values: MemberFormValues, requireEmployeeId = false): FieldErrors<MemberFormValues> {
  const errors: FieldErrors<MemberFormValues> = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address.';
  if (requireEmployeeId && !values.employeeId.trim()) errors.employeeId = 'Employee ID is required.';
  if (!values.department) errors.department = 'Choose a department.';
  if (!values.designation.trim()) errors.designation = 'Designation is required.';
  return errors;
}

export function toEmployeeInput(values: MemberFormValues): EmployeeInput {
  return {
    name: values.name,
    email: values.email,
    employeeId: values.employeeId.trim() || undefined,
    department: values.department,
    designation: values.designation,
    role: values.role,
    phone: values.phone,
    location: values.location,
    joinDate: values.joinDate || undefined,
  };
}
