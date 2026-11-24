'use client';

import type { ReactNode } from 'react';
import type { ProjectFeatures } from '@/lib/api/endpoints/settings';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useFeatureLabel } from '@/hooks/useFeatureLabel';
import { EmptyState } from '@/components/common/page/EmptyState';
import { useTranslations } from 'next-intl';

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: Removed /settings/general button from feature gate.
export default function RequireFeature({
  feature,
  children,
}: {
  feature: keyof ProjectFeatures;
  children: ReactNode;
}) {
  const t = useTranslations('common');
  const featureLabel = useFeatureLabel();
  const features = useProjectFeatures();

  if (features[feature]) return <>{children}</>;

  return (
    <EmptyState
      title={t('featureOffTitle', { feature: featureLabel(feature) })}
      description={t('featureOffHint')}
    />
  );
}
