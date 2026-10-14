import type { EmployeeUpdate } from '@/types';
import { updateEmployeeProfile } from '@/server/employees';
import { handle, ok, readJson } from '@/server/http';
import { toEmployee } from '@/server/mappers';
import { requireUser } from '@/server/session';

type Context = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const actor = await requireUser();
  const { id } = await params;
  const body = await readJson<EmployeeUpdate>(request);
  const user = await updateEmployeeProfile(actor, id, body);
  return ok(toEmployee(user));
});
