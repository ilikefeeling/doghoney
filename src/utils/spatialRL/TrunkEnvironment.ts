/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarTrunk } from '../../types';

export interface VoxelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface ObstacleBox {
  name: string;
  bounds: VoxelBounds;
  isWheelhouse?: boolean;
  isCeilingSlope?: boolean;
}

/**
 * 3D Trunk Environment for Spatial RL Simulation
 * Models precise vehicle geometry including wheelhouse bulges, roof slope, and opening apertures.
 */
export class TrunkEnvironment {
  public car: CarTrunk;
  public isFolded: boolean;
  public width: number;
  public depth: number;
  public height: number;
  public openingWidth: number;
  public openingHeight: number;
  public obstacles: ObstacleBox[] = [];

  constructor(car: CarTrunk, isFolded: boolean) {
    this.car = car;
    this.isFolded = isFolded;
    this.width = car.width;
    this.depth = isFolded ? car.depthFolded : car.depth;
    this.height = car.height;
    this.openingWidth = car.openingWidth;
    this.openingHeight = car.openingHeight;

    this.initializeObstacles();
  }

  /**
   * Generates vehicle-specific internal obstacles (Wheelhouses, Roof slope)
   */
  private initializeObstacles() {
    this.obstacles = [];
    const halfW = this.width / 2;
    const halfD = this.depth / 2;

    // 1. Wheelhouse intrusions (Left & Right wheel wells)
    // Most vehicles have wheel wells intruding into the middle-to-rear floor
    const whWidth = Math.min(15, this.width * 0.12); // ~12-15cm intrusion
    const whHeight = Math.min(26, this.height * 0.35); // ~22-26cm height from floor
    const whDepth = Math.min(50, this.depth * 0.35); // ~40-50cm longitudinal length
    const whZCenter = this.isFolded ? -this.depth * 0.15 : 0; // Relative to trunk center

    // Left Wheelhouse
    this.obstacles.push({
      name: 'Left Wheelhouse',
      isWheelhouse: true,
      bounds: {
        minX: -halfW,
        maxX: -halfW + whWidth,
        minY: 0,
        maxY: whHeight,
        minZ: whZCenter - whDepth / 2,
        maxZ: whZCenter + whDepth / 2,
      },
    });

    // Right Wheelhouse
    this.obstacles.push({
      name: 'Right Wheelhouse',
      isWheelhouse: true,
      bounds: {
        minX: halfW - whWidth,
        maxX: halfW,
        minY: 0,
        maxY: whHeight,
        minZ: whZCenter - whDepth / 2,
        maxZ: whZCenter + whDepth / 2,
      },
    });

    // 2. Rear Tailgate Slope (Sedans & Coupes have steeper slopes)
    if (this.car.category === 'Sedan' || this.car.category === 'Compact') {
      const slopeDepth = this.depth * 0.35;
      const slopeHeight = this.height * 0.45;
      this.obstacles.push({
        name: 'Rear Window Chamfer',
        isCeilingSlope: true,
        bounds: {
          minX: -halfW,
          maxX: halfW,
          minY: this.height - slopeHeight,
          maxY: this.height,
          minZ: halfD - slopeDepth,
          maxZ: halfD,
        },
      });
    }
  }

