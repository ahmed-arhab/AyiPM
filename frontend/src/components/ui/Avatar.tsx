import { memo } from 'react';
import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}

const TONES = [
  { background: 'var(--gray-100)', color: 'var(--gray-700)' },
  { background: 'var(--gray-200)', color: 'var(--gray-800)' },
  { background: 'var(--gray-300)', color: 'var(--gray-900)' },
  { background: 'var(--gray-600)', color: 'var(--gray-0)' },
  { background: 'var(--gray-800)', color: 'var(--gray-50)' },
];

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return TONES[hash % TONES.length];
}

export const Avatar = memo(function Avatar({ name, src, size = 32, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (src) {
    return <img src={src} alt={name} title={name} className={cn(styles.avatar, className)} style={style} loading="lazy" decoding="async" />;
  }
  const tone = toneFor(name);
  return (
    <span
      className={cn(styles.avatar, styles.initials, className)}
      style={{ ...style, ...tone }}
      title={name}
      aria-label={name}
      role="img"
    >
      {initials(name)}
    </span>
  );
});

interface AvatarGroupProps {
  people: { id: string; name: string; avatar?: string }[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ people, max = 4, size = 28 }: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;
  return (
    <div className={styles.group}>
      {visible.map((p) => (
        <Avatar key={p.id} name={p.name} src={p.avatar} size={size} />
      ))}
      {extra > 0 && (
        <span className={cn(styles.avatar, styles.more)} style={{ width: size, height: size }}>
          +{extra}
        </span>
      )}
    </div>
  );
}
