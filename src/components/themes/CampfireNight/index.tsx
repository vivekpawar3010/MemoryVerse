import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function HangingPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange in a wide circle around a campfire that you orbit around
  const position = useMemo(() => {
    // 360 degree circle divided by total photos
    const angle = (index / total) * Math.PI * 2;
    const radius = Math.max(8, total * 0.8); // Scale radius with amount of photos
    return new THREE.Vector3(Math.cos(angle) * radius, 2, Math.sin(angle) * radius);
  }, [index, total]);

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
      
      // Face the campfire (center)
      const targetRot = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(position, new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 1, 0))
      );
      
      // Add slight hover tilt
      const hoverTilt = hovered ? 0.1 : 0;
      targetRot.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(hoverTilt, 0, 0)));
      
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2;
  const width = height * aspect;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setActivePhotoId(isActive ? null : item.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Rope */}
        {!isActive && (
          <mesh position={[0, height/2 + 1, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.9} transparent={false} opacity={1} />
          </mesh>
        )}

        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture as any} transparent={false} opacity={1} toneMapped={false} />
        </mesh>
        
        {/* Polaroid Frame */}
        <mesh position={[0, -0.2, -0.03]}>
          <boxGeometry args={[width + 0.4, height + 0.8, 0.06]} />
          <meshStandardMaterial color="#f8f4e6" roughness={1} transparent={false} opacity={1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 1.2, 0.1]} fontSize={0.2} color="#f8f4e6" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </group>
    </Float>
  );
}

function Firelight() {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.intensity = 2 + Math.sin(t * 10) * 0.5 + Math.random() * 0.5;
    }
  });
  
  return (
    <pointLight ref={lightRef} position={[0, 0.5, 0]} color="#ff7b00" distance={25} castShadow />
  );
}

function OrbitCameraController({ activePhotoId }: { activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // Orbit around the campfire based on scroll offset (0 to 1 -> 0 to 2PI)
    const angle = scroll.offset * Math.PI * 2;
    const radius = 3;
    
    camera.position.x = damp(camera.position.x, Math.cos(angle) * radius, 4, delta);
    camera.position.z = damp(camera.position.z, Math.sin(angle) * radius, 4, delta);
    camera.position.y = damp(camera.position.y, 1.5, 4, delta);
    
    camera.lookAt(0, 2, 0); // Always look at fire
  });
  
  return null;
}

export default function CampfireNightTheme({ data, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <color attach="background" args={['#010204']} />
      
      {/* Moonlight */}
      <directionalLight position={[-10, 20, -10]} intensity={0.2} color="#4f85e5" />
      
      <Firelight />

      {/* Ground */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0a1205" roughness={1} />
      </mesh>
      
      <ContactShadows position={[0, 0.01, 0]} opacity={0.8} scale={30} blur={2} far={4} color="#000000" />
      
      {/* Center Campfire log proxy */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 0.5, 8]} />
        <meshStandardMaterial color="#3e2723" roughness={1} />
      </mesh>
      
      <OrbitCameraController activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <HangingPhoto 
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
