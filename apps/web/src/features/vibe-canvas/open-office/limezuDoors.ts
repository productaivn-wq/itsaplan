import type { DynamicPixelFloorplanSpec, DynamicTileRoomSpec } from './openOfficeConstants';
import { LIMEZU_STAGE_H, LIMEZU_STAGE_W, TILE } from './limezuTypes';
import { routeLimeZuPixels } from './limezuNavigation';

// ============================================================================
// V35 ANIMATED 7-DOOR SWING OVERLAY (LIANG-BARSKY ANTI-GHOST-OPEN)
// ============================================================================

export interface LimeZuDoorState {
  id: string;
  label: string;
  x: number;
  band: number;
  rx0: number;
  ry0: number;
  rx1: number;
  ry1: number;
  nN: readonly [number, number];
  nS: readonly [number, number];
  swing: 1 | -1;
  ang: number;
  target: 0 | 1;
  state: 'closed' | 'opening' | 'open' | 'closing';
  occupied: boolean;
  emptySince: number | null;
  patchColors?: { n: string; s: string } | null;
}

export interface DoorActorInput {
  x: number; // tile coordinate
  y: number; // tile coordinate
  moving: boolean;
  kind: 'char' | 'pet';
  pathTiles?: ReadonlyArray<readonly [number, number]> | null;
  dirX?: number;
  dirY?: number;
}

const DOOR_OPEN_MS = 250;
const DOOR_CLOSE_MS = 200;
const DOOR_HOLD_MS = 300;
const DOOR_MAX_SWING = 1.35;
const DOOR_EXT_CH = 0.5;
const DOOR_EXT_PET = 0.55;

function makeMainDoor(
  id: string,
  label: string,
  x: number,
  band: number,
  nN: readonly [number, number],
  nS: readonly [number, number],
): LimeZuDoorState {
  return {
    id,
    label,
    x,
    band,
    rx0: x,
    ry0: band,
    rx1: x + 1,
    ry1: band + 1.44,
    nN,
    nS,
    swing: band === 5 ? 1 : -1,
    ang: 0,
    target: 0,
    state: 'closed',
    occupied: false,
    emptySince: null,
    patchColors: null,
  };
}

export function createLimeZuDoors(): LimeZuDoorState[] {
  return [
    makeMainDoor('D1', 'BA-TESTER ↔ Đại sảnh', 3, 5, [3.5, 4.55], [3.5, 6.6]),
    makeMainDoor('D2', 'Điều hành ↔ Đại sảnh', 11, 5, [11.5, 4.55], [11.35, 6.6]),
    makeMainDoor('D3', 'AI-DEV ↔ Đại sảnh', 20, 5, [20.5, 4.55], [20.5, 6.6]),
    makeMainDoor('D4', 'Đào tạo ↔ Đại sảnh', 4, 9, [4.5, 8.55], [4.9, 11.5]),
    makeMainDoor('D5', 'Họp ↔ Đại sảnh', 11, 9, [11.5, 8.55], [11.5, 10.65]),
    makeMainDoor('D6', 'HCNS ↔ Đại sảnh', 16, 9, [16.5, 8.55], [16.5, 10.65]),
    makeMainDoor('D7', 'Kinh doanh ↔ Đại sảnh', 21, 9, [21.5, 8.55], [21.6, 10.7]),
  ];
}

export function createDynamicLimeZuDoors(
  floorplanSpec?: DynamicPixelFloorplanSpec | null,
): LimeZuDoorState[] {
  if (!floorplanSpec || floorplanSpec.isClassicEightLayout) {
    return createLimeZuDoors();
  }
  return floorplanSpec.doors.map((d) =>
    makeMainDoor(d.id, d.label, d.x, d.band, d.roomPoint, d.spinePoint),
  );
}

