import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { CarTrunk, FitCalculation, ItemDimensions } from '../types';

// ─── 3D Scale: convert real cm to Three.js units (1 unit = 10 cm) ───
const S = 0.01; // 1cm = 0.01 units → 100cm = 1 unit

// ─── Scene Recorder for WebM ───
function SceneRecorder({ onRecordComplete, trigger }: { onRecordComplete: (b: Blob) => void, trigger: string }) {
  const { gl } = useThree();

  useEffect(() => {
    let recorder: MediaRecorder;
    const chunks: Blob[] = [];

    try {
      const stream = (gl.domElement as HTMLCanvasElement).captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onRecordComplete(blob);
      };

      recorder.start();

      // Record for 2.5s to capture the falling animation
      const timer = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 2500);

      return () => {
        clearTimeout(timer);
        if (recorder.state === 'recording') recorder.stop();
      };
    } catch (err) {
      console.warn("MediaRecorder is not supported or failed to start", err);
    }
  }, [gl, onRecordComplete, trigger]);

  return null;
}

// ─── Trunk wireframe box ───
function TrunkBox({
  car,
  isFolded,
}: {
  car: CarTrunk;
  isFolded: boolean;
}) {
  const activeDepth = isFolded ? car.depthFolded : car.depth;
  const w = car.width * S;
  const d = activeDepth * S;
  const h = car.height * S;

  const normalDepth = car.depth * S;

  return (
    <group position={[0, h / 2, 0]}>
      {/* Main trunk wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#9EA3AC" linewidth={1.5} transparent opacity={0.7} />
      </lineSegments>

      {/* Semi-transparent trunk walls */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#F8F9FC"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Folded zone highlight */}
      {isFolded && (
        <mesh position={[0, 0, -(d / 2 - (d - normalDepth) / 2)]}>
          <boxGeometry args={[w * 0.98, h * 0.98, d - normalDepth]} />
          <meshStandardMaterial
            color="#FF7E36"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Trunk floor */}
      <mesh position={[0, -h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#E1E2E5" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Tailgate opening indicator (back face) */}
      <mesh position={[0, 0, d / 2 + 0.002]}>
        <planeGeometry args={[car.openingWidth * S, car.openingHeight * S]} />
        <meshStandardMaterial
          color="#FF7E36"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Animated cargo item ───
function CargoItem({
  item,
  fitResult,
  car,
  isFolded,
}: {
  item: ItemDimensions;
  fitResult: FitCalculation;
  car: CarTrunk;
  isFolded: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (item.image) {
      const loader = new THREE.TextureLoader();
      loader.load(
        item.image,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          setTexture(tex);
        },
        undefined,
        () => setTexture(null)
      );
    } else {
      setTexture(null);
    }
  }, [item.image]);

  const { bestOrientation, status } = fitResult;
  const bw = bestOrientation.w * S;
  const bd = bestOrientation.d * S;
  const bh = bestOrientation.h * S;

  const trunkH = car.height * S;
  const isOver = status === 'over';

  // Color based on fit status
  const itemColor = useMemo(() => {
    switch (status) {
      case 'fits':
        return '#FF7E36';
      case 'tight':
        return '#F59E0B';
      case 'needs_fold':
        return '#FF7E36';
      case 'over':
        return '#BA1A1A';
    }
  }, [status]);

  // Reset animation when item or car changes
  useEffect(() => {
    setAnimProgress(0);
  }, [item.width, item.depth, item.height, car.id, isFolded]);

  // Animate the cargo sliding in
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (animProgress < 1) {
      const speed = isOver ? 1.8 : 1.2;
      setAnimProgress((p) => Math.min(1, p + delta * speed));
    }

    const t = animProgress;
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3);

    const finalY = bh / 2;

    if (isOver) {
      // Over animation: slide in, then bounce back
      if (t < 0.5) {
        const slideIn = t * 2;
        const easeIn = 1 - Math.pow(1 - slideIn, 2);
        meshRef.current.position.z = THREE.MathUtils.lerp(0.8, 0.1, easeIn);
        meshRef.current.position.y = finalY;
      } else {
        // Bounce back
        const bounceT = (t - 0.5) * 2;
        const bounce = Math.sin(bounceT * Math.PI) * 0.15;
        meshRef.current.position.z = 0.1 + bounce;
        meshRef.current.position.y = finalY;
        // Shake rotation
        meshRef.current.rotation.z = Math.sin(bounceT * Math.PI * 4) * 0.03 * (1 - bounceT);
      }
    } else {
      // Success animation: smooth slide from behind and land
      meshRef.current.position.z = THREE.MathUtils.lerp(0.5, 0, ease);
      // Drop from above
      const dropOffset = (1 - ease) * 1.5;
      meshRef.current.position.y = finalY + dropOffset;
      meshRef.current.rotation.z = 0;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, bh / 2, 2]}>
      {texture ? (
        <>
          <planeGeometry args={[bw, bh]} />
          <meshBasicMaterial
            map={texture}
            transparent
            side={THREE.DoubleSide}
          />
        </>
      ) : (
        <>
          <RoundedBox args={[bw, bh, bd]} radius={0.01} smoothness={4}>
            <meshStandardMaterial
              color={itemColor}
              transparent
              opacity={0.85}
              roughness={0.3}
              metalness={0.1}
            />
          </RoundedBox>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(bw, bh, bd)]} />
            <lineBasicMaterial color={itemColor} linewidth={1} transparent opacity={0.6} />
          </lineSegments>
        </>
      )}
    </mesh>
  );
}

