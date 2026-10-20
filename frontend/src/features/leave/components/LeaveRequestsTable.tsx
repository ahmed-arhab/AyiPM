import { useMemo } from 'react';
import { PlaneTakeoff } from 'lucide-react';
import { useEmployeesById, useFormatters } from '@/store';
import { Avatar, DataTable, EmptyState, Pagination, StatusBadge, type Column } from '@/components/ui';
import { usePagination } from '@/hooks/usePagination';
import { pluralize } from '@/lib/format';
import type { LeaveRequest } from '@/types';
import { LeaveRequestActions } from './LeaveRequestActions';
import styles from './LeaveRequestsTable.module.css';

interface LeaveRequestsTableProps {
  rows: LeaveRequest[];
  currentUserId: string;
  canReviewRequest: (request: LeaveRequest) => boolean;
  onApprove: (request: LeaveRequest) => void;
  onReject: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
  emptyTitle: string;
  emptyDescription: string;
}

const PAGE_SIZE = 10;

export function LeaveRequestsTable({
  rows,
  currentUserId,
  canReviewRequest,
  onApprove,
  onReject,
  onCancel,
  emptyTitle,
  emptyDescription,
}: LeaveRequestsTableProps) {
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(rows, PAGE_SIZE);

  const columns = useMemo<Column<LeaveRequest>[]>(
    () => [
      {
        key: 'employee',
        header: 'Employee',
        render: (r) => {
          const e = employeesById.get(r.employeeId);
          return (
            <span className={styles.person}>
              <Avatar name={e?.name ?? '?'} src={e?.avatar} size={32} />
              <span className={styles.stack}>
                <span className={styles.name}>{e?.name ?? 'Former member'}</span>
                <span className={styles.muted}>Applied {date(r.appliedOn)}</span>
              </span>
            </span>
          );
        },
      },
      { key: 'type', header: 'Type', render: (r) => <span className="badge badge-purple">{r.leaveType}</span> },
      {
        key: 'dates',
        header: 'Dates',
        render: (r) => (
          <span className={styles.stack}>
            <span>{r.startDate === r.endDate ? date(r.startDate) : `${date(r.startDate)} → ${date(r.endDate)}`}</span>
            <span className={styles.muted}>{pluralize(r.days, 'day')}</span>
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (r) => (
          <span className={styles.reason}>
            <span>{r.reason}</span>
            {r.rejectionReason && <span className={styles.rejection}>Rejected: {r.rejectionReason}</span>}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => {
          const reviewer = r.reviewedBy ? employeesById.get(r.reviewedBy)?.name ?? 'Former member' : undefined;
          return (
            <span className={styles.stack}>
              <StatusBadge kind="leave" value={r.status} />
              {reviewer && <span className={styles.muted}>by {reviewer}</span>}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        render: (r) => (
          <LeaveRequestActions
            request={r}
            canReview={canReviewRequest(r)}
            canCancel={r.employeeId === currentUserId}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
          />
        ),
      },
    ],
    [employeesById, date, currentUserId, canReviewRequest, onApprove, onReject, onCancel]
  );

  return (
    <div className={styles.wrap}>
      <DataTable
        caption="Leave requests"
        columns={columns}
        rows={pageItems}
        rowKey={(r) => r.id}
        minWidth={980}
        empty={<EmptyState compact icon={PlaneTakeoff} title={emptyTitle} description={emptyDescription} />}
      />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
