'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  RippleButton as RippleButtonPrimitive,
  RippleButtonRipples,
} from '@/components/animate-ui/primitives/buttons/ripple';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

function buttonClass({ variant = 'primary', size = 'md', fullWidth }: StyleProps, className?: string) {
  return cn('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', fullWidth && 'btn-block', className);
}

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

export interface ButtonProps extends NativeButtonProps, StyleProps {
  loading?: boolean;
  ripple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon: Icon, fullWidth, loading, className, children, disabled, type = 'button', ripple = true, ...rest },
  ref
) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <RippleButtonPrimitive
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      hoverScale={1.01}
      tapScale={0.98}
      {...rest}
    >
      {loading ? <Loader2 size={iconSize} className="spin" /> : Icon ? <Icon size={iconSize} /> : null}
      {children}
      {ripple && !disabled && !loading && (
        <RippleButtonRipples
          color={
            variant === 'primary' || variant === 'danger' || variant === 'success'
              ? 'rgba(255, 255, 255, 0.35)'
              : 'currentColor'
          }
        />
      )}
    </RippleButtonPrimitive>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, icon: Icon, fullWidth, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth }, className)} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </Link>
  );
}

interface IconButtonProps extends NativeButtonProps {
  icon: LucideIcon;
  label: string;
  size?: number;
  active?: boolean;
  ripple?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 18, active, className, type = 'button', ripple = true, disabled, ...rest },
  ref
) {
  return (
    <RippleButtonPrimitive
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn('icon-btn', active && 'icon-btn-active', className)}
      hoverScale={1.04}
      tapScale={0.95}
      disabled={disabled}
      {...rest}
    >
      <Icon size={size} />
      {ripple && !disabled && <RippleButtonRipples color="currentColor" />}
    </RippleButtonPrimitive>
  );
});

export { RippleButtonPrimitive, RippleButtonRipples };
export { RippleButton } from '@/components/animate-ui/components/buttons/ripple';
