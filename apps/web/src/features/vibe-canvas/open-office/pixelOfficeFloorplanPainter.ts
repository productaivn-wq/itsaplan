import type { DynamicPixelFloorplanSpec, SopRoomThemeDomain } from './openOfficeConstants';
import { STAGE_H, STAGE_W } from './pixelOfficeGeometry';

// ============================================================================
// 16-BIT PIXEL-ART PRIMITIVES (2px Texel Grid — Zero Anti-Aliased Blur)
// ============================================================================

function fillRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawPixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  outline?: string,
  step = 2,
) {
  if (outline) {
    ctx.fillStyle = outline;
    for (let dy = -ry - step; dy <= ry + step; dy += step) {
      for (let dx = -rx - step; dx <= rx + step; dx += step) {
        const nd = (dx * dx) / ((rx + step) * (rx + step)) + (dy * dy) / ((ry + step) * (ry + step));
        if (nd <= 1.0) {
          ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), step, step);
        }
      }
    }
  }
  ctx.fillStyle = fill;
  for (let dy = -ry; dy <= ry; dy += step) {
    for (let dx = -rx; dx <= rx; dx += step) {
      const nd = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (nd <= 1.0) {
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), step, step);
      }
    }
  }
}

function drawRoundedPixelBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline = '#2E3545',
  topHi?: string,
) {
  fillRect(ctx, x + 2, y, w - 4, h, outline);
  fillRect(ctx, x, y + 2, w, h - 4, outline);
  fillRect(ctx, x + 2, y + 2, w - 4, h - 4, fill);
  if (topHi) {
    fillRect(ctx, x + 3, y + 2, w - 6, 2, topHi);
  }
}

function drawLushGatherTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  birchTrunk = true,
) {
  // Dappled lawn shadow
  drawPixelDisc(ctx, cx, cy + 20, 18, 7, '#B4DFB0', '#C6E9C2', 2);

  // Trunk (Paper birch with dark bark notches or warm oak)
  if (birchTrunk) {
    drawRoundedPixelBox(ctx, cx - 5, cy + 2, 10, 20, '#F1F5F9', '#334155');
    fillRect(ctx, cx - 3, cy + 7, 3, 2, '#475569');
    fillRect(ctx, cx + 1, cy + 12, 3, 2, '#334155');
    fillRect(ctx, cx - 2, cy + 16, 2, 2, '#64748B');
  } else {
    drawRoundedPixelBox(ctx, cx - 6, cy + 2, 12, 20, '#A86B43', '#4A2C18');
    fillRect(ctx, cx - 3, cy + 5, 3, 14, '#C48358');
  }

  // Multi-sphere billowing canopy (7 distinct Gather green shades!)
  const clusters = [
    { dx: -11, dy: -2, rx: 12, ry: 10 },
    { dx: 11, dy: -2, rx: 12, ry: 10 },
    { dx: 0, dy: 2, rx: 15, ry: 11 },
    { dx: -8, dy: -12, rx: 12, ry: 10 },
    { dx: 8, dy: -12, rx: 12, ry: 10 },
    { dx: 0, dy: -18, rx: 13, ry: 10 },
  ];
  for (const c of clusters) {
    drawPixelDisc(ctx, cx + c.dx, cy + c.dy + 2, c.rx, c.ry, '#194A27', undefined, 2);
  }
  drawPixelDisc(ctx, cx - 11, cy - 1, 11, 9, '#286E37', undefined, 2);
  drawPixelDisc(ctx, cx + 11, cy - 1, 11, 9, '#286E37', undefined, 2);
  drawPixelDisc(ctx, cx, cy + 2, 14, 9, '#398E44', undefined, 2);
  drawPixelDisc(ctx, cx - 8, cy - 11, 11, 9, '#52B352', undefined, 2);
  drawPixelDisc(ctx, cx + 8, cy - 11, 11, 9, '#52B352', undefined, 2);
  drawPixelDisc(ctx, cx, cy - 16, 12, 9, '#74CF62', undefined, 2);
  drawPixelDisc(ctx, cx - 3, cy - 19, 8, 5, '#9CE678', undefined, 2);
  fillRect(ctx, cx - 5, cy - 21, 6, 2, '#C2F79E');
}

function drawScandinavianBirchFloor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRect(ctx, x, y, w, h, '#F5EBE1');
  const plankH = 12;
  for (let py = y; py < y + h; py += plankH) {
    const rowIdx = Math.floor((py - y) / plankH);
    if (rowIdx % 2 === 0) {
      fillRect(ctx, x, py + 2, w, 3, '#FAF2EA');
    }
    fillRect(ctx, x, py, w, 1, '#EADACB');
    const offset = (rowIdx * 34) % 84;
    for (let px = x + offset; px < x + w - 4; px += 84) {
      fillRect(ctx, px, py + 1, 1, plankH - 1, '#E4D1C0');
    }
  }
}

function drawTBrickSlateCarpet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRect(ctx, x, y, w, h, '#99A6AB');
  fillRect(ctx, x, y, w, 2, '#879499');
  fillRect(ctx, x, y + h - 2, w, 2, '#879499');
  fillRect(ctx, x, y, 2, h, '#879499');
  fillRect(ctx, x + w - 2, y, 2, h, '#879499');

  for (let py = y + 4; py < y + h - 6; py += 12) {
    const row = Math.floor((py - y) / 12);
    const shift = (row % 2) * 8;
    for (let px = x + 4 + shift; px < x + w - 10; px += 16) {
      fillRect(ctx, px, py, 8, 4, '#8C999E');
      fillRect(ctx, px + 2, py + 4, 4, 4, '#8C999E');
      fillRect(ctx, px + 8, py + 4, 6, 2, '#A5B2B7');
    }
  }
}

