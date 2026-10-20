'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface SegmentedControlProps<V extends string> {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<V>) {
  const controlId = React.useId();

  return (
    <div
      className={cn(styles.group, size === 'sm' && styles.sm, className)}
      role="tablist"
      aria-label={label}
    >
      {options.map(({ value: v, label: text, count, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(styles.option, active && styles.active)}
            onClick={() => onChange(v)}
          >
            {active && (
              <motion.span
                layoutId={`segmented-active-${controlId}`}
                className={styles.indicator}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
            <span className={styles.content}>
              {Icon && <Icon size={14} className={styles.icon} />}
              <span>{text}</span>
              {count !== undefined && <span className={styles.count}>{count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
