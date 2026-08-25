/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoupangRecommendation } from '../../types';

const STORAGE_KEY_RL_WEIGHTS = 'trunkfit_commerce_rl_weights';
const STORAGE_KEY_LEARNED_PAIRS = 'trunkfit_commerce_learned_pairs';

interface QRecord {
  qScore: number;
  impressions: number;
  clicks: number;
  purchases: number;
  lastUpdated: number;
}

/**
 * Persistent Reinforcement Learning Memory Store for Coupang Commerce
 * Stores client-side Q-values and adapts dynamically through user feedback signals (Impressions, Clicks, Conversions).
 */
export class CommerceRLStore {
  private static qTable: Record<string, QRecord> = CommerceRLStore.loadQTable();
  private static learnedPairs: Record<string, CoupangRecommendation> = CommerceRLStore.loadLearnedPairs();

  private static loadQTable(): Record<string, QRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RL_WEIGHTS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static saveQTable(): void {
    try {
      localStorage.setItem(STORAGE_KEY_RL_WEIGHTS, JSON.stringify(CommerceRLStore.qTable));
    } catch {
      /* ignore quota exceeded */
    }
  }

  private static loadLearnedPairs(): Record<string, CoupangRecommendation> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEARNED_PAIRS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static saveLearnedPairs(): void {
    try {
      localStorage.setItem(STORAGE_KEY_LEARNED_PAIRS, JSON.stringify(CommerceRLStore.learnedPairs));
    } catch {
      /* ignore */
    }
  }

  private static makeKey(keyword: string, strategy: string): string {
    return `${keyword.toLowerCase().trim()}_${strategy}`;
  }

  /**
   * Retrieves persistent learned Q-score adjustment
   */
  public static getStoredQScore(keyword: string, strategy: string): number | null {
    const key = CommerceRLStore.makeKey(keyword, strategy);
    const record = CommerceRLStore.qTable[key];
    return record ? record.qScore : null;
  }

  /**
   * Records user reinforcement learning feedback signal
   * @param keyword Item search keyword
   * @param strategy Recommended product strategy
   * @param feedback 'impression' (-0.2 decay), 'click' (+1.0 reward), 'purchase' (+5.0 reward)
   */
  public static recordFeedback(
    keyword: string,
    strategy: string,
    feedback: 'impression' | 'click' | 'purchase'
  ): void {
    const key = CommerceRLStore.makeKey(keyword, strategy);
    const current = CommerceRLStore.qTable[key] || {
      qScore: 70,
      impressions: 0,
      clicks: 0,
      purchases: 0,
      lastUpdated: Date.now(),
    };

    const alpha = 0.25; // Learning rate

    if (feedback === 'impression') {
      current.impressions += 1;
      // Slight decay if impression without interaction
      current.qScore = Math.max(20, current.qScore - 0.2);
    } else if (feedback === 'click') {
      current.clicks += 1;
      // Positive Q-Learning update: Q <- Q + alpha * (Target - Q)
      current.qScore = Math.min(100, Math.round(current.qScore + alpha * (95 - current.qScore)));
    } else if (feedback === 'purchase') {
      current.purchases += 1;
      // High reward update
      current.qScore = Math.min(100, Math.round(current.qScore + alpha * (100 - current.qScore) + 5));
    }

    current.lastUpdated = Date.now();
    CommerceRLStore.qTable[key] = current;
    CommerceRLStore.saveQTable();
  }

  /**
   * Saves a validated 1:1 matching pair into permanent memory
   */
  public static saveLearnedPair(keyword: string, rec: CoupangRecommendation): void {
    const clean = keyword.toLowerCase().trim();
    CommerceRLStore.learnedPairs[clean] = rec;
    CommerceRLStore.saveLearnedPairs();
  }

  /**
   * Retrieves a learned 1:1 pair from memory
   */
  public static getLearnedPair(keyword: string): CoupangRecommendation | null {
    const clean = keyword.toLowerCase().trim();
    return CommerceRLStore.learnedPairs[clean] || null;
  }

  /**
   * Returns current RL memory statistics
   */
  public static getMemoryStats(): { totalInteractions: number; learnedCount: number } {
    let totalClicks = 0;
    Object.values(CommerceRLStore.qTable).forEach((r) => {
      totalClicks += r.clicks + r.purchases;
    });
    return {
      totalInteractions: totalClicks,
      learnedCount: Object.keys(CommerceRLStore.learnedPairs).length,
    };
  }
}