function drawPeriwinkleWeaveRug(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stripedLounge = false,
) {
  fillRect(ctx, x, y, w, h, '#8D9BE0');
  fillRect(ctx, x, y, w, 2, '#7886CC');
  fillRect(ctx, x, y + h - 2, w, 2, '#7886CC');
  if (stripedLounge) {
    for (let px = x + 6; px < x + w - 8; px += 16) {
      fillRect(ctx, px, y + 2, 8, h - 4, '#8290D6');
      fillRect(ctx, px + 8, y + 4, 2, h - 8, '#98A6E8');
    }
  } else {
    for (let py = y + 4; py < y + h - 6; py += 12) {
      const shift = (Math.floor((py - y) / 12) % 2) * 8;
      for (let px = x + 4 + shift; px < x + w - 10; px += 16) {
        fillRect(ctx, px, py, 8, 4, '#7F8DD4');
        fillRect(ctx, px + 4, py + 6, 6, 3, '#9BA8EA');
      }
    }
  }
}

function drawDiamondIceLatticeRug(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRect(ctx, x, y, w, h, '#EEF3FA');
  fillRect(ctx, x, y, w, 2, '#D5DFEE');
  fillRect(ctx, x, y + h - 2, w, 2, '#D5DFEE');
  const tile = 20;
  for (let py = y + 2; py < y + h - 4; py += tile) {
    for (let px = x + 2; px < x + w - 4; px += tile) {
      for (let s = 0; s < 9; s += 2) {
        const cx = px + 10;
        const cy = py + 10;
        if (cx + s < x + w - 2 && cy - (8 - s) > y + 2) fillRect(ctx, cx + s, cy - (8 - s), 2, 2, '#DCE5F3');
        if (cx - s > x + 2 && cy - (8 - s) > y + 2) fillRect(ctx, cx - s, cy - (8 - s), 2, 2, '#DCE5F3');
        if (cx + s < x + w - 2 && cy + (8 - s) < y + h - 2) fillRect(ctx, cx + s, cy + (8 - s), 2, 2, '#DCE5F3');
        if (cx - s > x + 2 && cy + (8 - s) < y + h - 2) fillRect(ctx, cx - s, cy + (8 - s), 2, 2, '#DCE5F3');
      }
      fillRect(ctx, px + 9, py + 9, 2, 2, '#CFD9EC');
    }
  }
}

function drawGatherPerimeterSuiteWalls(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  doorSide: 'top' | 'bottom',
  doorCenterX: number,
) {
  const cap = '#5A6275';
  const trim = '#DCE0F2';
  const wallFace = '#7E81B5';
  const outline = '#3D4454';
  const doorHalf = 22;

  // Thin crisp side walls
  fillRect(ctx, x, y, 5, h, outline);
  fillRect(ctx, x + 1, y + 1, 3, h - 2, cap);
  fillRect(ctx, x + w - 5, y, 5, h, outline);
  fillRect(ctx, x + w - 4, y + 1, 3, h - 2, cap);

  if (doorSide === 'bottom') {
    fillRect(ctx, x, y, w, 6, outline);
    fillRect(ctx, x + 1, y + 1, w - 2, 4, cap);
    fillRect(ctx, x + 5, y + 6, w - 10, 2, trim);
    fillRect(ctx, x + 5, y + 8, w - 10, 22, wallFace);
    fillRect(ctx, x + 5, y + 28, w - 10, 2, '#626699');

    const lw = Math.max(10, doorCenterX - doorHalf - x);
    fillRect(ctx, x, y + h - 6, lw, 6, outline);
    fillRect(ctx, x + 1, y + h - 5, lw - 2, 4, cap);

    const rx = doorCenterX + doorHalf;
    const rw = Math.max(10, x + w - rx);
    fillRect(ctx, rx, y + h - 6, rw, 6, outline);
    fillRect(ctx, rx + 1, y + h - 5, rw - 2, 4, cap);

    // Warm oak threshold & sliding pocket door leaf
    drawRoundedPixelBox(ctx, doorCenterX - doorHalf, y + h - 6, doorHalf * 2, 6, '#E4B68A', '#7A5432', '#F3CFA9');
    drawRoundedPixelBox(ctx, doorCenterX - doorHalf - 12, y + h - 8, 16, 6, '#D69E6E', '#6B4628');
    fillRect(ctx, doorCenterX - doorHalf - 2, y + h - 6, 3, 2, '#CBD5E1');
  } else {
    const lw = Math.max(10, doorCenterX - doorHalf - x);
    fillRect(ctx, x, y, lw, 6, outline);
    fillRect(ctx, x + 1, y + 1, lw - 2, 4, cap);
    fillRect(ctx, x + 5, y + 6, lw - 6, 2, trim);
    fillRect(ctx, x + 5, y + 8, lw - 6, 18, wallFace);

    const rx = doorCenterX + doorHalf;
    const rw = Math.max(10, x + w - rx);
    fillRect(ctx, rx, y, rw, 6, outline);
    fillRect(ctx, rx + 1, y + 1, rw - 2, 4, cap);
    fillRect(ctx, rx + 1, y + 6, rw - 6, 2, trim);
    fillRect(ctx, rx + 1, y + 8, rw - 6, 18, wallFace);

    drawRoundedPixelBox(ctx, doorCenterX - doorHalf, y, doorHalf * 2, 6, '#E4B68A', '#7A5432', '#F3CFA9');
    drawRoundedPixelBox(ctx, doorCenterX + doorHalf - 4, y - 1, 16, 6, '#D69E6E', '#6B4628');

    fillRect(ctx, x, y + h - 5, w, 5, outline);
    fillRect(ctx, x + 1, y + h - 4, w - 2, 3, cap);
  }
}

