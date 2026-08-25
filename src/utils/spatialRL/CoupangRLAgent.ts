/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarTrunk, CoupangRecommendation, FitStatus, ItemDimensions, SpatialRLResult } from '../../types';
import { COUPANG_KNOWLEDGE_BASE } from '../../data/coupangKnowledgeBase';
import { CommerceRLStore } from './CommerceRLStore';

/**
 * Universal Contextual Commerce Reinforcement Learning Agent for Coupang
 * Incorporates 1:1 Curated Knowledge Base, Cost Savings Calculator, and Persistent Memory Store.
 */
export class CoupangRLAgent {
  private item: ItemDimensions;
  private car: CarTrunk;
  private fitStatus: FitStatus;
  private spatialRL?: SpatialRLResult;
  private isFolded: boolean;

  constructor(
    item: ItemDimensions,
    car: CarTrunk,
    fitStatus: FitStatus,
    spatialRL?: SpatialRLResult,
    isFolded: boolean = false
  ) {
    this.item = item;
    this.car = car;
    this.fitStatus = fitStatus;
    this.spatialRL = spatialRL;
    this.isFolded = isFolded;
  }

  /**
   * Cleans item name for clean e-commerce query matching
   */
  private cleanKeyword(name?: string): string {
    if (!name) return '인기 상품';
    return name
      .replace(/\s*\(AI 표준 규격 추정\)/g, '')
      .replace(/\s*\(수동 입력 필요\)/g, '')
      .replace(/\s*\(.*?규격.*?\)/g, '')
      .trim();
  }

  /**
   * Builds Coupang affiliate search URL
   */
  private buildCoupangUrl(keyword: string): string {
    const affiliateId = import.meta.env.VITE_COUPANG_AF_ID;
    const baseQuery = encodeURIComponent(keyword);
    let url = `https://www.coupang.com/np/search?component=&q=${baseQuery}&channel=user`;
    if (affiliateId) {
      url += `&affiliateId=${affiliateId}`;
    }
    return url;
  }

