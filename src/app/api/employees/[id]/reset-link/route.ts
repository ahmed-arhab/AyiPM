import { issuePasswordReset } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, handle, ok } from '@/server/http';
import { requireUser } from '@/server/session';

type Context = { params: Promise<{ id: string }> };

export const POST = handle(async (_request: Request, { params }: Context) => {
  await requireUser('employees.manage');
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'Employee not found.');
  if (user.status !== 'active') throw new HttpError(400, 'Reactivate this account before sending a reset link.');
  if (!user.passwordHash) throw new HttpError(409, 'This person has not accepted their invitation yet. Share a new invite link instead.');
  return ok(await issuePasswordReset(user.id));
});
