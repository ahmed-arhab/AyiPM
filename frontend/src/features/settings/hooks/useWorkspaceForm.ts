'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { updateWorkspace, useWorkspace } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import {
  isSameWorkspaceForm,
  toWorkspaceFormValues,
  toWorkspaceSettings,
  validateWorkspaceForm,
  type WorkspaceFormValues,
} from '../utils';

export function useWorkspaceForm() {
  const toast = useToast();
  const workspace = useWorkspace();
  const baseline = useMemo(() => toWorkspaceFormValues(workspace), [workspace]);
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors<WorkspaceFormValues>>({});

  useEffect(() => {
    setValues(baseline);
    setErrors({});
  }, [baseline]);

  const setField = useCallback((field: keyof WorkspaceFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const reset = useCallback(() => {
    setValues(baseline);
    setErrors({});
  }, [baseline]);

  const [saving, setSaving] = useState(false);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const nextErrors = validateWorkspaceForm(values);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) {
        toast.error('Fix the highlighted workspace fields before saving.');
        return;
      }
      setSaving(true);
      const result = await updateWorkspace(toWorkspaceSettings(values));
      setSaving(false);
      if (result.ok) toast.success('Workspace settings saved.');
      else toast.error(result.error);
    },
    [values, toast]
  );

  const dirty = useMemo(() => !isSameWorkspaceForm(values, baseline), [values, baseline]);

  return { values, errors, dirty, saving, setField, reset, submit };
}
