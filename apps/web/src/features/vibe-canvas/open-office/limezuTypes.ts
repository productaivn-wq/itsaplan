// Clean-room TypeScript port of Phong Lam Viec Mo (LimeZu Modern Interiors) 2D spatial engine
// Tile grid: 24 x 14 tiles at LIMEZU_TILE_PX = 40px => intrinsic 960 x 560 stage (exact 12:7 ratio).


export const LIMEZU_ATLAS_URL = '/open-office/atlas.png';
export const LIMEZU_COLS = 24;
export const LIMEZU_ROWS = 14;
export const LIMEZU_TILE_PX = 40;
export const LIMEZU_STAGE_W = 960;
export const LIMEZU_STAGE_H = 560;

// Sprite scale relative to 1200x700 reference (0.92 * 40 / 50)
export const TILE = LIMEZU_TILE_PX;
export const PX_RATIO = TILE / 50; // 0.8
export const FSC = 0.92 * PX_RATIO;

export type SpriteDirection = 'right' | 'up' | 'left' | 'down';

export type LimeZuRoomKey =
  | 'soan'
  | 'dieu'
  | 'trinh'
  | 'sanh'
  | 'tracuu'
  | 'hop'
  | 'thugian'
  | 'morong';

export const CANONICAL_TO_LIMEZU_ZONE: Record<string, LimeZuRoomKey> = {
  // Canonical SOPRegistry zone keys
  sop_sec_audit_01: 'soan',
  sop_strategy_01: 'dieu',
  sop_coding_01: 'trinh',
  sop_generic_7p: 'sanh',
  sop_research_01: 'tracuu',
  sop_analytics_01: 'hop',
  sop_legal_01: 'thugian',
  sop_operations_01: 'morong',
  // Direct LimeZu visual slot keys
  soan: 'soan',
  dieu: 'dieu',
  trinh: 'trinh',
  sanh: 'sanh',
  tracuu: 'tracuu',
  hop: 'hop',
  thugian: 'thugian',
  morong: 'morong',
  // Legacy aliases
  ba_tester: 'soan',
  exec_hq: 'dieu',
  ai_dev: 'trinh',
  central_lobby: 'sanh',
  academy: 'tracuu',
  training_hub: 'tracuu',
  war_room: 'hop',
  meeting_room: 'hop',
  hr_ops: 'thugian',
  hr_admin: 'thugian',
  commercial: 'morong',
  business_ops: 'morong',
};
