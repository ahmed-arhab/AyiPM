'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button, PageHeader, Select, StatusBadge } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { ROUTES } from '@/constants/navigation';
import { updateProjectStatus } from '@/store';
import type { Project, ProjectStatus } from '@/types';
import { PROJECT_STATUS_OPTIONS } from '../utils';
import styles from './ProjectDetailsHeader.module.css';

interface ProjectDetailsHeaderProps {
  project: Project;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectDetailsHeader({ project, canManage, onEdit, onDelete }: ProjectDetailsHeaderProps) {
  const toast = useToast();

  const changeStatus = (status: ProjectStatus) => {
    const result = updateProjectStatus(project.id, status);
    if (result.ok) toast.success('Project status updated');
    else toast.error(result.error);
  };

  return (
    <PageHeader
      back={
        <Link href={ROUTES.projects} className={styles.back}>
          <ArrowLeft size={14} />
          All projects
        </Link>
      }
      eyebrow={project.client || 'Internal project'}
      title={project.name}
      description={
        <span className={styles.statusLine}>
          <StatusBadge kind="project" value={project.status} />
        </span>
      }
      actions={
        canManage && (
          <>
            <Select
              aria-label="Change project status"
              className={styles.statusSelect}
              options={PROJECT_STATUS_OPTIONS}
              value={project.status}
              onChange={changeStatus}
            />
            <Button variant="secondary" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
            <Button variant="danger" icon={Trash2} onClick={onDelete}>
              Delete
            </Button>
          </>
        )
      }
    />
  );
}
