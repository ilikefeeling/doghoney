/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FitCalculation, ItemDimensions, CarTrunk } from '../types';
import { CommerceRLStore } from '../utils/spatialRL/CommerceRLStore';
import { TelemetryTracker } from '../utils/analytics/telemetryTracker';

interface AlternativeGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDimensions;
  car?: CarTrunk;
  fitResult?: FitCalculation;
  onOpenTransportModal?: () => void;
}

export const AlternativeGoodsModal: React.FC<AlternativeGoodsModalProps> = ({
  isOpen,
  onClose,
  item,
  car,
  fitResult,
  onOpenTransportModal,
}) => {
  if (!isOpen) return null;

  const cleanItemName = item.name
    ? item.name.replace(/\s*\(AI 표준 규격 추정\)/g, '').replace(/\s*\(수동 입력 필요\)/g, '').trim()
    : '가구 가전';

  const recommendations = fitResult?.coupangRecommendations || [];
  const searchKeyword = item.coupangKeyword || cleanItemName;
  const searchQuery = encodeURIComponent(searchKeyword);

  const handleClickRec = (keyword: string, strategy: string, qScore: number, url: string) => {
    CommerceRLStore.recordFeedback(keyword, strategy, 'click');
    if (car) {
      TelemetryTracker.recordCommerceClick(item, car, strategy, keyword, qScore, url);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#3B82F6] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            <h3 className="font-bold text-[17px]">새 건 얼마지?</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-5 bg-[#F8F9FC] max-h-[70vh]">
          {/* Main Dynamic Recommendations (New / Compact) */}
          <div className="flex flex-col gap-3">
            {recommendations
              .filter((rec) => rec.strategy === 'new_product' || rec.strategy === 'flatpack_diy')
              .map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-4 rounded-2xl border border-[#EDEEF1] hover:border-[#3B82F6]/50 shadow-sm transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.badgeColor}`}>
                      {rec.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-[15px] text-[#191C1E] leading-snug">{rec.title}</h4>
                  </div>

                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClickRec(rec.keyword, rec.strategy, rec.qScore, rec.url)}
                    className="mt-1 w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1 block"
                  >
                    <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                    {rec.priceLabel}
                  </a>
                </div>
              ))}
          </div>

          {/* Sub Fixed Supplies & Services */}
          <div className="flex flex-col gap-2">
            <h5 className="text-[11px] font-bold text-[#9EA3AC] mb-1 px-1">차량 용품 및 부가 서비스</h5>
            
            {recommendations
              .filter((rec) => rec.strategy === 'cargo_securing' || rec.strategy === 'vehicle_custom')
              .map((rec) => (
                <div key={rec.id} className="bg-white p-3 rounded-xl border border-[#EDEEF1] flex items-center justify-between shadow-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#6B7280] mb-0.5">{rec.badge.replace(/[^a-zA-Z0-9가-힣\s]/g, '')}</span>
                    <h4 className="font-bold text-[13px] text-[#191C1E]">{rec.title}</h4>
                  </div>
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClickRec(rec.keyword, rec.strategy, rec.qScore, rec.url)}
                    className="shrink-0 bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#5A5E67] font-bold py-1.5 px-3 rounded-lg text-[11px] transition-colors"
                  >
                    보기
                  </a>
                </div>
              ))}

            {/* Fallback Today's House Option */}
            <div className="bg-white p-3 rounded-xl border border-[#EDEEF1] flex items-center justify-between shadow-xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#35C5F0] mb-0.5">오늘의집</span>
                <h4 className="font-bold text-[13px] text-[#191C1E]">{cleanItemName} 인테리어 신품</h4>
              </div>
              <a
                href={`https://ohou.se/search?query=${searchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#5A5E67] font-bold py-1.5 px-3 rounded-lg text-[11px] transition-colors"
              >
                비교
              </a>
            </div>

            {/* 4th Fallback: 용달 옵션 (최후 대안) */}
            {onOpenTransportModal && (
              <div className="bg-[#F8F9FC] p-3 rounded-xl border border-dashed border-[#D1D5DB] flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#6B7280]">local_shipping</span>
                  <span className="text-[12px] font-bold text-[#4B5563]">다마스 / 라보 용달 견적</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenTransportModal();
                  }}
                  className="text-[11px] font-bold text-[#FF7E36] hover:underline flex items-center cursor-pointer"
                >
                  견적 확인
                </button>
              </div>
            )}
          </div>

          {/* 쿠팡 파트너스 면책 고지 */}
          <p className="text-[9px] text-[#9EA3AC] text-center px-2 leading-relaxed mt-2">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#EDEEF1]">
          <button
            onClick={onClose}
            className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#5A5E67] font-semibold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
