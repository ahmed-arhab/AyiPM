import type { UserRole } from './employee';

export type ActivityEntityType = 'employee' | 'project' | 'task' | 'attendance' | 'leave' | 'auth' | 'settings';

export interface ActivityLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: ActivityEntityType;
  entityId?: string;
  entityName: string;
  details?: string;
  createdAt: string;
}
