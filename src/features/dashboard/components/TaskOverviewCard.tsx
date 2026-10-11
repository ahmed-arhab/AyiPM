import { useMemo } from 'react';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { percent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Task } from '@/types';
import { countTasksByStatus } from '@/features/projects/utils';
import { useT } from '@/translations';
import { isTaskOverdue } from '../utils';
import { CardLink } from './CardLink';
import styles from './TaskOverviewCard.module.css';

interface TaskOverviewCardProps {
  tasks: Task[];
  personal: boolean;
}

export function TaskOverviewCard({ tasks, personal }: TaskOverviewCardProps) {
  const t = useT();
  const counts = useMemo(() => countTasksByStatus(tasks), [tasks]);
  const overdue = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => isTaskOverdue(task, now)).length;
  }, [tasks]);
  const total = tasks.length;

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={CheckSquare}
        title={t(personal ? 'My task breakdown' : 'Task breakdown')}
        description={
          total > 0
            ? t('{percent}% of {total} tasks completed', {
                percent: t.formatNumber(percent(counts.done, total)),
                total: t.formatNumber(total),
              })
            : t('Tasks by status')
        }
        actions={<CardLink href={ROUTES.tasks}>{t('Board')}</CardLink>}
      />
      {total === 0 ? (
        <EmptyState
          compact
          className={styles.empty}
          icon={CheckSquare}
          title={t('No tasks yet')}
          description={t(
            personal
              ? 'Tasks assigned to you will appear here.'
              : 'Create tasks to see how work is distributed.'
          )}
        />
      ) : (
        <>
          <div className={styles.stack} aria-hidden>
            {TASK_STATUS_ORDER.map((s) =>
              counts[s] > 0 ? <span key={s} style={{ width: `${(counts[s] / total) * 100}%`, background: TASK_STATUS[s].color }} /> : null
            )}
          </div>
          <ul className={styles.rows}>
            {TASK_STATUS_ORDER.map((s) => (
              <li key={s} className={styles.row}>
                <span className={styles.label}>
                  <span className={styles.dot} style={{ background: TASK_STATUS[s].color }} aria-hidden />
                  {t(TASK_STATUS[s].label)}
                </span>
                <span className={styles.track}>
                  <span className={styles.fill} style={{ width: `${percent(counts[s], total)}%`, background: TASK_STATUS[s].color }} />
                </span>
                <strong className={styles.value}>{t.formatNumber(counts[s])}</strong>
              </li>
            ))}
          </ul>
          <div className={cn(styles.overdue, overdue > 0 && styles.overdueActive)}>
            <AlertTriangle size={16} />
            <span>
              {overdue > 0
                ? t('{overdue} overdue {unit} need attention', {
                    overdue: t.formatNumber(overdue),
                    unit: t(overdue === 1 ? 'task' : 'tasks'),
                  })
                : t('No overdue tasks')}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
