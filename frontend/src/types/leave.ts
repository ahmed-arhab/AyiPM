import type { ApiSchema } from './api-schema';

export type LeaveType = ApiSchema<'LeaveType'>;
export type LeaveStatus = ApiSchema<'LeaveStatus'>;

export type LeaveRequest = ApiSchema<'LeaveResponse'>;

export type LeaveRequestInput = Pick<LeaveRequest, 'employeeId' | 'leaveType' | 'startDate' | 'endDate' | 'reason'>;

export type LeaveAllowance = ApiSchema<'LeaveAllowance'>;

export type LeaveBalance = ApiSchema<'Balance'>;
