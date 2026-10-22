import Link from 'next/link';
import { ArrowRight, CheckCircle2, CheckSquare, FolderKanban, Rocket, Users, type LucideIcon } from 'lucide-react';
import { ButtonLink, Card, CardHeader } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { hasPermission, type Permission } from '@/constants/roles';
import { cn } from '@/lib/cn';
import { useAppStore, useCurrentUser } from '@/store';
import { useT } from '@/translations';
import styles from './GetStartedCard.module.css';

interface Step {
  key: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  permission: Permission;
  done: boolean;
}

export function GetStartedCard() {
  const t = useT();
  const me = useCurrentUser();
  const otherMembers = useAppStore((s) => s.employees.filter((e) => e.status === 'active' && e.id !== s.session?.userId).length);
  const projectCount = useAppStore((s) => s.projects.length);
  const taskCount = useAppStore((s) => s.tasks.length);

  const steps: Step[] = [
    {
      key: 'team',
      title: t('Add your team members'),
      description: t('Invite colleagues so you can staff projects and assign work.'),
      href: ROUTES.team,
      cta: t('Add members'),
      icon: Users,
      permission: 'employees.manage',
      done: otherMembers > 0,
    },
    {
      key: 'project',
      title: t('Create a project'),
      description: t('Set a timeline, a manager and the people working on it.'),
      href: `${ROUTES.projects}?new=1`,
      cta: t('New project'),
      icon: FolderKanban,
      permission: 'projects.manage',
      done: projectCount > 0,
    },
    {
      key: 'tasks',
      title: t('Create tasks'),
      description: t('Break projects into tasks — progress is calculated from them.'),
      href: `${ROUTES.tasks}?new=1`,
      cta: t('New task'),
      icon: CheckSquare,
      permission: 'tasks.manage',
      done: taskCount > 0,
    },
  ];
  const available = steps.filter((s) => hasPermission(me.role, s.permission));
  const remaining = available.filter((s) => !s.done).length;

  if (available.length === 0) {
    if (projectCount > 0) return null;
    return (
      <Card as="section" className={styles.card}>
        <CardHeader
          icon={Rocket}
          title={t('Welcome aboard')}
          description={t('Your workspace is still being set up. Projects and tasks assigned to you will show up here.')}
        />
        <div className={styles.inlineActions}>
          <ButtonLink href={ROUTES.profile} variant="secondary" size="sm">
            {t('Complete your profile')}
          </ButtonLink>
          <ButtonLink href={ROUTES.attendance} variant="ghost" size="sm">
            {t('View attendance')}
          </ButtonLink>
        </div>
      </Card>
    );
  }
  if (remaining === 0) return null;

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={Rocket}
        title={t('Get started')}
        description={`${t.formatNumber(available.length - remaining)} / ${t.formatNumber(available.length)} ${t('setup steps complete')}`}
      />
      <ol className={styles.steps}>
        {available.map((step, index) => {
          const Icon = step.done ? CheckCircle2 : step.icon;
          return (
            <li key={step.key} className={cn(styles.step, step.done && styles.done)}>
              <span className={styles.icon}>
                <Icon size={18} />
              </span>
              <div className={styles.text}>
                <span className={styles.title}>
                  {index + 1}. {step.title}
                </span>
                <span className={styles.description}>{step.description}</span>
              </div>
              {step.done ? (
                <span className={styles.doneLabel}>{t('Done')}</span>
              ) : (
                <Link href={step.href} className={styles.cta}>
                  {step.cta}
                  <ArrowRight size={14} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
