import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ACCORD_VERSION,
  ACCORD_RELEASES,
  getAppVersion,
  getUpdateStatus,
  checkForUpdates,
  getWhatsNew,
  markWhatsNewSeen,
  type Release,
  type UpdateStatus,
  type WhatsNew,
} from '../lib/api/endpoints/updates';

export const useAppVersionQuery = () => {
  return useQuery({
    queryKey: ['app-version'],
    queryFn: getAppVersion,
    initialData: { version: ACCORD_VERSION },
  });
};

export const useUpdateStatusQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['update-status'],
    queryFn: getUpdateStatus,
    enabled: Boolean(enabled) || true,
    initialData: {
      currentVersion: ACCORD_VERSION,
      latestVersion: ACCORD_VERSION,
      updateAvailable: false,
      checkedAt: '2026-10-22T00:00:00Z',
      releases: ACCORD_RELEASES,
    },
  });
};

export const useCheckForUpdatesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkForUpdates,
    onSuccess: (data) => {
      queryClient.setQueryData(['update-status'], data);
    },
  });
};

export const useMarkWhatsNewSeenMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markWhatsNewSeen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whats-new'] });
    },
  });
};

export {
  ACCORD_VERSION,
  ACCORD_RELEASES,
  getAppVersion,
  getUpdateStatus,
  checkForUpdates,
  getWhatsNew,
  markWhatsNewSeen,
  type Release,
  type UpdateStatus,
  type WhatsNew,
};
