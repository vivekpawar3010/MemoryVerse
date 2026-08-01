import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Environment, Float, Sky, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';
import { getValidTextureUrl } from '../../ui/ThreeErrorBoundary';

const damp = THREE.MathUtils.damp;

function OceanPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(getValidTextureUrl(item?.imageUrl));
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a wide line floating on the water, stretching along Z
  const zPosition = -10 - (index * 6);
  // Alternate left and right slightly
  const xPosition = (index % 2 === 0 ? 1 : -1) * (2 + Math.random() * 2);

  const originalPosition = useMemo(() => new THREE.Vector3(xPosition, 0.5, zPosition), [xPosition, zPosition]);
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
      activePosition.y = Math.max(activePosition.y, 1); // Keep above water
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(originalPosition, 2 * delta);
      
      // Face roughly forward but slightly tilted up
      const hoverTilt = hovered ? 0.1 : -0.1;
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(hoverTilt, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2.5;
  const width = height * aspect;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-0.2, 0.2]}>
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
        
        {/* Wooden Frame */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[width + 0.4, height + 0.4, 0.06]} />
          <meshStandardMaterial color="#5c4033" roughness={0.8} transparent={false} opacity={1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.5, 0.1]} fontSize={0.2} color="white" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </group>
    </Float>
  );
}

function SailingCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 6);
    const targetZ = -scroll.offset * totalDistance;
    
    // Simulate boat sailing forward and bobbing
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 4) * 2, 2, delta);
    
    // Bobbing is time-based, not scroll based to keep it alive even when stopped
    const time = state.clock.getElapsedTime();
    const targetY = 2 + Math.sin(time * 2) * 0.1;
    camera.position.y = damp(camera.position.y, targetY, 4, delta);
    
    camera.lookAt(camera.position.x * 0.5, 1, camera.position.z - 10);
  });
  
  return null;
}

export default function OceanMemoriesTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];
  
  // A simple animated water plane
  const Water = () => {
    const waterRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
      if (waterRef.current) {
        waterRef.current.position.y = Math.sin(clock.getElapsedTime()) * 0.05;
      }
    });

    return (
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, - (photos.length * 3)]}>
        <planeGeometry args={[200, 200, 64, 64]} />
        <meshStandardMaterial 
          color="#0284c7" 
          roughness={0.1} 
          metalness={0.8} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
    );
  };

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, -10]} intensity={2} color="#fef08a" />
      
      {!isLowEndDevice && (
        <>
          <Sky sunPosition={[10, 2, -10]} turbidity={1} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
          <Environment preset="sunset" />
        </>
      )}

      <Water />
      <SailingCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <OceanPhoto 
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
