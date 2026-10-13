import type { Metadata } from 'next';
import { ProjectDetailsView } from '@/features/projects/components/ProjectDetailsView';

export const metadata: Metadata = { title: 'Project details' };

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProjectDetailsView projectId={decodeURIComponent(resolvedParams.id)} />;
}
