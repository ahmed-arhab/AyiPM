import { Badge } from '@/components/ui';
import { useT } from '@/translations';
import type { Employee } from '@/types';

export function MemberStatusBadge({ member }: { member: Employee }) {
  const { t } = useT();
  if (member.status !== 'active') return <Badge tone="neutral">{t('Inactive')}</Badge>;
  if (member.invited) return <Badge tone="warning" title={t('Invited')}>{t('Invited')}</Badge>;
  return (
    <>
      <Badge tone="success">{t('Active')}</Badge>
      {member.passwordResetRequestedAt && (
        <Badge tone="danger" title={t('Reset requested')}>
          {t('Reset requested')}
        </Badge>
      )}
    </>
  );
}
