'use client';

import { useMemo } from 'react';
import { Layers, RotateCcw } from 'lucide-react';
import { Button, Card, Input, SearchInput, SegmentedControl, Select, type SegmentOption, type SelectOption } from '@/components/ui';
import type { UpdateActivityFilter } from '../hooks/useActivityFilters';
import { ENTITY_META, ENTITY_TYPES, type ActivityFilterState, type EntityFilter } from '../utils';
import styles from './ActivityFilterBar.module.css';

interface ActivityFilterBarProps {
  filters: ActivityFilterState;
  counts: Record<EntityFilter, number>;
  actors: SelectOption[];
  showActorFilter: boolean;
  isFiltered: boolean;
  onChange: UpdateActivityFilter;
  onReset: () => void;
}

export function ActivityFilterBar({ filters, counts, actors, showActorFilter, isFiltered, onChange, onReset }: ActivityFilterBarProps) {
  const entityOptions = useMemo<SegmentOption<EntityFilter>[]>(
    () => [
      { value: 'all', label: 'All', count: counts.all, icon: Layers },
      ...ENTITY_TYPES.map((t) => ({ value: t, label: ENTITY_META[t].label, count: counts[t], icon: ENTITY_META[t].icon })),
    ],
    [counts]
  );

  return (
    <Card padding="sm" className={styles.panel}>
      <SegmentedControl
        label="Filter by entity type"
        size="sm"
        options={entityOptions}
        value={filters.entity}
        onChange={(value) => onChange('entity', value)}
      />
      <div className={styles.row}>
        <SearchInput
          value={filters.query}
          onChange={(value) => onChange('query', value)}
          placeholder="Search action, entity, details or person…"
          aria-label="Search activity"
        />
        {showActorFilter && (
          <Select
            className={styles.actor}
            options={actors}
            value={filters.actorId}
            onChange={(value) => onChange('actorId', value)}
            placeholder="Everyone"
            aria-label="Filter by person"
          />
        )}
        <label className={styles.date}>
          <span>From</span>
          <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => onChange('from', e.target.value)} />
        </label>
        <label className={styles.date}>
          <span>To</span>
          <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => onChange('to', e.target.value)} />
        </label>
        {isFiltered && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </Card>
  );
}
