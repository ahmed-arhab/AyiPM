import { memo } from 'react';
import { UserX } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Employee } from '@/types';
import styles from './TaskAssignee.module.css';

interface TaskAssigneeProps {
  assignee?: Employee;
  size?: number;
  hideName?: boolean;
  detail?: boolean;
  emptyLabel?: string;
}

export const TaskAssignee = memo(function TaskAssignee({
  assignee,
  size = 26,
  hideName,
  detail,
  emptyLabel = 'Unassigned',
}: TaskAssigneeProps) {
  if (!assignee) {
    return (
      <span className={cn(styles.assignee, styles.unassigned)} title={emptyLabel}>
        <span className={styles.placeholder} style={{ width: size, height: size }}>
          <UserX size={Math.round(size * 0.5)} aria-hidden />
        </span>
        {!hideName && <span className={styles.name}>{emptyLabel}</span>}
      </span>
    );
  }
  return (
    <span className={styles.assignee} title={assignee.name}>
      <Avatar name={assignee.name} src={assignee.avatar} size={size} />
      {!hideName && (
        <span className={styles.text}>
          <span className={styles.name}>{assignee.name}</span>
          {detail && <span className={styles.detail}>{assignee.designation}</span>}
        </span>
      )}
    </span>
  );
});
