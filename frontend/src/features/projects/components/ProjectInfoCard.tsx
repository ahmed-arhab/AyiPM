import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Avatar, Card, CardHeader } from '@/components/ui';
import { useEmployee, useFormatters } from '@/store';
import type { Project } from '@/types';
import styles from './ProjectInfoCard.module.css';

function PersonValue({ id, fallback }: { id?: string; fallback: string }) {
  const person = useEmployee(id);
  if (!person) return <span className="text-muted">{fallback}</span>;
  return (
    <span className={styles.person}>
      <Avatar name={person.name} src={person.avatar} size={22} />
      {person.name}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ProjectInfoCard({ project }: { project: Project }) {
  const { date, dateTime } = useFormatters();
  return (
    <Card as="section">
      <CardHeader icon={Info} title="Project information" />
      <p className={project.description ? styles.description : `${styles.description} text-muted`}>
        {project.description || 'No description has been added yet.'}
      </p>
      <dl className={styles.grid}>
        <InfoRow label="Start date">{date(project.startDate)}</InfoRow>
        <InfoRow label="Deadline">{date(project.endDate)}</InfoRow>
        <InfoRow label="Project manager">
          <PersonValue id={project.managerId} fallback="Unassigned" />
        </InfoRow>
        <InfoRow label="Budget">{project.budget || <span className="text-muted">Not set</span>}</InfoRow>
        <InfoRow label="Created by">
          <PersonValue id={project.createdBy} fallback="Former member" />
        </InfoRow>
        <InfoRow label="Created">{dateTime(project.createdAt)}</InfoRow>
        <InfoRow label="Last updated">{dateTime(project.updatedAt)}</InfoRow>
      </dl>
    </Card>
  );
}
