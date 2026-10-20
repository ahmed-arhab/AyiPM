import { memo, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckSquare } from 'lucide-react';
import { AvatarGroup, ProgressBar, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/date';
import type { ProjectProgress } from '@/store';
import type { Employee, Project } from '@/types';
import { resolveMembers } from '../utils';
import { DeadlineLabel } from './DeadlineLabel';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  progress?: ProjectProgress;
  employeesById: Map<string, Employee>;
  formatDate: (value?: string) => string;
}

export const ProjectCard = memo(function ProjectCard({ project, progress, employeesById, formatDate }: ProjectCardProps) {
  const members = useMemo(() => resolveMembers(project.members, employeesById), [project.members, employeesById]);
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;

  return (
    <Link href={ROUTES.project(project.id)} className={cn('card', styles.card)}>
      <div className={styles.head}>
        <div className={styles.titles}>
          <h3 className={cn('heading-md', styles.name)}>{project.name}</h3>
          <span className={styles.client}>{project.client || 'Internal project'}</span>
        </div>
        <StatusBadge kind="project" value={project.status} />
      </div>

      {project.description && <p className={styles.description}>{project.description}</p>}

      <ProgressBar value={progress?.progress ?? 0} label={`${done}/${total} tasks done`} showValue />

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <CalendarDays size={13} />
          {formatDate(project.startDate)} – {formatDate(project.endDate)}
        </span>
        <DeadlineLabel endDate={project.endDate} completed={project.status === 'completed'} />
      </div>

      <div className={styles.footer}>
        {members.length > 0 ? <AvatarGroup people={members} max={5} size={28} /> : <span className={styles.noTeam}>No team yet</span>}
        <span className={styles.updated}>
          Updated {formatRelativeTime(project.updatedAt)}
        </span>
        <span className={styles.metaItem}>
          <CheckSquare size={13} />
          {total} {total === 1 ? 'task' : 'tasks'}
        </span>
      </div>
    </Link>
  );
});
