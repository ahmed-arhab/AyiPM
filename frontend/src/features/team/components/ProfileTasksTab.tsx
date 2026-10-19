import { useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { useFormatters, useProjectsById } from '@/store';
import { EmptyState, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { isOverdue } from '@/lib/date';
import type { Task } from '@/types';
import styles from './ProfileList.module.css';

export function ProfileTasksTab({ tasks }: { tasks: Task[] }) {
  const projectsById = useProjectsById();
  const { date } = useFormatters();

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const doneA = a.status === 'done' ? 1 : 0;
        const doneB = b.status === 'done' ? 1 : 0;
        return doneA - doneB || a.dueDate.localeCompare(b.dueDate);
      }),
    [tasks]
  );

  if (sorted.length === 0) {
    return <EmptyState compact icon={CheckSquare} title="No tasks assigned" description="Tasks assigned to this member will appear here." />;
  }

  return (
    <ul className={styles.list}>
      {sorted.map((t) => {
        const late = t.status !== 'done' && !!t.dueDate && isOverdue(t.dueDate);
        return (
          <li key={t.id} className={styles.item}>
            <div className={styles.itemHead}>
              <Link href={`${ROUTES.tasks}?task=${t.id}`} className={styles.itemTitle}>
                {t.title}
              </Link>
              <span className={styles.badges}>
                <StatusBadge kind="priority" value={t.priority} />
                <StatusBadge kind="task" value={t.status} />
              </span>
            </div>
            <span className={styles.itemMeta}>
              {projectsById.get(t.projectId)?.name ?? 'Unknown project'} · Due{' '}
              <span className={late ? styles.overdue : undefined}>{date(t.dueDate)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
