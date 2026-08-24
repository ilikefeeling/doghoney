import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSharedData, deleteSharedData } from '../utils/shareStorage';
import { extractDimensionsFromImage, toItemDimensions } from '../utils/geminiVision';
import { extractDimensionsWithGemini } from '../utils/textParser';
import { PRESET_ITEMS } from '../data/presets';
import { ItemDimensions } from '../types';

export const ShareTargetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'analyzing' | 'success' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState('공유 데이터 수신 중...');
  const [detailMessage, setDetailMessage] = useState('모바일 OS로부터 전달받은 정보를 파싱하고 있습니다.');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedItem, setExtractedItem] = useState<ItemDimensions | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const processShare = async () => {
      try {
        const sharedId = searchParams.get('sharedId');
        const urlTitle = searchParams.get('title') || '';
        const urlText = searchParams.get('text') || '';
        const urlLink = searchParams.get('url') || '';
        const hasError = searchParams.get('error');

        if (hasError) {
          throw new Error('공유 데이터 전송 과정에서 오류가 발생했습니다.');
        }

        let title = urlTitle;
        let text = urlText;
        let link = urlLink;
        let imageFile: File | null = null;
        let previewDataUrl: string | null = null;

        // 1. Check if we have an IndexedDB shared payload (from POST share with files/text)
        if (sharedId) {
          setStatusMessage('공유된 파일 및 텍스트를 불러오는 중...');
          const payload = await getSharedData(sharedId);

          if (payload) {
            title = payload.title || title;
            text = payload.text || text;
            link = payload.url || link;

            if (payload.files && payload.files.length > 0) {
              const sharedItem = payload.files[0];
              imageFile = new File([sharedItem.data], sharedItem.name || 'shared_image.jpg', {
                type: sharedItem.type || 'image/jpeg',
              });

              // Convert to DataURL for preview
              previewDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(sharedItem.data);
              });

              if (!isCancelled) {
                setPreviewImage(previewDataUrl);
              }
            }

            // Cleanup IDB payload after retrieval
            await deleteSharedData(sharedId);
          }
        }

        const combinedText = `${title} ${text} ${link}`.trim();

        // 2. If Image File is present -> Run AI Gemini Vision extraction
        if (imageFile && previewDataUrl) {
          if (isCancelled) return;
          setStatus('analyzing');
          setStatusMessage('📸 당근 사진 AI 3D 분석 중...');
          setDetailMessage('가구/가전의 형태와 치수를 정밀 분석하고 있습니다.');

          const extracted = await extractDimensionsFromImage(imageFile);
          const itemDims = toItemDimensions(extracted, previewDataUrl);

          if (title && !itemDims.name.includes(title)) {
            itemDims.name = title.trim() || itemDims.name;
          }

          if (isCancelled) return;
          setExtractedItem(itemDims);
          setStatus('success');
          setStatusMessage('✅ AI 치수 추출 완료!');
          setDetailMessage(`${itemDims.name} (${itemDims.width} × ${itemDims.depth} × ${itemDims.height}cm)`);

          // Redirect to 3D simulation with extracted state
          setTimeout(() => {
            if (!isCancelled) {
              navigate('/', {
                replace: true,
                state: {
                  sharedItem: itemDims,
                  sharedImage: previewDataUrl,
                  toastMessage: `🎉 '${itemDims.name}'의 3D 적재 시뮬레이션이 준비되었습니다!`,
                },
              });
            }
          }, 1000);
          return;
        }

        // 3. If only Text/URL is present -> Run Gemini Text Parser / Regex / Preset lookup
        if (combinedText) {
          if (isCancelled) return;
          setStatus('analyzing');
          setStatusMessage('📝 공유된 당근 텍스트 AI 분석 중...');
          setDetailMessage(`"${combinedText.slice(0, 50)}${combinedText.length > 50 ? '...' : ''}"`);

          const extractedDims = await extractDimensionsWithGemini(combinedText);

          let finalDimensions: ItemDimensions;

          if (
            extractedDims &&
            (extractedDims.width || extractedDims.depth || extractedDims.height || extractedDims.name)
          ) {
            finalDimensions = {
              width: extractedDims.width || 80,
              depth: extractedDims.depth || 60,
              height: extractedDims.height || 75,
              name: extractedDims.name || title || '공유된 당근 물품',
              category: '가구',
            };
          } else {
            // Preset fallback search
            const matchingPreset = PRESET_ITEMS.find((p) =>
              combinedText.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
            );

            if (matchingPreset) {
              finalDimensions = {
                width: matchingPreset.dimensions.width,
                depth: matchingPreset.dimensions.depth,
                height: matchingPreset.dimensions.height,
                name: matchingPreset.name,
                category: matchingPreset.category,
              };
            } else {
              finalDimensions = {
                width: 100,
                depth: 60,
                height: 70,
                name: title || '공유된 당근 물품 (치수 직접 확인 필요)',
                category: '기타',
              };
            }
          }

          if (isCancelled) return;
          setExtractedItem(finalDimensions);
          setStatus('success');
          setStatusMessage('✅ 텍스트 분석 완료!');
          setDetailMessage(`${finalDimensions.name} (${finalDimensions.width} × ${finalDimensions.depth} × ${finalDimensions.height}cm)`);

          setTimeout(() => {
            if (!isCancelled) {
              navigate('/', {
                replace: true,
                state: {
                  sharedItem: finalDimensions,
                  toastMessage: `🎉 '${finalDimensions.name}' 치수가 3D 화면에 적용되었습니다!`,
                },
              });
            }
          }, 800);
          return;
        }

        // 4. No shared data received (direct visit)
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage('공유된 사진이나 텍스트 정보가 없습니다.');
        }
      } catch (err: any) {
        console.error('[ShareTargetPage] Error:', err);
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err?.message || '공유 데이터 분석 중 오류가 발생했습니다.');
        }
      }
    };

    processShare();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4 selection:bg-[#FF7E36]/20">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#DFC0B3]/30 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF7E36] via-[#FF9E66] to-[#E86016]" />

        {/* Logo / App Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#FF7E36] flex items-center justify-center text-white shadow-sm font-black text-lg">
            🐕
          </div>
          <span className="font-extrabold text-lg text-[#191C1E] tracking-tight">개꿀 Doghoney</span>
          <span className="text-[11px] font-bold bg-[#FF7E36]/10 text-[#E86016] px-2 py-0.5 rounded-full">
            Web Share Target
          </span>
        </div>

        {/* Preview Image Card if available */}
        {previewImage && (
          <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 relative border border-[#E1E2E5] bg-black/5 shadow-inner">
            <img src={previewImage} alt="Shared item" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
              <span className="text-white text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">image</span>
                공유받은 사진
              </span>
            </div>
          </div>
        )}

        {/* Icon & Animation depending on Status */}
        <div className="relative mb-5">
          {status === 'loading' || status === 'analyzing' ? (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#FF7E36]/20 border-t-[#FF7E36] animate-spin" />
              <div className="w-14 h-14 rounded-full bg-[#FFF5F0] flex items-center justify-center text-[#FF7E36]">
                <span className="material-symbols-outlined text-3xl animate-pulse">
                  {status === 'analyzing' ? 'smart_toy' : 'share'}
                </span>
              </div>
            </div>
          ) : status === 'success' ? (
            <div className="w-20 h-20 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shadow-md animate-in zoom-in-50 duration-300">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-4xl">info</span>
            </div>
          )}
        </div>

        {/* Main Status Text */}
        <h2 className="text-xl font-extrabold text-[#191C1E] mb-2">{statusMessage}</h2>
        <p className="text-sm text-[#595F67] leading-relaxed mb-6 max-w-xs">{detailMessage}</p>

        {/* Result Preview Box (When Success) */}
        {extractedItem && (
          <div className="w-full bg-[#F8F9FC] border border-[#DFC0B3]/40 rounded-2xl p-4 mb-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-xs font-bold text-[#E86016] mb-1">📐 적재 시뮬레이션 적용 물품</div>
            <div className="font-extrabold text-base text-[#191C1E]">{extractedItem.name}</div>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-[#595F67]">
              <span className="bg-white px-2 py-1 rounded-lg border border-[#E1E2E5]">
                가로 <b className="text-[#191C1E]">{extractedItem.width}</b> cm
              </span>
              <span className="bg-white px-2 py-1 rounded-lg border border-[#E1E2E5]">
                세로 <b className="text-[#191C1E]">{extractedItem.depth}</b> cm
              </span>
              <span className="bg-white px-2 py-1 rounded-lg border border-[#E1E2E5]">
                높이 <b className="text-[#191C1E]">{extractedItem.height}</b> cm
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons (For Error or Fallback) */}
        {status === 'error' && (
          <div className="flex flex-col gap-2.5 w-full">
            {errorMessage && (
              <div className="text-xs text-[#B91C1C] bg-[#FEE2E2] p-3 rounded-xl mb-2 font-medium">
                {errorMessage}
              </div>
            )}
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3.5 px-4 bg-[#FF7E36] hover:bg-[#E86016] text-white font-extrabold rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">view_in_ar</span>
              직접 치수 입력하러 가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold rounded-2xl transition-all active:scale-98 text-sm"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* Instant Skip Button during analysis */}
        {(status === 'loading' || status === 'analyzing') && (
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-xs text-[#595F67] hover:text-[#191C1E] underline mt-2"
          >
            기다리지 않고 메인 화면으로 이동
          </button>
        )}
      </div>

      {/* Footer Info */}
      <p className="text-xs text-[#595F67] mt-6 text-center font-medium">
        당근마켓 및 갤러리 앱에서 '공유하기' 시 개꿀 Doghoney로 즉시 3D 시뮬레이션할 수 있습니다.
      </p>
    </div>
  );
};
