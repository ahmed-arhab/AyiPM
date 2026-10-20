'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { updateEmployee } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import type { Employee } from '@/types';
import {
  isSameProfile,
  mergeUntouched,
  toEmployeeUpdate,
  toProfileFormValues,
  validateProfileField,
  validateProfileForm,
  type ProfileFormValues,
} from '../utils';

export function useProfileForm(user: Employee) {
  const toast = useToast();
  const [baseline, setBaseline] = useState(() => toProfileFormValues(user));
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors<ProfileFormValues>>({});
  const syncedAt = useRef(user.updatedAt);
  const baselineRef = useRef(baseline);

  useEffect(() => {
    if (syncedAt.current === user.updatedAt) return;
    syncedAt.current = user.updatedAt;
    const previous = baselineRef.current;
    const next = toProfileFormValues(user);
    baselineRef.current = next;
    setBaseline(next);
    setValues((current) => mergeUntouched(current, previous, next));
  }, [user]);

  const setField = useCallback((field: keyof ProfileFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: validateProfileField(field, value) } : current));
  }, []);

  const reset = useCallback(() => {
    setValues(baselineRef.current);
    setErrors({});
  }, []);

  const [saving, setSaving] = useState(false);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const nextErrors = validateProfileForm(values);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;
      setSaving(true);
      const result = await updateEmployee(user.id, toEmployeeUpdate(values));
      setSaving(false);
      if (!result.ok) {
        if (/email/i.test(result.error)) setErrors({ email: result.error });
        else toast.error(result.error);
        return;
      }
      setValues(toProfileFormValues(result.data));
      toast.success('Profile updated.');
    },
    [values, user.id, toast]
  );

  const dirty = useMemo(() => !isSameProfile(values, baseline), [values, baseline]);

  return { values, errors, dirty, saving, setField, reset, submit };
}
