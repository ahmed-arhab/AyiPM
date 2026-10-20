import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, label = 'Loading' }: { size?: number; label?: string }) {
  return <Loader2 size={size} className="spin" aria-label={label} role="status" />;
}

export function FullPageLoader() {
  return (
    <div className="full-page-loader">
      <Spinner size={28} />
    </div>
  );
}
