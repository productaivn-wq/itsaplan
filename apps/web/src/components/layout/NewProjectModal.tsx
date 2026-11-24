import { useRef, useState } from 'react';
import { FolderOpen, Layers, MessageSquare, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCreateProject } from '@/services/projects.service';
import { useTeamsQuery, useTeamProjectDefaultsQuery } from '@/services/teams.service';
import { useAiAgentsQuery } from '@/services/aiAgents.service';
import { normalizeKey, suggestKey } from '@/utils/projectKey';
import type { PresetKey } from '@/utils/projectPresets';
import Modal from '@/components/common/overlay/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CopyProjectForm from '@/components/layout/CopyProjectForm';
import NewProjectForm from '@/components/layout/NewProjectForm';
import { allSelected, type CopyInclude } from '@/components/layout/CopyProjectOptions';
import {
  ChannelsGroupsEditor,
  ContactsEditor,
  StorageLocationsEditor,
  inferStorageKindFromPath,
  toChannelInput,
  toContactInput,
  toStorageLocationInput,
  type DraftChannelGroup,
  type DraftContact,
  type DraftStorageLocation,
} from '@/features/directory/components/ProjectSourcesEditors';

type SetupTab = 'general' | 'channels' | 'contacts' | 'locations';
const TAB_ORDER: SetupTab[] = ['general', 'channels', 'contacts', 'locations'];

