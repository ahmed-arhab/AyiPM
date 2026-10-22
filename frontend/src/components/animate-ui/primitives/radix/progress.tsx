'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { motion } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';

type ProgressContextType = {
  value: number;
};

const [ProgressProvider, useProgress] = getStrictContext<ProgressContextType>('ProgressContext');

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root>;

function Progress(props: ProgressProps) {
  return (
    <ProgressProvider value={{ value: props.value ?? 0 }}>
      <ProgressPrimitive.Root data-slot="progress" {...props} />
    </ProgressProvider>
  );
}

const MotionProgressIndicator = motion.create(ProgressPrimitive.Indicator);

type ProgressIndicatorProps = React.ComponentProps<typeof MotionProgressIndicator>;

function ProgressIndicator({
  transition = { type: 'spring', stiffness: 90, damping: 22, mass: 0.8 },
  initial = { x: '-100%' },
  ...props
}: ProgressIndicatorProps) {
  const { value } = useProgress();
  const clamped = Math.max(0, Math.min(100, value || 0));

  return (
    <MotionProgressIndicator
      data-slot="progress-indicator"
      initial={initial}
      animate={{ x: `-${100 - clamped}%` }}
      transition={transition}
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, useProgress, type ProgressProps, type ProgressIndicatorProps, type ProgressContextType };
