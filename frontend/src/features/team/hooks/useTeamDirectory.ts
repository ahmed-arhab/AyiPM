import { useCallback, useMemo, useState } from 'react';
import { useEmployees } from '@/store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { Project } from '@/types';
import {
  computeTeamStats,
  DEFAULT_TEAM_FILTERS,
  departmentOptions,
  filterAndSortMembers,
  type TeamFilters,
} from '../utils';

export function useTeamDirectory(projectsByMember: Map<string, Project[]>) {
  const employees = useEmployees();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<TeamFilters>(DEFAULT_TEAM_FILTERS);
  const debouncedQuery = useDebouncedValue(query, 200);

  const members = useMemo(
    () => filterAndSortMembers(employees, filters, debouncedQuery, projectsByMember),
    [employees, filters, debouncedQuery, projectsByMember]
  );
  const stats = useMemo(() => computeTeamStats(employees, projectsByMember), [employees, projectsByMember]);
  const departments = useMemo(() => departmentOptions(employees), [employees]);

  const updateFilter = useCallback(<K extends keyof TeamFilters>(key: K, value: TeamFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setFilters(DEFAULT_TEAM_FILTERS);
  }, []);

  const hasActiveFilters =
    query.trim() !== '' ||
    filters.department !== 'all' ||
    filters.role !== 'all' ||
    filters.status !== 'all' ||
    filters.project !== 'all';

  return { employees, members, stats, departments, query, setQuery, filters, updateFilter, reset, hasActiveFilters };
}
