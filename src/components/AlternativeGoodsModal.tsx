import React from 'react';
import { ItemDimensions } from '../types';

interface AlternativeGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDimensions;
}

export const AlternativeGoodsModal: React.FC<AlternativeGoodsModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen) return null;

  const searchQuery = encodeURIComponent(item.name || 'DIY 조립 가구');

  const alternatives = [
    {
      title: `${item.name || '원목 가구'} DIY 플랫팩 조립형`,
      platform: '🚀 쿠팡 로켓배송',
      price: '59,000원~',
      packSize: `${Math.round(item.width * 0.9)} × ${Math.round(item.depth * 0.4)} × 15 cm`,
      rating: '⭐ 4.8 (1,240개 리뷰)',
      benefit: '내일 아침 도착 • 100% 트렁크 적재 가능 (플랫 박스)',
      icon: 'rocket_launch',
      badgeColor: 'bg-[#E02020] text-white',
      // 쿠팡 파트너스 검색 링크 (실제 파트너스 가입 후 어필리에이트 ID 교체 필요)
      link: `https://www.coupang.com/np/search?component=&q=${searchQuery}&channel=user`,
      linkLabel: '쿠팡 최저가 보기 →',
    },
    {
      title: `모듈형 분해 조립 ${item.name || '수납 가구'}`,
      platform: '🏠 오늘의집',
      price: '74,900원~',
      packSize: `${Math.round(item.width * 0.8)} × ${Math.round(item.depth * 0.5)} × 12 cm`,
      rating: '⭐ 4.9 (890개 리뷰)',
      benefit: '무료배송 • 승용차 트렁크에도 쏙 들어가는 분할 패키지',
      icon: 'home',
      badgeColor: 'bg-[#35C5F0] text-white',
      link: `https://ohou.se/search?query=${searchQuery}`,
      linkLabel: '오늘의집에서 보기 →',
    },
    {
      title: `초경량 접이식 ${item.name || '가구'} 시리즈`,
      platform: '🟡 이케아 공식',
      price: '49,900원~',
      packSize: `${Math.round(item.width * 0.7)} × 25 × 10 cm`,
      rating: '⭐ 4.7 (2,100개 리뷰)',
      benefit: '소형차 100% 적재 보증 • 컴팩트 플랫팩 포장',
      icon: 'inventory_2',
      badgeColor: 'bg-[#0058A3] text-[#FFDA1A]',
      link: `https://www.ikea.com/kr/ko/search/?q=${searchQuery}`,
      linkLabel: '이케아에서 보기 →',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#FF7E36] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            <div>
              <h3 className="font-bold text-[17px]">🛒 신품 최저가 비교</h3>
              <p className="text-xs text-white/85">중고 직접 운반 수고 vs 신품 무료 배송</p>
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
            💡 중고 {item.name || '물품'} (가로 {item.width}cm)의 직접 운반이 어렵다면,{' '}
            <strong>플랫팩(Flat-pack) 조립 가구</strong>를 신품 로켓배송으로 받아보세요!
          </div>

          {alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-2xl border border-[#EDEEF1] hover:border-[#FF7E36] shadow-xs transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alt.badgeColor}`}>
                  {alt.platform}
                </span>
                <span className="text-xs font-semibold text-[#5A5E67]">{alt.rating}</span>
              </div>

              <div>
                <h4 className="font-bold text-[15px] text-[#191C1E]">{alt.title}</h4>
                <p className="text-xs text-[#FF7E36] font-extrabold mt-0.5">{alt.price}</p>
              </div>

              <div className="bg-[#F8F9FC] p-2 rounded-lg text-[11px] text-[#595F67] flex justify-between">
                <span>포장 크기 (납작 포장)</span>
                <strong className="text-[#191C1E]">{alt.packSize}</strong>
              </div>

              <div className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {alt.benefit}
              </div>

              <a
                href={alt.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full bg-[#F2F3F6] hover:bg-[#FFDBCC] text-[#191C1E] hover:text-[#7A3000] font-bold py-2 rounded-xl text-xs text-center transition-colors block"
              >
                {alt.linkLabel}
              </a>
            </div>
          ))}

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
