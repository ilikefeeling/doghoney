import React, { useState } from 'react';
import { CarTrunk, FitCalculation, ItemDimensions } from '../types';

interface Simulation3DProps {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  allowDiagonal: boolean;
  fitResult: FitCalculation;
}

type ViewMode = '3d' | 'rear' | 'top';

export const Simulation3D: React.FC<Simulation3DProps> = ({
  item,
  car,
  isFolded,
  fitResult,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [rotateAngle, setRotateAngle] = useState(0);

  const { status, statusLabel, margins, bestOrientation, tips } = fitResult;

  // Status color styles
  const getBadgeStyle = () => {
    switch (status) {
      case 'fits':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
      case 'tight':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]';
      case 'needs_fold':
        return 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]';
      case 'over':
        return 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]';
    }
  };

  const activeCarDepth = isFolded ? car.depthFolded : car.depth;

  // Proportional sizing for visualizer
  const boxW = bestOrientation.w;
  const boxD = bestOrientation.d;
  const boxH = bestOrientation.h;

  // Scale factors for 3D container (relative to max dimensions)
  const maxDim = Math.max(car.width, activeCarDepth, car.height, 150);
  const trunkScaleW = Math.min(220, (car.width / maxDim) * 220);
  const trunkScaleD = Math.min(180, (activeCarDepth / maxDim) * 180);
  const trunkScaleH = Math.min(130, (car.height / maxDim) * 130);

  const itemScaleW = Math.max(24, Math.min(trunkScaleW * 1.3, (boxW / maxDim) * 220));
  const itemScaleD = Math.max(24, Math.min(trunkScaleD * 1.3, (boxD / maxDim) * 180));
  const itemScaleH = Math.max(20, Math.min(trunkScaleH * 1.3, (boxH / maxDim) * 130));

  const isOverflow = status === 'over';

  return (
    <section className="bg-white rounded-2xl ambient-shadow overflow-hidden flex flex-col border border-[#EDEEF1]">
      {/* Simulation Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-[#EDEEF1] bg-white">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[17px] text-[#191C1E]">적재 시뮬레이션</h3>
          <span className="text-[11px] text-[#595F67] hidden sm:inline">
            ({car.model.split(' ')[0]} {car.model.split(' ')[1] || ''})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-xs transition-all ${getBadgeStyle()}`}
          >
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="px-3 py-1.5 bg-[#F8F9FC] border-b border-[#EDEEF1] flex items-center justify-between">
        <div className="flex gap-1 bg-[#EDEEF1] p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#5A5E67] hover:text-[#191C1E]'
            }`}
          >
            3D 입체
          </button>
          <button
            onClick={() => setViewMode('rear')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'rear'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#5A5E67] hover:text-[#191C1E]'
            }`}
          >
            후면 단면
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'top'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#5A5E67] hover:text-[#191C1E]'
            }`}
          >
            상단 평면
          </button>
        </div>

        {viewMode === '3d' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRotateAngle((prev) => prev - 45)}
              className="w-6 h-6 rounded bg-white border border-[#EDEEF1] text-[#5A5E67] hover:text-[#FF7E36] flex items-center justify-center text-xs"
              title="좌회전"
            >
              <span className="material-symbols-outlined text-[14px]">rotate_left</span>
            </button>
            <button
              onClick={() => setRotateAngle(0)}
              className="px-1.5 h-6 rounded bg-white border border-[#EDEEF1] text-[#5A5E67] text-[10px] font-semibold"
              title="각도 초기화"
            >
              Reset
            </button>
            <button
              onClick={() => setRotateAngle((prev) => prev + 45)}
              className="w-6 h-6 rounded bg-white border border-[#EDEEF1] text-[#5A5E67] hover:text-[#FF7E36] flex items-center justify-center text-xs"
              title="우회전"
            >
              <span className="material-symbols-outlined text-[14px]">rotate_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Simulation Visual Canvas */}
      <div className="h-64 bg-[#F8F9FC] flex items-center justify-center relative overflow-hidden select-none">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#9EA3AC 1.2px, transparent 1.2px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* 1. 3D ISOMETRIC VIEW */}
        {viewMode === '3d' && (
          <div
            className="relative flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              perspective: '900px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 3D Trunk Space Container */}
            <div
              className="relative border-2 border-dashed border-[#9EA3AC] rounded-lg flex items-end justify-center transition-all duration-300"
              style={{
                width: `${Math.max(180, trunkScaleW)}px`,
                height: `${Math.max(100, trunkScaleH)}px`,
                transform: `rotateX(60deg) rotateZ(${rotateAngle - 25}deg)`,
                boxShadow: isFolded
                  ? '0 10px 30px rgba(255, 126, 54, 0.15), inset 0 0 20px rgba(255, 126, 54, 0.05)'
                  : '0 8px 20px rgba(0, 0, 0, 0.06)',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              {/* Folded 2nd row seat extension marker */}
              {isFolded && (
                <div className="absolute inset-x-0 top-0 h-1/2 border-b border-dashed border-[#FF7E36]/40 bg-[#FFDBCC]/25 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#A04100] tracking-wider uppercase opacity-80">
                    2열 폴딩 구역 (+{car.depthFolded - car.depth}cm)
                  </span>
                </div>
              )}

              {/* Trunk Floor Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Simulated 3D Item Box */}
              <div
                className={`box-3d-anim relative transition-all duration-300 rounded-md flex flex-col items-center justify-center shadow-lg border backdrop-blur-xs ${
                  isOverflow
                    ? 'bg-[#BA1A1A]/80 border-[#BA1A1A] text-white'
                    : status === 'tight'
                    ? 'bg-[#F59E0B]/85 border-[#D97706] text-white'
                    : 'bg-[#FF7E36]/85 border-[#FF7E36] text-white'
                }`}
                style={{
                  width: `${itemScaleW}px`,
                  height: `${itemScaleD}px`,
                  marginBottom: '8px',
                  boxShadow: isOverflow
                    ? '0 8px 25px rgba(186, 26, 26, 0.4)'
                    : '0 8px 25px rgba(255, 126, 54, 0.35)',
                }}
              >
                {/* 3D Box Top Face Illusion */}
                <div
                  className="absolute inset-x-0 -top-3 h-3 bg-white/20 border-t border-white/40 rounded-t-xs"
                  style={{ transform: 'skewX(-45deg)' }}
                />

                <span className="material-symbols-outlined text-[28px] opacity-90 drop-shadow-xs">
                  {item.category === '가전'
                    ? 'tv'
                    : item.category === '취미'
                    ? 'pedal_bike'
                    : 'chair'}
                </span>
                <span className="text-[10px] font-bold tracking-tight px-1 text-center truncate max-w-full drop-shadow-xs">
                  {boxW}×{boxD}×{boxH}cm
                </span>
              </div>

              {/* Trunk Floor Label */}
              <span className="absolute -bottom-7 font-bold text-[10px] text-[#595F67] tracking-widest uppercase">
                TRUNK FLOOR ({car.width}×{activeCarDepth}cm)
              </span>
            </div>
          </div>
        )}

        {/* 2. REAR VIEW (후면 단면도) */}
        {viewMode === 'rear' && (
          <div className="flex flex-col items-center justify-center w-full px-6">
            <div className="relative border-2 border-[#5A5E67] rounded-t-2xl w-60 h-36 bg-white/90 p-2 flex items-end justify-center shadow-inner">
              {/* Trunk Opening Boundary */}
              <div className="absolute top-2 left-2 right-2 text-center text-[10px] text-[#595F67] font-semibold">
                트렁크 개구부 (너비 {car.width}cm × 높이 {car.height}cm)
              </div>

              {/* Cargo Front Silhouette */}
              <div
                className={`transition-all duration-300 rounded-lg flex flex-col items-center justify-center p-1 border shadow-md ${
                  isOverflow
                    ? 'bg-[#BA1A1A]/85 border-[#BA1A1A] text-white'
                    : 'bg-[#FF7E36]/90 border-[#E0601A] text-white'
                }`}
                style={{
                  width: `${Math.min(200, (boxW / car.width) * 190)}px`,
                  height: `${Math.min(100, (boxH / car.height) * 90)}px`,
                }}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.category === '가전' ? 'tv' : 'chair'}
                </span>
                <span className="text-[10px] font-bold">
                  {boxW} × {boxH}cm
                </span>
              </div>

              {/* Height clearance arrow */}
              <div className="absolute right-2 top-8 bottom-3 flex flex-col items-center justify-center">
                <div className="w-px h-full bg-[#FF7E36]" />
                <span
                  className={`text-[9px] font-bold px-1 rounded ${
                    margins.height >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'
                  }`}
                >
                  {margins.height >= 0 ? `+${margins.height}` : margins.height}cm
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#595F67] mt-2">
              트렁크 후면 개구부 단면도 (너비/높이 간섭)
            </span>
          </div>
        )}

        {/* 3. TOP VIEW (상단 평면도) */}
        {viewMode === 'top' && (
          <div className="flex flex-col items-center justify-center w-full px-6">
            <div className="relative border-2 border-[#5A5E67] rounded-lg w-56 h-36 bg-white/90 p-2 flex items-center justify-center shadow-inner overflow-hidden">
              {isFolded && (
                <div className="absolute left-0 inset-y-0 w-2/5 bg-[#FFDBCC]/30 border-r border-dashed border-[#FF7E36] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#A04100] -rotate-90">2열 폴딩</span>
                </div>
              )}

              {/* Cargo Footprint */}
              <div
                className={`transition-all duration-300 rounded-md flex flex-col items-center justify-center p-1 border shadow-md z-10 ${
                  isOverflow
                    ? 'bg-[#BA1A1A]/85 border-[#BA1A1A] text-white'
                    : 'bg-[#FF7E36]/90 border-[#E0601A] text-white'
                }`}
                style={{
                  width: `${Math.min(180, (boxD / activeCarDepth) * 170)}px`,
                  height: `${Math.min(110, (boxW / car.width) * 100)}px`,
                }}
              >
                <span className="text-[10px] font-bold">
                  {boxD} × {boxW}cm
                </span>
              </div>

              {/* Tailgate indicator */}
              <div className="absolute right-0 inset-y-0 w-1.5 bg-[#5A5E67] flex items-center justify-center">
                <span className="text-[8px] text-white -rotate-90">도어</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#595F67] mt-2">
              바닥 평면도 (깊이 {activeCarDepth}cm × 너비 {car.width}cm)
            </span>
          </div>
        )}
      </div>

      {/* Margin Feedback Strip (Matching Design) */}
      <div className="bg-[#F8F9FC] px-4 py-2.5 flex justify-between items-center text-[#5A5E67] border-t border-[#EDEEF1]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#FF7E36]">straighten</span>
          <span className="text-xs font-bold text-[#191C1E]">여유 공간</span>
        </div>
        <div className="text-xs flex gap-3 font-medium">
          <span>
            상단{' '}
            <strong className={margins.height >= 0 ? 'text-[#FF7E36]' : 'text-[#BA1A1A]'}>
              {margins.height >= 0 ? `+${margins.height}` : margins.height}cm
            </strong>
          </span>
          <span>
            측면{' '}
            <strong className={margins.width >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'}>
              {margins.width >= 0 ? `+${margins.width}` : margins.width}cm
            </strong>
          </span>
          <span>
            깊이{' '}
            <strong className={margins.depth >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'}>
              {margins.depth >= 0 ? `+${margins.depth}` : margins.depth}cm
            </strong>
          </span>
        </div>
      </div>

      {/* Smart Tip Box */}
      {tips.length > 0 && (
        <div className="px-4 py-2.5 bg-[#FFF7ED] border-t border-[#FFEDD5] flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#FF7E36] shrink-0 mt-0.5">
            lightbulb
          </span>
          <p className="text-xs text-[#7A3000] font-medium leading-relaxed">{tips[0]}</p>
        </div>
      )}
    </section>
  );
};
