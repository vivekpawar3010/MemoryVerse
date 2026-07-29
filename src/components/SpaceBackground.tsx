import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface SpaceBackgroundProps {
  isLoaded: boolean;
  isBrightened?: boolean;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ isLoaded, isBrightened = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsMeshRef = useRef<THREE.Points | null>(null);
  const dustMeshRef = useRef<THREE.Points | null>(null);
  const nebulaGroupRef = useRef<THREE.Group | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050816, 0.0008);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 400);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Create custom glowing texture for stars
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(252, 211, 77, 0.8)');
      gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const starTexture = createStarTexture();

    // 5. Starfield Creation (Thousands of stars)
    const starCount = 5000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const colorPalette = [
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#FDE68A'), // Soft Gold
      new THREE.Color('#93C5FD'), // Soft Blue
      new THREE.Color('#C084FC'), // Soft Purple
      new THREE.Color('#6EE7B7'), // Emerald Soft
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 1600;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 2000;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i3] = color.r;
      starColors[i3 + 1] = color.g;
      starColors[i3 + 2] = color.b;

      starSizes[i] = Math.random() * 3.5 + 1.0;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 3,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsMesh);
    starsMeshRef.current = starsMesh;

    // 6. Floating Light Dust Particles
    const dustCount = 1500;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      dustPositions[i3] = (Math.random() - 0.5) * 600;
      dustPositions[i3 + 1] = (Math.random() - 0.5) * 600;
      dustPositions[i3 + 2] = (Math.random() - 0.5) * 800;

      // Golden and emerald dust
      const isGold = Math.random() > 0.3;
      dustColors[i3] = isGold ? 0.98 : 0.2;
      dustColors[i3 + 1] = isGold ? 0.8 : 0.9;
      dustColors[i3 + 2] = isGold ? 0.4 : 0.6;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 2.2,
      map: starTexture || undefined,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dustMesh = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustMesh);
    dustMeshRef.current = dustMesh;

    // 7. Nebula Glowing Orbs
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);
    nebulaGroupRef.current = nebulaGroup;

    const createNebulaPlane = (colorHex: string, size: number, opacity: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Mesh(geo, mat);
    };

    const nebula1 = createNebulaPlane('rgba(16, 185, 129, 0.3)', 850, 0.4);
    nebula1.position.set(-200, 100, -300);
    nebulaGroup.add(nebula1);

    const nebula2 = createNebulaPlane('rgba(37, 99, 235, 0.25)', 950, 0.35);
    nebula2.position.set(250, -150, -400);
    nebulaGroup.add(nebula2);

    const nebula3 = createNebulaPlane('rgba(245, 158, 11, 0.25)', 700, 0.3);
    nebula3.position.set(0, -80, -200);
    nebulaGroup.add(nebula3);

    // 8. Mouse interaction handler
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = x * 30;
      mouseRef.current.targetY = y * 30;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Resize handler with ResizeObserver
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // 10. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.03;

      if (cameraRef.current) {
        cameraRef.current.position.x = mouseRef.current.x;
        cameraRef.current.position.y = mouseRef.current.y;
      }

      // Rotate starfield slowly
      if (starsMeshRef.current) {
        starsMeshRef.current.rotation.y = elapsedTime * (isBrightened ? 0.03 : 0.015);
        starsMeshRef.current.rotation.x = Math.sin(elapsedTime * 0.008) * 0.02;
      }

      // Drifting dust
      if (dustMeshRef.current) {
        dustMeshRef.current.rotation.y = -elapsedTime * 0.025;
        dustMeshRef.current.position.z = (elapsedTime * 10) % 200 - 100;
      }

      // Pulse nebulae
      if (nebulaGroupRef.current) {
        nebulaGroupRef.current.rotation.z = Math.sin(elapsedTime * 0.05) * 0.05;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  // STEP 4: Camera slow fly-through space using GSAP when loaded
  useEffect(() => {
    if (isLoaded && cameraRef.current) {
      // GSAP smooth camera fly-through
      gsap.to(cameraRef.current.position, {
        z: 120,
        duration: 8,
        ease: 'power2.out',
      });

      if (sceneRef.current) {
        gsap.to(sceneRef.current.fog, {
          density: isBrightened ? 0.0001 : 0.0004,
          duration: 3,
          ease: 'power1.out',
        });
      }
    }
  }, [isLoaded, isBrightened]);

  // Handle brightening effects dynamically
  useEffect(() => {
    if (starsMeshRef.current) {
      const mat = starsMeshRef.current.material as THREE.PointsMaterial;
      gsap.to(mat, {
        size: isBrightened ? 5.5 : 3,
        duration: 2,
        ease: 'power2.out',
      });
    }

    if (dustMeshRef.current) {
      const mat = dustMeshRef.current.material as THREE.PointsMaterial;
      gsap.to(mat, {
        opacity: isBrightened ? 0.95 : 0.6,
        size: isBrightened ? 3.5 : 2.2,
        duration: 2,
        ease: 'power2.out',
      });
    }

    if (sceneRef.current && sceneRef.current.fog) {
      gsap.to(sceneRef.current.fog, {
        density: isBrightened ? 0.0001 : 0.0004,
        duration: 2,
      });
    }
  }, [isBrightened]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#050816] transition-opacity duration-1000"
      style={{ opacity: isLoaded ? 1 : 0.2 }}
    />
  );
};
