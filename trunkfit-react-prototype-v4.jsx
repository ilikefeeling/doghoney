import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// ==========================================
// 🚗 VEHICLE DATABASE & RAW SPECS
// ==========================================
const VEHICLE_DATABASE = {
  santafe: {
    name: '현대 싼타페 MX5 (SUV)',
    openingWidth: 110, // cm
    openingHeight: 82, // cm
    trunkWidth: 115,   // 휠하우스 사이 최소폭
    trunkHeight: 85,
    trunkDepthNormal: 105,
    trunkDepthFolded: 185,
  },
  sorento: {
    name: '기아 쏘렌토 MQ4 (SUV)',
    openingWidth: 112,
    openingHeight: 80,
    trunkWidth: 116,
    trunkHeight: 83,
    trunkDepthNormal: 106,
    trunkDepthFolded: 188,
  },
  grandeur: {
    name: '현대 그랜저 GN7 (Sedan)',
    openingWidth: 102,
    openingHeight: 48,
    trunkWidth: 105,
    trunkHeight: 50,
    trunkDepthNormal: 115,
    trunkDepthFolded: 115, // 폴딩 미지원 간주 (일반 승용 세단)
  },
  modely: {
    name: '테슬라 모델 Y (CUV)',
    openingWidth: 98,
    openingHeight: 74,
    trunkWidth: 94,
    trunkHeight: 75,
    trunkDepthNormal: 108,
    trunkDepthFolded: 195,
  },
  ray: {
    name: '기아 레이 (Box Car)',
    openingWidth: 95,
    openingHeight: 98,
    trunkWidth: 98,
    trunkHeight: 102,
    trunkDepthNormal: 32,
    trunkDepthFolded: 142,
  }
};

// ==========================================
// 📦 MOCK OCR DATA FOR INSTANT TEST
// ==========================================
const MOCK_OCR_ITEMS = [
  { id: 1, name: '이케아 빌리(BILLY) 책장', width: 80, depth: 28, height: 202, img: '📚' },
  { id: 2, name: '당근마켓 미드센추리 원목 서랍장', width: 120, depth: 45, height: 75, img: '🗄️' },
  { id: 3, name: '캠핑용 접이식 대형 롤테이블 & 체어 세트', width: 110, depth: 35, height: 35, img: '⛺' },
  { id: 4, name: '원룸형 미니 소형 냉장고', width: 48, depth: 50, height: 85, img: ' Fridge' },
];

