'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to the console for now
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: 'var(--bg-main, #f7f9fc)', color: 'var(--text-primary, #111827)' }}>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <EmptyState
            icon={AlertTriangle}
            title="Something went wrong"
            description="A critical error occurred while loading the application. Please try again."
            action={
              <Button variant="primary" onClick={() => reset()} icon={RotateCcw}>
                Try again
              </Button>
            }
          />
        </div>
      </body>
    </html>
  );
}
