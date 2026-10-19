'use client';

import { CheckCircle2, LogOut } from 'lucide-react';
import { toDateKey } from '@/lib/date';
import { checkIn, checkOut, useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { useT } from '@/translations';

export function CheckInButton() {
  const toast = useToast();
  const t = useT();
  const state = useAppStore((s) => {
    const userId = s.session?.userId;
    const today = toDateKey();
    const record = s.attendance.find((r) => r.employeeId === userId && r.date === today);
    if (!record) return 'out';
    if (record.status === 'leave') return 'leave';
    if (record.checkOutAt) return 'done';
    return record.checkInAt ? 'in' : 'out';
  });

  if (state === 'leave' || state === 'done') return null;

  if (state === 'in') {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={LogOut}
        onClick={() => {
          const result = checkOut();
          if (result.ok) toast.success(t('Checked out. Have a good evening!'));
          else toast.error(result.error);
        }}
      >
        {t('Check Out')}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      icon={CheckCircle2}
      onClick={() => {
        const result = checkIn();
        if (result.ok) toast.success(result.data.status === 'late' ? t('Checked in (after grace period).') : t('Checked in on time.'));
        else toast.error(result.error);
      }}
    >
      {t('Check In')}
    </Button>
  );
}
