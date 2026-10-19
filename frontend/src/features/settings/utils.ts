import type { FieldErrors } from '@/lib/validation';
import type { WorkspaceSettings } from '@/types';

export interface WorkspaceFormValues {
  companyName: string;
  timezone: string;
  workDayStart: string;
  gracePeriodMinutes: string;
  halfDayThresholdHours: string;
  annual: string;
  sick: string;
  casual: string;
  employeeIdPrefix: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PREFIX_PATTERN = /^[A-Za-z]{1,5}$/;

export function toWorkspaceFormValues(workspace: WorkspaceSettings): WorkspaceFormValues {
  return {
    companyName: workspace.companyName,
    timezone: workspace.timezone,
    workDayStart: workspace.workDayStart,
    gracePeriodMinutes: String(workspace.gracePeriodMinutes),
    halfDayThresholdHours: String(workspace.halfDayThresholdHours),
    annual: String(workspace.leaveAllowance.annual),
    sick: String(workspace.leaveAllowance.sick),
    casual: String(workspace.leaveAllowance.casual),
    employeeIdPrefix: workspace.employeeIdPrefix,
  };
}

function integerError(value: string, min: number, max: number, label: string): string | undefined {
  const n = Number(value);
  if (value.trim() === '' || !Number.isInteger(n) || n < min || n > max) return `${label} must be a whole number from ${min} to ${max}.`;
  return undefined;
}

export function validateWorkspaceForm(values: WorkspaceFormValues): FieldErrors<WorkspaceFormValues> {
  const errors: FieldErrors<WorkspaceFormValues> = {};
  if (!values.companyName.trim()) errors.companyName = 'Company name is required.';
  else if (values.companyName.trim().length > 80) errors.companyName = 'Keep the company name under 80 characters.';
  if (!values.timezone) errors.timezone = 'Choose a timezone.';
  if (!TIME_PATTERN.test(values.workDayStart)) errors.workDayStart = 'Enter a start time such as 09:00.';
  errors.gracePeriodMinutes = integerError(values.gracePeriodMinutes, 0, 180, 'Grace period');
  const halfDay = Number(values.halfDayThresholdHours);
  if (values.halfDayThresholdHours.trim() === '' || Number.isNaN(halfDay) || halfDay <= 0 || halfDay > 12) {
    errors.halfDayThresholdHours = 'Half-day threshold must be between 0.5 and 12 hours.';
  }
  errors.annual = integerError(values.annual, 0, 365, 'Annual leave');
  errors.sick = integerError(values.sick, 0, 365, 'Sick leave');
  errors.casual = integerError(values.casual, 0, 365, 'Casual leave');
  if (!PREFIX_PATTERN.test(values.employeeIdPrefix.trim())) errors.employeeIdPrefix = 'Use 1–5 letters, e.g. AX.';
  return errors;
}

export function toWorkspaceSettings(values: WorkspaceFormValues): WorkspaceSettings {
  return {
    companyName: values.companyName.trim(),
    timezone: values.timezone,
    workDayStart: values.workDayStart,
    gracePeriodMinutes: Number(values.gracePeriodMinutes),
    halfDayThresholdHours: Number(values.halfDayThresholdHours),
    leaveAllowance: {
      annual: Number(values.annual),
      sick: Number(values.sick),
      casual: Number(values.casual),
    },
    employeeIdPrefix: values.employeeIdPrefix.trim().toUpperCase(),
  };
}

export function isSameWorkspaceForm(a: WorkspaceFormValues, b: WorkspaceFormValues): boolean {
  return (Object.keys(a) as (keyof WorkspaceFormValues)[]).every((key) => a[key] === b[key]);
}
