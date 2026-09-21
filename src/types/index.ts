export type UserRole = 'admin' | 'project_manager' | 'employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: UserRole;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
  phone: string;
  location: string;
}

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM
  checkOut?: string; // HH:MM
  workingHours?: number; // decimal hours
  status: AttendanceStatus;
  notes?: string;
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  rejectionReason?: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  employeeId: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  casualTotal: number;
  casualUsed: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'in_review' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number; // 0 to 100
  members: string[]; // employee ids
  budget?: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';

export interface TaskComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

export interface TaskHistory {
  id: string;
  action: string;
  author: string;
  timestamp: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  comments: TaskComment[];
  history: TaskHistory[];
}

export interface ActivityLogItem {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'employee' | 'project' | 'task' | 'attendance' | 'leave';
  entityName: string;
  timestamp: string;
  details?: string;
}
