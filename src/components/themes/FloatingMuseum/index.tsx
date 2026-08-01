import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Environment, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

// Easing helper
const damp = THREE.MathUtils.damp;

function MuseumParticles({ count = 50 }: { count?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = Math.random() * 8;
      p[i * 3 + 2] = -Math.random() * 50;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#cbd5e1"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

import { getValidTextureUrl } from '../../ui/ThreeErrorBoundary';

function MuseumPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(getValidTextureUrl(item?.imageUrl));
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Arrange in gallery along Z axis (scroll direction)
  const zPosition = -5 - (index * 5.5);
  // Alternate left/right walls with clean aisle spacing
  const isLeft = index % 2 === 0;
  const xPosition = isLeft ? -3.8 : 3.8;
  const yPosition = 1.6;

  const originalPosition = useMemo(() => new THREE.Vector3(xPosition, yPosition, zPosition), [xPosition, yPosition, zPosition]);
  const activePosition = useMemo(() => new THREE.Vector3(), []);
  
  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    if (isActive) {
      // Smoothly bring photo to camera eye level
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3.2));
      
      groupRef.current.position.lerp(activePosition, 6 * delta);
      groupRef.current.quaternion.slerp(camera.quaternion, 6 * delta);
      
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 6 * delta);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 6 * delta);
      meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 6 * delta);
    } else {
      // Return to gallery position smoothly
      const targetPos = originalPosition.clone();
      if (hovered) {
        // Subtle forward float on hover towards viewer
        targetPos.x += isLeft ? 0.35 : -0.35;
      }
      groupRef.current.position.lerp(targetPos, 5 * delta);
      
      // Face towards center aisle with clean, steady gallery angle
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, isLeft ? Math.PI / 8 : -Math.PI / 8, 0));
      groupRef.current.quaternion.slerp(targetRot, 5 * delta);

      // Keep photo completely stable without continuous wobble/flicker
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 5 * delta);
      
      const hoverY = hovered ? (isLeft ? 0.1 : -0.1) : 0;
      const targetScale = hovered ? 1.05 : 1.0;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, hoverY, 6 * delta);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 6 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2.2;
  const width = height * aspect;
  const captionText = item.caption || item.title || `Memory #${index + 1}`;

  return (
    <group ref={groupRef} position={originalPosition}>
      {/* Elegant ceiling suspension wires */}
      {!isActive && (
        <mesh position={[0, height / 2 + 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 4]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.3} />
        </mesh>
      )}

      <group ref={meshRef as any}>
        {/* Photo Surface: meshBasicMaterial guarantees 100% stable, non-flickering, crystal-clear image viewing */}
        <mesh 
          position={[0, 0, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoId(isActive ? null : item.id);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial 
            map={texture as any} 
            transparent={false}
            opacity={1}
            toneMapped={false}
          />
        </mesh>
        
        {/* Gallery Matte & Wooden Frame (placed strictly behind photo mesh at z=-0.03 to eliminate Z-fighting completely) */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[width + 0.3, height + 0.3, 0.06]} />
          <meshStandardMaterial 
            color={hovered ? "#38bdf8" : "#ffffff"} 
            roughness={0.8} 
            metalness={0}
            transparent={false}
            opacity={1} 
          />
        </mesh>

        {/* 3D Museum Plaque / Caption */}
        <group position={[0, -height / 2 - 0.25, 0.03]}>
          <Text
            fontSize={0.16}
            color={hovered ? "#0284c7" : "#334155"}
            font="https://fonts.gstatic.com/s/cinzel/v19/8vIJ7w0mKzpCupSDA683.woff"
            anchorX="center"
            anchorY="top"
            maxWidth={width + 0.2}
          >
            {captionText}
          </Text>
        </group>
      </group>
    </group>
  );
}

function MuseumCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(12, totalPhotos * 5.5);
    const targetZ = -scroll.offset * totalDistance + 2.5;
    
    // Smooth camera pan along aisle
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    // Gentle steady camera sway
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 3) * 0.3, 2.5, delta);
    camera.position.y = damp(camera.position.y, 1.6, 2.5, delta);
    
    camera.lookAt(camera.position.x, 1.6, camera.position.z - 6);
  });
  
  return null;
}

export default function FloatingMuseumTheme({ data, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      {/* Warm ambient gallery backdrop */}
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 12, 6]} intensity={1.0} castShadow={false} />
      <Environment preset="studio" />
      
      {/* Floating gallery dust particles */}
      <MuseumParticles count={50} />

      {/* Soft shadow floor plane */}
      <ContactShadows position={[0, -0.2, 0]} opacity={0.3} scale={60} blur={2.5} far={6} />

      <MuseumCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id || i} fallback={null}>
          <MuseumPhoto 
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


