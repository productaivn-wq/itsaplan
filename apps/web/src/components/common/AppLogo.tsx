import ItsAPlanMark from '@/components/brand/ItsAPlanMark';

// The ACCORD Sovereign Isometric Monolith mark (SPEC-DESIGN-SYSTEM-LOGO-263).
// Unified across Auth BrandPanel, Favicons, Sidebar, and Header.
export default function AppLogo({ className }: { className?: string }) {
  return <ItsAPlanMark className={className} />;
}
