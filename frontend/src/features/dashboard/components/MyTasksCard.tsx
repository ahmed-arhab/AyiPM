import { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { useFormatters, useProjectsById } from '@/store';
import type { Task } from '@/types';
import { TaskRow } from '@/features/projects/components/TaskRow';
import { compareTasksByUrgency, isOpenTask } from '../utils';
import { CardLink } from './CardLink';
import { useT } from '@/translations';
import styles from './MyTasksCard.module.css';

const LIMIT = 20;

export function MyTasksCard({ tasks }: { tasks: Task[] }) {
  const t = useT();
  const projectsById = useProjectsById();
  const { date } = useFormatters();
  const open = useMemo(() => tasks.filter(isOpenTask).sort(compareTasksByUrgency), [tasks]);

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={ListChecks}
        title={t('My tasks')}
        description={
          open.length > 0
            ? t('{count} open {unit} assigned to you', {
                count: t.formatNumber(open.length),
                unit: t(open.length === 1 ? 'task' : 'tasks'),
              })
            : t('Assigned to you')
        }
        actions={<CardLink href={ROUTES.tasks}>{t('Open board')}</CardLink>}
      />
      {open.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <EmptyState
            compact
            icon={ListChecks}
            title={t("You're all caught up")}
            description={t('Tasks assigned to you will appear here, soonest due first.')}
          />
        </div>
      ) : (
        <div className={styles.scrollArea}>
          <div className={styles.list}>
            {open.slice(0, LIMIT).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                formatDate={date}
                context={projectsById.get(task.projectId)?.name}
                showStatus
                hideAssignee
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
