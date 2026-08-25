import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CAR_DATABASE } from '../data/cars';
import { PRESET_ITEMS } from '../data/presets';
import { calculateFit } from '../utils/fitCalculator';
import { updateSeoTags } from '../utils/seo';

export const CarDetailPage: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();

  const car = CAR_DATABASE.find((c) => c.id === carId) || CAR_DATABASE[0];
  const [isFolded, setIsFolded] = useState(true);

  useEffect(() => {
    updateSeoTags({
      title: `${car.model} 트렁크 실측 크기 & 당근 가구 적재 가능 여부`,
      description: `${car.model} 트렁크 너비 ${car.width}cm, 깊이 ${car.depth}cm, 2열 폴딩 시 ${car.depthFolded}cm, 용량 ${car.volumeLitersFolded}L. 이케아 가구, 65인치 TV 적재 시뮬레이션.`,
      keywords: `${car.model},${car.brand},트렁크 크기,트렁크 용량,차박,가구 적재,골프백,유모차`,
      canonicalUrl: `https://trunkfit.kr/car/${car.id}`,
    });
  }, [car]);

  // Check preset items fit in this car
  const presetResults = PRESET_ITEMS.map((item) => ({
    item,
    fit: calculateFit(item.dimensions, car, isFolded, false),
  }));

  const handleStartSimulateWithCar = (presetItem?: any) => {
    // Navigate to main with state or url param
    navigate('/', { state: { selectedCarId: car.id, presetItem } });
  };

  return (
    <div className="bg-[#F8F9FC] text-[#191C1E] min-h-[100dvh] pb-20 font-['Be_Vietnam_Pro'] antialiased max-w-md mx-auto shadow-2xl flex flex-col">
      {/* Top Header */}
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
        {/* Car Hero Banner */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#FF7E36] bg-[#FFDBCC] px-2.5 py-0.5 rounded-full">
              {car.category} • {car.year || '2023~2026'}
            </span>
            <span className="text-xs text-[#595F67]">{car.brand}</span>
          </div>

          <h1 className="text-[22px] font-extrabold text-[#191C1E] leading-tight">
            {car.model}<br />트렁크 실측 제원표
          </h1>

          <p className="text-xs text-[#5A5E67]">
            실측 휠하우스 내측 최소폭 및 2열 폴딩 유효 바닥 기준 데이터
          </p>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <div className="bg-[#F8F9FC] p-3 rounded-xl border border-[#EDEEF1] text-center">
              <span className="text-[10px] text-[#595F67] block">트렁크 너비 (최소폭)</span>
              <strong className="text-[18px] text-[#191C1E] font-extrabold">{car.width} cm</strong>
            </div>
            <div className="bg-[#F8F9FC] p-3 rounded-xl border border-[#EDEEF1] text-center">
              <span className="text-[10px] text-[#595F67] block">트렁크 높이</span>
              <strong className="text-[18px] text-[#191C1E] font-extrabold">{car.height} cm</strong>
            </div>
            <div className="bg-[#F8F9FC] p-3 rounded-xl border border-[#EDEEF1] text-center">
              <span className="text-[10px] text-[#595F67] block">기본 트렁크 깊이</span>
              <strong className="text-[18px] text-[#191C1E] font-extrabold">{car.depth} cm</strong>
            </div>
            <div className="bg-[#FFDBCC]/30 p-3 rounded-xl border border-[#FF7E36] text-center">
              <span className="text-[10px] text-[#A04100] font-bold block">2열 폴딩 깊이</span>
              <strong className="text-[18px] text-[#FF7E36] font-extrabold">{car.depthFolded} cm</strong>
            </div>
          </div>

          {/* Additional details */}
          <div className="text-xs text-[#595F67] bg-[#F8F9FC] p-3 rounded-xl flex flex-col gap-1.5 border border-[#EDEEF1]">
            <div className="flex justify-between">
              <span>트렁크 개구부 (입구)</span>
              <strong className="text-[#191C1E]">{car.openingWidth} × {car.openingHeight} cm</strong>
            </div>
            <div className="flex justify-between">
              <span>최대 대각선 여유</span>
              <strong className="text-[#191C1E]">{car.diagonalMax} cm</strong>
            </div>
            <div className="flex justify-between">
              <span>적재 용량 (기본 / 폴딩)</span>
              <strong className="text-[#FF7E36]">{car.volumeLiters} L / {car.volumeLitersFolded} L</strong>
            </div>
            <div className="flex justify-between">
              <span>풀플랫 (완전 평탄화)</span>
              <strong className="text-[#191C1E]">{car.hasFlatFold ? '✅ 지원 (차박 최적)' : '❌ 미지원 (단차 있음)'}</strong>
            </div>
          </div>

          <button
            onClick={() => handleStartSimulateWithCar()}
            className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-bold py-3.5 rounded-xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
            <span>이 차로 3D 적재 시뮬레이션 시작</span>
          </button>
        </section>

        {/* Preset Items Fit Compatibility Matrix */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#191C1E]">
              당근 인기 가구 적재 가능표
            </h2>
            <button
              onClick={() => setIsFolded(!isFolded)}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                isFolded ? 'bg-[#FF7E36] text-white' : 'bg-[#F2F3F6] text-[#5A5E67]'
              }`}
            >
              {isFolded ? '2열 폴딩 기준' : '기본 트렁크 기준'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {presetResults.map(({ item, fit }) => (
              <div
                key={item.id}
                onClick={() => handleStartSimulateWithCar(item)}
                className="p-3 bg-[#F8F9FC] hover:bg-[#F2F3F6] border border-[#EDEEF1] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#FF7E36] text-[22px]">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-[#191C1E]">{item.name}</h3>
                    <p className="text-[10px] text-[#595F67]">
                      {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}cm
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    fit.status === 'fits'
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : fit.status === 'tight'
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : 'bg-[#FEE2E2] text-[#B91C1C]'
                  }`}
                >
                  {fit.statusLabel}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Other Cars Recommendation */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <h2 className="text-base font-extrabold text-[#191C1E]">비슷한 차급 다른 차종 보기</h2>
          <div className="grid grid-cols-2 gap-2">
            {CAR_DATABASE.filter((c) => c.category === car.category && c.id !== car.id).slice(0, 4).map((c) => (
              <Link
                key={c.id}
                to={`/car/${c.id}`}
                className="p-2.5 rounded-xl border border-[#EDEEF1] hover:border-[#FF7E36] bg-[#F8F9FC] text-xs font-semibold flex flex-col gap-0.5"
              >
                <span className="text-[#191C1E] truncate">{c.model}</span>
                <span className="text-[10px] text-[#FF7E36]">폴딩 {c.depthFolded}cm • {c.volumeLitersFolded}L</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
