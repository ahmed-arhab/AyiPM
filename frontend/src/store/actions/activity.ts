import { createId, nowIso } from '@/lib/id';
import { MAX_ACTIVITY_ITEMS } from '@/constants/defaults';
import type { ActivityEntityType, Employee } from '@/types';
import { setState } from '../appStore';

interface ActivityInput {
  actor: Employee;
  action: string;
  entityType: ActivityEntityType;
  entityName: string;
  entityId?: string;
  details?: string;
}

export function logActivity({ actor, ...input }: ActivityInput): void {
  const item = {
    id: createId('act'),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt: nowIso(),
    ...input,
  };
  setState((s) => ({ activityLog: [item, ...s.activityLog].slice(0, MAX_ACTIVITY_ITEMS) }));
}
