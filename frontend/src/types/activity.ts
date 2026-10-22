import type { ApiSchema, Narrowed } from './api-schema';
import type { UserRole } from './employee';

// The backend sends the entity type as a string; its database only allows these values.
export type ActivityEntityType = 'employee' | 'project' | 'task' | 'attendance' | 'leave' | 'auth' | 'settings';

/** `actorRole` is the actor's role when they acted, stored as a string. */
export type ActivityLogItem = Narrowed<ApiSchema<'ActivityResponse'>, { actorRole: UserRole; entityType: ActivityEntityType }>;
