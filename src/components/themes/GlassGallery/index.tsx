import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Environment, MeshTransmissionMaterial, Float, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

// Easing function
const damp = THREE.MathUtils.damp;

function GlassPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glassRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Arrange in a wide horizontal gallery
  // Z axis will be static, we will scroll along the X axis
  const position = useMemo(() => {
    return new THREE.Vector3(index * 6 - (total * 3), 0, -5);
  }, [index, total]);

  const activePosition = useMemo(() => new THREE.Vector3(), []);
  
  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!meshRef.current || !glassRef.current) return;
    
    if (isActive) {
      // Bring to front
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(4));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
      glassRef.current.rotation.x = THREE.MathUtils.lerp(glassRef.current.rotation.x, 0, 5 * delta);
      glassRef.current.rotation.y = THREE.MathUtils.lerp(glassRef.current.rotation.y, 0, 5 * delta);
    } else {
      // Return to gallery position
      meshRef.current.position.lerp(position, 3 * delta);
      
      // Face forward
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 3 * delta);

      // Glass bend hover effect
      const hoverX = hovered ? -0.1 : 0;
      const hoverY = hovered ? 0.1 : 0;
      glassRef.current.rotation.x = THREE.MathUtils.lerp(glassRef.current.rotation.x, hoverX, 5 * delta);
      glassRef.current.rotation.y = THREE.MathUtils.lerp(glassRef.current.rotation.y, hoverY, 5 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2.5;
  const width = height * aspect;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
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
        <meshBasicMaterial map={texture} transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        
        {/* Glass Frame Over Photo */}
        <mesh ref={glassRef} position={[0, 0, 0.2]}>
          <boxGeometry args={[width + 0.5, height + 0.5, 0.1]} />
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.05}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.5}
            temporalDistortion={0.1}
            ior={1.5}
            color="#e0f2fe"
            transparent
            opacity={isAnyActive && !isActive ? 0.1 : 1}
          />
        </mesh>
      </mesh>
    </Float>
  );
}

function GlassGalleryCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // We arranged photos along X from -total*3 to +total*3
    // Calculate total X distance
    const totalDistance = Math.max(10, totalPhotos * 6);
    
    // Scroll offset 0 to 1 maps to X from start to end
    const startX = -(totalPhotos * 3);
    const targetX = startX + (scroll.offset * totalDistance);
    
    // Slow drift through the gallery horizontally
    camera.position.x = damp(camera.position.x, targetX, 4, delta);
    camera.position.z = damp(camera.position.z, 5 + Math.sin(scroll.offset * Math.PI * 4) * 0.5, 2, delta);
    camera.position.y = damp(camera.position.y, 0, 4, delta);
    
    camera.lookAt(camera.position.x, 0, -5);
  });
  
  return null;
}

export default function GlassGalleryTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[0, 10, 5]} angle={0.5} penumbra={1} intensity={2} color="#bae6fd" />
      
      {/* Soft floor reflection context */}
      <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={50} blur={2} far={4} color="#38bdf8" />
      
      {!isLowEndDevice && (
        <Environment preset="studio" />
      )}

      <GlassGalleryCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <GlassPhoto 
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
