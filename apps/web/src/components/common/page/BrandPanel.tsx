import { useTranslations } from 'next-intl';
import { APP_NAME, APP_TAGLINE } from '@/utils/app';
import AppLogo from '@/components/common/AppLogo';
import { AccordWordmarkSvg } from '@/components/brand/ItsAPlanMark';

// ACCORD Sovereign Agentic OS Brand Panel ("Milled Carbon & Swiss Vellum" v3.3.0)
export default function BrandPanel({ subtitle }: { subtitle?: string }) {
  const t = useTranslations('common');
  return (
    <div
      data-brand-panel="accord-sovereign-os"
      className="relative hidden flex-col items-center justify-center gap-4 border-l border-[#222734] bg-[#07080A] p-8 text-[#F4F4F0] md:flex"
    >
      <AppLogo className="size-16" />
      <AccordWordmarkSvg className="h-7 w-auto text-[#F4F4F0]" />
      <span className="sr-only">{APP_NAME}</span>
      <p className="font-mono text-[11px] font-semibold tracking-widest text-[#56C2F6] uppercase">
        {APP_TAGLINE}
      </p>
      <p className="max-w-[18rem] text-center text-xs leading-relaxed text-[#B8C0CC]">
        {subtitle ?? t('brandSubtitle')}
      </p>
      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-[#7D8796]">
        <span className="inline-flex items-center gap-1 rounded border border-[#222734] bg-[#0C0E12] px-2 py-0.5 text-[#E5A93C]">
          HUM
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-[#222734] bg-[#0C0E12] px-2 py-0.5 text-[#2AC38A]">
          DET P=1
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-[#222734] bg-[#0C0E12] px-2 py-0.5 text-[#56C2F6]">
          AGT
        </span>
      </div>
    </div>
  );
}
