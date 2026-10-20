import { memo } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PASSWORD_RULES, getPasswordStrength } from '@/lib/validation';

const SEGMENTS = [1, 2, 3, 4];

export const PasswordStrengthMeter = memo(function PasswordStrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const { score, level } = getPasswordStrength(value);
  return (
    <div className="strength-meter-wrap">
      <div className="strength-meter-bars" aria-hidden>
        {SEGMENTS.map((segment) => (
          <span key={segment} className={cn('strength-meter-segment', segment <= score && level)} />
        ))}
      </div>
      <div className="strength-meter-info">
        <span className="text-muted">Password strength</span>
        <span className={cn('strength-label', level)}>{level}</span>
      </div>
      <ul className="password-rules-list">
        {PASSWORD_RULES.map((rule) => {
          const valid = rule.test(value);
          return (
            <li key={rule.id} className={cn('password-rule-item', valid && 'valid')}>
              {valid ? <Check size={12} /> : <Circle size={10} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