function drawErgonomicChair(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  fillRect(ctx, cx - 8, cy + 8, 16, 4, 'rgba(24, 26, 39, 0.2)');
  // Armrests
  fillRect(ctx, cx - 11, cy - 2, 3, 8, '#232834');
  fillRect(ctx, cx + 8, cy - 2, 3, 8, '#232834');
  // Seat & curved mesh backrest
  drawRoundedPixelBox(ctx, cx - 9, cy - 6, 18, 15, '#4A5264', '#232834', '#646E85');
  // X-spine mesh detail (exact crop_desk_pod craft)
  fillRect(ctx, cx - 5, cy - 2, 10, 8, '#363D4D');
  fillRect(ctx, cx - 3, cy, 2, 4, '#232834');
  fillRect(ctx, cx + 1, cy, 2, 4, '#232834');
  fillRect(ctx, cx - 4, cy + 9, 8, 2, '#232834');
}

function drawGatherWorkstation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w = 84,
  preset: 'synthwave' | 'ide' | 'ultrawide' | 'laptop' = 'synthwave',
  propRight: 'lamp' | 'aloe' | 'duck' | 'mug' = 'aloe',
) {
  // Floor drop shadow + ergonomic swivel chair tucked behind desk
  fillRect(ctx, x + 2, y + 25, w - 2, 4, 'rgba(30, 41, 59, 0.16)');
  drawErgonomicChair(ctx, x + Math.round(w / 2), y + 26);

  // Crisp White Tabletop (#F8FAFC) + 3/4 Slate Modesty Apron (#697386)
  drawRoundedPixelBox(ctx, x, y, w, 18, '#F8FAFC', '#50596B', '#FFFFFF');
  fillRect(ctx, x + 2, y + 15, w - 4, 2, '#DCE4EE');
  drawRoundedPixelBox(ctx, x, y + 17, w, 9, '#697386', '#3F4756');
  fillRect(ctx, x + 4, y + 19, 3, 5, '#373E4C');
  fillRect(ctx, x + w - 7, y + 19, 3, 5, '#373E4C');

  if (preset === 'synthwave') {
    // Mini tower + Vaporwave sunset monitor + vertical secondary monitor + blue mech keyboard
    drawRoundedPixelBox(ctx, x + 6, y - 6, 9, 15, '#3A4252', '#1E2430');
    fillRect(ctx, x + 8, y + 3, 3, 4, '#38BDF8');

    drawRoundedPixelBox(ctx, x + 17, y - 8, 26, 16, '#282F3D', '#171B24');
    fillRect(ctx, x + 19, y - 6, 22, 11, '#2E1065');
    fillRect(ctx, x + 19, y - 1, 22, 4, '#EC4899');
    fillRect(ctx, x + 26, y - 4, 8, 4, '#38BDF8');
    fillRect(ctx, x + 28, y + 8, 4, 3, '#475569');

    drawRoundedPixelBox(ctx, x + 45, y - 7, 13, 16, '#282F3D', '#171B24');
    fillRect(ctx, x + 47, y - 5, 9, 12, '#1E293B');
    fillRect(ctx, x + 48, y - 3, 5, 2, '#F59E0B');
    fillRect(ctx, x + 48, y + 1, 6, 2, '#34D399');

    drawRoundedPixelBox(ctx, x + 20, y + 10, 18, 5, '#3B82F6', '#1E3A8A', '#93C5FD');
    drawRoundedPixelBox(ctx, x + 40, y + 11, 5, 4, '#475569', '#1E293B');
  } else if (preset === 'ide') {
    // Dual angled code monitors + pen tablet
    drawRoundedPixelBox(ctx, x + 8, y - 7, 24, 15, '#282F3D', '#171B24');
    fillRect(ctx, x + 10, y - 5, 20, 11, '#0EA5E9');
    fillRect(ctx, x + 12, y - 3, 12, 6, '#E0F2FE');

    drawRoundedPixelBox(ctx, x + 34, y - 8, 16, 16, '#282F3D', '#171B24');
    fillRect(ctx, x + 36, y - 6, 12, 12, '#1E293B');
    fillRect(ctx, x + 38, y - 4, 7, 2, '#FBBF24');
    fillRect(ctx, x + 38, y, 8, 2, '#60A5FA');
    drawRoundedPixelBox(ctx, x + 18, y + 10, 18, 5, '#475569', '#1E293B');
  } else if (preset === 'ultrawide') {
    drawRoundedPixelBox(ctx, x + 8, y - 6, 10, 15, '#333B4C', '#171B24');
    drawRoundedPixelBox(ctx, x + 20, y - 8, 34, 15, '#282F3D', '#171B24');
    fillRect(ctx, x + 22, y - 6, 30, 11, '#38BDF8');
    fillRect(ctx, x + 26, y - 4, 18, 7, '#F8FAFC');
    fillRect(ctx, x + 35, y + 7, 4, 3, '#475569');
    drawRoundedPixelBox(ctx, x + 24, y + 10, 20, 5, '#475569', '#1E293B');
  } else {
    drawRoundedPixelBox(ctx, x + 26, y + 1, 24, 13, '#334155', '#1E293B');
    fillRect(ctx, x + 28, y + 3, 20, 7, '#38BDF8');
    fillRect(ctx, x + 30, y + 4, 9, 4, '#F8FAFC');
  }

  // Right-side personality desk prop
  if (propRight === 'lamp') {
    drawRoundedPixelBox(ctx, x + w - 16, y + 4, 8, 5, '#B45309', '#451A03');
    drawPixelDisc(ctx, x + w - 12, y - 3, 7, 7, '#FDE047', '#CA8A04', 2);
    fillRect(ctx, x + w - 14, y - 6, 4, 3, '#FEF9C3');
  } else if (propRight === 'aloe') {
    drawRoundedPixelBox(ctx, x + w - 16, y + 4, 10, 8, '#EA580C', '#7C2D12', '#FB923C');
    fillRect(ctx, x + w - 15, y - 2, 8, 7, '#16A34A');
    fillRect(ctx, x + w - 13, y - 5, 4, 6, '#4ADE80');
  } else if (propRight === 'duck') {
    drawPixelDisc(ctx, x + w - 15, y + 8, 5, 4, '#FACC15', '#A16207', 2);
    fillRect(ctx, x + w - 18, y + 6, 3, 2, '#EA580C');
    drawRoundedPixelBox(ctx, x + w - 9, y + 8, 6, 7, '#2563EB', '#1E3A8A', '#60A5FA');
  } else {
    drawRoundedPixelBox(ctx, x + w - 14, y + 6, 7, 8, '#7C3AED', '#4C1D95', '#A78BFA');
  }
}

