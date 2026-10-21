import RequireFeature from '@/components/common/permissions/RequireFeature';
import VibeCanvasPage from '@/features/vibe-canvas/VibeCanvasPage';

export default function Page() {
  return (
    <RequireFeature feature="documents">
      <VibeCanvasPage initialMode="docs" />
    </RequireFeature>
  );
}