// ─── Margin visualization bars ───
function MarginIndicators({
  fitResult,
  car,
  isFolded,
}: {
  fitResult: FitCalculation;
  car: CarTrunk;
  isFolded: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 6);
    }
  });

  const { margins, bestOrientation, status } = fitResult;
  if (status === 'over') return null;

  const trunkH = car.height * S;
  const activeDepth = (isFolded ? car.depthFolded : car.depth) * S;

  const bw = bestOrientation.w * S;
  const bh = bestOrientation.h * S;
  const bd = bestOrientation.d * S;

  const getColor = (margin: number) => {
    if (margin >= 10) return '#10B981';
    if (margin >= 5) return '#F59E0B';
    if (margin >= 0) return '#FF7E36';
    return '#BA1A1A';
  };

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      {/* Width margin (left side) */}
      {margins.width >= 0 && (
        <mesh position={[-(bw / 2 + (margins.width * S) / 2), bh / 2, 0]}>
          <boxGeometry args={[margins.width * S, bh * 0.1, bd * 0.1]} />
          <meshStandardMaterial
            color={getColor(margins.width)}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Height margin (top) */}
      {margins.height >= 0 && (
        <mesh position={[0, bh + (margins.height * S) / 2, 0]}>
          <boxGeometry args={[bw * 0.1, margins.height * S, bd * 0.1]} />
          <meshStandardMaterial
            color={getColor(margins.height)}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

function DimensionLabels({
  car,
  isFolded,
}: {
  car: CarTrunk;
  isFolded: boolean;
  item: ItemDimensions;
  fitResult: FitCalculation;
}) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Delay text rendering to prevent troika-three-text 'broken font' flash on initial load
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const activeDepth = isFolded ? car.depthFolded : car.depth;
  const w = car.width * S;
  const d = activeDepth * S;
  const h = car.height * S;

  if (!show) return null;

  return (
    <group>
      {/* Trunk width label */}
      <Text
        position={[0, -0.03, d / 2 + 0.08]}
        fontSize={0.045}
        color="#5A5E67"
        anchorX="center"
        anchorY="top"
      >
        {`W: ${car.width}cm`}
      </Text>

      {/* Trunk depth label */}
      <Text
        position={[w / 2 + 0.08, -0.03, 0]}
        fontSize={0.045}
        color="#5A5E67"
        anchorX="left"
        anchorY="top"
        rotation={[0, -Math.PI / 2, 0]}
      >
        {`D: ${activeDepth}cm`}
      </Text>

      {/* Height label */}
      <Text
        position={[w / 2 + 0.08, h / 2, d / 2 + 0.05]}
        fontSize={0.045}
        color="#5A5E67"
        anchorX="left"
        anchorY="middle"
      >
        {`H: ${car.height}cm`}
      </Text>
    </group>
  );
}

// ─── Main 3D Scene ───
function Scene({
  item,
  car,
  isFolded,
  fitResult,
}: {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  fitResult: FitCalculation;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.3} />

      {/* Floor grid */}
      <Grid
        args={[4, 4]}
        position={[0, -0.001, 0]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#DFC0B3"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#9EA3AC"
        fadeDistance={5}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Trunk wireframe */}
      <TrunkBox car={car} isFolded={isFolded} />

      {/* Cargo item with animation */}
      <CargoItem item={item} fitResult={fitResult} car={car} isFolded={isFolded} />

      {/* Margin indicators */}
      <MarginIndicators fitResult={fitResult} car={car} isFolded={isFolded} />

      {/* Dimension labels */}
      <DimensionLabels car={car} isFolded={isFolded} item={item} fitResult={fitResult} />

    </>
  );
}

// ─── Exported component ───
import { CAR_DATABASE } from '../data/cars';

interface TrunkScene3DProps {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  allowDiagonal: boolean;
  fitResult: FitCalculation;
  onSelectCar?: (car: CarTrunk) => void;
  onCopyCert?: () => void;
}

export const TrunkScene3D: React.FC<TrunkScene3DProps> = ({
  item,
  car,
  isFolded,
  fitResult,
  onSelectCar,
  onCopyCert,
}) => {
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const handleKakaoShare = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const shareUrl = `https://trunkfit.kr/?carId=${car.id}`;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `트렁크핏 - ${car.model}에 이 물건 들어갈까?`,
          description: fitResult.status === 'fit' 
            ? '네! 내 차 트렁크에 쏙 들어갑니다. 3D로 확인해보세요.' 
            : '아쉽지만 안 들어가네요. 3D로 확인해보세요!',
          imageUrl: 'https://trunkfit.kr/og-image.png',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '3D 시뮬레이션 직접 해보기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      alert('카카오톡 공유를 사용할 수 없습니다.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `트렁크핏 - ${car.model} 적재 결과`,
          text: fitResult.status === 'fit' ? '내 차 트렁크에 쏙 들어갑니다! 3D로 확인해보세요.' : '아쉽게도 안 들어가네요ㅠㅠ',
          url: `https://trunkfit.kr/?carId=${car.id}`,
        });
      } catch (err) {
        console.log('공유가 취소되었거나 실패했습니다.', err);
      }
    } else {
      alert('현재 기기/브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  };

  // When item changes, reset the video so we record the new animation
  const triggerKey = `${item.width}-${item.height}-${item.depth}-${car.id}-${isFolded}`;
  useEffect(() => {
    setVideoBlob(null);
  }, [triggerKey]);

  const { status, statusLabel, margins, bestOrientation, tips } = fitResult;

  const filteredCars = CAR_DATABASE.filter((c) => {
    const matchesSearch =
      c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getBadgeStyle = () => {
    switch (status) {
      case 'fits':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
      case 'tight':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]';
      case 'needs_fold':
        return 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]';
      case 'over':
        return 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]';
    }
  };

  const renderAlertBanner = () => {
    switch (status) {
      case 'fits':
        return (
          <div className="bg-[#DCFCE7] border-b border-[#86EFAC] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#15803D] text-[24px]">check_circle</span>
            <div className="flex flex-col">
              <span className="text-[#15803D] font-extrabold text-[15px]">여유 있게 적재 가능합니다!</span>
              {tips.length > 0 && <span className="text-[#166534] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>}
            </div>
          </div>
        );
      case 'tight':
        return (
          <div className="bg-[#FEF3C7] border-b border-[#FCD34D] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B45309] text-[24px]">warning</span>
            <div className="flex flex-col">
              <span className="text-[#B45309] font-extrabold text-[15px]">적재 가능 (공간 타이트함)</span>
              {tips.length > 0 && <span className="text-[#92400E] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>}
            </div>
          </div>
        );
      case 'needs_fold':
        return (
          <div className="bg-[#FFEDD5] border-b border-[#FDBA74] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#C2410C] text-[24px]">airline_seat_recline_normal</span>
            <div className="flex flex-col">
              <span className="text-[#C2410C] font-extrabold text-[15px]">2열 시트를 접어야 들어갑니다!</span>
              {tips.length > 0 && <span className="text-[#9A3412] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>}
            </div>
          </div>
        );
      case 'over':
        return (
          <div className="bg-[#FEE2E2] border-b border-[#FCA5A5] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B91C1C] text-[24px]">error</span>
            <div className="flex flex-col">
              <span className="text-[#B91C1C] font-extrabold text-[15px]">적재 불가: 크기가 초과됩니다</span>
              {tips.length > 0 && <span className="text-[#991B1B] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>}
            </div>
          </div>
        );
    }
  };

  const activeCarDepth = isFolded ? car.depthFolded : car.depth;
  const boxW = bestOrientation.w;
  const boxD = bestOrientation.d;
  const boxH = bestOrientation.h;

  return (
    <section className="bg-white rounded-2xl ambient-shadow overflow-hidden flex flex-col border border-[#EDEEF1]">
      {/* Simulation Header with Clickable Car Selector */}
      <div className="px-4 py-3 flex justify-between items-center bg-white border-b border-[#EDEEF1]">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[16px] text-[#191C1E]">3D 적재 시뮬레이션</h3>
          
          {/* Clickable Car Selector Button */}
          {onSelectCar ? (
            <button
              onClick={() => setIsCarModalOpen(true)}
              className="inline-flex items-center gap-1 bg-[#FFDBCC]/50 hover:bg-[#FFDBCC] border border-[#FF7E36]/40 text-[#7A3000] px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="차종 변경하기"
            >
              <span className="material-symbols-outlined text-[13px] text-[#FF7E36]">directions_car</span>
              <span>{car.model.split(' ').slice(0, 2).join(' ')}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          ) : (
            <span className="text-[11px] text-[#595F67]">
              ({car.model.split(' ').slice(0, 2).join(' ')})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-xs transition-all ${getBadgeStyle()}`}
          >
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Top Alert Banner (Replaces bottom tip box) */}
      {renderAlertBanner()}

      {/* 3D Canvas (WebGL) */}
      <div className="h-72 bg-[#F8F9FC] relative select-none pointer-events-none">
        <Canvas
          id="trunkfit-3d-canvas"
          camera={{
            position: [1.8, 1.5, 1.8],
            fov: 45,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          style={{ background: 'linear-gradient(180deg, #F8F9FC 0%, #EDEEF1 100%)' }}
        >
          <Scene
            item={item}
            car={car}
            isFolded={isFolded}
            fitResult={fitResult}
          />
          <SceneRecorder onRecordComplete={setVideoBlob} trigger={triggerKey} />
        </Canvas>
      </div>

      {/* Orientation & Dimension Info */}
      <div className="bg-white px-4 py-2 flex items-center justify-between text-[11px] text-[#5A5E67] border-t border-[#EDEEF1]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-[#FF7E36]">rotate_90_degrees_ccw</span>
          <span className="font-semibold text-[#191C1E]">{bestOrientation.description}</span>
        </div>
        <span className="font-medium">
          물품: {item.width}×{item.depth}×{item.height}cm
        </span>
      </div>

      {/* Margin Feedback Strip */}
      <div className="bg-[#F8F9FC] px-4 py-2.5 flex justify-between items-center text-[#5A5E67] border-t border-[#EDEEF1]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#FF7E36]">straighten</span>
          <span className="text-xs font-bold text-[#191C1E]">여유 공간</span>
        </div>
        <div className="text-xs flex gap-3 font-medium">
          <span>
            상단{' '}
            <strong className={margins.height >= 0 ? 'text-[#FF7E36]' : 'text-[#BA1A1A]'}>
              {margins.height >= 0 ? `+${margins.height}` : margins.height}cm
            </strong>
          </span>
          <span>
            측면{' '}
            <strong className={margins.width >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'}>
              {margins.width >= 0 ? `+${margins.width}` : margins.width}cm
            </strong>
          </span>
          <span>
            깊이{' '}
            <strong className={margins.depth >= 0 ? 'text-[#10B981]' : 'text-[#BA1A1A]'}>
              {margins.depth >= 0 ? `+${margins.depth}` : margins.depth}cm
            </strong>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-3 border-t border-[#EDEEF1] flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleKakaoShare}
            className="flex-1 bg-[#FAE100] hover:bg-[#E5CB00] text-[#371D1E] font-bold text-[14px] rounded-xl py-3 shadow-sm active:scale-98 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            카톡 공유
          </button>
          
          <button
            onClick={handleNativeShare}
            className="flex-1 bg-[#F2F3F6] hover:bg-[#E1E2E5] text-[#191C1E] font-bold text-[14px] rounded-xl py-3 shadow-sm active:scale-98 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            다른 앱 공유
          </button>
        </div>

        {onCopyCert && (
          <button
            onClick={onCopyCert}
            className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-bold text-[15px] rounded-xl py-3 shadow-md hover:shadow-lg active:scale-98 transition-all flex justify-center items-center gap-2 cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[20px] fill-1">
              check_circle
            </span>
            당근마켓 3D 적재 인증 짤 복사
          </button>
        )}

      </div>

      {/* Quick Car Selection Modal for 3D Header */}
      {isCarModalOpen && onSelectCar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCarModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#EDEEF1] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[18px] text-[#191C1E]">내 차종 바로 변경</h3>
                <p className="text-xs text-[#595F67]">선택 즉시 위의 3D 트렁크 화면이 바뀝니다</p>
              </div>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2F3F6] text-[#5A5E67] flex items-center justify-center hover:bg-[#E1E2E5] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search and Category Filters */}
            <div className="p-3 border-b border-[#EDEEF1] flex flex-col gap-2 bg-[#F8F9FC]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#595F67] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="차종명 또는 브랜드 검색 (예: 싼타페, 쏘렌토, 모델Y...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#E1E2E5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#191C1E] focus:border-[#FF7E36] outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {['ALL', 'SUV', 'Sedan', 'Compact', 'EV', 'Van'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#FF7E36] text-white'
                        : 'bg-white text-[#5A5E67] border border-[#EDEEF1]'
                    }`}
                  >
                    {cat === 'ALL' ? '전체' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Car List */}
            <div className="overflow-y-auto p-3 flex flex-col gap-2 flex-1">
              {filteredCars.map((c) => {
                const isSelected = c.id === car.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCar(c);
                      setIsCarModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#FFDBCC]/30 border-[#FF7E36] shadow-xs'
                        : 'bg-white border-[#EDEEF1] hover:border-[#DFC0B3] hover:bg-[#F8F9FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[14px] text-[#191C1E]">{c.model}</span>
                        <span className="text-[10px] bg-[#F2F3F6] text-[#5A5E67] font-semibold px-2 py-0.5 rounded-full">
                          {c.category}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[#FF7E36] text-[20px] fill-1">
                          check_circle
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[11px] bg-[#F8F9FC] p-2 rounded-lg text-center">
                      <div>
                        <span className="text-[#595F67] block text-[10px]">트렁크 너비</span>
                        <strong className="text-[#191C1E]">{c.width}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">기본 깊이</span>
                        <strong className="text-[#191C1E]">{c.depth}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">폴딩 깊이</span>
                        <strong className="text-[#FF7E36]">{c.depthFolded}cm</strong>
                      </div>
                      <div>
                        <span className="text-[#595F67] block text-[10px]">내부 높이</span>
                        <strong className="text-[#191C1E]">{c.height}cm</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
