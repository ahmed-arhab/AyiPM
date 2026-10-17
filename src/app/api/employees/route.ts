import type { EmployeeInput } from '@/types';
import { issueInvite } from '@/server/auth';
import { db } from '@/server/db';
import { createEmployee } from '@/server/employees';
import { handle, ok, readJson } from '@/server/http';
import { toEmployee } from '@/server/mappers';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  await requireUser();
  const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
  return ok(users.map(toEmployee));
});

export const POST = handle(async (request: Request) => {
  const actor = await requireUser('employees.manage');
  const body = await readJson<EmployeeInput>(request);
  const user = await createEmployee(body as EmployeeInput);
  const invite = user.passwordHash ? null : await issueInvite(user.id, actor.id);
  return ok({ employee: toEmployee(user), invite }, { status: 201 });
});
