import { useMemo } from 'react';
import { motion } from 'motion/react';
import { FolderKanban } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { Progress } from '@/components/animate-ui/components/radix/progress';
import { ROUTES } from '@/constants/navigation';
import { PROJECT_STATUS } from '@/constants/status';
import { percent } from '@/lib/format';
import type { Project, ProjectStatus } from '@/types';
import { PROJECT_STATUS_KEYS, countByStatus } from '@/features/projects/utils';
import { CardLink } from './CardLink';
import { useT } from '@/translations';
import styles from './ProjectOverviewCard.module.css';

const STACK_STATUS_ORDER: ProjectStatus[] = ['completed', 'in_review', 'in_progress', 'planning', 'on_hold'];

export function ProjectOverviewCard({ projects }: { projects: Project[] }) {
  const t = useT();
  const counts = useMemo(() => countByStatus(projects), [projects]);
  const total = projects.length;

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={FolderKanban}
        title={t('Project progress')}
        description={
          total > 0
            ? t('{completed} completed · {total} projects total', {
                completed: t.formatNumber(counts.completed),
                total: t.formatNumber(total),
              })
            : t('No active projects')
        }
        actions={<CardLink href={ROUTES.projects}>{t('View all')}</CardLink>}
      />
      {total === 0 ? (
        <EmptyState
          compact
          className={styles.empty}
          icon={FolderKanban}
          title={t('No active projects')}
          description={t('Active projects and their progress will appear here.')}
        />
      ) : (
        <>
          <div className={styles.stack} aria-hidden>
            {STACK_STATUS_ORDER.map((s) =>
              counts[s] > 0 ? (
                <motion.span
                  key={s}
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts[s] / total) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 0.8 }}
                  style={{ background: PROJECT_STATUS[s].color }}
                />
              ) : null
            )}
          </div>
          <ul className={styles.rows}>
            {PROJECT_STATUS_KEYS.map((s) => (
              <li key={s} className={styles.row}>
                <span className={styles.label}>
                  <span className={styles.dot} style={{ background: PROJECT_STATUS[s].color }} aria-hidden />
                  {t(PROJECT_STATUS[s].label)}
                </span>
                <Progress value={percent(counts[s], total)} indicatorColor={PROJECT_STATUS[s].color} className={styles.track} />
                <strong className={styles.value}>{t.formatNumber(counts[s])}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
