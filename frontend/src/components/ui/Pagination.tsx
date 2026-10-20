import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, total, pageSize, onPageChange }: PaginationProps) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <span className={styles.summary}>
        {from}–{to} of {total}
      </span>
      <div className={styles.controls}>
        <button type="button" className="icon-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className={styles.page}>
          {page} / {pageCount}
        </span>
        <button type="button" className="icon-btn" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
