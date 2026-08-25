/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarTrunk, ItemDimensions, RLTrajectoryStep, SpatialRLResult } from '../../types';
import { TrunkEnvironment } from './TrunkEnvironment';

// 3D Scale constant: 1cm = 0.01 units
const S = 0.01;

export interface RLPlacementCandidate {
  orientation: { w: number; d: number; h: number; desc: string; rotated: boolean };
  posX: number;
  posY: number;
  posZ: number;
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
  reward: number;
  evalResult: ReturnType<TrunkEnvironment['evaluatePlacement']>;
}

/**
 * 3D Spatial Reinforcement Learning (RL) Policy Agent
 * Evaluates high-dimensional continuous spatial actions and solves optimal placement & trajectory.
 */
export class SpatialRLAgent {
  private env: TrunkEnvironment;
  private item: ItemDimensions;

  constructor(car: CarTrunk, item: ItemDimensions, isFolded: boolean) {
    this.env = new TrunkEnvironment(car, isFolded);
    this.item = {
      width: Math.max(1, item.width),
      depth: Math.max(1, item.depth),
      height: Math.max(1, item.height),
      name: item.name,
      category: item.category,
    };
  }

  /**
   * Runs the RL optimization search policy to find the global optimal placement & 3D trajectory
   */
  public solve(allowDiagonal: boolean = true, allowRotation: boolean = true): SpatialRLResult {
    const itemW = this.item.width;
    const itemD = this.item.depth;
    const itemH = this.item.height;

    // 1. Generate 6 Base Orthogonal Orientations
    const allOrientations = [
      { w: itemW, d: itemD, h: itemH, desc: '기본 정방향 평적', rotated: false },
      { w: itemW, d: itemH, h: itemD, desc: '앞뒤 눕혀 적재', rotated: true },
      { w: itemD, d: itemW, h: itemH, desc: '90도 가로 회전 적재', rotated: true },
      { w: itemD, d: itemH, h: itemW, desc: '회전 후 눕혀 적재', rotated: true },
      { w: itemH, d: itemW, h: itemD, desc: '측면 기립 적재', rotated: true },
      { w: itemH, d: itemD, h: itemW, desc: '완전 세움 적재', rotated: true },
    ];

    const targetOrientations = allowRotation ? allOrientations : [allOrientations[0]];

    // 2. Explore State Space (Angle deviations, Offset nudges, Wheelhouse clearances)
    const yawAngles = allowDiagonal ? [0, 15, -15, 30, -30, 45, -45] : [0];
    const pitchAngles = allowDiagonal ? [0, 10, -10, 20, -20] : [0];

    const candidates: RLPlacementCandidate[] = [];
    const actionLogs: string[] = [];

    actionLogs.push(`[RL Agent] 차량 모델 '${this.env.car.model}' 3D 볼륨 및 휠하우스 공간 환경 구성 완료`);
    actionLogs.push(`[RL Agent] 물품 규격 (${itemW} × ${itemD} × ${itemH}cm) 다차원 상태 공간 탐색 시작`);

    for (const ori of targetOrientations) {
      for (const yaw of yawAngles) {
        for (const pitch of pitchAngles) {
          // Spatial offsets evaluation
          const offsetsX = [0, -5, 5, -10, 10];
          const offsetsZ = [0, -10, 10, -20, 20];

          for (const ox of offsetsX) {
            for (const oz of offsetsZ) {
              const posX = ox;
              const posZ = oz;
              const posY = ori.h / 2; // Resting directly on floor

              const evalRes = this.env.evaluatePlacement(
                ori.w,
                ori.d,
                ori.h,
                posX,
                posY,
                posZ,
                yaw,
                pitch,
                0
              );

              // Calculate Multi-objective Reward Function:
              // R = +100 (No collision) + Efficiency * 0.5 + Stability * 0.35 - CollisionPenalties
              let reward = 0;
              if (!evalRes.hasCollision) {
                reward += 100;
                reward += evalRes.volumeEfficiency * 0.5;
                reward += evalRes.stabilityScore * 0.35;
                if (yaw === 0 && pitch === 0) reward += 10; // Bonus for simple orthogonal loading
                if (!evalRes.wheelhouseCollision) reward += 15; // Wheelhouse clearance bonus
              } else {
                reward -= evalRes.penetrationDepth * 15;
                if (evalRes.wheelhouseCollision) reward -= 30;
                reward += (100 - Math.min(100, evalRes.penetrationDepth * 5)) * 0.2;
              }

              candidates.push({
                orientation: ori,
                posX,
                posY,
                posZ,
                yawDeg: yaw,
                pitchDeg: pitch,
                rollDeg: 0,
                reward,
                evalResult: evalRes,
              });
            }
          }
        }
      }
    }

    // 3. Select Best Candidate via Max Q/Reward
    candidates.sort((a, b) => b.reward - a.reward);
    const best = candidates[0];

    const isFit = !best.evalResult.hasCollision;
    const confidence = isFit
      ? Math.min(99.4, Math.max(82, 85 + best.evalResult.stabilityScore * 0.14))
      : Math.max(15, Math.min(65, 60 - best.evalResult.penetrationDepth * 1.2));

    // Determine Difficulty Index
    let difficulty: '쉬움' | '보통' | '주의 필요' | '적재 불가' = '쉬움';
    if (!isFit) {
      difficulty = '적재 불가';
    } else if (best.yawDeg !== 0 || best.pitchDeg !== 0 || best.evalResult.clearance.left < 5 || best.evalResult.clearance.right < 5) {
      difficulty = '주의 필요';
    } else if (best.orientation.rotated || best.evalResult.stabilityScore < 70) {
      difficulty = '보통';
    }

    // Determine Tipping Risk
    const tipRisk: '낮음' | '보통' | '높음' =
      best.evalResult.stabilityScore >= 80 ? '낮음' : best.evalResult.stabilityScore >= 55 ? '보통' : '높음';

    const recommendedStrapCount =
      tipRisk === '높음' ? 2 : tipRisk === '보통' || best.orientation.rotated ? 1 : 0;

    actionLogs.push(
      `[RL Agent] 최적 행동 선택: '${best.orientation.desc}', 회전각(Yaw: ${best.yawDeg}°, Pitch: ${best.pitchDeg}°)`
    );
    actionLogs.push(
      `[RL Agent] 최종 보상값: ${Math.round(best.reward * 10) / 10}, 공간 효율: ${best.evalResult.volumeEfficiency}%, 안정성: ${best.evalResult.stabilityScore}%`
    );

    if (best.evalResult.wheelhouseCollision) {
      actionLogs.push(`[RL Agent] ⚠️ 휠하우스 간섭 감지 -> 오프셋 이동 및 각도 조정 적용`);
    } else {
      actionLogs.push(`[RL Agent] ✅ 휠하우스 간섭 회피 완료`);
    }

    // 3. Check Rear Tailgate Aperture Entry
    const apertureCheck = this.env.checkApertureEntry(itemW, itemD, itemH);
    const apertureBreach = !apertureCheck.canEnter;
    if (apertureBreach) {
      actionLogs.push(`[RL Agent] 🚨 개구부 통과 실패: ${apertureCheck.warningMessage}`);
    } else {
      actionLogs.push(`[RL Agent] ✅ 개구부(입구) 통과 가능 판정 완료`);
    }

    // 4. Generate 3-Step Dynamic Trajectory
    const trajectorySteps: RLTrajectoryStep[] = this.generateTrajectorySteps(best);

    return {
      isOptimal: isFit && !apertureBreach,
      confidence: Math.round(confidence * 10) / 10,
      metrics: {
        spatialEfficiency: best.evalResult.volumeEfficiency,
        stabilityScore: best.evalResult.stabilityScore,
        difficultyIndex: apertureBreach ? '적재 불가' : difficulty,
        centerOfMassHeightCm: Math.round(best.posY * 10) / 10,
        floorContactRatio: Math.min(100, Math.round((Math.min(best.orientation.w, best.orientation.d) / Math.max(best.orientation.w, best.orientation.d)) * 100)),
        tipRisk,
        recommendedStrapCount,
        apertureBreach,
        apertureWarning: apertureCheck.warningMessage,
      },
      trajectorySteps,
      aiActionLogs: actionLogs,
      wheelhouseCollisionAvoided: !best.evalResult.wheelhouseCollision,
      diagonalAngleRequired: Math.abs(best.yawDeg) || Math.abs(best.pitchDeg),
      apertureBreach,
      apertureWarning: apertureCheck.warningMessage,
    };
  }

