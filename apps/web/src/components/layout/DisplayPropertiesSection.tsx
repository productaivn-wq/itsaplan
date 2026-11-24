import { useTranslations } from 'next-intl';
import { byKey } from '@/utils/messageKey';
import { cn } from '@/lib/utils';
import type { CustomField } from '@/lib/api/endpoints/customFields';
import type { IssueType } from '@/lib/api/endpoints/issueTypes';
import {
  TABLE_CALM_PROPERTIES,
  TABLE_DETAILED_PROPERTIES,
  isFieldEnabled,
  offeredDisplayProperties,
  type PropertyKey,
  type ViewSettings,
} from '@/utils/viewSettings';
import type { WorkItemsView } from '@/utils/viewTypes';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import PropertyChip from '@/components/layout/PropertyChip';
import TableProperties from '@/components/layout/TableProperties';

// The Display properties block. On the Table layout the chips are the column
// list, sortable and extendable with custom fields; on Project they are plain
// on/off chips for the built-in properties. The Nested subtasks chip is neither a
// column nor a property — it toggles the subtask rows under a card or row — so it
// sits after the property chips.
export default function DisplayPropertiesSection({
  view,
  settings,
  onChange,
  customFields,
  issueTypes,
}: {
  view: WorkItemsView;
  settings: ViewSettings;
  onChange: (patch: Partial<ViewSettings>) => void;
  customFields: CustomField[];
  issueTypes: IssueType[];
}) {
  const t = useTranslations('display');
  const property = byKey(useTranslations('display.properties'));
  const features = useProjectFeatures();
  const properties = offeredDisplayProperties(features);
  const calmProperties = TABLE_CALM_PROPERTIES.filter((p) => isFieldEnabled(p, features));
  const detailedProperties = TABLE_DETAILED_PROPERTIES.filter((p) => isFieldEnabled(p, features));

  const matchesPreset = (preset: readonly PropertyKey[]) =>
    settings.properties.length === preset.length &&
    preset.every((p, index) => settings.properties[index] === p);
  const isCalmPreset = matchesPreset(calmProperties);
  const isDetailedPreset = matchesPreset(detailedProperties);

  // Enabling appends to the end (a new column shows on the right); disabling
  // removes. Order is otherwise preserved.
  const toggleProperty = (property: PropertyKey) =>
    onChange({
      properties: settings.properties.includes(property)
        ? settings.properties.filter((p) => p !== property)
        : [...settings.properties, property],
    });

  const subtasksChip = features.subtasks ? (
    <PropertyChip
      label={t('rows.nestedSubtasks')}
      on={settings.showSubtasks}
      onClick={() => onChange({ showSubtasks: !settings.showSubtasks })}
    />
  ) : null;

  return (
    <div className="space-y-3 border-t pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium text-muted-foreground">{t('rows.displayProperties')}</p>
        {view === 'table' && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-testid="btn-table-preset-calm"
              aria-pressed={isCalmPreset}
              onClick={() =>
                onChange({
                  properties: TABLE_CALM_PROPERTIES.filter((p) => isFieldEnabled(p, features)),
                })
              }
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs transition-colors',
                isCalmPreset
                  ? 'border-border bg-secondary font-medium text-foreground'
                  : 'border-border/70 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t('rows.presetCalm')} (6)
            </button>
            <button
              type="button"
              data-testid="btn-table-preset-detailed"
              aria-pressed={isDetailedPreset}
              onClick={() =>
                onChange({
                  properties: TABLE_DETAILED_PROPERTIES.filter((p) => isFieldEnabled(p, features)),
                })
              }
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs transition-colors',
                isDetailedPreset
                  ? 'border-border bg-secondary font-medium text-foreground'
                  : 'border-border/70 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t('rows.presetDetailed')}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 px-1">
        {view === 'table' ? (
          <TableProperties
            properties={settings.properties}
            customFields={customFields}
            issueTypes={issueTypes}
            onChange={(properties) => onChange({ properties })}
            trailing={subtasksChip}
          />
        ) : (
          <>
            {properties.map((p) => (
              <PropertyChip
                key={p}
                label={property(p)}
                on={settings.properties.includes(p)}
                onClick={() => toggleProperty(p)}
              />
            ))}
            {subtasksChip}
          </>
        )}
      </div>
    </div>
  );
}
