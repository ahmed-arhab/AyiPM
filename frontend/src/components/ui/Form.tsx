'use client';

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './Form.module.css';

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, aside, className, children }: FieldProps) {
  return (
    <div className={cn('form-group', className)}>
      {(label || aside) && (
        <div className={styles.labelRow}>
          {label && (
            <label htmlFor={htmlFor} className="form-label">
              {label}
              {required && <span className={styles.required}> *</span>}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle size={12} />
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon: Icon, invalid, className, ...rest }, ref) {
  const input = (
    <input
      ref={ref}
      className={cn('form-input', Icon && styles.withIcon, invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
  if (!Icon) return input;
  return (
    <div className={styles.inputWrap}>
      <Icon size={16} className={styles.inputIcon} />
      {input}
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(function PasswordInput(
  { className, icon: Icon, invalid, ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.inputWrap}>
      {Icon && <Icon size={16} className={styles.inputIcon} />}
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('form-input', styles.withTrailing, Icon && styles.withIcon, invalid && styles.invalid, className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button
        type="button"
        className={styles.trailingBtn}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
});

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

interface SelectProps<V extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: SelectOption<V>[];
  value: V;
  onChange: (value: V) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function Select<V extends string>({ options, value, onChange, placeholder, invalid, className, ...rest }: SelectProps<V>) {
  return (
    <select
      className={cn('form-select', invalid && styles.invalid, className)}
      value={value}
      onChange={(e) => onChange(e.target.value as V)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn('form-textarea', invalid && styles.invalid, className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  }
);

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn(styles.switchRow, disabled && styles.disabled)}>
      <span className={styles.switchText}>
        <span className={styles.switchLabel}>{label}</span>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
      <span className={styles.switch}>
        <input id={id} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.track} aria-hidden />
      </span>
    </label>
  );
}

export function FormGrid({ columns = 2, children }: { columns?: 1 | 2 | 3; children: ReactNode }) {
  return <div className={cn(styles.grid, styles[`cols${columns}`])}>{children}</div>;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className={styles.banner} role="alert">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}
