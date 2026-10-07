'use client';

import { useEffect } from 'react';

/**
 * Attaches smooth ripple animations to all interactive buttons across the platform.
 * Works seamlessly alongside components using animate-ui's RippleButtonPrimitive.
 */
export function GlobalRipple() {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      // Only respond to primary click (left mouse button / single tap touch)
      if (event.button !== 0 && event.pointerType === 'mouse') return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const button = target.closest<HTMLElement>(
        'button, .btn, .icon-btn, [role="button"]'
      );
      if (!button) return;

      // Skip disabled buttons or buttons already handled by animate-ui's RippleButtonPrimitive
      if (
        button.hasAttribute('disabled') ||
        button.getAttribute('aria-disabled') === 'true' ||
        button.getAttribute('data-slot') === 'ripple-button'
      ) {
        return;
      }

      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const diameter = Math.max(rect.width, rect.height) * 2.2;
      const radius = diameter / 2;
      const x = event.clientX - rect.left - radius;
      const y = event.clientY - rect.top - radius;

      const ripple = document.createElement('span');
      ripple.className = 'ui-ripple-wave';
      ripple.style.width = `${diameter}px`;
      ripple.style.height = `${diameter}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.appendChild(ripple);

      const cleanup = () => {
        ripple.remove();
      };

      ripple.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 650);
    };

    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return null;
}
