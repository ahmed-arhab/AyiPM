import { changeRole } from '@/server/employees';
import { handle, ok, readJson } from '@/server/http';
import { toEmployee } from '@/server/mappers';
import { requireUser } from '@/server/session';

type Context = { params: Promise<{ id: string }> };

export const PUT = handle(async (request: Request, { params }: Context) => {
  const actor = await requireUser('employees.manage');
  const { id } = await params;
  const body = await readJson<{ role: string }>(request);
  return ok(toEmployee(await changeRole(actor, id, body.role)));
});
