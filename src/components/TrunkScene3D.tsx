/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CarTrunk, FitCalculation, ItemDimensions } from '../types';
import { CAR_DATABASE } from '../data/cars';

// ─── 3D Scale: convert real cm to Three.js units (1 unit = 100 cm) ───
const S = 0.01;

// ─── Scene Recorder for WebM ───
function SceneRecorder({ onRecordComplete, trigger }: { onRecordComplete: (b: Blob) => void; trigger: string }) {
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

      const timer = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 2500);

      return () => {
        clearTimeout(timer);
        if (recorder.state === 'recording') recorder.stop();
      };
    } catch (err) {
      console.warn('MediaRecorder is not supported or failed to start', err);
    }
  }, [gl, onRecordComplete, trigger]);

  return null;
}

// ─── Trunk wireframe box with Wheelhouse Obstacles & Tailgate Aperture Frame ───
function TrunkBox({
  car,
  isFolded,
  fitResult,
}: {
  car: CarTrunk;
  isFolded: boolean;
  fitResult?: FitCalculation;
}) {
  const activeDepth = isFolded ? car.depthFolded : car.depth;
  const w = car.width * S;
  const d = activeDepth * S;
  const h = car.height * S;

  const normalDepth = car.depth * S;
  const isApertureBreached = fitResult?.spatialRL?.apertureBreach || false;

  // Wheelhouse obstacle dimensions
  const whW = Math.min(15, car.width * 0.12) * S;
  const whH = Math.min(26, car.height * 0.35) * S;
  const whD = Math.min(50, activeDepth * 0.35) * S;
  const whZ = isFolded ? -activeDepth * 0.15 * S : 0;

  const opW = car.openingWidth * S;
  const opH = car.openingHeight * S;

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

      {/* Left Wheelhouse Visualizer */}
      <group position={[-w / 2 + whW / 2, -h / 2 + whH / 2, whZ]}>
        <mesh>
          <boxGeometry args={[whW, whH, whD]} />
          <meshStandardMaterial color="#64748B" transparent opacity={0.22} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(whW, whH, whD)]} />
          <lineBasicMaterial color="#94A3B8" transparent opacity={0.6} />
        </lineSegments>
      </group>

      {/* Right Wheelhouse Visualizer */}
      <group position={[w / 2 - whW / 2, -h / 2 + whH / 2, whZ]}>
        <mesh>
          <boxGeometry args={[whW, whH, whD]} />
          <meshStandardMaterial color="#64748B" transparent opacity={0.22} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(whW, whH, whD)]} />
          <lineBasicMaterial color="#94A3B8" transparent opacity={0.6} />
        </lineSegments>
      </group>

      {/* Trunk floor */}
      <mesh position={[0, -h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#E1E2E5" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Tailgate Opening Aperture Frame */}
      <group position={[0, 0, d / 2 + 0.002]}>
        <mesh>
          <planeGeometry args={[opW, opH]} />
          <meshStandardMaterial
            color={isApertureBreached ? '#FF2222' : '#FF7E36'}
            transparent
            opacity={isApertureBreached ? 0.22 : 0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(opW, opH, 0.01)]} />
          <lineBasicMaterial
            color={isApertureBreached ? '#FF2222' : '#FF7E36'}
            linewidth={2}
            transparent
            opacity={isApertureBreached ? 0.95 : 0.5}
          />
        </lineSegments>

        {isApertureBreached && (
          <Text
            position={[0, opH / 2 + 0.05, 0.02]}
            fontSize={0.038}
            color="#FF2222"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.003}
            outlineColor="#FFFFFF"
          >
            🚨 개구부 통과 불가 (트렁크 입구 좁음)
          </Text>
        )}
      </group>
    </group>
  );
}

