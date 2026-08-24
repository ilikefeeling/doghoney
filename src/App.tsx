/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractDimensionsWithGemini } from './utils/textParser';
import { CAR_DATABASE } from './data/cars';
import { PRESET_ITEMS } from './data/presets';
import { calculateFit } from './utils/fitCalculator';
import { CarTrunk, HistoryRecord, ItemDimensions } from './types';
import { TopAppBar } from './components/TopAppBar';
import { OcrUploadZone } from './components/OcrUploadZone';
import { DimensionInputs } from './components/DimensionInputs';
import { CarSelector } from './components/CarSelector';
import { PhysicsToggles } from './components/PhysicsToggles';
import { TrunkScene3D } from './components/TrunkScene3D';
import { CertificationCardModal } from './components/CertificationCardModal';
import { TransportModal } from './components/TransportModal';
import { AlternativeGoodsModal } from './components/AlternativeGoodsModal';
import { HelpModal } from './components/HelpModal';
import { ShareGuideModal } from './components/ShareGuideModal';
import { HistoryView } from './components/HistoryView';
import { TransportView } from './components/TransportView';
import { ProfileView } from './components/ProfileView';
import { BottomNavBar, TabKey } from './components/BottomNavBar';
import { ForceCarSelectModal } from './components/ForceCarSelectModal';
import { useAuth } from './hooks/useAuth';
import { useRateLimit } from './hooks/useRateLimit';

