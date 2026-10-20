import { useCallback, useMemo, useState } from 'react';
import { useAppStore, useCurrentUser, useProjectsById } from '@/store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_FILTERS, filterTasks, hasActiveFilters, sortTasks, type TaskFilters } from '../utils';

type LocalFilters = Omit<TaskFilters, 'projectId'>;

const INITIAL_FILTERS: LocalFilters = {
  query: DEFAULT_FILTERS.query,
  assigneeId: DEFAULT_FILTERS.assigneeId,
  priority: DEFAULT_FILTERS.priority,
  status: DEFAULT_FILTERS.status,
  mine: DEFAULT_FILTERS.mine,
  sort: DEFAULT_FILTERS.sort,
};

interface Options {
  projectId: string;
  onProjectChange: (projectId: string) => void;
}

export function useTaskFilters({ projectId, onProjectChange }: Options) {
  const [local, setLocal] = useState<LocalFilters>(INITIAL_FILTERS);
  const tasks = useAppStore((s) => s.tasks);
  const projectsById = useProjectsById();
  const user = useCurrentUser();
  const query = useDebouncedValue(local.query, 150);

  const filters = useMemo<TaskFilters>(() => ({ ...local, projectId }), [local, projectId]);

  const setFilter = useCallback(
    <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
      if (key === 'projectId') onProjectChange(value as string);
      else setLocal((prev) => ({ ...prev, [key]: value }));
    },
    [onProjectChange]
  );

  const reset = useCallback(() => {
    setLocal((prev) => ({ ...INITIAL_FILTERS, sort: prev.sort }));
    if (projectId) onProjectChange('');
  }, [projectId, onProjectChange]);

  const { mine, assigneeId, priority, status, sort } = local;
  const filteredTasks = useMemo(
    () => filterTasks(tasks, { query, projectId, assigneeId, priority, status, mine }, { userId: user.id, projectsById }),
    [tasks, query, projectId, assigneeId, priority, status, mine, user.id, projectsById]
  );
  const sortedTasks = useMemo(() => sortTasks(filteredTasks, sort), [filteredTasks, sort]);

  return {
    filters,
    setFilter,
    reset,
    isFiltered: hasActiveFilters(filters),
    totalCount: tasks.length,
    filteredTasks,
    sortedTasks,
  };
}

export type TaskFiltersApi = ReturnType<typeof useTaskFilters>;
