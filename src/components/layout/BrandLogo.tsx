'use client';

import { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './BrandLogo.module.css';

const HEIGHTS = { sm: 26, md: 34, lg: 44 };

export function BrandMark({ size = 34 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="AyiPM" className={styles.mark}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--brand-tile-from)' }} />
          <stop offset="1" style={{ stopColor: 'var(--brand-tile-to)' }} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <path d="M13.5 35 24 12.5 34.5 35" fill="none" style={{ stroke: 'var(--brand-mark-fg)' }} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="30" r="3" style={{ fill: 'var(--brand-mark-fg)' }} />
    </svg>
  );
}

interface BrandLogoProps {
  size?: keyof typeof HEIGHTS;
  showWordmark?: boolean;
  inverted?: boolean;
}

export function BrandLogo({ size = 'md', showWordmark = true, inverted }: BrandLogoProps) {
  return (
    <div className={inverted ? `${styles.brand} ${styles.inverted}` : styles.brand} data-size={size}>
      <BrandMark size={HEIGHTS[size]} />
      <AnimatePresence initial={false}>
        {showWordmark && (
          <motion.span
            className={styles.name}
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 10 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{
              width: { duration: 0.25, ease: [0.2, 0, 0, 1] },
              marginLeft: { duration: 0.25, ease: [0.2, 0, 0, 1] },
              opacity: { duration: 0.18, ease: 'easeInOut' },
            }}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            Ayi<span className={styles.accent}>PM</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
