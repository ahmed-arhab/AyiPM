import type { ApiSchema } from './api-schema';

export type ProjectStatus = ApiSchema<'ProjectStatus'>;

export type Project = ApiSchema<'ProjectResponse'>;

export type ProjectInput = Pick<Project, 'name' | 'client' | 'description' | 'startDate' | 'endDate' | 'status' | 'members'> &
  Partial<Pick<Project, 'managerId' | 'budget'>>;

export type ProjectUpdate = Partial<ProjectInput>;
