import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#FF7E36] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">help</span>
            <h3 className="font-bold text-[17px]">트렁크 적재 가이드 & 팁</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3.5 bg-[#F8F9FC] text-xs leading-relaxed text-[#191C1E]">
          <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5">
            <h4 className="font-bold text-sm text-[#FF7E36] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">straighten</span>
              1. 치수 측정 기준 (가로/세로/높이)
            </h4>
            <p className="text-[#595F67]">
              • <strong>가로 (W)</strong>: 가구의 가장 긴 가로 길이 (손잡이나 다리 돌출부 포함).
            </p>
            <p className="text-[#595F67]">
              • <strong>세로 (D)</strong>: 가구의 앞뒤 폭/깊이.
            </p>
            <p className="text-[#595F67]">
              • <strong>높이 (H)</strong>: 바닥부터 상단까지의 높이. (식탁 다리 분해 시 대폭 감소!)
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5">
            <h4 className="font-bold text-sm text-[#FF7E36] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">airline_seat_recline_extra</span>
              2. 2열 시트 폴딩과 대각선 진입
            </h4>
            <p className="text-[#595F67]">
              • 2열 시트를 접으면 깊이가 180~210cm까지 확장되어 거의 모든 2인용 소파/식탁이 들어갑니다.
            </p>
            <p className="text-[#595F67]">
              • 가로폭이 살짝 초과하는 경우, 대각선으로 먼저 머리를 넣고 눕혀서 회전시키면 안전하게 적재됩니다.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5">
            <h4 className="font-bold text-sm text-[#BA1A1A] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              3. 차량 손상 및 안전 유의사항
            </h4>
            <p className="text-[#595F67]">
              • 테일게이트 닫을 때 뒷유리에 가구 모서리가 닿지 않도록 반드시 <strong>담요나 뽁뽁이</strong>를 덧대세요.
            </p>
            <p className="text-[#595F67]">
              • TV/모니터 패널은 눕혀서 운반 시 진동으로 패널이 깨질 수 있으니 세우거나 완충재를 두텁게 까세요.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#EDEEF1]">
          <button
            onClick={onClose}
            className="w-full bg-[#FF7E36] text-white font-bold py-2.5 rounded-xl text-xs"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
