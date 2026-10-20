import { createStore } from '@/lib/store';
import type { ActionResult, Employee } from '@/types';
import { hasPermission, type Permission } from '@/constants/roles';
import { createInitialState, type AppState } from './state';
import { isSessionActive } from './session';

export const appStore = createStore<AppState>(createInitialState());

export const getState = appStore.getState;
export const setState = appStore.setState;

export function getCurrentUser(): Employee | undefined {
  const { session, employees } = getState();
  if (!isSessionActive(session)) return undefined;
  return employees.find((e) => e.id === session.userId && e.status === 'active');
}

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail<T = void>(error: string): ActionResult<T> {
  return { ok: false, error };
}

export function authorize(permission?: Permission): ActionResult<Employee> {
  const user = getCurrentUser();
  if (!user) return fail('You must be signed in to do that.');
  if (permission && !hasPermission(user.role, permission)) {
    return fail('You do not have permission to do that.');
  }
  return ok(user);
}
