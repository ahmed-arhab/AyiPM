import { memo, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { GripVertical, MessageSquare, MoreHorizontal } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { TASK_STATUS } from '@/constants/status';
import { useT } from '@/translations';
import { cn } from '@/lib/cn';
import type { Employee, Task, TaskStatus } from '@/types';
import { TASK_DRAG_TYPE } from '../hooks/useKanbanDnd';
import { TaskAssignee } from './TaskAssignee';
import { TaskDueDate } from './TaskDueDate';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  projectName?: string;
  assignee?: Employee;
  canDrag: boolean; // same check as canMoveTask(user, task), so it also gates the menu
  isDragging: boolean;
  formatDate: (value: string) => string;
  onOpen: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onMove: (taskId: string, status: TaskStatus) => void;
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
  onMove,
}: TaskCardProps) {
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus the first option when the menu opens
  useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [menuOpen]);

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

  // Runs for the menu button and the menu items, so the card never sees these keys
  const handleMenuKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const step = e.key === 'ArrowDown' ? 1 : -1;
    items[(current + step + items.length) % items.length].focus();
  };

  const comments = task.comments.length;
  const otherStatuses = (Object.keys(TASK_STATUS) as TaskStatus[]).filter((s) => s !== task.status);

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
        {canDrag && (
          <div
            className={styles.menuWrap}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleMenuKeyDown}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenuOpen(false);
            }}
          >
            <button
              ref={buttonRef}
              type="button"
              className={styles.menuButton}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Move "${task.title}" to another column`}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal size={14} aria-hidden />
            </button>
            {menuOpen && (
              <div ref={menuRef} className={styles.menu} role="menu" aria-label="Move to">
                {otherStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      onMove(task.id, status);
                    }}
                  >
                    {t(TASK_STATUS[status].label)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
