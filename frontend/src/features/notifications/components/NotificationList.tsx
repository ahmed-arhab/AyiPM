'use client';

import { useMemo } from 'react';
import type { NotificationItem } from '@/types';
import { groupByDay } from '@/lib/date';
import { NotificationListItem, type NotificationHandler } from './NotificationListItem';
import styles from './NotificationList.module.css';

interface NotificationListProps {
  items: NotificationItem[];
  onOpen: NotificationHandler;
  onToggleRead: NotificationHandler;
  onDelete: NotificationHandler;
}

export function NotificationList({ items, onOpen, onToggleRead, onDelete }: NotificationListProps) {
  const groups = useMemo(() => groupByDay(items), [items]);

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group} aria-label={group.label}>
          <h3 className={styles.heading}>
            <span>{group.label}</span>
            <span className={styles.count}>{group.items.length}</span>
          </h3>
          <div className={styles.rows}>
            {group.items.map((item) => (
              <NotificationListItem key={item.id} item={item} onOpen={onOpen} onToggleRead={onToggleRead} onDelete={onDelete} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
