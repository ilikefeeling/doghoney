import React, { useState } from 'react';
import { CAR_DATABASE } from '../data/cars';
import { calculateFit } from '../utils/fitCalculator';
import { HistoryRecord, ItemDimensions } from '../types';

interface HistoryViewProps {
  history: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  const [compareCar1Id, setCompareCar1Id] = useState('hyundai-santafe-2023');
  const [compareCar2Id, setCompareCar2Id] = useState('hyundai-casper');
  const [sampleItem, setSampleItem] = useState<ItemDimensions>({
    width: 120,
    depth: 60,
    height: 75,
    name: '2인용 패브릭 소파',
  });

  const car1 = CAR_DATABASE.find((c) => c.id === compareCar1Id) || CAR_DATABASE[0];
  const car2 = CAR_DATABASE.find((c) => c.id === compareCar2Id) || CAR_DATABASE[4];

  const fitCar1 = calculateFit(sampleItem, car1, true, false);
  const fitCar2 = calculateFit(sampleItem, car2, true, false);

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-extrabold text-[#191C1E]">적재 기록 & 차종 비교</h2>
        <p className="text-xs text-[#5A5E67] mt-0.5">최근 측정한 가구와 차종별 적재 가능 여부 비교</p>
      </div>

      {/* 1. Compare 2 Cars Tool */}
      <section className="bg-white rounded-2xl p-4 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#FF7E36] uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            차종 간 트렁크 적재력 1:1 비교
          </span>
        </div>

        {/* Item Selector */}
        <div className="p-2.5 bg-[#F8F9FC] rounded-xl border border-[#EDEEF1] flex items-center justify-between text-xs">
          <span className="text-[#595F67]">비교 대상 물품</span>
          <strong className="text-[#191C1E]">
            {sampleItem.name} ({sampleItem.width}×{sampleItem.depth}×{sampleItem.height}cm)
          </strong>
        </div>

        {/* 2 Cars Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Car 1 */}
          <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#EDEEF1] flex flex-col gap-2">
            <select
              value={compareCar1Id}
              onChange={(e) => setCompareCar1Id(e.target.value)}
              className="text-xs font-bold bg-white border border-[#E1E2E5] rounded-lg p-1.5 outline-none w-full"
            >
              {CAR_DATABASE.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.model}
                </option>
              ))}
            </select>

            <div
              className={`p-2 rounded-lg text-center font-bold text-xs ${
                fitCar1.status === 'fits'
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : fitCar1.status === 'tight'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#FEE2E2] text-[#B91C1C]'
              }`}
            >
              {fitCar1.statusLabel}
            </div>

            <div className="text-[11px] text-[#595F67] flex flex-col gap-0.5">
              <div className="flex justify-between">
                <span>폴딩 깊이</span>
                <strong>{car1.depthFolded}cm</strong>
              </div>
              <div className="flex justify-between">
                <span>트렁크 높이</span>
                <strong>{car1.height}cm</strong>
              </div>
              <div className="flex justify-between">
                <span>용량</span>
                <strong>{car1.volumeLitersFolded}L</strong>
              </div>
            </div>
          </div>

          {/* Car 2 */}
          <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#EDEEF1] flex flex-col gap-2">
            <select
              value={compareCar2Id}
              onChange={(e) => setCompareCar2Id(e.target.value)}
              className="text-xs font-bold bg-white border border-[#E1E2E5] rounded-lg p-1.5 outline-none w-full"
            >
              {CAR_DATABASE.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.model}
                </option>
              ))}
            </select>

            <div
              className={`p-2 rounded-lg text-center font-bold text-xs ${
                fitCar2.status === 'fits'
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : fitCar2.status === 'tight'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#FEE2E2] text-[#B91C1C]'
              }`}
            >
              {fitCar2.statusLabel}
            </div>

            <div className="text-[11px] text-[#595F67] flex flex-col gap-0.5">
              <div className="flex justify-between">
                <span>폴딩 깊이</span>
                <strong>{car2.depthFolded}cm</strong>
              </div>
              <div className="flex justify-between">
                <span>트렁크 높이</span>
                <strong>{car2.height}cm</strong>
              </div>
              <div className="flex justify-between">
                <span>용량</span>
                <strong>{car2.volumeLitersFolded}L</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Recent History Records */}
      <section className="bg-white rounded-2xl p-4 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[16px] text-[#191C1E] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#5A5E67]">history</span>
            최근 측정 기록 ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] text-[#5A5E67] hover:text-[#BA1A1A] transition-colors"
            >
              기록 삭제
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[#9EA3AC]">
            <span className="material-symbols-outlined text-[40px]">inventory_2</span>
            <p className="text-xs">아직 측정된 기록이 없습니다.<br />홈 화면에서 당근 가구를 측정해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((record) => (
              <div
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="p-3 bg-[#F8F9FC] hover:bg-[#F2F3F6] border border-[#EDEEF1] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#EDEEF1] flex items-center justify-center text-[#FF7E36]">
                    <span className="material-symbols-outlined text-[20px]">
                      {record.item.category === '가전' ? 'tv' : 'chair'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#191C1E]">
                      {record.item.name || '가구/가전'}
                    </h4>
                    <p className="text-[11px] text-[#595F67]">
                      {record.item.width}×{record.item.depth}×{record.item.height}cm • {record.car.model.split(' ')[0]}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    record.result.status === 'fits'
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : record.result.status === 'tight'
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : 'bg-[#FEE2E2] text-[#B91C1C]'
                  }`}
                >
                  {record.result.statusLabel}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
