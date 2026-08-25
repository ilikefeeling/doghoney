/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CarTrunk, ItemDimensions } from '../types';
import { MultiItemPackingAgent } from '../utils/spatialRL/MultiItemPackingAgent';

interface MultiItemPackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarTrunk;
  isFolded: boolean;
  initialItem?: ItemDimensions;
}

const PRESET_COMBOS: { name: string; icon: string; items: ItemDimensions[] }[] = [
  {
    name: '⛺ 주말 2인 캠핑 세트',
    icon: 'camping',
    items: [
      { name: '4인용 텐트', width: 65, depth: 25, height: 25, category: '취미' },
      { name: '알루미늄 롤테이블', width: 70, depth: 15, height: 15, category: '취미' },
      { name: '캠핑 릴렉스체어 2개', width: 90, depth: 20, height: 20, category: '취미' },
      { name: '아이스박스 쿨러 28L', width: 45, depth: 32, height: 38, category: '취미' },
    ],
  },
  {
    name: '👶 육아 외출 풀세트',
    icon: 'child_friendly',
    items: [
      { name: '휴대용 유모차', width: 55, depth: 30, height: 45, category: '육아' },
      { name: '기저귀가방 & 쿨러', width: 40, depth: 25, height: 30, category: '육아' },
      { name: '24인치 캐리어', width: 42, depth: 26, height: 65, category: '기타' },
    ],
  },
  {
    name: '📦 원룸 소형 이사 세트',
    icon: 'inventory_2',
    items: [
      { name: '대형 리빙박스 1호', width: 60, depth: 40, height: 35, category: '가구' },
      { name: '대형 리빙박스 2호', width: 60, depth: 40, height: 35, category: '가구' },
      { name: '조립식 3단 서랍장', width: 45, depth: 40, height: 60, category: '가구' },
      { name: '선풍기 박스', width: 38, depth: 38, height: 55, category: '가전' },
    ],
  },
];

export const MultiItemPackingModal: React.FC<MultiItemPackingModalProps> = ({
  isOpen,
  onClose,
  car,
  isFolded,
  initialItem,
}) => {
  const [items, setItems] = useState<ItemDimensions[]>(() => {
    return initialItem
      ? [initialItem, { name: '추가 수납 박스', width: 45, depth: 35, height: 30, category: '기타' }]
      : PRESET_COMBOS[0].items;
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemW, setNewItemW] = useState('');
  const [newItemD, setNewItemD] = useState('');
  const [newItemH, setNewItemH] = useState('');

  const packingResult = useMemo(() => {
    const agent = new MultiItemPackingAgent(car, items, isFolded);
    return agent.solve();
  }, [car, items, isFolded]);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newItemW);
    const d = parseFloat(newItemD);
    const h = parseFloat(newItemH);
    if (!w || !d || !h) return;

    setItems((prev) => [
      ...prev,
      {
        name: newItemName.trim() || `물품 ${prev.length + 1}`,
        width: w,
        depth: d,
        height: h,
        category: '기타',
      },
    ]);

    setNewItemName('');
    setNewItemW('');
    setNewItemD('');
    setNewItemH('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#191C1E] to-[#334155] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-[16px]">복수 물품 3D 테트리스 패킹</h3>
                <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  AI RL
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {car.model} ({isFolded ? '2열 폴딩' : '기본 트렁크'}) 공간 최적 배치
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 bg-[#F8F9FC]">
          {/* Preset Combos */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#64748B]">추천 세트 불러오기</span>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_COMBOS.map((combo) => (
                <button
                  key={combo.name}
                  onClick={() => setItems(combo.items)}
                  className="bg-white hover:bg-orange-50/60 p-2 rounded-xl border border-slate-200 hover:border-[#FF7E36] text-[11px] font-bold text-slate-700 hover:text-[#FF7E36] transition-all text-center truncate cursor-pointer"
                >
                  {combo.name}
                </button>
              ))}
            </div>
          </div>

          {/* Result Summary Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-2.5 shadow-xs ${
              packingResult.allFit
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-rose-50/80 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  packingResult.allFit
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {packingResult.allFit ? '✅ 전량 적재 가능' : '⚠️ 일부 적재 불가'}
              </span>
              <span className="text-xs font-bold text-slate-600">
                적재 성공: <strong className="text-slate-900">{packingResult.packedCount}</strong> / {packingResult.totalItems}개
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-slate-500">총 공간 점유율: </span>
                <strong className="text-[#3B82F6]">{packingResult.totalVolumeEfficiency}%</strong>
              </div>
              <div>
                <span className="text-slate-500">물리 안정성: </span>
                <strong className="text-emerald-600">{packingResult.stabilityScore}점</strong>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              💡 {packingResult.packingAdvice}
            </p>
          </div>

          {/* Packed Items List */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-slate-700">적재 목록 ({items.length}개)</span>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {items.map((it, idx) => {
                const packedPos = packingResult.packedItems.find((p) => p.item === it);
                return (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: packedPos?.color || '#94A3B8' }}
                      />
                      <div>
                        <strong className="text-slate-800">{it.name}</strong>
                        <span className="text-slate-400 ml-1.5 text-[11px]">
                          ({it.width}×{it.depth}×{it.height}cm)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          packedPos
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {packedPos ? '적재' : '불가'}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-800">+ 새로운 물품 추가</span>
            <input
              type="text"
              placeholder="물품 이름 (예: 아이스박스)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF7E36]"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="가로(cm)"
                value={newItemW}
                onChange={(e) => setNewItemW(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF7E36]"
                required
              />
              <input
                type="number"
                placeholder="세로(cm)"
                value={newItemD}
                onChange={(e) => setNewItemD(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF7E36]"
                required
              />
              <input
                type="number"
                placeholder="높이(cm)"
                value={newItemH}
                onChange={(e) => setNewItemH(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF7E36]"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#191C1E] hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
            >
              물품 추가 및 3D 테트리스 연산
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#FF7E36] hover:bg-[#E0601A] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
