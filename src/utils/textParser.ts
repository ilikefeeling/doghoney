import { GoogleGenAI, Type } from '@google/genai';
import { ItemDimensions } from '../types';

/**
 * Extracts width, depth, and height from a raw text string using Regex.
 * Fallback parser when Gemini API is unavailable.
 */
export function extractDimensionsFromText(text: string): Partial<ItemDimensions> | null {
  if (!text) return null;

  // Normalization: remove spaces around operators/numbers to make regex easier
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  // 1. Look for explicit keywords: 가로/너비(W), 세로/깊이(D), 높이(H)
  const extract = (keywords: string[]) => {
    for (const kw of keywords) {
      // Look for: keyword [any text up to 3 chars like ':', '=', ' '] number
      const regex = new RegExp(`${kw}\\s*[:=]?\\s*([0-9]{1,3}(?:\\.[0-9]+)?)\\s*(?:cm|m|mm)?`, 'i');
      const match = normalized.match(regex);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
    }
    return null;
  };

  const w = extract(['가로', '너비', '폭', 'width', 'w']);
  const d = extract(['세로', '깊이', '길이', 'depth', 'd']);
  const h = extract(['높이', 'height', 'h']);

  if (w || d || h) {
    return {
      ...(w && { width: w }),
      ...(d && { depth: d }),
      ...(h && { height: h })
    };
  }

  // 2. Look for standard format: 120x60x80 or 120*60*80 (assume W x D x H)
  const exactMatch = normalized.match(/([0-9]{2,3})\s*[x*✕]\s*([0-9]{2,3})\s*[x*✕]\s*([0-9]{2,3})/);
  if (exactMatch) {
    return {
      width: parseFloat(exactMatch[1]),
      depth: parseFloat(exactMatch[2]),
      height: parseFloat(exactMatch[3])
    };
  }

  return null;
}

/**
 * Extracts dimensions using Gemini 1.5 Flash API for high accuracy.
 */
export async function extractDimensionsWithGemini(text: string): Promise<Partial<ItemDimensions> | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('Gemini API key not configured, falling back to regex parser');
    return extractDimensionsFromText(text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: text,
      config: {
        systemInstruction: `당신은 중고마켓 게시글 텍스트에서 가구/가전의 치수를 찾아내거나 추정하는 AI입니다.
규칙:
1. 텍스트에 치수(가로, 세로, 높이)가 명시되어 있다면 그 값을 cm 단위로 환산하여 추출하세요.
2. 텍스트에 치수가 없고 물품 이름만 있다면(예: '이케아 식탁', 'LG 65인치 TV', '일반 퀸사이즈 침대'), 해당 제품의 일반적인 표준 규격을 추정하여 치수를 채워 넣으세요.
3. 물품 이름(name)은 최대한 간결하게 핵심 명사로 추출하세요.
4. JSON 형식으로만 반환하세요. 도저히 물품을 식별할 수 없는 쓰레기값이면 비워두세요.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            width: { type: Type.NUMBER, description: "가로/너비/폭 (cm). 명시되어 있지 않다면 표준 규격으로 추정" },
            depth: { type: Type.NUMBER, description: "세로/깊이/길이 (cm). 명시되어 있지 않다면 표준 규격으로 추정" },
            height: { type: Type.NUMBER, description: "높이 (cm). 명시되어 있지 않다면 표준 규격으로 추정" },
            name: { type: Type.STRING, description: "상품의 간략한 이름 (예: 2인용 소파, 냉장고 등)"},
            isEstimated: { type: Type.BOOLEAN, description: "치수가 텍스트에 없어서 AI가 추정한 값이라면 true, 텍스트에 명시되어 있었다면 false" }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (parsed.width || parsed.depth || parsed.height || parsed.name) {
        let finalName = parsed.name;
        if (parsed.isEstimated && finalName) {
          finalName += ' (AI 표준 규격 추정)';
        }
        return {
          ...(parsed.width && { width: parsed.width }),
          ...(parsed.depth && { depth: parsed.depth }),
          ...(parsed.height && { height: parsed.height }),
          ...(finalName && { name: finalName })
        };
      }
    }
    
    // Fallback if AI couldn't find anything
    return extractDimensionsFromText(text);
  } catch (err) {
    console.error('Gemini API Error:', err);
    return extractDimensionsFromText(text); // fallback
  }
}
