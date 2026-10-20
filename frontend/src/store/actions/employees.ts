import { api } from '@/lib/api';
import type { AccessLink, ActionResult, Employee, EmployeeInput, EmployeeStatus, EmployeeUpdate, UserRole } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { handleUnauthorized, refreshActivity, upsertEmployee } from './session';

// The backend records activity and sends notifications for these actions.

export function generateEmployeeId(): string {
  const { employees, workspace } = getState();
  const prefix = workspace.employeeIdPrefix;
  const max = employees.reduce((acc, e) => {
    if (!e.employeeId.toUpperCase().startsWith(prefix.toUpperCase())) return acc;
    const n = parseInt(e.employeeId.slice(prefix.length), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export async function addEmployee(input: EmployeeInput): Promise<ActionResult<{ employee: Employee; invite?: AccessLink | null }>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<{ employee: Employee; invite?: AccessLink | null }>('POST', '/api/employees', input));
  if (!result.ok) return result;

  const { employee } = result.data;
  upsertEmployee(employee);
  void refreshActivity();
  return ok(result.data);
}

export async function updateEmployee(id: string, update: EmployeeUpdate): Promise<ActionResult<Employee>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Employee>('PATCH', `/api/employees/${id}`, update));
  if (!result.ok) return result;

  upsertEmployee(result.data);
  void refreshActivity();
  return ok(result.data);
}

export async function setEmployeeRole(id: string, role: UserRole): Promise<ActionResult> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const previous = getState().employees.find((e) => e.id === id);
  if (!previous) return fail('Employee not found.');
  if (previous.role === role) return ok();

  const result = handleUnauthorized(await api<Employee>('PUT', `/api/employees/${id}/role`, { role }));
  if (!result.ok) return result;
  upsertEmployee(result.data);
  void refreshActivity();
  return ok();
}

export async function setEmployeeStatus(id: string, status: EmployeeStatus): Promise<ActionResult> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Employee>('PUT', `/api/employees/${id}/status`, { status }));
  if (!result.ok) return result;
  upsertEmployee(result.data);
  void refreshActivity();
  return ok();
}

export async function regenerateInvite(id: string): Promise<ActionResult<AccessLink>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AccessLink>('POST', `/api/employees/${id}/invite`));
  if (!result.ok) return result;
  void refreshActivity();
  return ok(result.data);
}

export async function sendPasswordResetLink(id: string): Promise<ActionResult<AccessLink>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AccessLink>('POST', `/api/employees/${id}/reset-link`));
  if (!result.ok) return result;
  setState((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, passwordResetRequestedAt: undefined } : e)) }));
  void refreshActivity();
  return ok(result.data);
}

