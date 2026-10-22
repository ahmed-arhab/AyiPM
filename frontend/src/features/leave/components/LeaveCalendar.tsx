'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useCurrentUser, useEmployeesById, useLeaveRequests, usePermission, usePreferences } from '@/store';
import { Button, Card, CardHeader, EmptyState, IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { parseDateKey, toDateKey } from '@/lib/date';
import { useT } from '@/translations';
import type { LeaveRequest } from '@/types';
import { leaveByDay, monthGridKeys, monthKeyPrefix, monthOf, shiftMonth, type CalendarMonth } from '../calendar';
import { LEAVE_TYPE_LABELS } from '../utils';
import { LeaveDetailsModal } from './LeaveDetailsModal';
import styles from './LeaveCalendar.module.css';

// A busy day shows this many rows; past it, the last row becomes "+N more".
const MAX_ROWS = 3;
const NO_LEAVE: LeaveRequest[] = [];

interface DayCell {
  key: string;
  inMonth: boolean;
  isToday: boolean;
  dayNumber: string;
  shortLabel: string;
  longLabel: string;
  entries: LeaveRequest[];
}

interface Selection {
  dateKey: string;
  requestId?: string;
}

export function LeaveCalendar() {
  const { t, formatDate } = useT();
  const user = useCurrentUser();
  // Reviewers get everyone's requests from the API; everyone else only gets their own.
  const canReview = usePermission('leave.review');
  const { weekStart } = usePreferences();
  const requests = useLeaveRequests();
  const employeesById = useEmployeesById();
  const [month, setMonth] = useState<CalendarMonth>(() => monthOf());
  const [selection, setSelection] = useState<Selection | null>(null);

  const nameOf = useCallback((id: string) => employeesById.get(id)?.name ?? t('Former member'), [employeesById, t]);
  const visible = useMemo(() => (canReview ? requests : requests.filter((r) => r.employeeId === user.id)), [requests, canReview, user.id]);
  const keys = useMemo(() => monthGridKeys(month, weekStart), [month, weekStart]);
  const byDay = useMemo(() => leaveByDay(visible, keys[0], keys[keys.length - 1], nameOf), [visible, keys, nameOf]);
  const todayKey = toDateKey();

  const cells = useMemo<DayCell[]>(() => {
    const prefix = monthKeyPrefix(month);
    return keys.map((key) => {
      const d = parseDateKey(key);
      return {
        key,
        inMonth: key.startsWith(prefix),
        isToday: key === todayKey,
        dayNumber: formatDate(d, { day: 'numeric' }),
        shortLabel: formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' }),
        longLabel: formatDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        entries: byDay.get(key) ?? NO_LEAVE,
      };
    });
  }, [keys, month, todayKey, byDay, formatDate]);

  const monthTitle = formatDate(new Date(month.year, month.month, 1), { month: 'long', year: 'numeric' });
  const weekdays = useMemo(() => keys.slice(0, 7).map((key) => formatDate(parseDateKey(key), { weekday: 'short' })), [keys, formatDate]);
  const monthHasLeave = cells.some((c) => c.inMonth && c.entries.length > 0);

  const typeOf = (r: LeaveRequest) => t(LEAVE_TYPE_LABELS[r.leaveType]);
  const statusOf = (r: LeaveRequest) => t(r.status === 'approved' ? 'Approved' : 'Pending');
  const peopleCount = (count: number) => t(count === 1 ? '{count} person on leave' : '{count} people on leave', { count });
  const daySummary = (cell: DayCell) =>
    canReview ? peopleCount(cell.entries.length) : cell.entries.map((r) => `${typeOf(r)}, ${statusOf(r)}`).join('; ');
  const dayName = (cell: DayCell) => (cell.isToday ? `${t('Today')}, ${cell.longLabel}` : cell.longLabel);

  const selectedCell = selection ? cells.find((c) => c.key === selection.dateKey) : undefined;
  const selectedRequests = selectedCell
    ? selection?.requestId
      ? selectedCell.entries.filter((r) => r.id === selection.requestId)
      : selectedCell.entries
    : NO_LEAVE;

  return (
    <Card className={styles.panel}>
      <CardHeader
        icon={CalendarDays}
        title={t(canReview ? 'Team leave calendar' : 'My leave calendar')}
        description={t(
          canReview
            ? 'Approved and pending leave for everyone in the workspace. Rejected requests are not shown.'
            : 'Your approved and pending leave. Only leave reviewers can see the whole team.'
        )}
      />

      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <Button variant="outline" size="sm" onClick={() => setMonth(monthOf())}>
            {t('Today')}
          </Button>
          <IconButton icon={ChevronLeft} label={t('Previous month')} onClick={() => setMonth((m) => shiftMonth(m, -1))} />
          <IconButton icon={ChevronRight} label={t('Next month')} onClick={() => setMonth((m) => shiftMonth(m, 1))} />
          <h3 className={styles.monthTitle} aria-live="polite">
            {monthTitle}
          </h3>
        </div>
        <ul className={styles.legend}>
          <li>
            <span className={cn(styles.swatch, styles.approved)} aria-hidden="true" />
            {t('Approved')}
          </li>
          <li>
            <span className={cn(styles.swatch, styles.pending)} aria-hidden="true">
              <Clock size={10} />
            </span>
            {t('Pending')}
          </li>
        </ul>
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekdays} aria-hidden="true">
          {weekdays.map((name, i) => (
            <span key={i}>{name}</span>
          ))}
        </div>
        <ol className={styles.grid} aria-label={monthTitle}>
          {cells.map((cell) => {
            const overflowing = cell.entries.length > MAX_ROWS;
            const hidden = overflowing ? cell.entries.length - (MAX_ROWS - 1) : 0;
            const moreLabel = t('+{count} more', { count: hidden });
            return (
              <li
                key={cell.key}
                className={cn(
                  styles.day,
                  !cell.inMonth && styles.outside,
                  cell.entries.length === 0 && styles.free,
                  cell.isToday && styles.today
                )}
                aria-current={cell.isToday ? 'date' : undefined}
              >
                {cell.entries.length > 0 ? (
                  <button
                    type="button"
                    className={styles.dayButton}
                    aria-label={`${dayName(cell)}: ${daySummary(cell)}`}
                    onClick={() => setSelection({ dateKey: cell.key })}
                  />
                ) : (
                  <span className="sr-only">{dayName(cell)}</span>
                )}
                <span className={styles.dayHead} aria-hidden="true">
                  <span className={styles.dayNumber}>{cell.dayNumber}</span>
                  <span className={styles.dayLabel}>{cell.shortLabel}</span>
                  {cell.isToday && <span className={styles.todayTag}>{t('Today')}</span>}
                </span>
                {cell.entries.length > 0 && (
                  <ul className={styles.chips}>
                    {cell.entries.map((r, i) => {
                      const name = nameOf(r.employeeId);
                      const details = canReview ? [name, typeOf(r), statusOf(r)] : [typeOf(r), statusOf(r)];
                      return (
                        <li key={r.id} className={cn(overflowing && i >= MAX_ROWS - 1 && styles.extra)}>
                          <button
                            type="button"
                            className={cn(styles.chip, r.status === 'approved' ? styles.approved : styles.pending)}
                            title={details.join(' · ')}
                            aria-label={`${details.join(', ')}, ${cell.longLabel}`}
                            onClick={() => setSelection({ dateKey: cell.key, requestId: r.id })}
                          >
                            {r.status === 'pending' && <Clock size={11} className={styles.chipIcon} aria-hidden="true" />}
                            <span className={styles.chipName}>{canReview ? name : typeOf(r)}</span>
                            <span className={styles.chipMeta}>{details.slice(1).join(' · ')}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {overflowing && (
                  <button
                    type="button"
                    className={styles.more}
                    aria-label={`${moreLabel}, ${cell.longLabel}`}
                    onClick={() => setSelection({ dateKey: cell.key })}
                  >
                    {moreLabel}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {!monthHasLeave && (
        <div className={styles.mobileEmpty}>
          <EmptyState compact icon={CalendarDays} title="No leave this month" description="Approved and pending leave for this month will be listed here." />
        </div>
      )}

      {selectedCell && selectedRequests.length > 0 && (
        <LeaveDetailsModal
          title={selection?.requestId ? t('Leave details') : selectedCell.longLabel}
          description={!selection?.requestId && canReview ? peopleCount(selectedCell.entries.length) : undefined}
          requests={selectedRequests}
          showPeople={canReview}
          onClose={() => setSelection(null)}
        />
      )}
    </Card>
  );
}
