'use client';

import { useState } from 'react';
import { KeyRound, Send } from 'lucide-react';
import { regenerateInvite, sendPasswordResetLink, useIsPendingInvite } from '@/store';
import { Button, FormError, Modal } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { ROUTES } from '@/constants/navigation';
import type { AccessLink, Employee } from '@/types';
import { AccessLinkCard } from './AccessLinkCard';

interface AccessLinkModalProps {
  member: Employee;
  onClose: () => void;
}

export function AccessLinkModal({ member, onClose }: AccessLinkModalProps) {
  const toast = useToast();
  const pending = useIsPendingInvite(member.id);
  const [isInvite] = useState(pending);
  const [link, setLink] = useState<AccessLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    const result = await (isInvite ? regenerateInvite(member.id) : sendPasswordResetLink(member.id));
    setGenerating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLink(result.data);
    toast.success(isInvite ? 'New invitation link created.' : 'Password reset link created.');
  };

  if (link) {
    return (
      <Modal isOpen onClose={onClose} title={isInvite ? 'Invitation link' : 'Password reset link'} size="md" footer={<Button onClick={onClose}>Done</Button>}>
        <AccessLinkCard
          title={isInvite ? `Invite ${member.name}` : `Reset link for ${member.name}`}
          description={
            isInvite
              ? 'They open this link, choose their own password and land in the workspace.'
              : 'They open this link to choose a new password. Their current password keeps working until they do.'
          }
          path={isInvite ? ROUTES.acceptInvite : ROUTES.resetPassword}
          link={link}
          details={[
            { label: 'Employee ID', value: member.employeeId },
            { label: 'Email', value: member.email },
          ]}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isInvite ? `Resend invitation to ${member.name}` : `Send a reset link to ${member.name}`}
      description={
        isInvite
          ? "They haven't joined yet. A new link replaces any earlier invitation and is valid for 7 days."
          : 'Creates a one-time link, valid for 30 minutes, that lets them set a new password.'
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={isInvite ? Send : KeyRound} onClick={generate} loading={generating}>
            {isInvite ? 'Create invite link' : 'Create reset link'}
          </Button>
        </>
      }
    >
      <FormError message={error} />
    </Modal>
  );
}
