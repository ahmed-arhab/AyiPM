import Link from 'next/link';
import { PlaneTakeoff } from 'lucide-react';
import { Avatar, Card, CardHeader, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { pluralize } from '@/lib/format';
import { useEmployeesById, useFormatters } from '@/store';
import { useT } from '@/translations';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import { CardLink } from './CardLink';
import styles from './PendingApprovalsCard.module.css';

const LIMIT = 5;

export function PendingApprovalsCard() {
  const t = useT();
  const pending = usePendingApprovals();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();

  return (
    <Card as="section">
      <CardHeader
        icon={PlaneTakeoff}
        title={t('Pending approvals')}
        description={
          pending.length > 0
            ? t('{count} {unit} awaiting review', {
                count: t.formatNumber(pending.length),
                unit: t(pending.length === 1 ? 'leave request' : 'leave requests'),
              })
            : t('Leave requests awaiting review')
        }
        actions={<CardLink href={ROUTES.leave}>{t('Review')}</CardLink>}
      />
      {pending.length === 0 ? (
        <EmptyState compact icon={PlaneTakeoff} title={t('All clear')} description={t('There are no leave requests waiting for your review.')} />
      ) : (
        <ul className={styles.list}>
          {pending.slice(0, LIMIT).map((r) => {
            const employee = employeesById.get(r.employeeId);
            const name = employee?.name ?? t('Former member');
            return (
              <li key={r.id}>
                <Link href={ROUTES.leave} className={styles.row}>
                  <Avatar name={name} src={employee?.avatar} size={30} />
                  <span className={styles.text}>
                    <span className={styles.name}>{name}</span>
                    <span className={styles.meta}>
                      {t(r.leaveType)} · {t.formatNumber(r.days)} {t(r.days === 1 ? 'day' : 'days')} · {date(r.startDate)}
                      {r.endDate !== r.startDate && ` – ${date(r.endDate)}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {pending.length > LIMIT && (
        <p className={styles.more}>
          {t('+{count} more pending', { count: t.formatNumber(pending.length - LIMIT) })}
        </p>
      )}
    </Card>
  );
}
