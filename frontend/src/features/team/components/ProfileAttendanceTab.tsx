import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { fetchAttendanceHistory, selectWorkspaceToday, useAppStore, useAttendance, useFormatters } from '@/store';
import { DataTable, EmptyState, StatusBadge, type Column } from '@/components/ui';
import { endOfMonthKey, formatHours, startOfMonthKey } from '@/lib/date';
import type { AttendanceRecord } from '@/types';

const RECENT_LIMIT = 10;
// The store only holds recent months, so the profile reads this person's records a little further back.
const HISTORY_MONTHS = 3;

export function ProfileAttendanceTab({ memberId }: { memberId: string }) {
  const attendance = useAttendance();
  const today = useAppStore(selectWorkspaceToday);
  const { date, time } = useFormatters();
  const [history, setHistory] = useState<AttendanceRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    fetchAttendanceHistory(memberId, startOfMonthKey(today, -HISTORY_MONTHS), endOfMonthKey(today)).then((result) => {
      if (!cancelled && result.ok) setHistory(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId, today]);

  // What's already loaded shows until the history arrives.
  const recent = useMemo(
    () =>
      (history ?? attendance)
        .filter((r) => r.employeeId === memberId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, RECENT_LIMIT),
    [history, attendance, memberId]
  );

  const columns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      { key: 'date', header: 'Date', render: (r) => date(r.date) },
      { key: 'in', header: 'In', render: (r) => time(r.checkInAt) },
      { key: 'out', header: 'Out', render: (r) => time(r.checkOutAt) },
      { key: 'hours', header: 'Hours', render: (r) => formatHours(r.workingHours) },
      { key: 'status', header: 'Status', render: (r) => <StatusBadge kind="attendance" value={r.status} /> },
    ],
    [date, time]
  );

  return (
    <DataTable
      caption="Recent attendance"
      columns={columns}
      rows={recent}
      rowKey={(r) => r.id}
      minWidth={520}
      empty={<EmptyState compact icon={CalendarCheck} title="No attendance yet" description="Check-ins from the attendance page will appear here." />}
    />
  );
}