// ─── 3D Trajectory Spline Path ───
function TrajectorySpline({
  fitResult,
}: {
  fitResult: FitCalculation;
}) {
  const points = useMemo(() => {
    if (!fitResult.spatialRL?.trajectorySteps || fitResult.status === 'over') return null;
    const steps = fitResult.spatialRL.trajectorySteps;
    const pts = steps.map((s) => new THREE.Vector3(s.position[0], s.position[1], s.position[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    return curve.getPoints(30);
  }, [fitResult]);

  if (!points) return null;

  return (
    <Line
      points={points}
      color="#FF7E36"
      lineWidth={2}
      dashed
      dashScale={50}
      dashSize={0.03}
      gapSize={0.02}
      transparent
      opacity={0.7}
    />
  );
}

// ─── Center of Gravity (CoG) Indicator ───
function CenterOfGravityMarker({
  itemPos,
  itemH,
}: {
  itemPos: [number, number, number];
  itemH: number;
}) {
  const markerRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (markerRef.current) {
      markerRef.current.rotation.y = clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <group ref={markerRef} position={[itemPos[0], itemPos[1], itemPos[2]]}>
      {/* CoG Glowing Sphere */}
      <mesh>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#00D4AA" emissive="#00D4AA" emissiveIntensity={0.6} />
      </mesh>
      {/* Projected Ground Target Shadow */}
      <mesh position={[0, -itemPos[1] + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.045, 24]} />
        <meshBasicMaterial color="#00D4AA" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Animated cargo item with Spatial RL Trajectory Support ───
function CargoItem({
  item,
  fitResult,
  car,
  isFolded,
  activeTrajectoryStep,
  isPlayingTrajectory,
}: {
  item: ItemDimensions;
  fitResult: FitCalculation;
  car: CarTrunk;
  isFolded: boolean;
  activeTrajectoryStep: number;
  isPlayingTrajectory: boolean;
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

  const { bestOrientation, status, spatialRL } = fitResult;
  const bw = bestOrientation.w * S;
  const bd = bestOrientation.d * S;
  const bh = bestOrientation.h * S;

  const isOver = status === 'over';

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

  // Reset animation progress on changes
  useEffect(() => {
    setAnimProgress(0);
  }, [item.width, item.depth, item.height, car.id, isFolded, activeTrajectoryStep]);

  // Trajectory interpolation
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 1. Spatial RL Trajectory Step Mode
    if (spatialRL && spatialRL.trajectorySteps.length > 0 && !isOver) {
      const targetStepObj =
        spatialRL.trajectorySteps.find((s) => s.step === activeTrajectoryStep) ||
        spatialRL.trajectorySteps[2];

      const targetX = targetStepObj.position[0];
      const targetY = targetStepObj.position[1];
      const targetZ = targetStepObj.position[2];

      const targetRotX = targetStepObj.rotation[0];
      const targetRotY = targetStepObj.rotation[1];
      const targetRotZ = targetStepObj.rotation[2];

      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 8);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 8);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 8);

      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, delta * 8);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, delta * 8);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, delta * 8);
      return;
    }

    // 2. Default Fallback Animation (For Over or Standard)
    if (animProgress < 1) {
      const speed = isOver ? 1.8 : 1.2;
      setAnimProgress((p) => Math.min(1, p + delta * speed));
    }

    const t = animProgress;
    const ease = 1 - Math.pow(1 - t, 3);
    const finalY = bh / 2;

    if (isOver) {
      if (t < 0.5) {
        const slideIn = t * 2;
        const easeIn = 1 - Math.pow(1 - slideIn, 2);
        meshRef.current.position.z = THREE.MathUtils.lerp(0.8, 0.1, easeIn);
        meshRef.current.position.y = finalY;
      } else {
        const bounceT = (t - 0.5) * 2;
        const bounce = Math.sin(bounceT * Math.PI) * 0.15;
        meshRef.current.position.z = 0.1 + bounce;
        meshRef.current.position.y = finalY;
        meshRef.current.rotation.z = Math.sin(bounceT * Math.PI * 4) * 0.03 * (1 - bounceT);
      }
    } else {
      meshRef.current.position.z = THREE.MathUtils.lerp(0.5, 0, ease);
      const dropOffset = (1 - ease) * 1.5;
      meshRef.current.position.y = finalY + dropOffset;
      meshRef.current.rotation.z = 0;
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={[0, bh / 2, 2]}>
        {texture ? (
          <>
            <planeGeometry args={[bw, bh]} />
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
          </>
        ) : (
          <>
            <RoundedBox args={[bw, bh, bd]} radius={0.01} smoothness={4}>
              <meshStandardMaterial
                color={itemColor}
                transparent
                opacity={0.88}
                roughness={0.25}
                metalness={0.15}
              />
            </RoundedBox>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(bw, bh, bd)]} />
              <lineBasicMaterial color={itemColor} linewidth={1} transparent opacity={0.6} />
            </lineSegments>
          </>
        )}
      </mesh>

      {/* Center of Gravity Marker when resting */}
      {!isOver && meshRef.current && (
        <CenterOfGravityMarker
          itemPos={[meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z]}
          itemH={bh}
        />
      )}
    </>
  );
}

