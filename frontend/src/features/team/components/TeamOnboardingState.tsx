import { UserPlus, Users } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';

interface TeamOnboardingStateProps {
  canManage: boolean;
  onAdd: () => void;
}

export function TeamOnboardingState({ canManage, onAdd }: TeamOnboardingStateProps) {
  return (
    <Card>
      <EmptyState
        icon={Users}
        title="It's just you so far"
        description={
          canManage
            ? 'Add your teammates to assign them to projects, track attendance and manage leave in one place. Each new member gets an Employee ID and an invitation link to set their own password.'
            : 'Your teammates will appear here once an admin adds them to the workspace.'
        }
        action={
          canManage && (
            <Button icon={UserPlus} onClick={onAdd}>
              Add your first member
            </Button>
          )
        }
      />
    </Card>
  );
}
