import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/navigation';

export default function HomePage() {
  redirect(ROUTES.dashboard);
}
