'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';

type CollapsibleContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const [CollapsibleProvider, useCollapsible] =
  getStrictContext<CollapsibleContextType>('CollapsibleContext');

type CollapsibleProps = React.ComponentProps<typeof CollapsiblePrimitive.Root>;

function Collapsible(props: CollapsibleProps) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });

  return (
    <CollapsibleProvider value={{ isOpen, setIsOpen }}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        {...props}
        onOpenChange={setIsOpen}
      />
    </CollapsibleProvider>
  );
}

type CollapsibleTriggerProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Trigger
>;

function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

type CollapsibleContentProps = Omit<
  React.ComponentProps<typeof CollapsiblePrimitive.Content>,
  'asChild' | 'forceMount'
> &
  HTMLMotionProps<'div'> & {
    keepRendered?: boolean;
  };

function CollapsibleContent({
  keepRendered = false,
  transition,
  initial,
  animate,
  exit,
  layout = false,
  ...props
}: CollapsibleContentProps) {
  const { isOpen } = useCollapsible();

  const defaultInitial = initial ?? { opacity: 0, height: 0 };
  const defaultAnimate = animate ?? (isOpen
    ? { opacity: 1, height: 'auto' }
    : { opacity: 0, height: 0 });
  const defaultExit = exit ?? { opacity: 0, height: 0 };

  const defaultTransition = transition ?? {
    height: { duration: 0.26, ease: [0.2, 0, 0, 1] },
    opacity: { duration: isOpen ? 0.22 : 0.15, ease: 'easeInOut' },
  };

  return (
    <AnimatePresence initial={false}>
      {keepRendered ? (
        <CollapsiblePrimitive.Content forceMount asChild>
          <motion.div
            key={props.key ?? 'collapsible-content'}
            data-slot="collapsible-content"
            layout={layout}
            initial={defaultInitial}
            animate={defaultAnimate}
            transition={defaultTransition}
            style={{ overflow: 'hidden', ...props.style }}
            {...props}
          />
        </CollapsiblePrimitive.Content>
      ) : (
        isOpen && (
          <CollapsiblePrimitive.Content forceMount asChild>
            <motion.div
              key={props.key ?? 'collapsible-content'}
              data-slot="collapsible-content"
              layout={layout}
              initial={defaultInitial}
              animate={defaultAnimate}
              exit={defaultExit}
              transition={defaultTransition}
              style={{ overflow: 'hidden', ...props.style }}
              {...props}
            />
          </CollapsiblePrimitive.Content>
        )
      )}
    </AnimatePresence>
  );
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsible,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
  type CollapsibleContextType,
};
