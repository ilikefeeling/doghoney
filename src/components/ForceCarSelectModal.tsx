import React, { useState } from 'react';
import { CAR_DATABASE } from '../data/cars';
import { CarTrunk } from '../types';

export const CAR_DATA: Record<string, Record<string, string[]>> = {
  "현대": {
    "아반떼": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "쏘나타": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "그랜저": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "싼타페": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "투싼": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "캐스퍼": ["2024", "2023", "2022", "2021"],
    "베뉴": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "코나": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "팰리세이드": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "스타리아": ["2024", "2023", "2022", "2021"],
    "아이오닉 5": ["2024", "2023", "2022", "2021"],
    "아이오닉 6": ["2024", "2023", "2022"],
    "넥쏘": ["2024", "2023", "2022", "2021", "2020", "2019", "2018"]
  },
  "기아": {
    "모닝": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"],
    "레이": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"],
    "K3": ["2024", "2023", "2022", "2021", "2020"],
    "K5": ["2024", "2023", "2022", "2021", "2020"],
    "K8": ["2024", "2023", "2022", "2021"],
    "셀토스": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "니로": ["2024", "2023", "2022"],
    "스포티지": ["2024", "2023", "2022", "2021"],
    "쏘렌토": ["2024", "2023", "2022", "2021", "2020"],
    "카니발": ["2024", "2023", "2022", "2021", "2020"],
    "EV6": ["2024", "2023", "2022", "2021"],
    "EV9": ["2024", "2023"],
    "모하비": ["2024", "2023", "2022", "2021", "2020", "2019"]
  },
  "제네시스": {
    "G70": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"],
    "G80": ["2024", "2023", "2022", "2021", "2020"],
    "GV70": ["2024", "2023", "2022", "2021"],
    "GV80": ["2024", "2023", "2022", "2021", "2020"]
  },
  "KG모빌리티": {
    "티볼리": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"],
    "코란도": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "토레스": ["2024", "2023", "2022"],
    "렉스턴": ["2024", "2023", "2022", "2021", "2020"]
  },
  "쉐보레": {
    "스파크": ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"],
    "트랙스": ["2024", "2023"],
    "트레일블레이저": ["2024", "2023", "2022", "2021", "2020"],
    "트래버스": ["2024", "2023", "2022", "2021", "2020", "2019"]
  },
  "르노": {
    "아르카나": ["2024", "2023", "2022", "2021", "2020"],
    "QM6": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"],
    "그랑 콜레오스": ["2024"]
  },
  "테슬라": {
    "모델 3": ["2024", "2023", "2022", "2021", "2020", "2019"],
    "모델 Y": ["2024", "2023", "2022", "2021", "2020"],
    "모델 X": ["2024", "2023", "2022", "2021", "2020", "2019", "2018"]
  }
};

interface ForceCarSelectModalProps {
  isOpen: boolean;
  onSelectCar: (car: CarTrunk, mfg: string, model: string, year: string) => void;
  onCancel?: () => void;
}

export const ForceCarSelectModal: React.FC<ForceCarSelectModalProps> = ({
  isOpen,
  onSelectCar,
  onCancel
}) => {
  const [manufacturer, setManufacturer] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");

  if (!isOpen) return null;

  const availableModels = manufacturer ? Object.keys(CAR_DATA[manufacturer] || {}) : [];
  const availableYears = manufacturer && carModel ? (CAR_DATA[manufacturer][carModel] || []) : [];

  const handleConfirm = () => {
    // Find matching car from CAR_DATABASE
    let matchingCar = CAR_DATABASE.find(c => c.model.includes(carModel));
    if (!matchingCar) {
      // Fallback to the first car in database if no strict match
      matchingCar = CAR_DATABASE[0]; 
    }
    onSelectCar(matchingCar, manufacturer, carModel, carYear);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#EDEEF1] flex justify-between items-center bg-[#F8F9FC]">
          <div>
            <h3 className="font-extrabold text-[18px] text-[#191C1E]">내 차량 선택</h3>
            <p className="text-xs text-[#595F67] mt-1">시뮬레이션을 위해 실을 차량을 선택해주세요</p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white border border-[#EDEEF1] flex items-center justify-center text-[#5A5E67] hover:bg-[#F2F3F6]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          {/* 제조사 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#595F67] ml-1">제조사</label>
            <div className="relative">
              <select 
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value);
                  setCarModel("");
                  setCarYear("");
                }}
                className="w-full bg-[#F2F3F6] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#191C1E] outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>제조사를 선택해주세요</option>
                {Object.keys(CAR_DATA).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#595F67] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* 차종 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#595F67] ml-1">차종</label>
            <div className="relative">
              <select 
                value={carModel}
                onChange={(e) => {
                  setCarModel(e.target.value);
                  setCarYear("");
                }}
                disabled={!manufacturer}
                className="w-full bg-[#F2F3F6] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#191C1E] outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>차종을 선택해주세요</option>
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#595F67] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* 연식 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#595F67] ml-1">연식</label>
            <div className="relative">
              <select 
                value={carYear}
                onChange={(e) => setCarYear(e.target.value)}
                disabled={!carModel}
                className="w-full bg-[#F2F3F6] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#191C1E] outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>연식을 선택해주세요</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}년식</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#595F67] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!manufacturer || !carModel || !carYear}
            className="w-full mt-2 bg-[#FF7E36] hover:bg-[#E56A28] disabled:bg-[#E1E2E5] disabled:text-[#9EA3AC] text-white font-bold text-[15px] py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};
