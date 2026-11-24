import { LIMEZU_PET_SPOTS, routeLimeZuLen, routeLimeZuTiles } from './limezuNavigation';

// ============================================================================
// LIVING PET DUO (CẬU VÀNG CORGI + TIỂU THƯ ORANGE CAT)
// ============================================================================

export function drawOrangeCatSprite(ctx: CanvasRenderingContext2D, destW = 30, destH = 22): void {
  const sx = destW / 12;
  const sy = destH / 8.8;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x * sx), Math.round(y * sy), Math.max(1, Math.round(w * sx)), Math.max(1, Math.round(h * sy)));
  };
  R(0, 3, 2, 1, '#E8913A');
  R(0, 2, 1, 1, '#E8913A');
  R(2, 4, 7, 3, '#F4A259');
  R(4, 4, 1, 3, '#E8913A');
  R(6, 4, 1, 3, '#E8913A');
  R(3, 7, 1, 1, '#D97B2F');
  R(5, 7, 1, 1, '#D97B2F');
  R(7, 7, 1, 1, '#D97B2F');
  R(8, 1, 1, 1, '#F4A259');
  R(11, 1, 1, 1, '#F4A259');
  R(8, 2, 4, 4, '#F7B26A');
  R(9, 4, 1, 1, '#26221E');
  R(11, 4, 1, 1, '#26221E');
  R(10, 5, 1, 1, '#F9C6C6');
  R(8, 6, 2, 1, '#FBD9A8');
}

export function drawCorgiSprite(ctx: CanvasRenderingContext2D, frame: 0 | 1, destW = 35, destH = 25): void {
  const sx = destW / 14;
  const sy = destH / 10;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x * sx), Math.round(y * sy), Math.max(1, Math.round(w * sx)), Math.max(1, Math.round(h * sy)));
  };
  const B = '#D98E4A';
  const BD = '#B96F2E';
  const W = '#FFF6E8';
  const C = '#F3E3C2';
  const N = '#26221E';
  const RD = '#C0392B';
  if (frame === 0) {
    R(1, 1, 1, 1, B);
    R(0, 2, 1, 1, W);
  } else {
    R(1, 0, 1, 1, W);
    R(1, 1, 1, 1, B);
  }
  R(1, 2, 1, 2, B);
  R(2, 3, 8, 3, B);
  R(3, 3, 5, 1, BD);
  R(8, 4, 2, 2, W);
  R(3, 6, 6, 1, W);
  R(9, 4, 1, 2, RD);
  R(10, 0, 1, 1, B);
  R(12, 0, 1, 1, B);
  R(10, 1, 4, 4, B);
  R(12, 1, 1, 3, W);
  R(12, 3, 2, 2, W);
  R(13, 2, 1, 1, N);
  R(11, 2, 1, 1, N);
  R(10, 4, 1, 1, C);
  if (frame === 0) {
    R(3, 7, 1, 1, B);
    R(8, 7, 1, 1, B);
    R(3, 8, 1, 1, W);
    R(8, 8, 1, 1, W);
  } else {
    R(4, 7, 1, 1, B);
    R(7, 7, 1, 1, B);
    R(4, 8, 1, 1, W);
    R(7, 8, 1, 1, W);
  }
}

export interface PetSimAgent {
  kind: 'cat' | 'dog';
  x: number;
  y: number;
  path: Array<[number, number]>;
  wait: number;
  speed: number;
  moving: boolean;
  facingLeft: boolean;
  dirX: number;
  dirY: number;
  frame: 0 | 1;
  reactUntilTick: number;
  bubble: string;
  bubbleUntilTick: number;
}

export interface PetsSimState {
  tick: number;
  cat: PetSimAgent;
  dog: PetSimAgent;
  chase: {
    chaser: 'cat' | 'dog';
    fleer: 'cat' | 'dog';
    left: number;
    repath: number;
  } | null;
  cooldownUntil: number;
  lastChaser: 'cat' | 'dog';
}

