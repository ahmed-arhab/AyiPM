import { useCallback } from 'react';
import { cancelLeaveRequest, reviewLeaveRequest } from '@/store';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { pluralize } from '@/lib/format';
import type { LeaveRequest } from '@/types';

export function useLeaveActions() {
  const toast = useToast();
  const confirm = useConfirm();

  const approve = useCallback(
    (request: LeaveRequest, employeeName: string) => {
      const result = reviewLeaveRequest(request.id, 'approved');
      if (result.ok) toast.success(`Approved ${pluralize(request.days, 'day')} of leave for ${employeeName}.`);
      else toast.error(result.error);
    },
    [toast]
  );

  const cancel = useCallback(
    async (request: LeaveRequest) => {
      const confirmed = await confirm({
        title: 'Cancel this leave request?',
        message: `Your ${request.leaveType.toLowerCase()} leave request for ${pluralize(request.days, 'day')} will be withdrawn.`,
        confirmLabel: 'Cancel request',
        cancelLabel: 'Keep it',
        tone: 'danger',
      });
      if (!confirmed) return;
      const result = cancelLeaveRequest(request.id);
      if (result.ok) toast.success('Leave request cancelled.');
      else toast.error(result.error);
    },
    [confirm, toast]
  );

  return { approve, cancel };
}
