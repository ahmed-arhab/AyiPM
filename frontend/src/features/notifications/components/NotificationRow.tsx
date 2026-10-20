import { memo, type ReactNode } from 'react';
import { CheckSquare, Clock, FolderKanban, PlaneTakeoff, Sparkles, type LucideIcon } from 'lucide-react';
import { NOTIFICATION_CATEGORY } from '@/constants/status';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';
import type { NotificationCategory, NotificationItem } from '@/types';
import styles from './NotificationRow.module.css';

export const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  task: CheckSquare,
  project: FolderKanban,
  leave: PlaneTakeoff,
  attendance: Clock,
  system: Sparkles,
};

interface NotificationRowProps {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  actions?: ReactNode;
  compact?: boolean;
}

export const NotificationRow = memo(function NotificationRow({ item, onOpen, actions, compact }: NotificationRowProps) {
  const Icon = CATEGORY_ICONS[item.category];
  const meta = NOTIFICATION_CATEGORY[item.category];
  return (
    <div className={cn(styles.row, !item.read && styles.unread, compact && styles.compact)}>
      <button type="button" className={styles.main} onClick={() => onOpen(item)}>
        <span className={styles.icon} style={{ color: meta.color, background: `${meta.color}1a` }}>
          <Icon size={16} />
        </span>
        <span className={styles.text}>
          <span className={styles.titleRow}>
            <span className={styles.title}>{item.title}</span>
            {(item.priority === 'urgent' || item.priority === 'high') && (
              <span className={cn('badge', item.priority === 'urgent' ? 'badge-danger' : 'badge-warning', styles.priority)}>{item.priority}</span>
            )}
          </span>
          <span className={styles.message}>{item.message}</span>
          <span className={styles.time}>{formatRelativeTime(item.createdAt)}</span>
        </span>
        {!item.read && <span className={styles.dot} aria-label="Unread" />}
      </button>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
});
