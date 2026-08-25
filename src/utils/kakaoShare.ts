/**
 * KakaoTalk & Web Share API integration for TrunkFit viral loop
 */

import { CarTrunk, FitCalculation, ItemDimensions } from '../types';



// Kakao JS Key (can be injected via VITE_KAKAO_JS_KEY or fallback demo key)
const KAKAO_JS_KEY = (import.meta as any).env?.VITE_KAKAO_JS_KEY || '';

/**
 * Initialize Kakao SDK safely
 */
export function initKakao(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.Kakao) return false;

  if (!window.Kakao.isInitialized()) {
    if (KAKAO_JS_KEY) {
      try {
        window.Kakao.init(KAKAO_JS_KEY);
        return window.Kakao.isInitialized();
      } catch (e) {
        console.warn('[TrunkFit] Kakao init error:', e);
        return false;
      }
    }
  }
  return window.Kakao.isInitialized();
}

export interface ShareData {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  fitResult: FitCalculation;
}

/**
 * Generate formatted text for sharing
 */
export function generateShareText({ item, car, isFolded, fitResult }: ShareData): string {
  const { statusLabel, margins, bestOrientation } = fitResult;
  return `[개꿀 Doghoney] 🥕 당근 거래 트렁크 적재 확인 완료!
• 대상 물품: ${item.name || '가구/가전'} (${item.width} × ${item.depth} × ${item.height} cm)
• 픽업 차량: ${car.model} (${isFolded ? '2열 시트 폴딩' : '기본 트렁크'})
• 적재 판정: ${statusLabel}
• 여유 공간: 상단 ${margins.height >= 0 ? '+' : ''}${margins.height}cm / 측면 ${margins.width >= 0 ? '+' : ''}${margins.width}cm / 깊이 ${margins.depth >= 0 ? '+' : ''}${margins.depth}cm
• 권장 배치: ${bestOrientation.description}

내 차 트렁크에도 들어갈까? 1초 3D 시뮬레이션 해보기 👉 https://www.doghoney.xyz`;
}

/**
 * Share via KakaoTalk Feed Template
 */
export function shareKakaoTalk({ item, car, isFolded, fitResult }: ShareData): boolean {
  if (!initKakao()) {
    return false;
  }

  const { statusLabel, margins } = fitResult;
  const webUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.doghoney.xyz';

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🥕 [개꿀] ${item.name || '당근 물품'} 적재 판정: ${statusLabel}`,
        description: `차량: ${car.model} (${isFolded ? '2열 폴딩' : '기본'})\n규격: ${item.width}×${item.depth}×${item.height}cm (여유 +${Math.max(0, margins.depth)}cm)`,
        imageUrl: 'https://www.doghoney.xyz/og-image.jpg',
        link: {
          mobileWebUrl: webUrl,
          webUrl: webUrl,
        },
      },
      buttons: [
        {
          title: '3D 적재 시뮬레이션 보기',
          link: {
            mobileWebUrl: webUrl,
            webUrl: webUrl,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error('[Doghoney] Kakao Share error:', err);
    return false;
  }
}

/**
 * Share via Web Share API or Clipboard fallback
 */
export async function shareNativeOrClipboard(data: ShareData): Promise<{ success: boolean; method: 'web-share' | 'clipboard' }> {
  const text = generateShareText(data);
  const title = `[개꿀 Doghoney] ${data.item.name || '당근 물품'} 3D 적재 인증`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: typeof window !== 'undefined' ? window.location.href : 'https://www.doghoney.xyz',
      });
      return { success: true, method: 'web-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'web-share' };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  } catch (e) {
    return { success: false, method: 'clipboard' };
  }
}
