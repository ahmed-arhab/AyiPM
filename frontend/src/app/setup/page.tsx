import type { Metadata } from 'next';
import { SetupView } from '@/features/auth/components/SetupView';

export const metadata: Metadata = { title: 'Set up your workspace' };

export default function SetupPage() {
  return <SetupView />;
}
