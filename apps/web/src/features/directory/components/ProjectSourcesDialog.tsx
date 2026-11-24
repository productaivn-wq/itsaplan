'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, MessageSquare, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteProjectChannel,
  deleteProjectContact,
  deleteProjectStorageLocation,
  fetchProjectDirectory,
  upsertProjectChannel,
  upsertProjectContact,
  upsertProjectStorageLocation,
  type ChannelThreadType,
  type StorageAccessScope,
  type StorageLocationKind,
} from '@/lib/api/endpoints/directory';
import { qk } from '@/services/queryKeys';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChannelsGroupsEditor,
  ContactsEditor,
  StorageLocationsEditor,
  toChannelInput,
  toContactInput,
  toStorageLocationInput,
  type DraftChannelGroup,
  type DraftContact,
  type DraftStorageLocation,
} from './ProjectSourcesEditors';

export function ProjectSourcesDialog({
  projectKey,
  open,
  onOpenChange,
  initialTab = 'locations',
}: {
  projectKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'locations' | 'channels' | 'contacts';
}) {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<'locations' | 'channels' | 'contacts'>(initialTab);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const { data, isLoading } = useQuery({
    queryKey: qk.projectDirectory(projectKey),
    queryFn: () => fetchProjectDirectory(projectKey),
    enabled: Boolean(projectKey) && open,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: qk.projectDirectory(projectKey) });

  const addLocation = useMutation({
    mutationFn: (d: DraftStorageLocation) =>
      upsertProjectStorageLocation(projectKey, toStorageLocationInput(d)),
    onSuccess: () => {
      void invalidate();
      toast.success('Storing location saved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save location'),
  });

  const removeLocation = useMutation({
    mutationFn: (locationId: string) => deleteProjectStorageLocation(projectKey, locationId),
    onSuccess: () => {
      void invalidate();
      toast.success('Storing location removed');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to remove location'),
  });

  const addChannel = useMutation({
    mutationFn: (d: DraftChannelGroup) => upsertProjectChannel(projectKey, toChannelInput(d)),
    onSuccess: () => {
      void invalidate();
      toast.success('Channel / group saved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save channel'),
  });

  const removeChannel = useMutation({
    mutationFn: (channelId: string) => deleteProjectChannel(projectKey, channelId),
    onSuccess: () => {
      void invalidate();
      toast.success('Channel / group removed');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to remove channel'),
  });

  const addContact = useMutation({
    mutationFn: (d: DraftContact) => upsertProjectContact(projectKey, toContactInput(d)),
    onSuccess: () => {
      void invalidate();
      toast.success('Contact saved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save contact'),
  });

  const removeContact = useMutation({
    mutationFn: (externalKey: string) => deleteProjectContact(projectKey, externalKey),
    onSuccess: () => {
      void invalidate();
      toast.success('Contact removed');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to remove contact'),
  });

  const locations: DraftStorageLocation[] = (data?.storageLocations ?? []).map((l) => ({
    clientId: l.locationId,
    locationId: l.locationId,
    kind: l.kind as StorageLocationKind,
    label: l.label,
    uriOrPath: l.uriOrPath,
    accessScope: l.accessScope as StorageAccessScope,
    isPrimary: l.isPrimary,
    description: l.description,
  }));

  const channels: DraftChannelGroup[] = (data?.channels ?? []).map((c) => ({
    clientId: c.channelId,
    channelId: c.channelId,
    platform: c.platform,
    threadType: (c.threadType as ChannelThreadType) || 'GROUP',
    displayName: c.displayName,
    targetId: c.targetId,
    aliases: c.aliases ?? [],
    status: c.status,
  }));

  const contacts: DraftContact[] = (data?.contacts ?? []).map((c) => ({
    clientId: c.externalKey,
    externalKey: c.externalKey,
    name: c.name,
    role: c.role,
    raciRole: c.raciRole,
    primaryEmail: c.primaryEmail,
    phone: c.phone,
    channelHandles: c.channelHandles ?? {},
  }));

  const busy =
    addLocation.isPending ||
    removeLocation.isPending ||
    addChannel.isPending ||
    removeChannel.isPending ||
    addContact.isPending ||
    removeContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Project Sources & Directory · <span className="font-mono">{projectKey}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure storing locations, channels/groups, and contacts so agents collect project
            information accurately.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'locations' | 'channels' | 'contacts')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="locations" className="gap-1.5 text-xs">
              <FolderOpen className="size-3.5" />
              <span>Locations</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {locations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-1.5 text-xs">
              <MessageSquare className="size-3.5" />
              <span>Channels & Groups</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {channels.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5 text-xs">
              <Users className="size-3.5" />
              <span>Contacts</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {contacts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Loading project sources...
              </p>
            ) : (
              <>
                <TabsContent value="locations" className="mt-0">
                  <StorageLocationsEditor
                    items={locations}
                    busy={busy}
                    onAdd={async (d) => {
                      await addLocation.mutateAsync(d);
                    }}
                    onDelete={async (d) => {
                      if (d.locationId) await removeLocation.mutateAsync(d.locationId);
                    }}
                    onSetPrimary={async (d) => {
                      await addLocation.mutateAsync({ ...d, isPrimary: true });
                    }}
                  />
                </TabsContent>
                <TabsContent value="channels" className="mt-0">
                  <ChannelsGroupsEditor
                    items={channels}
                    busy={busy}
                    onAdd={async (d) => {
                      await addChannel.mutateAsync(d);
                    }}
                    onDelete={async (d) => {
                      if (d.channelId) await removeChannel.mutateAsync(d.channelId);
                    }}
                  />
                </TabsContent>
                <TabsContent value="contacts" className="mt-0">
                  <ContactsEditor
                    items={contacts}
                    busy={busy}
                    onAdd={async (d) => {
                      await addContact.mutateAsync(d);
                    }}
                    onDelete={async (d) => {
                      if (d.externalKey) await removeContact.mutateAsync(d.externalKey);
                    }}
                  />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
