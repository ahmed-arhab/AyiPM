'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useEmployeesById, useFormatters } from '@/store';
import type { TaskHistoryEntry } from '@/types';
import styles from './TaskHistory.module.css';

export function TaskHistory({ history }: { history: TaskHistoryEntry[] }) {
  const employeesById = useEmployeesById();
  const { dateTime } = useFormatters();
  const entries = useMemo(() => [...history].reverse(), [history]);

  if (entries.length === 0) {
    return <EmptyState compact icon={History} title="No history yet" />;
  }

  return (
    <ol className={styles.timeline}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.entry}>
          <span className={styles.dot} aria-hidden />
          <div className={styles.body}>
            <p className={styles.action}>{entry.action}</p>
            <span className={styles.time}>
              <strong>{employeesById.get(entry.actorId)?.name ?? 'Former member'}</strong> ·{' '}
              <time dateTime={entry.createdAt}>{dateTime(entry.createdAt)}</time>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
