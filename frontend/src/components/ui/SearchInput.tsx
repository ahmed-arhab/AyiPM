import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './SearchInput.module.css';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, className, placeholder = 'Search…', ...rest },
  ref
) {
  return (
    <div className={cn(styles.wrap, className)}>
      <Search size={16} className={styles.icon} />
      <input
        ref={ref}
        type="search"
        className={cn('form-input', styles.input)}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Clear search">
          <X size={13} />
        </button>
      )}
    </div>
  );
});
