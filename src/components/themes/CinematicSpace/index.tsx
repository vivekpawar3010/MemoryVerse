import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, useTexture, useScroll, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

// Easing function for smooth scroll interpolation
const damp = THREE.MathUtils.damp;

function PhotoNode({ item, index, total, activePhotoId, setActivePhotoId, isLightMode }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(item.imageUrl);
  const scroll = useScroll();
  const { camera } = useThree();
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;

  // Calculate position along a Z-axis path
  // We'll place images along Z from -5 to - (total * 4)
  const zPosition = -5 - (index * 6);
  // Alternate X position left/right
  const xPosition = (index % 2 === 0 ? 1 : -1) * (2 + Math.random() * 2);
  const yPosition = (Math.random() - 0.5) * 3;

  const originalPosition = useMemo(() => new THREE.Vector3(xPosition, yPosition, zPosition), [xPosition, yPosition, zPosition]);
  const activePosition = useMemo(() => new THREE.Vector3(), []);
  
  // Create hover effect states
  const [hovered, setHovered] = React.useState(false);
  
  // Set cursor on hover
  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isActive) {
      // Move photo exactly in front of camera
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3));
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      // Return to original position
      meshRef.current.position.lerp(originalPosition, 2 * delta);
      
      // Look at camera gently or stay flat
      const targetRotation = hovered ? 
        new THREE.Euler().setFromQuaternion(camera.quaternion) : 
        new THREE.Euler(0, 0, 0);
      
      const targetQuat = new THREE.Quaternion().setFromEuler(targetRotation);
      meshRef.current.quaternion.slerp(targetQuat, 4 * delta);
      
      // Scale effect on hover
      const targetScale = hovered ? 1.05 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 4 * delta);
    }
  });

  return (
    <Float speed={hovered ? 0 : 2} rotationIntensity={isActive ? 0 : 0.2} floatIntensity={isActive ? 0 : 0.5}>
      <mesh 
        ref={meshRef} 
        position={originalPosition}
        onClick={(e) => {
          e.stopPropagation();
          setActivePhotoId(isActive ? null : item.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[2, 2 * (((texture as any).image ? (texture as any).image.height / (texture as any).image.width : 1) || 1)]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        
        {/* Glow */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[2.2, 2.2 * (((texture as any).image ? (texture as any).image.height / (texture as any).image.width : 1) || 1)]} />
          <meshBasicMaterial color={isLightMode ? [0.9, 0.8, 0.6] : [0.5, 0.8, 1]} transparent opacity={isActive ? 0.5 : (hovered ? 0.3 : 0)} side={THREE.DoubleSide} />
        </mesh>
      </mesh>
    </Float>
  );
}

function CameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    // If a photo is active, freeze camera scroll
    if (activePhotoId) return;

    // Calculate total Z distance. We placed photos every 6 units.
    // Total distance = totalPhotos * 6.
    const totalDistance = Math.max(10, totalPhotos * 6);
    
    // Calculate target Z based on scroll offset (0 to 1)
    const targetZ = -scroll.offset * totalDistance;
    
    // Smoothly damp camera position towards target
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    camera.position.x = Math.sin(scroll.offset * Math.PI * 2) * 1.5;
    camera.position.y = Math.cos(scroll.offset * Math.PI) * 0.5;
    
    // Look ahead slightly
    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 5);
  });
  
  return null;
}

export default function CinematicSpaceTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];
  
  // Determine if it's light mode based on the user's selected background color
  const bgColor = data.themeSettings?.backgroundColor || '#02040a';
  const colorObj = useMemo(() => new THREE.Color(bgColor), [bgColor]);
  const hsl = { h: 0, s: 0, l: 0 };
  colorObj.getHSL(hsl);
  const isLightMode = hsl.l > 0.5;

  return (
    <group>
      <color attach="background" args={[isLightMode ? '#f5f7fa' : '#02040a']} />
      <ambientLight intensity={isLightMode ? 1.2 : 0.5} />
      
      {!isLowEndDevice && (
        isLightMode ? (
          <Sparkles count={800} scale={150} size={4} speed={0.2} opacity={0.3} color="#d4af37" />
        ) : (
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        )
      )}
      
      <mesh position={[0, 0, - (photos.length * 6) - 20]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial color={isLightMode ? [0.9, 0.95, 1] : [0.05, 0.1, 0.2]} transparent opacity={0.5} />
      </mesh>
      
      <CameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <PhotoNode 
            item={photo} 
            index={i} 
            total={photos.length} 
            activePhotoId={activePhotoId} 
            setActivePhotoId={setActivePhotoId}
            isLightMode={isLightMode}
          />
        </React.Suspense>
      ))}
    </group>
  );
}
