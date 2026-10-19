import type { Metadata } from 'next';
import { ForgotPasswordView } from '@/features/auth/components/ForgotPasswordView';

export const metadata: Metadata = { title: "Can't log in?" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