// ─── Margin visualization bars ───
function MarginIndicators({
  fitResult,
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
          <meshStandardMaterial color={getColor(margins.width)} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Height margin (top) */}
      {margins.height >= 0 && (
        <mesh position={[0, bh + (margins.height * S) / 2, 0]}>
          <boxGeometry args={[bw * 0.1, margins.height * S, bd * 0.1]} />
          <meshStandardMaterial color={getColor(margins.height)} transparent opacity={0.5} />
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
  activeTrajectoryStep,
  isPlayingTrajectory,
}: {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  fitResult: FitCalculation;
  activeTrajectoryStep: number;
  isPlayingTrajectory: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={0.85} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.35} />

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

      <TrunkBox car={car} isFolded={isFolded} fitResult={fitResult} />
      <TrajectorySpline fitResult={fitResult} />
      <CargoItem
        item={item}
        fitResult={fitResult}
        car={car}
        isFolded={isFolded}
        activeTrajectoryStep={activeTrajectoryStep}
        isPlayingTrajectory={isPlayingTrajectory}
      />
      <MarginIndicators fitResult={fitResult} car={car} isFolded={isFolded} />
      <DimensionLabels car={car} isFolded={isFolded} item={item} fitResult={fitResult} />
    </>
  );
}

// ─── Exported component ───
interface TrunkScene3DProps {
  item: ItemDimensions;
  car: CarTrunk;
  isFolded: boolean;
  allowDiagonal: boolean;
  fitResult: FitCalculation;
  activeTrajectoryStep?: number;
  onSelectTrajectoryStep?: (step: number) => void;
  isPlayingTrajectory?: boolean;
  onTogglePlayTrajectory?: () => void;
  onSelectCar?: (car: CarTrunk) => void;
  onCopyCert?: () => void;
  onOpenAltModal?: () => void;
}

