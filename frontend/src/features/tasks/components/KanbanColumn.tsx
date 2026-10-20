import { Fragment, memo, useRef, type DragEvent } from 'react';
import { canMoveTask, moveTask } from '@/store';
import { TASK_STATUS } from '@/constants/status';
import { useT } from '@/translations';
import { cn } from '@/lib/cn';
import type { Employee, Project, Task, TaskStatus } from '@/types';
import { TASK_DRAG_TYPE } from '../hooks/useKanbanDnd';
import { TaskCard } from './TaskCard';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  user: Employee;
  projectsById: Map<string, Project>;
  employeesById: Map<string, Employee>;
  draggingId: string | null;
  dropIndex: number | null;
  formatDate: (value: string) => string;
  onOpenTask: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onHover: (status: TaskStatus, index: number) => void;
  onLeave: (status: TaskStatus) => void;
  onDrop: (status: TaskStatus, index: number) => void;
}

function pointerIndex(list: HTMLElement | null, clientY: number, draggingId: string | null): number {
  if (!list) return 0;
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-task-id]')).filter((el) => el.dataset.taskId !== draggingId);
  const index = cards.findIndex((el) => {
    const rect = el.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  });
  return index === -1 ? cards.length : index;
}

const isTaskDrag = (e: DragEvent) => e.dataTransfer.types.includes(TASK_DRAG_TYPE);

export const KanbanColumn = memo(function KanbanColumn(props: KanbanColumnProps) {
  const { t, formatNumber } = useT();
  const { status, tasks, user, projectsById, employeesById, draggingId, dropIndex, formatDate, onOpenTask, onDragStart, onDragEnd } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const meta = TASK_STATUS[status];

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    if (!isTaskDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    props.onHover(status, pointerIndex(listRef.current, e.clientY, draggingId));
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) props.onLeave(status);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    if (!isTaskDrag(e)) return;
    e.preventDefault();
    props.onDrop(status, pointerIndex(listRef.current, e.clientY, draggingId));
  };

  let visibleIndex = 0;
  const indicator = <div className={styles.indicator} aria-hidden />;

  const isTaskDrag = (e: DragEvent) => e.dataTransfer.types.includes(TASK_DRAG_TYPE);

const moveToStatus = (taskId: string, status: TaskStatus) => {
  moveTask(taskId, status);
};

  return (
    <section
      className={cn(styles.column, dropIndex !== null && styles.over)}
      aria-label={`${t(meta.label)}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className={styles.header}>
        <span className={styles.dot} style={{ background: meta.color }} aria-hidden />
        <h2 className={styles.label}>{t(meta.label)}</h2>
        <span className={styles.count}>{formatNumber(tasks.length)}</span>
      </header>
      <div ref={listRef} className={styles.list}>
        {tasks.map((task) => {
          const isDragged = task.id === draggingId;
          const showIndicator = !isDragged && dropIndex === visibleIndex;
          if (!isDragged) visibleIndex += 1;
          return (
            <Fragment key={task.id}>
              {showIndicator && indicator}
              <TaskCard
                task={task}
                projectName={projectsById.get(task.projectId)?.name}
                assignee={task.assigneeId ? employeesById.get(task.assigneeId) : undefined}
                canDrag={canMoveTask(user, task)}
                isDragging={isDragged}
                formatDate={formatDate}
                onOpen={onOpenTask}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onMove={moveToStatus}
              />
            </Fragment>
          );
        })}
        {dropIndex !== null && dropIndex >= visibleIndex && indicator}
        {tasks.length === 0 && dropIndex === null && <p className={styles.empty}>{t('No tasks yet')}</p>}
      </div>
    </section>
  );
});
