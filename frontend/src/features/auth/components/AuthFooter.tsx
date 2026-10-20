import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthFooterProps {
  prompt?: ReactNode;
  href: string;
  linkLabel: ReactNode;
}

export function AuthFooter({ prompt, href, linkLabel }: AuthFooterProps) {
  return (
    <footer className="auth-footer">
      {prompt}
      <Link href={href}>{linkLabel}</Link>
    </footer>
  );
}