export function routeDynamicLimeZuPixels(
  x0Px: number,
  y0Px: number,
  x1Px: number,
  y1Px: number,
  floorplanSpec?: DynamicPixelFloorplanSpec | null,
): Array<{ x: number; y: number }> {
  if (!floorplanSpec || floorplanSpec.isClassicEightLayout) {
    return routeLimeZuPixels(x0Px, y0Px, x1Px, y1Px);
  }
  const tx0 = x0Px / TILE;
  const ty0 = y0Px / TILE;
  const tx1 = x1Px / TILE;
  const ty1 = y1Px / TILE;
  const findRoomAt = (tx: number, ty: number): DynamicTileRoomSpec | undefined =>
    floorplanSpec.rooms.find(
      (r) => tx >= r.tileRect[0] && tx <= r.tileRect[2] && ty >= r.tileRect[1] && ty <= r.tileRect[3],
    );
  const srcRoom = findRoomAt(tx0, ty0);
  const dstRoom = findRoomAt(tx1, ty1);

  if (!srcRoom || !dstRoom || srcRoom.canonicalId === dstRoom.canonicalId) {
    return [{ x: Math.round(x1Px), y: Math.round(y1Px) }];
  }

  const pts: Array<readonly [number, number]> = [];
  const srcDoor = floorplanSpec.doors.find((d) => d.roomCanonicalId === srcRoom.canonicalId);
  const dstDoor = floorplanSpec.doors.find((d) => d.roomCanonicalId === dstRoom.canonicalId);
  const spineCorridorY =
    floorplanSpec.spineRoom.tileRect[1] +
    (floorplanSpec.spineRoom.tileRect[3] - floorplanSpec.spineRoom.tileRect[1]) * 0.55;

  if (srcDoor) {
    pts.push(srcDoor.roomPoint);
    pts.push(srcDoor.spinePoint);
    pts.push([srcDoor.spinePoint[0], spineCorridorY]);
  }
  if (dstDoor) {
    pts.push([dstDoor.spinePoint[0], spineCorridorY]);
    pts.push(dstDoor.spinePoint);
    pts.push(dstDoor.roomPoint);
  }
  pts.push([tx1, ty1]);
  return pts.map(([px, py]) => ({
    x: Math.round(px * TILE),
    y: Math.round(py * TILE),
  }));
}

