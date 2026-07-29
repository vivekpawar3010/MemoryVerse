import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float, Sparkles, ContactShadows, Sky, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function GardenPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a gentle curving path along Z
  const zPosition = -5 - (index * 6);
  const xPosition = Math.sin(index * 0.5) * 4;
  const yPosition = 1.5 + Math.cos(index * 0.3) * 0.5;
  
  const position = useMemo(() => new THREE.Vector3(xPosition, yPosition, zPosition), [xPosition, yPosition, zPosition]);
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
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3.5));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      // Face towards camera path
      const targetRotX = hovered ? 0.1 : 0;
      const targetRotY = index % 2 === 0 ? 0.2 : -0.2;
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetRotX, targetRotY, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2;
  const width = height * aspect;

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
      <group 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setActivePhotoId(isActive ? null : item.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={texture} roughness={0.7} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {/* Soft paper-like frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[width + 0.3, height + 0.3, 0.05]} />
          <meshStandardMaterial color="#fdfbf7" roughness={1} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.5, 0.1]} fontSize={0.2} color="#4a044e" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </group>
    </Float>
  );
}

function GardenCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 6);
    const targetZ = -scroll.offset * totalDistance;
    
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    
    // Follow the sinusoidal path of the photos
    // Approximate index based on Z
    const approxIndex = Math.abs(camera.position.z) / 6;
    const targetX = Math.sin(approxIndex * 0.5) * 2; // Follow path gently
    
    camera.position.x = damp(camera.position.x, targetX, 2, delta);
    camera.position.y = damp(camera.position.y, 1.5, 2, delta);
    
    camera.lookAt(camera.position.x * 0.5, 1.5, camera.position.z - 10);
  });
  
  return null;
}

export default function CherryBlossomTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.8} color="#fce7f3" />
      <directionalLight position={[10, 10, -5]} intensity={1.5} color="#ffd1dc" castShadow />
      
      {/* Soft ground */}
      <mesh position={[0, 0, - (photos.length * 3)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, Math.max(100, photos.length * 12)]} />
        <meshStandardMaterial color="#ecfccb" roughness={1} />
      </mesh>
      
      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={50} blur={2} far={4} color="#831843" />

      {!isLowEndDevice && (
        <>
          <Sky distance={450000} sunPosition={[10, 5, -10]} inclination={0.49} azimuth={0.25} />
          {/* Falling Petals */}
          <Sparkles count={500} scale={40} size={4} speed={0.2} color="#fbcfe8" position={[0, 10, - (photos.length * 3)]} opacity={0.8} />
          <Sparkles count={500} scale={40} size={3} speed={0.3} color="#f9a8d4" position={[0, 5, - (photos.length * 3)]} opacity={0.6} />
        </>
      )}

      <GardenCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <GardenPhoto 
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
