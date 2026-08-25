export interface CarTrunk {
  id: string;
  brand: string;
  model: string;
  year?: string;
  category: 'SUV' | 'Sedan' | 'Compact' | 'Van' | 'EV';
  // All dimensions in cm
  width: number; // Narrowest point between wheel wells
  depth: number; // Normal trunk depth (rear seats upright)
  depthFolded: number; // Depth with 2nd row folded flat
  height: number; // Trunk floor to ceiling
  openingWidth: number; // Tailgate opening width
  openingHeight: number; // Tailgate opening height
  diagonalMax: number; // Max diagonal clearance
  volumeLiters: number;
  volumeLitersFolded: number;
  hasFlatFold: boolean; // Full flat folding support
  image?: string;
  popular?: boolean;
}

export interface ItemDimensions {
  width: number; // 가로 (W)
  depth: number; // 세로/깊이 (D)
  height: number; // 높이 (H)
  name?: string;
  category?: string;
  image?: string;
  coupangKeyword?: string;
}

export type FitStatus = 'fits' | 'tight' | 'needs_fold' | 'over';

export interface RLTrajectoryStep {
  step: number;
  title: string;
  description: string;
  position: [number, number, number]; // [x, y, z] in Three.js units (scale applied)
  rotation: [number, number, number]; // [rx, ry, rz] Euler in radians
  icon: string;
  tiltAngleDeg?: number;
}

export interface RLMetricScores {
  spatialEfficiency: number; // 0 ~ 100%
  stabilityScore: number;    // 0 ~ 100%
  difficultyIndex: '쉬움' | '보통' | '주의 필요' | '적재 불가';
  centerOfMassHeightCm: number;
  floorContactRatio: number; // 0 ~ 100%
  tipRisk: '낮음' | '보통' | '높음';
  recommendedStrapCount: number;
  apertureBreach?: boolean;
  apertureWarning?: string;
}

export interface SpatialRLResult {
  isOptimal: boolean;
  confidence: number; // 0 ~ 100%
  metrics: RLMetricScores;
  trajectorySteps: RLTrajectoryStep[];
  aiActionLogs: string[];
  wheelhouseCollisionAvoided: boolean;
  diagonalAngleRequired: number; // in degrees
  apertureBreach?: boolean;
  apertureWarning?: string;
}

export interface CoupangRecommendation {
  id: string;
  strategy: 'new_product' | 'cargo_securing' | 'vehicle_custom' | 'flatpack_diy';
  title: string;
  badge: string;
  badgeColor: string;
  priceLabel: string;
  benefit: string;
  hook: string;
  keyword: string;
  url: string;
  qScore: number; // 0 ~ 100
  icon: string;
  costSavingsLabel?: string; // e.g. "🚚 중고 용달비 60,000원 절약 효과"
}

export interface FitCalculation {
  status: FitStatus;
  statusLabel: string;
  statusColor: string;
  statusEmoji: string;
  bestOrientation: {
    w: number;
    d: number;
    h: number;
    rotated: boolean;
    description: string;
  };
  margins: {
    width: number; // positive is clearance, negative is overflow
    depth: number;
    height: number;
  };
  needsFold: boolean;
  isDiagonal: boolean;
  canFitNormal: boolean;
  canFitFolded: boolean;
  canFitDiagonal: boolean;
  tips: string[];
  volumeRatio: number; // item volume / trunk volume
  spatialRL?: SpatialRLResult;
  coupangRecommendations?: CoupangRecommendation[];
}

export interface PresetItem {
  id: string;
  name: string;
  category: '가구' | '가전' | '취미' | '육아' | '기타';
  dimensions: ItemDimensions;
  icon: string;
  description: string;
  tip: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  allowDiagonal: boolean;
  allowRotation: boolean;
  result: FitCalculation;
}

export interface PackedItemPosition {
  item: ItemDimensions;
  position: [number, number, number]; // [x, y, z] in cm relative to center
  orientation: { w: number; d: number; h: number };
  color: string;
}

export interface MultiItemPackingResult {
  allFit: boolean;
  packedCount: number;
  totalItems: number;
  packedItems: PackedItemPosition[];
  overflowItems: ItemDimensions[];
  totalVolumeEfficiency: number; // 0 ~ 100%
  stabilityScore: number;
  packingAdvice: string;
}
