'use client';

import { memo } from 'react';
import { CalendarDays, Check, Pencil } from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Employee, Task } from '@/types';
import { formatDueRelative } from '../utils';
import styles from './ProjectTodoItem.module.css';

interface ProjectTodoItemProps {
  task: Task;
  assignee?: Employee;
  formatDate: (value?: string) => string;
  onToggle: (task: Task) => void;
  onOpen: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  canManage?: boolean;
}

export const ProjectTodoItem = memo(function ProjectTodoItem({
  task,
  assignee,
  formatDate,
  onToggle,
  onOpen,
  onEdit,
  canManage,
}: ProjectTodoItemProps) {
  const isDone = task.status === 'done';
  const dueInfo = formatDueRelative(task.dueDate, isDone);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(task);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(task.id);
  };

  return (
    <div
      className={cn(styles.item, isDone && styles.done)}
      onClick={() => onOpen(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task.id);
        }
      }}
      aria-label={`Task: ${task.title}`}
    >
      <button
        type="button"
        className={cn(styles.checkboxBtn, isDone && styles.checked)}
        onClick={handleCheckboxClick}
        title={isDone ? 'Mark as incomplete' : 'Mark as done'}
        aria-label={isDone ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
      >
        {isDone && <Check size={14} strokeWidth={3} />}
      </button>

      <div className={styles.main}>
        <div className={styles.titleRow}>
          <span className={cn(styles.title, isDone && styles.doneTitle)}>{task.title}</span>
        </div>
        {task.description && <p className={styles.description}>{task.description}</p>}
      </div>

      <div className={styles.meta}>
        <StatusBadge kind="priority" value={task.priority} />
        {!isDone && <StatusBadge kind="task" value={task.status} />}

        {task.dueDate && (
          <span
            className={cn(
              styles.dueBadge,
              dueInfo.overdue && styles.overdue,
              dueInfo.isToday && styles.today,
              dueInfo.label === 'Tomorrow' && styles.tomorrow
            )}
            title={`Due: ${formatDate(task.dueDate)}`}
          >
            <CalendarDays size={12} />
            {dueInfo.label}
          </span>
        )}

        {assignee ? (
          <Avatar name={assignee.name} src={assignee.avatar} size={24} />
        ) : null}

        {canManage && onEdit && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={handleEditClick}
              title="Edit task"
              aria-label={`Edit ${task.title}`}
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
