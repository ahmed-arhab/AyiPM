import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, ProgressBar } from '@/components/ui';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { useProjectProgress } from '@/store';
import type { Task } from '@/types';
import { countTasksByStatus } from '../utils';
import styles from './ProjectProgressCard.module.css';

interface ProjectProgressCardProps {
  projectId: string;
  tasks: Task[];
}

export function ProjectProgressCard({ projectId, tasks }: ProjectProgressCardProps) {
  const progress = useProjectProgress().get(projectId);
  const counts = useMemo(() => countTasksByStatus(tasks), [tasks]);

  return (
    <Card as="section">
      <CardHeader
        icon={TrendingUp}
        title="Progress"
        description={tasks.length > 0 ? `${progress?.done ?? 0} of ${tasks.length} tasks completed` : 'Progress is calculated from completed tasks'}
      />
      <ProgressBar value={progress?.progress ?? 0} label="Overall completion" showValue />
      <ul className={styles.counts}>
        {TASK_STATUS_ORDER.map((status) => (
          <li key={status} className={styles.count}>
            <span className={styles.dot} style={{ background: TASK_STATUS[status].color }} aria-hidden />
            <span className={styles.label}>{TASK_STATUS[status].label}</span>
            <strong>{counts[status]}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
