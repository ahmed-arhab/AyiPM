import { memo } from 'react';
import { Avatar } from '@/components/ui';
import { formatRelativeTime } from '@/lib/date';
import type { ActivityLogItem, Employee } from '@/types';
import styles from './ActivityList.module.css';

interface ActivityListProps {
  items: ActivityLogItem[];
  employeesById: Map<string, Employee>;
}

export const ActivityList = memo(function ActivityList({ items, employeesById }: ActivityListProps) {
  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <Avatar name={item.actorName} src={employeesById.get(item.actorId)?.avatar} size={30} />
          <div className={styles.body}>
            <p className={styles.text}>
              <strong>{item.actorName}</strong> <span className={styles.action}>{item.action.toLowerCase()}</span>{' '}
              <span className={styles.entity}>{item.entityName}</span>
            </p>
            {item.details && <p className={styles.details}>{item.details}</p>}
            <time className={styles.time} dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}>
              {formatRelativeTime(item.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
});
