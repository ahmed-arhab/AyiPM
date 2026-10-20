'use client';

import { forwardRef, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Avatar, SearchInput } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/roles';
import { matchesQuery } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Employee } from '@/types';
import styles from './MemberPicker.module.css';

interface MemberPickerProps {
  employees: Employee[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export const MemberPicker = forwardRef<HTMLInputElement, MemberPickerProps>(function MemberPicker({ employees, selected, onChange }, ref) {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visible = useMemo(
    () => employees.filter((e) => matchesQuery(query, e.name, e.email, e.designation, e.department)),
    [employees, query]
  );

  const toggle = (id: string) => {
    onChange(selectedSet.has(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className={styles.picker}>
      <div className={styles.top}>
        <SearchInput ref={ref} value={query} onChange={setQuery} placeholder="Search people…" aria-label="Search team members" />
        <span className={styles.count}>{selected.length} selected</span>
      </div>
      {visible.length === 0 ? (
        <p className={styles.empty}>{employees.length === 0 ? 'No active team members yet.' : 'No one matches your search.'}</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((e) => {
            const checked = selectedSet.has(e.id);
            return (
              <li key={e.id}>
                <label className={cn(styles.option, checked && styles.checked)}>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(e.id)} />
                  <span className={styles.box} aria-hidden>
                    {checked && <Check size={12} />}
                  </span>
                  <Avatar name={e.name} src={e.avatar} size={26} />
                  <span className={styles.text}>
                    <span className={styles.name}>{e.name}</span>
                    <span className={styles.meta}>{e.designation || ROLE_LABELS[e.role]}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
