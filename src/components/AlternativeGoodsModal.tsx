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
        <div className="bg-gradient-to-r from-[#E02020] to-[#FF7E36] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[17px]">🛒 트렁크 실측 기반 1:1 맞춤 비교</h3>
                <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded-full">
                  실측 제원 매칭
                </span>
              </div>
              <p className="text-xs text-white/90">중고 직접 운반 수고 vs 신품 무료 배송 / 안전 키트</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 bg-[#F8F9FC] max-h-[65vh]">
          <div className="p-3 bg-[#FFDBCC]/40 rounded-xl border border-[#FF7E36]/30 text-xs text-[#7A3000]">
            💡 차량 트렁크 규격에 맞춘 최적의 대안 및 용품을 매칭했습니다.
          </div>

          {/* Dynamic Recommendations */}
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-2xl border border-[#EDEEF1] hover:border-[#FF7E36] shadow-xs transition-all flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.badgeColor}`}>
                  {rec.badge}
                </span>
                <span className="text-[11px] font-extrabold text-red-600">
                  실측 적합도 {rec.qScore}%
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
                className="mt-1 w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-2.5 rounded-xl text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1 block"
              >
                <span className="material-symbols-outlined text-[15px]">shopping_cart</span>
                {rec.priceLabel}
              </a>
            </div>
          ))}

          {/* Fallback Today's House Option */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EDEEF1] shadow-xs flex flex-col gap-2 opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#35C5F0] text-white">
                🏠 오늘의집
              </span>
              <span className="text-xs font-semibold text-[#5A5E67]">인기 가구/인테리어</span>
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-[#191C1E]">{cleanItemName} 인테리어 신품</h4>
              <p className="text-xs text-[#595F67] mt-0.5">무료배송 • 원하는 날짜 지정 배송</p>
            </div>
            <a
              href={`https://ohou.se/search?query=${searchQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold py-2 rounded-xl text-xs text-center transition-colors block"
            >
              오늘의집 최저가 비교 →
            </a>
          </div>

          {/* 4th Fallback: 용달 옵션 (최후 대안) */}
          {onOpenTransportModal && (
            <div className="bg-[#F8F9FC] p-3 rounded-2xl border border-dashed border-[#D1D5DB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#6B7280]">local_shipping</span>
                <span className="text-xs text-[#4B5563]">다마스 / 라보 용달 견적</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenTransportModal();
                }}
                className="text-xs font-bold text-[#FF7E36] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>용달 견적 보기</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* 쿠팡 파트너스 면책 고지 */}
          <p className="text-[9px] text-[#9EA3AC] text-center px-2 leading-relaxed">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            실제 상품 가격 및 혜택은 링크를 통해 확인하세요.
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
