import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CarTrunk, FitCalculation, ItemDimensions } from '../types';
import { shareKakaoTalk, shareNativeOrClipboard, generateShareText } from '../utils/kakaoShare';
import { recordCanvasStream, triggerFileDownload, isRecordingSupported } from '../utils/videoRecorder';

interface CertificationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  fitResult: FitCalculation;
}

export const CertificationCardModal: React.FC<CertificationCardModalProps> = ({
  isOpen,
  onClose,
  item,
  car,
  isFolded,
  fitResult,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'video'>('card');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordProgress, setRecordProgress] = useState(0);
  const [kakaoShared, setKakaoShared] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && fitResult && (fitResult.status === 'fits' || fitResult.status === 'tight')) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF7E36', '#FFB693', '#10B981', '#FFDBCC'],
      });
    }
  }, [isOpen, fitResult?.status]);

  if (!isOpen || !fitResult || !item) return null;

  const { status, statusLabel, margins, bestOrientation } = fitResult;
  const chatSummaryText = generateShareText({ item, car, isFolded, fitResult });

  // 1. Text copy
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(chatSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // 2. KakaoTalk Share
  const handleKakaoShare = () => {
    const success = shareKakaoTalk({ item, car, isFolded, fitResult });
    if (success) {
      setKakaoShared(true);
      setTimeout(() => setKakaoShared(false), 3000);
    } else {
      // Fallback to Native share / clipboard
      handleNativeShare();
    }
  };

  // 3. Web Share API or Clipboard
  const handleNativeShare = async () => {
    const res = await shareNativeOrClipboard({ item, car, isFolded, fitResult });
    if (res.success && res.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 4. 2D PNG Certificate Card Download
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(0, 0, 600, 760, 24);
    ctx.fill();

    // Top Header Banner
    ctx.fillStyle = '#FF7E36';
    ctx.fillRect(0, 0, 600, 140);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('🥕 TrunkFit 당근 적재 인증서', 30, 60);

    ctx.font = '16px sans-serif';
    ctx.fillText('중고거래 가구·가전 차량 트렁크 적재 시뮬레이션 완료', 30, 95);

    // Card details
    ctx.fillStyle = '#F8F9FC';
    ctx.roundRect(30, 160, 540, 480, 16);
    ctx.fill();
    ctx.strokeStyle = '#EDEEF1';
    ctx.stroke();

    // Status Badge
    ctx.fillStyle = status === 'fits' ? '#10B981' : status === 'tight' ? '#F59E0B' : '#BA1A1A';
    ctx.roundRect(50, 190, 200, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(statusLabel, 70, 220);

    // Item Info
    ctx.fillStyle = '#191C1E';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(item.name || '선택 물품', 50, 280);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#5A5E67';
    ctx.fillText(`규격: ${item.width} × ${item.depth} × ${item.height} cm`, 50, 315);
    ctx.fillText(`차량: ${car.model} (${isFolded ? '2열 폴딩' : '기본'})`, 50, 345);
    ctx.fillText(`배치: ${bestOrientation.description}`, 50, 375);

    // Margin Box
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(50, 410, 500, 100, 12);
    ctx.fill();
    ctx.strokeStyle = '#DFC0B3';
    ctx.stroke();

    ctx.fillStyle = '#191C1E';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('트렁크 실측 여유 공간', 70, 445);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = margins.height >= 0 ? '#10B981' : '#BA1A1A';
    ctx.fillText(`상단: ${margins.height >= 0 ? '+' : ''}${margins.height}cm`, 70, 485);
    ctx.fillStyle = margins.width >= 0 ? '#10B981' : '#BA1A1A';
    ctx.fillText(`측면: ${margins.width >= 0 ? '+' : ''}${margins.width}cm`, 220, 485);
    ctx.fillStyle = margins.depth >= 0 ? '#10B981' : '#BA1A1A';
    ctx.fillText(`깊이: ${margins.depth >= 0 ? '+' : ''}${margins.depth}cm`, 370, 485);

    // Footer
    ctx.fillStyle = '#5A5E67';
    ctx.font = '13px sans-serif';
    ctx.fillText('TrunkFit AI Smart Measure • 당근마켓 직거래 전용 인증', 140, 700);

    const filename = `당근적재인증_${item.name || '가구'}_${car.model}.png`;
    triggerFileDownload(canvas.toDataURL('image/png'), filename);

    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 2500);
  };

  // 5. 3D WebGL Video Clip Recording
  const handleRecordVideo = async () => {
    const canvas = document.getElementById('trunkfit-3d-canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('3D 시뮬레이션 화면을 찾을 수 없습니다.');
      return;
    }

    setIsRecording(true);
    setRecordProgress(0);

    const interval = setInterval(() => {
      setRecordProgress((p) => Math.min(95, p + 10));
    }, 300);

    try {
      const { url } = await recordCanvasStream(canvas, { durationMs: 3000, frameRate: 30 });
      clearInterval(interval);
      setRecordProgress(100);
      setRecordedVideoUrl(url);
      setIsRecording(false);
    } catch (e: any) {
      clearInterval(interval);
      setIsRecording(false);
      alert(e?.message || '영상 녹화 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadVideo = () => {
    if (!recordedVideoUrl) return;
    const filename = `당근3D적재시연_${item.name || '가구'}_${car.model}.webm`;
    triggerFileDownload(recordedVideoUrl, filename);
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#FF7E36] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] fill-1">verified</span>
            <div>
              <h3 className="font-bold text-[18px] leading-tight">당근 3D 적재 인증 짤</h3>
              <p className="text-xs text-white/85">판매자/구매자 채팅 및 SNS에 1초 공유</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#EDEEF1] p-1 mx-4 mt-3 rounded-xl">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'card' ? 'bg-white text-[#FF7E36] shadow-xs' : 'text-[#5A5E67]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            인증 카드 이미지
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'video' ? 'bg-white text-[#FF7E36] shadow-xs' : 'text-[#5A5E67]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            3D 적재 시연 영상 짤
          </button>
        </div>

        {/* Body Container */}
        <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[55vh] bg-[#F8F9FC]">
          {activeTab === 'card' ? (
            /* Tab 1: Certificate Card Preview */
            <div
              ref={cardRef}
              className="bg-white rounded-2xl p-4.5 border-2 border-[#FF7E36]/30 shadow-md flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Watermark stamp */}
              <div className="absolute -right-4 -bottom-4 text-[110px] text-[#FF7E36]/5 select-none pointer-events-none font-bold">
                FIT
              </div>

              {/* Card Brand Row */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EDEEF1]">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-[#FF7E36] text-white flex items-center justify-center text-xs font-black">
                    🥕
                  </span>
                  <span className="font-extrabold text-[15px] text-[#191C1E]">TrunkFit 인증서</span>
                </div>
                <div className="flex items-center gap-1">
                  {fitResult.spatialRL && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      AI 강화학습 {fitResult.spatialRL.confidence}%
                    </span>
                  )}
                  <span className="text-[10px] bg-[#FFDBCC] text-[#7A3000] font-bold px-2 py-0.5 rounded-full">
                    당근 검증
                  </span>
                </div>
              </div>

              {/* Status Big Banner */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between ${
                  status === 'fits'
                    ? 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                    : status === 'tight'
                    ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]'
                    : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[26px]">
                    {status === 'fits' ? 'check_circle' : status === 'tight' ? 'warning' : 'cancel'}
                  </span>
                  <div>
                    <div className="font-extrabold text-[16px]">{statusLabel}</div>
                    <div className="text-[11px] opacity-90">{bestOrientation.description}</div>
                  </div>
                </div>
                <span className="text-[12px] font-bold underline">검증 완료</span>
              </div>

              {/* Item & Vehicle Info Grid */}
              <div className="bg-[#F8F9FC] p-3 rounded-xl flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#595F67]">거래 물품</span>
                  <strong className="text-[#191C1E]">
                    {item.name || '가구/가전'} ({item.width} × {item.depth} × {item.height} cm)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#595F67]">픽업 차량</span>
                  <strong className="text-[#191C1E]">
                    {car.model} ({isFolded ? '2열 폴딩' : '기본 트렁크'})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#595F67]">트렁크 용량</span>
                  <strong className="text-[#191C1E]">
                    {isFolded ? car.volumeLitersFolded : car.volumeLiters} L
                  </strong>
                </div>
              </div>

              {/* Clearances */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-[#F2F3F6]">
                  <span className="text-[10px] text-[#595F67] block">상단 여유</span>
                  <strong
                    className={`text-[13px] ${
                      margins.height >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'
                    }`}
                  >
                    {margins.height >= 0 ? `+${margins.height}` : margins.height}cm
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-[#F2F3F6]">
                  <span className="text-[10px] text-[#595F67] block">측면 여유</span>
                  <strong
                    className={`text-[13px] ${
                      margins.width >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'
                    }`}
                  >
                    {margins.width >= 0 ? `+${margins.width}` : margins.width}cm
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-[#F2F3F6]">
                  <span className="text-[10px] text-[#595F67] block">깊이 여유</span>
                  <strong
                    className={`text-[13px] ${
                      margins.depth >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'
                    }`}
                  >
                    {margins.depth >= 0 ? `+${margins.depth}` : margins.depth}cm
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: 3D Video Clip Recording */
            <div className="bg-white rounded-2xl p-4 border border-[#EDEEF1] flex flex-col gap-3">
              <div className="text-center flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#FFDBCC] text-[#FF7E36] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">movie</span>
                </div>
                <h4 className="font-bold text-sm text-[#191C1E]">
                  3D 트렁크 안착 애니메이션 짤 녹화
                </h4>
                <p className="text-xs text-[#595F67]">
                  물건이 내 차 트렁크로 쏙 들어가는 3초 시연 영상을 녹화하여 당근 판매자에게 보내세요!
                </p>
              </div>

              {recordedVideoUrl ? (
                <div className="flex flex-col gap-2">
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-44 rounded-xl object-cover bg-black/5 border border-[#EDEEF1]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadVideo}
                      className="flex-1 bg-[#FF7E36] hover:bg-[#E0601A] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      3D 영상 파일 다운로드
                    </button>
                    <button
                      onClick={handleRecordVideo}
                      className="px-3 bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#5A5E67] font-semibold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      다시 녹화
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#F8F9FC] rounded-xl border border-dashed border-[#DFC0B3] flex flex-col items-center gap-3 text-center">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <span className="material-symbols-outlined text-[32px] text-[#FF7E36] animate-spin">
                        sync
                      </span>
                      <span className="text-xs font-bold text-[#A04100]">
                        3D 씬 녹화 중... ({recordProgress}%)
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-[#5A5E67]">
                        아래 버튼을 누르면 3초간 3D 시뮬레이션 동작을 녹화합니다.
                      </p>
                      <button
                        onClick={handleRecordVideo}
                        className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                        3D 적재 시연 영상 3초 녹화하기
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-white border-t border-[#EDEEF1] flex flex-col gap-2">
          {/* KakaoTalk 1-sec Share Button */}
          <button
            onClick={handleKakaoShare}
            className="w-full bg-[#FEE500] hover:bg-[#E5CF00] text-[#3C1E1E] font-extrabold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-base">💬</span>
            <span>{kakaoShared ? '카카오톡 공유 전송 완료! ✨' : '카카오톡으로 1초 공유하기'}</span>
          </button>

          {/* Copy Chat Text Button */}
          <button
            onClick={handleCopyText}
            className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-bold py-2.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'done_all' : 'content_copy'}
            </span>
            <span>{copied ? '당근 채팅 문구 복사 완료! ✨' : '당근 채팅용 요약 텍스트 복사'}</span>
          </button>

          {/* Download & Native share row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadCard}
              className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{copiedImage ? '다운로드 완료!' : '인증 이미지 저장'}</span>
            </button>
            <button
              onClick={handleNativeShare}
              className="w-full bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>기타 SNS 공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
