import { EffectComposer, Bloom } from '@react-three/postprocessing';
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, useTexture, useScroll, Float, Environment, Text, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeProps } from '../ThemeInterface';
import gsap from 'gsap';

// Easing helper
const damp = THREE.MathUtils.damp;

// Sort items by display order
const getSortedItems = (data: any) => {
  const items = [
    ...(data.photos || []).map((p: any) => ({ ...p, type: 'photo' })),
    ...(data.videos || []).map((v: any) => ({ ...v, type: 'video' })),
    ...(data.quotes || []).map((q: any) => ({ ...q, type: 'quote' }))
  ];
  return items.sort((a, b) => (a.displayOrder || a.display_order || 0) - (b.displayOrder || b.display_order || 0));
};

function CameraController({ items, activeItemId }: { items: any[], activeItemId: string | null }) {
  const { camera } = useThree();
  const scroll = useScroll();

  useEffect(() => {
    if (activeItemId) {
      const item = items.find(i => i.id === activeItemId);
      if (item) {
        const posX = item.positionX ?? item.position_x ?? 0;
        const posY = item.positionY ?? item.position_y ?? 0;
        const posZ = item.positionZ ?? item.position_z ?? 0;
        const scale = item.scale ?? 1;

        gsap.to(camera.position, {
          x: posX,
          y: posY,
          z: posZ + (5 * scale),
          duration: 1.2,
          ease: "power3.inOut"
        });
      }
    }
  }, [activeItemId, items, camera]);

  useFrame((state, delta) => {
    if (activeItemId) return;
    const progress = scroll?.offset ?? 0;
    const totalItems = items.length;

    if (totalItems > 0) {
      // Map progress (0-1) to card index segments
      const virtualIndex = progress * (totalItems - 1);
      const baseIndex = Math.floor(virtualIndex);
      const fract = virtualIndex - baseIndex;

      const currentItem = items[baseIndex];
      const nextItem = items[Math.min(totalItems - 1, baseIndex + 1)];

      if (currentItem && nextItem) {
        // Current item position
        const curX = currentItem.positionX ?? currentItem.position_x ?? 0;
        const curY = currentItem.positionY ?? currentItem.position_y ?? 0;
        const curZ = currentItem.positionZ ?? currentItem.position_z ?? 0;
        const curScale = currentItem.scale ?? 1;

        // Next item position
        const nextX = nextItem.positionX ?? nextItem.position_x ?? 0;
        const nextY = nextItem.positionY ?? nextItem.position_y ?? 0;
        const nextZ = nextItem.positionZ ?? nextItem.position_z ?? 0;
        const nextScale = nextItem.scale ?? 1;

        // Linearly interpolate target position
        const targetX = THREE.MathUtils.lerp(curX, nextX, fract);
        const targetY = THREE.MathUtils.lerp(curY, nextY, fract);
        
        // Z offset stays slightly in front of the cards based on their scale
        const curZOffset = 4.5 * curScale;
        const nextZOffset = 4.5 * nextScale;
        const targetZ = THREE.MathUtils.lerp(curZ + curZOffset, nextZ + nextZOffset, fract);

        // Smoothly damp camera coordinates to target path
        camera.position.x = damp(camera.position.x, targetX, 4, delta);
        camera.position.y = damp(camera.position.y, targetY, 4, delta);
        camera.position.z = damp(camera.position.z, targetZ, 4, delta);

        // Look target interpolates between cards
        const lookX = THREE.MathUtils.lerp(curX, nextX, fract);
        const lookY = THREE.MathUtils.lerp(curY, nextY, fract);
        const lookZ = THREE.MathUtils.lerp(curZ, nextZ, fract);
        camera.lookAt(lookX, lookY, lookZ);
      }
    } else {
      // Default fallback camera position if empty
      camera.position.z = damp(camera.position.z, 10, 4, delta);
      camera.position.x = damp(camera.position.x, 0, 4, delta);
      camera.position.y = damp(camera.position.y, 0, 4, delta);
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}

function MemoryNode({ item, index, isActive, onActivate }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  // Extract both camelCase and snake_case properties cleanly
  const isVisible = item.isVisible !== false && item.is_visible !== false;
  const imageUrl = item.contentUrl || item.imageUrl || item.image_url;
  const textContent = item.textContent || item.caption || item.quote || '';
  const titleOrAuthor = item.titleOrAuthor || item.title || item.author || '';

  // Quote custom colors
  const textColor = item.themeSettings?.textColor || item.textColor || item.themeColor || '#ffffff';
  const backgroundColor = item.themeSettings?.backgroundColor || item.backgroundColor || '#1e1b4b';

  const posX = item.positionX ?? item.position_x ?? (index % 2 === 0 ? 1.4 : -1.4) * (0.8 + (index % 3) * 0.2);
  const posY = item.positionY ?? item.position_y ?? ((index % 3) - 1) * 0.8;
  
  // Set first welcome card at Z = -4; place other items far behind (Z = -14, -20, -26) to make it clear
  const posZ = item.positionZ ?? item.position_z ?? (index === 0 ? -4 : -14 - ((index - 1) * 6));

  const rotX = item.rotationX ?? item.rotation_x ?? 0;
  const rotY = item.rotationY ?? item.rotation_y ?? 0;
  const rotZ = item.rotationZ ?? item.rotation_z ?? 0;

  const itemScale = item.scale ?? 1;
  const glow = item.glowStrength ?? item.glow_strength ?? 1;
  const style = item.frameStyle ?? item.frame_style ?? 'glass';
  const animation = item.animationType ?? item.animation_type ?? 'float';

  // Load texture safely if photo
  const texture = item.type === 'photo' && imageUrl ? useTexture(imageUrl) : null;

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  // Reference refs to track hover/active state transitions to trigger sound effects
  const isHoveredRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (hovered && !isHoveredRef.current) {
      const url = item.audioSettings?.soundEffectUrl;
      if (url && url !== 'none') {
        const audio = new Audio(url);
        audio.volume = 0.35;
        audio.play().catch(() => {});
      }
    }
    isHoveredRef.current = hovered;
  }, [hovered, item.audioSettings?.soundEffectUrl]);

  useEffect(() => {
    if (isActive && !isActiveRef.current) {
      const url = item.audioSettings?.soundEffectUrl;
      if (url && url !== 'none') {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    }
    isActiveRef.current = isActive;
  }, [isActive, item.audioSettings?.soundEffectUrl]);

  // Live animation loop handling all 5 presets with beautiful 3D trajectories
  useFrame((state, delta) => {
    if (!meshRef.current || !isVisible) return;
    const time = state.clock.getElapsedTime();
    
    if (!isActive) {
      if (hovered) {
        // Smooth 3D tilt following the user's mouse position for interactive depth
        const tiltX = -state.pointer.y * 0.2;
        const tiltY = state.pointer.x * 0.2;
        const tiltEuler = new THREE.Euler(rotX + tiltX, rotY + tiltY, rotZ);
        const targetQuat = new THREE.Quaternion().setFromEuler(tiltEuler);
        
        meshRef.current.quaternion.slerp(targetQuat, 5 * delta);
        const targetScale = itemScale * 1.08;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 4 * delta);
      } else {
        const originalQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ));

        if (animation === 'float') {
          // 1. FLOAT: X/Y drifting sway + slow rotation sway + micro scale zoom loop
          const floatZoom = itemScale * (1 + Math.sin(time * 1.8 + index) * 0.04);
          meshRef.current.scale.lerp(new THREE.Vector3(floatZoom, floatZoom, floatZoom), 4 * delta);
          
          meshRef.current.position.y = posY + Math.sin(time * 1.5 + index) * 0.12;
          meshRef.current.position.x = posX + Math.cos(time * 1.2 + index) * 0.06;
          
          const swayRot = new THREE.Euler(
            rotX + Math.sin(time * 0.8 + index) * 0.03,
            rotY + Math.cos(time * 0.6 + index) * 0.03,
            rotZ + Math.sin(time * 0.5 + index) * 0.02
          );
          const targetQuat = new THREE.Quaternion().setFromEuler(swayRot);
          meshRef.current.quaternion.slerp(targetQuat, 3 * delta);
        } else if (animation === 'spin') {
          // 2. SPIN: Altitude bounce (Y float loop) + continuous slow Y-axis rotation
          meshRef.current.rotation.y += delta * 0.35;
          meshRef.current.position.y = posY + Math.sin(time * 2 + index) * 0.15;
          meshRef.current.scale.lerp(new THREE.Vector3(itemScale, itemScale, itemScale), 4 * delta);
          meshRef.current.quaternion.slerp(originalQuat, 3 * delta);
        } else if (animation === 'pulse') {
          // 3. PULSE: Heartbeat scale loop
          const pulseFactor = itemScale * (1 + Math.sin(time * 3.5 + index) * 0.08);
          meshRef.current.scale.lerp(new THREE.Vector3(pulseFactor, pulseFactor, pulseFactor), 6 * delta);
          meshRef.current.quaternion.slerp(originalQuat, 3 * delta);
          meshRef.current.position.y = posY;
          meshRef.current.position.x = posX;
        } else if (animation === 'orbit') {
          // 4. ORBIT: Circular orbit path + Z roll banking rotation into the curves
          const radius = 0.5;
          const orbitAngle = time * 1.2 + index;
          meshRef.current.position.x = posX + Math.cos(orbitAngle) * radius;
          meshRef.current.position.y = posY + Math.sin(orbitAngle) * radius;
          
          const bankZ = -Math.cos(orbitAngle) * 0.1;
          const orbitRot = new THREE.Euler(rotX, rotY, rotZ + bankZ);
          const orbitQuat = new THREE.Quaternion().setFromEuler(orbitRot);
          meshRef.current.quaternion.slerp(orbitQuat, 4 * delta);
          meshRef.current.scale.lerp(new THREE.Vector3(itemScale, itemScale, itemScale), 4 * delta);
        } else {
          // 5. STATIC: Clean static position with micro hover vibe scale
          meshRef.current.scale.lerp(new THREE.Vector3(itemScale, itemScale, itemScale), 4 * delta);
          meshRef.current.quaternion.slerp(originalQuat, 3 * delta);
          meshRef.current.position.y = posY;
          meshRef.current.position.x = posX;
        }
      }
    } else {
      meshRef.current.quaternion.slerp(camera.quaternion, 4 * delta);
      // Center active item position
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const activePosition = new THREE.Vector3().copy(camera.position).add(cameraDir.multiplyScalar(3));
      meshRef.current.position.lerp(activePosition, 4 * delta);
    }
  });

  if (!isVisible) return null;

  const aspect = texture && (texture as any).image ? (texture as any).image.width / (texture as any).image.height : 1.33;
  const width = 2.5;
  const height = width / aspect;

  return (
    <Float 
      speed={animation === 'float' && !isActive ? 2.5 : 0} 
      rotationIntensity={animation === 'float' && !isActive ? 0.3 : 0} 
      floatIntensity={animation === 'float' && !isActive ? 0.6 : 0}
    >
      <group 
        ref={meshRef}
        position={[posX, posY, posZ]}
        onClick={(e) => {
          e.stopPropagation();
          onActivate(isActive ? null : item.id);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        {/* Photo Content */}
        {item.type === 'photo' && texture && (
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={texture as any} transparent opacity={1} />
          </mesh>
        )}

        {/* Quote Content with Custom Text Color and Rounded Plaque Card Backing */}
        {item.type === 'quote' && (
          <group position={[0, 0, 0.01]}>
             {/* Text */}
             <Text
                fontSize={0.21}
                color={textColor}
                maxWidth={2.1}
                textAlign="center"
                font="https://fonts.gstatic.com/s/cinzel/v19/8vIX7qw6G_b98eWQYA.woff"
             >
                {textContent}
             </Text>
             {titleOrAuthor && (
               <Text position={[0, -0.75, 0]} fontSize={0.13} color={textColor}>
                 — {titleOrAuthor}
               </Text>
             )}
             
             {/* Frosty/Solid Quote Plaque Backing Card */}
             <RoundedBox args={[width + 0.1, height + 0.1, 0.04]} radius={0.03} position={[0, 0, -0.04]}>
               <meshStandardMaterial 
                 color={backgroundColor}
                 roughness={0.4} 
                 metalness={0.15}
                 transparent
                 opacity={0.94}
               />
             </RoundedBox>
          </group>
        )}

        {/* Video Content */}
        {item.type === 'video' && (
           <mesh position={[0, 0, 0]}>
             <planeGeometry args={[width, width/(16/9)]} />
             <meshBasicMaterial color="#0f172a" />
             <Text fontSize={0.4} color="#a5b4fc">▶</Text>
           </mesh>
        )}

        {/* Frame Styles with Custom Background Color */}
        {style === 'glass' && (
          <RoundedBox args={[width + 0.2, (item.type === 'video' ? width/(16/9) : height) + 0.2, 0.08]} radius={0.04} position={[0, 0, -0.05]}>
            <meshPhysicalMaterial 
              transmission={0.85} 
              roughness={0.15} 
              thickness={0.4} 
              ior={1.4} 
              clearcoat={1} 
              transparent 
              opacity={0.65}
              color={item.type === 'quote' ? backgroundColor : "#818cf8"}
            />
          </RoundedBox>
        )}

        {style === 'solid' && (
          <RoundedBox args={[width + 0.15, (item.type === 'video' ? width/(16/9) : height) + 0.15, 0.06]} radius={0.02} position={[0, 0, -0.04]}>
            <meshStandardMaterial color={item.type === 'quote' ? backgroundColor : "#1e1b4b"} roughness={0.3} metalness={0.8} />
          </RoundedBox>
        )}

        {style === 'neon' && (
          <RoundedBox args={[width + 0.25, (item.type === 'video' ? width/(16/9) : height) + 0.25, 0.08]} radius={0.05} position={[0, 0, -0.05]}>
            <meshStandardMaterial color={item.type === 'quote' ? backgroundColor : "#6366f1"} emissive={item.type === 'quote' ? backgroundColor : "#4f46e5"} emissiveIntensity={1.5} />
          </RoundedBox>
        )}

        {/* Premium Rounded 3D Drop Shadow Box behind every card node */}
        <RoundedBox args={[width + 0.1, (item.type === 'video' ? width/(16/9) : height) + 0.1, 0.02]} radius={0.03} position={[0.1, -0.1, -0.15]}>
          <meshBasicMaterial color="#000000" transparent opacity={0.65} />
        </RoundedBox>

        {/* Glow Halo */}
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[width + 0.6, (item.type === 'video' ? width/(16/9) : height) + 0.6]} />
          <meshBasicMaterial color={[0.3 * glow, 0.5 * glow, 1 * glow]} transparent opacity={isActive ? 0.7 : (hovered ? 0.4 : 0.15 * glow)} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Caption Overlay */}
        {isActive && item.type === 'photo' && textContent && (
           <Html position={[0, -height/2 - 0.5, 0]} center zIndexRange={[100, 0]}>
             <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-indigo-500/40 text-white font-cinzel text-xs whitespace-nowrap shadow-2xl">
               {textContent}
             </div>
           </Html>
        )}
      </group>
    </Float>
  );
}

export default function CinematicSpaceTheme({ data, isLowEndDevice, activePhotoId, setActivePhotoId, scrollProgress }: ThemeProps & { scrollProgress?: number }) {
  const items = React.useMemo(() => getSortedItems(data), [data]);
  
  return (
    <group>
      <color attach="background" args={['#010206']} />
      
      {!isLowEndDevice && (
        <>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.25} color="#818cf8" />
          <Environment preset="night" />
        </>
      )}

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} color="#a5b4fc" />
      
      <CameraController items={items} activeItemId={activePhotoId} />
      
      {items.map((item, index) => (
        <React.Suspense key={item.id || index} fallback={null}>
          <MemoryNode 
            item={item} 
            index={index} 
            isActive={activePhotoId === item.id} 
            onActivate={setActivePhotoId} 
          />
        </React.Suspense>
      ))}

      {!isLowEndDevice && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} />
        </EffectComposer>
      )}
    </group>
  );
}
