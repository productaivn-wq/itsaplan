'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { membersPath } from '@/utils/paths';
import { updateProjectSettings, type ProjectFeatures } from '@/lib/api/endpoints/settings';
import { qk } from '@/services/queryKeys';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useFeatureLabel } from '@/hooks/useFeatureLabel';
import { showUndoToast } from '@/hooks/useUndoToast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsResourceProvider } from '@/features/settings/context/settingsPermission';
import SettingsStates from '@/features/settings/components/states/SettingsStates';
import StatesToolbar from '@/features/settings/components/states/StatesToolbar';
import SettingsEstimates from '@/features/settings/components/configuration/SettingsEstimates';
import SettingsSubtaskAutomation from '@/features/settings/components/configuration/SettingsSubtaskAutomation';
import SettingsAutoArchive from '@/features/settings/components/configuration/SettingsAutoArchive';
import SettingsWebhooks from '@/features/settings/components/webhooks/SettingsWebhooks';
import { useAutoArchiveForm } from '@/features/settings/hooks/useAutoArchiveForm';
import { useEstimatesForm } from '@/features/settings/hooks/useEstimatesForm';
import { useSubtaskAutomationForm } from '@/features/settings/hooks/useSubtaskAutomationForm';

const FEATURE_KEYS: (keyof ProjectFeatures)[] = [
  'initiatives',
  'cycles',
  'dashboards',
  'documents',
  'subtasks',
  'checklists',
  'issueStats',
];

export default function BoardCustomizeSheetContent({
  project,
  canEditFeatures,
  canReadWorkflow,
  canReadWebhooks,
}: {
  project: ProjectDetail;
  canEditFeatures: boolean;
  canReadWorkflow: boolean;
  canReadWebhooks: boolean;
}) {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const { can } = usePermissions();
  const features = useProjectFeatures();
  const featureLabel = useFeatureLabel();
  const queryClient = useQueryClient();

  const canEditWorkflow = can('workflow_config', 'edit');
  const [addWebhook, setAddWebhook] = useState(false);
  const projectKey = project.project.ref;

  const subtasks = useSubtaskAutomationForm(projectKey);
  const estimates = useEstimatesForm(project.project);
  const archive = useAutoArchiveForm(projectKey);
  const savingWorkflow = subtasks.saving || estimates.saving || archive.saving;

  async function toggleFeature(key: keyof ProjectFeatures, next: boolean) {
    const patch: Partial<ProjectFeatures> =
      key === 'documents' ? { documents: next, notes: next } : { [key]: next };
    const revert: Partial<ProjectFeatures> =
      key === 'documents' ? { documents: !next, notes: !next } : { [key]: !next };
    await updateProjectSettings(projectKey, { features: patch });
    await queryClient.invalidateQueries({ queryKey: qk.project(projectKey) });
    showUndoToast({
      message: `${featureLabel(key)}: ${next ? tCommon('enabled') : tCommon('hide')}`,
      undoLabel: tCommon('cancel'),
      onUndo: async () => {
        await updateProjectSettings(projectKey, { features: revert });
        await queryClient.invalidateQueries({ queryKey: qk.project(projectKey) });
      },
    });
  }

  async function saveWorkflowRules() {
    await subtasks.save();
    await estimates.save();
    await archive.save();
    toast.success(tCommon('save'));
  }

  return (
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[380px] sm:max-w-[380px]"
    >
      <SheetHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <SheetTitle className="text-sm font-semibold">{tNav('configuration')}</SheetTitle>
            <SheetDescription className="text-xs">
              {project.project.name} ({project.project.key})
            </SheetDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs">
            <Link href={membersPath(projectKey)}>
              <Users className="size-3.5" />
              <span>{tNav('members')}</span>
            </Link>
          </Button>
        </div>
      </SheetHeader>

      <Tabs defaultValue="columns" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2">
          <TabsList className="grid h-9 w-full grid-cols-4">
            <TabsTrigger value="columns" className="text-xs">
              {tNav('groups.workflow')}
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              {tNav('sections')}
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-xs">
              {tNav('groups.automation')}
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs">
              {tNav('integrations')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TabsContent value="columns" className="mt-0 space-y-4">
            {canReadWorkflow && (
              <SettingsResourceProvider resource="workflow_config">
                <div className="flex items-center justify-end">
                  <StatesToolbar projectKey={projectKey} columns={project.columns} />
                </div>
                <SettingsStates project={project} />
              </SettingsResourceProvider>
            )}
          </TabsContent>

          <TabsContent value="features" className="mt-0 space-y-3">
            {FEATURE_KEYS.map((key) => (
              <div
                key={key}
                className="flex min-h-11 items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-b-0"
              >
                <span className="text-sm font-medium">{featureLabel(key)}</span>
                <Switch
                  checked={features[key]}
                  disabled={!canEditFeatures}
                  onCheckedChange={(checked) => void toggleFeature(key, checked)}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="mt-0 space-y-6">
            {canReadWorkflow && (
              <SettingsResourceProvider resource="workflow_config">
                {features.subtasks && <SettingsSubtaskAutomation form={subtasks} />}
                <SettingsEstimates form={estimates} />
                <SettingsAutoArchive form={archive} />
                {canEditWorkflow && (
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-9 w-full"
                    disabled={savingWorkflow}
                    onClick={() => void saveWorkflowRules()}
                  >
                    {savingWorkflow ? tCommon('saving') : tCommon('save')}
                  </Button>
                )}
              </SettingsResourceProvider>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="mt-0 space-y-3">
            {canReadWebhooks && (
              <SettingsResourceProvider resource="webhooks">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    onClick={() => setAddWebhook(true)}
                  >
                    {tCommon('add')}
                  </Button>
                </div>
                <SettingsWebhooks
                  project={project}
                  requestNew={addWebhook}
                  onNewHandled={() => setAddWebhook(false)}
                />
              </SettingsResourceProvider>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </SheetContent>
  );
}
