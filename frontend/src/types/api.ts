import type { Employee } from './employee';
import type { WorkspaceSettings } from './settings';

export interface BootstrapPayload {
  needsSetup: boolean;
  user: Employee | null;
  expiresAt: string | null;
  workspace: WorkspaceSettings | null;
  employees: Employee[];
}

export interface InviteDetails {
  name: string;
  email: string;
  employeeId: string;
  companyName: string;
  expiresAt: string;
}
