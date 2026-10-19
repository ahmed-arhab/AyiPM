export type ProjectStatus = 'planning' | 'in_progress' | 'in_review' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  members: string[];
  managerId?: string;
  budget?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectInput = Pick<Project, 'name' | 'client' | 'description' | 'startDate' | 'endDate' | 'status' | 'members'> &
  Partial<Pick<Project, 'managerId' | 'budget'>>;

export type ProjectUpdate = Partial<ProjectInput>;
