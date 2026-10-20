import { useCallback, useRef, useState } from 'react';
import type { TaskStatus } from '@/types';

export const TASK_DRAG_TYPE = 'application/x-ayipm-task';

export interface DropTarget {
  status: TaskStatus;
  index: number;
}

export function useKanbanDnd(onMove: (taskId: string, status: TaskStatus, visibleIndex: number) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const draggingRef = useRef<string | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const startDrag = useCallback((taskId: string) => {
    draggingRef.current = taskId;
    // Defer so the browser captures the drag image before the card restyles.
    requestAnimationFrame(() => setDraggingId(draggingRef.current));
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const hover = useCallback((status: TaskStatus, index: number) => {
    setDropTarget((prev) => (prev?.status === status && prev.index === index ? prev : { status, index }));
  }, []);

  const leave = useCallback((status: TaskStatus) => {
    setDropTarget((prev) => (prev?.status === status ? null : prev));
  }, []);

  const drop = useCallback(
    (status: TaskStatus, index: number) => {
      const taskId = draggingRef.current;
      endDrag();
      if (taskId) onMoveRef.current(taskId, status, index);
    },
    [endDrag]
  );

  return { draggingId, dropTarget, startDrag, endDrag, hover, leave, drop };
}