// Creates a project, or — when `copyFrom` is set — copies that project's structure
// (states, issue types, labels, custom fields) into a new project without its
// issues. `teamId` is the team the project belongs to; a copy is always made within
// the source project's team.
export default function NewProjectModal({
  onClose,
  onCreated,
  teamId,
  copyFrom,
}: {
  onClose: () => void;
  onCreated: (projectKey: string) => void;
  teamId: number;
  copyFrom?: { id: number; name: string; description: string };
}) {
  const t = useTranslations('newProject');
  const initialName = copyFrom ? t('copyName', { name: copyFrom.name }) : '';
  const [key, setKey] = useState(() => suggestKey(initialName));
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(copyFrom?.description ?? '');
  const [primaryLocationPath, setPrimaryLocationPath] = useState('');
  const [activeTab, setActiveTab] = useState<SetupTab>('general');
  const [channels, setChannels] = useState<DraftChannelGroup[]>([]);
  const [contacts, setContacts] = useState<DraftContact[]>([]);
  const [storageLocations, setStorageLocations] = useState<DraftStorageLocation[]>([]);

  const pendingChannelRef = useRef<(() => DraftChannelGroup | null) | null>(null);
  const pendingContactRef = useRef<(() => DraftContact | null) | null>(null);
  const pendingLocationRef = useRef<(() => DraftStorageLocation | null) | null>(null);

  // Once the user edits the key, stop deriving it from the name. Clearing the
  // key field resumes auto-generation.
  const [keyEdited, setKeyEdited] = useState(false);
  // Which parts of the source project to copy. Defaults to everything; the user
  // clears what they don't want.
  const [include, setInclude] = useState<CopyInclude>(allSelected);
  // Which issue types the new project starts with. A copy takes its types from the
  // source project, so the preset applies only when creating from scratch.
  const [preset, setPreset] = useState<PresetKey>('general');
  const createProject = useCreateProject();
  // Names the team in the header, so the dialog says where the project lands.
  const teams = useTeamsQuery().data;
  const team = teams?.find((one) => one.id === teamId);
  const defaults = useTeamProjectDefaultsQuery(copyFrom ? null : teamId).data;
  const agents = useAiAgentsQuery(copyFrom ? null : teamId).data ?? [];
  const defaultAgentNames = agents
    .filter((agent) => defaults?.defaultAgentIds.includes(agent.id))
    .map((agent) => agent.name);

  function onNameChange(value: string) {
    setName(value);
    if (!keyEdited) setKey(suggestKey(value));
  }

  function onKeyChange(value: string) {
    const next = normalizeKey(value);
    setKey(next);
    setKeyEdited(next !== '');
  }

  function handlePrimaryLocationPathChange(value: string) {
    setPrimaryLocationPath(value);
    const trimmed = value.trim();
    setStorageLocations((prev) => {
      const idx = prev.findIndex((l) => l.clientId === '__primary_quick__' || l.isPrimary);
      if (!trimmed) {
        return idx >= 0 && prev[idx]?.clientId === '__primary_quick__'
          ? prev.filter((_, i) => i !== idx)
          : prev;
      }
      const inferredKind = inferStorageKindFromPath(trimmed);
      if (idx >= 0) {
        return prev.map((l, i) =>
          i === idx
            ? {
                ...l,
                uriOrPath: trimmed,
                kind: l.clientId === '__primary_quick__' ? inferredKind : l.kind,
              }
            : l,
        );
      }
      return [
        {
          clientId: '__primary_quick__',
          kind: inferredKind,
          label: 'Primary Workspace',
          uriOrPath: trimmed,
          accessScope: 'read_write',
          isPrimary: true,
          description: 'Primary project folder / workspace root',
        },
        ...prev,
      ];
    });
  }

  function submit() {
    const pendingChannel = pendingChannelRef.current?.() ?? null;
    const pendingContact = pendingContactRef.current?.() ?? null;
    const pendingLocation = pendingLocationRef.current?.() ?? null;

    const finalChannels = pendingChannel ? [...channels, pendingChannel] : channels;
    const finalContacts = pendingContact ? [...contacts, pendingContact] : contacts;
    const finalLocations = pendingLocation
      ? [
          ...(pendingLocation.isPrimary
            ? storageLocations.map((l) => ({ ...l, isPrimary: false }))
            : storageLocations),
          pendingLocation,
        ]
      : storageLocations;

    const input = {
      key: key.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      ...(copyFrom
        ? { include }
        : {
            preset,
            ...(finalContacts.length > 0
              ? { contacts: finalContacts.map(toContactInput) }
              : {}),
            ...(finalChannels.length > 0
              ? { channels: finalChannels.map(toChannelInput) }
              : {}),
            ...(finalLocations.length > 0
              ? { storageLocations: finalLocations.map(toStorageLocationInput) }
              : {}),
          }),
    };
    createProject.mutate(
      { teamId, copyFromId: copyFrom?.id, input },
      { onSuccess: (project) => onCreated(project.ref) },
    );
  }

  const nextTab = TAB_ORDER[TAB_ORDER.indexOf(activeTab) + 1] ?? null;

  return (
    <Modal
      title={copyFrom ? t('copyTitle', { name: copyFrom.name }) : t('title')}
      scope={
        team && (
          <>
            <Users className="size-3.5" />
            {team.name}
          </>
        )
      }
      onClose={onClose}
      wide="xl"
      className="pb-3"
    >
      <div className="flex min-h-0 flex-col">
        {copyFrom ? (
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <CopyProjectForm
              name={name}
              projectKey={key}
              description={description}
              include={include}
              onNameChange={onNameChange}
              onKeyChange={onKeyChange}
              onDescriptionChange={setDescription}
              onIncludeChange={setInclude}
            />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SetupTab)}
            className="flex min-h-0 flex-col"
          >
            <TabsList className="mb-3 grid w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1.5 text-xs">
                <Layers className="size-3.5" />
                <span className="truncate">{t('tabGeneral')}</span>
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-1.5 text-xs">
                <MessageSquare className="size-3.5" />
                <span className="truncate">{t('tabChannels')}</span>
                {channels.length > 0 && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {channels.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1.5 text-xs">
                <Users className="size-3.5" />
                <span className="truncate">{t('tabContacts')}</span>
                {contacts.length > 0 && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {contacts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-1.5 text-xs">
                <FolderOpen className="size-3.5" />
                <span className="truncate">{t('tabLocations')}</span>
                {storageLocations.length > 0 && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {storageLocations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[54vh] overflow-y-auto pr-1">
              <TabsContent value="general" className="mt-0">
                <NewProjectForm
                  name={name}
                  projectKey={key}
                  description={description}
                  primaryLocationPath={primaryLocationPath}
                  preset={preset}
                  onNameChange={onNameChange}
                  onKeyChange={onKeyChange}
                  onDescriptionChange={setDescription}
                  onPrimaryLocationPathChange={handlePrimaryLocationPathChange}
                  onPresetChange={setPreset}
                />
                {defaultAgentNames.length > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t('defaultAgents', { names: defaultAgentNames.join(', ') })}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="channels" className="mt-0">
                <p className="mb-2.5 text-xs text-muted-foreground">{t('channelsHint')}</p>
                <ChannelsGroupsEditor
                  items={channels}
                  pendingDraftRef={pendingChannelRef}
                  onAdd={(item) => setChannels((prev) => [...prev, item])}
                  onDelete={(item) =>
                    setChannels((prev) => prev.filter((c) => c.clientId !== item.clientId))
                  }
                />
              </TabsContent>

              <TabsContent value="contacts" className="mt-0">
                <p className="mb-2.5 text-xs text-muted-foreground">{t('contactsHint')}</p>
                <ContactsEditor
                  items={contacts}
                  pendingDraftRef={pendingContactRef}
                  onAdd={(item) => setContacts((prev) => [...prev, item])}
                  onDelete={(item) =>
                    setContacts((prev) => prev.filter((c) => c.clientId !== item.clientId))
                  }
                />
              </TabsContent>

              <TabsContent value="locations" className="mt-0">
                <p className="mb-2.5 text-xs text-muted-foreground">{t('locationsHint')}</p>
                <StorageLocationsEditor
                  items={storageLocations}
                  pendingDraftRef={pendingLocationRef}
                  onAdd={(item) => {
                    setStorageLocations((prev) => {
                      const base = item.isPrimary
                        ? prev.map((l) => ({ ...l, isPrimary: false }))
                        : prev;
                      return [...base, item];
                    });
                    if (item.isPrimary) setPrimaryLocationPath(item.uriOrPath);
                  }}
                  onDelete={(item) => {
                    setStorageLocations((prev) =>
                      prev.filter((l) => l.clientId !== item.clientId),
                    );
                    if (item.isPrimary) setPrimaryLocationPath('');
                  }}
                  onSetPrimary={(item) => {
                    setStorageLocations((prev) =>
                      prev.map((l) => ({ ...l, isPrimary: l.clientId === item.clientId })),
                    );
                    setPrimaryLocationPath(item.uriOrPath);
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {!copyFrom ? (
            <span className="text-xs text-muted-foreground">
              {t('setupSummary', {
                channels: channels.length,
                contacts: contacts.length,
                locations: storageLocations.length,
              })}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {!copyFrom && nextTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(nextTab)}
              >
                {t('nextStep')}
              </Button>
            )}
            <Button
              disabled={createProject.isPending || !key.trim() || !name.trim()}
              onClick={submit}
            >
              {t(copyFrom ? 'copyAction' : 'create')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
