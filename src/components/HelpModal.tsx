import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeviceOS, isStandalonePWA, DeviceOS } from '../utils/deviceDetector';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'fit' | 'share';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, defaultTab = 'fit' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fit' | 'share'>(defaultTab);
  const [detectedOS, setDetectedOS] = useState<DeviceOS>('android');
  const [selectedOS, setSelectedOS] = useState<DeviceOS>('android');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      const os = getDeviceOS();
      setDetectedOS(os);
      setSelectedOS(os);
      setIsInstalled(isStandalonePWA());
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleTestShare = () => {
    onClose();
    navigate('/share-target?title=이케아+칼락스+4x2&text=가로147+세로39+높이77+상태최상&url=https://daangn.com/sample');
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[88vh]">
        {/* Header */}
        <div className="bg-[#FF7E36] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">help</span>
            <h3 className="font-extrabold text-[17px]">트렁크 가이드 & 기기별 공유 방법</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F2F3F6] p-1 border-b border-[#EDEEF1]">
          <button
            onClick={() => setActiveTab('fit')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'fit' ? 'bg-white text-[#FF7E36] shadow-xs' : 'text-[#595F67]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">straighten</span>
            적재 기준 & 팁
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'share' ? 'bg-white text-[#FF7E36] shadow-xs' : 'text-[#595F67]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            기기별 공유 연동 ({detectedOS === 'ios' ? 'iOS' : detectedOS === 'android' ? 'Android' : 'PC'})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 bg-[#F8F9FC] text-xs leading-relaxed text-[#191C1E] flex-1">
          {activeTab === 'fit' ? (
            <>
              <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5 shadow-xs">
                <h4 className="font-bold text-sm text-[#FF7E36] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">straighten</span>
                  1. 치수 측정 기준 (가로/세로/높이)
                </h4>
                <p className="text-[#595F67]">
                  • <strong>가로 (W)</strong>: 가구의 가장 긴 가로 길이 (손잡이나 다리 돌출부 포함).
                </p>
                <p className="text-[#595F67]">
                  • <strong>세로 (D)</strong>: 가구의 앞뒤 폭/깊이.
                </p>
                <p className="text-[#595F67]">
                  • <strong>높이 (H)</strong>: 바닥부터 상단까지의 높이. (식탁 다리 분해 시 대폭 감소!)
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5 shadow-xs">
                <h4 className="font-bold text-sm text-[#FF7E36] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">airline_seat_recline_extra</span>
                  2. 2열 시트 폴딩과 대각선 진입
                </h4>
                <p className="text-[#595F67]">
                  • 2열 시트를 접으면 깊이가 180~210cm까지 확장되어 거의 모든 2인용 소파/식탁이 들어갑니다.
                </p>
                <p className="text-[#595F67]">
                  • 가로폭이 살짝 초과하는 경우, 대각선으로 먼저 머리를 넣고 눕혀서 회전시키면 안전하게 적재됩니다.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#EDEEF1] flex flex-col gap-1.5 shadow-xs">
                <h4 className="font-bold text-sm text-[#BA1A1A] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  3. 차량 손상 및 안전 유의사항
                </h4>
                <p className="text-[#595F67]">
                  • 테일게이트 닫을 때 뒷유리에 가구 모서리가 닿지 않도록 반드시 <strong>담요나 뽁뽁이</strong>를 덧대세요.
                </p>
                <p className="text-[#595F67]">
                  • TV/모니터 패널은 눕혀서 운반 시 진동으로 패널이 깨질 수 있으니 세우거나 완충재를 두텁게 까세요.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Detected Device Badge */}
              <div className="bg-[#FFF5F0] border border-[#FFDBCC] p-2.5 rounded-xl flex items-center justify-between text-[#A04100]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[18px]">devices</span>
                  현재 접속 기기: {detectedOS === 'ios' ? '🍏 iOS (아이폰/아이패드)' : detectedOS === 'android' ? '🤖 Android' : '💻 PC'}
                </div>
                <div className="text-[10px] bg-[#FF7E36] text-white px-2 py-0.5 rounded-full font-bold">
                  자동 감지됨
                </div>
              </div>

              {/* OS Tabs for manual override if user wants */}
              <div className="flex gap-1">
                {(['android', 'ios', 'desktop'] as DeviceOS[]).map((os) => (
                  <button
                    key={os}
                    onClick={() => setSelectedOS(os)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border ${
                      selectedOS === os
                        ? 'bg-[#FF7E36] text-white border-[#FF7E36]'
                        : 'bg-white text-[#595F67] border-[#E1E2E5]'
                    }`}
                  >
                    {os === 'android' ? 'Android' : os === 'ios' ? 'iOS' : 'PC'}
                  </button>
                ))}
              </div>

              {selectedOS === 'android' && (
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">1. 앱 설치 (Web Share Target 자동 등록)</p>
                    <p className="text-[#595F67] text-[11px]">
                      크롬 주소창의 <strong>[앱 설치]</strong> 또는 메뉴의 <strong>[홈 화면에 추가]</strong>를 진행합니다.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">2. 당근마켓/갤러리에서 '공유하기'</p>
                    <p className="text-[#595F67] text-[11px]">
                      사진이나 글을 공유할 때 대상 목록에서 <strong>'개꿀'</strong>을 터치합니다.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">3. 즉시 3D 적재 시뮬레이션 확인</p>
                    <p className="text-[#595F67] text-[11px]">
                      AI가 사진 속 물품을 분석하여 3D 공간에 바로 적재해 줍니다.
                    </p>
                  </div>
                </div>
              )}

              {selectedOS === 'ios' && (
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">1. Safari 공유 버튼(􀈂) 터치</p>
                    <p className="text-[#595F67] text-[11px]">
                      사파리 브라우저 하단 중앙의 <strong>공유(네모+화살표)</strong> 아이콘을 누릅니다.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">2. '홈 화면에 추가' 선택</p>
                    <p className="text-[#595F67] text-[11px]">
                      메뉴에서 <strong>[홈 화면에 추가]</strong>를 눌러 단독 앱으로 설치합니다.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                    <p className="font-bold text-[#191C1E] mb-1">3. 사진 복사 후 '1초 붙여넣기'</p>
                    <p className="text-[#595F67] text-[11px]">
                      당근마켓에서 사진 복사 후 앱의 <strong>[붙여넣기]</strong>를 누르면 1초 만에 3D 판정됩니다.
                    </p>
                  </div>
                </div>
              )}

              {selectedOS === 'desktop' && (
                <div className="bg-white p-3 rounded-xl border border-[#EDEEF1]">
                  <p className="font-bold text-[#191C1E] mb-1">PC 데스크톱</p>
                  <p className="text-[#595F67] text-[11px]">
                    Ctrl + V 단축키로 복사한 가구 이미지를 붙여넣거나 파일 업로드로 분석할 수 있습니다.
                  </p>
                </div>
              )}

              <button
                onClick={handleTestShare}
                className="w-full py-2 bg-[#FF7E36] hover:bg-[#E86016] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                가상 공유 데이터 수신 테스트 해보기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#EDEEF1]">
          <button
            onClick={onClose}
            className="w-full bg-[#FF7E36] text-white font-bold py-2.5 rounded-xl text-xs"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