const CAT_IDLE_LINES = ['Meow~', 'Meo… chỗ này của tui.', 'Ngáp, nắng đẹp ngủ ngon.', 'Sảnh chung sạch bóng!'];
const DOG_IDLE_LINES = ['Gâu! Gâu gâu!', 'Đợi Cậu Vàng tuần tra!', 'Ngửi thấy việc mới…', 'Không một lỗi trượt cổng!'];
const CHASE_LINES = ['Đứng lại đó!', 'Bắt được rồi nè!'];
const FLEE_LINES = ['Cứu! Nó dí tui!', 'Nhanh lên nhanh lên!'];
const NEW_TASK_LINES = {
  cat: ['Meow? Có việc mới hả…', 'Meo, việc mới tới rồi đó.'],
  dog: ['Gâu! Có việc mới kìa!', 'Gâu gâu! Việc mới tới!'],
};
const DONE_TASK_LINES = {
  cat: ['Meow~ có việc được duyệt rồi.', 'Purr… một việc xong rồi đó.'],
  dog: ['Gâu! Được duyệt rồi kìa!', 'Gâu gâu! Xong một việc!'],
};

function pickRand<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function createInitialPetsState(): PetsSimState {
  return {
    tick: 0,
    cat: {
      kind: 'cat',
      x: 3.2,
      y: 7.9,
      path: [],
      wait: 20,
      speed: 0.045,
      moving: false,
      facingLeft: false,
      dirX: 1,
      dirY: 0,
      frame: 0,
      reactUntilTick: 0,
      bubble: CAT_IDLE_LINES[0],
      bubbleUntilTick: 0,
    },
    dog: {
      kind: 'dog',
      x: 20.6,
      y: 7.05,
      path: [],
      wait: 25,
      speed: 0.05,
      moving: false,
      facingLeft: true,
      dirX: -1,
      dirY: 0,
      frame: 0,
      reactUntilTick: 0,
      bubble: DOG_IDLE_LINES[0],
      bubbleUntilTick: 0,
    },
    chase: null,
    cooldownUntil: 120,
    lastChaser: 'cat',
  };
}

export function triggerPetsReaction(
  sim: PetsSimState,
  kind: 'new' | 'done',
  targetTile?: { x: number; y: number } | null,
): void {
  if (sim.chase) return;
  const table = kind === 'done' ? DONE_TASK_LINES : NEW_TASK_LINES;
  [sim.cat, sim.dog].forEach((pet, idx) => {
    pet.bubble = pickRand(table[pet.kind]);
    pet.bubbleUntilTick = sim.tick + 55;
    pet.reactUntilTick = sim.tick + 70;
    if (targetTile) {
      const tx = Math.max(1.2, Math.min(22.8, targetTile.x + (idx === 0 ? -0.85 : 0.85)));
      const ty = Math.max(1.5, Math.min(13.2, targetTile.y + 0.55));
      pet.path = routeLimeZuTiles(pet.x, pet.y, tx, ty);
    }
  });
}

function advancePet(pet: PetSimAgent, speed: number, tick: number): void {
  if (pet.path.length === 0) {
    pet.moving = false;
    pet.frame = 0;
    return;
  }
  const tp = pet.path[0];
  const dx = tp[0] - pet.x;
  const dy = tp[1] - pet.y;
  const d = Math.hypot(dx, dy);
  if (d <= speed) {
    pet.x = tp[0];
    pet.y = tp[1];
    pet.path.shift();
  } else {
    pet.x += (dx / d) * speed;
    pet.y += (dy / d) * speed;
  }
  if (d > 1e-4) {
    pet.dirX = dx / d;
    pet.dirY = dy / d;
  }
  if (Math.abs(dx) > 0.01) {
    pet.facingLeft = dx < 0;
  }
  pet.moving = true;
  pet.frame = tick % 4 < 2 ? 0 : 1;
}

