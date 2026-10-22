import type { ApiSchema } from './api-schema';

export type UserRole = ApiSchema<'Role'>;
export type EmployeeStatus = ApiSchema<'EmployeeStatus'>;

export type Employee = ApiSchema<'EmployeeResponse'>;

export type EmployeeInput = Pick<Employee, 'name' | 'email' | 'department' | 'designation' | 'role'> &
  Partial<Pick<Employee, 'employeeId' | 'joinDate' | 'avatar' | 'phone' | 'location' | 'bio'>> & {
    password?: string;
  };

export type EmployeeUpdate = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'invited' | 'passwordResetRequestedAt'>>;
