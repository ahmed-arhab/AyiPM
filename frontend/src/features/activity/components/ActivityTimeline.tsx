'use client';

import { useMemo } from 'react';
import { useEmployeesById, useFormatters } from '@/store';
import type { ActivityLogItem } from '@/types';
import { groupByDay } from '@/lib/date';
import { ActivityEntry } from './ActivityEntry';
import styles from './ActivityTimeline.module.css';

export function ActivityTimeline({ items }: { items: ActivityLogItem[] }) {
  const employeesById = useEmployeesById();
  const { time } = useFormatters();
  const groups = useMemo(() => groupByDay(items), [items]);

  return (
    <div className={styles.timeline}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group} aria-label={group.label}>
          <h3 className={styles.heading}>
            <span>{group.label}</span>
            <span className={styles.count}>{group.items.length}</span>
          </h3>
          <ol className={styles.entries}>
            {group.items.map((item) => (
              <ActivityEntry key={item.id} item={item} time={time(item.createdAt)} avatar={employeesById.get(item.actorId)?.avatar} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
