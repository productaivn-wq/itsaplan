import { APP_NAME, APP_TAGLINE } from '@/utils/app';
import AppLogo from '@/components/common/AppLogo';
import { AccordWordmarkSvg } from '@/components/brand/ItsAPlanMark';

// ACCORD Sovereign Agentic OS Brand Panel ("Milled Carbon & Swiss Vellum" v3.3.0)
export default function BrandPanel({ subtitle }: { subtitle?: string }) {
  const showSubtitle = Boolean(
    subtitle && subtitle.trim().toLowerCase() !== APP_TAGLINE.trim().toLowerCase(),
  );
  return (
    <div
      data-brand-panel="accord-sovereign-os"
      className="relative hidden flex-col items-center justify-center gap-4 border-l border-border/75 bg-muted/45 p-8 text-foreground md:flex"
    >
      <AppLogo className="size-16" />
      <AccordWordmarkSvg className="h-7 w-auto text-foreground" />
      <span className="sr-only">{APP_NAME}</span>
      <p className="max-w-[18rem] text-center font-mono text-xs font-medium tracking-wider text-primary">
        {APP_TAGLINE}
      </p>
      {showSubtitle && (
        <p className="max-w-[18rem] text-center text-xs leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
