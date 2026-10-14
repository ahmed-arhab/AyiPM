'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, FolderKanban, Plus, SearchX } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { useDisclosure } from '@/hooks/useDisclosure';
import { ROUTES } from '@/constants/navigation';
import { toDateKey } from '@/lib/date';
import { downloadFile } from '@/lib/csv';
import { pluralize } from '@/lib/format';
import { useToast } from '@/components/feedback/ToastProvider';
import { useEmployeesById, useFormatters, usePermission } from '@/store';
import { useProjectList } from '../hooks/useProjectList';
import { buildProjectsCsv } from '../utils';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectTable } from './ProjectTable';
import { ProjectsToolbar } from './ProjectsToolbar';
import styles from './ProjectsView.module.css';

function OpenFromQuery({ onOpen }: { onOpen: () => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const wantsNew = params.get('new') === '1';
  useEffect(() => {
    if (!wantsNew) return;
    onOpen();
    router.replace(ROUTES.projects);
  }, [wantsNew, onOpen, router]);
  return null;
}

export function ProjectsView() {
  const canManage = usePermission('projects.manage');
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const createModal = useDisclosure();
  const list = useProjectList();
  const toast = useToast();

  const exportCsv = useCallback(() => {
    downloadFile(`projects-${toDateKey()}.csv`, buildProjectsCsv(list.visible, employeesById, list.progress, date));
    toast.success(`Exported ${pluralize(list.visible.length, 'project')}.`);
  }, [list.visible, list.progress, employeesById, date, toast]);

  const newButton = canManage && (
    <Button icon={Plus} onClick={createModal.open}>
      New project
    </Button>
  );

  return (
    <div className="page-container">
      {canManage && (
        <Suspense fallback={null}>
          <OpenFromQuery onOpen={createModal.open} />
        </Suspense>
      )}

      <PageHeader
        icon={FolderKanban}
        title="Projects"
        description={
          list.total > 0
            ? `${pluralize(list.total, 'project')} · track delivery, deadlines and team assignments.`
            : 'Track delivery, deadlines and team assignments across your workspace.'
        }
        actions={
          <>
            {list.visible.length > 0 && (
              <Button variant="secondary" icon={Download} onClick={exportCsv}>
                Export CSV
              </Button>
            )}
            {newButton}
          </>
        }
      />

      {list.total === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description={
              canManage
                ? 'Create your first project to organise work, assign a team and track progress from its tasks.'
                : 'Projects you are added to will appear here once an admin or project manager creates them.'
            }
            action={newButton}
          />
        </Card>
      ) : (
        <>
          <ProjectsToolbar
            query={list.query}
            onQueryChange={list.setQuery}
            status={list.status}
            onStatusChange={list.setStatus}
            counts={list.counts}
            total={list.matchedCount}
            sort={list.sort}
            onSortChange={list.setSort}
            view={list.view}
            onViewChange={list.setView}
          />

          {list.visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={SearchX}
                title="No matching projects"
                description="Try a different search term or status filter."
                action={
                  list.hasFilters && (
                    <Button variant="secondary" onClick={list.resetFilters}>
                      Clear filters
                    </Button>
                  )
                }
              />
            </Card>
          ) : list.view === 'grid' ? (
            <div className={styles.grid}>
              {list.visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  progress={list.progress.get(project.id)}
                  employeesById={employeesById}
                  formatDate={date}
                />
              ))}
            </div>
          ) : (
            <ProjectTable projects={list.visible} progress={list.progress} employeesById={employeesById} formatDate={date} />
          )}
        </>
      )}

      {canManage && <ProjectFormModal isOpen={createModal.isOpen} onClose={createModal.close} />}
    </div>
  );
}