// ─── LocalStorage keys ───
const STORAGE_KEY_HISTORY = 'trunkfit-history';
const STORAGE_KEY_CAR = 'trunkfit-selected-car';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isLoggedIn, user, loginWithKakao, logout } = useAuth();
  const { incrementUsage, LIMIT_COUNT } = useRateLimit(isLoggedIn);

  const [activeTab, setActiveTab] = useState<TabKey>('measure');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [hasSelectedCar, setHasSelectedCar] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY_CAR);
  });

  // Selected Car (persisted)
  const [selectedCar, setSelectedCar] = useState<CarTrunk>(() => {
    try {
      const savedCarId = localStorage.getItem(STORAGE_KEY_CAR);
      if (savedCarId) {
        const found = CAR_DATABASE.find((c) => c.id === savedCarId);
        if (found) return found;
      }
    } catch { /* ignore */ }
    return CAR_DATABASE[0]; // Hyundai Santa Fe (2023)
  });

  const handleSelectCar = (car: CarTrunk) => {
    setSelectedCar(car);
    setHasSelectedCar(true);
    try {
      localStorage.setItem(STORAGE_KEY_CAR, car.id);
    } catch { /* ignore */ }
  };

  const [shareToast, setShareToast] = useState<string | null>(null);

  // Handle incoming router state (e.g. from ShareTargetPage, CarDetailPage, ItemDetailPage) or Web Share Target params
  useEffect(() => {
    // 1. Router state
    if (location.state) {
      const state = location.state as {
        selectedCarId?: string;
        sharedItem?: ItemDimensions;
        sharedImage?: string;
        toastMessage?: string;
      };

      if (state.selectedCarId) {
        const foundCar = CAR_DATABASE.find((c) => c.id === state.selectedCarId);
        if (foundCar) setSelectedCar(foundCar);
      }

      if (state.sharedItem) {
        setDimensions({
          ...state.sharedItem,
          image: state.sharedImage || state.sharedItem.image,
        });
      }

      if (state.toastMessage) {
        setShareToast(state.toastMessage);
        const timer = setTimeout(() => setShareToast(null), 5000);
        return () => clearTimeout(timer);
      }

      setActiveTab('measure');
    }

    // 2. PWA Web Share Target Query Parameters (?title=...&text=...&url=...)
    // Or Shared URL via Kakao/WebShare (?carId=...)
    const params = new URLSearchParams(location.search);
    const sharedCarId = params.get('carId');
    if (sharedCarId) {
      const foundCar = CAR_DATABASE.find((c) => c.id === sharedCarId);
      if (foundCar) setSelectedCar(foundCar);
    }

    const sharedTitle = params.get('title') || '';
    const sharedText = params.get('text') || '';
    const sharedUrl = params.get('url') || '';

    const combinedInput = `${sharedTitle} ${sharedText} ${sharedUrl}`.trim();
    if (combinedInput) {
      const parseSharedData = async () => {
        setIsAiParsing(true);
        // 1. Try to extract dimensions from text using Gemini API
        const extractedDims = await extractDimensionsWithGemini(combinedInput);
        setIsAiParsing(false);
        
        if (extractedDims && (extractedDims.width || extractedDims.depth || extractedDims.height || extractedDims.name)) {
          setDimensions((prev) => ({
            width: extractedDims.width || prev.width,
            depth: extractedDims.depth || prev.depth,
            height: extractedDims.height || prev.height,
            name: extractedDims.name || sharedTitle || '당근마켓 공유 물품',
            category: '기타'
          }));
          setActiveTab('measure');
          return;
        }

        // 2. If no dimensions found, fallback to preset matching
        const matchingPreset = PRESET_ITEMS.find((p) =>
          combinedInput.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
        );
        if (matchingPreset) {
          setDimensions({
            width: matchingPreset.dimensions.width,
            depth: matchingPreset.dimensions.depth,
            height: matchingPreset.dimensions.height,
            name: matchingPreset.name,
            category: matchingPreset.category,
          });
        } else {
          setDimensions((prev) => ({
            ...prev,
            name: sharedTitle || '공유된 당근 물품',
          }));
        }
        setActiveTab('measure');
      };
      
      parseSharedData();
    }
  }, [location.state, location.search]);

  // Persist selected car handled in handleSelectCar
  // useEffect(() => {
  //   try {
  //     localStorage.setItem(STORAGE_KEY_CAR, selectedCar.id);
  //   } catch { /* ignore */ }
  // }, [selectedCar]);

  // Current Item dimensions (matching initial values from mockup: 120 x 60 x 75)
  const [dimensions, setDimensions] = useState<ItemDimensions>({
    width: 120,
    depth: 60,
    height: 75,
    name: '2인용 패브릭 소파',
    category: '가구',
  });

  // Toggles (matching mockup: 2열 시트 폴딩=true)
  const [isFolded, setIsFolded] = useState(true);

  // Modals
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isShareGuideModalOpen, setIsShareGuideModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isForceCarSelectModalOpen, setIsForceCarSelectModalOpen] = useState(false);

  // Measurement History (persisted to localStorage)
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved) as HistoryRecord[];
        // Re-calculate fit results (in case algorithm updated)
        return parsed.map((r) => ({
          ...r,
          result: calculateFit(r.item, r.car, r.isFolded, true, true),
        }));
      }
    } catch { /* ignore corrupted data */ }

    // Initial sample history
    return [
      {
        id: 'hist-1',
        timestamp: Date.now() - 3600000,
        item: { width: 147, depth: 39, height: 77, name: '이케아 칼락스 4x2', category: '가구' },
        car: CAR_DATABASE[0],
        isFolded: true,
        allowDiagonal: false,
        allowRotation: true,
        result: calculateFit({ width: 147, depth: 39, height: 77 }, CAR_DATABASE[0], true, false, true),
      },
      {
        id: 'hist-2',
        timestamp: Date.now() - 7200000,
        item: { width: 160, depth: 18, height: 97, name: 'LG 65인치 TV (박스)', category: '가전' },
        car: CAR_DATABASE[1],
        isFolded: true,
        allowDiagonal: true,
        allowRotation: true,
        result: calculateFit({ width: 160, depth: 18, height: 97 }, CAR_DATABASE[1], true, true, true),
      },
    ];
  });

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch { /* ignore quota exceeded */ }
  }, [history]);

  // Calculate real-time fit
  const fitResult = useMemo(() => {
    return calculateFit(dimensions, selectedCar, isFolded, true, true);
  }, [dimensions, selectedCar, isFolded]);


  const recordMeasurementHistory = (itemDims: ItemDimensions, car: CarTrunk) => {
    // Rate limit check: non-logged-in users get LIMIT_COUNT free scans
    if (!incrementUsage()) {
      setShowLoginModal(true);
      return;
    }

    const record: HistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      item: itemDims,
      car: car,
      isFolded,
      allowDiagonal: true,
      allowRotation: true,
      result: calculateFit(itemDims, car, isFolded, true, true),
    };
    setHistory((prev) => [record, ...prev.slice(0, 19)]);
    
    // Fire confetti on success
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF7E36', '#00D4AA', '#3B82F6']
      });
    });
  };

  const handleDimensionsExtracted = (dims: ItemDimensions, imageSrc?: string) => {
    const newDims = { ...dims, image: imageSrc || dims.image };
    setDimensions(newDims);
    
    if (!hasSelectedCar) {
      setIsForceCarSelectModalOpen(true);
    } else {
      recordMeasurementHistory(newDims, selectedCar);
    }
  };

  const handleOpenCertModal = () => {
    // Record to history if not exists
    const record: HistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      item: dimensions,
      car: selectedCar,
      isFolded,
      allowDiagonal: true,
      allowRotation: true,
      result: fitResult,
    };
    setHistory((prev) => [record, ...prev.slice(0, 19)]);
    setIsCertModalOpen(true);
  };

  return (
    <div className="bg-[#F8F9FC] text-[#191C1E] min-h-[100dvh] pb-28 font-['Be_Vietnam_Pro'] antialiased max-w-md mx-auto shadow-2xl relative flex flex-col">
      {/* Top App Bar */}
      <TopAppBar
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Share Target / General Toast Banner */}
      {shareToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-[#191C1E] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#FF7E36] flex items-center justify-center shrink-0 text-white font-bold shadow-md">
            <span className="material-symbols-outlined text-lg">check</span>
          </div>
          <p className="text-xs font-bold leading-snug flex-1 text-white/95">{shareToast}</p>
          <button
            onClick={() => setShareToast(null)}
            className="text-white/60 hover:text-white p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Content Body */}
      {isAiParsing && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF7E36] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-[#FF7E36] animate-pulse text-center">AI가 당근마켓 상품 크기를<br/>분석하고 있습니다...</p>
        </div>
      )}
      <main className="px-5 py-4 flex flex-col gap-6 flex-1">
        {activeTab === 'measure' && (
          <>
            {/* 1. TOP HERO: 3D Visualizer & Physics Simulation */}
            <div className="flex flex-col items-center text-center mt-1 -mb-1 animate-in fade-in slide-in-from-top-2 duration-500">
              <h2 className="font-extrabold text-[18px] text-[#191C1E] tracking-tight">
                🥕 당근에서 사진 '공유하기'
              </h2>
              <p className="font-extrabold text-[18px] text-[#FF7E36] tracking-tight mt-0.5">
                내 차에 들어 갈라나?
              </p>
            </div>
            <TrunkScene3D
              item={dimensions}
              car={selectedCar}
              isFolded={isFolded}
              allowDiagonal={true}
              fitResult={fitResult!}
              onSelectCar={handleSelectCar}
              onCopyCert={handleOpenCertModal}
            />

            {/* 2. Photo Upload & 1-Click Presets */}
            <section className="bg-white rounded-2xl ambient-shadow p-5 flex flex-col gap-4 border border-[#EDEEF1]">
              <OcrUploadZone
                onDimensionsExtracted={handleDimensionsExtracted}
                onRateLimitExceeded={() => setShowLoginModal(true)}
                onOpenShareGuide={() => setIsShareGuideModalOpen(true)}
              />
            </section>

            {/* 3. Vehicle Selector & Physics Controls & Manual Dimensions */}
            <section className="bg-white rounded-2xl ambient-shadow p-5 flex flex-col gap-4 border border-[#EDEEF1] animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Vehicle Selector */}
              <CarSelector selectedCar={selectedCar} onSelectCar={handleSelectCar} />

              {/* Physics Toggles (2열 폴딩 등) */}
              <PhysicsToggles
                isFolded={isFolded}
                onToggleFolded={() => setIsFolded(!isFolded)}
              />

              <hr className="border-[#EDEEF1] my-0.5" />

              {/* Manual Dimensions Input Fields */}
              <DimensionInputs dimensions={dimensions} onChange={(dims) => setDimensions(dims as ItemDimensions)} />
            </section>

            <section className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Side by side quick tools */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 용달 부르기 */}
                <button
                  onClick={() => setIsTransportModalOpen(true)}
                  className="bg-white rounded-xl p-4 border border-[#DFC0B3]/80 hover:border-[#FF7E36] flex flex-col items-center justify-center gap-1.5 transition-all group ambient-shadow cursor-pointer active:scale-95"
                >
                  <div className="bg-[#F2F3F6] p-2.5 rounded-full group-hover:bg-[#FFDBCC] transition-colors">
                    <span className="material-symbols-outlined text-[#191C1E] group-hover:text-[#FF7E36] text-[22px]">
                      local_shipping
                    </span>
                  </div>
                  <span className="font-bold text-[14px] text-[#191C1E]">용달 부르기</span>
                  <span className="text-[11px] text-[#595F67]">다마스 / 라보 견적</span>
                </button>

                {/* 대체품 찾기 → 쿠팡 파트너스 */}
                <a
                  href={`https://www.coupang.com/np/search?component=&q=${encodeURIComponent(dimensions?.name || dimensions?.category || '수납장')}${import.meta.env.VITE_COUPANG_AF_ID ? `&affiliateId=${import.meta.env.VITE_COUPANG_AF_ID}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl p-4 border border-[#DFC0B3]/80 hover:border-[#FF7E36] flex flex-col items-center justify-center gap-1.5 transition-all group ambient-shadow cursor-pointer active:scale-95"
                  onClick={(e) => {
                    // Prevent default if no dimensions to avoid empty search
                    if (!dimensions?.name && !dimensions?.category) {
                      e.preventDefault();
                      alert('먼저 가구 사진을 등록해주세요!');
                    }
                  }}
                >
                  <div className="bg-[#F2F3F6] p-2.5 rounded-full group-hover:bg-[#FFDBCC] transition-colors">
                    <span className="material-symbols-outlined text-[#191C1E] group-hover:text-[#FF7E36] text-[22px]">
                      shopping_bag
                    </span>
                  </div>
                  <span className="font-bold text-[14px] text-[#191C1E]">
                    쿠팡 신품 비교
                  </span>
                  <span className="text-[11px] text-[#595F67]">🚀 로켓배송 최저가</span>
                </a>
              </div>

              {/* 3. Tight / Over 판정 시 트렁크 고정용품 (쿠팡 파트너스) */}
              {(fitResult.status === 'tight' || fitResult.status === 'over') && (
                <a
                  href={`https://www.coupang.com/np/search?q=트렁크+고정줄+탄성바${import.meta.env.VITE_COUPANG_AF_ID ? `&affiliateId=${import.meta.env.VITE_COUPANG_AF_ID}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-[#2B303A] to-[#191C1E] rounded-xl p-4 flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer mt-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF7E36]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-[#FF7E36]">
                        build
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-[13px]">
                        트렁크가 덜 닫힐 것 같다면?
                      </p>
                      <p className="text-white/60 text-[11px] mt-0.5">
                        필수 고정용품: 탄력바(고무줄) / 보양 담요
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-white/50 group-hover:text-white text-[20px]">
                    arrow_forward
                  </span>
                </a>
              )}
            </section>
          </>
        )}

        {/* Tab 2: History */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectRecord={(record) => {
              setDimensions(record.item);
              handleSelectCar(record.car);
              setIsFolded(record.isFolded);
              setActiveTab('measure');
            }}
            onClearHistory={() => setHistory([])}
          />
        )}

        {/* Tab 3: Transport & Rankings */}
        {activeTab === 'transport' && <TransportView dimensions={dimensions} />}

        {/* Tab 4: Profile & My Garage */}
        {activeTab === 'profile' && (
          <ProfileView currentCar={selectedCar} onSelectCar={handleSelectCar} />
        )}
      </main>

      {/* Slide-in Side Drawer Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start"
          onClick={(e) => {
            // Close menu on backdrop click
            if (e.target === e.currentTarget) setIsMenuOpen(false);
          }}
        >
          <div className="bg-white w-4/5 max-w-xs h-full p-5 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDEEF1]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#FF7E36] text-white flex items-center justify-center text-sm font-black">
                  🥕
                </span>
                <span className="font-extrabold text-[18px] text-[#191C1E]">TrunkFit 메뉴</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F2F3F6] flex items-center justify-center text-[#5A5E67] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 로그인 상태 표시 */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3 p-3 bg-[#FFF5F0] rounded-xl border border-[#FFDBCC]">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url} alt={user.nickname} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#FF7E36] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px]">person</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-[#191C1E] truncate">{user.nickname}님</p>
                  <p className="text-[11px] text-[#FF7E36] font-semibold">무제한 분석 이용 중 ✨</p>
                </div>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="text-[11px] text-[#9EA3AC] underline cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowLoginModal(true); setIsMenuOpen(false); }}
                className="flex items-center gap-3 p-3 bg-[#F8F9FC] hover:bg-[#FFF5F0] rounded-xl border border-[#EDEEF1] hover:border-[#FFDBCC] transition-all cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-full bg-[#F2F3F6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#9EA3AC] text-[18px]">person</span>
                </div>
                <div>
                  <p className="font-bold text-[13px] text-[#191C1E]">카카오 로그인</p>
                  <p className="text-[11px] text-[#595F67]">무제한 AI 분석 이용하기</p>
                </div>
                <span className="material-symbols-outlined text-[#FF7E36] text-[18px] ml-auto">chevron_right</span>
              </button>
            )}

            <div className="flex flex-col gap-1 text-sm font-semibold">
              <button
                onClick={() => {
                  setActiveTab('measure');
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">straighten</span>
                트렁크 적재 시뮬레이터
              </button>
              <button
                onClick={() => {
                  navigate(`/car/${selectedCar.id}`);
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer text-[#191C1E]"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">directions_car</span>
                내 차({selectedCar.model.split(' ')[0]}) 상세 제원표
              </button>
              <button
                onClick={() => {
                  navigate('/item/kallax-4x2');
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer text-[#191C1E]"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">shelves</span>
                이케아 가구 적재 순위
              </button>
              <button
                onClick={() => {
                  navigate('/compare/hyundai-santafe-2023/kia-sorento');
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer text-[#191C1E]"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">compare_arrows</span>
                싼타페 vs 쏘렌토 1:1 비교
              </button>
              <button
                onClick={() => {
                  setActiveTab('transport');
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">leaderboard</span>
                전체 51종 트렁크 순위
              </button>
              <button
                onClick={() => {
                  setIsShareGuideModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#FFF5F0] text-left flex items-center gap-2 cursor-pointer text-[#E86016] font-bold"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">share</span>
                📱 당근 사진 1초 공유 가이드
              </button>
              <button
                onClick={() => {
                  setIsHelpModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F2F3F6] text-left flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#FF7E36]">help</span>
                적재 가이드 & 꿀팁
              </button>
            </div>

            <div className="mt-auto pt-4 border-t border-[#EDEEF1] text-xs text-[#595F67]">
              <p>TrunkFit • 당근마켓 직거래 필수앱</p>
              <p className="text-[10px] mt-1 text-[#9EA3AC]">© 2026 TrunkFit AI All rights reserved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ShareGuideModal
        isOpen={isShareGuideModalOpen}
        onClose={() => setIsShareGuideModalOpen(false)}
      />

      <CertificationCardModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        item={dimensions}
        car={selectedCar}
        isFolded={isFolded}
        fitResult={fitResult}
      />

      <TransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        item={dimensions}
      />

      <AlternativeGoodsModal
        isOpen={isAltModalOpen}
        onClose={() => setIsAltModalOpen(false)}
        item={dimensions}
      />

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      <ForceCarSelectModal
        isOpen={isForceCarSelectModalOpen}
        onSelectCar={(car) => {
          handleSelectCar(car);
          setIsForceCarSelectModalOpen(false);
          recordMeasurementHistory(dimensions, car);
        }}
      />

      {/* 글로벌 로그인 안내 모달 (비회원 사용량 초과 시) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center">
              <span className="text-3xl">🥕</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#191C1E]">무료 체험이 끝났어요!</h3>
              <p className="text-sm text-[#5A5E67] leading-relaxed mt-2">
                비로그인으로는 하루 <strong className="text-[#FF7E36]">{LIMIT_COUNT}번</strong>까지 AI 분석이 무료예요.<br />
                카카오 로그인 후 <strong className="text-[#FF7E36]">무제한</strong>으로 이용하세요!
              </p>
            </div>
            <button
              onClick={() => {
                setShowLoginModal(false);
                loginWithKakao();
              }}
              className="w-full py-3.5 bg-[#FEE500] hover:bg-[#FADA0A] text-[#000000] font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 3C6.477 3 2 6.425 2 10.648c0 2.709 1.776 5.093 4.412 6.42-.142.483-.45 1.545-.48 1.666-.037.155.05.155.114.113.082-.053 1.936-1.32 2.721-1.854.41.058.835.09 1.233.09 5.523 0 10-3.425 10-7.648C20 6.425 15.523 3 12 3z"/>
              </svg>
              카카오로 3초 만에 시작하기
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-xs text-[#8A8F98] underline py-1 cursor-pointer"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