function drawTuftedPeachSofa(ctx: CanvasRenderingContext2D, x: number, y: number, w = 84) {
  fillRect(ctx, x + 2, y + 24, w - 2, 4, 'rgba(30, 41, 59, 0.16)');
  // Steel frame base
  fillRect(ctx, x + 2, y + 21, w - 4, 3, '#475569');
  // Backrest + 3 cushions + button tufts (crop_cafe_beanbags exact craft)
  drawRoundedPixelBox(ctx, x + 5, y, w - 10, 11, '#EBA982', '#7C4D32', '#F7C9AC');
  drawRoundedPixelBox(ctx, x + 5, y + 9, w - 10, 13, '#F4C6A8', '#7C4D32', '#FBE0CE');
  // Armrests
  drawRoundedPixelBox(ctx, x, y + 4, 7, 18, '#E39B72', '#7C4D32', '#F5C2A2');
  drawRoundedPixelBox(ctx, x + w - 7, y + 4, 7, 18, '#E39B72', '#7C4D32', '#F5C2A2');

  const third = Math.round((w - 14) / 3);
  fillRect(ctx, x + 6 + third, y + 1, 1, 19, '#B87652');
  fillRect(ctx, x + 6 + third * 2, y + 1, 1, 19, '#B87652');
  for (let c = 0; c < 3; c++) {
    const bx = x + 10 + c * third;
    fillRect(ctx, bx, y + 4, 2, 2, '#9E5E3B');
    fillRect(ctx, bx + 7, y + 4, 2, 2, '#9E5E3B');
    fillRect(ctx, bx, y + 13, 2, 2, '#B87652');
    fillRect(ctx, bx + 7, y + 13, 2, 2, '#B87652');
  }
}

function drawPlumpBeanbag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  main: string,
  hi: string,
  shade: string,
  outline: string,
) {
  drawPixelDisc(ctx, cx, cy + 5, 11, 7, 'rgba(30, 41, 59, 0.16)', undefined, 2);
  drawPixelDisc(ctx, cx, cy, 11, 10, main, outline, 2);
  drawPixelDisc(ctx, cx - 2, cy - 2, 7, 6, hi, undefined, 2);
  fillRect(ctx, cx - 1, cy - 3, 4, 6, shade);
  fillRect(ctx, cx + 1, cy + 1, 3, 4, shade);
}

function drawLushPottedMonstera(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  drawPixelDisc(ctx, cx, cy + 10, 9, 4, 'rgba(30, 41, 59, 0.16)', undefined, 2);
  drawPixelDisc(ctx, cx, cy + 5, 8, 7, '#CBD5E1', '#475569', 2);
  fillRect(ctx, cx - 5, cy + 2, 10, 3, '#E2E8F0');
  // Fan-shaped tropical leaves
  drawPixelDisc(ctx, cx - 7, cy - 4, 6, 4, '#2E8B47', '#194A27', 2);
  drawPixelDisc(ctx, cx + 7, cy - 4, 6, 4, '#2E8B47', '#194A27', 2);
  drawPixelDisc(ctx, cx - 4, cy - 9, 6, 5, '#48B55B', '#194A27', 2);
  drawPixelDisc(ctx, cx + 4, cy - 9, 6, 5, '#48B55B', '#194A27', 2);
  drawPixelDisc(ctx, cx, cy - 6, 5, 6, '#74D96A', undefined, 2);
}

function drawModernBookcase(ctx: CanvasRenderingContext2D, x: number, y: number, w = 58) {
  drawRoundedPixelBox(ctx, x, y, w, 28, '#94A3B8', '#3E4859', '#CBD5E1');
  const bookColors = ['#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#EF4444'];
  for (let row = 0; row < 2; row++) {
    const sy = y + 5 + row * 10;
    fillRect(ctx, x + 4, sy, w - 8, 8, '#475569');
    for (let bx = x + 6, idx = row * 3; bx < x + w - 8; bx += 6, idx++) {
      fillRect(ctx, bx, sy + 1, 4, 7, bookColors[idx % bookColors.length]);
    }
  }
}