  /**
   * Tests whether an oriented 3D item bounding box collides with trunk bounds or obstacles.
   */
  public evaluatePlacement(
    w: number,
    d: number,
    h: number,
    posX: number,
    posY: number,
    posZ: number,
    yawDeg: number = 0,
    pitchDeg: number = 0,
    rollDeg: number = 0
  ): {
    hasCollision: boolean;
    penetrationDepth: number;
    wheelhouseCollision: boolean;
    clearance: { left: number; right: number; top: number; front: number; rear: number };
    stabilityScore: number;
    volumeEfficiency: number;
  } {
    const halfW = this.width / 2;
    const halfD = this.depth / 2;

    // Convert angles to radians
    const radY = (yawDeg * Math.PI) / 180;
    const radX = (pitchDeg * Math.PI) / 180;
    const radZ = (rollDeg * Math.PI) / 180;

    // Calculate rotated AABB projection bounding sizes
    const cosY = Math.abs(Math.cos(radY));
    const sinY = Math.abs(Math.sin(radY));
    const cosX = Math.abs(Math.cos(radX));
    const sinX = Math.abs(Math.sin(radX));
    const cosZ = Math.abs(Math.cos(radZ));
    const sinZ = Math.abs(Math.sin(radZ));

    // Extents
    const effW = w * (cosY * cosZ) + d * (sinY * cosZ) + h * sinZ;
    const effD = w * (sinY * cosX) + d * (cosY * cosX) + h * sinX;
    const effH = w * sinX + d * sinZ + h * (cosX * cosZ);

    const itemMinX = posX - effW / 2;
    const itemMaxX = posX + effW / 2;
    const itemMinY = posY - effH / 2;
    const itemMaxY = posY + effH / 2;
    const itemMinZ = posZ - effD / 2;
    const itemMaxZ = posZ + effD / 2;

    // 1. Boundary Checks
    let penetration = 0;
    if (itemMinX < -halfW) penetration += Math.abs(-halfW - itemMinX);
    if (itemMaxX > halfW) penetration += Math.abs(itemMaxX - halfW);
    if (itemMinY < 0) penetration += Math.abs(itemMinY);
    if (itemMaxY > this.height) penetration += Math.abs(itemMaxY - this.height);
    if (itemMinZ < -halfD) penetration += Math.abs(-halfD - itemMinZ);
    if (itemMaxZ > halfD) penetration += Math.abs(itemMaxZ - halfD);

    // 2. Obstacle Checks (Wheelhouse & Ceilings)
    let wheelhouseCollision = false;
    for (const obs of this.obstacles) {
      const overlapX = Math.max(0, Math.min(itemMaxX, obs.bounds.maxX) - Math.max(itemMinX, obs.bounds.minX));
      const overlapY = Math.max(0, Math.min(itemMaxY, obs.bounds.maxY) - Math.max(itemMinY, obs.bounds.minY));
      const overlapZ = Math.max(0, Math.min(itemMaxZ, obs.bounds.maxZ) - Math.max(itemMinZ, obs.bounds.minZ));

      if (overlapX > 0.5 && overlapY > 0.5 && overlapZ > 0.5) {
        const volOverlap = (overlapX * overlapY * overlapZ) / 1000;
        penetration += volOverlap * 10;
        if (obs.isWheelhouse) {
          wheelhouseCollision = true;
        }
      }
    }

    // 3. Clearances
    const clearance = {
      left: Math.max(0, posX - effW / 2 - (-halfW)),
      right: Math.max(0, halfW - (posX + effW / 2)),
      top: Math.max(0, this.height - itemMaxY),
      front: Math.max(0, posX - effD / 2 - (-halfD)),
      rear: Math.max(0, halfD - itemMaxZ),
    };

    // 4. Physical Stability (Center of gravity & Floor support base)
    const baseFootprint = Math.min(effW, effD);
    const cogHeight = posY;
    const heightRatio = cogHeight / Math.max(1, baseFootprint);
    const stabilityRaw = Math.max(0, Math.min(100, Math.round(100 - (heightRatio - 0.5) * 45)));
    const stabilityScore = penetration > 0 ? Math.max(0, stabilityRaw - 50) : stabilityRaw;

    // 5. Volume Packing Efficiency
    const trunkVol = this.width * this.depth * this.height;
    const itemVol = w * d * h;
    const volumeEfficiency = Math.min(100, Math.round((itemVol / trunkVol) * 100));

    return {
      hasCollision: penetration > 0.1,
      penetrationDepth: Math.round(penetration * 10) / 10,
      wheelhouseCollision,
      clearance,
      stabilityScore,
      volumeEfficiency,
    };
  }

  /**
   * Evaluates if an item can physically pass through the vehicle's rear tailgate opening aperture.
   */
  public checkApertureEntry(w: number, d: number, h: number): {
    canEnter: boolean;
    minWidthRequired: number;
    minHeightRequired: number;
    widthDeficit: number;
    heightDeficit: number;
    warningMessage?: string;
  } {
    // 2D cross sections in any orientation
    const crossSections = [
      { width: w, height: h },
      { width: w, height: d },
      { width: d, height: h },
      { width: d, height: w },
      { width: h, height: w },
      { width: h, height: d },
    ];

    let canEnter = false;
    let minWDeficit = 999;
    let minHDeficit = 999;

    for (const cs of crossSections) {
      const wDiff = cs.width - this.openingWidth;
      const hDiff = cs.height - this.openingHeight;

      if (wDiff <= 0 && hDiff <= 0) {
        canEnter = true;
        break;
      }

      const totalDeficit = Math.max(0, wDiff) + Math.max(0, hDiff);
      if (totalDeficit < (minWDeficit + minHDeficit)) {
        minWDeficit = Math.max(0, wDiff);
        minHDeficit = Math.max(0, hDiff);
      }
    }

    if (!canEnter) {
      return {
        canEnter: false,
        minWidthRequired: this.openingWidth,
        minHeightRequired: this.openingHeight,
        widthDeficit: minWDeficit,
        heightDeficit: minHDeficit,
        warningMessage: `트렁크 입구(개구부) 크기 제한으로 진입 불가 (입구: ${this.openingWidth}×${this.openingHeight}cm)`,
      };
    }

    return {
      canEnter: true,
      minWidthRequired: this.openingWidth,
      minHeightRequired: this.openingHeight,
      widthDeficit: 0,
      heightDeficit: 0,
    };
  }
}
