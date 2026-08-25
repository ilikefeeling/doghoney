import React, { useState } from 'react';
import { ItemDimensions } from '../types';

interface TransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDimensions;
}

export const TransportModal: React.FC<TransportModalProps> = ({ isOpen, onClose, item }) => {
  const [distanceKm, setDistanceKm] = useState(10);
  const [hasHelper, setHasHelper] = useState(false);
  const [hasElevator, setHasElevator] = useState(true);

  if (!isOpen) return null;

  // Pricing calculations
  const damasBase = 25000 + Math.max(0, distanceKm - 5) * 1200;
  const laboBase = 30000 + Math.max(0, distanceKm - 5) * 1400;
  const tonBase = 45000 + Math.max(0, distanceKm - 5) * 1600;

  const helperFee = hasHelper ? 20000 : 0;
  const stairsFee = !hasElevator ? 10000 : 0;

  const estimatedTotal = laboBase + helperFee + stairsFee;

  const handleCallTransport = () => {
    // Copy quote text and open transport service
    const quoteText = `[개꿀 Doghoney 용달 견적]\n물품: ${item.name || '가구/가전'} (${item.width}×${item.depth}×${item.height}cm)\n거리: ${distanceKm}km\n예상 비용: ${estimatedTotal.toLocaleString()}원 (라보 기준)\n도움: ${hasHelper ? '기사님 상하차 도움' : '운전만'}\n엘리베이터: ${hasElevator ? '있음' : '없음 (계단)'}`;

    // Try Web Share API first
    if (navigator.share) {
      navigator.share({
        title: '개꿀 Doghoney 용달 견적',
        text: quoteText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(quoteText).catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#191C1E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF7E36] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-white">local_shipping</span>
            </div>
            <div>
              <h3 className="font-bold text-[17px]">당근 맞춤 용달 견적</h3>
              <p className="text-xs text-white/70">
                {item.name || '가구/가전'} ({item.width}×{item.depth}×{item.height}cm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 bg-[#F8F9FC]">
          {/* Distance Slider */}
          <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#191C1E]">이동 거리 설정</span>
              <span className="text-sm font-extrabold text-[#FF7E36]">{distanceKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full accent-[#FF7E36] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#595F67]">
              <span>1km (동네)</span>
              <span>15km (구/인접시)</span>
              <span>50km (시외)</span>
            </div>
          </div>

          {/* Options (Helper, Stairs) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHasHelper(!hasHelper)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                hasHelper
                  ? 'bg-[#FFDBCC]/30 border-[#FF7E36]'
                  : 'bg-white border-[#EDEEF1] hover:bg-[#F2F3F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191C1E]">기사님 상하차 도움</span>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    hasHelper ? 'text-[#FF7E36]' : 'text-[#9EA3AC]'
                  }`}
                >
                  {hasHelper ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </div>
              <span className="text-[11px] text-[#595F67] block mt-1">+20,000원</span>
            </button>

            <button
              onClick={() => setHasElevator(!hasElevator)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                !hasElevator
                  ? 'bg-[#FFDBCC]/30 border-[#FF7E36]'
                  : 'bg-white border-[#EDEEF1] hover:bg-[#F2F3F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191C1E]">엘리베이터 없음 (계단)</span>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    !hasElevator ? 'text-[#FF7E36]' : 'text-[#9EA3AC]'
                  }`}
                >
                  {!hasElevator ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </div>
              <span className="text-[11px] text-[#595F67] block mt-1">+10,000원</span>
            </button>
          </div>

          {/* Vehicle Type Estimates */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#5A5E67] px-0.5">추천 차종별 예상 요금</span>

            {/* Damas */}
            <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#F2F3F6] flex items-center justify-center text-[#191C1E]">
                  <span className="material-symbols-outlined text-[24px]">directions_car</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm text-[#191C1E]">다마스</strong>
                    <span className="text-[10px] bg-[#E7E8EB] px-1.5 py-0.5 rounded font-semibold text-[#5A5E67]">
                      소형 가구
                    </span>
                  </div>
                  <span className="text-[11px] text-[#595F67]">
                    적재함: 160 × 110 × 110 cm (소파/선반)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <strong className="text-[16px] text-[#FF7E36]">
                  {(damasBase + helperFee + stairsFee).toLocaleString()}원
                </strong>
              </div>
            </div>

            {/* Labo */}
            <div className="bg-white p-3.5 rounded-xl border-2 border-[#FF7E36]/30 bg-[#FFDBCC]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#FFDBCC] text-[#7A3000] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm text-[#191C1E]">라보 (오픈형 트럭)</strong>
                    <span className="text-[10px] bg-[#FF7E36] text-white px-1.5 py-0.5 rounded font-bold">
                      추천
                    </span>
                  </div>
                  <span className="text-[11px] text-[#595F67]">
                    적재함: 210 × 130 cm (높이 제한 없음)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <strong className="text-[16px] text-[#FF7E36]">
                  {(laboBase + helperFee + stairsFee).toLocaleString()}원
                </strong>
              </div>
            </div>

            {/* 1 Ton */}
            <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#F2F3F6] flex items-center justify-center text-[#191C1E]">
                  <span className="material-symbols-outlined text-[24px]">rv_hookup</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm text-[#191C1E]">1톤 카고 / 탑차</strong>
                    <span className="text-[10px] bg-[#E7E8EB] px-1.5 py-0.5 rounded font-semibold text-[#5A5E67]">
                      대형/여러개
                    </span>
                  </div>
                  <span className="text-[11px] text-[#595F67]">적재함: 280 × 160 cm (대형 가전)</span>
                </div>
              </div>
              <div className="text-right">
                <strong className="text-[16px] text-[#5A5E67]">
                  {(tonBase + helperFee + stairsFee).toLocaleString()}원
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EDEEF1] flex flex-col gap-2">
          {/* Primary: KakaoT Truck */}
          <a
            href="https://kakaot.kakao.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCallTransport}
            className="w-full bg-[#FEE500] hover:bg-[#E5CF00] text-[#3C1E1E] font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            <span>카카오T 트럭 바로 호출</span>
          </a>

          {/* Secondary row */}
          <div className="grid grid-cols-2 gap-2">
            {/* SendD */}
            <a
              href="https://www.send-d.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCallTransport}
              className="w-full bg-[#191C1E] hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
              <span>센드디 견적 요청</span>
            </a>

            {/* Copy quote */}
            <button
              onClick={() => {
                handleCallTransport();
                onClose();
              }}
              className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>견적 복사</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
