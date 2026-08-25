import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PRESET_ITEMS } from '../data/presets';
import { CAR_DATABASE } from '../data/cars';
import { calculateFit } from '../utils/fitCalculator';
import { updateSeoTags } from '../utils/seo';

export const ItemDetailPage: React.FC = () => {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();

  const preset = PRESET_ITEMS.find((p) => p.id === presetId) || PRESET_ITEMS[0];
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    updateSeoTags({
      title: `${preset.name} 트렁크에 실리는 차종 순위 (51종 실측)`,
      description: `${preset.name} (${preset.dimensions.width}×${preset.dimensions.depth}×${preset.dimensions.height}cm) 적재 가능한 국내 SUV, 승용차, 경차 순위. 3D 트렁크 적재 시뮬레이션 무료 제공.`,
      keywords: `${preset.name},당근마켓,트렁크 적재,SUV,경차,싼타페,쏘렌토,카니발,이케아`,
      canonicalUrl: `https://trunkfit.kr/item/${preset.id}`,
    });
  }, [preset]);

  // Calculate fits for all 51 cars
  const carFits = CAR_DATABASE.map((car) => ({
    car,
    fitFolded: calculateFit(preset.dimensions, car, true, false),
    fitNormal: calculateFit(preset.dimensions, car, false, false),
  }));

  const filteredCars = carFits.filter(({ car }) =>
    filterCategory === 'ALL' ? true : car.category === filterCategory
  );

  // Sort: fits > tight > over
  const sortedCars = [...filteredCars].sort((a, b) => {
    const score = (status: string) => (status === 'fits' ? 3 : status === 'tight' ? 2 : 1);
    return score(b.fitFolded.status) - score(a.fitFolded.status);
  });

  const handleSelectCarForSimulation = (carId: string) => {
    navigate('/', { state: { selectedCarId: carId, presetItem: preset } });
  };

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
        {/* Item Hero */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFDBCC] text-[#FF7E36] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">{preset.icon}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#FF7E36] uppercase">{preset.category}</span>
              <h1 className="text-[20px] font-extrabold text-[#191C1E] leading-tight">
                {preset.name}
              </h1>
              <p className="text-xs text-[#595F67]">
                규격: {preset.dimensions.width} × {preset.dimensions.depth} × {preset.dimensions.height} cm
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#FFF7ED] rounded-xl border border-[#FFEDD5] text-xs text-[#7A3000]">
            💡 <strong>적재 꿀팁:</strong> {preset.tip}
          </div>
        </section>

        {/* Compatible Cars List */}
        <section className="bg-white rounded-2xl p-5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#191C1E]">
              적재 가능 차종 랭킹 (51종)
            </h2>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'SUV', 'Sedan', 'Compact', 'EV', 'Van'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  filterCategory === cat
                    ? 'bg-[#FF7E36] text-white'
                    : 'bg-[#F8F9FC] text-[#5A5E67] border border-[#EDEEF1]'
                }`}
              >
                {cat === 'ALL' ? '전체' : cat}
              </button>
            ))}
          </div>

          {/* Cars List */}
          <div className="flex flex-col gap-2">
            {sortedCars.map(({ car, fitFolded }) => (
              <div
                key={car.id}
                onClick={() => handleSelectCarForSimulation(car.id)}
                className="p-3 bg-[#F8F9FC] hover:bg-[#F2F3F6] border border-[#EDEEF1] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-[#191C1E]">{car.model}</h3>
                    <span className="text-[10px] text-[#595F67]">{car.category}</span>
                  </div>
                  <p className="text-[10px] text-[#595F67]">
                    폴딩 깊이 {car.depthFolded}cm • 높이 {car.height}cm
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      fitFolded.status === 'fits'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : fitFolded.status === 'tight'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    {fitFolded.statusLabel}
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[#9EA3AC]">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
