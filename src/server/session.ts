import 'server-only';
import { cookies } from 'next/headers';
import type { User } from '@prisma/client';
import { hasPermission, type Permission } from '@/constants/roles';
import type { UserRole } from '@/types';
import { db } from './db';
import { createToken, hashToken } from './crypto';
import { HttpError } from './http';

const COOKIE_NAME = 'ayipm_session';
const HOUR = 60 * 60 * 1000;
const SESSION_TTL_MS = 12 * HOUR;
const REMEMBERED_SESSION_TTL_MS = 30 * 24 * HOUR;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function startSession(userId: string, remember: boolean): Promise<Date> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + (remember ? REMEMBERED_SESSION_TTL_MS : SESSION_TTL_MS));
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
  return expiresAt;
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ user: User; expiresAt: Date } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.status !== 'active' || !session.user.passwordHash) {
    return null;
  }
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return { user: session.user, expiresAt: session.expiresAt };
}

export async function requireUser(permission?: Permission): Promise<User> {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Your session has ended. Please sign in again.');
  if (permission && !hasPermission(session.user.role as UserRole, permission)) {
    throw new HttpError(403, 'You do not have permission to do that.');
  }
  return session.user;
}

export async function revokeSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
