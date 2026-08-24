import React, { useState, useRef, useEffect } from 'react';
import { ItemDimensions } from '../types';
import { extractDimensionsFromImage, toItemDimensions } from '../utils/geminiVision';
import { useAuth } from '../hooks/useAuth';
import { useRateLimit } from '../hooks/useRateLimit';

interface OcrUploadZoneProps {
  onDimensionsExtracted: (dims: ItemDimensions, imageSrc?: string) => void;
  onRateLimitExceeded?: () => void;
}

export const OcrUploadZone: React.FC<OcrUploadZoneProps> = ({
  onDimensionsExtracted,
  onRateLimitExceeded,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => (window as typeof window & { pwaDeferredPrompt?: any }).pwaDeferredPrompt || null);
  const [isPromptChecked, setIsPromptChecked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { isLoggedIn } = useAuth();
  const { incrementUsage } = useRateLimit(isLoggedIn);

  useEffect(() => {
    if ((window as any).pwaDeferredPrompt) {
      setIsPromptChecked(true);
    }
    
    const timer = setTimeout(() => {
      setIsPromptChecked(true);
    }, 300);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPromptChecked(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handlePwaInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).pwaDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).pwaDeferredPrompt = null;
      }
    } else {
      alert('앱 설치를 지원하지 않는 환경이거나 이미 설치되어 있습니다.');
    }
  };

  // Global Clipboard Paste Listener (Ctrl+V / Long-press paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              
              if (!incrementUsage()) {
              onRateLimitExceeded?.();
              return;
            }

              setPasteNotice(true);
              setTimeout(() => setPasteNotice(false), 3000);

            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              setPreviewImage(result);
              processAiImage(file, result);
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handlePasteButtonClick = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert("현재 기기/브라우저에서는 버튼을 통한 클립보드 붙여넣기를 지원하지 않습니다.\n입력창을 꾹 눌러 '붙여넣기'를 직접 사용해주세요.");
        return;
      }
      
      const clipboardItems = await navigator.clipboard.read();
      let hasImage = false;
      
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          hasImage = true;
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted_image.png", { type: imageType });
          
          if (!incrementUsage()) {
          onRateLimitExceeded?.();
          return;
        }

          setPasteNotice(true);
          setTimeout(() => setPasteNotice(false), 3000);

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            setPreviewImage(result);
            processAiImage(file, result);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
      if (!hasImage) {
        alert("클립보드에 이미지가 없습니다. 당근마켓 등에서 이미지를 '복사'한 뒤 시도해주세요.");
      }
    } catch (err) {
      console.error(err);
      alert("클립보드 접근 권한이 없거나 실패했습니다. 직접 파일 업로드 기능을 사용해주세요.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!incrementUsage()) {
      onRateLimitExceeded?.();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setScanError('⚠️ 파일 크기가 5MB를 초과합니다.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setScanError('⚠️ 이미지 파일만 업로드 가능합니다.');
      return;
    }

    setScanError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      processAiImage(file, result);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const processAiImage = async (file: File, imgSrc: string) => {
    setIsScanning(true);
    setScanError(null);
    setAiConfidence(null);
    setScanMessage('📸 사진 분석 시작...');

    try {
      await new Promise((r) => setTimeout(r, 250));
      setScanMessage('🔍 물품 종류 및 외곽선 분석 중...');

      await new Promise((r) => setTimeout(r, 200));
      setScanMessage('📐 AI가 3D 치수를 계산하고 있습니다...');

      const extracted = await extractDimensionsFromImage(file);

      setScanMessage('✅ AI 치수 추출 완료!');
      setAiConfidence(extracted.confidence);

      const dims = toItemDimensions(extracted, imgSrc);
      onDimensionsExtracted(dims, imgSrc);

      setTimeout(() => {
        setIsScanning(false);
        setScanMessage('');
      }, 500);
    } catch (error) {
      console.error('[TrunkFit] AI scan error:', error);
      setIsScanning(false);
      setScanMessage('');
      setScanError('AI 분석에 실패했습니다. 치수를 직접 입력해주세요.');
    }
  };


  const confidenceBadge =
    aiConfidence === 'high'
      ? { text: 'AI 신뢰도: 높음', color: 'bg-[#DCFCE7] text-[#15803D]' }
      : aiConfidence === 'medium'
      ? { text: 'AI 신뢰도: 보통', color: 'bg-[#FEF3C7] text-[#B45309]' }
      : aiConfidence === 'low'
      ? { text: 'AI 신뢰도: 수동 확인 권장', color: 'bg-[#FEE2E2] text-[#B91C1C]' }
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden File Input - Gallery/Files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Hidden File Input - Direct Camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload/Capture UI */}
      <div className="relative">
        {previewImage ? (
          <div
            id="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            className="relative overflow-hidden border-2 border-dashed border-[#DFC0B3] hover:border-[#FF7E36] bg-[#F2F3F6] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E1E2E5]/70 transition-all group select-none active:scale-[0.99] shadow-xs"
          >
            <div className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center bg-black/5">
              <img
                src={previewImage}
                alt="Uploaded Item"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  다른 사진으로 변경하려면 터치하세요
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: PWA Install OR File Upload */}
            {deferredPrompt ? (
              <div
                onClick={handlePwaInstall}
                className="border-2 border-dashed border-[#DFC0B3] hover:border-[#FF7E36] bg-[#F2F3F6] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#E1E2E5]/70 active:scale-95 shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF7E36] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">install_mobile</span>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-[14px] text-[#191C1E]">당근 사진 공유하기</p>
                  <p className="text-[11px] text-[#595F67] mt-0.5">앱 설치하여 1초 만에 공유</p>
                </div>
              </div>
            ) : isPromptChecked ? (
              <div
                onClick={() => {
                  window.location.href = 'daangn://';
                }}
                className="relative overflow-hidden border-2 border-dashed border-[#FF7E36] hover:border-[#E86016] bg-[#FFF5F0] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#FFE8DE] active:scale-95 shadow-xs group"
              >
                {/* Radar animation rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-12 h-12 rounded-full border border-[#FF7E36] opacity-40 animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute w-12 h-12 rounded-full border border-[#FF7E36] opacity-40 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10 w-12 h-12 rounded-full bg-[#FF7E36] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">wifi_tethering</span>
                </div>
                <div className="text-center relative z-10">
                  <p className="font-extrabold text-[14px] text-[#E86016]">당근마켓 열기</p>
                  <p className="font-extrabold text-[14px] text-[#E86016] mt-0.5">사진 공유</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-transparent bg-[#F2F3F6] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] animate-pulse">
                <div className="w-12 h-12 rounded-full bg-[#E1E2E5] shadow-sm"></div>
                <div className="text-center w-full flex flex-col items-center gap-1.5 mt-1">
                  <div className="h-4 bg-[#E1E2E5] rounded w-20"></div>
                  <div className="h-3 bg-[#E1E2E5] rounded w-28"></div>
                </div>
              </div>
            )}

            {/* Option 2: Camera Capture */}
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="border-2 border-dashed border-[#DFC0B3] hover:border-[#10B981] bg-[#F2F3F6] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#E1E2E5]/70 active:scale-95 shadow-xs group"
            >
              <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[26px]">photo_camera</span>
              </div>
              <div className="text-center">
                <p className="font-extrabold text-[14px] text-[#191C1E]">직접 촬영하기</p>
                <p className="text-[11px] text-[#595F67] mt-0.5">내 물건 바로 찍기</p>
              </div>
            </div>


          </div>
        )}

        {/* Scanning animation overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-[#FF7E36]/15 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center pointer-events-none transition-all">
            <div className="absolute w-full h-1 bg-[#FF7E36] scan-line shadow-[0_0_12px_rgba(255,126,54,0.9)]" />
            <div className="bg-white/95 px-4 py-2 rounded-full shadow-lg border border-[#FF7E36]/40 flex items-center gap-2 z-30">
              <span className="material-symbols-outlined text-[#FF7E36] text-[18px] animate-spin">
                sync
              </span>
              <span className="text-xs font-bold text-[#642600]">{scanMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Paste Notice Toast */}
      {pasteNotice && (
        <div className="px-3 py-2 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-xs text-[#15803D] font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[16px]">content_paste</span>
          클립보드 사진 감지! 즉시 3D 분석을 시작합니다.
        </div>
      )}

      {/* Error Message */}
      {scanError && (
        <div className="px-3 py-2 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#B91C1C] font-medium flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {scanError}
        </div>
      )}

      {/* AI Confidence Badge */}
      {confidenceBadge && !isScanning && (
        <div
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${confidenceBadge.color}`}
        >
          <span className="material-symbols-outlined text-[14px]">smart_toy</span>
          {confidenceBadge.text}
        </div>
      )}
    </div>
  );
};
