/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarTrunk, FitCalculation, ItemDimensions } from '../../types';
import { CAR_DATABASE } from '../../data/cars';

const STORAGE_KEY_TELEMETRY = 'trunkfit_telemetry_events';

export interface TelemetryMeasurementEvent {
  id: string;
  timestamp: number;
  itemName: string;
  category: string;
  dimensions: { w: number; d: number; h: number };
  carModel: string;
  carCategory: string;
  fitStatus: 'fits' | 'tight' | 'needs_fold' | 'over';
  isFolded: boolean;
  topCoupangStrategy?: string;
  topCoupangKeyword?: string;
}

export interface TelemetryCommerceClickEvent {
  id: string;
  timestamp: number;
  itemName: string;
  carModel: string;
  strategy: string;
  keyword: string;
  qScore: number;
  affiliateUrl: string;
}

export interface TelemetryState {
  totalVisits: number;
  registeredUsersCount: number;
  measurements: TelemetryMeasurementEvent[];
  commerceClicks: TelemetryCommerceClickEvent[];
  lastUpdated: number;
}

/**
 * Enterprise Telemetry & Marketing Data Tracker
 * Logs real usage events and provides aggregated business intelligence metrics for the administrator.
 */
export class TelemetryTracker {
  private static state: TelemetryState = TelemetryTracker.loadState();

