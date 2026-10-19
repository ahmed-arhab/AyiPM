'use client';

import { useState } from 'react';
import { CheckCircle2, FolderKanban } from 'lucide-react';
import { setEmployeeProjects, useProjectProgress, useProjects } from '@/store';
import { Button, ButtonLink, EmptyState, Modal, ProgressBar, StatusBadge } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { ROUTES } from '@/constants/navigation';
import { cn } from '@/lib/cn';
import { pluralize } from '@/lib/format';
import type { Employee } from '@/types';
import { MemberIdentity } from './MemberIdentity';
import styles from './ProjectAssignModal.module.css';

interface ProjectAssignModalProps {
  member: Employee;
  onClose: () => void;
}

export function ProjectAssignModal({ member, onClose }: ProjectAssignModalProps) {
  const toast = useToast();
  const projects = useProjects();
  const progress = useProjectProgress();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(projects.filter((p) => p.members.includes(member.id)).map((p) => p.id))
  );

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = () => {
    const result = setEmployeeProjects(member.id, Array.from(selected));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Project assignments updated for ${member.name}.`);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Project assignments"
      size="lg"
      footer={
        <>
          <span className={styles.footerNote}>
            {selected.size} of {pluralize(projects.length, 'project')} selected
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={CheckCircle2} onClick={save} disabled={projects.length === 0}>
            Save assignments
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={styles.member}>
          <MemberIdentity member={member} subtitle={`${member.designation} · ${member.department}`} />
        </div>

        {projects.length === 0 ? (
          <EmptyState
            compact
            icon={FolderKanban}
            title="No projects yet"
            description="Create a project first, then come back to assign team members."
            action={
              <ButtonLink href={ROUTES.projects} size="sm" icon={FolderKanban}>
                Go to projects
              </ButtonLink>
            }
          />
        ) : (
          <>
            <div className={styles.listHeader}>
              <span>Select the projects {member.name.split(' ')[0]} works on</span>
              <span className={styles.quick}>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(projects.map((p) => p.id)))}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </span>
            </div>
            <ul className={styles.list}>
              {projects.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <label className={cn(styles.option, checked && styles.checked)}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} />
                      <span className={styles.optionBody}>
                        <span className={styles.optionTitle}>
                          <span className={styles.projectName}>{p.name}</span>
                          <StatusBadge kind="project" value={p.status} />
                        </span>
                        <span className={styles.optionMeta}>
                          {p.client ? `${p.client} · ` : ''}
                          {pluralize(p.members.length, 'member')}
                        </span>
                        <ProgressBar value={progress.get(p.id)?.progress ?? 0} />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}
