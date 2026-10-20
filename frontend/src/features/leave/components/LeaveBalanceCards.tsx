import { useMemo } from 'react';
import { computeLeaveBalance, useCurrentUser, useLeaveRequests, useWorkspace } from '@/store';
import { BALANCE_CARDS, pendingDaysByType } from '../utils';
import { LeaveBalanceCard } from './LeaveBalanceCard';
import styles from './LeaveBalanceCards.module.css';

export function LeaveBalanceCards() {
  const user = useCurrentUser();
  const requests = useLeaveRequests();
  const { leaveAllowance } = useWorkspace();

  const balance = useMemo(() => computeLeaveBalance(requests, user.id, leaveAllowance), [requests, user.id, leaveAllowance]);
  const pending = useMemo(() => pendingDaysByType(requests, user.id), [requests, user.id]);

  return (
    <div className={styles.grid}>
      {BALANCE_CARDS.map((card) => (
        <LeaveBalanceCard
          key={card.key}
          label={card.label}
          icon={card.icon}
          accent={card.accent}
          total={balance[card.key].total}
          used={balance[card.key].used}
          pending={pending[card.type]}
        />
      ))}
    </div>
  );
}
