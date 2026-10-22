import { useMemo } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { AvatarGroup, Card, CardHeader, EmptyState, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { formatRelativeTime } from '@/lib/date';
import { useEmployeesById } from '@/store';
import type { Project } from '@/types';
import { resolveMembers } from '@/features/projects/utils';
import { useT } from '@/translations';
import { CardLink } from './CardLink';
import styles from './RecentProjectsCard.module.css';

const LIMIT = 5;

export function RecentProjectsCard({ projects }: { projects: Project[] }) {
  const t = useT();
  const employeesById = useEmployeesById();
  const recent = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, LIMIT), [projects]);

  return (
    <Card as="section">
      <CardHeader
        icon={Layers}
        title={t('Recent projects')}
        description={t('Latest updated')}
        actions={<CardLink href={ROUTES.projects}>{t('All projects')}</CardLink>}
      />
      {recent.length === 0 ? (
        <EmptyState compact icon={Layers} title={t('No projects yet')} description={t('Recently updated projects will be listed here.')} />
      ) : (
        <ul className={styles.list}>
          {recent.map((p) => (
            <li key={p.id}>
              <Link href={ROUTES.project(p.id)} className={styles.row}>
                <div className={styles.text}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.meta} title={t('Latest updated')}>
                    {p.client || t('Internal')} · {formatRelativeTime(p.updatedAt, undefined, t.locale)}
                  </span>
                </div>
                <div className={styles.side}>
                  <AvatarGroup people={resolveMembers(p.members, employeesById)} max={3} size={24} />
                  <StatusBadge kind="project" value={p.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
