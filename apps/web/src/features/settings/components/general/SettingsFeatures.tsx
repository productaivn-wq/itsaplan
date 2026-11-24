import { useTranslations } from 'next-intl';
import type { ProjectFeatures } from '@/lib/api/endpoints/settings';
import { useFeatureLabel } from '@/hooks/useFeatureLabel';
import SettingsCard from '@/components/common/page/SettingsCard';
import SettingsSection from '@/components/common/page/SettingsSection';
import SettingsRow from '@/components/common/page/SettingsRow';
import { Switch } from '@/components/ui/switch';
import type { FeatureTogglesForm } from '../../hooks/useFeatureToggles';

// Consolidated navigation sections: 'documents' governs the unified Docs, Notes & Vibe Canvas hub.
const FEATURES = [
  'dashboards',
  'initiatives',
  'cycles',
  'documents',
  'subtasks',
  'checklists',
  'issueStats',
] as const satisfies (keyof ProjectFeatures)[];

export default function SettingsFeatures({ form }: { form: FeatureTogglesForm }) {
  const t = useTranslations('settings.general');
  const featureLabel = useFeatureLabel();

  return (
    <SettingsSection title={t('features')} description={t('featuresHint')}>
      <SettingsCard className="divide-y divide-border/60">
        {FEATURES.filter((feature) => form.available.includes(feature)).map((feature) => (
          <SettingsRow
            key={feature}
            title={featureLabel(feature)}
            description={t(`featureHints.${feature}`)}
            control={
              <Switch
                checked={form.features[feature]}
                disabled={!form.editable || form.saving}
                onCheckedChange={(enabled) => void form.toggle(feature, enabled)}
              />
            }
          />
        ))}
      </SettingsCard>
    </SettingsSection>
  );
}