function drawGatherFloorplan(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;

  // 0) WEST EXTERIOR GARDEN COURTYARD (x = 0..54) — Rich 7-shade Pixel Foliage & Wildflowers
  fillRect(ctx, 0, 0, 56, STAGE_H, '#D6F0CE');
  for (let gy = 16; gy < STAGE_H - 12; gy += 36) {
    fillRect(ctx, 8, gy, 6, 2, '#BBE3B3');
    fillRect(ctx, 34, gy + 16, 6, 2, '#A7D99E');
    fillRect(ctx, 14, gy + 22, 2, 2, gy % 72 === 0 ? '#F472B6' : '#FACC15');
    fillRect(ctx, 40, gy + 6, 2, 2, '#FFFFFF');
  }
  drawLushGatherTree(ctx, 26, 74, true);
  drawLushGatherTree(ctx, 24, 214, false);
  drawLushGatherTree(ctx, 26, 368, true);
  drawLushGatherTree(ctx, 24, 508, false);

  // Exterior Architectural Perimeter Frame
  fillRect(ctx, 54, 0, STAGE_W - 54, STAGE_H, '#3E4554');
  fillRect(ctx, 55, 1, STAGE_W - 56, STAGE_H - 2, '#5A6275');

  // 1) WARM SCANDINAVIAN BIRCH OPEN FLOOR (Generous Open Walkways ~ 34% of Stage)
  drawScandinavianBirchFloor(ctx, 60, 6, STAGE_W - 66, STAGE_H - 12);

  // ==========================================================================
  // TOP ZONE ROW (y = 10..180) — 2 Open DeskIsland Pods + 1 Executive Suite
  // ==========================================================================

  // A) BA-Tester Open DeskIsland Pod (x = 76..294, y = 30..176 — ZERO walls!)
  drawTBrickSlateCarpet(ctx, 76, 30, 218, 146);
  drawGatherWorkstation(ctx, 88, 52, 88, 'synthwave', 'aloe');
  drawGatherWorkstation(ctx, 192, 52, 88, 'ide', 'lamp');
  drawGatherWorkstation(ctx, 140, 128, 92, 'ultrawide', 'duck');
  // Rolling lime suitcase & glass drink mini-fridge (Gather Product Pod Easter eggs!)
  drawRoundedPixelBox(ctx, 84, 126, 18, 24, '#5AD178', '#226939', '#8CF0A3');
  drawRoundedPixelBox(ctx, 266, 128, 20, 26, '#CBD5E1', '#475569', '#F8FAFC');
  fillRect(ctx, 270, 136, 12, 14, '#7DD3FC');

  // B) Phòng Điều Hành Executive Suite (x = 330..654, y = 10..178)
  drawPeriwinkleWeaveRug(ctx, 336, 36, 312, 136, false);
  drawGatherPerimeterSuiteWalls(ctx, 330, 10, 324, 168, 'bottom', 492);
  // Panoramic Teal Glass Windows + Framed Art + Fish Aquarium + Espresso & Water Cooler
  drawRoundedPixelBox(ctx, 362, 15, 76, 20, '#A5E2E6', '#475569', '#CCF2F4');
  fillRect(ctx, 399, 15, 2, 20, '#5A6275');
  drawRoundedPixelBox(ctx, 548, 15, 80, 20, '#A5E2E6', '#475569', '#CCF2F4');
  fillRect(ctx, 587, 15, 2, 20, '#5A6275');
  drawRoundedPixelBox(ctx, 476, 15, 32, 18, '#FFFFFF', '#334155');
  fillRect(ctx, 481, 19, 10, 9, '#F59E0B');
  fillRect(ctx, 493, 22, 9, 7, '#334155');
  // Fish Aquarium
  drawRoundedPixelBox(ctx, 342, 42, 36, 20, '#67D4E8', '#2B3548', '#A5F3FC');
  fillRect(ctx, 350, 50, 6, 3, '#F97316');
  fillRect(ctx, 364, 53, 5, 3, '#FB923C');
  // Espresso Counter + Water Cooler
  drawRoundedPixelBox(ctx, 566, 42, 54, 18, '#F8FAFC', '#475569');
  drawRoundedPixelBox(ctx, 574, 35, 14, 12, '#334155', '#1E293B');
  drawRoundedPixelBox(ctx, 626, 36, 16, 24, '#60A5FA', '#1E40AF', '#93C5FD');
  // Executive Desks
  drawGatherWorkstation(ctx, 446, 86, 92, 'ultrawide', 'lamp');
  drawGatherWorkstation(ctx, 348, 114, 82, 'laptop', 'mug');
  drawLushPottedMonstera(ctx, 632, 150);

  // C) AI-Dev Open DeskIsland Pod (x = 694..938, y = 30..176 — ZERO walls!)
  drawTBrickSlateCarpet(ctx, 694, 30, 244, 146);
  drawGatherWorkstation(ctx, 706, 52, 90, 'synthwave', 'duck');
  drawGatherWorkstation(ctx, 812, 52, 90, 'ide', 'lamp');
  drawGatherWorkstation(ctx, 766, 128, 96, 'ultrawide', 'aloe');
  // Blinking LED Swarm Rack + Potted Plant
  drawRoundedPixelBox(ctx, 910, 48, 20, 44, '#262E40', '#141824', '#3B465E');
  fillRect(ctx, 914, 55, 12, 3, '#34D399');
  fillRect(ctx, 914, 63, 12, 3, '#38BDF8');
  fillRect(ctx, 914, 71, 12, 3, '#A78BFA');
  drawLushPottedMonstera(ctx, 712, 150);

  // ==========================================================================
  // UPPER PROMENADE (y = 180..222) — 100% Unobstructed Warm Birch Walkway!
  // MIDDLE OPEN LOUNGE & CAFE ISLANDS (y = 224..340) — ZERO Walls!
  // ==========================================================================

  // West Periwinkle Social & Ping-Pong Lounge Island (x = 96..396, y = 224..340)
  drawPeriwinkleWeaveRug(ctx, 96, 224, 300, 116, true);
  // Bamboo planter trough inside top-left of lounge rug
  drawRoundedPixelBox(ctx, 106, 222, 46, 14, '#475569', '#1E293B');
  for (let bx = 112; bx <= 144; bx += 8) {
    fillRect(ctx, bx, 208, 4, 16, '#48B55B');
    fillRect(ctx, bx - 2, 206, 6, 4, '#74D96A');
  }
  // Pixel Ping-Pong Table + Net + Red/Blue Paddles
  drawRoundedPixelBox(ctx, 108, 254, 52, 74, '#4EB075', '#23593A', '#6ED194');
  fillRect(ctx, 112, 258, 44, 1, '#FFFFFF');
  fillRect(ctx, 112, 323, 44, 1, '#FFFFFF');
  fillRect(ctx, 134, 258, 1, 66, '#FFFFFF');
  fillRect(ctx, 105, 290, 58, 3, '#E2E8F0');
  drawPixelDisc(ctx, 122, 270, 4, 4, '#EF4444', '#7F1D1D', 2);
  drawPixelDisc(ctx, 146, 312, 4, 4, '#3B82F6', '#1E3A8A', 2);
  fillRect(ctx, 136, 282, 2, 2, '#FFFFFF');

  // Tufted Peach Sofa + Mid-Century Armchair + Coffee Table + Palm
  drawTuftedPeachSofa(ctx, 204, 228, 86);
  drawRoundedPixelBox(ctx, 302, 232, 26, 24, '#ED894E', '#7C3A16', '#F7AD80');
  drawRoundedPixelBox(ctx, 218, 274, 58, 26, '#E2B484', '#785332', '#F2CCA2');
  drawRoundedPixelBox(ctx, 238, 279, 18, 12, '#E2E8F0', '#475569');
  fillRect(ctx, 241, 281, 12, 6, '#38BDF8');
  drawLushPottedMonstera(ctx, 368, 314);

  // Central Open Birch Atrium Medallion (x = 456..500, y = 266..298)
  const primaryColor =
    typeof window !== 'undefined'
      ? getComputedStyle(ctx.canvas).getPropertyValue('--primary').trim() || '#6366F1'
      : '#6366F1';
  drawPixelDisc(ctx, 478, 282, 22, 14, '#EAD7C4', '#D6BFA8', 2);
  drawPixelDisc(ctx, 478, 282, 8, 6, primaryColor, undefined, 2);

  // East Diamond Ice-Lattice Cafe & Beanbag Island (x = 560..926, y = 224..340)
  drawDiamondIceLatticeRug(ctx, 560, 224, 366, 116);
  drawModernBookcase(ctx, 568, 220, 58);
  drawModernBookcase(ctx, 860, 220, 58);
  drawTuftedPeachSofa(ctx, 694, 226, 92);

  // Round Pixel Oak Coffee Table + Purple Carafe + Pizza Box (exact crop_cafe_beanbags craft!)
  drawPixelDisc(ctx, 740, 292, 30, 17, 'rgba(30, 41, 59, 0.16)', undefined, 2);
  drawPixelDisc(ctx, 740, 286, 28, 16, '#ECC389', '#7C532E', 2);
  drawPixelDisc(ctx, 738, 284, 22, 11, '#F5D4A4', undefined, 2);
  drawRoundedPixelBox(ctx, 746, 274, 10, 11, '#8B5CF6', '#4C1D95', '#C4B5FD');
  drawRoundedPixelBox(ctx, 720, 280, 16, 13, '#F8FAFC', '#64748B');
  fillRect(ctx, 723, 283, 10, 7, '#F59E0B');
  fillRect(ctx, 726, 285, 3, 3, '#EF4444');

  // 4 Plump Rounded Kidney Beanbags!
  drawPlumpBeanbag(ctx, 650, 274, '#2B84EA', '#62A8F8', '#1D5BB0', '#163B73');
  drawPlumpBeanbag(ctx, 650, 312, '#F0569C', '#F888BC', '#BD2D70', '#731943');
  drawPlumpBeanbag(ctx, 828, 274, '#9B62E8', '#BC92F6', '#6D37BA', '#421E73');
  drawPlumpBeanbag(ctx, 828, 312, '#2B84EA', '#62A8F8', '#1D5BB0', '#163B73');
  drawLushPottedMonstera(ctx, 900, 314);

  // ==========================================================================
  // LOWER PROMENADE (y = 342..382) — 100% Open Warm Birch Walkway!
  // BOTTOM 4 GATHER SUITES (y = 384..548) — Separated by 20px Birch Corridors
  // ==========================================================================

  // 1) Đào Tạo Library & Academy Suite (x = 72..258, y = 384..548)
  drawTBrickSlateCarpet(ctx, 77, 410, 176, 132);
  drawGatherPerimeterSuiteWalls(ctx, 72, 384, 186, 164, 'top', 165);
  drawModernBookcase(ctx, 82, 404, 62);
  // Framed mountain poster + round study table with 4 blue chairs
  drawRoundedPixelBox(ctx, 198, 391, 24, 18, '#DBEAFE', '#334155');
  fillRect(ctx, 202, 399, 16, 7, '#10B981');
  drawPixelDisc(ctx, 166, 486, 22, 16, '#CBD5E1', '#475569', 2);
  drawRoundedPixelBox(ctx, 160, 480, 12, 10, '#48B55B', '#1E4620');
  drawRoundedPixelBox(ctx, 156, 456, 20, 12, '#3B82F6', '#1E3A8A', '#60A5FA');
  drawRoundedPixelBox(ctx, 156, 506, 20, 12, '#3B82F6', '#1E3A8A', '#60A5FA');
  drawRoundedPixelBox(ctx, 128, 479, 14, 16, '#3B82F6', '#1E3A8A', '#60A5FA');
  drawRoundedPixelBox(ctx, 192, 479, 14, 16, '#3B82F6', '#1E3A8A', '#60A5FA');

  // 2) Phòng Họp Boardroom Suite (x = 278..498, y = 384..548)
  drawDiamondIceLatticeRug(ctx, 283, 410, 210, 132);
  drawGatherPerimeterSuiteWalls(ctx, 278, 384, 220, 164, 'top', 388);
  // Warm Oak Conference Table + 6 Rounded Leather Chairs
  fillRect(ctx, 324, 498, 132, 6, 'rgba(30, 41, 59, 0.16)');
  drawRoundedPixelBox(ctx, 322, 454, 132, 46, '#C88D5D', '#5E3A1E', '#DEB086');
  drawRoundedPixelBox(ctx, 372, 468, 30, 18, '#E2E8F0', '#475569', '#FFFFFF');
  for (let cx = 336; cx <= 424; cx += 42) {
    drawRoundedPixelBox(ctx, cx, 436, 22, 15, '#D98E62', '#5E3A1E', '#ECA982');
    drawRoundedPixelBox(ctx, cx, 504, 22, 15, '#D98E62', '#5E3A1E', '#ECA982');
  }
  drawLushPottedMonstera(ctx, 298, 520);

  // 3) HCNS People & Vault Suite (x = 518..716, y = 384..548 — Warm Birch Interior!)
  drawGatherPerimeterSuiteWalls(ctx, 518, 384, 198, 164, 'top', 618);
  drawGatherWorkstation(ctx, 532, 440, 80, 'laptop', 'aloe');
  drawGatherWorkstation(ctx, 622, 440, 80, 'ide', 'lamp');
  drawRoundedPixelBox(ctx, 532, 510, 48, 26, '#94A3B8', '#334155', '#CBD5E1');
  fillRect(ctx, 555, 512, 2, 22, '#475569');
  drawRoundedPixelBox(ctx, 686, 504, 16, 30, '#60A5FA', '#1E40AF', '#93C5FD');

  // 4) Kinh Doanh Commercial Suite (x = 736..942, y = 384..548)
  drawPeriwinkleWeaveRug(ctx, 741, 410, 196, 132, false);
  drawGatherPerimeterSuiteWalls(ctx, 736, 384, 206, 164, 'top', 840);
  drawRoundedPixelBox(ctx, 750, 391, 56, 18, '#F8FAFC', '#334155');
  fillRect(ctx, 756, 396, 12, 4, '#3B82F6');
  fillRect(ctx, 772, 400, 14, 4, '#10B981');
  fillRect(ctx, 790, 395, 10, 6, '#F59E0B');
  drawGatherWorkstation(ctx, 750, 440, 82, 'synthwave', 'mug');
  drawGatherWorkstation(ctx, 844, 440, 82, 'ultrawide', 'duck');
  drawTuftedPeachSofa(ctx, 788, 512, 86);
  drawLushPottedMonstera(ctx, 918, 520);
}