  private static loadState(): TelemetryState {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TELEMETRY);
      if (data) return JSON.parse(data);
    } catch {
      /* ignore */
    }

    // Default Seed Data for immediate rich BI analysis
    return TelemetryTracker.getSeedData();
  }

  private static saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(TelemetryTracker.state));
    } catch {
      /* ignore */
    }
  }

  private static getSeedData(): TelemetryState {
    const now = Date.now();
    return {
      totalVisits: 1420,
      registeredUsersCount: 384,
      measurements: [
        { id: 'm-1', timestamp: now - 3600000 * 2, itemName: '이케아 칼락스 4x2', category: '가구', dimensions: { w: 147, d: 39, h: 77 }, carModel: '현대 싼타페 (2023)', carCategory: 'SUV', fitStatus: 'fits', isFolded: true, topCoupangStrategy: 'flatpack_diy', topCoupangKeyword: '소프시스 8칸 플랫팩' },
        { id: 'm-2', timestamp: now - 3600000 * 4, itemName: 'LG 65인치 OLED TV', category: '가전', dimensions: { w: 160, d: 18, h: 97 }, carModel: '현대 아반떼 CN7', carCategory: 'Sedan', fitStatus: 'over', isFolded: false, topCoupangStrategy: 'new_product', topCoupangKeyword: 'LG 65인치 로켓설치' },
        { id: 'm-3', timestamp: now - 3600000 * 6, itemName: '스토케 익스플로리 유모차', category: '육아', dimensions: { w: 100, d: 55, h: 45 }, carModel: '현대 캐스퍼', carCategory: 'Compact', fitStatus: 'tight', isFolded: true, topCoupangStrategy: 'flatpack_diy', topCoupangKeyword: '원터치 휴대용 유모차' },
        { id: 'm-4', timestamp: now - 3600000 * 8, itemName: '코베아 롤테이블 120', category: '취미', dimensions: { w: 120, d: 25, h: 25 }, carModel: '기아 쏘렌토 MQ4', carCategory: 'SUV', fitStatus: 'fits', isFolded: false, topCoupangStrategy: 'flatpack_diy', topCoupangKeyword: '알루미늄 롤테이블' },
        { id: 'm-5', timestamp: now - 3600000 * 12, itemName: '삼성 그랑데 21kg 세탁기', category: '가전', dimensions: { w: 70, d: 80, h: 100 }, carModel: '현대 그랜저 GN7', carCategory: 'Sedan', fitStatus: 'over', isFolded: false, topCoupangStrategy: 'new_product', topCoupangKeyword: '통돌이 세탁기 로켓설치' },
        { id: 'm-6', timestamp: now - 3600000 * 15, itemName: '루나랩 전동 모션데스크', category: '가구', dimensions: { w: 140, d: 70, h: 75 }, carModel: '현대 싼타페 (2023)', carCategory: 'SUV', fitStatus: 'tight', isFolded: true, topCoupangStrategy: 'flatpack_diy', topCoupangKeyword: '전동 모션데스크 플랫팩' },
        { id: 'm-7', timestamp: now - 3600000 * 18, itemName: '20인치 접이식 자전거', category: '취미', dimensions: { w: 85, d: 40, h: 65 }, carModel: '현대 아반떼 CN7', carCategory: 'Sedan', fitStatus: 'fits', isFolded: false, topCoupangStrategy: 'vehicle_custom', topCoupangKeyword: '아반떼 트렁크 매트' },
        { id: 'm-8', timestamp: now - 3600000 * 24, itemName: '원목 대형 캣타워', category: '기타', dimensions: { w: 80, d: 50, h: 160 }, carModel: '제네시스 GV80', carCategory: 'SUV', fitStatus: 'over', isFolded: true, topCoupangStrategy: 'flatpack_diy', topCoupangKeyword: '조립식 캣타워 플랫팩' },
      ],
      commerceClicks: [
        { id: 'c-1', timestamp: now - 3600000 * 2, itemName: '이케아 칼락스 4x2', carModel: '현대 싼타페 (2023)', strategy: 'flatpack_diy', keyword: '소프시스 8칸 플랫팩', qScore: 98, affiliateUrl: 'https://coupang.com' },
        { id: 'c-2', timestamp: now - 3600000 * 4, itemName: 'LG 65인치 OLED TV', carModel: '현대 아반떼 CN7', strategy: 'new_product', keyword: 'LG 65인치 로켓설치', qScore: 99, affiliateUrl: 'https://coupang.com' },
        { id: 'c-3', timestamp: now - 3600000 * 6, itemName: '스토케 익스플로리 유모차', carModel: '현대 캐스퍼', strategy: 'flatpack_diy', keyword: '원터치 휴대용 유모차', qScore: 96, affiliateUrl: 'https://coupang.com' },
        { id: 'c-4', timestamp: now - 3600000 * 12, itemName: '삼성 그랑데 세탁기', carModel: '현대 그랜저 GN7', strategy: 'new_product', keyword: '전자동 세탁기 로켓설치', qScore: 99, affiliateUrl: 'https://coupang.com' },
        { id: 'c-5', timestamp: now - 3600000 * 15, itemName: '루나랩 모션데스크', carModel: '현대 싼타페 (2023)', strategy: 'cargo_securing', keyword: '트렁크 고정 탄성바 4P', qScore: 92, affiliateUrl: 'https://coupang.com' },
      ],
      lastUpdated: now,
    };
  }

  /**
   * Records a user measurement action
   */
  public static recordMeasurement(
    item: ItemDimensions,
    car: CarTrunk,
    fitResult: FitCalculation,
    isFolded: boolean
  ): void {
    const topRec = fitResult.coupangRecommendations?.[0];
    const newEvent: TelemetryMeasurementEvent = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      itemName: item.name || '미지정 품목',
      category: item.category || '기타',
      dimensions: { w: item.width, d: item.depth, h: item.height },
      carModel: car.model,
      carCategory: car.category,
      fitStatus: fitResult.status,
      isFolded,
      topCoupangStrategy: topRec?.strategy,
      topCoupangKeyword: topRec?.keyword,
    };

    TelemetryTracker.state.measurements.unshift(newEvent);
    if (TelemetryTracker.state.measurements.length > 500) {
      TelemetryTracker.state.measurements = TelemetryTracker.state.measurements.slice(0, 500);
    }
    TelemetryTracker.state.lastUpdated = Date.now();
    TelemetryTracker.saveState();
  }

  /**
   * Records a Coupang Commerce click action
   */
  public static recordCommerceClick(
    item: ItemDimensions,
    car: CarTrunk,
    strategy: string,
    keyword: string,
    qScore: number,
    url: string
  ): void {
    const newEvent: TelemetryCommerceClickEvent = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      itemName: item.name || '미지정 품목',
      carModel: car.model,
      strategy,
      keyword,
      qScore,
      affiliateUrl: url,
    };

    TelemetryTracker.state.commerceClicks.unshift(newEvent);
    if (TelemetryTracker.state.commerceClicks.length > 500) {
      TelemetryTracker.state.commerceClicks = TelemetryTracker.state.commerceClicks.slice(0, 500);
    }
    TelemetryTracker.state.lastUpdated = Date.now();
    TelemetryTracker.saveState();
  }

  /**
   * Aggregates complete Business Intelligence Report
   */
  public static getAggregatedBI(): {
    totalMeasurements: number;
    totalClicks: number;
    estimatedCTR: number;
    estimatedRevenueKRW: number;
    topCars: { model: string; count: number; sharePercent: number }[];
    topItems: { name: string; count: number; fitsCount: number; overCount: number }[];
    strategyPerformance: { strategy: string; label: string; clicks: number; sharePercent: number }[];
  } {
    const ms = TelemetryTracker.state.measurements;
    const cs = TelemetryTracker.state.commerceClicks;

    const totalMeasurements = ms.length;
    const totalClicks = cs.length;
    const estimatedCTR = totalMeasurements > 0 ? Math.round((totalClicks / totalMeasurements) * 1000) / 10 : 0;

    // Approximate affiliate commission (average item 80,000 KRW * 3% = 2,400 KRW per conversion, ~8% CVR)
    const estimatedRevenueKRW = Math.round(totalClicks * 0.08 * 2400);

    // 1. Car Distribution
    const carCounts: Record<string, number> = {};
    ms.forEach((m) => {
      carCounts[m.carModel] = (carCounts[m.carModel] || 0) + 1;
    });

    const topCars = Object.entries(carCounts)
      .map(([model, count]) => ({
        model,
        count,
        sharePercent: Math.round((count / Math.max(1, totalMeasurements)) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Top Items
    const itemMap: Record<string, { name: string; count: number; fitsCount: number; overCount: number }> = {};
    ms.forEach((m) => {
      const clean = m.itemName.replace(/\(.*?\)/g, '').trim();
      if (!itemMap[clean]) {
        itemMap[clean] = { name: clean, count: 0, fitsCount: 0, overCount: 0 };
      }
      itemMap[clean].count += 1;
      if (m.fitStatus === 'fits') itemMap[clean].fitsCount += 1;
      if (m.fitStatus === 'over') itemMap[clean].overCount += 1;
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Strategy Performance
    const strategyLabels: Record<string, string> = {
      new_product: '🚀 신품 로켓설치/배송',
      flatpack_diy: '📦 DIY 조립식 플랫팩',
      cargo_securing: '🛡️ 화물 고정바 & 보양패드',
      vehicle_custom: '🚗 차종 전용 3D 매트',
    };

    const stratCounts: Record<string, number> = {
      new_product: 0,
      flatpack_diy: 0,
      cargo_securing: 0,
      vehicle_custom: 0,
    };

    cs.forEach((c) => {
      stratCounts[c.strategy] = (stratCounts[c.strategy] || 0) + 1;
    });

    const strategyPerformance = Object.entries(stratCounts).map(([strategy, clicks]) => ({
      strategy,
      label: strategyLabels[strategy] || strategy,
      clicks,
      sharePercent: Math.round((clicks / Math.max(1, totalClicks)) * 100),
    }));

    return {
      totalMeasurements,
      totalClicks,
      estimatedCTR,
      estimatedRevenueKRW,
      topCars,
      topItems,
      strategyPerformance,
    };
  }

  /**
   * Generates downloadable CSV String for Excel / Google Sheets
   */
  public static exportMeasurementsCSV(): string {
    const headers = [
      'ID',
      '일시',
      '물품명',
      '카테고리',
      '가로(cm)',
      '세로(cm)',
      '높이(cm)',
      '차종',
      '차종분류',
      '적재판정',
      '2열폴딩여부',
      '추천전략',
      '추천키워드',
    ];

    const rows = TelemetryTracker.state.measurements.map((m) => [
      m.id,
      new Date(m.timestamp).toISOString(),
      `"${m.itemName.replace(/"/g, '""')}"`,
      m.category,
      m.dimensions.w,
      m.dimensions.d,
      m.dimensions.h,
      `"${m.carModel}"`,
      m.carCategory,
      m.fitStatus,
      m.isFolded ? '폴딩' : '기본',
      m.topCoupangStrategy || '',
      `"${(m.topCoupangKeyword || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return '\uFEFF' + csvContent; // Add BOM for Korean Excel compatibility
  }

  /**
   * Generates downloadable Commerce Clicks CSV
   */
  public static exportCommerceClicksCSV(): string {
    const headers = [
      'ID',
      '일시',
      '물품명',
      '사용자차종',
      '추천전략',
      '검색키워드',
      'AI적합도(Q-Score)',
      '쿠팡URL',
    ];

    const rows = TelemetryTracker.state.commerceClicks.map((c) => [
      c.id,
      new Date(c.timestamp).toISOString(),
      `"${c.itemName.replace(/"/g, '""')}"`,
      `"${c.carModel}"`,
      c.strategy,
      `"${c.keyword.replace(/"/g, '""')}"`,
      c.qScore,
      `"${c.affiliateUrl}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return '\uFEFF' + csvContent;
  }
}
