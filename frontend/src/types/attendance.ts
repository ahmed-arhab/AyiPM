export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInAt?: string;
  checkOutAt?: string;
  workingHours?: number;
  status: AttendanceStatus;
  notes?: string;
}
