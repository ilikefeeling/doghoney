import React from 'react';

interface PhysicsTogglesProps {
  isFolded: boolean;
  onToggleFolded: () => void;
}

export const PhysicsToggles: React.FC<PhysicsTogglesProps> = ({
  isFolded,
  onToggleFolded,
}) => {
  return (
    <div className="flex flex-col gap-2.5 mt-1 pt-1 border-t border-[#EDEEF1]">
      {/* 2열 시트 폴딩 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#5A5E67]">airline_seat_recline_extra</span>
          <span className="text-[14px] font-medium text-[#191C1E]">2열 시트 폴딩 (트렁크 확장)</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isFolded}
          onClick={onToggleFolded}
          className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
            isFolded ? 'bg-[#FF7E36]' : 'bg-[#E1E2E5]'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${
              isFolded ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
