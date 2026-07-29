import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Clouds, Cloud, Sky, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function CloudPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a cloud tunnel
  // Z axis will be static, scroll will move along Z
  const zPosition = -10 - (index * 8);
  const xPosition = (index % 2 === 0 ? 1 : -1) * (2 + Math.random() * 2);
  const yPosition = (Math.random() - 0.5) * 4;

  const originalPosition = useMemo(() => new THREE.Vector3(xPosition, yPosition, zPosition), [xPosition, yPosition, zPosition]);
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
      meshRef.current.position.lerp(originalPosition, 2 * delta);
      
      const targetRotX = hovered ? 0.1 : 0;
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetRotX, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 3;
  const width = height * aspect;

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={1}>
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
        
        {/* Soft white frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[width + 0.4, height + 0.4, 0.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        </mesh>
      </mesh>
    </Float>
  );
}

function SkyCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // Total Z distance based on photo count (spaced 8 units apart starting at -10)
    const totalDistance = Math.max(10, totalPhotos * 8);
    const targetZ = -scroll.offset * totalDistance;
    
    // Smooth drift through the clouds as we scroll forward
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 2) * 2, 2, delta);
    camera.position.y = damp(camera.position.y, Math.cos(scroll.offset * Math.PI * 4) * 1, 2, delta);
    
    camera.lookAt(0, 0, camera.position.z - 10);
  });
  
  return null;
}

export default function DreamCloudsTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={1.5} color="#fef08a" />
      <directionalLight position={[10, 10, -10]} intensity={2} color="#fde047" />
      
      {!isLowEndDevice && (
        <>
          <Sky distance={450000} sunPosition={[10, 2, -10]} inclination={0} azimuth={0.25} />
          {/* Create a long cloud tunnel */}
          <Clouds material={THREE.MeshBasicMaterial}>
            <Cloud seed={1} bounds={[20, 2, 20]} color="#fdf2f8" volume={15} position={[0, -5, -15]} speed={0.2} opacity={0.5} />
            <Cloud seed={2} bounds={[20, 2, 20]} color="#ffedd5" volume={10} position={[-10, 5, -30]} speed={0.1} opacity={0.6} />
            <Cloud seed={3} bounds={[20, 2, 20]} color="#e0f2fe" volume={15} position={[10, 0, -45]} speed={0.15} opacity={0.4} />
            <Cloud seed={4} bounds={[20, 2, 20]} color="#fdf2f8" volume={15} position={[0, -5, -60]} speed={0.2} opacity={0.5} />
            <Cloud seed={5} bounds={[20, 2, 20]} color="#ffedd5" volume={10} position={[-10, 5, -75]} speed={0.1} opacity={0.6} />
          </Clouds>
        </>
      )}

      <SkyCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <CloudPhoto 
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