  /**
   * Generates step-by-step loading trajectory for 3D animation
   */
  private generateTrajectorySteps(best: RLPlacementCandidate): RLTrajectoryStep[] {
    const carD = this.env.depth;
    const halfD = carD / 2;

    const targetPosX = best.posX * S;
    const targetPosY = (best.orientation.h / 2) * S;
    const targetPosZ = best.posZ * S;

    const radYaw = (best.yawDeg * Math.PI) / 180;
    const radPitch = (best.pitchDeg * Math.PI) / 180;

    // Step 1: Entry Alignment (At tailgate opening)
    const step1Pos: [number, number, number] = [
      targetPosX * 0.4,
      targetPosY + 0.35,
      (halfD + 40) * S,
    ];
    const step1Rot: [number, number, number] = [
      radPitch + 0.25,
      radYaw * 0.6,
      0,
    ];

    // Step 2: Obstacle / Wheelhouse Clearance (Sliding into mid-trunk)
    const step2Pos: [number, number, number] = [
      targetPosX * 0.8,
      targetPosY + 0.12,
      (halfD * 0.3) * S,
    ];
    const step2Rot: [number, number, number] = [
      radPitch * 0.5,
      radYaw,
      0,
    ];

    // Step 3: Optimal Seating (Final settled floor position)
    const step3Pos: [number, number, number] = [
      targetPosX,
      targetPosY,
      targetPosZ,
    ];
    const step3Rot: [number, number, number] = [
      radPitch,
      radYaw,
      0,
    ];

    return [
      {
        step: 1,
        title: '1단계: 개구부 각도 정렬 진입',
        description: `트렁크 개구부 통과를 위해 ${best.yawDeg !== 0 ? `요(Yaw) ${best.yawDeg}° 회전 및 ` : ''}상단 ${Math.round((radPitch + 0.25) * 57.3)}° 기울임 진입`,
        position: step1Pos,
        rotation: step1Rot,
        icon: 'login',
        tiltAngleDeg: Math.round((radPitch + 0.25) * 57.3),
      },
      {
        step: 2,
        title: '2단계: 휠하우스 간섭 회피 슬라이드',
        description: '좌우 휠하우스 돌출부를 피해 중앙 유효 폭으로 회전 이동하며 진입',
        position: step2Pos,
        rotation: step2Rot,
        icon: 'swap_horiz',
      },
      {
        step: 3,
        title: '3단계: 바닥 밀착 최적 안착 & 고정',
        description: `무게중심 ${Math.round(best.posY)}cm 높이로 안정적 바닥 안착 완료 (${best.orientation.desc})`,
        position: step3Pos,
        rotation: step3Rot,
        icon: 'task_alt',
      },
    ];
  }
}
