import { changeStatus } from '@/server/employees';
import { handle, ok, readJson } from '@/server/http';
import { toEmployee } from '@/server/mappers';
import { requireUser } from '@/server/session';

type Context = { params: Promise<{ id: string }> };

export const PUT = handle(async (request: Request, { params }: Context) => {
  const actor = await requireUser('employees.manage');
  const { id } = await params;
  const body = await readJson<{ status: string }>(request);
  return ok(toEmployee(await changeStatus(actor, id, body.status)));
});
