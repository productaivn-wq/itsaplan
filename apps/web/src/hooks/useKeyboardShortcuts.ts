import { useEffect } from 'react';
import type { WorkItemsView } from '@/utils/viewTypes';
import { isTypingTarget, type HotkeyId } from '@/utils/hotkeys';
import { useHotkeyMatch } from '@/context/useHotkeys';

const VIEW_HOTKEYS: [HotkeyId, WorkItemsView][] = [
  ['view.kanban', 'kanban'],
  ['view.table', 'table'],
  ['view.timeline', 'timeline'],
  ['view.calendar', 'calendar'],
];

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: 'project.settings' keyboard shortcut removed.
export function useKeyboardShortcuts(opts: {
  hasProject: boolean;
  hasChat: boolean;
  overlayOpen: boolean;
  onToggleCommand: () => void;
  onChangeView: (view: WorkItemsView) => void;
  onNewIssue: () => void;
  onNewInitiative: () => void;
  onNewProject: () => void;
  onSettings?: () => void;
  onToggleChat: () => void;
}) {
  const {
    hasProject,
    hasChat,
    overlayOpen,
    onToggleCommand,
    onChangeView,
    onNewIssue,
    onNewInitiative,
    onNewProject,
    onToggleChat,
  } = opts;
  const matches = useHotkeyMatch();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (matches(e, 'palette.toggle')) {
        e.preventDefault();
        onToggleCommand();
        return;
      }
      if (isTypingTarget(e.target) || overlayOpen) return;

      if (hasProject) {
        for (const [id, view] of VIEW_HOTKEYS) {
          if (matches(e, id)) {
            e.preventDefault();
            onChangeView(view);
            return;
          }
        }
      }
      if (hasProject && matches(e, 'issue.new')) {
        e.preventDefault();
        onNewIssue();
        return;
      }
      if (hasProject && matches(e, 'initiative.new')) {
        e.preventDefault();
        onNewInitiative();
        return;
      }
      if (matches(e, 'project.new')) {
        e.preventDefault();
        onNewProject();
        return;
      }
      if (hasChat && matches(e, 'chat.toggle')) {
        e.preventDefault();
        onToggleChat();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hasProject,
    hasChat,
    overlayOpen,
    matches,
    onToggleCommand,
    onChangeView,
    onNewIssue,
    onNewInitiative,
    onNewProject,
    onToggleChat,
  ]);
}
