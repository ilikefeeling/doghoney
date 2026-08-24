import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeviceOS, isStandalonePWA, DeviceOS } from '../utils/deviceDetector';

interface ShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareGuideModal: React.FC<ShareGuideModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedOS, setSelectedOS] = useState<DeviceOS>('android');
  const [detectedOS, setDetectedOS] = useState<DeviceOS>('android');
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const os = getDeviceOS();
    setDetectedOS(os);
    setSelectedOS(os);
    setIsInstalled(isStandalonePWA());

    if ((window as any).pwaDeferredPrompt) {
      setDeferredPrompt((window as any).pwaDeferredPrompt);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).pwaDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).pwaDeferredPrompt = null;
      }
    } else {
      alert('브라우저 메뉴에서 [홈 화면에 추가] 또는 [앱 설치]를 눌러주세요.');
    }
  };

  const handleTestShare = () => {
    onClose();
    // Test virtual share target with mock Daangn data
    navigate('/share-target?title=이케아+칼락스+4x2&text=가로147+세로39+높이77+상태최상&url=https://daangn.com/articles/sample');
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF7E36] to-[#E86016] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">share</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] leading-tight">당근 사진 1초 공유 가이드</h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                {detectedOS === 'android' && '🤖 안드로이드 기기 자동 감지 완료'}
                {detectedOS === 'ios' && '🍏 iOS 아이폰/아이패드 자동 감지 완료'}
                {detectedOS === 'desktop' && '💻 PC/데스크톱 환경 자동 감지 완료'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* OS Switcher Tabs (Auto-selected to current OS, switchable) */}
        <div className="flex bg-[#F2F3F6] p-1.5 border-b border-[#EDEEF1]">
          <button
            onClick={() => setSelectedOS('android')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              selectedOS === 'android'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#595F67] hover:text-[#191C1E]'
            }`}
          >
            <span>🤖 Android</span>
            {detectedOS === 'android' && (
              <span className="text-[9px] bg-[#FF7E36] text-white px-1.5 py-0.2 rounded-full font-bold">
                내 기기
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedOS('ios')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              selectedOS === 'ios'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#595F67] hover:text-[#191C1E]'
            }`}
          >
            <span>🍏 iOS (iPhone)</span>
            {detectedOS === 'ios' && (
              <span className="text-[9px] bg-[#FF7E36] text-white px-1.5 py-0.2 rounded-full font-bold">
                내 기기
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedOS('desktop')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              selectedOS === 'desktop'
                ? 'bg-white text-[#FF7E36] shadow-xs'
                : 'text-[#595F67] hover:text-[#191C1E]'
            }`}
          >
            <span>💻 PC</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4.5 overflow-y-auto flex flex-col gap-3.5 bg-[#F8F9FC] text-xs leading-relaxed text-[#191C1E] flex-1">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
              isInstalled
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                : 'bg-[#FFF5F0] border-[#FFDBCC] text-[#A04100]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isInstalled ? 'check_circle' : 'install_mobile'}
            </span>
            <div className="text-[11px] font-bold">
              {isInstalled ? (
                <span>개꿀 PWA 앱이 이미 설치되어 있습니다! OS 공유 시트에서 바로 사용 가능합니다.</span>
              ) : (
                <span>1초 만에 앱을 설치하시면 OS 공유 목록에 '개꿀'이 자동 등록됩니다.</span>
              )}
            </div>
          </div>

          {/* 1. Android Guide */}
          {selectedOS === 'android' && (
            <div className="flex flex-col gap-3">
              {/* Step 1 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">앱 설치 (WebAPK 등록)</h4>
                  <p className="text-[#595F67] text-[11px]">
                    아래 버튼을 눌러 홈 화면에 앱을 추가하면 OS 공유 대상 목록에 '개꿀'이 자동 등록됩니다.
                  </p>
                  {!isInstalled && (
                    <button
                      onClick={handleInstallClick}
                      className="mt-2 w-full py-2 bg-[#FF7E36] hover:bg-[#E86016] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">install_mobile</span>
                      안드로이드 앱 즉시 설치하기
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">
                    당근마켓 / 갤러리에서 '공유' 터치
                  </h4>
                  <p className="text-[#595F67] text-[11px]">
                    사고 싶은 가구/가전 사진이나 게시글 화면에서 우측 상단 <strong>[공유하기 (􀈂)]</strong> 버튼을 터치합니다.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">
                    목록에서 '개꿀' 선택 → 1초 3D 판정
                  </h4>
                  <p className="text-[#595F67] text-[11px]">
                    공유 앱 목록에서 <strong>'개꿀'</strong>을 터치하면 AI가 사진 치수를 추출하여 내 차 트렁크에 즉시 넣어줍니다!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. iOS Guide */}
          {selectedOS === 'ios' && (
            <div className="flex flex-col gap-3">
              {/* Step 1 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">
                    Safari 하단 '공유' 버튼 터치
                  </h4>
                  <p className="text-[#595F67] text-[11px]">
                    Safari 브라우저 하단 중앙의 <strong>공유 아이콘 (네모+위쪽 화살표 􀈂)</strong>을 터치합니다.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">
                    '홈 화면에 추가' 선택
                  </h4>
                  <p className="text-[#595F67] text-[11px]">
                    공유 메뉴 목록을 아래로 스크롤하여 <strong>[홈 화면에 추가]</strong>를 누른 후 우측 상단 '추가'를 터치합니다.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">
                    당근 사진 복사 후 '1초 붙여넣기'
                  </h4>
                  <p className="text-[#595F67] text-[11px]">
                    당근마켓에서 가구 사진을 꾹 눌러 '복사'한 뒤, 개꿀 앱에서 <strong>[클립보드 붙여넣기]</strong>를 누르면 AI가 3D 치수를 바로 분석합니다!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Desktop Guide */}
          {selectedOS === 'desktop' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#EDEEF1] flex items-start gap-3 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#FF7E36] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  💻
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[13px] text-[#191C1E] mb-1">데스크톱 사용 방법</h4>
                  <p className="text-[#595F67] text-[11px]">
                    PC 환경에서는 당근마켓 웹페이지의 사진을 캡처/복사한 후 <strong>Ctrl + V</strong>로 붙여넣거나 파일 드래그앤드롭으로 바로 3D 판정할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Action Box */}
          <div className="bg-gradient-to-br from-[#FFF5F0] to-[#FFDBCC]/40 p-3.5 rounded-2xl border border-[#FF7E36]/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#E86016] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                공유 수신 기능 즉시 테스트
              </span>
              <span className="text-[10px] bg-[#FF7E36] text-white px-2 py-0.5 rounded-full font-bold">
                1초 체험
              </span>
            </div>
            <p className="text-[11px] text-[#595F67]">
              실제 당근마켓에서 '이케아 칼락스' 데이터를 개꿀 앱으로 공유한 상황을 가상으로 시뮬레이션합니다.
            </p>
            <button
              onClick={handleTestShare}
              className="w-full py-2.5 bg-[#FF7E36] hover:bg-[#E86016] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              가상 공유 데이터 수신 테스트 실행
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-[#EDEEF1] flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-full bg-[#191C1E] hover:bg-[#32363A] text-white font-extrabold py-3 rounded-2xl text-xs transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
