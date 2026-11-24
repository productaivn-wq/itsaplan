import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type NotificationCursor,
  type NotificationFilters,
  type NotificationDeleteScope,
  listNotifications,
  setNotificationRead,
  markAllNotificationsRead,
  snoozeNotification,
  deleteNotification,
  deleteNotifications,
} from '@/lib/api/endpoints/notifications';
import { qk } from '@/services/queryKeys';

// One project's inbox or portfolio-wide inbox (when projectId is null), keyset-paged
// and scoped by the active filters.
export function useNotificationsQuery(
  scopeKey: string,
  projectId: number | null,
  filters: NotificationFilters,
) {
  return useInfiniteQuery({
    queryKey: qk.notifications(scopeKey, filters),
    queryFn: ({ pageParam }) =>
      listNotifications(projectId, { cursor: pageParam, limit: 30, filters }),
    initialPageParam: null as NotificationCursor | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

function useInvalidateInbox(_scopeKey: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['notifications'] });
    void qc.invalidateQueries({ queryKey: ['notificationsUnread'] });
  };
}

export function useSetNotificationRead(scopeKey: string) {
  const invalidate = useInvalidateInbox(scopeKey);
  return useMutation({
    mutationFn: ({ id, read }: { id: number; read: boolean }) => setNotificationRead(id, read),
    onSuccess: invalidate,
  });
}

export function useMarkAllRead(scopeKey: string, projectId: number | null) {
  const invalidate = useInvalidateInbox(scopeKey);
  return useMutation({
    mutationFn: () => markAllNotificationsRead(projectId),
    onSuccess: invalidate,
  });
}

export function useSnoozeNotification(scopeKey: string) {
  const invalidate = useInvalidateInbox(scopeKey);
  return useMutation({
    mutationFn: ({ id, until }: { id: number; until: string | null }) =>
      snoozeNotification(id, until),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification(scopeKey: string) {
  const invalidate = useInvalidateInbox(scopeKey);
  return useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: invalidate,
  });
}

export function useDeleteNotifications(scopeKey: string, projectId: number | null) {
  const invalidate = useInvalidateInbox(scopeKey);
  return useMutation({
    mutationFn: (scope: NotificationDeleteScope) => deleteNotifications(scope, projectId),
    onSuccess: invalidate,
  });
}
