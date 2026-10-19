import { useEffect } from 'react';
import { useAppStore } from '@/store';
import type { useTaskUrlState } from './useTaskUrlState';

type UrlState = ReturnType<typeof useTaskUrlState>;

// Drops URL params that point at missing entities or actions the user can't take.
export function useTaskUrlGuards({ taskId, projectId, isCreating, setParams }: UrlState, canCreate: boolean) {
  const taskExists = useAppStore((s) => !taskId || s.tasks.some((t) => t.id === taskId));
  const projectExists = useAppStore((s) => !projectId || s.projects.some((p) => p.id === projectId));

  useEffect(() => {
    const patch: Parameters<UrlState['setParams']>[0] = {};
    if (!taskExists) patch.task = null;
    if (!projectExists) patch.project = null;
    if (isCreating && !canCreate) patch.new = null;
    if (Object.keys(patch).length > 0) setParams(patch);
  }, [taskExists, projectExists, isCreating, canCreate, setParams]);
}
