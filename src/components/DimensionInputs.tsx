import React from 'react';
import { ItemDimensions } from '../types';

interface DimensionInputsProps {
  dimensions: ItemDimensions;
  onChange: (dims: ItemDimensions) => void;
}

export const DimensionInputs: React.FC<DimensionInputsProps> = ({ dimensions, onChange }) => {
  const updateDimension = (key: keyof ItemDimensions, value: number) => {
    onChange({
      ...dimensions,
      [key]: Math.max(1, value || 0),
    });
  };

  const handleStep = (key: keyof ItemDimensions, delta: number) => {
    const current = Number(dimensions[key]) || 0;
    updateDimension(key, current + delta);
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 mt-1">
      {/* 가로 (W) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between pl-1">
          <label className="text-[12px] font-semibold text-[#5A5E67]">가로 (W)</label>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleStep('width', -5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="-5cm"
            >
              -
            </button>
            <button
              onClick={() => handleStep('width', 5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="+5cm"
            >
              +
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={dimensions.width || ''}
            onChange={(e) => updateDimension('width', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#F8F9FC] border border-[#E1E2E5] rounded-xl px-2.5 py-2.5 text-center font-bold text-[18px] text-[#191C1E] focus:border-[#FF7E36] focus:ring-2 focus:ring-[#FF7E36]/20 focus:bg-white outline-none transition-all"
            min="1"
            max="400"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#595F67] pointer-events-none">
            cm
          </span>
        </div>
      </div>

      {/* 세로 (D) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between pl-1">
          <label className="text-[12px] font-semibold text-[#5A5E67]">세로 (D)</label>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleStep('depth', -5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="-5cm"
            >
              -
            </button>
            <button
              onClick={() => handleStep('depth', 5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="+5cm"
            >
              +
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={dimensions.depth || ''}
            onChange={(e) => updateDimension('depth', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#F8F9FC] border border-[#E1E2E5] rounded-xl px-2.5 py-2.5 text-center font-bold text-[18px] text-[#191C1E] focus:border-[#FF7E36] focus:ring-2 focus:ring-[#FF7E36]/20 focus:bg-white outline-none transition-all"
            min="1"
            max="400"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#595F67] pointer-events-none">
            cm
          </span>
        </div>
      </div>

      {/* 높이 (H) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between pl-1">
          <label className="text-[12px] font-semibold text-[#5A5E67]">높이 (H)</label>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleStep('height', -5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="-5cm"
            >
              -
            </button>
            <button
              onClick={() => handleStep('height', 5)}
              className="text-[10px] w-4 h-4 rounded bg-[#F2F3F6] hover:bg-[#EDEEF1] text-[#5A5E67] flex items-center justify-center font-bold"
              title="+5cm"
            >
              +
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={dimensions.height || ''}
            onChange={(e) => updateDimension('height', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#F8F9FC] border border-[#E1E2E5] rounded-xl px-2.5 py-2.5 text-center font-bold text-[18px] text-[#191C1E] focus:border-[#FF7E36] focus:ring-2 focus:ring-[#FF7E36]/20 focus:bg-white outline-none transition-all"
            min="1"
            max="400"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#595F67] pointer-events-none">
            cm
          </span>
        </div>
      </div>
    </div>
  );
};
