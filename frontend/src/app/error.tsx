'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to the console for now
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. Please try again."
        action={
          <Button variant="primary" onClick={() => reset()} icon={RotateCcw}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
