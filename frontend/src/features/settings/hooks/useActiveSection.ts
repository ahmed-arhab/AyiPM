'use client';

import { useEffect, useState } from 'react';

export function useActiveSection(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const key = ids.join('|');

  useEffect(() => {
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        });
        const topmost = Array.from(visible.entries()).sort((a, b) => a[1] - b[1])[0];
        if (topmost) setActive(topmost[0]);
      },
      { rootMargin: '-80px 0px -55% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
