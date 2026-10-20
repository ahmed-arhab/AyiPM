import { useCallback, useState } from 'react';
import { toDateKey } from '@/lib/date';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import { createProject, updateProject } from '@/store';
import type { ActionResult, Project, ProjectInput, ProjectStatus } from '@/types';

export interface ProjectFormValues {
  name: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  managerId: string;
  members: string[];
  budget: string;
}

function initialValues(project?: Project): ProjectFormValues {
  return {
    name: project?.name ?? '',
    client: project?.client ?? '',
    description: project?.description ?? '',
    startDate: project?.startDate ?? toDateKey(),
    endDate: project?.endDate ?? '',
    status: project?.status ?? 'planning',
    managerId: project?.managerId ?? '',
    members: project?.members ?? [],
    budget: project?.budget ?? '',
  };
}

function validate(values: ProjectFormValues): FieldErrors<ProjectFormValues> {
  const errors: FieldErrors<ProjectFormValues> = {};
  if (!values.name.trim()) errors.name = 'Project name is required';
  if (!values.startDate) errors.startDate = 'Start date is required';
  if (!values.endDate) errors.endDate = 'Deadline is required';
  else if (values.startDate && values.endDate < values.startDate) errors.endDate = 'Deadline must be on or after the start date';
  return errors;
}

function toInput(values: ProjectFormValues): ProjectInput {
  return {
    name: values.name.trim(),
    client: values.client.trim(),
    description: values.description.trim(),
    startDate: values.startDate,
    endDate: values.endDate,
    status: values.status,
    members: values.members,
    managerId: values.managerId || undefined,
    budget: values.budget.trim() || undefined,
  };
}

export function useProjectForm(project?: Project) {
  const [values, setValues] = useState(() => initialValues(project));
  const [errors, setErrors] = useState<FieldErrors<ProjectFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  const submit = useCallback((): ActionResult<Project> | null => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return null;
    const input = toInput(values);
    const result = project ? updateProject(project.id, input) : createProject(input);
    setFormError(result.ok ? null : result.error);
    return result;
  }, [values, project]);

  return { values, errors, formError, setField, submit };
}
