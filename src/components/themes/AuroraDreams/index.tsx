import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function AuroraPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  const position = useMemo(() => {
    const x = (Math.random() - 0.5) * 15;
    const y = Math.random() * 5 + 2;
    // Spread along Z for scrolling through them
    const z = -5 - (index * 8) + (Math.random() - 0.5) * 4;
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
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      const targetRotX = hovered ? 0.1 : 0;
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetRotX, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2.5;
  const width = height * aspect;

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={2}>
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
          <planeGeometry args={[width * 1.5, height * 1.5]} />
          <meshBasicMaterial color="#a7f3d0" transparent opacity={isAnyActive && !isActive ? 0.05 : 0.2} blending={THREE.AdditiveBlending} />
        </mesh>
        
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={texture} roughness={0.2} metalness={0.5} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.5, 0.1]} fontSize={0.25} color="#d9f99d" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </group>
    </Float>
  );
}

// Simple Aurora simulation using stacked planes with sine wave animation
function AuroraBorealis({ totalPhotos }: { totalPhotos: number }) {
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref1.current) {
      ref1.current.position.y = Math.sin(t * 0.5) * 2 + 10;
      ref1.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    }
    if (ref2.current) {
      ref2.current.position.y = Math.cos(t * 0.4) * 2 + 8;
      ref2.current.rotation.z = Math.cos(t * 0.3) * 0.1;
    }
  });

  return (
    <group position={[0, 5, - (totalPhotos * 4)]}>
      <mesh ref={ref1} rotation={[-Math.PI/6, 0, 0]}>
        <planeGeometry args={[100, Math.max(100, totalPhotos * 10), 32, 32]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ref2} rotation={[-Math.PI/4, 0, 0]} position={[0, -2, 5]}>
        <planeGeometry args={[100, Math.max(100, totalPhotos * 10), 32, 32]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ArcticCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 8);
    const targetZ = -scroll.offset * totalDistance;
    
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    
    // Slow drifting left and right while moving forward
    const targetX = Math.sin(scroll.offset * Math.PI * 4) * 5;
    camera.position.x = damp(camera.position.x, targetX, 2, delta);
    camera.position.y = damp(camera.position.y, 2 + Math.cos(scroll.offset * Math.PI * 2) * 2, 2, delta);
    
    camera.lookAt(camera.position.x * 0.5, 5, camera.position.z - 10);
  });
  
  return null;
}

export default function AuroraDreamsTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.1} />
      
      {/* Ice Floor */}
      <mesh position={[0, -2, - (photos.length * 4)]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, Math.max(100, photos.length * 12)]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>

      <AuroraBorealis totalPhotos={photos.length} />
      <ArcticCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <AuroraPhoto 
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
