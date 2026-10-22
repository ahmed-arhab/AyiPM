import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckSquare, FolderKanban } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useFormatters, useProjectsById } from '@/store';
import { useT } from '@/translations';
import type { Project, Task } from '@/types';
import { DeadlineLabel } from '@/features/projects/components/DeadlineLabel';
import { DEADLINE_HORIZON_DAYS, buildDeadlines } from '../utils';
import styles from './DeadlinesCard.module.css';

const LIMIT = 8;

interface DeadlinesCardProps {
  projects: Project[];
  tasks: Task[];
  personal: boolean;
}

export function DeadlinesCard({ projects, tasks, personal }: DeadlinesCardProps) {
  const t = useT();
  const projectsById = useProjectsById();
  const { date } = useFormatters();
  const items = useMemo(() => buildDeadlines(projects, tasks), [projects, tasks]);
  const visible = items.slice(0, LIMIT);

  return (
    <Card as="section">
      <CardHeader
        icon={CalendarClock}
        title={t('Deadlines')}
        description={`${t('Overdue and due in the next {days} days', { days: t.formatNumber(DEADLINE_HORIZON_DAYS) })}${personal ? t('· your work') : ''}`}
      />
      {visible.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarClock}
          title={t('Nothing due soon')}
          description={t('No open tasks or projects are due in the next {days} days.', { days: t.formatNumber(DEADLINE_HORIZON_DAYS) })}
        />
      ) : (
        <ul className={styles.list}>
          {visible.map((item) => {
            const Icon = item.kind === 'project' ? FolderKanban : CheckSquare;
            const context = item.kind === 'project' ? t('Project deadline') : (projectsById.get(item.projectId ?? '')?.name ?? t('Task'));
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link href={item.href} className={styles.row}>
                  <span className={cn(styles.icon, item.kind === 'project' && styles.projectIcon)}>
                    <Icon size={15} />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.context}>
                      {context} · {date(item.date)}
                    </span>
                  </span>
                  <DeadlineLabel endDate={item.date} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > LIMIT && (
        <p className={styles.more}>{t('+{count} more upcoming', { count: t.formatNumber(items.length - LIMIT) })}</p>
      )}
    </Card>
  );
}
