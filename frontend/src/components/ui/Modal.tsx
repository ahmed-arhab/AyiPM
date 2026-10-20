'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './Modal.module.css';

const openModals: string[] = [];
let savedOverflow = '';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, size = 'md', footer, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    openModals.push(titleId);
    if (openModals.length === 1) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === titleId) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const focusable = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])');
    focusable?.focus();
    return () => {
      const index = openModals.lastIndexOf(titleId);
      if (index !== -1) openModals.splice(index, 1);
      if (openModals.length === 0) document.body.style.overflow = savedOverflow;
      window.removeEventListener('keydown', onKey);
      previousFocus?.focus?.();
    };
  }, [isOpen, titleId]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn('modal-content', styles[size])}>
        <header className={styles.header}>
          <div>
            <h2 id={titleId} className="heading-md">
              {title}
            </h2>
            {description && <p className="subtext">{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog" data-modal-close>
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
