import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { useFormatters } from '@/store';
import { absoluteUrl } from '@/lib/url';
import type { AccessLink } from '@/types';
import styles from './AccessLinkCard.module.css';

interface AccessLinkCardProps {
  title: string;
  description: string;
  path: string;
  link: AccessLink;
  details?: { label: string; value: string }[];
}

export function AccessLinkCard({ title, description, path, link, details = [] }: AccessLinkCardProps) {
  const toast = useToast();
  const { dateTime } = useFormatters();
  const url = absoluteUrl(`${path}?token=${encodeURIComponent(link.token)}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied.');
    } catch {
      toast.error('Could not access the clipboard. Copy the link manually.');
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <CheckCircle2 size={22} className={styles.icon} />
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className="subtext">{description}</p>
        </div>
      </div>
      <dl className={styles.list}>
        {details.map((d) => (
          <div key={d.label} className={styles.row}>
            <dt>{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
        <div className={styles.row}>
          <dt>Expires</dt>
          <dd>{dateTime(link.expiresAt)}</dd>
        </div>
      </dl>
      <div className={styles.linkRow}>
        <input className={`form-input ${styles.link}`} value={url} readOnly aria-label="Link" onFocus={(e) => e.currentTarget.select()} />
        <Button variant="secondary" icon={Copy} onClick={copy}>
          Copy
        </Button>
      </div>
      <p className={styles.note}>Email delivery isn&apos;t configured yet, so share this link privately. Generating a new link cancels this one.</p>
    </div>
  );
}
