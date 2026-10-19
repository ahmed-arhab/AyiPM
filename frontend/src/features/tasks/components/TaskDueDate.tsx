import { memo } from 'react';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TaskStatus } from '@/types';
import { dueLabel, getDueState } from '../utils';
import styles from './TaskDueDate.module.css';

interface TaskDueDateProps {
  dueDate: string;
  status: TaskStatus;
  formatted: string;
  showHint?: boolean;
}

const ICONS = { overdue: AlertCircle, soon: Clock, normal: Calendar, done: Calendar };

export const TaskDueDate = memo(function TaskDueDate({ dueDate, status, formatted, showHint }: TaskDueDateProps) {
  const state = getDueState({ dueDate, status });
  const Icon = ICONS[state];
  const hint = state === 'overdue' || state === 'soon' ? dueLabel(dueDate) : undefined;
  return (
    <span className={cn(styles.due, styles[state])} title={hint ?? `Due ${formatted}`}>
      <Icon size={13} aria-hidden />
      <span>{formatted}</span>
      {showHint && hint && <span className={styles.hint}>· {hint}</span>}
    </span>
  );
});
