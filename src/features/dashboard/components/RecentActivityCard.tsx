import { useMemo } from 'react';
import { History } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { useActivityLog, useCurrentUser, useEmployeesById, usePermission } from '@/store';
import type { ActivityLogItem } from '@/types';
import { ActivityList } from '@/features/projects/components/ActivityList';
import { CardLink } from './CardLink';
import styles from './RecentActivityCard.module.css';

const LIMIT = 20;

export function RecentActivityCard() {
  const me = useCurrentUser();
  const seesAll = usePermission('activity.viewAll');
  const activityLog = useActivityLog();
  const employeesById = useEmployeesById();
  const items = useMemo(() => {
    if (seesAll) return activityLog.slice(0, LIMIT);
    const mine: ActivityLogItem[] = [];
    for (const item of activityLog) {
      if (item.actorId === me.id) mine.push(item);
      if (mine.length >= LIMIT) break;
    }
    return mine;
  }, [activityLog, seesAll, me.id]);

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={History}
        title="Recent activity"
        description={seesAll ? 'Across the workspace' : 'Your latest actions'}
        actions={<CardLink href={ROUTES.activity}>View all</CardLink>}
      />
      {items.length === 0 ? (
        <EmptyState compact icon={History} title="No activity yet" description="Actions like creating projects, updating tasks and reviewing leave will show up here." />
      ) : (
        <div className={styles.scrollArea}>
          <ActivityList items={items} employeesById={employeesById} />
        </div>
      )}
    </Card>
  );
}
