import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, Float, Sparkles, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';

const damp = THREE.MathUtils.damp;

function OrnamentPhoto({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(item.imageUrl);
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const { camera } = useThree();
  const [hovered, setHovered] = React.useState(false);
  
  // Arrange like ornaments spiraling around a large tree
  const position = useMemo(() => {
    const angle = index * 2.4; // Golden ratio spiral
    const radius = 3 + (index * 0.1); // Spreading out down the tree
    const y = -index * 0.8 + 10; // Start high, go down
    
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
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
      
      // Face outward from center
      const targetRot = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(position, new THREE.Vector3(0, position.y, 0), new THREE.Vector3(0, 1, 0))
      );
      targetRot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      
      if (hovered) {
        targetRot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.2));
      }
      
      meshRef.current.quaternion.slerp(targetRot, 2 * delta);
    }
  });

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const height = 1.5;
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
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Invisible string from above */}
        {!isActive && (
          <mesh position={[0, height/2 + 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1]} />
            <meshStandardMaterial color="#cccccc" transparent opacity={0.3} />
          </mesh>
        )}

        <mesh>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={texture} roughness={0.4} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {/* Golden Ornament Frame */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[width + 0.1, height + 0.1, 0.05]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} transparent opacity={isAnyActive && !isActive ? 0.2 : 1} />
        </mesh>
        
        {isActive && item.caption && (
          <Text position={[0, -height/2 - 0.4, 0.1]} fontSize={0.2} color="#fca5a5" font="https://fonts.gstatic.com/s/mountainsinofchristmas/v18/dPBCaP048Oym_M6jM62s3k6-bA20B7_B-s12wQ.woff" anchorX="center" anchorY="middle" maxWidth={width}>
            {item.caption}
          </Text>
        )}
      </Float>
    </group>
  );
}

function SnowCameraController({ totalPhotos, activePhotoId }: { totalPhotos: number, activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // Spiral around the tree going down based on scroll
    // Total height of the tree is approx totalPhotos * 0.8
    const totalHeight = totalPhotos * 0.8;
    
    // 0 to 1 mapping: 
    // y goes from 10 down to 10 - totalHeight
    // angle goes from 0 to 2PI * (how many loops we want)
    const loops = Math.max(1, totalPhotos / 10);
    const angle = scroll.offset * Math.PI * 2 * loops;
    
    const targetY = 10 - (scroll.offset * totalHeight);
    
    // Radius starts tight at top, wider at bottom
    const radius = 6 + (scroll.offset * 10);
    
    camera.position.x = damp(camera.position.x, Math.sin(angle) * radius, 4, delta);
    camera.position.z = damp(camera.position.z, Math.cos(angle) * radius, 4, delta);
    camera.position.y = damp(camera.position.y, targetY, 4, delta);
    
    camera.lookAt(0, targetY, 0);
  });
  
  return null;
}

export default function ChristmasTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.2} color="#bfdbfe" />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#fef08a" castShadow />
      
      {/* Snowy Ground */}
      <mesh position={[0, - (photos.length * 0.8) + 8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
      
      <ContactShadows position={[0, - (photos.length * 0.8) + 8.01, 0]} opacity={0.6} scale={15} blur={2} far={4} color="#0f172a" />

      {!isLowEndDevice && (
        <>
          {/* Snow falling everywhere */}
          <Sparkles count={2000} scale={40} size={3} speed={0.2} color="#ffffff" position={[0, 10, 0]} opacity={0.5} />
          {/* Fairy Lights embedded in the tree */}
          <Sparkles count={500} scale={20} size={1} speed={0} color="#fde047" position={[0, 5, 0]} opacity={0.8} />
          <Sparkles count={300} scale={20} size={1} speed={0} color="#ef4444" position={[0, 5, 0]} opacity={0.8} />
          <Sparkles count={300} scale={20} size={1} speed={0} color="#3b82f6" position={[0, 5, 0]} opacity={0.8} />
        </>
      )}

      <SnowCameraController totalPhotos={photos.length} activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <OrnamentPhoto 
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
