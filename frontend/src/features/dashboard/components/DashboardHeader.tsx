import { CalendarDays, FolderPlus, ListPlus, PlaneTakeoff, UserPlus } from 'lucide-react';
import { ButtonLink, PageHeader, RoleBadge } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { useCurrentUser, usePermission } from '@/store';
import { useT } from '@/translations';
import { firstName, formatToday, greetingFor } from '../utils';
import styles from './DashboardHeader.module.css';

export function DashboardHeader() {
  const me = useCurrentUser();
  const t = useT();
  const canManageProjects = usePermission('projects.manage');
  const canManageTasks = usePermission('tasks.manage');
  const canManageEmployees = usePermission('employees.manage');
  const now = new Date();

  return (
    <PageHeader
      eyebrow={
        <span className={styles.eyebrow}>
          <CalendarDays size={13} />
          {formatToday(now, t.locale)}
        </span>
      }
      title={`${t(greetingFor(now))}, ${firstName(me.name)}`}
      description={
        <span className={styles.meta}>
          <RoleBadge role={me.role} />
          {me.designation && <span>{me.designation}</span>}
        </span>
      }
      actions={
        <div className={styles.actions}>
          {canManageProjects && (
            <ButtonLink href={`${ROUTES.projects}?new=1`} icon={FolderPlus}>
              {t('New project')}
            </ButtonLink>
          )}
          {canManageTasks && (
            <ButtonLink href={`${ROUTES.tasks}?new=1`} variant="secondary" icon={ListPlus}>
              {t('New task')}
            </ButtonLink>
          )}
          {canManageEmployees && (
            <ButtonLink href={ROUTES.team} variant="secondary" icon={UserPlus}>
              {t('Add member')}
            </ButtonLink>
          )}
          <ButtonLink href={ROUTES.leave} variant="outline" icon={PlaneTakeoff}>
            {t('Request leave')}
          </ButtonLink>
        </div>
      }
    />
  );
}
