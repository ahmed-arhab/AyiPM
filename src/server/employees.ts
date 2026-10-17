import 'server-only';
import type { Prisma, User } from '@prisma/client';
import { isValidEmail } from '@/lib/validation';
import { toDateKey } from '@/lib/date';
import type { EmployeeInput, EmployeeStatus, EmployeeUpdate, UserRole } from '@/types';
import { db } from './db';
import { HttpError } from './http';
import { hashPassword } from './crypto';
import { getEmployeeIdPrefix } from './workspace';
import { revokeSessions } from './session';

const ROLES: UserRole[] = ['admin', 'project_manager', 'employee'];
const STATUSES: EmployeeStatus[] = ['active', 'inactive'];
const SELF_EDITABLE: (keyof EmployeeUpdate)[] = ['name', 'email', 'phone', 'location', 'bio', 'avatar'];
const ADMIN_EDITABLE: (keyof EmployeeUpdate)[] = [...SELF_EDITABLE, 'employeeId', 'department', 'designation', 'joinDate'];
const MAX_AVATAR_LENGTH = 400_000;

export function assertRole(role: unknown): asserts role is UserRole {
  if (!ROLES.includes(role as UserRole)) throw new HttpError(400, 'Choose a valid role.');
}

export async function nextEmployeeId(): Promise<string> {
  const prefix = await getEmployeeIdPrefix();
  const users = await db.user.findMany({ where: { employeeId: { startsWith: prefix } }, select: { employeeId: true } });
  const max = users.reduce((acc, u) => {
    const n = parseInt(u.employeeId.slice(prefix.length), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

async function assertUniqueIdentity(email: string, employeeId: string | undefined, excludeId?: string) {
  if (!isValidEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const conflict = await db.user.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [{ email }, ...(employeeId ? [{ employeeId }] : [])],
    },
    select: { email: true, employeeId: true },
  });
  if (!conflict) return;
  if (conflict.email === email) throw new HttpError(409, 'An account with this email address already exists.');
  throw new HttpError(409, `Employee ID "${employeeId}" is already in use.`);
}

export async function createEmployee(input: EmployeeInput): Promise<User> {
  const name = input.name?.trim();
  const designation = input.designation?.trim();
  const email = input.email?.trim().toLowerCase();
  const requestedId = input.employeeId?.trim().toUpperCase() || undefined;
  if (!name) throw new HttpError(400, 'Full name is required.');
  if (!designation) throw new HttpError(400, 'Designation is required.');
  if (!input.department) throw new HttpError(400, 'Department is required.');
  assertRole(input.role);
  await assertUniqueIdentity(email ?? '', requestedId);

  let passwordHash: string | null = null;
  if (input.password) {
    if (input.password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters.');
    }
    if (input.password.length > 200) {
      throw new HttpError(400, 'Password is too long.');
    }
    passwordHash = await hashPassword(input.password);
  }

  return db.user.create({
    data: {
      name,
      email: email!,
      employeeId: requestedId ?? (await nextEmployeeId()),
      department: input.department,
      designation,
      role: input.role,
      joinDate: input.joinDate || toDateKey(),
      phone: input.phone?.trim() || null,
      location: input.location?.trim() || null,
      passwordHash,
      passwordUpdatedAt: passwordHash ? new Date() : null,
    },
  });
}

export async function updateEmployeeProfile(actor: User, id: string, update: EmployeeUpdate): Promise<User> {
  const isAdmin = actor.role === 'admin';
  if (!isAdmin && actor.id !== id) throw new HttpError(403, 'You can only edit your own profile.');
  const target = await db.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'Employee not found.');

  const allowed = isAdmin ? ADMIN_EDITABLE : SELF_EDITABLE;
  const data: Prisma.UserUpdateInput = {};
  for (const key of allowed) {
    if (!(key in update)) continue;
    const raw = update[key];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (key === 'name' && !value) throw new HttpError(400, 'Name is required.');
    if (key === 'avatar' && typeof value === 'string' && value.length > MAX_AVATAR_LENGTH) throw new HttpError(413, 'Profile photo is too large.');
    (data as Record<string, unknown>)[key] = value === '' ? null : value;
  }
  if (typeof data.email === 'string') data.email = data.email.toLowerCase();
  if (typeof data.employeeId === 'string') data.employeeId = data.employeeId.toUpperCase();
  if (data.email !== undefined || data.employeeId !== undefined) {
    await assertUniqueIdentity((data.email as string) ?? target.email, data.employeeId as string | undefined, id);
  }
  return db.user.update({ where: { id }, data });
}

async function countOtherActiveAdmins(excludeId: string) {
  return db.user.count({ where: { id: { not: excludeId }, role: 'admin', status: 'active' } });
}

export async function changeRole(actor: User, id: string, role: unknown): Promise<User> {
  assertRole(role);
  const target = await db.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'Employee not found.');
  if (target.role === role) return target;
  if (target.role === 'admin' && (await countOtherActiveAdmins(id)) === 0) throw new HttpError(400, 'The workspace needs at least one active admin.');
  if (actor.id === id) throw new HttpError(400, 'You cannot change your own role.');
  return db.user.update({ where: { id }, data: { role } });
}

export async function changeStatus(actor: User, id: string, status: unknown): Promise<User> {
  if (!STATUSES.includes(status as EmployeeStatus)) throw new HttpError(400, 'Choose a valid status.');
  if (actor.id === id) throw new HttpError(400, 'You cannot change your own account status.');
  const target = await db.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'Employee not found.');
  if (target.status === status) return target;
  if (status === 'inactive' && target.role === 'admin' && (await countOtherActiveAdmins(id)) === 0) {
    throw new HttpError(400, 'The workspace needs at least one active admin.');
  }
  const updated = await db.user.update({ where: { id }, data: { status: status as EmployeeStatus } });
  if (status === 'inactive') await revokeSessions(id);
  return updated;
}
