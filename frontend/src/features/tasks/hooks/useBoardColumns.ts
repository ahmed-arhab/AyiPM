import { useMemo, useRef } from 'react';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUS_ORDER } from '@/constants/status';
import { groupByStatus, sameItems } from '../utils';

// Reuses each column's previous array when its cards are unchanged so untouched columns skip re-rendering.
export function useBoardColumns(tasks: Task[]): Record<TaskStatus, Task[]> {
  const previous = useRef<Record<TaskStatus, Task[]> | null>(null);
  return useMemo(() => {
    const next = groupByStatus(tasks);
    // The ref is only a cache of the last result: reusing an array never changes what renders, only its identity.
    /* eslint-disable react-hooks/refs */
    const prev = previous.current;
    if (prev) TASK_STATUS_ORDER.forEach((s) => sameItems(prev[s], next[s]) && (next[s] = prev[s]));
    previous.current = next;
    /* eslint-enable react-hooks/refs */
    return next;
  }, [tasks]);
}
