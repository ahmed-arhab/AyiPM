import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './AuthSubmitButton.module.css';

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel: ReactNode;
  children: ReactNode;
  animateArrow?: boolean;
}

export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
  animateArrow = false,
}: AuthSubmitButtonProps) {
  return (
    <Button type="submit" fullWidth loading={loading} className={styles.submit}>
      {loading ? loadingLabel : children}
      {!loading && (
        <ArrowRight
          size={16}
          className={cn(styles.arrow, animateArrow && styles.arrowAnimated)}
        />
      )}
    </Button>
  );
}

