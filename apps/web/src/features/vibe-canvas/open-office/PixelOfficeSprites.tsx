'use client';

import * as React from 'react';
import { memo } from 'react';
import { stringHash } from './pixelOfficeGeometry';
import {
  blitLimeZuCharacterFrame,
  drawCorgiSprite,
  drawOrangeCatSprite,
  getLimeZuAtlasImage,
  resolveLimeZuCharKey,
  subscribeLimeZuAtlas,
  type SpriteDirection,
} from './limezuAtlasEngine';

export interface PixelAgentAvatarProps {
  seed: string;
  status?: string;
  size?: number;
  fullBody?: boolean;
  bobOffset?: number;
  walkPhase?: number;
  dir?: SpriteDirection;
  walkFrame?: number;
  className?: string;
}

export const PixelAgentAvatar = memo(function PixelAgentAvatar({
  seed,
  status = 'IDLE',
  size = 38,
  fullBody = false,
  bobOffset = 0,
  walkPhase = 0,
  dir = 'down',
  walkFrame = 0,
  className = '',
}: PixelAgentAvatarProps) {
  const spriteCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [atlasReady, setAtlasReady] = React.useState<boolean>(() => Boolean(getLimeZuAtlasImage()));

  React.useEffect(() => {
    return subscribeLimeZuAtlas(() => {
      setAtlasReady(Boolean(getLimeZuAtlasImage()));
    });
  }, []);

  const charKey = resolveLimeZuCharKey(seed);
  const computedH = fullBody ? Math.round(size * 1.5) : size;
  const isMoving = walkPhase > 0;

  React.useEffect(() => {
    if (!atlasReady) return;
    const cv = spriteCanvasRef.current;
    if (!cv) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = cv.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    ctx.clearRect(0, 0, size, computedH);
    blitLimeZuCharacterFrame(
      ctx,
      charKey,
      dir,
      isMoving,
      walkFrame,
      size,
      computedH,
      !fullBody,
    );
  }, [atlasReady, charKey, dir, isMoving, walkFrame, size, computedH, fullBody]);

  if (atlasReady) {
    return (
      <canvas
        ref={spriteCanvasRef}
        width={size}
        height={computedH}
        className={className}
        style={{
          width: `${size}px`,
          height: `${computedH}px`,
          imageRendering: 'pixelated',
          transform: bobOffset ? `translateY(${bobOffset}px)` : undefined,
        }}
        aria-hidden="true"
      />
    );
  }

  const hash = stringHash(seed);
  const low = seed.toLowerCase();
  const isMuse = low.includes('muse') || low.includes('design');
  const isAgy = low.includes('antigravity') || low.includes('gemini');
  const isResearch = low.includes('research');
  const isOrch = low.includes('orchestrator');
  const isQa = low.includes('quality');
  const isCodex = low.includes('codex');
  const isClaude = low.includes('claude');
  const isWorking =
    status === 'WORKING' ||
    status === 'ACTIVE' ||
    status === 'BUSY' ||
    status === 'RUNNING' ||
    status === 'AWAITING_HITL';

  const hairPresets = [
    { dark: '#241B18', main: '#3D2E28', mid: '#59433A', hi: '#785B4F' }, // Espresso fade
    { dark: '#4A2416', main: '#7C3E26', mid: '#9E5234', hi: '#C26D4A' }, // Chestnut bob (Alison style)
    { dark: '#171C2B', main: '#27314A', mid: '#3A486B', hi: '#546794' }, // Midnight blue-black
    { dark: '#543518', main: '#8A5A2B', mid: '#AD743B', hi: '#CE9254' }, // Warm caramel
    { dark: '#2E1E3B', main: '#4C3261', mid: '#684785', hi: '#8862AB' }, // Plum
    { dark: '#3B1F42', main: '#6B2D7B', mid: '#9B3EA8', hi: '#D05CD8' }, // Creative Magenta
  ];
  const outfitPresets = [
    { dark: '#1E5448', top: '#2E7D6B', hi: '#4BB39B', pants: '#273042', accent: '#E2E8F0' },
    { dark: '#9C4221', top: '#D96B43', hi: '#F2916B', pants: '#2D3348', accent: '#FEF3C7' },
    { dark: '#244A9E', top: '#3B6FD8', hi: '#6695F2', pants: '#23293A', accent: '#DBEAFE' },
    { dark: '#553163', top: '#7C4D8B', hi: '#A36EB5', pants: '#282A3A', accent: '#F3E8FF' },
    { dark: '#8F5B14', top: '#CA8A04', hi: '#FACC15', pants: '#293040', accent: '#FEF9C3' },
    { dark: '#701A75', top: '#A21CAF', hi: '#E879F9', pants: '#1F2937', accent: '#FDF4FF' }, // Fuchsia / Muse
  ];
  const skins = [
    { base: '#FAD4B4', shade: '#E5B28A', blush: '#F29488' },
    { base: '#F0BD95', shade: '#D49A6E', blush: '#E58073' },
    { base: '#FCE0C8', shade: '#E8BEA0', blush: '#F49D92' },
    { base: '#D99B72', shade: '#BA7B52', blush: '#CF6E63' },
  ];

  const hair = isMuse
    ? hairPresets[5]
    : isAgy
      ? hairPresets[2]
      : isResearch
        ? hairPresets[1]
        : isOrch
          ? hairPresets[0]
          : isQa
            ? hairPresets[4]
            : isClaude
              ? hairPresets[3]
              : hairPresets[hash % hairPresets.length];

  const outfit = isMuse
    ? outfitPresets[5]
    : isAgy
      ? outfitPresets[2]
      : isResearch
        ? outfitPresets[1]
        : isOrch
          ? outfitPresets[0]
          : isQa
            ? outfitPresets[3]
            : isClaude
              ? outfitPresets[4]
              : outfitPresets[hash % outfitPresets.length];

  const skin = skins[hash % skins.length];
  const leftShoeY = walkPhase === 1 ? 26 : 27;
  const rightShoeY = walkPhase === 2 ? 26 : 27;
  const viewH = fullBody ? 31 : 20;
  const svgComputedH = fullBody ? Math.round(size * 1.32) : size;

  return (
    <svg
      width={size}
      height={svgComputedH}
      viewBox={`0 0 24 ${viewH}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ transform: bobOffset ? `translateY(${bobOffset}px)` : undefined }}
      aria-hidden="true"
    >
      {/* Ground oval pixel shadow */}
      {fullBody && (
        <>
          <rect x="6" y="28" width="12" height="2" fill="#181A27" fillOpacity="0.26" />
          <rect x="8" y="27" width="8" height="3" fill="#181A27" fillOpacity="0.18" />
        </>
      )}

      {/* Rounded Chibi Head 1px Pixel Outline (#1B1924) */}
      <rect x="7" y="1" width="10" height="1" fill="#1B1924" />
      <rect x="5" y="2" width="14" height="2" fill="#1B1924" />
      <rect x="4" y="4" width="16" height="10" fill="#1B1924" />
      <rect x="5" y="14" width="14" height="2" fill="#1B1924" />
      <rect x="7" y="16" width="10" height="1" fill="#1B1924" />

      {/* Multi-tone Layered Volumetric Hair */}
      <rect x="7" y="2" width="10" height="2" fill={hair.main} />
      <rect x="5" y="4" width="14" height="4" fill={hair.main} />
      <rect x="8" y="2" width="7" height="2" fill={hair.hi} />
      <rect x="6" y="4" width="4" height="2" fill={hair.mid} />
      <rect x="13" y="4" width="4" height="2" fill={hair.hi} />
      <rect x="5" y="7" width="2" height="6" fill={hair.dark} />
      <rect x="17" y="7" width="2" height="6" fill={hair.dark} />

      {/* Cap accessory for Codex */}
      {isCodex && (
        <>
          <rect x="6" y="2" width="12" height="4" fill="#2E67E6" />
          <rect x="8" y="2" width="7" height="2" fill="#6396FA" />
          <rect x="5" y="5" width="15" height="2" fill="#1E47A8" />
        </>
      )}

      {/* Face & Warm Cheek Shading */}
      <rect x="7" y="7" width="10" height="8" fill={skin.base} />
      <rect x="6" y="8" width="12" height="6" fill={skin.base} />
      <rect x="7" y="14" width="10" height="1" fill={skin.shade} />
      <rect x="6" y="12" width="2" height="1" fill={skin.blush} />
      <rect x="16" y="12" width="2" height="1" fill={skin.blush} />

      {/* Expressive Gather 16-Bit Eyes + Catchlights */}
      <rect x="8" y="9" width="2" height="3" fill="#1B1924" />
      <rect x="14" y="9" width="2" height="3" fill="#1B1924" />
      <rect x="8" y="9" width="1" height="1" fill="#FFFFFF" />
      <rect x="14" y="9" width="1" height="1" fill="#FFFFFF" />

      {/* Glasses for Research / QA */}
      {(isResearch || isQa) && (
        <>
          <rect x="7" y="9" width="4" height="1" fill="#334155" />
          <rect x="13" y="9" width="4" height="1" fill="#334155" />
          <rect x="11" y="10" width="2" height="1" fill="#334155" />
        </>
      )}

      {/* Gather Orange Focus Over-Ear Headphones */}
      {isWorking && (
        <>
          <rect x="6" y="1" width="12" height="1" fill="#E07A22" />
          <rect x="3" y="8" width="2" height="5" fill="#1B1924" />
          <rect x="19" y="8" width="2" height="5" fill="#1B1924" />
          <rect x="3" y="9" width="2" height="3" fill="#F28B30" />
          <rect x="19" y="9" width="2" height="3" fill="#F28B30" />
        </>
      )}

      {/* Rounded Hoodie / Jacket, Arms, Pants & Sneakers */}
      {fullBody && (
        <>
          <rect x="6" y="16" width="12" height="9" fill="#1B1924" />
          <rect x="5" y="17" width="14" height="6" fill="#1B1924" />
          <rect x="7" y="16" width="10" height="7" fill={outfit.top} />
          <rect x="8" y="16" width="8" height="2" fill={outfit.hi} />
          <rect x="10" y="16" width="4" height="2" fill={outfit.accent} />
          <rect x="7" y="21" width="10" height="2" fill={outfit.dark} />
          {/* Arms & Hands */}
          <rect x="5" y="17" width="2" height="4" fill={outfit.top} />
          <rect x="17" y="17" width="2" height="4" fill={outfit.top} />
          <rect x="5" y="21" width="2" height="2" fill={skin.base} />
          <rect x="17" y="21" width="2" height="2" fill={skin.base} />
          {/* Trousers & Crisp White-Sole Sneakers */}
          <rect x="7" y="23" width="10" height="3" fill={outfit.pants} />
          <rect x="11" y="24" width="2" height="2" fill="#1B1924" />
          <rect x="7" y={leftShoeY} width="4" height="2" fill="#1B1924" />
          <rect x="13" y={rightShoeY} width="4" height="2" fill="#1B1924" />
          <rect x="7" y={leftShoeY + 1} width="3" height="1" fill="#F8FAFC" />
          <rect x="14" y={rightShoeY + 1} width="3" height="1" fill="#F8FAFC" />
        </>
      )}
    </svg>
  );
});

export const PixelMascotSprite = memo(function PixelMascotSprite({
  isDog,
  facingLeft,
  walkFrame = 0,
}: {
  isDog: boolean;
  facingLeft: boolean;
  walkFrame?: 0 | 1;
}) {
  const petCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canUseCanvas =
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !/jsdom|HappyDOM/i.test(navigator.userAgent || '');

  const w = isDog ? 35 : 30;
  const h = isDog ? 25 : 22;

  React.useEffect(() => {
    if (!canUseCanvas) return;
    const cv = petCanvasRef.current;
    if (!cv) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = cv.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    if (isDog) {
      drawCorgiSprite(ctx, walkFrame, w, h);
    } else {
      drawOrangeCatSprite(ctx, w, h);
    }
  }, [canUseCanvas, isDog, walkFrame, w, h]);

  if (canUseCanvas) {
    return (
      <canvas
        ref={petCanvasRef}
        width={w}
        height={h}
        style={{
          width: `${w}px`,
          height: `${h}px`,
          imageRendering: 'pixelated',
          transform: facingLeft ? 'scaleX(-1)' : undefined,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      width={30}
      height={26}
      viewBox="0 0 18 16"
      shapeRendering="crispEdges"
      style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <rect x="4" y="13" width="10" height="2" fill="#1B1924" fillOpacity="0.22" />
      {isDog ? (
        <>
          {/* Shiba Inu / Cậu Vàng 16-Bit Sprite */}
          <rect x="4" y="3" width="10" height="9" fill="#1B1924" />
          <rect x="5" y="2" width="2" height="2" fill="#B45309" />
          <rect x="11" y="2" width="2" height="2" fill="#B45309" />
          <rect x="5" y="4" width="8" height="7" fill="#F59E0B" />
          <rect x="6" y="4" width="6" height="2" fill="#FBBF24" />
          <rect x="6" y="7" width="6" height="4" fill="#FEF3C7" />
          <rect x="6" y="6" width="1" height="1" fill="#1B1924" />
          <rect x="11" y="6" width="1" height="1" fill="#1B1924" />
          <rect x="8" y="7" width="2" height="1" fill="#1B1924" />
          <rect x="5" y="9" width="8" height="1" fill="#EF4444" />
          <rect x="13" y="6" width="2" height="3" fill="#F59E0B" />
          <rect x="5" y="11" width="2" height="2" fill="#D97706" />
          <rect x="11" y="11" width="2" height="2" fill="#D97706" />
        </>
      ) : (
        <>
          {/* Calico Cat / Tiểu Thư 16-Bit Sprite */}
          <rect x="4" y="3" width="10" height="9" fill="#1B1924" />
          <rect x="5" y="2" width="2" height="2" fill="#EA580C" />
          <rect x="11" y="2" width="2" height="2" fill="#334155" />
          <rect x="5" y="4" width="8" height="7" fill="#FFFBEB" />
          <rect x="5" y="4" width="4" height="3" fill="#FB923C" />
          <rect x="10" y="4" width="3" height="2" fill="#475569" />
          <rect x="6" y="7" width="1" height="1" fill="#10B981" />
          <rect x="11" y="7" width="1" height="1" fill="#10B981" />
          <rect x="8" y="8" width="2" height="1" fill="#F43F5E" />
          <rect x="13" y="5" width="2" height="5" fill="#FB923C" />
          <rect x="5" y="11" width="2" height="2" fill="#FDE68A" />
          <rect x="11" y="11" width="2" height="2" fill="#FDE68A" />
        </>
      )}
    </svg>
  );
});

