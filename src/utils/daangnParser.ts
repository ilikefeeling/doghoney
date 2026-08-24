/**
 * Daangn Market (당근마켓) URL & text parser utility
 */

import { ItemDimensions } from '../types';
import { extractDimensionsFromImage } from './geminiVision';
import { PRESET_ITEMS } from '../data/presets';

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

/**
 * Extract item dimensions from Daangn Market URL or text title
 */
export async function parseDaangnUrlOrText(input: string): Promise<ItemDimensions> {
  const cleanInput = input.trim();

  // 1. If it's a URL
  const isUrl = cleanInput.startsWith('http://') || cleanInput.startsWith('https://');

  // If Gemini API is available, ask Gemini to analyze the Daangn URL / text
  if (GEMINI_API_KEY) {
    try {
      const prompt = `당신은 당근마켓 물건/가전 규격 분석 전문가입니다.
사용자가 입력한 당근마켓 정보(링크 또는 물품명/설명)를 바탕으로 물품명, 카테고리, 그리고 가로(W)×세로(D)×높이(H) 치수(cm 정수)를 추정하여 JSON으로 반환하세요.

입력: "${cleanInput}"

규칙:
- 모든 치수는 cm 단위 정수
- 한국에서 주로 유통되는 표준 가구/가전 규격 기준
- category: "가구" | "가전" | "취미" | "육아" | "기타"

JSON 형식만 반환:
{
  "name": "물품 이름 (예: 이케아 칼락스 4x2 수납장)",
  "category": "가구",
  "width": 147,
  "depth": 39,
  "height": 77
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 300,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          return {
            name: parsed.name || cleanInput.slice(0, 30),
            category: parsed.category || '가구',
            width: Math.max(1, Math.round(parsed.width || 80)),
            depth: Math.max(1, Math.round(parsed.depth || 50)),
            height: Math.max(1, Math.round(parsed.height || 70)),
          };
        }
      }
    } catch (err) {
      console.warn('[TrunkFit] Gemini URL parsing error, fallback to preset matcher:', err);
    }
  }

  // 2. Fallback Heuristic Matcher
  const lower = cleanInput.toLowerCase();
  for (const preset of PRESET_ITEMS) {
    const keywords = preset.name.toLowerCase().split(' ');
    if (keywords.some((k) => lower.includes(k))) {
      return {
        name: preset.name,
        category: preset.category,
        width: preset.dimensions.width,
        depth: preset.dimensions.depth,
        height: preset.dimensions.height,
      };
    }
  }

  // Default fallback
  return {
    name: isUrl ? '당근마켓 물건' : cleanInput.slice(0, 20),
    category: '가구',
    width: 100,
    depth: 60,
    height: 75,
  };
}
