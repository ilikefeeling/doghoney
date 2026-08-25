/**
 * Gemini Vision API utility for AI-powered dimension extraction
 * from Danggeun Market product photos.
 */

import { ItemDimensions } from '../types';

// The API key is injected at build time or runtime via environment variable
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

interface GeminiVisionResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface ExtractedDimensions {
  name: string;
  category: string;
  width: number;
  depth: number;
  height: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'ocr_text' | 'visual_estimate' | 'model_lookup';
  coupangKeyword?: string;
}

const DIMENSION_PROMPT = `당신은 중고거래 가구/가전 치수 분석 및 물품 식별 전문가입니다. 
이 사진을 분석하여 아래 JSON 형식으로 물품 정보를 추출하세요.

규칙:
1. 물품 식별 주의사항: 물품의 외형을 정확히 파악하세요. 특히 드럼 세탁기(전면에 둥근 문)와 소형 냉장고/건조기를 절대 혼동하지 마세요.
2. name 필드 작성 규칙: '가전', '가구' 같은 포괄적인 단어를 절대 name으로 쓰지 마세요. 반드시 '냉장고', '세탁기', '서랍장' 등 구체적인 품목명을 작성하세요. (예: 사진 속 텍스트나 로고를 읽어 "LG 트롬 세탁기"처럼 작성)
3. 텍스트(라벨, 영수증 등)에 제조사나 모델명(예: LG 65인치, 삼성 건조기 17kg 등)이 보인다면, 공식 규격을 추정해 우선 적용하세요.
4. 모든 치수는 cm 단위 정수로만 반환하세요.
5. category는 "가구", "가전", "취미", "육아", "기타" 중 하나만 정확히 선택하세요.
6. name 필드에 인치 기호(") 대신 한글 '인치'를 사용하세요. (큰따옴표 중첩 금지)
7. coupangKeyword: 쿠팡 검색 시 당근의 구형 단종 제품이 안 나올 확률이 높습니다. 따라서 반드시 다음 4단계 '좁은 매치 -> 넓은 매치' 논리를 따라 쿠팡에 던질 가장 적합한 검색어 하나를 도출하세요:
   [1단계] 모델명이 최신이거나 쿠팡에 있을 법하면 '모델명' 그대로 사용.
   [2단계] 단종된 구형 모델이라면 스펙이 유사한 최신 모델을 찾을 수 있는 '유사 상품 키워드' 사용 (예: "LG 트롬 F24EJD" -> "LG 트롬 세탁기 24kg").
   [3단계] 동종 브랜드 유사 상품도 애매하다면, 타 브랜드의 '경쟁 상품' 키워드로 대체 (예: "LG 디오스 구형" -> "삼성 비스포크 냉장고").
   [4단계] 이조차 어렵다면 가장 범용적인 '일반 상품명' 사용 (예: "드럼 세탁기", "2도어 냉장고").

JSON 형식 (반드시 다른 텍스트 없이 JSON만 반환):
{
  "name": "물품의 구체적인 이름 (예: 삼성 비스포크 냉장고, LG 트롬 세탁기)",
  "coupangKeyword": "쿠팡 신품 검색용 범용 키워드 (예: 비스포크 냉장고, 드럼 세탁기)",
  "category": "가구|가전|취미|육아|기타",
  "width": 가로_cm_정수,
  "depth": 세로_cm_정수,
  "height": 높이_cm_정수,
  "confidence": "high|medium|low",
  "source": "ocr_text|visual_estimate|model_lookup"
}`;

/**
 * Convert a file/blob to base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract the base64 payload and MIME type from a data URL
 */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return { mimeType: match[1], base64: match[2] };
}

/**
 * Call Gemini Vision API to extract item dimensions from an image
 */
export async function extractDimensionsFromImage(
  imageSource: File | string // File object or base64 data URL
): Promise<ExtractedDimensions> {
  let dataUrl: string;

  if (imageSource instanceof File) {
    dataUrl = await fileToBase64(imageSource);
  } else {
    dataUrl = imageSource;
  }

  const { mimeType, base64 } = parseDataUrl(dataUrl);

  // If no API key, fall back to a smart heuristic
  if (!GEMINI_API_KEY) {
    console.warn('[TrunkFit] VITE_GEMINI_API_KEY not set — using visual heuristic fallback');
    return fallbackEstimate();
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: DIMENSION_PROMPT },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TrunkFit] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiVisionResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Parse JSON from the response (handle markdown code blocks)
    let jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed: ExtractedDimensions;
    try {
      parsed = JSON.parse(jsonStr) as ExtractedDimensions;
    } catch (parseError) {
      console.error('[TrunkFit] JSON Parse Error. Raw string was:', jsonStr);
      console.warn('[TrunkFit] Falling back to heuristic estimate due to parse error.');
      return fallbackEstimate();
    }

    // Validate and sanitize
    return {
      name: parsed.name || '분석된 물품',
      coupangKeyword: parsed.coupangKeyword,
      category: ['가구', '가전', '취미', '육아', '기타'].includes(parsed.category)
        ? parsed.category
        : '기타',
      width: Math.max(1, Math.round(parsed.width || 50)),
      depth: Math.max(1, Math.round(parsed.depth || 50)),
      height: Math.max(1, Math.round(parsed.height || 50)),
      confidence: parsed.confidence || 'medium',
      source: parsed.source || 'visual_estimate',
    };
  } catch (error) {
    console.error('[TrunkFit] Gemini Vision extraction failed:', error);
    // Return fallback instead of throwing error to prevent crash modal
    console.warn('[TrunkFit] Falling back to heuristic estimate due to API error.');
    return fallbackEstimate();
  }
}

/**
 * Fallback heuristic when API is unavailable
 * Returns reasonable default dimensions for common items
 */
function fallbackEstimate(): ExtractedDimensions {
  return {
    name: '가구/가전 (수동 입력 필요)',
    category: '기타',
    width: 80,
    depth: 50,
    height: 70,
    confidence: 'low',
    source: 'visual_estimate',
  };
}

/**
 * Convert ExtractedDimensions to ItemDimensions for the app
 */
export function toItemDimensions(
  extracted: ExtractedDimensions,
  imageSrc?: string
): ItemDimensions {
  let finalName = extracted.name;
  if (extracted.source !== 'ocr_text' && finalName) {
    finalName += ' (AI 표준 규격 추정)';
  }

  return {
    width: extracted.width,
    depth: extracted.depth,
    height: extracted.height,
    name: finalName,
    category: extracted.category,
    image: imageSrc,
    coupangKeyword: extracted.coupangKeyword,
  };
}