export function stepPetsSimulation(sim: PetsSimState): void {
  sim.tick += 1;

  if (sim.chase) {
    const c = sim.chase.chaser === 'dog' ? sim.dog : sim.cat;
    const f = sim.chase.fleer === 'dog' ? sim.dog : sim.cat;
    sim.chase.left -= 1;
    if (sim.chase.left <= 0 || Math.hypot(f.x - c.x, f.y - c.y) < 0.45) {
      c.bubble = 'Bắt được rồi nè!';
      c.bubbleUntilTick = sim.tick + 40;
      sim.chase = null;
      sim.cooldownUntil = sim.tick + 240;
      sim.cat.path = [];
      sim.dog.path = [];
      sim.cat.wait = 40;
      sim.dog.wait = 50;
      return;
    }
    if (f.path.length === 0 && LIMEZU_PET_SPOTS.length > 0) {
      let best = LIMEZU_PET_SPOTS[0];
      let bd = -1;
      for (const s of LIMEZU_PET_SPOTS) {
        const dist = Math.hypot(s[0] - c.x, s[1] - c.y);
        if (dist > bd) {
          bd = dist;
          best = s;
        }
      }
      f.path = routeLimeZuTiles(f.x, f.y, best[0], best[1]);
    }
    sim.chase.repath -= 1;
    if (c.path.length === 0 || sim.chase.repath <= 0) {
      c.path = routeLimeZuTiles(c.x, c.y, f.x, f.y);
      sim.chase.repath = 8;
    }
    advancePet(f, 0.088, sim.tick);
    advancePet(c, 0.083, sim.tick);
    return;
  }

  if (
    sim.tick > sim.cooldownUntil &&
    Math.hypot(sim.cat.x - sim.dog.x, sim.cat.y - sim.dog.y) <= 2.5 &&
    routeLimeZuLen(sim.cat.x, sim.cat.y, sim.dog.x, sim.dog.y) <= 3.4
  ) {
    const chaserKind: 'cat' | 'dog' = sim.lastChaser === 'dog' ? 'cat' : 'dog';
    const fleerKind: 'cat' | 'dog' = chaserKind === 'dog' ? 'cat' : 'dog';
    sim.lastChaser = chaserKind;
    sim.chase = { chaser: chaserKind, fleer: fleerKind, left: 95, repath: 0 };
    const chaser = chaserKind === 'dog' ? sim.dog : sim.cat;
    const fleer = fleerKind === 'dog' ? sim.dog : sim.cat;
    chaser.path = [];
    fleer.path = [];
    chaser.bubble = pickRand(CHASE_LINES);
    chaser.bubbleUntilTick = sim.tick + 45;
    fleer.bubble = pickRand(FLEE_LINES);
    fleer.bubbleUntilTick = sim.tick + 45;
    return;
  }

  for (const pet of [sim.cat, sim.dog]) {
    if (pet.path.length > 0) {
      const spd = sim.tick < pet.reactUntilTick ? pet.speed * 2.2 : pet.speed;
      advancePet(pet, spd, sim.tick);
    } else {
      pet.moving = false;
      pet.frame = 0;
      pet.wait -= 1;
      if (pet.wait <= 0 && LIMEZU_PET_SPOTS.length > 0) {
        const spot = pickRand(LIMEZU_PET_SPOTS);
        if (Math.hypot(spot[0] - pet.x, spot[1] - pet.y) > 1.2) {
          pet.path = routeLimeZuTiles(pet.x, pet.y, spot[0], spot[1]);
          pet.wait = 35 + Math.floor(Math.random() * 55);
        } else {
          pet.wait = 18;
        }
      }
    }
    if (sim.tick > pet.bubbleUntilTick && sim.tick % 140 === (pet.kind === 'dog' ? 20 : 90)) {
      pet.bubble = pickRand(pet.kind === 'dog' ? DOG_IDLE_LINES : CAT_IDLE_LINES);
      pet.bubbleUntilTick = sim.tick + 48;
    }
  }
}
