import { api } from '@/lib/api';
import type { ActionResult, Project, ProjectInput, ProjectStatus, ProjectUpdate } from '@/types';
import { authorize, ok, setState } from '../appStore';
import { handleUnauthorized, refreshActivity } from './session';

// The backend validates projects, records activity and notifies new members.

function upsertProject(project: Project) {
  setState((s) => ({
    projects: s.projects.some((p) => p.id === project.id)
      ? s.projects.map((p) => (p.id === project.id ? project : p))
      : [project, ...s.projects],
  }));
}

export async function createProject(input: ProjectInput): Promise<ActionResult<Project>> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Project>('POST', '/api/projects', input));
  if (!result.ok) return result;
  upsertProject(result.data);
  void refreshActivity();
  return ok(result.data);
}

export async function updateProject(id: string, update: ProjectUpdate): Promise<ActionResult<Project>> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Project>('PATCH', `/api/projects/${id}`, update));
  if (!result.ok) return result;
  upsertProject(result.data);
  void refreshActivity();
  return ok(result.data);
}

export function updateProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult<Project>> {
  return updateProject(id, { status });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<null>('DELETE', `/api/projects/${id}`));
  if (!result.ok) return result;
  setState((s) => ({
    projects: s.projects.filter((p) => p.id !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
  }));
  void refreshActivity();
  return ok();
}

/** Replaces the projects one person belongs to (the "Assign to projects" dialog on the Team page). */
export async function setEmployeeProjects(employeeId: string, projectIds: string[]): Promise<ActionResult> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<Project[]>('PUT', `/api/employees/${employeeId}/projects`, { projectIds }));
  if (!result.ok) return result;
  setState({ projects: result.data });
  void refreshActivity();
  return ok();
}
