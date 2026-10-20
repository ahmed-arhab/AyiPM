import { memo, type DragEvent, type KeyboardEvent } from 'react';
import { GripVertical, MessageSquare } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Employee, Task } from '@/types';
import { TASK_DRAG_TYPE } from '../hooks/useKanbanDnd';
import { TaskAssignee } from './TaskAssignee';
import { TaskDueDate } from './TaskDueDate';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  projectName?: string;
  assignee?: Employee;
  canDrag: boolean;
  isDragging: boolean;
  formatDate: (value: string) => string;
  onOpen: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  projectName,
  assignee,
  canDrag,
  isDragging,
  formatDate,
  onOpen,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(TASK_DRAG_TYPE, task.id);
    e.dataTransfer.setData('text/plain', task.title);
    onDragStart(task.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(task.id);
    }
  };

  const comments = task.comments.length;

  return (
    <article
      className={cn(styles.card, canDrag && styles.draggable, isDragging && styles.dragging, task.status === 'done' && styles.done)}
      data-task-id={task.id}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      onClick={() => onOpen(task.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${task.title}. Open task details`}
    >
      <div className={styles.top}>
        <span className={styles.project}>{projectName ?? 'Unknown project'}</span>
        <StatusBadge kind="priority" value={task.priority} />
        {canDrag && <GripVertical size={14} className={styles.grip} aria-hidden />}
      </div>
      <h3 className={styles.title}>{task.title}</h3>
      {task.description && <p className={styles.description}>{task.description}</p>}
      <div className={styles.footer}>
        <TaskAssignee assignee={assignee} size={22} />
        <div className={styles.meta}>
          {comments > 0 && (
            <span className={styles.comments} title={`${comments} comment${comments === 1 ? '' : 's'}`}>
              <MessageSquare size={13} aria-hidden />
              {comments}
            </span>
          )}
          <TaskDueDate dueDate={task.dueDate} status={task.status} formatted={formatDate(task.dueDate)} />
        </div>
      </div>
    </article>
  );
});
