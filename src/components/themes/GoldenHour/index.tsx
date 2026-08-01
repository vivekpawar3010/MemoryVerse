import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, Float, Sky, Environment, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function FieldPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a wide open field standing on easels, spread along X and Z
  const position = useMemo(() => {
    // Spread along Z to allow scrolling through the field
    const z = -5 - (index * 4);
    // Alternate left/right
    const isLeft = index % 2 === 0;
    const x = (isLeft ? -1 : 1) * (2 + Math.random() * 3);
    const y = 1.5;
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
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3.5));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      const targetRotY = index % 2 === 0 ? 0.1 : -0.1;
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotY, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2.5;
  const width = height * aspect;

  return (
    <group 
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        setActivePhotoId(isActive ? null : item.id);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.1}>
        {/* Easel/Stand */}
        {!isActive && (
          <group position={[0, -height/2 - 1.5, -0.2]}>
            <mesh position={[0, 1, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3]} />
              <meshStandardMaterial color="#3e2723" transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
            </mesh>
            <mesh position={[-0.8, 0, 0]} rotation={[0, 0, 0.3]}>
              <cylinderGeometry args={[0.05, 0.05, 3]} />
              <meshStandardMaterial color="#3e2723" transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
            </mesh>
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, -0.3]}>
              <cylinderGeometry args={[0.05, 0.05, 3]} />
              <meshStandardMaterial color="#3e2723" transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
            </mesh>
          </group>
        )}

        <mesh castShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={texture as any} roughness={0.5} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {/* Simple Frame */}
        <mesh position={[0, 0, -0.05]} castShadow>
          <boxGeometry args={[width + 0.2, height + 0.2, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.5, 0.1]} fontSize={0.25} color="#451a03" font="https://fonts.gstatic.com/s/playfairdisplay/v21/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </Float>
    </group>
  );
}

function GoldenCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalDistance = Math.max(10, totalPhotos * 4);
    const targetZ = -scroll.offset * totalDistance;
    
    camera.position.z = damp(camera.position.z, targetZ, 4, delta);
    
    // Smooth wandering through the field
    const targetX = Math.sin(scroll.offset * Math.PI * 4) * 2;
    camera.position.x = damp(camera.position.x, targetX, 2, delta);
    camera.position.y = damp(camera.position.y, 1.5, 2, delta);
    
    camera.lookAt(camera.position.x * 0.5, 1.5, camera.position.z - 10);
  });
  
  return null;
}

export default function GoldenHourTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.5} color="#fed7aa" />
      {/* Long sunset shadow casting light */}
      <directionalLight position={[-15, 5, 10]} intensity={2} color="#fdba74" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={50} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      
      {/* Ground */}
      <mesh position={[0, -0.01, - (photos.length * 2)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, Math.max(100, photos.length * 8)]} />
        <meshStandardMaterial color="#854d0e" roughness={1} />
      </mesh>
      
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={40} blur={2} far={4} color="#451a03" />

      {!isLowEndDevice && (
        <>
          <Sky distance={450000} sunPosition={[-15, 2, 10]} inclination={0.49} azimuth={0.25} turbidity={10} rayleigh={3} />
          <Environment preset="sunset" />
        </>
      )}

      <GoldenCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <FieldPhoto 
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
