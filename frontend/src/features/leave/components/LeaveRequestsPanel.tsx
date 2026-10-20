'use client';

import { useCallback, useMemo, useState } from 'react';
import { Inbox, User, Users } from 'lucide-react';
import { useCurrentUser, useEmployeesById } from '@/store';
import { Card, CardHeader, SegmentedControl, type SegmentOption } from '@/components/ui';
import { useT } from '@/translations';
import type { LeaveRequest } from '@/types';
import { useLeaveActions } from '../hooks/useLeaveActions';
import { useLeaveRequestsView } from '../hooks/useLeaveRequestsView';
import type { LeaveScope, LeaveStatusTab } from '../utils';
import { LeaveRequestsTable } from './LeaveRequestsTable';
import { RejectLeaveModal } from './RejectLeaveModal';
import styles from './LeaveRequestsPanel.module.css';

const EMPTY_COPY: Record<LeaveScope, Record<'all' | 'filtered', [string, string]>> = {
  mine: {
    all: ['No leave requests yet', 'Use “Request leave” to plan time off. Your requests and their status will appear here.'],
    filtered: ['Nothing here', 'You have no requests with this status.'],
  },
  team: {
    all: ['No team requests', 'Leave requests from your teammates will appear here for review.'],
    filtered: ['Nothing here', 'No team requests with this status.'],
  },
};

export function LeaveRequestsPanel() {
  const { t } = useT();
  const user = useCurrentUser();
  const employeesById = useEmployeesById();
  const view = useLeaveRequestsView();
  const { approve, cancel } = useLeaveActions();
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const { canReview, canReviewOwn } = view;

  const nameOf = useCallback((id: string) => employeesById.get(id)?.name ?? t('this member'), [employeesById, t]);
  const onApprove = useCallback((r: LeaveRequest) => approve(r, nameOf(r.employeeId)), [approve, nameOf]);
  const canReviewRequest = useCallback(
    (r: LeaveRequest) => canReview && (r.employeeId !== user.id || canReviewOwn),
    [canReview, canReviewOwn, user.id]
  );

  const statusOptions = useMemo<SegmentOption<LeaveStatusTab>[]>(
    () => [
      { value: 'all', label: t('All'), count: view.counts.all },
      { value: 'pending', label: t('Pending'), count: view.counts.pending },
      { value: 'approved', label: t('Approved'), count: view.counts.approved },
      { value: 'rejected', label: t('Rejected'), count: view.counts.rejected },
    ],
    [view.counts, t]
  );
  const scopeOptions = useMemo<SegmentOption<LeaveScope>[]>(
    () => [
      { value: 'mine', label: t('My requests'), icon: User },
      { value: 'team', label: t('Team requests'), icon: Users, count: view.teamPending || undefined },
    ],
    [view.teamPending, t]
  );

  const [emptyTitle, emptyDescription] = EMPTY_COPY[view.scope][view.status === 'all' ? 'all' : 'filtered'];

  return (
    <Card className={styles.panel}>
      <CardHeader
        icon={Inbox}
        title={t(view.scope === 'team' ? 'Team leave requests' : 'My leave requests')}
        description={t(view.scope === 'team' ? 'Approve or reject pending requests from your team.' : 'Track the status of your time-off requests.')}
        actions={canReview && <SegmentedControl label={t('Request scope')} options={scopeOptions} value={view.scope} onChange={view.setScope} />}
      />
      <SegmentedControl label={t('Filter by status')} size="sm" options={statusOptions} value={view.status} onChange={view.setStatus} />
      <LeaveRequestsTable
        key={`${view.scope}-${view.status}`}
        rows={view.rows}
        currentUserId={user.id}
        canReviewRequest={canReviewRequest}
        onApprove={onApprove}
        onReject={setRejecting}
        onCancel={cancel}
        emptyTitle={t(emptyTitle)}
        emptyDescription={t(emptyDescription)}
      />
      {rejecting && <RejectLeaveModal request={rejecting} employeeName={nameOf(rejecting.employeeId)} onClose={() => setRejecting(null)} />}
    </Card>
  );
}
