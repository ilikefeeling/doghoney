/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CoupangRecommendation, FitCalculation, ItemDimensions, CarTrunk } from '../types';
import { CommerceRLStore } from '../utils/spatialRL/CommerceRLStore';
import { TelemetryTracker } from '../utils/analytics/telemetryTracker';

interface CoupangSmartRecommenderProps {
  fitResult: FitCalculation;
  item?: ItemDimensions;
  car?: CarTrunk;
  onOpenAltModal?: () => void;
}

export const CoupangSmartRecommender: React.FC<CoupangSmartRecommenderProps> = ({
  fitResult,
  item,
  car,
  onOpenAltModal,
}) => {
  const recommendations = fitResult.coupangRecommendations || [];
  const [clickedId, setClickedId] = useState<string | null>(null);

  if (recommendations.length === 0) return null;

  const topRec = recommendations[0];

  const handleClickRec = (rec: CoupangRecommendation) => {
    setClickedId(rec.id);
    // Reinforcement Learning Positive Feedback Signal (+1.0 reward)
    CommerceRLStore.recordFeedback(rec.keyword, rec.strategy, 'click');

    // Telemetry Click Logging
    if (item && car) {
      TelemetryTracker.recordCommerceClick(
        item,
        car,
        rec.strategy,
        rec.keyword,
        rec.qScore,
        rec.url
      );
    }
  };

  return (
    <section className="bg-white rounded-2xl ambient-shadow p-5 border border-[#EDEEF1] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E02020] to-[#FF4D4D] flex items-center justify-center shadow-md shadow-red-500/20 text-white">
            <span className="material-symbols-outlined text-[17px]">shopping_cart</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-[15px] text-[#191C1E]">
                AI 맞춤 쿠팡 1:1 솔루션
              </h3>
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded-full border border-red-200">
                1:1 RL 매칭
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium">
              자가 학습 지식 베이스 기반 최적 상품 매칭
            </p>
          </div>
        </div>

        {onOpenAltModal && (
          <button
            onClick={onOpenAltModal}
            className="text-[11px] text-[#FF7E36] hover:text-[#E0601A] font-bold flex items-center gap-0.5 cursor-pointer"
          >
            전체 비교
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        )}
      </div>

      {/* Hero #1 Recommended Card */}
      <div className="bg-gradient-to-br from-[#FFF5F5] to-[#FFF0EB] rounded-2xl p-4 border border-[#FFD2C4] shadow-xs flex flex-col gap-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${topRec.badgeColor}`}>
            {topRec.badge}
          </span>
          <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            AI 적합도 {topRec.qScore}%
          </span>
        </div>

        <div>
          <h4 className="font-extrabold text-[15px] text-[#191C1E] leading-snug">
            {topRec.title}
          </h4>
          <p className="text-xs text-[#7A3000] font-medium mt-1 leading-relaxed">
            {topRec.hook}
          </p>
        </div>

        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-white/70 p-2 rounded-xl border border-emerald-100">
          <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">
            check_circle
          </span>
          <span>{topRec.benefit}</span>
        </div>

        {topRec.costSavingsLabel && (
          <div className="text-[11px] text-[#B91C1C] font-bold flex items-center gap-1 bg-red-50/80 px-2.5 py-1.5 rounded-lg border border-red-200">
            <span className="material-symbols-outlined text-[14px] text-red-600">savings</span>
            <span>{topRec.costSavingsLabel}</span>
          </div>
        )}

        <a
          href={topRec.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClickRec(topRec)}
          className="mt-1 w-full bg-[#E02020] hover:bg-[#C81818] text-white font-extrabold py-3 rounded-xl text-[13px] text-center shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
          {topRec.priceLabel}
        </a>
      </div>

      {/* Secondary Category Cards Carousel / Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-bold text-[#334155]">상황별 맞춤 상품 바로가기</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {recommendations.slice(1, 3).map((rec) => (
            <a
              key={rec.id}
              href={rec.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClickRec(rec)}
              className="bg-[#F8F9FC] hover:bg-white p-3 rounded-xl border border-[#EDEEF1] hover:border-[#FF7E36] transition-all flex flex-col justify-between gap-2 shadow-2xs group"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#FF7E36]">
                    {rec.icon}
                  </span>
                  <span className="text-[10px] font-bold text-[#64748B] truncate">
                    {rec.badge.split(' ')[1] || rec.badge}
                  </span>
                </div>
                <h5 className="font-bold text-[12px] text-[#1E293B] line-clamp-2 leading-tight group-hover:text-[#FF7E36] transition-colors">
                  {rec.title}
                </h5>
              </div>

              <div className="text-[11px] font-bold text-[#FF7E36] flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span>확인하기</span>
                <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[9.5px] text-[#94A3B8] text-center leading-relaxed">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </section>
  );
};
