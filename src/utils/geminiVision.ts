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
}

const DIMENSION_PROMPT = `당신은 중고거래 가구/가전 치수 분석 전문가입니다. 
이 사진을 분석하여 아래 JSON 형식으로 물품 정보를 추출하세요.

규칙:
1. 사진 속 텍스트(당근마켓 본문, 라벨, 스티커)에서 제조사/모델명/규격을 우선 추출
2. 텍스트에 치수가 없으면, 물품 종류를 식별하고 표준 규격을 추정
3. 모든 치수는 cm 단위 정수
4. category는 "가구", "가전", "취미", "육아", "기타" 중 택 1

JSON 형식 (다른 텍스트 없이 JSON만 반환):
{
  "name": "물품 이름 (한국어, 예: LG 65인치 TV, 이케아 칼락스 4x2)",
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
            maxOutputTokens: 512,
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
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr) as ExtractedDimensions;

    // Validate and sanitize
    return {
      name: parsed.name || '분석된 물품',
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
    throw error;
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
  };
}
