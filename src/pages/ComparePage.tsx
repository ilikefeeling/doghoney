import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CAR_DATABASE } from '../data/cars';
import { PRESET_ITEMS } from '../data/presets';
import { calculateFit } from '../utils/fitCalculator';
import { updateSeoTags } from '../utils/seo';

export const ComparePage: React.FC = () => {
  const { car1Id, car2Id } = useParams<{ car1Id: string; car2Id: string }>();
  const navigate = useNavigate();

  const car1 = CAR_DATABASE.find((c) => c.id === car1Id) || CAR_DATABASE[0];
  const car2 = CAR_DATABASE.find((c) => c.id === car2Id) || CAR_DATABASE[1];

  useEffect(() => {
    updateSeoTags({
      title: `${car1.model} vs ${car2.model} 트렁크 실측 크기 및 용량 1:1 비교`,
      description: `${car1.model} (${car1.volumeLitersFolded}L)와 ${car2.model} (${car2.volumeLitersFolded}L) 트렁크 실측 너비, 깊이, 높이, 폴딩 제원 및 당근 가구 적재력 비교.`,
      keywords: `${car1.model},${car2.model},트렁크 비교,트렁크 용량 비교,차박 비교,가구 적재 비교`,
      canonicalUrl: `https://trunkfit.kr/compare/${car1.id}/${car2.id}`,
    });
  }, [car1, car2]);

  // Sample items fit comparison
  const sampleItems = PRESET_ITEMS.slice(0, 5);

  return (
    <div className="bg-[#F8F9FC] text-[#191C1E] min-h-screen pb-20 font-['Be_Vietnam_Pro'] antialiased max-w-md mx-auto shadow-2xl flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#EDEEF1] p-4 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs font-bold text-[#5A5E67] hover:text-[#191C1E] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>시뮬레이터로 이동</span>
        </button>
        <Link to="/" className="flex items-center gap-1.5 font-extrabold text-[#FF7E36]">
          <span className="material-symbols-outlined text-[20px] fill-1">local_shipping</span>
          <span>개꿀 Doghoney</span>
        </Link>
      </header>

      <main className="p-5 flex flex-col gap-5 flex-1">
        {/* Title Banner */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#FF7E36] uppercase tracking-wider">
            1:1 트렁크 실측 매치
          </span>
          <h1 className="text-[20px] font-extrabold text-[#191C1E] leading-tight">
            {car1.model.split(' ')[0]} vs {car2.model.split(' ')[0]}<br />트렁크 적재력 비교
          </h1>
        </section>

        {/* Head-to-Head Comparison Card */}
        <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Car 1 */}
            <div className="p-3 bg-[#FFDBCC]/20 rounded-xl border border-[#FF7E36]/30 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#FF7E36]">{car1.category}</span>
              <h2 className="font-extrabold text-xs text-[#191C1E] truncate">{car1.model}</h2>
              <strong className="text-[16px] text-[#A04100] mt-1">{car1.volumeLitersFolded} L</strong>
              <span className="text-[10px] text-[#595F67]">최대 폴딩 용량</span>
            </div>

            {/* Car 2 */}
            <div className="p-3 bg-[#F2F3F6] rounded-xl border border-[#EDEEF1] flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#5A5E67]">{car2.category}</span>
              <h2 className="font-extrabold text-xs text-[#191C1E] truncate">{car2.model}</h2>
              <strong className="text-[16px] text-[#191C1E] mt-1">{car2.volumeLitersFolded} L</strong>
              <span className="text-[10px] text-[#595F67]">최대 폴딩 용량</span>
            </div>
          </div>

          {/* Detailed Metric Table */}
          <div className="border border-[#EDEEF1] rounded-xl overflow-hidden text-xs mt-2">
            <div className="grid grid-cols-3 bg-[#F2F3F6] p-2.5 font-bold text-center border-b border-[#EDEEF1]">
              <span className="text-[#595F67] text-left pl-2">제원 항목</span>
              <span className="text-[#FF7E36]">{car1.model.split(' ')[0]}</span>
              <span className="text-[#191C1E]">{car2.model.split(' ')[0]}</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-center border-b border-[#EDEEF1]">
              <span className="text-[#595F67] text-left pl-2">트렁크 너비</span>
              <strong className={car1.width >= car2.width ? 'text-[#FF7E36]' : ''}>{car1.width}cm</strong>
              <strong className={car2.width >= car1.width ? 'text-[#191C1E]' : ''}>{car2.width}cm</strong>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-center border-b border-[#EDEEF1] bg-[#F8F9FC]">
              <span className="text-[#595F67] text-left pl-2">기본 깊이</span>
              <strong className={car1.depth >= car2.depth ? 'text-[#FF7E36]' : ''}>{car1.depth}cm</strong>
              <strong className={car2.depth >= car1.depth ? 'text-[#191C1E]' : ''}>{car2.depth}cm</strong>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-center border-b border-[#EDEEF1]">
              <span className="text-[#595F67] text-left pl-2">2열 폴딩 깊이</span>
              <strong className={car1.depthFolded >= car2.depthFolded ? 'text-[#FF7E36]' : ''}>{car1.depthFolded}cm</strong>
              <strong className={car2.depthFolded >= car1.depthFolded ? 'text-[#191C1E]' : ''}>{car2.depthFolded}cm</strong>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-center border-b border-[#EDEEF1] bg-[#F8F9FC]">
              <span className="text-[#595F67] text-left pl-2">트렁크 높이</span>
              <strong className={car1.height >= car2.height ? 'text-[#FF7E36]' : ''}>{car1.height}cm</strong>
              <strong className={car2.height >= car1.height ? 'text-[#191C1E]' : ''}>{car2.height}cm</strong>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-center">
              <span className="text-[#595F67] text-left pl-2">풀플랫 평탄화</span>
              <span>{car1.hasFlatFold ? '✅ 가능' : '❌ 단차'}</span>
              <span>{car2.hasFlatFold ? '✅ 가능' : '❌ 단차'}</span>
            </div>
          </div>
        </section>

        {/* Popular Furniture Loadability Battle */}
        <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <h2 className="text-base font-extrabold text-[#191C1E]">
            주요 가구 2열 폴딩 적재 비교
          </h2>

          <div className="flex flex-col gap-2">
            {sampleItems.map((item) => {
              const fit1 = calculateFit(item.dimensions, car1, true, false);
              const fit2 = calculateFit(item.dimensions, car2, true, false);

              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#F8F9FC] border border-[#EDEEF1] rounded-xl flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#191C1E]">{item.name}</span>
                    <span className="text-[10px] text-[#595F67]">
                      {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}cm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                    <div
                      className={`p-1.5 rounded-lg ${
                        fit1.status === 'fits'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : fit1.status === 'tight'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#FEE2E2] text-[#B91C1C]'
                      }`}
                    >
                      {car1.model.split(' ')[0]}: {fit1.statusLabel}
                    </div>

                    <div
                      className={`p-1.5 rounded-lg ${
                        fit2.status === 'fits'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : fit2.status === 'tight'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#FEE2E2] text-[#B91C1C]'
                      }`}
                    >
                      {car2.model.split(' ')[0]}: {fit2.statusLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
