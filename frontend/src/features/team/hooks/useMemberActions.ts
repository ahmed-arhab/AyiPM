import { useCallback } from 'react';
import { setEmployeeRole, setEmployeeStatus } from '@/store';
import { ROLE_LABELS } from '@/constants/roles';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import type { Employee, UserRole } from '@/types';

export function useMemberActions() {
  const confirm = useConfirm();
  const toast = useToast();

  const toggleStatus = useCallback(
    async (member: Employee) => {
      const deactivate = member.status === 'active';
      const confirmed = await confirm({
        title: deactivate ? `Deactivate ${member.name}?` : `Reactivate ${member.name}?`,
        message: deactivate
          ? 'They will be signed out and can no longer sign in until reactivated. Their history is kept.'
          : 'They will be able to sign in again with their existing credentials.',
        confirmLabel: deactivate ? 'Deactivate' : 'Reactivate',
        tone: deactivate ? 'danger' : 'primary',
      });
      if (!confirmed) return;
      const result = await setEmployeeStatus(member.id, deactivate ? 'inactive' : 'active');
      if (result.ok) toast.success(`${member.name} was ${deactivate ? 'deactivated' : 'reactivated'}.`);
      else toast.error(result.error);
    },
    [confirm, toast]
  );

  const changeRole = useCallback(
    async (member: Employee, role: UserRole) => {
      if (member.role === role) return;
      const result = await setEmployeeRole(member.id, role);
      if (result.ok) toast.success(`${member.name} is now ${ROLE_LABELS[role]}.`);
      else toast.error(result.error);
    },
    [toast]
  );

  return { toggleStatus, changeRole };
}
