import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';
import { getValidTextureUrl } from '../../ui/ThreeErrorBoundary';

const damp = THREE.MathUtils.damp;

function NeonPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(getValidTextureUrl(item?.imageUrl));
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a cyberpunk staggered tunnel
  const position = useMemo(() => {
    const x = (index % 2 === 0 ? -1 : 1) * (4 + Math.random() * 2);
    const y = (Math.random() - 0.5) * 4 + 2;
    const z = -index * 8 - 5;
    return new THREE.Vector3(x, y, z);
  }, [index]);

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
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(4));
      
      meshRef.current.position.lerp(activePosition, 5 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 5 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      // Face towards center tunnel
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, index % 2 === 0 ? 0.2 : -0.2, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
    
    // Simple glitch effect on hover
    if (hovered && !isActive) {
      meshRef.current.position.x += (Math.random() - 0.5) * 0.1;
      meshRef.current.position.y += (Math.random() - 0.5) * 0.1;
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 3;
  const width = height * aspect;
  
  const neonColor = index % 3 === 0 ? "#ec4899" : index % 3 === 1 ? "#06b6d4" : "#a855f7";

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setActivePhotoId(isActive ? null : item.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture as any} transparent={false} opacity={1} toneMapped={false} />
        </mesh>

        {/* Neon Frame */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[width + 0.2, height + 0.2, 0.06]} />
          <meshBasicMaterial color={neonColor} transparent={false} opacity={1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.6, 0.1]} fontSize={0.25} color={neonColor} font="https://fonts.gstatic.com/s/rajdhani/v15/LDIxapCSOBg7S-QT7pb0FA.woff" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption.toUpperCase()}
          </Text>
        )}
      </group>
    </Float>
  );
}

function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);
  const scroll = useScroll();
  
  useFrame(() => {
    if (gridRef.current) {
      // Move grid based on scroll to simulate endless forward motion
      gridRef.current.position.z = (scroll.offset * 100) % 2;
    }
  });

  return (
    <group position={[0, -2, 0]}>
      <gridHelper ref={gridRef} args={[100, 50, 0xec4899, 0x06b6d4]} position={[0, 0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}

function CyberCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 8);
    const targetZ = -scroll.offset * totalDistance;
    
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 4) * 1, 4, delta);
    camera.position.y = damp(camera.position.y, 0, 4, delta);
    
    camera.lookAt(0, 0, camera.position.z - 10);
  });
  
  return null;
}

export default function CyberFutureTheme({ data, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <color attach="background" args={['#050505']} />
      
      <GridFloor />
      <CyberCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <NeonPhoto 
            item={photo} 
            index={i} 
            total={photos.length}
            activePhotoId={activePhotoId} 
            setActivePhotoId={setActivePhotoId} 
          />
        </React.Suspense>
      ))}
    </group>
  );
}
