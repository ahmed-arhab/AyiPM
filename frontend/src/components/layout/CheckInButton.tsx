'use client';

import { useState } from 'react';
import { CheckCircle2, LogOut } from 'lucide-react';
import { checkIn, checkOut, selectWorkspaceToday, useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { useT } from '@/translations';

export function CheckInButton() {
  const toast = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const state = useAppStore((s) => {
    const userId = s.session?.userId;
    const today = selectWorkspaceToday(s);
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
        loading={busy}
        onClick={async () => {
          setBusy(true);
          const result = await checkOut();
          setBusy(false);
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
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const result = await checkIn();
        setBusy(false);
        if (result.ok) toast.success(result.data.status === 'late' ? t('Checked in (after grace period).') : t('Checked in on time.'));
        else toast.error(result.error);
      }}
    >
      {t('Check In')}
    </Button>
  );
}
