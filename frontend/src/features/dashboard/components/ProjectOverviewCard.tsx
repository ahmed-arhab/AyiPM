import { useMemo } from 'react';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { Card, CardHeader, EmptyState, ProgressBar } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { PROJECT_STATUS } from '@/constants/status';
import { useProjectProgress } from '@/store';
import type { Project } from '@/types';
import { DeadlineLabel } from '@/features/projects/components/DeadlineLabel';
import { PROJECT_STATUS_KEYS, countByStatus } from '@/features/projects/utils';
import { CardLink } from './CardLink';
import { useT } from '@/translations';
import styles from './ProjectOverviewCard.module.css';

const TOP_LIMIT = 5;

export function ProjectOverviewCard({ projects }: { projects: Project[] }) {
  const t = useT();
  const progress = useProjectProgress();
  const counts = useMemo(() => countByStatus(projects), [projects]);
  const top = useMemo(
    () =>
      projects
        .filter((p) => p.status !== 'completed')
        .sort((a, b) => (a.endDate || '9999').localeCompare(b.endDate || '9999'))
        .slice(0, TOP_LIMIT),
    [projects]
  );

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={FolderKanban}
        title={t('Project progress')}
        description={t('Active projects by nearest deadline')}
        actions={<CardLink href={ROUTES.projects}>{t('View all')}</CardLink>}
      />
      <ul className={styles.statuses}>
        {PROJECT_STATUS_KEYS.map((key) => (
          <li key={key} className={styles.status}>
            <span className={styles.dot} style={{ background: PROJECT_STATUS[key].color }} aria-hidden />
            <span>{t(PROJECT_STATUS[key].label)}</span>
            <strong>{t.formatNumber(counts[key])}</strong>
          </li>
        ))}
      </ul>
      {top.length === 0 ? (
        <EmptyState compact className={styles.empty} icon={FolderKanban} title={t('No active projects')} description={t('Active projects and their progress will appear here.')} />
      ) : (
        <ul className={styles.list}>
          {top.map((p) => {
            const entry = progress.get(p.id);
            return (
              <li key={p.id}>
                <Link href={ROUTES.project(p.id)} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.name}>{p.name}</span>
                    <DeadlineLabel endDate={p.endDate} />
                  </div>
                  <ProgressBar
                    value={entry?.progress ?? 0}
                    label={`${t.formatNumber(entry?.done ?? 0)}/${t.formatNumber(entry?.total ?? 0)} ${t('tasks')}`}
                    showValue
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
