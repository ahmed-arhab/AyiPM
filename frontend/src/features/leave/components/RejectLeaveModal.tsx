'use client';

import { useId, useState, type FormEvent } from 'react';
import { XCircle } from 'lucide-react';
import { reviewLeaveRequest } from '@/store';
import { Button, Field, FormError, Modal, Textarea } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { pluralize } from '@/lib/format';
import type { LeaveRequest } from '@/types';
import styles from './RejectLeaveModal.module.css';

interface RejectLeaveModalProps {
  request: LeaveRequest;
  employeeName: string;
  onClose: () => void;
}

export function RejectLeaveModal({ request, employeeName, onClose }: RejectLeaveModalProps) {
  const id = useId();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return setError('Please give a reason so they know what to change.');
    const result = reviewLeaveRequest(request.id, 'rejected', reason);
    if (!result.ok) return setError(result.error);
    toast.success(`Rejected ${employeeName}'s leave request.`);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title="Reject leave request"
      description={`${employeeName} · ${request.leaveType} · ${pluralize(request.days, 'day')}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={id} variant="danger" icon={XCircle}>
            Reject request
          </Button>
        </>
      }
    >
      <form id={id} onSubmit={submit} className={styles.form} noValidate>
        <FormError message={error} />
        <Field label="Reason" htmlFor={`${id}-reason`} required hint="Shared with the employee.">
          <Textarea
            id={`${id}-reason`}
            value={reason}
            maxLength={300}
            placeholder="e.g. Release week, please pick dates after the 20th"
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
