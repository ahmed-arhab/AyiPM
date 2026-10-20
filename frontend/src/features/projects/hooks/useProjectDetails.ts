import { useMemo } from 'react';
import { useActivityLog, useProjectsById, useTasks } from '@/store';
import type { ActivityLogItem, Task } from '@/types';

const ACTIVITY_LIMIT = 20;

export function useProject(projectId: string) {
  return useProjectsById().get(projectId);
}

export function useProjectTasks(projectId: string) {
  const tasks = useTasks();
  return useMemo(() => tasks.filter((t) => t.projectId === projectId), [tasks, projectId]);
}

export function useProjectActivity(projectId: string, tasks: Task[]) {
  const activityLog = useActivityLog();
  return useMemo(() => {
    const ids = new Set(tasks.map((t) => t.id));
    ids.add(projectId);
    const items: ActivityLogItem[] = [];
    for (const item of activityLog) {
      if (item.entityId && ids.has(item.entityId)) items.push(item);
      if (items.length >= ACTIVITY_LIMIT) break;
    }
    return items;
  }, [activityLog, projectId, tasks]);
}
