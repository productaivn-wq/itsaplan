'use client';

import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { ProjectFeatures } from '@/lib/api/endpoints/settings';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { projectFeatures } from '@/utils/projectFeatures';
import { useFeatureLabel } from '@/hooks/useFeatureLabel';
import { usePermissions } from '@/hooks/usePermissions';
import { useUpdateProjectFeatures } from '../services/settings.service';

export interface FeatureTogglesForm {
  features: ProjectFeatures;
  available: (keyof ProjectFeatures)[];
  editable: boolean;
  saving: boolean;
  toggle: (feature: keyof ProjectFeatures, enabled: boolean) => Promise<void>;
}

export function useFeatureToggles(project: ProjectDetail): FeatureTogglesForm {
  const t = useTranslations('settings.general');
  const featureLabel = useFeatureLabel();
  const { isOwner } = usePermissions();
  const update = useUpdateProjectFeatures(project.project.ref);

  async function toggle(feature: keyof ProjectFeatures, enabled: boolean) {
    const patch: Partial<ProjectFeatures> =
      feature === 'documents' || feature === 'notes'
        ? { documents: enabled, notes: enabled }
        : { [feature]: enabled };
    await update.mutateAsync(patch);
    toast.success(t(enabled ? 'featureOn' : 'featureOff', { feature: featureLabel(feature) }));
  }

  return {
    features: projectFeatures(project.project),
    available: project.project.availableFeatures,
    editable: isOwner,
    saving: update.isPending,
    toggle,
  };
}
