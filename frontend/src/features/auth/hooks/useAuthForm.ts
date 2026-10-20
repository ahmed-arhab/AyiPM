import { useCallback, useState } from 'react';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import type { ActionResult } from '@/types';

interface SubmitOptions {
  keepLoadingOnSuccess?: boolean;
}

export function useAuthForm<T extends object>(initial: T, validate: (values: T) => FieldErrors<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setFormError(null);
  }, []);

  const checkValid = useCallback(() => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    return !hasErrors(nextErrors);
  }, [validate, values]);

  const submit = useCallback(
    async <R,>(action: (values: T) => Promise<ActionResult<R>> | ActionResult<R>, options: SubmitOptions = {}) => {
      const nextErrors = validate(values);
      setErrors(nextErrors);
      setFormError(null);
      if (hasErrors(nextErrors)) return undefined;

      setSubmitting(true);
      let result: ActionResult<R>;
      try {
        result = await action(values);
      } catch {
        result = { ok: false, error: 'Something went wrong. Please try again.' };
      }
      if (!result.ok) setFormError(result.error);
      if (!result.ok || !options.keepLoadingOnSuccess) setSubmitting(false);
      return result;
    },
    [validate, values]
  );

  return { values, errors, formError, submitting, setField, submit, checkValid };
}
