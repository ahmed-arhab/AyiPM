import { nowIso } from '@/lib/id';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/constants/roles';
import type { AccessLink, ActionResult, Employee, EmployeeInput, EmployeeStatus, EmployeeUpdate, UserRole } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { logActivity } from './activity';
import { notify } from './notifications';
import { handleUnauthorized, upsertEmployee } from './session';

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

export async function addEmployee(input: EmployeeInput): Promise<ActionResult<{ employee: Employee; invite: AccessLink }>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<{ employee: Employee; invite: AccessLink }>('POST', '/api/employees', input));
  if (!result.ok) return result;

  const { employee } = result.data;
  upsertEmployee(employee);
  logActivity({
    actor: auth.data,
    action: 'Invited Employee',
    entityType: 'employee',
    entityId: employee.id,
    entityName: employee.name,
    details: `${employee.designation} · ${employee.employeeId}`,
  });
  return ok(result.data);
}

export async function updateEmployee(id: string, update: EmployeeUpdate): Promise<ActionResult<Employee>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Employee>('PATCH', `/api/employees/${id}`, update));
  if (!result.ok) return result;

  upsertEmployee(result.data);
  logActivity({
    actor: auth.data,
    action: auth.data.id === id ? 'Updated Own Profile' : 'Updated Employee Profile',
    entityType: 'employee',
    entityId: id,
    entityName: result.data.name,
  });
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
  logActivity({
    actor: auth.data,
    action: 'Updated Employee Role',
    entityType: 'employee',
    entityId: id,
    entityName: previous.name,
    details: `${ROLE_LABELS[previous.role]} → ${ROLE_LABELS[role]}`,
  });
  notify([id], {
    title: 'Your role was updated',
    message: `${auth.data.name} changed your role to ${ROLE_LABELS[role]}.`,
    category: 'system',
    priority: 'high',
    senderId: auth.data.id,
  });
  return ok();
}

export async function setEmployeeStatus(id: string, status: EmployeeStatus): Promise<ActionResult> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Employee>('PUT', `/api/employees/${id}/status`, { status }));
  if (!result.ok) return result;
  upsertEmployee(result.data);
  logActivity({
    actor: auth.data,
    action: status === 'active' ? 'Reactivated Employee' : 'Deactivated Employee',
    entityType: 'employee',
    entityId: id,
    entityName: result.data.name,
  });
  return ok();
}

export async function regenerateInvite(id: string): Promise<ActionResult<AccessLink>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AccessLink>('POST', `/api/employees/${id}/invite`));
  if (!result.ok) return result;
  const target = getState().employees.find((e) => e.id === id);
  logActivity({ actor: auth.data, action: 'Issued Invitation Link', entityType: 'employee', entityId: id, entityName: target?.name ?? 'Employee' });
  return ok(result.data);
}

export async function sendPasswordResetLink(id: string): Promise<ActionResult<AccessLink>> {
  const auth = authorize('employees.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AccessLink>('POST', `/api/employees/${id}/reset-link`));
  if (!result.ok) return result;
  setState((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, passwordResetRequestedAt: undefined } : e)) }));
  const target = getState().employees.find((e) => e.id === id);
  logActivity({ actor: auth.data, action: 'Issued Password Reset Link', entityType: 'auth', entityId: id, entityName: target?.name ?? 'Employee' });
  return ok(result.data);
}

export function setEmployeeProjects(employeeId: string, projectIds: string[]): ActionResult {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const target = getState().employees.find((e) => e.id === employeeId);
  if (!target) return fail('Employee not found.');

  const wanted = new Set(projectIds);
  const { projects } = getState();
  const added = projects.filter((p) => wanted.has(p.id) && !p.members.includes(employeeId)).map((p) => p.name);
  const timestamp = nowIso();
  setState({
    projects: projects.map((p) => {
      const isMember = p.members.includes(employeeId);
      if (wanted.has(p.id) && !isMember) return { ...p, members: [...p.members, employeeId], updatedAt: timestamp };
      if (!wanted.has(p.id) && isMember) return { ...p, members: p.members.filter((m) => m !== employeeId), updatedAt: timestamp };
      return p;
    }),
  });
  logActivity({
    actor: auth.data,
    action: 'Updated Project Assignments',
    entityType: 'employee',
    entityId: employeeId,
    entityName: target.name,
    details: `Assigned to ${projectIds.length} project(s)`,
  });
  if (added.length > 0) {
    notify([employeeId], {
      title: 'Added to project',
      message: `You were added to ${added.join(', ')}.`,
      category: 'project',
      priority: 'normal',
      link: '/projects',
      senderId: auth.data.id,
    });
  }
  return ok();
}
