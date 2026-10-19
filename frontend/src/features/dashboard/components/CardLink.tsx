import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './CardLink.module.css';

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.link}>
      {children}
      <ArrowRight size={14} />
    </Link>
  );
}
