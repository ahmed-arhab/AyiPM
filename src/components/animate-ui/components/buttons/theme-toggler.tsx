'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { VariantProps } from 'class-variance-authority';

import {
  ThemeToggler as ThemeTogglerPrimitive,
  type ThemeTogglerProps as ThemeTogglerPrimitiveProps,
  type ThemeSelection,
  type Resolved,
} from '@/components/animate-ui/primitives/effects/theme-toggler';
import { buttonVariants } from '@/components/animate-ui/components/buttons/icon';
import { cn } from '@/lib/utils';
import { setTheme as setStoreTheme, useTheme as useStoreTheme } from '@/store';
import { resolveTheme } from '@/lib/theme';
import type { ThemeMode } from '@/types';

const getIcon = (
  effective: ThemeSelection,
  resolved: Resolved,
  modes: ThemeSelection[],
) => {
  const theme = modes.includes('system') ? effective : resolved;
  return theme === 'system' ? (
    <Monitor className="size-4" />
  ) : theme === 'dark' ? (
    <Moon className="size-4" />
  ) : (
    <Sun className="size-4" />
  );
};

const getNextTheme = (
  effective: ThemeSelection,
  modes: ThemeSelection[],
): ThemeSelection => {
  const i = modes.indexOf(effective);
  if (i === -1) return modes[0];
  return modes[(i + 1) % modes.length];
};

type ThemeTogglerButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    modes?: ThemeSelection[];
    onImmediateChange?: ThemeTogglerPrimitiveProps['onImmediateChange'];
    direction?: ThemeTogglerPrimitiveProps['direction'];
  };

function ThemeTogglerButton({
  variant = 'default',
  size = 'default',
  modes = ['light', 'dark'],
  direction = 'ltr',
  onImmediateChange,
  onClick,
  className,
  ...props
}: ThemeTogglerButtonProps) {
  const storeTheme = useStoreTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme: ThemeSelection =
    storeTheme === 'device' ? 'system' : (storeTheme as ThemeSelection) || 'light';
  const resolvedTheme: Resolved = resolveTheme(storeTheme || 'light');

  const handleSetTheme = React.useCallback((nextTheme: ThemeSelection) => {
    const appTheme: ThemeMode = nextTheme === 'system' ? 'device' : nextTheme;
    setStoreTheme(appTheme);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        data-slot="theme-toggler-button"
        className={cn(buttonVariants({ variant, size, className }), 'rounded-full cursor-pointer')}
        disabled
        aria-hidden="true"
        {...props}
      >
        <span className="size-4" />
      </button>
    );
  }

  return (
    <ThemeTogglerPrimitive
      theme={effectiveTheme}
      resolvedTheme={resolvedTheme}
      setTheme={handleSetTheme}
      direction={direction}
      onImmediateChange={onImmediateChange}
    >
      {({ effective, resolved, toggleTheme }) => (
        <button
          type="button"
          data-slot="theme-toggler-button"
          className={cn(buttonVariants({ variant, size, className }), 'rounded-full cursor-pointer')}
          onClick={(e) => {
            onClick?.(e);
            toggleTheme(getNextTheme(effective, modes));
          }}
          aria-label={`Switch theme (current: ${resolved})`}
          {...props}
        >
          {getIcon(effective, resolved, modes)}
        </button>
      )}
    </ThemeTogglerPrimitive>
  );
}

export { ThemeTogglerButton, type ThemeTogglerButtonProps };
