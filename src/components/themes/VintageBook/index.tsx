import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';
import { getValidTextureUrl } from '../../ui/ThreeErrorBoundary';

function Page({ item, index, total, activePhotoId, setActivePhotoId }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(getValidTextureUrl(item?.imageUrl));
  const scroll = useScroll();
  const isActive = activePhotoId === item.id;
  const isAnyActive = activePhotoId !== null;
  const [hovered, setHovered] = React.useState(false);
  const { camera } = useThree();

  const aspect = ((texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1);
  const width = 3;
  const height = width / aspect;

  React.useEffect(() => {
    if (hovered && !isActive) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, isActive]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Map scroll offset to current page
    // scroll.offset goes from 0 to 1
    const currentPageFloat = scroll.offset * total;
    
    // Page turning logic
    const isLeftPage = index <= Math.floor(currentPageFloat);
    const progress = Math.max(0, Math.min(1, currentPageFloat - index)); // 0 to 1 as page turns
    
    // Y rotation for page turn (from 0 to PI)
    const targetRotationY = isLeftPage ? Math.PI : 0;
    
    if (!isActive) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 5 * delta);
      // Lift page slightly while turning to avoid z-fighting
      const turnLift = Math.sin(progress * Math.PI) * 0.5;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, turnLift, 5 * delta);
      
      // Default position
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 5 * delta);
      groupRef.current.position.z = index * -0.01;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    } else {
      // If clicked, bring to camera
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const targetPos = camera.position.clone().add(cameraDir.multiplyScalar(4));
      
      groupRef.current.position.lerp(targetPos, 4 * delta);
      groupRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, index * -0.01]}>
      {/* Anchor point at the spine of the book */}
      <group position={[2.5, 0, 0]}>
        {/* Paper Background */}
        <mesh>
          <planeGeometry args={[5, 7]} />
          <meshStandardMaterial color="#f4ebd8" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Photo Print */}
        <mesh 
          position={[0, 0.5, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoId(isActive ? null : item.id);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture as any} transparent={false} opacity={1} toneMapped={false} />
        </mesh>
        
        {/* Caption */}
        {item.caption && (
          <Text position={[0, -2.5, 0.01]} fontSize={0.2} color="#3e2723" font="https://fonts.gstatic.com/s/playfairdisplay/v21/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff" anchorX="center" anchorY="middle" maxWidth={4}>
            {item.caption}
          </Text>
        )}
      </group>
    </group>
  );
}

function BookCameraController({ activePhotoId }: { activePhotoId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (activePhotoId) return;
    
    // Zoom in slightly based on scroll, tilt camera down a bit to look at book
    const targetZ = 8 - (scroll.offset * 2); // Move closer
    const targetY = 5 - (scroll.offset * 1); // Lower camera
    
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, Math.sin(scroll.offset * Math.PI) * 1, 4, delta);
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

export default function VintageBookTheme({ data, activePhotoId, setActivePhotoId }: ThemeProps) {
  const photos = data.photos || [];

  return (
    <group>
      <ambientLight intensity={0.4} color="#ffd54f" />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={1} intensity={1.5} color="#ffecb3" castShadow />
      
      {/* Wooden Desk */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3e2723" roughness={0.8} />
      </mesh>
      
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={15} blur={1.5} far={4} />

      {/* Book Base (Cover) */}
      <group position={[0, 0.05, 0]}>
        <mesh position={[2.5, -0.05, 0]}>
          <boxGeometry args={[5.2, 0.1, 7.2]} />
          <meshStandardMaterial color="#211209" roughness={0.9} />
        </mesh>
        <mesh position={[-2.5, -0.05, 0]}>
          <boxGeometry args={[5.2, 0.1, 7.2]} />
          <meshStandardMaterial color="#211209" roughness={0.9} />
        </mesh>
      </group>

      <BookCameraController activePhotoId={activePhotoId} />

      {photos.map((photo, i) => (
        <React.Suspense key={photo.id} fallback={null}>
          <Page 
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
