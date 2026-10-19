import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { useProjectProgress } from '@/store';
import { Button, EmptyState, ProgressBar, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import type { Employee, Project } from '@/types';
import styles from './ProfileList.module.css';

interface ProfileProjectsTabProps {
  member: Employee;
  projects: Project[];
  onAssign?: (member: Employee) => void;
}

export function ProfileProjectsTab({ member, projects, onAssign }: ProfileProjectsTabProps) {
  const progress = useProjectProgress();
  const assignButton = onAssign && (
    <Button variant="outline" size="sm" icon={FolderKanban} onClick={() => onAssign(member)}>
      {projects.length === 0 ? 'Assign projects' : 'Edit assignments'}
    </Button>
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        compact
        icon={FolderKanban}
        title="Not on any projects yet"
        description={onAssign ? 'Assign this member to a project to start tracking their work.' : 'Project managers can assign members to projects.'}
        action={assignButton}
      />
    );
  }

  return (
    <div className={styles.wrap}>
      {assignButton && <div className={styles.toolbar}>{assignButton}</div>}
      <ul className={styles.list}>
        {projects.map((p) => (
          <li key={p.id} className={styles.item}>
            <div className={styles.itemHead}>
              <Link href={ROUTES.project(p.id)} className={styles.itemTitle}>
                {p.name}
              </Link>
              <StatusBadge kind="project" value={p.status} />
            </div>
            {p.client && <span className={styles.itemMeta}>{p.client}</span>}
            <ProgressBar value={progress.get(p.id)?.progress ?? 0} showValue label="Progress" />
          </li>
        ))}
      </ul>
    </div>
  );
}
