import 'server-only';
import type { User } from '@prisma/client';
import { isValidEmail } from '@/lib/validation';
import { toDateKey } from '@/lib/date';
import type { AccessLink } from '@/types';
import { db } from './db';
import { createToken, hashPassword, hashToken, verifyPassword } from './crypto';
import { HttpError } from './http';
import { revokeSessions } from './session';
import { needsSetup, WORKSPACE_ID } from './workspace';

const MINUTE = 60_000;
const INVITE_TTL_MS = 7 * 24 * 60 * MINUTE;
const RESET_TTL_MS = 30 * MINUTE;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * MINUTE;
const LOCKOUT_MS = 15 * MINUTE;
const MIN_PASSWORD_LENGTH = 8;
const INVALID_CREDENTIALS = 'Incorrect email or password.';

function assertPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (password.length > 200) throw new HttpError(400, 'Password is too long.');
}

function lockedMessage(remainingMs: number) {
  const minutes = Math.max(1, Math.ceil(remainingMs / MINUTE));
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or ask your admin for a reset link.`;
}

export interface SetupInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export async function setupWorkspace(input: SetupInput): Promise<User> {
  const companyName = input.companyName.trim();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!companyName) throw new HttpError(400, 'Company name is required.');
  if (!name) throw new HttpError(400, 'Your name is required.');
  if (!isValidEmail(email)) throw new HttpError(400, 'Enter a valid work email.');
  assertPassword(input.password);

  const passwordHash = await hashPassword(input.password);
  return db.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) throw new HttpError(409, 'This workspace has already been set up.');
    const workspace = await tx.workspace.upsert({
      where: { id: WORKSPACE_ID },
      create: { id: WORKSPACE_ID, companyName },
      update: { companyName },
    });
    return tx.user.create({
      data: {
        name,
        email,
        employeeId: `${workspace.employeeIdPrefix}001`,
        department: 'Management',
        designation: 'Workspace Owner',
        role: 'admin',
        joinDate: toDateKey(),
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    });
  });
}

export { needsSetup };

async function attemptKey(rawIdentifier: string): Promise<{ key: string; user: User | null }> {
  const normalizedEmail = rawIdentifier.trim().toLowerCase();
  const normalizedId = rawIdentifier.trim().toUpperCase();
  const user = await db.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { employeeId: normalizedId }],
    },
  });
  return { key: user ? `user:${user.id}` : `email:${normalizedEmail}`, user };
}

async function recordFailure(key: string): Promise<boolean> {
  const now = Date.now();
  const previous = await db.loginAttempt.findUnique({ where: { key } });
  const withinWindow = previous && now - previous.firstFailedAt.getTime() < ATTEMPT_WINDOW_MS;
  const failures = withinWindow ? previous.failures + 1 : 1;
  const locked = failures >= MAX_FAILED_ATTEMPTS;
  const data = {
    failures: locked ? 0 : failures,
    firstFailedAt: withinWindow ? previous.firstFailedAt : new Date(now),
    lockedUntil: locked ? new Date(now + LOCKOUT_MS) : null,
  };
  await db.loginAttempt.upsert({ where: { key }, create: { key, ...data }, update: data });
  return locked;
}

export async function authenticate(rawEmail: string, password: string): Promise<User> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');
  const { key, user } = await attemptKey(email);

  const attempt = await db.loginAttempt.findUnique({ where: { key } });
  const remaining = attempt?.lockedUntil ? attempt.lockedUntil.getTime() - Date.now() : 0;
  if (remaining > 0) throw new HttpError(429, lockedMessage(remaining));

  const valid = await verifyPassword(password, user?.passwordHash);
  if (!valid || !user) {
    const locked = await recordFailure(key);
    throw new HttpError(locked ? 429 : 401, locked ? lockedMessage(LOCKOUT_MS) : INVALID_CREDENTIALS);
  }
  if (user.status !== 'active') throw new HttpError(403, 'This account has been deactivated. Contact your administrator.');

  await db.loginAttempt.deleteMany({ where: { key } });
  return user;
}

export async function issueInvite(userId: string, createdById: string): Promise<AccessLink> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.$transaction([
    db.invite.deleteMany({ where: { userId } }),
    db.invite.create({ data: { tokenHash: hashToken(token), userId, createdById, expiresAt } }),
  ]);
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function issuePasswordReset(userId: string): Promise<AccessLink> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.$transaction([
    db.passwordReset.deleteMany({ where: { userId } }),
    db.passwordReset.create({ data: { tokenHash: hashToken(token), userId, expiresAt } }),
    db.user.update({ where: { id: userId }, data: { passwordResetRequestedAt: null } }),
  ]);
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function findInvite(token: string) {
  if (!token) return null;
  const invite = await db.invite.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!invite || invite.expiresAt.getTime() < Date.now() || invite.user.passwordHash || invite.user.status !== 'active') return null;
  return invite;
}

export async function acceptInvite(token: string, password: string): Promise<User> {
  assertPassword(password);
  const invite = await findInvite(token);
  if (!invite) throw new HttpError(410, 'This invitation is invalid or has expired. Ask your admin for a new link.');
  const passwordHash = await hashPassword(password);
  const [user] = await db.$transaction([
    db.user.update({ where: { id: invite.userId }, data: { passwordHash, passwordUpdatedAt: new Date() } }),
    db.invite.deleteMany({ where: { userId: invite.userId } }),
  ]);
  return user;
}

export async function findPasswordReset(token: string) {
  if (!token) return null;
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!reset || reset.expiresAt.getTime() < Date.now() || reset.user.status !== 'active') return null;
  return reset;
}

export async function resetPassword(token: string, password: string): Promise<User> {
  assertPassword(password);
  const reset = await findPasswordReset(token);
  if (!reset) throw new HttpError(410, 'This reset link is invalid or has expired. Ask your admin for a new one.');
  const passwordHash = await hashPassword(password);
  const [user] = await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash, passwordUpdatedAt: new Date(), passwordResetRequestedAt: null } }),
    db.passwordReset.deleteMany({ where: { userId: reset.userId } }),
    db.loginAttempt.deleteMany({ where: { key: `user:${reset.userId}` } }),
  ]);
  await revokeSessions(reset.userId);
  return user;
}

export async function changePassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect.');
  assertPassword(newPassword);
  if (newPassword === currentPassword) throw new HttpError(400, 'New password must be different from the current one.');
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword), passwordUpdatedAt: new Date() } });
}

// Records the request for admins without revealing whether the account exists.
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return;
  await db.user.updateMany({ where: { email, status: 'active' }, data: { passwordResetRequestedAt: new Date() } });
}
