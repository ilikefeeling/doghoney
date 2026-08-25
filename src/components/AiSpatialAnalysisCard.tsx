/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SpatialRLResult } from '../types';

interface AiSpatialAnalysisCardProps {
  spatialRL?: SpatialRLResult;
  activeTrajectoryStep: number;
  onSelectTrajectoryStep: (step: number) => void;
  isPlayingTrajectory: boolean;
  onTogglePlayTrajectory: () => void;
}

export const AiSpatialAnalysisCard: React.FC<AiSpatialAnalysisCardProps> = ({
  spatialRL,
  activeTrajectoryStep,
  onSelectTrajectoryStep,
  isPlayingTrajectory,
  onTogglePlayTrajectory,
}) => {
  const [isLogExpanded, setIsLogExpanded] = useState(false);

  if (!spatialRL) return null;

  const { confidence, metrics, trajectorySteps, aiActionLogs, wheelhouseCollisionAvoided } = spatialRL;

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case '쉬움':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case '보통':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case '주의 필요':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-700 border-rose-200';
    }
  };

  const getStabilityColor = (score: number) => {
    if (score >= 80) return '#10B981'; // emerald
    if (score >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // rose
  };

  return (
    <div className="bg-gradient-to-b from-white to-[#F8F9FC] rounded-2xl ambient-shadow p-5 border border-[#E2E8F0] flex flex-col gap-4.5 animate-in fade-in duration-500">
      {/* Header: AI Engine Status & Confidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF7E36] to-[#FFA166] flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
            <span className="material-symbols-outlined text-[17px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-[15px] text-[#191C1E]">
                AI 공간연산 강화학습
              </h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium">
              3D Voxel 물리 충돌 및 다차원 최적화
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">신뢰도</span>
          <span className="font-black text-[15px] text-[#FF7E36]">{confidence}%</span>
        </div>
      </div>

      {/* Metric Gauges Grid */}
      <div className="grid grid-cols-3 gap-2.5 bg-[#F1F5F9]/70 p-3 rounded-xl border border-[#E2E8F0]/80">
        {/* 1. 공간 활용도 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#475569]">
            <span>공간 점유</span>
            <span className="font-bold text-[#1E293B]">{metrics.spatialEfficiency}%</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#3B82F6] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.spatialEfficiency)}%` }}
            />
          </div>
        </div>

        {/* 2. 무게중심 안정성 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#475569]">
            <span>무게 안정</span>
            <span className="font-bold text-[#1E293B]">{metrics.stabilityScore}%</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, metrics.stabilityScore)}%`,
                backgroundColor: getStabilityColor(metrics.stabilityScore),
              }}
            />
          </div>
        </div>

        {/* 3. 적재 난이도 */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium text-[#64748B] mb-0.5">난이도</span>
          <span
            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${getDifficultyColor(
              metrics.difficultyIndex
            )}`}
          >
            {metrics.difficultyIndex}
          </span>
        </div>
      </div>

      {/* Aperture Breach Alert Banner */}
      {metrics.apertureBreach && (
        <div className="flex items-start gap-2 text-[12px] bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse">
          <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">
            error
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-extrabold text-red-800">
              트렁크 입구(개구부) 크기 제한으로 진입 불가!
            </span>
            <span className="text-[11px] text-red-700 leading-tight">
              {metrics.apertureWarning || '트렁크 내부는 여유가 있어도 개구부 문턱에 걸립니다. 2열 도어로 우회 진입하거나 신품 로켓배송을 권장합니다.'}
            </span>
          </div>
        </div>
      )}

      {/* Safety Badge Summary */}
      <div className="flex items-center gap-2 text-[12px] bg-white p-2.5 rounded-xl border border-[#EDEEF1]">
        <span className="material-symbols-outlined text-[18px] text-emerald-500 shrink-0">
          {wheelhouseCollisionAvoided ? 'verified' : 'warning'}
        </span>
        <span className="font-medium text-[#334155] flex-1">
          {wheelhouseCollisionAvoided
            ? '휠하우스 돌출부 자동 회피 궤적 계산 완료'
            : '휠하우스 간섭 구역 주의 요망'}
        </span>
        {metrics.recommendedStrapCount > 0 && (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 shrink-0">
            고정바 {metrics.recommendedStrapCount}개 권장
          </span>
        )}
      </div>

      {/* 3-Step Interactive Trajectory Player */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[13px] text-[#1E293B] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#FF7E36] text-[18px]">route</span>
            AI 단계별 3D 적재 가이드
          </h4>
          <button
            onClick={onTogglePlayTrajectory}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#191C1E] px-2.5 py-1 rounded-lg hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">
              {isPlayingTrajectory ? 'pause' : 'play_arrow'}
            </span>
            {isPlayingTrajectory ? '일시정지' : '3D 궤적 재생'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {trajectorySteps.map((step) => {
            const isActive = activeTrajectoryStep === step.step;
            return (
              <button
                key={step.step}
                onClick={() => onSelectTrajectoryStep(step.step)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-[#FFF7ED] border-[#FF7E36] shadow-sm ring-1 ring-[#FF7E36]/30'
                    : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-[#FF7E36] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {step.step}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-bold ${
                        isActive ? 'text-[#C2410C]' : 'text-[#1E293B]'
                      }`}
                    >
                      {step.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-[#FF7E36] bg-orange-100 px-1.5 py-0.2 rounded">
                        3D 뷰 선택됨
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Decision Log Toggle */}
      <div className="border-t border-[#EDEEF1] pt-3">
        <button
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
        >
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">terminal</span>
            AI 강화학습 탐색 로그 확인 ({aiActionLogs.length}건)
          </span>
          <span className="material-symbols-outlined text-[16px]">
            {isLogExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {isLogExpanded && (
          <div className="mt-2 p-3 bg-[#0F172A] rounded-xl font-mono text-[10.5px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
            {aiActionLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-slate-500 select-none">[{idx + 1}]</span>
                <span className="text-slate-200">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
