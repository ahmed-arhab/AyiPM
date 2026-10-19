'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AvatarGroup, DataTable, ProgressBar, StatusBadge, type Column } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import type { ProjectProgress } from '@/store';
import type { Employee, Project } from '@/types';
import { resolveMembers } from '../utils';
import { DeadlineLabel } from './DeadlineLabel';
import styles from './ProjectTable.module.css';

interface ProjectTableProps {
  projects: Project[];
  progress: Map<string, ProjectProgress>;
  employeesById: Map<string, Employee>;
  formatDate: (value?: string) => string;
}

export function ProjectTable({ projects, progress, employeesById, formatDate }: ProjectTableProps) {
  const router = useRouter();

  const columns = useMemo<Column<Project>[]>(
    () => [
      {
        key: 'name',
        header: 'Project',
        render: (p) => (
          <div className={styles.nameCell}>
            <Link href={ROUTES.project(p.id)} className={styles.name} onClick={(e) => e.stopPropagation()}>
              {p.name}
            </Link>
            <span className={styles.sub}>{p.client || 'Internal project'}</span>
          </div>
        ),
      },
      { key: 'status', header: 'Status', render: (p) => <StatusBadge kind="project" value={p.status} /> },
      {
        key: 'progress',
        header: 'Progress',
        width: '180px',
        render: (p) => {
          const entry = progress.get(p.id);
          return <ProgressBar value={entry?.progress ?? 0} label={`${entry?.done ?? 0}/${entry?.total ?? 0} tasks`} showValue />;
        },
      },
      {
        key: 'deadline',
        header: 'Deadline',
        render: (p) => (
          <div className={styles.deadline}>
            <span>{formatDate(p.endDate)}</span>
            <DeadlineLabel endDate={p.endDate} completed={p.status === 'completed'} />
          </div>
        ),
      },
      {
        key: 'manager',
        header: 'Manager',
        render: (p) => <span className={styles.sub}>{(p.managerId && employeesById.get(p.managerId)?.name) || '—'}</span>,
      },
      {
        key: 'team',
        header: 'Team',
        render: (p) => {
          const members = resolveMembers(p.members, employeesById);
          return members.length > 0 ? <AvatarGroup people={members} max={4} size={26} /> : <span className={styles.sub}>—</span>;
        },
      },
    ],
    [progress, employeesById, formatDate]
  );

  return (
    <DataTable
      columns={columns}
      rows={projects}
      rowKey={(p) => p.id}
      onRowClick={(p) => router.push(ROUTES.project(p.id))}
      minWidth={860}
      caption="Projects"
    />
  );
}
