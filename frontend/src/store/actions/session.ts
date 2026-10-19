import { api, type ApiResult } from '@/lib/api';
import { DEFAULT_WORKSPACE } from '@/constants/defaults';
import type { BootstrapPayload, Employee } from '@/types';
import { getState, setState } from '../appStore';

export function applyBootstrap(payload: BootstrapPayload): void {
  setState({
    needsSetup: payload.needsSetup,
    session: payload.user && payload.expiresAt ? { userId: payload.user.id, expiresAt: payload.expiresAt } : null,
    employees: payload.employees,
    workspace: payload.workspace ? { ...DEFAULT_WORKSPACE, ...payload.workspace } : DEFAULT_WORKSPACE,
  });
}

export function clearSession(): void {
  setState({ session: null, employees: [] });
}

// A 401 from any endpoint means the server-side session is gone, so mirror that locally.
export function handleUnauthorized<T>(result: ApiResult<T>): ApiResult<T> {
  if (!result.ok && result.status === 401 && getState().session) clearSession();
  return result;
}

export async function refreshSession(): Promise<boolean> {
  const result = await api<BootstrapPayload>('GET', '/api/auth/session');
  if (!result.ok) return false;
  applyBootstrap(result.data);
  return true;
}

export function upsertEmployee(employee: Employee): void {
  setState((s) => ({
    employees: s.employees.some((e) => e.id === employee.id)
      ? s.employees.map((e) => (e.id === employee.id ? employee : e))
      : [...s.employees, employee],
  }));
}
