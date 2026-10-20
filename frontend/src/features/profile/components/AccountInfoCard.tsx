'use client';

import type { ReactNode } from 'react';
import { CheckSquare, FolderKanban, IdCard, PlaneTakeoff } from 'lucide-react';
import { Card, CardHeader, RoleBadge } from '@/components/ui';
import { useFormatters } from '@/store';
import { ROUTES } from '@/constants/navigation';
import type { Employee } from '@/types';
import { useAccountSummary } from '../hooks/useAccountSummary';
import { SummaryTile } from './SummaryTile';
import styles from './AccountInfoCard.module.css';

export function AccountInfoCard({ user }: { user: Employee }) {
  const { date, dateTime } = useFormatters();
  const summary = useAccountSummary(user.id);
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Employee ID', value: <span className={styles.mono}>{user.employeeId}</span> },
    { label: 'Role', value: <RoleBadge role={user.role} /> },
    { label: 'Department', value: user.department || '—' },
    { label: 'Designation', value: user.designation || '—' },
    { label: 'Member since', value: date(user.createdAt) },
    { label: 'Last updated', value: dateTime(user.updatedAt) },
  ];

  return (
    <Card as="section" aria-label="Account information">
      <CardHeader icon={IdCard} title="Account information" description="Read-only details managed by your workspace." />
      <dl className={styles.list}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.summary}>
        <SummaryTile href={ROUTES.projects} icon={FolderKanban} label="Projects" value={summary.projects} />
        <SummaryTile href={ROUTES.tasks} icon={CheckSquare} label="Open tasks" value={summary.openTasks} />
        <SummaryTile
          href={ROUTES.leave}
          icon={PlaneTakeoff}
          label="Leave left"
          value={summary.leaveRemaining}
          hint={`of ${summary.leaveTotal} days`}
        />
      </div>
    </Card>
  );
}
