import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

/**
 * Turns on a checkbox column. The header checkbox selects or clears the selectable rows currently shown (`rows`, so
 * one page when the table is paginated); selected rows that aren't shown stay selected.
 */
export interface RowSelection<T> {
  /** rowKey values of the selected rows. */
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
  /** Accessible name of a row's checkbox, e.g. `Select “Fix login”`. */
  rowLabel: (row: T) => string;
  /** Accessible name of the header checkbox. */
  allLabel: string;
  /** Rows this returns false for get a disabled checkbox. Defaults to every row. */
  canSelect?: (row: T) => boolean;
  /** Tooltip on a disabled checkbox, saying why it can't be selected. */
  disabledHint?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  minWidth?: number;
  caption?: string;
  selection?: RowSelection<T>;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty, minWidth = 720, caption, selection }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  const selectableKeys = selection ? rows.filter((r) => selection.canSelect?.(r) ?? true).map(rowKey) : [];
  const shownSelected = selection ? selectableKeys.filter((k) => selection.selected.has(k)).length : 0;
  const allShownSelected = selectableKeys.length > 0 && shownSelected === selectableKeys.length;

  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    selectableKeys.forEach((k) => (allShownSelected ? next.delete(k) : next.add(k)));
    selection.onChange(next);
  };

  const toggleRow = (key: string, checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (checked) next.add(key);
    else next.delete(key);
    selection.onChange(next);
  };

  return (
    <div className="table-wrapper">
      <table className="custom-table" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {selection && (
              <th className="cell-select">
                <label className="cell-select-hit">
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    aria-label={selection.allLabel}
                    title={selection.allLabel}
                    checked={allShownSelected}
                    disabled={selectableKeys.length === 0}
                    ref={(el) => {
                      if (el) el.indeterminate = shownSelected > 0 && !allShownSelected;
                    }}
                    onChange={toggleAll}
                  />
                </label>
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const canSelect = selection ? (selection.canSelect?.(row) ?? true) : false;
            const isSelected = canSelect && Boolean(selection?.selected.has(key));
            return (
              <tr
                key={key}
                className={cn(onRowClick && 'row-clickable', isSelected && 'row-selected')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selection && (
                  // Clicks on the checkbox cell select the row instead of opening it.
                  <td className="cell-select" onClick={(e) => e.stopPropagation()}>
                    <label className="cell-select-hit" title={canSelect ? undefined : selection.disabledHint}>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        aria-label={selection.rowLabel(row)}
                        checked={isSelected}
                        disabled={!canSelect}
                        onChange={(e) => toggleRow(key, e.target.checked)}
                      />
                    </label>
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
