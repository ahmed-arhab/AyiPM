import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { createTask, updateTask } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { toDateKey } from '@/lib/date';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import type { Task } from '@/types';
import { diffTaskUpdate, initialFormValues, toTaskInput, validateTaskForm, type TaskFormValues } from '../utils';

type Field = keyof TaskFormValues;

interface Options {
  task?: Task;
  defaultProjectId: string;
  onSaved: (task: Task) => void;
}

export function useTaskForm({ task, defaultProjectId, onSaved }: Options) {
  const toast = useToast();
  const [values, setValues] = useState<TaskFormValues>(() => initialFormValues(task, defaultProjectId));
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isNew = !task;

  const allErrors = useMemo(() => validateTaskForm(values, isNew, toDateKey()), [values, isNew]);
  const errors = useMemo(() => {
    const visible: FieldErrors<TaskFormValues> = {};
    (Object.keys(allErrors) as Field[]).forEach((key) => {
      if (touched[key]) visible[key] = allErrors[key];
    });
    return visible;
  }, [allErrors, touched]);

  const isDirty = useMemo(() => (task ? Object.keys(diffTaskUpdate(task, values)).length > 0 : true), [task, values]);
  const canSubmit = !hasErrors(allErrors) && isDirty && !saving;

  const setField = useCallback(<K extends Field>(key: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerError(null);
  }, []);

  const touch = useCallback((key: Field) => setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true })), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ title: true, projectId: true, dueDate: true });
    if (!canSubmit) return;
    setSaving(true);
    const result = task ? updateTask(task.id, diffTaskUpdate(task, values)) : createTask(toTaskInput(values));
    setSaving(false);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast.success(task ? 'Task updated.' : `Task "${result.data.title}" created.`);
    onSaved(result.data);
  };

  return { values, errors, serverError, saving, canSubmit, isNew, setField, touch, submit };
}