export const TrunkScene3D: React.FC<TrunkScene3DProps> = ({
  item,
  car,
  isFolded,
  fitResult,
  activeTrajectoryStep = 3,
  onSelectTrajectoryStep,
  isPlayingTrajectory = false,
  onTogglePlayTrajectory,
  onSelectCar,
  onCopyCert,
  onOpenAltModal,
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
          title: `개꿀 - ${car.model}에 이 물건 들어갈까?`,
          description:
            fitResult.status === 'fits'
              ? '네! 내 차 트렁크에 쏙 들어갑니다. 3D로 확인해보세요.'
              : '3D 시뮬레이션으로 적재 가능 여부를 확인해보세요!',
          imageUrl: 'https://www.doghoney.xyz/og-image.jpg',
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
          title: `개꿀 - ${car.model} 적재 결과`,
          text:
            fitResult.status === 'fits'
              ? '내 차 트렁크에 쏙 들어갑니다! 3D로 확인해보세요.'
              : '3D 시뮬레이션으로 확인해보세요!',
          url: `https://www.doghoney.xyz/?carId=${car.id}`,
        });
      } catch (err) {
        console.log('공유가 취소되었거나 실패했습니다.', err);
      }
    } else {
      alert('현재 기기/브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  };

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
              {tips.length > 0 && (
                <span className="text-[#166534] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>
              )}
            </div>
          </div>
        );
      case 'tight':
        return (
          <div className="bg-[#FEF3C7] border-b border-[#FCD34D] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B45309] text-[24px]">warning</span>
            <div className="flex flex-col">
              <span className="text-[#B45309] font-extrabold text-[15px]">적재 가능 (공간 타이트함)</span>
              {tips.length > 0 && (
                <span className="text-[#92400E] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>
              )}
            </div>
          </div>
        );
      case 'needs_fold':
        return (
          <div className="bg-[#FFEDD5] border-b border-[#FDBA74] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#C2410C] text-[24px]">
              airline_seat_recline_normal
            </span>
            <div className="flex flex-col">
              <span className="text-[#C2410C] font-extrabold text-[15px]">2열 시트를 접어야 들어갑니다!</span>
              {tips.length > 0 && (
                <span className="text-[#9A3412] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>
              )}
            </div>
          </div>
        );
      case 'over':
        return (
          <div className="bg-[#FEE2E2] border-b border-[#FCA5A5] px-4 py-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B91C1C] text-[24px]">error</span>
            <div className="flex flex-col">
              <span className="text-[#B91C1C] font-extrabold text-[15px]">적재 불가: 크기가 초과됩니다</span>
              {tips.length > 0 && (
                <span className="text-[#991B1B] text-xs font-medium mt-0.5 leading-snug">{tips[0]}</span>
              )}
            </div>
          </div>
        );
    }
  };

  const cleanItemName = item.name
    ? item.name
        .replace(/\s*\(AI 표준 규격 추정\)/g, '')
        .replace(/\s*\(수동 입력 필요\)/g, '')
        .replace(/\s*\(.*?규격.*?\)/g, '')
        .trim()
    : '물품';

  const getItemIcon = (name: string) => {
    if (/tv|모니터|가전|전자|오븐|냉장고|세탁기|청소기|식세기|건조기/i.test(name)) return 'tv';
    if (/유모차|카시트|아기침대|장난감|붕붕카|미끄럼틀/i.test(name)) return 'child_friendly';
    if (/캠핑|텐트|쉘프|테이블|자전거|골프|운동|헬스|매트/i.test(name)) return 'sports_score';
    return 'inventory_2';
  };

  const dynamicIcon = getItemIcon(cleanItemName);

  return (
    <section className="bg-white rounded-2xl ambient-shadow overflow-hidden flex flex-col border border-[#EDEEF1]">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center bg-white border-b border-[#EDEEF1]">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[16px] text-[#191C1E]">3D 적재 시뮬레이션</h3>
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

      {/* Alert Banner */}
      {renderAlertBanner()}

      {/* 3D Canvas (WebGL) */}
      <div className="h-72 bg-[#F8F9FC] relative select-none">
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
            activeTrajectoryStep={activeTrajectoryStep}
            isPlayingTrajectory={isPlayingTrajectory}
          />
          <SceneRecorder onRecordComplete={setVideoBlob} trigger={triggerKey} />
        </Canvas>

        {/* 3D Overlay Controls: Step Fast Switcher */}
        {fitResult.spatialRL && fitResult.status !== 'over' && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 flex items-center gap-2 text-[11px] font-bold">
            <span className="text-[#64748B] text-[10px] uppercase">3D 궤적</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((st) => (
                <button
                  key={st}
                  onClick={() => onSelectTrajectoryStep && onSelectTrajectoryStep(st)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTrajectoryStep === st
                      ? 'bg-[#FF7E36] text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            {onTogglePlayTrajectory && (
              <button
                onClick={onTogglePlayTrajectory}
                className="w-6 h-6 rounded-full bg-[#191C1E] text-white flex items-center justify-center hover:bg-black cursor-pointer active:scale-95"
                title={isPlayingTrajectory ? '일시정지' : '재생'}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {isPlayingTrajectory ? 'pause' : 'play_arrow'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orientation & Dimension Info */}
      <div className="bg-white px-4 py-2 flex items-center justify-between text-[11px] text-[#5A5E67] border-t border-[#EDEEF1]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-[#FF7E36]">
            rotate_90_degrees_ccw
          </span>
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

      {/* Dynamic Psychology Behavioral Nudge (적재 불가 / 공간 타이트 시 즉시 발동) */}
      {(status === 'over' || status === 'tight') && onOpenAltModal && (
        <div className="p-3 bg-[#F8F9FC] border-t border-[#EDEEF1]">
          <div
            onClick={onOpenAltModal}
            className={`p-3.5 rounded-2xl transition-all border shadow-xs flex flex-col gap-2.5 cursor-pointer hover:shadow-md active:scale-[0.99] group ${
              status === 'over'
                ? 'bg-gradient-to-br from-red-50/90 via-white to-orange-50/70 border-red-200 hover:border-red-300'
                : 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  status === 'over' ? 'bg-[#E02020] text-white' : 'bg-[#D97706] text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {dynamicIcon}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      status === 'over'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    1:1 신품 비교
                  </span>
                  <span className="text-[10px] font-bold text-[#FF7E36]">무료배송 매칭</span>
                </div>
                <h4 className="font-extrabold text-[13.5px] text-[#191C1E] mt-1 leading-snug">
                  '{cleanItemName}' 신품 가격 비교
                </h4>
                <p className="text-[11px] text-[#595F67] mt-0.5 leading-tight">
                  해당 물품의 신품 최저가 및 1:1 대안 상품을 비교합니다.
                </p>
              </div>
            </div>

            <div
              className={`w-full py-2.5 px-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                status === 'over'
                  ? 'bg-[#E02020] group-hover:bg-[#C81818]'
                  : 'bg-[#D97706] group-hover:bg-[#B45309]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              <span>'{cleanItemName}' 신품 가격 비교하기 →</span>
            </div>
          </div>
        </div>
      )}

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
            <span className="material-symbols-outlined text-[20px] fill-1">check_circle</span>
            당근마켓 3D 적재 인증 짤 복사
          </button>
        )}
      </div>

      {/* Quick Car Selection Modal */}
      {isCarModalOpen && onSelectCar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCarModalOpen(false);
          }}
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
