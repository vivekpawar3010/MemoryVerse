import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, Float, MeshTransmissionMaterial, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function RainDrop({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.y -= delta * 15;
    if (ref.current.position.y < -5) {
      ref.current.position.y = 10;
      ref.current.position.x = (Math.random() - 0.5) * 20;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[0.01, 0.01, 0.5]} />
      <meshBasicMaterial color="#94a3b8" transparent opacity={0.3} />
    </mesh>
  );
}

function RainSystem() {
  const drops = useMemo(() => {
    const d = [];
    for (let i = 0; i < 200; i++) {
      d.push(new THREE.Vector3((Math.random() - 0.5) * 40, Math.random() * 15 - 5, -8));
    }
    return d;
  }, []);

  return (
    <group>
      {drops.map((pos, i) => <RainDrop key={i} position={pos} />)}
    </group>
  );
}

function WindowPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange stuck to a long glass window
  const position = useMemo(() => {
    const x = (index * 5) - (total * 2.5); // Spread along X
    const y = (index % 2 === 0 ? 1 : -1) * 1.5;
    const z = -4; // On the glass
    return new THREE.Vector3(x, y, z);
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
      activePosition.copy(camera.position).add(cameraDir.multiplyScalar(3));
      
      meshRef.current.position.lerp(activePosition, 4 * delta);
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    } else {
      meshRef.current.position.lerp(position, 2 * delta);
      
      const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 2;
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
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
      </mesh>
      
      {/* Tape pieces holding it to the window */}
      {!isActive && (
        <>
          <mesh position={[-width/2 + 0.2, height/2 - 0.2, 0.01]} rotation={[0, 0, Math.PI/4]}>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={isAnyActive && !isActive ? 0.1 : 0.4} />
          </mesh>
          <mesh position={[width/2 - 0.2, height/2 - 0.2, 0.01]} rotation={[0, 0, -Math.PI/4]}>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={isAnyActive && !isActive ? 0.1 : 0.4} />
          </mesh>
        </>
      )}
      
      {isActive && item.caption && (
        <Text position={[0, -height/2 - 0.4, 0.1]} fontSize={0.2} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={width}>
          {item.caption}
        </Text>
      )}
    </group>
  );
}

function RoomCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    const totalXDistance = Math.max(10, totalPhotos * 5);
    const startX = -totalXDistance / 2;
    const targetX = startX + (scroll.offset * totalXDistance);
    
    // Pan across the window
    camera.position.x = damp(camera.position.x, targetX, 4, delta);
    
    // Slight breathing movement inside the room
    const time = state.clock.getElapsedTime();
    camera.position.y = damp(camera.position.y, Math.cos(time * 0.8) * 0.2, 2, delta);
    camera.position.z = damp(camera.position.z, 0, 4, delta);
    
    camera.lookAt(camera.position.x, 0, -4);
  });
  
  return null;
}

export default function RainyWindowTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.2} color="#94a3b8" />
      {/* Street light coming from outside */}
      <spotLight position={[0, 5, -10]} angle={0.5} penumbra={1} intensity={1} color="#fcd34d" />
      <pointLight position={[5, -2, -15]} intensity={2} color="#0284c7" />

      {/* The Glass Window */}
      <mesh position={[0, 0, -4.5]}>
        <planeGeometry args={[Math.max(100, photos.length * 10), 20]} />
        {isLowEndDevice ? (
          <meshBasicMaterial color="#1e293b" transparent opacity={0.6} />
        ) : (
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.5}
            distortionScale={0.5}
            temporalDistortion={0.2}
            ior={1.5}
            color="#94a3b8"
          />
        )}
      </mesh>

      <RainSystem />
      <RoomCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <WindowPhoto 
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