function pointInBox(x: number, y: number, x0: number, y0: number, x1: number, y1: number): boolean {
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function segHitsDoor(x1: number, y1: number, x2: number, y2: number, d: LimeZuDoorState): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const pArr = [-dx, dx, -dy, dy];
  const qArr = [x1 - d.rx0, d.rx1 - x1, y1 - d.ry0, d.ry1 - y1];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(pArr[i]) < 1e-9) {
      if (qArr[i] < 0) return false;
    } else {
      const t = qArr[i] / pArr[i];
      if (pArr[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

export function doorTriggered(d: LimeZuDoorState, a: DoorActorInput): boolean {
  if (pointInBox(a.x, a.y, d.rx0 - 0.1, d.ry0 - 0.06, d.rx1 + 0.1, d.ry1 + 0.06)) {
    return true;
  }
  if (!a.moving) return false;
  if (a.kind === 'char') {
    if (!a.pathTiles || a.pathTiles.length === 0) return false;
    const p1 = a.pathTiles[0];
    if (segHitsDoor(a.x, a.y, p1[0], p1[1], d)) return true;
    const p2 = a.pathTiles[1];
    const vx = p2 ? p2[0] - p1[0] : p1[0] - a.x;
    const vy = p2 ? p2[1] - p1[1] : p1[1] - a.y;
    const vl = Math.hypot(vx, vy);
    if (vl > 1e-6 && segHitsDoor(p1[0], p1[1], p1[0] + (vx / vl) * DOOR_EXT_CH, p1[1] + (vy / vl) * DOOR_EXT_CH, d)) {
      return true;
    }
    return false;
  }
  if (a.dirX || a.dirY) {
    return segHitsDoor(
      a.x,
      a.y,
      a.x + (a.dirX || 0) * DOOR_EXT_PET,
      a.y + (a.dirY || 0) * DOOR_EXT_PET,
      d,
    );
  }
  return false;
}

export function stepLimeZuDoors(
  doors: LimeZuDoorState[],
  actors: ReadonlyArray<DoorActorInput>,
  dtMs: number,
  clockMs: number,
): boolean {
  let dirty = false;
  for (const d of doors) {
    let occ = false;
    for (const a of actors) {
      if (doorTriggered(d, a)) {
        occ = true;
        break;
      }
    }
    if (occ) {
      d.occupied = true;
      d.emptySince = null;
      d.target = 1;
    } else {
      d.occupied = false;
      if (d.target === 1) {
        if (d.emptySince == null) d.emptySince = clockMs;
        if (clockMs - d.emptySince >= DOOR_HOLD_MS) d.target = 0;
      }
    }
    const before = d.ang;
    if (d.target === 1 && d.ang < 1) {
      d.ang = Math.min(1, d.ang + dtMs / DOOR_OPEN_MS);
    } else if (d.target === 0 && d.ang > 0) {
      d.ang = Math.max(0, d.ang - dtMs / DOOR_CLOSE_MS);
    }
    const nextState: LimeZuDoorState['state'] =
      d.target === 1 ? (d.ang >= 1 ? 'open' : 'opening') : d.ang <= 0 ? 'closed' : 'closing';
    if (nextState !== d.state) {
      d.state = nextState;
      dirty = true;
    }
    if (d.ang !== before) dirty = true;
  }
  return dirty;
}

function sampleFloorPatch(
  floorCtx: CanvasRenderingContext2D | null,
  pt: readonly [number, number],
): string | null {
  if (!floorCtx || typeof floorCtx.getImageData !== 'function') return null;
  try {
    const img = floorCtx.getImageData(Math.round(pt[0] * TILE) - 3, Math.round(pt[1] * TILE) - 3, 7, 7);
    const dd = img.data;
    let r = 0;
    let gg = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < dd.length; i += 4) {
      r += dd[i];
      gg += dd[i + 1];
      b += dd[i + 2];
      n++;
    }
    if (!n) return null;
    r = Math.round(r / n);
    gg = Math.round(gg / n);
    b = Math.round(b / n);
    if (r + gg + b < 24) return null;
    return `rgb(${r},${gg},${b})`;
  } catch {
    return null;
  }
}

export function drawLimeZuDoors(
  doorCtx: CanvasRenderingContext2D,
  doors: ReadonlyArray<LimeZuDoorState>,
  atlasImg: HTMLImageElement | null,
  floorCtx: CanvasRenderingContext2D | null,
): void {
  doorCtx.setTransform(1, 0, 0, 1, 0, 0);
  doorCtx.clearRect(0, 0, LIMEZU_STAGE_W, LIMEZU_STAGE_H);
  doorCtx.imageSmoothingEnabled = false;
  const bandH = Math.round(1.44 * TILE); // 58px
  const halfH = Math.round(bandH / 2);

  for (const d of doors) {
    if (d.ang <= 0.001 && d.target !== 1) continue;
    const x = Math.round(d.x * TILE);
    const y = Math.round(d.band * TILE);

    if (!d.patchColors && floorCtx) {
      d.patchColors = {
        n: sampleFloorPatch(floorCtx, d.nN) || '#9C7B52',
        s: sampleFloorPatch(floorCtx, d.nS) || '#A8845C',
      };
    }
    const cn = d.patchColors?.n || '#9C7B52';
    const cs = d.patchColors?.s || '#A8845C';

    doorCtx.fillStyle = cn;
    doorCtx.fillRect(x, y, TILE, halfH);
    doorCtx.fillStyle = cs;
    doorCtx.fillRect(x, y + halfH, TILE, bandH - halfH);
    doorCtx.fillStyle = 'rgba(46,26,10,.35)';
    doorCtx.fillRect(x, y, TILE, 4);
    doorCtx.fillStyle = '#6E4F30';
    doorCtx.fillRect(x, y + halfH - 1, TILE, 3);
    doorCtx.fillStyle = 'rgba(255,240,210,.18)';
    doorCtx.fillRect(x, y + halfH - 1, TILE, 1);

    if (atlasImg) {
      const a = d.ang * DOOR_MAX_SWING;
      const c = Math.cos(a);
      const s = Math.sin(a);
      doorCtx.save();
      doorCtx.translate(x, y);
      doorCtx.transform(c, d.swing * 0.32 * s, 0, 1, 0, 0);
      doorCtx.drawImage(atlasImg, 820, 282, 44, 64, 0, 0, TILE, bandH);
      if (s > 0.01) {
        doorCtx.fillStyle = `rgba(255,225,170,${(0.35 * s).toFixed(3)})`;
        doorCtx.fillRect(TILE - 2, 0, 2, bandH);
        doorCtx.fillStyle = `rgba(38,20,6,${(0.3 * s).toFixed(3)})`;
        doorCtx.fillRect(0, 0, TILE, bandH);
      }
      doorCtx.restore();
    }
  }
}

