import { useCallback, useState } from 'react';
import type { FieldErrors } from '@/lib/validation';
import type { MemberFormValues } from '../utils';

export function useMemberForm(initial: () => MemberFormValues) {
  const [values, setValues] = useState<MemberFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors<MemberFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  return { values, errors, setErrors, setField, formError, setFormError };
}