  /**
   * Universal Contextual MAB policy to generate and rank optimal Coupang recommendations for ANY item
   */
  public solveRecommendations(): CoupangRecommendation[] {
    const baseName = this.cleanKeyword(this.item.name);
    const specificKeyword = this.item.coupangKeyword || baseName;
    const recommendations: CoupangRecommendation[] = [];

    // ─── Step 1: 0ms 1:1 Exact Match Lookup from Memory / Knowledge Base ───
    const learnedPair = CommerceRLStore.getLearnedPair(baseName);
    if (learnedPair) {
      recommendations.push({
        ...learnedPair,
        url: this.buildCoupangUrl(learnedPair.keyword),
        qScore: 99,
        costSavingsLabel: learnedPair.costSavingsLabel || '💡 검증된 최적 1:1 솔루션 매칭',
      });
    } else {
      // Check Curated 1:1 Knowledge Base
      const matchedEntity = COUPANG_KNOWLEDGE_BASE.find(
        (entry) => entry.pattern.test(baseName) || entry.pattern.test(specificKeyword)
      );

      if (matchedEntity) {
        const exactProd = matchedEntity.exactCoupangProduct;
        let dynamicSavings = '✨ 무료배송 + 시간/노동 비용 절약';
        if (this.fitStatus === 'over') {
          dynamicSavings = '🚚 중고 용달비 50,000~80,000원 + 상하차 인건비 절약!';
        } else if (exactProd.strategy === 'flatpack_diy') {
          dynamicSavings = '📦 용달 부를 필요 없이 내 차로 직접 수납 (용달비 0원)';
        }

        recommendations.push({
          id: `exact-1to1-${Date.now()}`,
          strategy: exactProd.strategy,
          title: exactProd.title,
          badge: exactProd.badge,
          badgeColor: exactProd.badgeColor,
          priceLabel: exactProd.priceLabel,
          benefit: exactProd.benefit,
          hook: exactProd.hook,
          keyword: exactProd.keyword,
          url: this.buildCoupangUrl(exactProd.keyword),
          qScore: matchedEntity.baseQScore,
          icon: exactProd.icon,
          costSavingsLabel: dynamicSavings,
        });
      }
    }

    // ─── Step 2: Contextual RL Generation for Complementary & Alternative Options ───
    const isLargeHeavy =
      this.item.category === '가전' ||
      /냉장고|세탁기|건조기|TV|에어컨|스타일러|안마의자|피아노|런닝머신|쇼파|침대|장롱/i.test(baseName);

    const isLeisureSports =
      this.item.category === '취미' ||
      /자전거|텐트|캠핑|골프|웨건|낚시|스키|보드|킥보드|바베큐|카약|헬스/i.test(baseName);

    const isKidsBaby =
      this.item.category === '육아' ||
      /유모차|카시트|아기침대|보행기|미끄럼틀|붕붕카|트램폴린|장난감/i.test(baseName);

    const isPetPlant =
      /화분|식물|화초|캣타워|켄넬|케이지|수조|어항|반려/i.test(baseName);

    // 1. Strategy: 범용 신품 로켓배송 / 전문설치
    if (!recommendations.some((r) => r.strategy === 'new_product')) {
      let qNewProduct = 55;
      if (this.fitStatus === 'over') qNewProduct += 40;
      if (this.fitStatus === 'needs_fold') qNewProduct += 25;
      if (isLargeHeavy) qNewProduct += 15;

      const storedQ = CommerceRLStore.getStoredQScore(baseName, 'new_product');
      if (storedQ !== null) qNewProduct = (qNewProduct + storedQ) / 2;

      const newProdKeyword = isLargeHeavy ? `${specificKeyword} 로켓설치` : `${specificKeyword} 로켓배송`;
      const newProdBadge = isLargeHeavy ? '🚀 전문기사 무료 로켓설치' : '🚀 내일 아침 도착 로켓배송';
      const newProdBenefit = isLargeHeavy
        ? '내일 도착 • 전문 기사님 로켓설치 및 폐가전/폐가구 무료 수거'
        : '내일 아침 문 앞 도착 • 무료 반품 및 안심 교환';

      const savings = this.fitStatus === 'over'
        ? '🚚 중고 용달비 50,000~80,000원 + 상하차 인건비 절약'
        : '✨ 힘든 직접 운반 수고 0원 + 문 앞 무료 로켓배송';

      recommendations.push({
        id: 'coupang-new-product',
        strategy: 'new_product',
        title: `[새상품 로켓배송] ${baseName}`,
        badge: newProdBadge,
        badgeColor: 'bg-[#E02020] text-white',
        priceLabel: '신품 최저가 확인 →',
        benefit: newProdBenefit,
        hook: this.fitStatus === 'over'
          ? `🚚 중고 직거래 운반/용달비(5~8만원) 대신, 무료 배송되는 신품이 더 경제적입니다!`
          : `✨ 힘든 직접 운반 수고 없이 문 앞까지 편하게 로켓배송으로 받아보세요.`,
        keyword: newProdKeyword,
        url: this.buildCoupangUrl(newProdKeyword),
        qScore: Math.min(100, Math.round(qNewProduct)),
        icon: 'rocket_launch',
        costSavingsLabel: savings,
      });
    }

    // 2. Strategy: 범용 컴팩트 / 접이식 / 분해형 신품 대체재
    if (!recommendations.some((r) => r.strategy === 'flatpack_diy')) {
      let qCompact = 45;
      if (this.fitStatus === 'over' || this.fitStatus === 'tight') qCompact += 35;
      if (isKidsBaby || isLeisureSports) qCompact += 20;

      const storedQ = CommerceRLStore.getStoredQScore(baseName, 'flatpack_diy');
      if (storedQ !== null) qCompact = (qCompact + storedQ) / 2;

      let compactKeyword = `접이식 휴대용 ${specificKeyword}`;
      let compactTitle = `[차량 수납 100%] 접이식/컴팩트 ${baseName}`;
      let compactBenefit = '초소형 폴딩/분해 • 경차/승용차 트렁크에도 쏙 수납';

      if (isKidsBaby) {
        compactKeyword = `기내반입 휴대용 ${specificKeyword}`;
        compactTitle = `[원터치 폴딩] 초경량 휴대용 ${baseName}`;
        compactBenefit = '원터치 접이식 • 트렁크 1초 수납 및 기내반입 가능';
      } else if (isLeisureSports) {
        compactKeyword = `접이식 폴딩 ${specificKeyword}`;
        compactTitle = `[폴딩 수납] 초소형 컴팩트 ${baseName}`;
        compactBenefit = '폴딩 보관백 포함 • 승용차 적재 최적화 설계';
      } else if (/가구|책장|서랍|테이블|선반|수납/i.test(baseName)) {
        compactKeyword = `조립식 ${specificKeyword} 플랫팩 DIY`;
        compactTitle = `[승용차 100% 수납] 조립식 ${baseName}`;
        compactBenefit = '납작한 플랫 박스 포장 • 승용차 뒷좌석에도 거뜬히 적재';
      }

      recommendations.push({
        id: 'coupang-flatpack-diy',
        strategy: 'flatpack_diy',
        title: compactTitle,
        badge: '📦 100% 차량 수납형 (접이식/컴팩트)',
        badgeColor: 'bg-[#3B82F6] text-white',
        priceLabel: '컴팩트 신품 최저가 →',
        benefit: compactBenefit,
        hook: `💡 완제품은 차에 싣기 힘들어도, 접이식/컴팩트 규격은 내 차에 여유롭게 실립니다!`,
        keyword: compactKeyword,
        url: this.buildCoupangUrl(compactKeyword),
        qScore: Math.min(100, Math.round(qCompact)),
        icon: 'inventory_2',
        costSavingsLabel: '📦 용달 부를 필요 없이 내 차로 100% 수납',
      });
    }

    // 3. Strategy: 트렁크 화물 고정 탄성바 & 보양 완충 담요
    if (!recommendations.some((r) => r.strategy === 'cargo_securing')) {
      let qSecuring = 40;
      if (this.fitStatus === 'tight') qSecuring += 45;
      if (this.spatialRL?.metrics.tipRisk === '높음') qSecuring += 35;
      if (this.spatialRL?.metrics.tipRisk === '보통') qSecuring += 20;
      if ((this.spatialRL?.metrics.recommendedStrapCount || 0) > 0) qSecuring += 20;
      if (isPetPlant) qSecuring += 25;

      const storedQ = CommerceRLStore.getStoredQScore(baseName, 'cargo_securing');
      if (storedQ !== null) qSecuring = (qSecuring + storedQ) / 2;

      const strapKeyword = isPetPlant
        ? '차량용 화물 고정 벨트 방수 시트 패드'
        : '트렁크 고정줄 탄성바 탄력로프 4P';

      recommendations.push({
        id: 'coupang-cargo-securing',
        strategy: 'cargo_securing',
        title: isPetPlant ? '흔들림 방지 벨트 & 방수 패드' : '탄성바 & 완충 담요',
        badge: '🛡️ 흠집 및 코너링 쏠림 방지',
        badgeColor: 'bg-[#FF7E36] text-white',
        priceLabel: '쿠팡 로켓배송 1만원대 →',
        benefit: '트렁크 도어 덜 닫힘 고정 • 유리창/내장재 스크래치 완벽 방지',
        hook: this.fitStatus === 'tight'
          ? '⚠️ 여유 공간이 타이트하여 주행 중 흔들림 위험! 탄성 고정끈으로 안전 고정 필수'
          : '📦 소중한 내 차 내장재와 거래 물품을 보호하는 필수 이동 보양 세트',
        keyword: strapKeyword,
        url: this.buildCoupangUrl(strapKeyword),
        qScore: Math.min(100, Math.round(qSecuring)),
        icon: 'lock_reset',
        costSavingsLabel: '🛡️ 차량 내장재 흠집 수리비(10~30만원) 사전 예방',
      });
    }

    // 4. Strategy: 차종 맞춤 3D 풀커버 트렁크 매트
    if (!recommendations.some((r) => r.strategy === 'vehicle_custom')) {
      let qVehicleMat = 35;
      if (this.fitStatus === 'fits') qVehicleMat += 40;
      if (this.car.category === 'SUV' || this.car.category === 'EV') qVehicleMat += 15;
      if (isPetPlant || isLeisureSports) qVehicleMat += 25;

      const storedQ = CommerceRLStore.getStoredQScore(baseName, 'vehicle_custom');
      if (storedQ !== null) qVehicleMat = (qVehicleMat + storedQ) / 2;

      const cleanCarName = this.car.model.replace(/\(.*?\)/g, '').trim();
      const carMatKeyword = `${cleanCarName} 트렁크 매트 풀커버`;
      recommendations.push({
        id: 'coupang-vehicle-custom',
        strategy: 'vehicle_custom',
        title: `${cleanCarName} 전용 트렁크 매트`,
        badge: `🚗 ${this.car.model.split(' ')[0]} 맞춤 규격`,
        badgeColor: 'bg-[#10B981] text-white',
        priceLabel: '차종 전용 최저가 보기 →',
        benefit: '방수 방오 100% • 흙먼지, 젖은 짐, 스크래치 완벽 차단',
        hook: '✨ 짐 싣기 전 필수! 트렁크 바닥과 2열 등받이 오염/흠집을 사전에 예방하세요.',
        keyword: carMatKeyword,
        url: this.buildCoupangUrl(carMatKeyword),
        qScore: Math.min(100, Math.round(qVehicleMat)),
        icon: 'directions_car',
        costSavingsLabel: '✨ 트렁크 세차비 & 차량 잔존가치(감가상각) 보존',
      });
    }

    // Sort by Priority (Alternatives first) then Q-Score
    const priorityMap: Record<string, number> = {
      flatpack_diy: 1000,
      new_product: 900,
      vehicle_custom: 100,
      cargo_securing: 50,
    };
    recommendations.sort((a, b) => {
      // If exact 1to1, treat it as very high priority
      const aPrio = a.id.startsWith('exact-1to1') ? 2000 : (priorityMap[a.strategy] || 0);
      const bPrio = b.id.startsWith('exact-1to1') ? 2000 : (priorityMap[b.strategy] || 0);
      if (aPrio !== bPrio) return bPrio - aPrio;
      return b.qScore - a.qScore;
    });
    return recommendations;
  }
}
