import { isValidEmail, validatePassword, type FieldErrors } from '@/lib/validation';
import type { Employee, EmployeeUpdate } from '@/types';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 256;
export const BIO_MAX_LENGTH = 280;
const NAME_MAX_LENGTH = 80;
const LOCATION_MAX_LENGTH = 80;
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

export interface ProfileFormValues {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
}

export function toProfileFormValues(user: Employee): ProfileFormValues {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    location: user.location ?? '',
    bio: user.bio ?? '',
  };
}

export function validateProfileField(field: keyof ProfileFormValues, value: string): string | undefined {
  const trimmed = value.trim();
  switch (field) {
    case 'name':
      if (!trimmed) return 'Full name is required.';
      if (trimmed.length > NAME_MAX_LENGTH) return `Keep your name under ${NAME_MAX_LENGTH} characters.`;
      return undefined;
    case 'email':
      if (!trimmed) return 'Work email is required.';
      return isValidEmail(trimmed) ? undefined : 'Enter a valid email address.';
    case 'phone':
      return trimmed && !PHONE_PATTERN.test(trimmed) ? 'Enter a valid phone number, e.g. +94 77 123 4567.' : undefined;
    case 'location':
      return trimmed.length > LOCATION_MAX_LENGTH ? `Keep the location under ${LOCATION_MAX_LENGTH} characters.` : undefined;
    case 'bio':
      return value.length > BIO_MAX_LENGTH ? `Bio must be ${BIO_MAX_LENGTH} characters or fewer.` : undefined;
    default:
      return undefined;
  }
}

export function validateProfileForm(values: ProfileFormValues): FieldErrors<ProfileFormValues> {
  const errors: FieldErrors<ProfileFormValues> = {};
  (Object.keys(values) as (keyof ProfileFormValues)[]).forEach((field) => {
    const error = validateProfileField(field, values[field]);
    if (error) errors[field] = error;
  });
  return errors;
}

export function toEmployeeUpdate(values: ProfileFormValues): EmployeeUpdate {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    location: values.location.trim(),
    bio: values.bio.trim(),
  };
}

export function isSameProfile(a: ProfileFormValues, b: ProfileFormValues): boolean {
  return (Object.keys(a) as (keyof ProfileFormValues)[]).every((key) => a[key] === b[key]);
}

export function mergeUntouched(current: ProfileFormValues, previous: ProfileFormValues, next: ProfileFormValues): ProfileFormValues {
  const merged = { ...current };
  (Object.keys(merged) as (keyof ProfileFormValues)[]).forEach((key) => {
    if (current[key] === previous[key]) merged[key] = next[key];
  });
  return merged;
}

export interface PasswordFormValues {
  current: string;
  next: string;
  confirm: string;
}

export const EMPTY_PASSWORD_FORM: PasswordFormValues = { current: '', next: '', confirm: '' };

export function validatePasswordForm(values: PasswordFormValues): FieldErrors<PasswordFormValues> {
  const errors: FieldErrors<PasswordFormValues> = {};
  if (!values.current) errors.current = 'Enter your current password.';
  const nextError = validatePassword(values.next);
  if (nextError) errors.next = `${nextError}.`;
  else if (values.next === values.current) errors.next = 'New password must be different from the current one.';
  if (!values.confirm) errors.confirm = 'Confirm your new password.';
  else if (values.confirm !== values.next) errors.confirm = 'Passwords do not match.';
  return errors;
}

export function validateAvatarFile(file: File): string | undefined {
  if (!file.type.startsWith('image/')) return 'Choose an image file (JPG, PNG, WebP or GIF).';
  if (file.size > AVATAR_MAX_BYTES) return 'Image must be 2 MB or smaller.';
  return undefined;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be read. Try a different file.'));
    image.src = src;
  });
}

export async function resizeImageToDataUrl(file: File, maxDimension = AVATAR_MAX_DIMENSION, quality = 0.85): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this image.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
