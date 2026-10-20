import { memo } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { isOverdue } from '@/lib/date';
import { cn } from '@/lib/cn';
import type { Employee, Task } from '@/types';
import styles from './TaskRow.module.css';

interface TaskRowProps {
  task: Task;
  assignee?: Employee;
  formatDate: (value?: string) => string;
  context?: string;
  showStatus?: boolean;
  hideAssignee?: boolean;
}

export const TaskRow = memo(function TaskRow({ task, assignee, formatDate, context, showStatus, hideAssignee }: TaskRowProps) {
  const overdue = task.status !== 'done' && Boolean(task.dueDate) && isOverdue(task.dueDate);
  return (
    <Link href={`${ROUTES.tasks}?task=${task.id}`} className={styles.row}>
      <div className={styles.main}>
        <span className={cn(styles.title, task.status === 'done' && styles.done)}>{task.title}</span>
        {context && <span className={styles.context}>{context}</span>}
      </div>
      <div className={styles.meta}>
        {showStatus && <StatusBadge kind="task" value={task.status} />}
        <StatusBadge kind="priority" value={task.priority} />
        <span className={cn(styles.due, overdue && styles.overdue)} title={overdue ? 'Overdue' : 'Due date'}>
          <CalendarDays size={12} />
          {formatDate(task.dueDate)}
        </span>
        {!hideAssignee &&
          (assignee ? (
            <Avatar name={assignee.name} src={assignee.avatar} size={24} />
          ) : (
            <span className={styles.unassigned} title="Unassigned" aria-label="Unassigned" />
          ))}
      </div>
    </Link>
  );
});
