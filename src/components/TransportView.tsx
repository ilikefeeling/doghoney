import React from 'react';
import { CAR_DATABASE } from '../data/cars';
import { calculateFit } from '../utils/fitCalculator';
import { ItemDimensions } from '../types';

interface TransportViewProps {
  dimensions?: ItemDimensions | null;
}

export const TransportView: React.FC<TransportViewProps> = ({ dimensions }) => {
  // If dimensions exist, calculate which cars can fit the item
  const recommendedCars = React.useMemo(() => {
    if (!dimensions) return [];

    const fitResults = CAR_DATABASE.map((car) => {
      // Always assume folded seats and diagonal allowed for maximizing transport capability
      const fit = calculateFit(dimensions, car, true, true);
      return { car, fit };
    });

    // Filter to only cars that fit (fits or tight)
    const validCars = fitResults.filter((r) => r.fit.status !== 'fails');

    // Sort by smallest volume first (cheapest rent)
    validCars.sort((a, b) => a.car.volumeLitersFolded - b.car.volumeLitersFolded);

    // Get top 4 smallest cars
    return validCars.slice(0, 4);
  }, [dimensions]);

  return (
    <div className="flex flex-col gap-4 py-2 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-extrabold text-[#191C1E]">
          맞춤형 운반 솔루션
        </h2>
        <p className="text-xs text-[#5A5E67] mt-0.5">
          {dimensions
            ? `${dimensions.name} 옮길 용달이 필요하신가요?`
            : '당근마켓 물건을 분석하시면, 딱 맞는 차량과 용달 요금을 추천해 드립니다.'}
        </p>
      </div>

      {!dimensions ? (
        <section className="bg-white rounded-2xl p-8 ambient-shadow border border-[#EDEEF1] flex flex-col items-center justify-center gap-4 text-center mt-4">
          <div className="w-16 h-16 bg-[#F2F3F6] rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5A5E67] text-[32px]">
              straighten
            </span>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#191C1E]">
              아직 측정된 가구가 없습니다
            </h3>
            <p className="text-[#5A5E67] text-[15px] font-medium leading-relaxed">
              측정 탭에서 당근마켓 물건 사진을 분석하시면<br />
              필요한 차량 크기와 요금을 알려드려요!
            </p>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Local Errand Apps */}
          <section className="bg-white rounded-2xl p-4 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D4AA]">
                diversity_3
              </span>
              <h3 className="font-bold text-[15px] text-[#191C1E]">동네 이웃에게 운반 부탁하기</h3>
            </div>
            
            <p className="text-[12px] text-[#5A5E67] leading-snug">
              가까운 거리는 용달보다 동네 심부름 앱이 저렴합니다.<br/>
              SUV를 가진 이웃에게 운반을 부탁해 보세요. (예상 비용 1~2만 원)
            </p>

            <div className="flex flex-col gap-2 mt-1">
              <a
                href="https://pleasehelp.co.kr/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#F8F9FC] border border-[#EDEEF1] hover:border-[#00D4AA] rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#00D4AA] text-[18px]">
                      handshake
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-[#191C1E]">심부름 매칭 앱 열기</h4>
                    <p className="text-[11px] text-[#595F67] mt-0.5">
                      '해주세요', '애니맨' 등 긱워커 연결
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#5A5E67] group-hover:text-[#00D4AA] text-[20px]">
                  arrow_forward
                </span>
              </a>
            </div>
          </section>

          {/* Freight Info */}
          <section className="bg-white rounded-2xl p-4 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3B82F6]">
                local_shipping
              </span>
              <h3 className="font-bold text-[15px] text-[#191C1E]">용달 배송 시세 (참고용)</h3>
            </div>
            
            <div className="border border-[#EDEEF1] rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-[#F2F3F6] p-2.5 font-bold text-[#191C1E] text-center border-b border-[#EDEEF1]">
                <span>거리</span>
                <span>다마스</span>
                <span>라보</span>
                <span>1톤</span>
              </div>
              <div className="grid grid-cols-4 p-2.5 text-center border-b border-[#EDEEF1]">
                <span className="font-semibold text-[#5A5E67]">5km 내</span>
                <span className="text-[#3B82F6] font-bold">2.5만</span>
                <span className="text-[#3B82F6] font-bold">3.0만</span>
                <span className="text-[#5A5E67]">4.5만</span>
              </div>
              <div className="grid grid-cols-4 p-2.5 text-center border-b border-[#EDEEF1] bg-[#F8F9FC]">
                <span className="font-semibold text-[#5A5E67]">15km 내</span>
                <span className="text-[#3B82F6] font-bold">3.5만</span>
                <span className="text-[#3B82F6] font-bold">4.0만</span>
                <span className="text-[#5A5E67]">5.5만</span>
              </div>
              <div className="grid grid-cols-4 p-2.5 text-center border-b border-[#EDEEF1]">
                <span className="font-semibold text-[#5A5E67]">30km 내</span>
                <span className="text-[#5A5E67]">5.0만</span>
                <span className="text-[#5A5E67]">5.5만</span>
                <span className="text-[#5A5E67]">7.5만</span>
              </div>
            </div>

            <div className="p-3 bg-[#EFF6FF] rounded-xl border border-[#DBEAFE] text-[11px] text-[#1E3A8A] flex flex-col gap-1.5 mt-1">
              <strong className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lightbulb</span> 용달 꿀팁</strong>
              <p>• 가구 값과 용달비를 합친 금액이 새 상품보다 저렴한지 꼭 비교해보세요!</p>
              <p>• "단순 운송(차량만 이동)"과 "기사님 상하차 도움(+2~3만원)"을 사전에 명확히 합의해야 추가 요금 분쟁이 없습니다.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
