import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { Progress } from '@/components/animate-ui/components/radix/progress';
import { ROUTES } from '@/constants/navigation';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { percent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Task, TaskStatus } from '@/types';
import { countTasksByStatus } from '@/features/projects/utils';
import { isTaskOverdue } from '../utils';
import { CardLink } from './CardLink';
import styles from './TaskOverviewCard.module.css';

interface TaskOverviewCardProps {
  tasks: Task[];
  personal: boolean;
}

const STACK_STATUS_ORDER: TaskStatus[] = ['done', 'review', 'in_progress', 'backlog'];

export function TaskOverviewCard({ tasks, personal }: TaskOverviewCardProps) {
  const counts = useMemo(() => countTasksByStatus(tasks), [tasks]);
  const overdue = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => isTaskOverdue(t, now)).length;
  }, [tasks]);
  const total = tasks.length;

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={CheckSquare}
        title={personal ? 'My task breakdown' : 'Task breakdown'}
        description={total > 0 ? `${percent(counts.done, total)}% of ${total} tasks completed` : 'Tasks by status'}
        actions={<CardLink href={ROUTES.tasks}>Board</CardLink>}
      />
      {total === 0 ? (
        <EmptyState
          compact
          className={styles.empty}
          icon={CheckSquare}
          title="No tasks yet"
          description={personal ? 'Tasks assigned to you will appear here.' : 'Create tasks to see how work is distributed.'}
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
                  style={{ background: TASK_STATUS[s].color }}
                />
              ) : null
            )}
          </div>
          <ul className={styles.rows}>
            {TASK_STATUS_ORDER.map((s) => (
              <li key={s} className={styles.row}>
                <span className={styles.label}>
                  <span className={styles.dot} style={{ background: TASK_STATUS[s].color }} aria-hidden />
                  {TASK_STATUS[s].label}
                </span>
                <Progress
                  value={percent(counts[s], total)}
                  indicatorColor={TASK_STATUS[s].color}
                  className={styles.track}
                />
                <strong className={styles.value}>{counts[s]}</strong>
              </li>
            ))}
          </ul>
          <div className={cn(styles.overdue, overdue > 0 && styles.overdueActive)}>
            <AlertTriangle size={16} />
            <span>{overdue > 0 ? `${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'} need attention` : 'No overdue tasks'}</span>
          </div>
        </>
      )}
    </Card>
  );
}
