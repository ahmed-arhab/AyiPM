import * as React from 'react';

import {
  Progress as ProgressPrimitive,
  ProgressIndicator as ProgressIndicatorPrimitive,
  type ProgressProps as ProgressPrimitiveProps,
  type ProgressIndicatorProps,
} from '@/components/animate-ui/primitives/radix/progress';
import { cn } from '@/lib/utils';

type ProgressProps = ProgressPrimitiveProps & {
  indicatorClassName?: string;
  indicatorColor?: string;
  indicatorStyle?: React.CSSProperties;
  transition?: ProgressIndicatorProps['transition'];
};

function Progress({ className, indicatorClassName, indicatorColor, indicatorStyle, transition, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle-hover)]', className)}
      {...props}
    >
      <ProgressIndicatorPrimitive
        className={cn('h-full w-full flex-1 rounded-full bg-[var(--primary)]', indicatorClassName)}
        style={{
          ...(indicatorColor ? { backgroundColor: indicatorColor } : {}),
          ...indicatorStyle,
        }}
        transition={transition}
      />
    </ProgressPrimitive>
  );
}

export { Progress, type ProgressProps };
