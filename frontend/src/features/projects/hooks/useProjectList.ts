import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProjectProgress, useProjects } from '@/store';
import {
  countByStatus,
  matchesProject,
  sortProjects,
  type ProjectSortKey,
  type ProjectStatusFilter,
  type ProjectViewMode,
} from '../utils';

export function useProjectList() {
  const projects = useProjects();
  const progress = useProjectProgress();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProjectStatusFilter>('all');
  const [sort, setSort] = useState<ProjectSortKey>('updated');
  const [view, setView] = useState<ProjectViewMode>('grid');
  const debouncedQuery = useDebouncedValue(query);

  const matched = useMemo(() => projects.filter((p) => matchesProject(p, debouncedQuery)), [projects, debouncedQuery]);
  const counts = useMemo(() => countByStatus(matched), [matched]);
  const visible = useMemo(() => {
    const filtered = status === 'all' ? matched : matched.filter((p) => p.status === status);
    return sortProjects(filtered, sort, progress);
  }, [matched, status, sort, progress]);

  const hasFilters = debouncedQuery.trim() !== '' || status !== 'all';
  const resetFilters = () => {
    setQuery('');
    setStatus('all');
  };

  return {
    total: projects.length,
    matchedCount: matched.length,
    visible,
    counts,
    progress,
    query,
    setQuery,
    status,
    setStatus,
    sort,
    setSort,
    view,
    setView,
    hasFilters,
    resetFilters,
  };
}
