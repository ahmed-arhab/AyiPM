'use client';

import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, FolderKanban, Search, Users, X, type LucideIcon } from 'lucide-react';
import { useAppStore } from '@/store';
import { matchesQuery } from '@/lib/format';
import { ROUTES } from '@/constants/navigation';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useHotkey } from '@/hooks/useHotkey';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/translations';
import styles from './GlobalSearch.module.css';

const LIMIT = 4;

interface ResultGroup {
  label: string;
  icon: LucideIcon;
  items: { id: string; title: string; subtitle: string; href: string }[];
}

export function GlobalSearch() {
  const router = useRouter();
  const t = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const { employees, projects, tasks } = useAppStore(
    (s) => ({ employees: s.employees, projects: s.projects, tasks: s.tasks }),
    (a, b) => a.employees === b.employees && a.projects === b.projects && a.tasks === b.tasks
  );

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, close, open);
  useHotkey(
    'k',
    (event) => {
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    },
    { meta: true }
  );

  const groups = useMemo<ResultGroup[]>(() => {
    if (!deferredQuery) return [];
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return [
      {
        label: t('Tasks'),
        icon: CheckSquare,
        items: tasks
          .filter((task) => matchesQuery(deferredQuery, task.title, projectNames.get(task.projectId)))
          .slice(0, LIMIT)
          .map((task) => ({ id: task.id, title: task.title, subtitle: projectNames.get(task.projectId) ?? '', href: `${ROUTES.tasks}?task=${task.id}` })),
      },
      {
        label: t('Projects'),
        icon: FolderKanban,
        items: projects
          .filter((p) => matchesQuery(deferredQuery, p.name, p.client))
          .slice(0, LIMIT)
          .map((p) => ({ id: p.id, title: p.name, subtitle: p.client, href: ROUTES.project(p.id) })),
      },
      {
        label: t('People'),
        icon: Users,
        items: employees
          .filter((e) => matchesQuery(deferredQuery, e.name, e.designation, e.employeeId, e.email))
          .slice(0, LIMIT)
          .map((e) => ({ id: e.id, title: e.name, subtitle: `${e.designation} · ${e.employeeId}`, href: `${ROUTES.team}?member=${e.id}` })),
      },
    ].filter((g) => g.items.length > 0);
  }, [deferredQuery, employees, projects, tasks, t]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className="search-bar-bended">
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && groups[0]?.items[0]) go(groups[0].items[0].href);
          }}
          placeholder={t('Search tasks, projects, people…')}
          aria-label={t('Global search')}
        />
        {query ? (
          <button type="button" className="search-clear-btn" onClick={() => setQuery('')} aria-label={t('Clear search')}>
            <X size={13} />
          </button>
        ) : (
          <kbd className="kbd-badge">⌘K</kbd>
        )}
      </div>

      {open && deferredQuery && (
        <div className={styles.panel} role="listbox">
          {groups.length === 0 ? (
            <EmptyState compact icon={Search} title={t('No matches')} description={t('Nothing found for “{query}”.', { query: deferredQuery })} />
          ) : (
            groups.map(({ label, icon: Icon, items }) => (
              <div key={label} className={styles.group}>
                <div className={styles.groupLabel}>{label}</div>
                {items.map((item) => (
                  <button key={item.id} type="button" role="option" aria-selected={false} className={styles.item} onClick={() => go(item.href)}>
                    <Icon size={16} className={styles.itemIcon} />
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
