'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { changePassword } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import { EMPTY_PASSWORD_FORM, validatePasswordForm, type PasswordFormValues } from '../utils';

export function usePasswordForm() {
  const toast = useToast();
  const [values, setValues] = useState<PasswordFormValues>(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState<FieldErrors<PasswordFormValues>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback((field: keyof PasswordFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const reset = useCallback(() => {
    setValues(EMPTY_PASSWORD_FORM);
    setErrors({});
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const nextErrors = validatePasswordForm(values);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;
      setSubmitting(true);
      const result = await changePassword(values.current, values.next);
      setSubmitting(false);
      if (!result.ok) {
        if (/current password/i.test(result.error)) setErrors({ current: result.error });
        else setErrors({ next: result.error });
        return;
      }
      reset();
      toast.success('Password changed. Use your new password next time you sign in.');
    },
    [values, reset, toast]
  );

  const filled = Boolean(values.current || values.next || values.confirm);

  return { values, errors, submitting, filled, setField, reset, submit };
}
