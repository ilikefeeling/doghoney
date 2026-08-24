import React, { useState } from 'react';
import { CAR_DATABASE } from '../data/cars';
import { CarTrunk } from '../types';

interface CarSelectorProps {
  selectedCar: CarTrunk;
  onSelectCar: (car: CarTrunk) => void;
}

export const CarSelector: React.FC<CarSelectorProps> = ({ selectedCar, onSelectCar }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredCars = CAR_DATABASE.filter((car) => {
    const matchesSearch =
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || car.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between pl-1">
        <label className="text-[12px] font-semibold text-[#5A5E67]">내 차량 선택</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-[11px] font-semibold text-[#FF7E36] hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[13px]">tune</span>
          차종 검색/상세 스펙
        </button>
      </div>

      <div className="relative">
        <select
          value={selectedCar.id}
          onChange={(e) => {
            const found = CAR_DATABASE.find((c) => c.id === e.target.value);
            if (found) onSelectCar(found);
          }}
          className="w-full appearance-none bg-[#F8F9FC] border border-[#E1E2E5] rounded-xl px-4 py-3 font-semibold text-[15px] text-[#191C1E] focus:border-[#FF7E36] focus:ring-2 focus:ring-[#FF7E36]/20 outline-none pr-10 cursor-pointer transition-all hover:bg-[#F2F3F6]"
        >
          {CAR_DATABASE.map((car) => (
            <option key={car.id} value={car.id}>
              {car.model} ({car.category})
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#595F67] pointer-events-none text-[20px]">
          expand_more
        </span>
      </div>

      {/* Quick vehicle specs summary */}
      <div className="flex items-center justify-between text-[11px] text-[#595F67] px-1 pt-0.5">
        <span>
          트렁크: {selectedCar.width} × {selectedCar.depth} × {selectedCar.height} cm
        </span>
        <span className="font-semibold text-[#FF7E36]">
          2열 폴딩 시: {selectedCar.depthFolded} cm ({selectedCar.volumeLitersFolded}L)
        </span>
      </div>

      {/* Car Search & Specs Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#EDEEF1] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[18px] text-[#191C1E]">차량 선택 및 트렁크 제원</h3>
                <p className="text-xs text-[#595F67]">국내 인기 차종별 실측 트렁크 크기</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2F3F6] text-[#5A5E67] flex items-center justify-center hover:bg-[#E1E2E5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search and Category Filters */}
            <div className="p-3 border-b border-[#EDEEF1] flex flex-col gap-2 bg-[#F8F9FC]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#595F67] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="차종명 또는 브랜드 검색 (예: 싼타페, 쏘렌토, 테슬라...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#E1E2E5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#191C1E] focus:border-[#FF7E36] outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {['ALL', 'SUV', 'Sedan', 'Compact', 'EV', 'Van'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#FF7E36] text-white'
                        : 'bg-white text-[#5A5E67] border border-[#EDEEF1]'
                    }`}
                  >
                    {cat === 'ALL' ? '전체' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Car List */}
            <div className="overflow-y-auto p-3 flex flex-col gap-2 flex-1">
              {filteredCars.map((car) => {
                const isSelected = car.id === selectedCar.id;
                return (
                  <div
                    key={car.id}
                    onClick={() => {
                      onSelectCar(car);
                      setIsModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#FFDBCC]/30 border-[#FF7E36] shadow-xs'
                        : 'bg-white border-[#EDEEF1] hover:border-[#DFC0B3] hover:bg-[#F8F9FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[14px] text-[#191C1E]">{car.model}</span>
                        <span className="text-[10px] bg-[#F2F3F6] text-[#5A5E67] font-semibold px-2 py-0.5 rounded-full">
                          {car.category}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[#FF7E36] text-[20px] fill-1">
                          check_circle
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[11px] bg-[#F8F9FC] p-2 rounded-lg text-center">
                      <div>
                        <span className="text-[#595F67] block text-[10px]">트렁크 너비</span>
                        <strong className="text-[#191C1E]">{car.width}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">기본 깊이</span>
                        <strong className="text-[#191C1E]">{car.depth}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">폴딩 깊이</span>
                        <strong className="text-[#FF7E36]">{car.depthFolded}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">내부 높이</span>
                        <strong className="text-[#191C1E]">{car.height}cm</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
