import { memo, useMemo } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PASSWORD_RULES, getPasswordStrength } from '@/lib/validation';
import styles from './PasswordStrengthMeter.module.css';

const SEGMENTS = PASSWORD_RULES.map((rule) => rule.id);

export const PasswordStrengthMeter = memo(function PasswordStrengthMeter({ value }: { value: string }) {
  const { score, level } = useMemo(() => getPasswordStrength(value), [value]);
  if (!value) return null;

  return (
    <div className="strength-meter-wrap" aria-live="polite">
      <div className="strength-meter-info">
        <span className={styles.caption}>Password strength</span>
        <span className={cn('strength-label', level)}>{level}</span>
      </div>
      <div className="strength-meter-bars" aria-hidden>
        {SEGMENTS.map((id, index) => (
          <span key={id} className={cn('strength-meter-segment', index < score && level)} />
        ))}
      </div>
      <ul className={cn('password-rules-list', styles.rules)}>
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.id} className={cn('password-rule-item', met && 'valid')}>
              {met ? <Check size={12} /> : <Circle size={10} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
