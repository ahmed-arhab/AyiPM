import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEmployeesById } from '@/store';
import type { ActivityLogItem } from '@/types';
import {
  DEFAULT_ACTIVITY_FILTERS,
  actorOptions,
  countByEntity,
  filterActivity,
  type ActivityFilterState,
} from '../utils';

export type UpdateActivityFilter = <K extends keyof ActivityFilterState>(key: K, value: ActivityFilterState[K]) => void;

export function useActivityFilters(log: ActivityLogItem[], canViewAll: boolean, userId: string) {
  const employeesById = useEmployeesById();
  const [filters, setFilters] = useState<ActivityFilterState>(DEFAULT_ACTIVITY_FILTERS);
  const { entity, from, to } = filters;
  const actorId = canViewAll ? filters.actorId : '';
  const query = useDebouncedValue(filters.query, 200);

  const scoped = useMemo(() => (canViewAll ? log : log.filter((item) => item.actorId === userId)), [log, canViewAll, userId]);
  const counts = useMemo(() => countByEntity(scoped), [scoped]);
  const actors = useMemo(() => (canViewAll ? actorOptions(scoped, employeesById) : []), [canViewAll, scoped, employeesById]);
  const filtered = useMemo(
    () => filterActivity(scoped, { entity, actorId, query, from, to }),
    [scoped, entity, actorId, query, from, to]
  );

  const update = useCallback<UpdateActivityFilter>((key, value) => setFilters((f) => ({ ...f, [key]: value })), []);
  const reset = useCallback(() => setFilters(DEFAULT_ACTIVITY_FILTERS), []);

  const isFiltered = entity !== 'all' || actorId !== '' || from !== '' || to !== '' || filters.query.trim() !== '';
  const filterKey = `${entity}|${actorId}|${query}|${from}|${to}`;

  return { filters, update, reset, isFiltered, filterKey, scoped, counts, actors, filtered };
}
