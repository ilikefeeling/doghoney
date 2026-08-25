import React, { useState, useEffect } from 'react';
import { CAR_DATABASE } from '../data/cars';
import { CarTrunk } from '../types';
import { getSavedUserProfile, loginWithKakao, logoutUser, saveUserProfile, UserProfile } from '../utils/kakaoAuth';
import { getDeviceOS } from '../utils/deviceDetector';
import { ShareGuideModal } from './ShareGuideModal';

interface ProfileViewProps {
  currentCar: CarTrunk;
  onSelectCar: (car: CarTrunk) => void;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentCar, onSelectCar, onOpenAdmin }) => {
  const [user, setUser] = useState<UserProfile>(getSavedUserProfile);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);
  const [searchCarQuery, setSearchCarQuery] = useState('');

  useEffect(() => {
    setUser(getSavedUserProfile());
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const loggedUser = await loginWithKakao();
      setUser(loggedUser);
    } catch (err) {
      console.error('Login failed:', err);
      alert('카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logoutUser();
      setUser(getSavedUserProfile());
    }
  };

  // Garage Car Management
  const garageCarIds = user.registeredCars && user.registeredCars.length > 0
    ? user.registeredCars
    : [currentCar.id];

  const garageCars = garageCarIds
    .map((id) => CAR_DATABASE.find((c) => c.id === id))
    .filter(Boolean) as CarTrunk[];

  const handleAddCarToGarage = (car: CarTrunk) => {
    const updatedIds = Array.from(new Set([...garageCarIds, car.id]));
    const updatedUser = { ...user, registeredCars: updatedIds };
    setUser(updatedUser);
    saveUserProfile(updatedUser);
    onSelectCar(car);
    setShowAddCarModal(false);
  };

  const handleRemoveCarFromGarage = (carId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (garageCarIds.length <= 1) {
      alert('최소 1대 이상의 차량이 차고에 등록되어 있어야 합니다.');
      return;
    }
    const updatedIds = garageCarIds.filter((id) => id !== carId);
    const updatedUser = { ...user, registeredCars: updatedIds };
    setUser(updatedUser);
    saveUserProfile(updatedUser);
    if (currentCar.id === carId) {
      const nextCar = CAR_DATABASE.find((c) => c.id === updatedIds[0]) || CAR_DATABASE[0];
      onSelectCar(nextCar);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-extrabold text-[#191C1E]">내 차고 & 계정</h2>
        <p className="text-xs text-[#5A5E67] mt-0.5">내 보유 차량 트렁크 등록 및 맞춤 설정</p>
      </div>

      {/* 1. Kakao Account Status Card */}
      <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
        {user.isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.nickname}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#FF7E36]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FFDBCC] text-[#FF7E36] flex items-center justify-center font-bold text-lg">
                  {user.nickname.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[16px] text-[#191C1E]">{user.nickname}</h3>
                  <span className="text-[10px] bg-[#FEE500] text-[#3C1E1E] px-1.5 py-0.5 rounded font-bold">
                    카카오 연동
                  </span>
                </div>
                <p className="text-xs text-[#595F67]">{user.email || '차고 동기화 완료'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-[#5A5E67] hover:text-[#BA1A1A] px-2.5 py-1.5 rounded-lg hover:bg-[#F2F3F6] transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5A5E67]">로그인하고 내 차고 저장</span>
              <span className="text-[10px] bg-[#F2F3F6] text-[#5A5E67] px-2 py-0.5 rounded-full">
                게스트 모드
              </span>
            </div>
            <p className="text-xs text-[#595F67]">
              카카오로 로그인하면 자주 타는 차량과 측정 기록이 안전하게 저장됩니다.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-[#FEE500] hover:bg-[#E5CF00] text-[#3C1E1E] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-sm">💬</span>
              <span>{isLoggingIn ? '로그인 처리 중...' : '카카오로 1초 시작하기'}</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. My Garage (내 차고 관리) */}
      <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#FF7E36] text-[20px]">garage</span>
            <h3 className="font-bold text-[16px] text-[#191C1E]">
              내 차고 ({garageCars.length}대)
            </h3>
          </div>
          <button
            onClick={() => setShowAddCarModal(true)}
            className="text-xs font-bold text-[#FF7E36] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add_circle</span>
            차량 추가
          </button>
        </div>

        {/* Garage list */}
        <div className="flex flex-col gap-2">
          {garageCars.map((car) => {
            const isSelected = car.id === currentCar.id;
            return (
              <div
                key={car.id}
                onClick={() => onSelectCar(car)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#FFDBCC]/30 border-[#FF7E36] shadow-xs'
                    : 'bg-[#F8F9FC] border-[#EDEEF1] hover:bg-[#F2F3F6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#FF7E36] text-white' : 'bg-[#E1E2E5] text-[#5A5E67]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">directions_car</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#191C1E]">{car.model}</h4>
                      {isSelected && (
                        <span className="text-[10px] bg-[#FF7E36] text-white px-1.5 py-0.2 rounded font-bold">
                          대표 차량
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#595F67]">
                      {car.width}×{car.depth}×{car.height}cm (폴딩 시 {car.depthFolded}cm)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isSelected && (
                    <button
                      onClick={(e) => handleRemoveCarFromGarage(car.id, e)}
                      className="w-7 h-7 rounded-full text-[#9EA3AC] hover:text-[#BA1A1A] hover:bg-[#FEE2E2] flex items-center justify-center text-xs"
                      title="차고에서 삭제"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                  {isSelected && (
                    <span className="material-symbols-outlined text-[#FF7E36] text-[20px] fill-1">
                      check_circle
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. B2B 제휴 연계: 자동차보험 / 신차 장기렌트 리드 배너 */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#38BDF8] tracking-wider uppercase">
            B2B 자동차 제휴 혜택
          </span>
          <h4 className="font-bold text-sm leading-tight">내 차 트렁크 만족도 평가 &<br />다이렉트 자동차보험 비교</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">최대 30,000원 주유권 즉시 증정</p>
        </div>
        <a
          href="https://direct.samsungfire.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#38BDF8] hover:bg-[#0284C7] text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl shrink-0 transition-colors"
        >
          비교하기 →
        </a>
      </section>

      {/* 4. 기기별 공유 및 PWA 설치 가이드 (OS 자동 감지) */}
      <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#FF7E36] text-[20px]">share</span>
            <h3 className="font-bold text-[16px] text-[#191C1E]">당근 1초 공유 & 앱 설치 가이드</h3>
          </div>
          <span className="text-[10px] bg-[#FF7E36]/10 text-[#E86016] px-2 py-0.5 rounded-full font-bold">
            {getDeviceOS() === 'android' ? '🤖 Android' : getDeviceOS() === 'ios' ? '🍏 iOS' : '💻 PC'} 자동 감지
          </span>
        </div>

        <p className="text-xs text-[#595F67] leading-relaxed">
          당근마켓에서 가구 사진을 볼 때 바로 '개꿀'로 공유하여 내 차 트렁크 적재 가능 여부를 3D로 즉시 확인할 수 있습니다.
        </p>

        <button
          onClick={() => setShowShareGuideModal(true)}
          className="w-full bg-gradient-to-r from-[#FF7E36] to-[#E86016] hover:from-[#E86016] hover:to-[#D2500A] text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
          내 기기 맞춤 공유 방법 & 테스트 가이드 보기
        </button>
      </section>

      {/* 5. Contact & Support */}
      <section className="bg-white rounded-2xl p-4.5 ambient-shadow border border-[#EDEEF1] flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="material-symbols-outlined text-[#FF7E36] text-[20px]">mail</span>
          <h3 className="font-bold text-[16px] text-[#191C1E]">고객 문의</h3>
        </div>
        <p className="text-xs text-[#595F67] leading-relaxed">
          서비스 이용 중 불편한 점이나 제휴 문의가 있으신가요? 관리자에게 직접 이메일을 보내주세요.
        </p>
        <a
          href="mailto:ilikepeople@icloud.com"
          className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          ilikepeople@icloud.com
        </a>
      </section>

      {/* 5. App Info & Tip (Secret 5-tap on version for admin) */}
      <div className="p-4 bg-[#F2F3F6] rounded-2xl text-xs text-[#5A5E67] flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-bold text-[#191C1E]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#FF7E36] fill-1">local_shipping</span>
            개꿀 (Doghoney) 3D 트렁크 적재 시뮬레이터
          </span>
          <span
            onClick={onOpenAdmin}
            className="cursor-pointer select-none text-slate-400 hover:text-slate-600"
          >
            v2.0.0
          </span>
        </div>
        <p>• 총 51종 국산 및 수입 전 차종 실측 데이터베이스 탑재</p>
        <p>• 비전 이미지 치수 인식 + Three.js 3D WebGL 실측 엔진</p>
        <p className="text-[10px] text-[#9EA3AC] mt-1">© 2026 개꿀 Doghoney. All rights reserved.</p>
      </div>

      {/* Add Car Modal */}
      {showAddCarModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddCarModal(false); }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#EDEEF1] flex items-center justify-between">
              <h3 className="font-bold text-[17px] text-[#191C1E]">내 차고에 차량 추가</h3>
              <button
                onClick={() => setShowAddCarModal(false)}
                className="w-8 h-8 rounded-full bg-[#F2F3F6] text-[#5A5E67] flex items-center justify-center hover:bg-[#E1E2E5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 border-b border-[#EDEEF1] bg-[#F8F9FC]">
              <input
                type="text"
                placeholder="차종명 검색 (예: 싼타페, 쏘렌토, 모델Y, 그랜저...)"
                value={searchCarQuery}
                onChange={(e) => setSearchCarQuery(e.target.value)}
                className="w-full bg-white border border-[#E1E2E5] rounded-xl px-3 py-2 text-xs text-[#191C1E] focus:border-[#FF7E36] outline-none"
              />
            </div>

            <div className="overflow-y-auto p-3 flex flex-col gap-2 flex-1">
              {CAR_DATABASE.filter((c) =>
                c.model.toLowerCase().includes(searchCarQuery.toLowerCase()) ||
                c.brand.toLowerCase().includes(searchCarQuery.toLowerCase())
              ).map((car) => (
                <div
                  key={car.id}
                  onClick={() => handleAddCarToGarage(car)}
                  className="p-3 rounded-xl border border-[#EDEEF1] hover:border-[#FF7E36] hover:bg-[#FFDBCC]/20 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-[#191C1E]">{car.model}</h4>
                    <p className="text-[11px] text-[#595F67]">
                      {car.category} • {car.width}×{car.depth}×{car.height}cm
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#FF7E36]">차고 추가 +</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Guide Modal */}
      <ShareGuideModal
        isOpen={showShareGuideModal}
        onClose={() => setShowShareGuideModal(false)}
      />
    </div>
  );
};
