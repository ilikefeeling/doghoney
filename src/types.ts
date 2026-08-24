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
}

export type FitStatus = 'fits' | 'tight' | 'needs_fold' | 'over';

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
