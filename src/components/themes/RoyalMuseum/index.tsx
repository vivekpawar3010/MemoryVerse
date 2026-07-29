import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, Float, Environment, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function RoyalPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a wide grand hall along Z axis
  const position = useMemo(() => {
    // Alternate left and right walls of the hall
    const isLeft = index % 2 === 0;
    const x = isLeft ? -5 : 5;
    const y = 3;
    const z = -5 - (index * 4);
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
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(5));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      // Face towards center aisle
      const isLeft = index % 2 === 0;
      const targetRotY = isLeft ? Math.PI / 4 : -Math.PI / 4;
      
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotY, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
      
      // Hover push forward
      if (hovered) {
        meshRef.current.position.x += isLeft ? 0.2 : -0.2;
      }
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 3;
  const width = height * aspect;

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
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
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.1} transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        </mesh>
        
        {/* Golden Ornate Frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[width + 0.6, height + 0.6, 0.1]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        </mesh>
        {/* Inner white matte */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[width + 0.2, height + 0.2, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={isAnyActive && !isActive ? 0.1 : 1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.8, 0.1]} fontSize={0.25} color="#d4af37" font="https://fonts.gstatic.com/s/cinzel/v19/8vI-7w4bxfezrqepypM.woff" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </group>
    </Float>
  );
}

function HallCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 4);
    const targetZ = -scroll.offset * totalDistance;
    
    // Stately, slow pan forward
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    camera.position.x = damp(camera.position.x, Math.sin(scroll.offset * Math.PI * 8) * 0.5, 2, delta);
    camera.position.y = damp(camera.position.y, 2, 4, delta);
    
    camera.lookAt(camera.position.x, 2, camera.position.z - 6);
  });
  
  return null;
}

export default function RoyalMuseumTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.6} color="#fffcf2" />
      <directionalLight position={[10, 15, 10]} intensity={1.5} color="#fff5d1" castShadow />
      
      {/* Soft reflective marble floor */}
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={50} blur={1} far={5} />
      
      {/* Marble Floor */}
      <mesh position={[0, -0.01, - (photos.length * 2)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, Math.max(100, photos.length * 8)]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.1} metalness={0.2} />
      </mesh>
      
      {/* Red Carpet */}
      <mesh position={[0, 0, - (photos.length * 2)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, Math.max(100, photos.length * 8)]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} />
      </mesh>

      {!isLowEndDevice && (
        <Environment preset="apartment" />
      )}

      <HallCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />
      
      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <RoyalPhoto 
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
