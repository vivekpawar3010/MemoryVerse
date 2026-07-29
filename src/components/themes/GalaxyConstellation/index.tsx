import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Line, Stars, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function StarNode({ item, index, total, activePhotoId, setActivePhotoId, position }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const [hovered, setHovered] = React.useState(false);
  const { camera } = useThree();
  
  const activePosition = useMemo(() => new THREE.Vector3(), []);
  
  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (isActive) {
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      // Face camera slightly
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
      
      // Scale down when not active, enlarge on hover
      const targetScale = hovered ? 0.8 : 0.4;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 5 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2;
  const width = height * aspect;

  return (
    <group 
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        setActivePhotoId(isActive ? null : item.id);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Glow */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[Math.max(width, height) * 0.6, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={isActive ? 0.2 : (hovered ? 0.8 : 0.6)} />
      </mesh>
      
      {/* Photo */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent opacity={isActive || hovered ? 1 : (isAnyActive ? 0.1 : 0.8)} />
      </mesh>
      
      {isActive && item.caption && (
        <Text position={[0, -height/2 - 0.4, 0.1]} fontSize={0.2} color="#93c5fd" anchorX="center" anchorY="middle" maxWidth={width}>
          {item.caption}
        </Text>
      )}
    </group>
  );
}

function ConstellationLines({ positions }: { positions: THREE.Vector3[] }) {
  if (positions.length < 2) return null;
  const points = positions.map(p => [p.x, p.y, p.z] as [number, number, number]);
  
  return (
    <Line
      points={points}
      color="#3b82f6"
      lineWidth={1.5}
      transparent
      opacity={0.3}
    />
  );
}

function SpaceCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // We generated points along X, we will scroll along X
    const totalXDistance = Math.max(10, totalPhotos * 4);
    const startX = -totalXDistance / 2;
    const targetX = startX + (scroll.offset * totalXDistance);
    
    camera.position.x = damp(camera.position.x, targetX, 4, delta);
    camera.position.y = damp(camera.position.y, Math.sin(scroll.offset * Math.PI * 4) * 2, 2, delta);
    camera.position.z = damp(camera.position.z, 8, 4, delta); // Stay back to see constellation
    
    camera.lookAt(camera.position.x, 0, 0);
  });
  
  return null;
}

export default function GalaxyConstellationTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  // Generate constellation positions along X
  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const totalXDist = Math.max(10, photos.length * 4);
    const startX = -totalXDist / 2;
    
    for (let i = 0; i < photos.length; i++) {
      const x = startX + (i * 4) + (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 2;
      pts.push(new THREE.Vector3(x, y, z));
    }
    
    return pts;
  }, [photos]);

  return (
    <group>
      {!isLowEndDevice && (
        <Stars radius={50} depth={50} count={3000} factor={3} saturation={0.5} fade speed={1} />
      )}

      <ConstellationLines positions={positions} />
      <SpaceCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <StarNode 
            item={photo} 
            index={i} 
            total={photos.length}
            position={positions[i]}
            activePhotoId={activePhotoId} 
            setActivePhotoId={setActivePhotoId} 
          />
        </React.Suspense>
      ))}
    </group>
  );
}
