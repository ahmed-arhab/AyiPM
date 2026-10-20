import type { Employee } from './employee';
import type { UserPreferences, WorkspaceSettings } from './settings';

export interface BootstrapPayload {
  needsSetup: boolean;
  user: Employee | null;
  expiresAt: string | null;
  workspace: WorkspaceSettings | null;
  employees: Employee[];
  preferences: UserPreferences | null;
}

export interface InviteDetails {
  name: string;
  email: string;
  employeeId: string;
  companyName: string;
  expiresAt: string;
}
