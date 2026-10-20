'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Send } from 'lucide-react';
import { computeLeaveBalance, submitLeaveRequest, useCurrentUser, useLeaveRequests, useWorkspace } from '@/store';
import { Button, Field, FormError, FormGrid, Input, Modal, Select, Textarea, type SelectOption } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { LEAVE_TYPES } from '@/constants/status';
import { daysBetweenInclusive, toDateKey } from '@/lib/date';
import { pluralize } from '@/lib/format';
import type { LeaveType } from '@/types';
import { BALANCE_KEY_BY_TYPE, LEAVE_TYPE_LABELS, pendingDaysByType } from '../utils';
import styles from './RequestLeaveModal.module.css';

const TYPE_OPTIONS: SelectOption<LeaveType>[] = LEAVE_TYPES.map((t) => ({ value: t, label: LEAVE_TYPE_LABELS[t] }));

export function RequestLeaveModal({ onClose }: { onClose: () => void }) {
  const id = useId();
  const toast = useToast();
  const user = useCurrentUser();
  const requests = useLeaveRequests();
  const { leaveAllowance } = useWorkspace();
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState(toDateKey());
  const [endDate, setEndDate] = useState(toDateKey());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const days = startDate && endDate ? daysBetweenInclusive(startDate, endDate) : 0;

  const available = useMemo(() => {
    const key = BALANCE_KEY_BY_TYPE[leaveType];
    if (!key) return null;
    const bucket = computeLeaveBalance(requests, user.id, leaveAllowance)[key];
    return Math.max(0, bucket.total - bucket.used - pendingDaysByType(requests, user.id)[leaveType]);
  }, [leaveType, requests, user.id, leaveAllowance]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return setError('Choose a start and end date.');
    if (days <= 0) return setError('The end date must be on or after the start date.');
    if (!reason.trim()) return setError('Add a short reason for your reviewer.');
    const result = submitLeaveRequest({ employeeId: user.id, leaveType, startDate, endDate, reason });
    if (!result.ok) return setError(result.error);
    toast.success(`Leave request for ${pluralize(result.data.days, 'day')} submitted for review.`);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Request leave"
      description="Your request is sent to reviewers for approval."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={id} icon={Send}>
            Submit request
          </Button>
        </>
      }
    >
      <form id={id} onSubmit={submit} className={styles.form} noValidate>
        <FormError message={error} />
        <Field
          label="Leave type"
          htmlFor={`${id}-type`}
          hint={available === null ? 'Unpaid leave does not use your balance.' : `${pluralize(available, 'day')} available after pending requests.`}
        >
          <Select<LeaveType> id={`${id}-type`} options={TYPE_OPTIONS} value={leaveType} onChange={setLeaveType} />
        </Field>
        <FormGrid columns={2}>
          <Field label="Start date" htmlFor={`${id}-start`} required>
            <Input
              id={`${id}-start`}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </Field>
          <Field label="End date" htmlFor={`${id}-end`} required>
            <Input id={`${id}-end`} type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </FormGrid>
        <div className={styles.days}>
          <CalendarDays size={16} />
          <span>{days > 0 ? `${pluralize(days, 'calendar day')} requested` : 'Pick a valid date range'}</span>
        </div>
        <Field label="Reason" htmlFor={`${id}-reason`} required>
          <Textarea
            id={`${id}-reason`}
            value={reason}
            maxLength={500}
            placeholder="Give your reviewer some context"
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