export default function TrunkFitPrototype() {
  // --- UI & Input States ---
  const [selectedCarKey, setSelectedCarKey] = useState('santafe');
  const [width, setWidth] = useState(80);
  const [depth, setDepth] = useState(28);
  const [height, setHeight] = useState(202);
  const [unit, setUnit] = useState('cm'); // 'cm' or 'mm'

  const [isSeatFolded, setIsSeatFolded] = useState(false);
  const [isDiagonalLoading, setIsDiagonalLoading] = useState(false);

  // --- Animation & OCR Mock States ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCeilingWarningDismissed, setIsCeilingWarningDismissed] = useState(false);

  // --- Calculated Results ---
  const [fitResult, setFitResult] = useState('FAIL'); // 'FITS' | 'TIGHT' | 'FAIL'
  const [marginReport, setMarginReport] = useState({ width: 0, height: 0, depth: 0 });

  // --- Three.js Ref for WebGL Scene Rendering ---
  const mountRef = useRef(null);

  const activeCar = VEHICLE_DATABASE[selectedCarKey];

  // Reset dismissal when inputs change to re-trigger warning if needed
  useEffect(() => {
    setIsCeilingWarningDismissed(false);
  }, [height, selectedCarKey, unit]);

  // OCR Mock Action
  const triggerMockOCR = (item) => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setWidth(item.width);
            setDepth(item.depth);
            setHeight(item.height);
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 80);
  };

  // Convert current units to cm for internal calculations
  const wCm = unit === 'mm' ? width / 10 : Number(width);
  const dCm = unit === 'mm' ? depth / 10 : Number(depth);
  const hCm = unit === 'mm' ? height / 10 : Number(height);

  const isCeilingExceeded = hCm > activeCar.trunkHeight;

  // Physical Fits Calculation Engine
  useEffect(() => {
    // Dynamic trunk limits based on active vehicle specs and toggle options
    const maxDepth = isSeatFolded ? activeCar.trunkDepthFolded : activeCar.trunkDepthNormal;
    const maxOpeningW = activeCar.openingWidth;
    const maxOpeningH = activeCar.openingHeight;
    const maxInsideW = activeCar.trunkWidth;
    const maxInsideH = activeCar.trunkHeight;

    // --- Core Fitting Algorithm with ItemFits-style Toggles ---
    // 1. Direct Normal Fitting (Entering perpendicular)
    const canPassOpeningNormal = wCm <= maxOpeningW && hCm <= maxOpeningH;
    const fitsInsideNormal = wCm <= maxInsideW && hCm <= maxInsideH && dCm <= maxDepth;

    // 2. Diagonal Entry Compensation (If package is rotated 45 degrees to squeeze through entrance/trunk)
    let fitsOpeningDiag = false;
    let fitsInsideDiag = false;
    
    if (isDiagonalLoading) {
      // Geometric approximation of diagonal bounding envelope (rotated around axis)
      const rotatedOpeningW = wCm * Math.cos(Math.PI / 4) + hCm * Math.sin(Math.PI / 4);
      const rotatedOpeningH = wCm * Math.sin(Math.PI / 4) + hCm * Math.cos(Math.PI / 4);
      
      // If rotated, it might pass a smaller width opening or fit inside with angled elevation
      fitsOpeningDiag = (wCm <= maxOpeningW && hCm <= maxOpeningH) || (rotatedOpeningW * 0.85 <= maxOpeningW && hCm * 0.85 <= maxOpeningH);
      fitsInsideDiag = dCm <= maxDepth && (wCm * 0.85 <= maxInsideW) && (hCm * 0.85 <= maxInsideH);
    }

    const canPassOpening = canPassOpeningNormal || (isDiagonalLoading && fitsOpeningDiag);
    const fitsInside = fitsInsideNormal || (isDiagonalLoading && fitsInsideDiag);

    // Determine margins based on best orientation
    const marginW = maxInsideW - wCm;
    const marginH = maxInsideH - hCm;
    const marginD = maxDepth - dCm;

    setMarginReport({
      width: Math.round(marginW),
      height: Math.round(marginH),
      depth: Math.round(marginD)
    });

    // 3-way color state decision
    if (!canPassOpening || !fitsInside) {
      setFitResult('FAIL'); // Red
    } else if (marginW < 8 || marginH < 8 || marginD < 8) {
      setFitResult('TIGHT'); // Yellow
    } else {
      setFitResult('FITS'); // Green
    }
  }, [width, depth, height, unit, selectedCarKey, isSeatFolded, isDiagonalLoading]);

  // Actual Three.js WebGL Rendering Effect
  useEffect(() => {
    if (!mountRef.current) return;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1329); // Modern dark blue canvas background

    const widthContainer = mountRef.current.clientWidth || 500;
    const heightContainer = mountRef.current.clientHeight || 350;
    const camera = new THREE.PerspectiveCamera(45, widthContainer / heightContainer, 0.1, 100);
    camera.position.set(2.5, 2.5, 4); // View from upper-right-front angle

    // --- 2. WebGL Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(widthContainer, heightContainer);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear old canvases
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // --- 3. Lights Setup ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff9d00, 0.5, 10);
    pointLight.position.set(-2, 3, -2);
    scene.add(pointLight);

    // --- 4. Floor Grid & Guide Lines ---
    const gridHelper = new THREE.GridHelper(6, 30, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -1.0;
    scene.add(gridHelper);

    // Group for entire interactive stage (to rotate around Y-axis easily via drag)
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // --- 5. Draw Vehicle Trunk (Wireframe Box & solid floor) ---
    const tWidth = activeCar.trunkWidth / 100;   // Convert cm to meters
    const tHeight = activeCar.trunkHeight / 100;
    const tDepth = (isSeatFolded ? activeCar.trunkDepthFolded : activeCar.trunkDepthNormal) / 100;

    // Trunk Box Wireframe Structure
    const trunkGeom = new THREE.BoxGeometry(tWidth, tHeight, tDepth);
    const trunkEdges = new THREE.EdgesGeometry(trunkGeom);
    const trunkLineMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    const trunkLineSegments = new THREE.LineSegments(trunkEdges, trunkLineMat);
    // Position trunk center so back is at z = -tDepth/2 and front is at z = tDepth/2
    trunkLineSegments.position.set(0, tHeight / 2 - 0.5, 0);
    stageGroup.add(trunkLineSegments);

    // Semi-transparent trunk glass shell to give volume
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.15,
      roughness: 0.2,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    const trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
    trunkMesh.position.set(0, tHeight / 2 - 0.5, 0);
    stageGroup.add(trunkMesh);

    // --- ItemFits Key Highlight: TRUNK ENTRY OPENING BOUNDARY (Orange Rect) ---
    const opWidth = activeCar.openingWidth / 100;
    const opHeight = activeCar.openingHeight / 100;
    const opGeom = new THREE.BoxGeometry(opWidth, opHeight, 0.02);
    const opEdges = new THREE.EdgesGeometry(opGeom);
    const opLineMat = new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 4 }); // Bold orange entrance
    const opLineSegments = new THREE.LineSegments(opEdges, opLineMat);
    // Positioned exactly at the trunk entrance (front edge of trunk: z = tDepth/2)
    opLineSegments.position.set(0, opHeight / 2 - 0.5, tDepth / 2);
    stageGroup.add(opLineSegments);

    // --- 6. Draw Cargo Box Object (Mesh & outline) ---
    const pWidth = (unit === 'mm' ? width / 10 : Number(width)) / 100; // cm to m
    const pDepth = (unit === 'mm' ? depth / 10 : Number(depth)) / 100;
    const pHeight = (unit === 'mm' ? height / 10 : Number(height)) / 100;

    const cargoGeom = new THREE.BoxGeometry(pWidth, pHeight, pDepth);
    
    // Shaded color based on result
    let cargoColor = 0xf97316; // Pending/Normal orange
    if (fitResult === 'FITS') cargoColor = 0x22c55e;      // Fits Green
    else if (fitResult === 'TIGHT') cargoColor = 0xeab308; // Tight Yellow
    else cargoColor = 0xef4444;                          // Fail Red

    const cargoMat = new THREE.MeshStandardMaterial({
      color: cargoColor,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const cargoMesh = new THREE.Mesh(cargoGeom, cargoMat);
    cargoMesh.castShadow = true;
    cargoMesh.receiveShadow = true;

    // Cargo Wireframe Outline
    const cargoEdges = new THREE.EdgesGeometry(cargoGeom);
    const cargoLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1.5 });
    const cargoLineSegments = new THREE.LineSegments(cargoEdges, cargoLineMat);
    cargoMesh.add(cargoLineSegments);

    // Pivot Group for rotating package easily if Diagonal Mode is selected
    const cargoPivot = new THREE.Group();
    cargoPivot.add(cargoMesh);
    stageGroup.add(cargoPivot);

    // Apply diagonal tilt rotation to simulation mesh if active
    if (isDiagonalLoading) {
      cargoMesh.rotation.set(Math.PI / 12, Math.PI / 8, 0); // Tilt by 15deg and rotate around Y 22.5deg
    }

    // --- Spark Particles Setup for Ceiling Intersection ---
    const particleCount = 60;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const lifetimes = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      // Spawn parameters
      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: -Math.random() * 1.2 - 0.2, // Spark downwards from ceiling
        z: (Math.random() - 0.5) * 1.5
      });
      lifetimes.push(Math.random());
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkParticles = new THREE.Points(particleGeom, particleMat);
    stageGroup.add(sparkParticles);

    // --- 7. Animation / Dynamic Smooth Insertion --- 
    let currentProgress = 0.0;
    const targetProgress = fitResult === 'FAIL' ? 0.3 : 1.0; // Fail slides slightly in, Success slides completely inside

    // --- 8. Drag to Orbit Interactions ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    stageGroup.rotation.y = 0.4;
    stageGroup.rotation.x = 0.15;

    const handleMouseDown = (e) => {
      isDragging = true;
    };

    const handleMouseMove = (e) => {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      if (isDragging) {
        stageGroup.rotation.y += deltaMove.x * 0.007;
        stageGroup.rotation.x = Math.max(-0.5, Math.min(0.5, stageGroup.rotation.x + deltaMove.y * 0.007));
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const canvasElement = renderer.domElement;
    canvasElement.addEventListener('mousedown', handleMouseDown);
    canvasElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // --- 9. Live Render Loop ---
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth slider sliding animation (Three.js WebGL rendering)
      if (currentProgress < targetProgress) {
        currentProgress += 0.025;
        if (currentProgress > targetProgress) currentProgress = targetProgress;
      } else if (currentProgress > targetProgress) {
        currentProgress -= 0.025;
        if (currentProgress < targetProgress) currentProgress = targetProgress;
      }

      // Calculate animated Z sliding coordinate
      // Starts from fully outside (z = tDepth / 2 + pDepth) and slides inside
      const startZ = tDepth / 2 + pDepth * 0.8;
      const endZ = -tDepth / 2 + pDepth / 2; // At the deep end of trunk
      const animatedZ = startZ + (endZ - startZ) * currentProgress;
      
      // Normal Y height is resting on trunk bottom floor (tHeight/2 - 0.5 - tHeight/2 + pHeight/2)
      const floorY = -0.5 + pHeight / 2;
      cargoPivot.position.set(0, floorY, animatedZ);

      // --- Animate 3D Spark Particles if ceiling is exceeded ---
      if (isCeilingExceeded) {
        sparkParticles.visible = true;
        const positionsAttr = sparkParticles.geometry.attributes.position;
        const posArr = positionsAttr.array;
        
        // Ceiling boundary y position relative to the stage
        const ceilingY = tHeight - 0.5;

        for (let i = 0; i < particleCount; i++) {
          lifetimes[i] -= 0.02;
          
          if (lifetimes[i] <= 0) {
            // Respawn spark particle at the intersection point (top center of the package/ceiling collision area)
            posArr[i * 3] = (Math.random() - 0.5) * (pWidth * 0.8);
            posArr[i * 3 + 1] = ceilingY;
            posArr[i * 3 + 2] = animatedZ + (Math.random() - 0.5) * (pDepth * 0.8);
            
            velocities[i] = {
              x: (Math.random() - 0.5) * 1.5,
              y: -Math.random() * 1.5 - 0.5, // splash downwards
              z: (Math.random() - 0.5) * 1.5
            };
            lifetimes[i] = Math.random() * 0.8 + 0.2;
          } else {
            // Physics translation
            posArr[i * 3] += velocities[i].x * 0.016;
            posArr[i * 3 + 1] += velocities[i].y * 0.016;
            posArr[i * 3 + 2] += velocities[i].z * 0.016;
            
            // Apply slight gravity to sparks over time
            velocities[i].y -= 0.08;
          }
        }
        positionsAttr.needsUpdate = true;
        
        // Flickering hot spark neon animation
        particleMat.color.setHSL(0.06 + Math.random() * 0.04, 1.0, 0.5 + Math.random() * 0.1);
      } else {
        sparkParticles.visible = false;
      }

      renderer.render(scene, camera);
    };
    let animationId;
    animate();

    // --- 10. Handle Resize ---
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 11. Cleanup (Tech Debt Prevention) ---
    return () => {
      cancelAnimationFrame(animationId);
      canvasElement.removeEventListener('mousedown', handleMouseDown);
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      
      // Geometries & Materials Dispose
      trunkGeom.dispose();
      trunkEdges.dispose();
      trunkLineMat.dispose();
      trunkMat.dispose();
      opGeom.dispose();
      opEdges.dispose();
      opLineMat.dispose();
      cargoGeom.dispose();
      cargoEdges.dispose();
      cargoLineMat.dispose();
      cargoMat.dispose();
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [selectedCarKey, width, depth, height, unit, isSeatFolded, isDiagonalLoading, fitResult]);

  // Copy Template Text Action
  const handleCopyText = () => {
    const wCm = unit === 'mm' ? width / 10 : Number(width);
    const dCm = unit === 'mm' ? depth / 10 : Number(depth);
    const hCm = unit === 'mm' ? height / 10 : Number(height);
    const text = `제 차(${activeCar.name})에 가로 ${wCm}cm, 세로 ${dCm}cm, 높이 ${hCm}cm 물건 수납을 트렁크핏으로 계산해보니 [${fitResult === 'FITS' ? '🟢안전 수납 가능' : '🟡여유 타이트 수납 가능'}]으로 확인되었습니다! 지금 바로 거래하러 출발하겠습니다. 🚗💨`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Autoscale cargo height to fit safely inside the selected vehicle
  const handleAutoscaleHeight = () => {
    const safeHeight = activeCar.trunkHeight - 5; // 5cm margin
    setHeight(unit === 'mm' ? safeHeight * 10 : safeHeight);
    setIsCeilingWarningDismissed(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased p-4 md:p-8">
      {/* HEADER SECTION */}
      <header className="max-w-6xl mx-auto mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-3xl">🚗</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              TrunkFit <span className="text-orange-500 text-2xl font-bold">차에들어갈까?</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            당근마켓 사진 한 장으로 시작하는 AI 기반 3D 차량 트렁크 적재 시뮬레이터 (WebGL 물리 렌더링 적용)
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="bg-orange-100 text-orange-600 font-semibold px-3.5 py-1.5 rounded-full text-xs">
            ⚡ 실시간 반응형 WebGL
          </span>
          <span className="bg-blue-100 text-blue-600 font-semibold px-3.5 py-1.5 rounded-full text-xs">
            🆓 100% 비회원 무료개방
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: INPUTS & ACTIONS (5 Cols) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* CARD 1: OCR MOCK DRAG & DROP */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📸</span> 1단계: 당근마켓 제품 이미지 인식 (OCR)
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MOCK_OCR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => triggerMockOCR(item)}
                  disabled={isScanning}
                  className="p-2.5 text-xs text-left bg-slate-50 hover:bg-orange-50 active:scale-95 border border-slate-200 hover:border-orange-200 rounded-xl transition flex flex-col justify-between h-20"
                >
                  <span className="text-base">{item.img}</span>
                  <div>
                    <div className="font-semibold text-slate-700 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.width}x{item.depth}x{item.height}cm</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Simulated Upload Dragzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 relative overflow-hidden group">
              {isScanning ? (
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-orange-600 font-bold text-sm">
                    <span className="animate-spin text-lg">⚙️</span> 치수 자동 파싱 스캔 중...
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-100" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="text-slate-400 text-2xl group-hover:scale-110 transition duration-200">📤</div>
                  <p className="text-xs font-semibold text-slate-600 mt-2">
                    여기에 당근 상품 상세 캡처를 드래그하거나 선택하세요
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">AI가 텍스트에서 3D 규격을 자동 추출합니다</p>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: DIMENSIONS & VEHICLE SPEC */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="text-lg">⚙️</span> 2단계: 실측 규격 직접 보완 및 내 차종
            </h3>

            {/* Dimension Fields */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500">화물 바운딩박스 규격 (cm/mm)</label>
                <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                  <button 
                    onClick={() => setUnit('cm')} 
                    className={`px-2.5 py-1 rounded-md transition ${unit === 'cm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >cm</button>
                  <button 
                    onClick={() => setUnit('mm')} 
                    className={`px-2.5 py-1 rounded-md transition ${unit === 'mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >mm</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">가로</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-slate-200 rounded-xl font-semibold text-slate-800 text-right focus:outline-orange-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">깊이</span>
                  <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-slate-200 rounded-xl font-semibold text-slate-800 text-right focus:outline-orange-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">높이</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-slate-200 rounded-xl font-semibold text-slate-800 text-right focus:outline-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">테스트용 내 차종 선택</label>
              <select
                value={selectedCarKey}
                onChange={(e) => setSelectedCarKey(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-orange-500"
              >
                {Object.entries(VEHICLE_DATABASE).map(([key, car]) => (
                  <option key={key} value={key}>{car.name}</option>
                ))}
              </select>
            </div>

            {/* ItemFits Benchmarking Toggles */}
            <div className="pt-2 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSeatFolded}
                  onChange={(e) => setIsSeatFolded(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded border-slate-300 focus:ring-orange-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-700">2열 시트 폴딩</div>
                  <div className="text-[10px] text-slate-400">트렁크 깊이 최대 확장</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDiagonalLoading}
                  onChange={(e) => setIsDiagonalLoading(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded border-slate-300 focus:ring-orange-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-700">대각선 비스듬히</div>
                  <div className="text-[10px] text-slate-400">진입 한계 보정 연산</div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: LIVE Three.js WebGL VISUALIZER & DYNAMIC ACTION (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* 3D CANVAS BOARD */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-800 text-white flex flex-col flex-1 min-h-[420px] relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-400">실시간 트렁크 가상 WebGL 3D</div>
                <div className="text-sm font-bold text-slate-200 mt-1">{activeCar.name} 적재 상황</div>
              </div>

              {/* Status Badge */}
              <div className="flex gap-2">
                {fitResult === 'FITS' && (
                  <span className="bg-green-500/15 text-green-400 border border-green-500/30 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    🟢 Fits (적재 가능)
                  </span>
                )}
                {fitResult === 'TIGHT' && (
                  <span className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    🟡 Tight Fit (아슬아슬함)
                  </span>
                )}
                {fitResult === 'FAIL' && (
                  <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    🔴 Does not fit (불가)
                  </span>
                )}
              </div>
            </div>

            {/* Actual Three.js WebGL Container */}
            <div className="flex-1 flex items-center justify-center relative bg-[#0b1329] rounded-2xl overflow-hidden border border-slate-800 min-h-[300px] cursor-grab active:cursor-grabbing">
              <div 
                ref={mountRef}
                className="w-full h-full absolute inset-0"
              />

              {/* REAL-TIME 3D CEILING COLLISION WARNING POPUP */}
              {isCeilingExceeded && !isCeilingWarningDismissed && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
                    💥
                  </div>
                  <h4 className="text-lg font-black text-red-400 tracking-tight">트렁크 천장 간섭 발생!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mt-2 leading-relaxed">
                    선택하신 차량의 트렁크 내부 천장 실측 높이는 <b>{activeCar.trunkHeight}cm</b>입니다.<br />
                    적재하려는 물품의 높이(<b>{hCm}cm</b>)가 이를 초과하여 천장에 부딪히는 간섭이 감지되었습니다.
                  </p>
                  
                  {/* Dynamic Action Buttons inside the Warning */}
                  <div className="flex flex-col w-full max-w-xs gap-2 mt-5">
                    <button
                      onClick={() => {
                        setIsDiagonalLoading(true);
                        setIsCeilingWarningDismissed(true);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                    >
                      🔄 대각선 눕혀 진입해보기
                    </button>
                    <button
                      onClick={handleAutoscaleHeight}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition transform active:scale-95 border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      📏 안전 적재 높이로 자동 축소 ({activeCar.trunkHeight - 5}cm)
                    </button>
                    <button
                      onClick={() => setIsCeilingWarningDismissed(true)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 mt-2 underline"
                    >
                      ✕ 닫기 / 경고 무시하고 3D 둘러보기
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Notice */}
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              💡 3D 뷰어 안을 <b>클릭 드래그</b>하여 트렁크 각도를 360도 입체적으로 조절할 수 있습니다.
            </p>

            {/* Realtime Margins Dashboard */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">가로폭 여유 마진</div>
                <div className={`text-sm font-extrabold mt-1 ${marginReport.width < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {marginReport.width >= 0 ? `+${marginReport.width} cm` : `${marginReport.width} cm`}
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">세로 깊이 여유 마진</div>
                <div className={`text-sm font-extrabold mt-1 ${marginReport.depth < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {marginReport.depth >= 0 ? `+${marginReport.depth} cm` : `${marginReport.depth} cm`}
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">높이 방향 여유 마진</div>
                <div className={`text-sm font-extrabold mt-1 ${marginReport.height < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {marginReport.height >= 0 ? `+${marginReport.height} cm` : `${marginReport.height} cm`}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC ACTIONS BLOCK BASED ON CALCULATION */}
          <div className="transition-all duration-300">
            {fitResult !== 'FAIL' ? (
              /* CASE 1: SUCCESS OR TIGHT FIT (🟢 / 🟡) */
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                <div className="text-center md:text-left">
                  <div className="text-emerald-800 font-bold text-sm">🎉 수납 가능성 매우 높음!</div>
                  <p className="text-xs text-emerald-600 mt-1">
                    판매자와 바로 거래 약속을 잡아보세요. 3D 시뮬레이션 적재 인증 문구를 채팅창에 복사할 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={handleCopyText}
                  className="w-full md:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-xs transition duration-200 transform active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {copied ? '✅ 복사 완료!' : '📋 당근마켓 인증 문구 복사'}
                </button>
              </div>
            ) : (
              /* CASE 2: FAIL (🔴) -> Direct alternative monetization */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {/* Alt 1: Quick Cargo Truck Link */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">수납 불가 한계</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">소형 용달(다마스/라보) 실시간 배차</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      해당 제품은 트렁크에 싣기 어렵습니다. 트렁크핏 전용 우대 용달 배차 서비스를 이용하세요.
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-600">예상 비용 25,000원~</span>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition active:scale-95">
                      원클릭 다마스 호출 ➡️
                    </button>
                  </div>
                </div>

                {/* Alt 2: Coupang Partners Affiliate Link */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">신품 퀵 매칭</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">쿠팡 로켓배송 최저가 매칭 카드</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      가져오는 운반비와 번거로움 대신, 무료배송으로 집 앞까지 배송되는 쿠팡 최저가 새 제품을 구경해 보세요.
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-blue-600">추천 가구 3% 즉시 할인</span>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition active:scale-95">
                      쿠팡 로켓배송 보러가기 🛒
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
        TrunkFit (차에들어갈까) © 2026. Designed with ItemFits physical guidelines for Korean major automotive vehicles. All rights reserved.
      </footer>
    </div>
  );
}