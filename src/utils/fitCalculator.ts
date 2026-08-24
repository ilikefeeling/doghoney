import { CarTrunk, FitCalculation, FitStatus, ItemDimensions } from '../types';

export function calculateFit(
  item: ItemDimensions,
  car: CarTrunk,
  isFolded: boolean,
  allowDiagonal: boolean,
  allowRotation: boolean = true
): FitCalculation {
  const itemW = Math.max(1, item.width);
  const itemD = Math.max(1, item.depth);
  const itemH = Math.max(1, item.height);

  const activeDepth = isFolded ? car.depthFolded : car.depth;
  const carW = car.width;
  const carH = car.height;

  // All 6 3D orientations (w, d, h)
  const allOrientations = [
    { w: itemW, d: itemD, h: itemH, desc: '기본 정방향 싣기', rotated: false },
    { w: itemW, d: itemH, h: itemD, desc: '앞뒤로 눕혀 적재', rotated: true },
    { w: itemD, d: itemW, h: itemH, desc: '90도 가로회전 적재', rotated: true },
    { w: itemD, d: itemH, h: itemW, desc: '90도 회전 후 눕혀 적재', rotated: true },
    { w: itemH, d: itemW, h: itemD, desc: '측면으로 세워 적재', rotated: true },
    { w: itemH, d: itemD, h: itemW, desc: '완전 세움 적재', rotated: true },
  ];

  const orientations = allowRotation 
    ? allOrientations 
    : allOrientations.filter(o => !o.rotated);

  // Helper to test if a 3D box fits inside target box (W, D, H)
  const fitsDirectly = (ow: number, od: number, oh: number, targetD: number) => {
    return ow <= carW && od <= targetD && oh <= carH;
  };

  // Helper to test diagonal entry (hypotenuse clearance)
  const fitsDiagonally = (ow: number, od: number, oh: number, targetD: number) => {
    // Check 2D diagonal inside trunk base (W vs D)
    const baseDiag = Math.sqrt(carW * carW + targetD * targetD);
    const itemLongest = Math.max(ow, od);
    const itemShortest = Math.min(ow, od);

    if (itemLongest <= baseDiag && itemShortest <= Math.min(carW, targetD) && oh <= carH) {
      return true;
    }

    // Check 3D diagonal inside volume
    const vol3DDiag = Math.sqrt(carW * carW + targetD * targetD + carH * carH);
    const item3DDiag = Math.sqrt(ow * ow + od * od + oh * oh);
    return item3DDiag <= vol3DDiag * 0.92 && Math.min(ow, od, oh) <= Math.min(carW, carH);
  };

  // Check normal trunk fit
  let canFitNormal = false;
  let canFitFolded = false;
  let canFitDiagonal = false;

  let bestOrientationNormal = orientations[0];
  let bestOrientationFolded = orientations[0];

  // Find best orientation for normal trunk
  for (const o of orientations) {
    if (fitsDirectly(o.w, o.d, o.h, car.depth)) {
      canFitNormal = true;
      bestOrientationNormal = o;
      break;
    }
  }

  // Find best orientation for folded trunk
  for (const o of orientations) {
    if (fitsDirectly(o.w, o.d, o.h, car.depthFolded)) {
      canFitFolded = true;
      bestOrientationFolded = o;
      break;
    }
  }

  // Check diagonal fits if needed
  if (!canFitNormal && allowDiagonal) {
    for (const o of orientations) {
      if (fitsDiagonally(o.w, o.d, o.h, isFolded ? car.depthFolded : car.depth)) {
        canFitDiagonal = true;
        break;
      }
    }
  }

  // Current active mode evaluation
  let currentFits = false;
  let selectedOrientation = isFolded ? bestOrientationFolded : bestOrientationNormal;
  let bestMarginSum = -Infinity;

  for (const o of orientations) {
    const mw = carW - o.w;
    const md = activeDepth - o.d;
    const mh = carH - o.h;
    const isDirect = mw >= 0 && md >= 0 && mh >= 0;
    const isDiag = allowDiagonal && fitsDiagonally(o.w, o.d, o.h, activeDepth);

    if (isDirect || isDiag) {
      currentFits = true;
      const marginScore = mw + md + mh;
      if (marginScore > bestMarginSum) {
        bestMarginSum = marginScore;
        selectedOrientation = o;
      }
    }
  }

  // If none fit, pick orientation that minimizes excess overflow
  if (!currentFits) {
    let minOverflow = Infinity;
    for (const o of orientations) {
      const overflowW = Math.max(0, o.w - carW);
      const overflowD = Math.max(0, o.d - activeDepth);
      const overflowH = Math.max(0, o.h - carH);
      const totalOverflow = overflowW + overflowD + overflowH;
      if (totalOverflow < minOverflow) {
        minOverflow = totalOverflow;
        selectedOrientation = o;
      }
    }
  }

  const marginW = carW - selectedOrientation.w;
  const marginD = activeDepth - selectedOrientation.d;
  const marginH = carH - selectedOrientation.h;

  // Determine FitStatus
  let status: FitStatus = 'fits';
  let statusLabel = 'Fits 🟢';
  let statusColor = '#10B981';
  let statusEmoji = '🟢';

  if (currentFits) {
    // Check if it's tight (clearance < 5cm on any axis) or diagonal required
    const isTight = marginW < 5 || marginD < 5 || marginH < 5 || (!fitsDirectly(selectedOrientation.w, selectedOrientation.d, selectedOrientation.h, activeDepth) && allowDiagonal);
    if (isTight) {
      status = 'tight';
      statusLabel = 'Tight 🟡';
      statusColor = '#F59E0B';
      statusEmoji = '🟡';
    } else {
      status = 'fits';
      statusLabel = 'Fits 🟢';
      statusColor = '#10B981';
      statusEmoji = '🟢';
    }
  } else {
    // If not fitting currently, could it fit with 2nd row folded?
    if (!isFolded && canFitFolded) {
      status = 'needs_fold';
      statusLabel = '시트 폴딩 필요 🟠';
      statusColor = '#FF7E36';
      statusEmoji = '🟠';
    } else {
      status = 'over';
      statusLabel = 'Over 🔴';
      statusColor = '#BA1A1A';
      statusEmoji = '🔴';
    }
  }

  // Generate actionable tips
  const tips: string[] = [];

  if (status === 'fits') {
    if (selectedOrientation.desc !== '기본 정방향 싣기') {
      tips.push(`💡 ${selectedOrientation.desc}하면 가장 안정적으로 적재됩니다.`);
    }
    if (marginW > 20 && marginD > 20) {
      tips.push(`✨ 트렁크 공간이 매우 넉넉하여 추가 짐도 함께 실을 수 있습니다.`);
    } else {
      tips.push(`✅ 트렁크 닫을 때 테일게이트 유리 긁힘 방지 담요/박스를 덧대세요.`);
    }
  } else if (status === 'tight') {
    if (marginW < 3) tips.push(`⚠️ 측면 여유가 ${Math.abs(marginW)}cm로 타이트합니다. 휠하우스 돌출부에 주의하세요.`);
    if (marginH < 3) tips.push(`⚠️ 상단 여유가 ${Math.abs(marginH)}cm입니다. 트렁크 힌지(경첩) 간섭을 확인하세요.`);
    if (marginD < 3) tips.push(`⚠️ 트렁크 도어가 닫힐 때 비스듬한 후면 유리에 닿지 않는지 확인하세요.`);
    if (allowDiagonal) tips.push(`🔄 대각선으로 먼저 머리를 넣은 후 비스듬히 안착시키세요.`);
  } else if (status === 'needs_fold') {
    tips.push(`🔄 2열 시트를 폴딩하면 최대 깊이 ${car.depthFolded}cm 확보되어 여유롭게 실립니다!`);
    tips.push(`💡 상단 스위치에서 '2열 시트 폴딩'을 활성화해보세요.`);
  } else {
    // Over
    const overflowItems = [];
    if (marginW < 0) overflowItems.push(`가로폭 ${Math.abs(marginW)}cm 초과`);
    if (marginD < 0) overflowItems.push(`깊이 ${Math.abs(marginD)}cm 초과`);
    if (marginH < 0) overflowItems.push(`높이 ${Math.abs(marginH)}cm 초과`);
    tips.push(`❌ ${overflowItems.join(', ')}되어 현재 차량에는 적재가 어렵습니다.`);
    tips.push(`🚚 다마스/라보 용달 또는 분해 후 적재를 추천합니다.`);
  }

  // Opening check
  if (selectedOrientation.w > car.openingWidth || selectedOrientation.h > car.openingHeight) {
    tips.push(`🚨 주의: 내부 적재 공간보다 '트렁크 입구 개구부'가 좁을 수 있습니다. 회전시켜 진입하세요.`);
  }

  // Volume ratio
  const itemVolLiters = (itemW * itemD * itemH) / 1000;
  const carVolLiters = isFolded ? car.volumeLitersFolded : car.volumeLiters;
  const volumeRatio = Math.min(1, itemVolLiters / carVolLiters);

  return {
    status,
    statusLabel,
    statusColor,
    statusEmoji,
    bestOrientation: {
      w: selectedOrientation.w,
      d: selectedOrientation.d,
      h: selectedOrientation.h,
      rotated: selectedOrientation.desc !== '기본 정방향 싣기',
      description: selectedOrientation.desc,
    },
    margins: {
      width: marginW,
      depth: marginD,
      height: marginH,
    },
    needsFold: !isFolded && canFitFolded,
    isDiagonal: allowDiagonal && fitsDiagonally(selectedOrientation.w, selectedOrientation.d, selectedOrientation.h, activeDepth),
    canFitNormal,
    canFitFolded,
    canFitDiagonal,
    tips,
    volumeRatio,
  };
}
