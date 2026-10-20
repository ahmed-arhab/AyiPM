import { useCallback } from 'react';
import { useEmployeesById, useFormatters } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { toDateKey } from '@/lib/date';
import { pluralize } from '@/lib/format';
import { downloadFile } from '@/lib/csv';
import type { AttendanceRecord } from '@/types';
import { buildAttendanceCsv } from '../utils';

export function useAttendanceExport() {
  const employeesById = useEmployeesById();
  const { date, time } = useFormatters();
  const toast = useToast();

  return useCallback(
    (records: AttendanceRecord[]) => {
      if (records.length === 0) {
        toast.info('There are no records to export for the current filters.');
        return;
      }
      const csv = buildAttendanceCsv(records, employeesById, { date, time: (v) => time(v) });
      downloadFile(`attendance-${toDateKey()}.csv`, csv);
      toast.success(`Exported ${pluralize(records.length, 'record')}.`);
    },
    [employeesById, date, time, toast]
  );
}
