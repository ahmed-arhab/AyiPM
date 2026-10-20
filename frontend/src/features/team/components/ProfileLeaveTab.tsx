import { useMemo } from 'react';
import { PlaneTakeoff } from 'lucide-react';
import { computeLeaveBalance, useFormatters, useLeaveRequests, useWorkspace } from '@/store';
import { EmptyState, ProgressBar, StatusBadge } from '@/components/ui';
import { percent, pluralize } from '@/lib/format';
import styles from './ProfileList.module.css';
import tabStyles from './ProfileLeaveTab.module.css';

const RECENT_LIMIT = 5;

export function ProfileLeaveTab({ memberId }: { memberId: string }) {
  const leaveRequests = useLeaveRequests();
  const { leaveAllowance } = useWorkspace();
  const { date } = useFormatters();

  const balance = useMemo(() => computeLeaveBalance(leaveRequests, memberId, leaveAllowance), [leaveRequests, memberId, leaveAllowance]);
  const recent = useMemo(
    () =>
      leaveRequests
        .filter((r) => r.employeeId === memberId)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, RECENT_LIMIT),
    [leaveRequests, memberId]
  );

  const buckets = [
    { label: 'Annual', ...balance.annual },
    { label: 'Sick', ...balance.sick },
    { label: 'Casual', ...balance.casual },
  ];

  return (
    <div className={styles.wrap}>
      <h4 className={styles.sectionTitle}>Balance this year</h4>
      <div className={tabStyles.balances}>
        {buckets.map((b) => (
          <div key={b.label} className={tabStyles.balance}>
            <span className={tabStyles.balanceLabel}>{b.label}</span>
            <span className={tabStyles.balanceValue}>
              {Math.max(0, b.total - b.used)}
              <small> / {b.total} days left</small>
            </span>
            <ProgressBar value={percent(b.used, b.total)} />
          </div>
        ))}
      </div>

      <h4 className={styles.sectionTitle}>Recent requests</h4>
      {recent.length === 0 ? (
        <EmptyState compact icon={PlaneTakeoff} title="No leave requests" description="Leave requests will show up here once submitted." />
      ) : (
        <ul className={styles.list}>
          {recent.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemTitle}>
                  {r.leaveType} · {pluralize(r.days, 'day')}
                </span>
                <StatusBadge kind="leave" value={r.status} />
              </div>
              <span className={styles.itemMeta}>
                {date(r.startDate)} → {date(r.endDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