let cachedFloorplanCanvas: HTMLCanvasElement | null = null;

export function ensureFloorplanCanvasCached(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!cachedFloorplanCanvas) {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = STAGE_W;
      offscreen.height = STAGE_H;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;
      drawGatherFloorplan(offCtx);
      cachedFloorplanCanvas = offscreen;
    } catch {
      return null;
    }
  }
  return cachedFloorplanCanvas;
}

if (
  typeof window !== 'undefined' &&
  typeof window.requestIdleCallback === 'function' &&
  window.location.port !== ''
) {
  window.requestIdleCallback(() => {
    ensureFloorplanCanvasCached();
  });
}

export function paintCachedGatherFloorplan(ctx: CanvasRenderingContext2D) {
  const offscreen = ensureFloorplanCanvasCached();
  if (!offscreen) {
    drawGatherFloorplan(ctx);
    return;
  }
  ctx.drawImage(offscreen, 0, 0);
}

const DOMAIN_FALLBACK_CARPET: Record<SopRoomThemeDomain, 'slate' | 'periwinkle' | 'diamond'> = {
  SPINE: 'periwinkle',
  SEC_QA: 'slate',
  STRATEGY: 'periwinkle',
  CODING: 'slate',
  RESEARCH: 'slate',
  ANALYTICS: 'diamond',
  LEGAL: 'periwinkle',
  OPERATIONS: 'slate',
  STUDIO: 'diamond',
  FINANCE: 'periwinkle',
  CUSTOM: 'slate',
};

