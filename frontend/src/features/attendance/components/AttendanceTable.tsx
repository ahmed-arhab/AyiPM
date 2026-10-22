import { useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useEmployeesById, useFormatters } from '@/store';
import { Avatar, DataTable, EmptyState, Pagination, StatusBadge, type Column } from '@/components/ui';
import { useT } from '@/translations';
import { usePagination } from '@/hooks/usePagination';
import { formatHours } from '@/lib/date';
import type { AttendanceRecord } from '@/types';
import styles from './AttendanceTable.module.css';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showEmployee: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

const PAGE_SIZE = 15;

export function AttendanceTable({ records, showEmployee, emptyTitle, emptyDescription }: AttendanceTableProps) {
  const { t } = useT();
  const employeesById = useEmployeesById();
  const { date, time } = useFormatters();
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(records, PAGE_SIZE);

  const columns = useMemo<Column<AttendanceRecord>[]>(() => {
    const list: Column<AttendanceRecord>[] = [
      { key: 'date', header: t('Date'), render: (r) => <span className={styles.strong}>{date(r.date)}</span> },
    ];
    if (showEmployee) {
      list.push({
        key: 'employee',
        header: t('Employee'),
        render: (r) => {
          const e = employeesById.get(r.employeeId);
          return (
            <span className={styles.person}>
              <Avatar name={e?.name ?? '?'} src={e?.avatar} size={28} />
              <span>{e?.name ?? t('Former member')}</span>
            </span>
          );
        },
      });
    }
    list.push(
      { key: 'in', header: t('Check in'), render: (r) => <span className={styles.mono}>{time(r.checkInAt)}</span> },
      { key: 'out', header: t('Check out'), render: (r) => <span className={styles.mono}>{time(r.checkOutAt)}</span> },
      { key: 'hours', header: t('Hours'), render: (r) => <span className={styles.strong}>{formatHours(r.workingHours)}</span> },
      { key: 'status', header: t('Status'), render: (r) => <StatusBadge kind="attendance" value={r.status} /> },
      { key: 'notes', header: t('Notes'), render: (r) => <span className={styles.notes}>{r.notes || '—'}</span> }
    );
    return list;
  }, [showEmployee, employeesById, date, time, t]);

  return (
    <div className={styles.wrap}>
      <DataTable
        caption={t('Attendance records')}
        columns={columns}
        rows={pageItems}
        rowKey={(r) => r.id}
        minWidth={showEmployee ? 880 : 720}
        empty={
          <div className="card">
            <EmptyState icon={CalendarCheck} title={emptyTitle} description={emptyDescription} />
          </div>
        }
      />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
