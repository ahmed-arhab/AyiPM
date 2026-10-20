import { useMemo } from 'react';
import { selectProjectsByMember, selectTasksByAssignee, useAppStore } from '@/store';

export function useProjectsByMember() {
  return useAppStore((s) => selectProjectsByMember(s.projects));
}

export function useTasksByAssignee() {
  return useAppStore((s) => selectTasksByAssignee(s.tasks));
}

export function useOpenTaskCounts(): Map<string, number> {
  const tasksByAssignee = useTasksByAssignee();
  return useMemo(() => {
    const counts = new Map<string, number>();
    tasksByAssignee.forEach((list, id) => counts.set(id, list.filter((t) => t.status !== 'done').length));
    return counts;
  }, [tasksByAssignee]);
}