export function paintDynamicGatherFloorplan(
  ctx: CanvasRenderingContext2D,
  floorplanSpec: DynamicPixelFloorplanSpec,
  workingCountByRoom: Record<string, number>,
  hitlCountByRoom: Record<string, number>,
  selectedZoneId: string | null,
) {
  ctx.imageSmoothingEnabled = false;
  if (!floorplanSpec || floorplanSpec.rooms.length === 0) {
    paintCachedGatherFloorplan(ctx);
  } else {
    // Procedural Birch & Perimeter Stage for arbitrary N SOP suites
    fillRect(ctx, 0, 0, 56, STAGE_H, '#D6F0CE');
    drawLushGatherTree(ctx, 26, 74, true);
    drawLushGatherTree(ctx, 24, 214, false);
    drawLushGatherTree(ctx, 26, 368, true);
    drawLushGatherTree(ctx, 24, 508, false);
    fillRect(ctx, 54, 0, STAGE_W - 54, STAGE_H, '#3E4554');
    fillRect(ctx, 55, 1, STAGE_W - 56, STAGE_H - 2, '#5A6275');
    drawScandinavianBirchFloor(ctx, 60, 6, STAGE_W - 66, STAGE_H - 12);

    const tileW = (STAGE_W - 76) / 24;
    const tileH = (STAGE_H - 20) / 14;
    const sx = (tx: number) => Math.round(64 + tx * tileW);
    const sy = (ty: number) => Math.round(10 + ty * tileH);

    // Paint Spine corridor lounge
    const spine = floorplanSpec.spineRoom;
    const [s0, sr0, s1, sr1] = spine.tileRect;
    const spX = sx(s0);
    const spY = sy(sr0);
    const spW = sx(s1) - spX;
    const spH = sy(sr1) - spY;
    drawPeriwinkleWeaveRug(ctx, spX + 16, spY + 14, Math.max(80, spW - 32), Math.max(40, spH - 28), true);
    drawTuftedPeachSofa(ctx, spX + 68, spY + 24, 82);
    drawPixelDisc(ctx, spX + Math.round(spW / 2), spY + Math.round(spH / 2), 18, 12, '#EAD7C4', '#D6BFA8', 2);
    drawLushPottedMonstera(ctx, spX + spW - 38, spY + Math.round(spH / 2));

    // Paint N-1 Specialist SOP Suites procedurally
    for (const rm of floorplanSpec.rooms) {
      if (rm.isSpine || rm.canonicalId === spine.canonicalId) continue;
      const [rx0, ry0, rx1, ry1] = rm.tileRect;
      const x = sx(rx0);
      const y = sy(ry0);
      const w = sx(rx1) - x;
      const h = sy(ry1) - y;
      const doorSide = ry0 === 0 ? 'bottom' : 'top';
      const doorObj = floorplanSpec.doors.find((d) => d.roomCanonicalId === rm.canonicalId);
      const doorCx = doorObj ? sx(doorObj.x + 0.5) : x + Math.round(w / 2);

      const carpet = DOMAIN_FALLBACK_CARPET[rm.themeDomain] || 'slate';
      if (carpet === 'periwinkle') {
        drawPeriwinkleWeaveRug(ctx, x + 8, y + 26, Math.max(40, w - 16), Math.max(40, h - 34), false);
      } else if (carpet === 'diamond') {
        drawDiamondIceLatticeRug(ctx, x + 8, y + 26, Math.max(40, w - 16), Math.max(40, h - 34));
      } else {
        drawTBrickSlateCarpet(ctx, x + 8, y + 26, Math.max(40, w - 16), Math.max(40, h - 34));
      }

      drawGatherPerimeterSuiteWalls(ctx, x, y, w, h, doorSide, doorCx);

      // Domain signature props + dynamic desk count
      if (rm.themeDomain === 'RESEARCH' || rm.themeDomain === 'LEGAL') {
        drawModernBookcase(ctx, x + 12, y + 22, Math.min(54, Math.max(32, w - 28)));
      } else if (rm.themeDomain === 'SEC_QA' || rm.themeDomain === 'CODING') {
        drawRoundedPixelBox(ctx, Math.max(x + 12, x + w - 28), y + 36, 16, 36, '#262E40', '#141824', '#3B465E');
        fillRect(ctx, Math.max(x + 15, x + w - 25), y + 42, 10, 3, '#34D399');
      } else if (rm.themeDomain === 'STUDIO' || rm.themeDomain === 'STRATEGY') {
        drawRoundedPixelBox(ctx, x + Math.round(w / 2) - 24, y + 12, 48, 16, '#1E293B', '#475569', '#38BDF8');
      }

      const deskCols = Math.max(1, Math.min(3, rm.seatCapacity));
      const deskW = Math.max(46, Math.min(82, Math.floor((w - 28) / deskCols) - 6));
      for (let di = 0; di < Math.min(rm.seatCapacity, 6); di++) {
        const col = di % deskCols;
        const row = Math.floor(di / deskCols);
        const dx = x + 14 + col * (deskW + 8);
        const dy = y + 46 + row * 56;
        if (dx + deskW < x + w - 8 && dy + 28 < y + h - 8) {
          drawGatherWorkstation(
            ctx,
            dx,
            dy,
            deskW,
            rm.themeDomain === 'CODING' ? 'ide' : rm.themeDomain === 'STUDIO' ? 'synthwave' : 'laptop',
            di % 2 === 0 ? 'aloe' : 'lamp',
          );
        }
      }
    }
  }

  // Highlight active/selected rooms crisply
  for (const rm of floorplanSpec.rooms) {
    const activeCnt = workingCountByRoom[rm.canonicalId] || 0;
    const hitlCnt = hitlCountByRoom[rm.canonicalId] || 0;
    const isSel = selectedZoneId === rm.canonicalId;
    if (activeCnt > 0 || hitlCnt > 0 || isSel) {
      const rx = Math.round((rm.pctRect.x * STAGE_W) / 100) + 4;
      const ry = Math.round((rm.pctRect.y * STAGE_H) / 100) + 4;
      const rw = Math.max(20, Math.round((rm.pctRect.w * STAGE_W) / 100) - 8);
      const rh = Math.max(20, Math.round((rm.pctRect.h * STAGE_H) / 100) - 8);
      ctx.strokeStyle = isSel ? 'rgba(56,189,248,0.65)' : hitlCnt > 0 ? 'rgba(245,158,11,0.65)' : 'rgba(16,185,129,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }
}

