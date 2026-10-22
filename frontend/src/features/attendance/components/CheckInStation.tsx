'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, LogOut, PlaneTakeoff } from 'lucide-react';
import { checkIn, checkOut, selectWorkspaceToday, useAppStore, useCurrentUser, useFormatters, useWorkspace } from '@/store';
import { Badge, Button, Card, Input, StatusBadge } from '@/components/ui';
import { useT } from '@/translations';
import { useToast } from '@/components/feedback/ToastProvider';
import { formatDateLong, formatHours, graceDeadlineLabel } from '@/lib/date';
import { useTodayRecord } from '../hooks/useTodayRecord';
import { ShiftTimer } from './ShiftTimer';
import styles from './CheckInStation.module.css';

export function CheckInStation() {
  const { t, formatNumber, locale } = useT();
  const user = useCurrentUser();
  const workspace = useWorkspace();
  const today = useAppStore(selectWorkspaceToday);
  const record = useTodayRecord(user.id);
  const { time } = useFormatters();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const onLeave = record?.status === 'leave';
  const checkedIn = !!record?.checkInAt && !record.checkOutAt;
  const completed = !!record?.checkOutAt;
  const canCheckIn = !onLeave && !record?.checkInAt;

  const handleCheckIn = async () => {
    if (busy) return;
    setBusy(true);
    const result = await checkIn(notes);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    setNotes('');
    toast.success(result.data.status === 'late' ? t('Checked in (after grace period).') : t('Checked in on time.'));
  };

  const handleCheckOut = async () => {
    setBusy(true);
    const result = await checkOut();
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(t('Checked out. Have a good evening!'));
  };

  return (
    <Card className={styles.station}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>{t('Today · {date}', { date: formatDateLong(today, locale) })}</span>
        <h2 className="heading-lg">{user.name}</h2>
        <p className={styles.rule}>
          <Clock size={14} />
          {t('Workday starts {start} · late after {grace} · under {hours}h counts as a half day', {
            start: workspace.workDayStart,
            grace: graceDeadlineLabel(workspace.workDayStart, workspace.gracePeriodMinutes),
            hours: formatNumber(workspace.halfDayThresholdHours),
          })}
        </p>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>{t('Status')}</dt>
          <dd>{record ? <StatusBadge kind="attendance" value={record.status} /> : <Badge>{t('Not checked in')}</Badge>}</dd>
        </div>
        <div>
          <dt>{t('Check in')}</dt>
          <dd className={styles.mono}>{time(record?.checkInAt)}</dd>
        </div>
        <div>
          <dt>{t('Check out')}</dt>
          <dd className={styles.mono}>{checkedIn ? t('In progress') : time(record?.checkOutAt)}</dd>
        </div>
        <div>
          <dt>{completed ? t('Hours logged') : t('Shift duration')}</dt>
          <dd>{checkedIn && record?.checkInAt ? <ShiftTimer since={record.checkInAt} /> : <strong>{formatHours(record?.workingHours)}</strong>}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {onLeave && (
          <p className={styles.done}>
            <PlaneTakeoff size={16} /> {t('You are on approved leave today.')}
          </p>
        )}
        {completed && (
          <p className={styles.done}>
            <CheckCircle2 size={16} /> {t('Shift completed · {hours}', { hours: formatHours(record?.workingHours) })}
          </p>
        )}
        {checkedIn && (
          <Button variant="danger" icon={LogOut} loading={busy} onClick={handleCheckOut}>
            {t('Check out')}
          </Button>
        )}
        {canCheckIn && (
          <>
            <Input
              aria-label={t('Check-in Time')}
              placeholder={t('Optional note, e.g. working remotely')}
              value={notes}
              maxLength={140}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
            />
            <Button icon={CheckCircle2} loading={busy} onClick={handleCheckIn}>
              {t('Check in')}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
