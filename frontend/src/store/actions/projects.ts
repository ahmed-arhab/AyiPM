import { createId, nowIso } from '@/lib/id';
import { PROJECT_STATUS } from '@/constants/status';
import type { ActionResult, Project, ProjectInput, ProjectStatus, ProjectUpdate } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { logActivity } from './activity';
import { notify } from './notifications';

function validateProject(input: ProjectUpdate): string | undefined {
  if (input.name !== undefined && !input.name.trim()) return 'Project name is required.';
  if (input.startDate && input.endDate && input.endDate < input.startDate) return 'Deadline must be on or after the start date.';
  return undefined;
}

export function createProject(input: ProjectInput): ActionResult<Project> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const error = validateProject(input);
  if (error) return fail(error);

  const timestamp = nowIso();
  const project: Project = {
    ...input,
    id: createId('prj'),
    name: input.name.trim(),
    client: input.client.trim(),
    description: input.description.trim(),
    members: Array.from(new Set(input.members)),
    createdBy: auth.data.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  setState((s) => ({ projects: [project, ...s.projects] }));
  logActivity({
    actor: auth.data,
    action: 'Created Project',
    entityType: 'project',
    entityId: project.id,
    entityName: project.name,
    details: project.client ? `Client: ${project.client}` : undefined,
  });
  notify(
    project.members.filter((id) => id !== auth.data.id),
    {
      title: 'Added to project',
      message: `You were added to ${project.name}.`,
      category: 'project',
      priority: 'normal',
      link: `/projects/${project.id}`,
      senderId: auth.data.id,
    }
  );
  return ok(project);
}

export function updateProject(id: string, update: ProjectUpdate): ActionResult<Project> {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const current = getState().projects.find((p) => p.id === id);
  if (!current) return fail('Project not found.');
  const error = validateProject({ ...current, ...update });
  if (error) return fail(error);

  const updated: Project = {
    ...current,
    ...update,
    members: update.members ? Array.from(new Set(update.members)) : current.members,
    updatedAt: nowIso(),
  };
  setState((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }));

  const newMembers = updated.members.filter((m) => !current.members.includes(m) && m !== auth.data.id);
  logActivity({
    actor: auth.data,
    action: update.status && update.status !== current.status ? 'Updated Project Status' : 'Updated Project',
    entityType: 'project',
    entityId: id,
    entityName: updated.name,
    details: update.status && update.status !== current.status ? `Status set to ${PROJECT_STATUS[update.status].label}` : undefined,
  });
  notify(newMembers, {
    title: 'Added to project',
    message: `You were added to ${updated.name}.`,
    category: 'project',
    priority: 'normal',
    link: `/projects/${id}`,
    senderId: auth.data.id,
  });
  return ok(updated);
}

export function updateProjectStatus(id: string, status: ProjectStatus): ActionResult<Project> {
  return updateProject(id, { status });
}

export function deleteProject(id: string): ActionResult {
  const auth = authorize('projects.manage');
  if (!auth.ok) return auth;
  const project = getState().projects.find((p) => p.id === id);
  if (!project) return fail('Project not found.');

  setState((s) => ({
    projects: s.projects.filter((p) => p.id !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
  }));
  logActivity({ actor: auth.data, action: 'Deleted Project', entityType: 'project', entityId: id, entityName: project.name });
  return ok();
}
