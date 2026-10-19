import { Check, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import type { LeaveRequest } from '@/types';
import styles from './LeaveRequestActions.module.css';

interface LeaveRequestActionsProps {
  request: LeaveRequest;
  canReview: boolean;
  canCancel: boolean;
  onApprove: (request: LeaveRequest) => void;
  onReject: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
}

export function LeaveRequestActions({ request, canReview, canCancel, onApprove, onReject, onCancel }: LeaveRequestActionsProps) {
  if (request.status !== 'pending' || (!canReview && !canCancel)) return <span className="text-muted">—</span>;
  return (
    <span className={styles.actions}>
      {canReview && (
        <>
          <Button variant="success" size="sm" icon={Check} onClick={() => onApprove(request)}>
            Approve
          </Button>
          <Button variant="outline" size="sm" icon={X} className={styles.reject} onClick={() => onReject(request)}>
            Reject
          </Button>
        </>
      )}
      {canCancel && (
        <Button variant="ghost" size="sm" icon={Undo2} onClick={() => onCancel(request)}>
          Cancel
        </Button>
      )}
    </span>
  );
}
