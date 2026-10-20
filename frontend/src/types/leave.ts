export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type LeaveRequestInput = Pick<LeaveRequest, 'employeeId' | 'leaveType' | 'startDate' | 'endDate' | 'reason'>;

export interface LeaveAllowance {
  annual: number;
  sick: number;
  casual: number;
}

export interface LeaveBalance {
  annual: { total: number; used: number };
  sick: { total: number; used: number };
  casual: { total: number; used: number };
}
