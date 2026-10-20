import {
  CalendarCheck,
  CheckSquare,
  FolderKanban,
  KeyRound,
  PlaneTakeoff,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ROLE_LABELS } from '@/constants/roles';
import { byNewest, toDateKey } from '@/lib/date';
import { toCsv } from '@/lib/csv';
import { matchesQuery } from '@/lib/format';
import type { SelectOption } from '@/components/ui/Form';
import type { ActivityEntityType, ActivityLogItem } from '@/types';

export const ACTIVITY_PAGE_SIZE = 25;

export type EntityFilter = ActivityEntityType | 'all';

export const ENTITY_META: Record<ActivityEntityType, { label: string; icon: LucideIcon }> = {
  employee: { label: 'Employees', icon: Users },
  project: { label: 'Projects', icon: FolderKanban },
  task: { label: 'Tasks', icon: CheckSquare },
  attendance: { label: 'Attendance', icon: CalendarCheck },
  leave: { label: 'Leave', icon: PlaneTakeoff },
  auth: { label: 'Access', icon: KeyRound },
  settings: { label: 'Settings', icon: Settings },
};

export const ENTITY_TYPES = Object.keys(ENTITY_META) as ActivityEntityType[];

export interface ActivityFilterState {
  entity: EntityFilter;
  actorId: string;
  query: string;
  from: string;
  to: string;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilterState = { entity: 'all', actorId: '', query: '', from: '', to: '' };

export function filterActivity(items: ActivityLogItem[], filters: ActivityFilterState): ActivityLogItem[] {
  const { entity, actorId, query, from, to } = filters;
  return items
    .filter((item) => {
      if (entity !== 'all' && item.entityType !== entity) return false;
      if (actorId && item.actorId !== actorId) return false;
      if (from || to) {
        const day = toDateKey(new Date(item.createdAt));
        if ((from && day < from) || (to && day > to)) return false;
      }
      return matchesQuery(query, item.action, item.entityName, item.details, item.actorName);
    })
    .sort(byNewest);
}

export function countByEntity(items: ActivityLogItem[]): Record<EntityFilter, number> {
  const counts = { all: items.length } as Record<EntityFilter, number>;
  ENTITY_TYPES.forEach((t) => (counts[t] = 0));
  items.forEach((item) => (counts[item.entityType] = (counts[item.entityType] ?? 0) + 1));
  return counts;
}

export function actorOptions(items: ActivityLogItem[], namesById: Map<string, { name: string }>): SelectOption[] {
  const actors = new Map<string, string>();
  items.forEach((item) => {
    if (!actors.has(item.actorId)) actors.set(item.actorId, namesById.get(item.actorId)?.name ?? item.actorName);
  });
  return Array.from(actors, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

const CSV_HEADER = ['Timestamp', 'Actor', 'Actor ID', 'Role', 'Action', 'Entity type', 'Entity', 'Details'];

export function activityToCsv(items: ActivityLogItem[]): string {
  return toCsv([
    CSV_HEADER,
    ...items.map((item) => [
      item.createdAt,
      item.actorName,
      item.actorId,
      ROLE_LABELS[item.actorRole] ?? item.actorRole,
      item.action,
      ENTITY_META[item.entityType]?.label ?? item.entityType,
      item.entityName,
      item.details,
    ]),
  ]);
}
