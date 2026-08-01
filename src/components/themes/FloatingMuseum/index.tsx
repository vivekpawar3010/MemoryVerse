import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Environment, ContactShadows, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

// Easing function
const damp = THREE.MathUtils.damp;

function MuseumPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Arrange in a gallery along the Z axis (scroll direction)
  const zPosition = -5 - (index * 5);
  // Alternate left/right walls
  const isLeft = index % 2 === 0;
  const xPosition = isLeft ? -4 : 4;
  const yPosition = 1.5;

  const originalPosition = useMemo(() => new THREE.Vector3(xPosition, yPosition, zPosition), [xPosition, yPosition, zPosition]);
  const activePosition = useMemo(() => new THREE.Vector3(), []);
  
  const swingTime = useRef(Math.random() * 100);
  
  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    
    swingTime.current += delta;

    if (isActive) {
      // Bring photo to camera
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3.5));
      
      groupRef.current.position.lerp(activePosition, 4 * delta);
      groupRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
      
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 4 * delta);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 4 * delta);
    } else {
      // Return to wall
      groupRef.current.position.lerp(originalPosition, 3 * delta);
      
      // Face towards the center aisle (slightly angled)
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, isLeft ? Math.PI / 6 : -Math.PI / 6, 0));
      groupRef.current.quaternion.slerp(targetRot, 3 * delta);

      // Gentle swing effect on the mesh itself
      const swingZ = Math.sin(swingTime.current * 0.5) * 0.02;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, swingZ, 4 * delta);
      
      // Hover tilt
      const hoverY = hovered ? (isLeft ? 0.1 : -0.1) : 0;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, hoverY, 5 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2;
  const width = height * aspect;

  return (
    <group ref={groupRef} position={originalPosition}>
      {/* Invisible string from ceiling */}
      {!isActive && (
        <mesh position={[0, height/2 + 2, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 4]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={0.3} />
        </mesh>
      )}

      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setActivePhotoId(isActive ? null : item.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture as any} roughness={0.2} metalness={0.1} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        
        {/* Frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[width + 0.2, height + 0.2, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
      </mesh>
    </group>
  );
}

function MuseumCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 5);
    const targetZ = -scroll.offset * totalDistance + 2; // +2 for initial offset
    
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    // Slight sway left to right while moving down the aisle
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 4) * 0.5, 2, delta);
    camera.position.y = damp(camera.position.y, 1.5, 2, delta);
    
    camera.lookAt(camera.position.x, 1.5, camera.position.z - 5);
  });
  
  return null;
}

export default function FloatingMuseumTheme({ data, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <color attach="background" args={['#f8f9fa']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <Environment preset="city" />
      
      {/* Soft shadow plane at the bottom */}
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={50} blur={2} far={4.5} />

      <MuseumCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
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
