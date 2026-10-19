export type UserRole = 'admin' | 'project_manager' | 'employee';
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: UserRole;
  status: EmployeeStatus;
  joinDate: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  invited: boolean;
  passwordResetRequestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeInput = Pick<Employee, 'name' | 'email' | 'department' | 'designation' | 'role'> &
  Partial<Pick<Employee, 'employeeId' | 'joinDate' | 'avatar' | 'phone' | 'location' | 'bio'>>;

export type EmployeeUpdate = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'invited' | 'passwordResetRequestedAt'>>;
