'use client';

import { useCallback, useRef } from 'react';
import { getState, moveTask, useCurrentUser, useEmployeesById, useFormatters, useProjectsById } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { TASK_STATUS_ORDER } from '@/constants/status';
import type { Task, TaskStatus } from '@/types';
import { useBoardColumns } from '../hooks/useBoardColumns';
import { useKanbanDnd } from '../hooks/useKanbanDnd';
import { toColumnIndex } from '../utils';
import { KanbanColumn } from './KanbanColumn';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
}

export function KanbanBoard({ tasks, onOpenTask }: KanbanBoardProps) {
  const columns = useBoardColumns(tasks);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const user = useCurrentUser();
  const projectsById = useProjectsById();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const toast = useToast();

  const handleMove = useCallback(
    (taskId: string, status: TaskStatus, visibleIndex: number) => {
      const index = toColumnIndex(getState().tasks, columnsRef.current[status], status, taskId, visibleIndex);
      const result = moveTask(taskId, status, index);
      if (!result.ok) toast.error(result.error);
    },
    [toast]
  );

  const { draggingId, dropTarget, startDrag, endDrag, hover, leave, drop } = useKanbanDnd(handleMove);

  return (
    <div className={styles.board} role="region" aria-label="Task board">
      {TASK_STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={columns[status]}
          user={user}
          projectsById={projectsById}
          employeesById={employeesById}
          draggingId={draggingId}
          dropIndex={dropTarget?.status === status ? dropTarget.index : null}
          formatDate={date}
          onOpenTask={onOpenTask}
          onDragStart={startDrag}
          onDragEnd={endDrag}
          onHover={hover}
          onLeave={leave}
          onDrop={drop}
        />
      ))}
    </div>
  );
}
