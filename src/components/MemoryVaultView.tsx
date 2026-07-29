import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, useProgress } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import { VisitorGroupAccess } from '../types';
import { AudioManager } from './AudioManager';
import { ImageViewer } from './ImageViewer';
import { ProtectionWrapper } from './ProtectionWrapper';

// Lazy load all themes (these will now just be 3D scene components)
const themeComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'CinematicSpace': React.lazy(() => import('./themes/CinematicSpace')),
  'FloatingMuseum': React.lazy(() => import('./themes/FloatingMuseum')),
  'VintageBook': React.lazy(() => import('./themes/VintageBook')),
  'GlassGallery': React.lazy(() => import('./themes/GlassGallery')),
  'DreamClouds': React.lazy(() => import('./themes/DreamClouds')),
  'OceanMemories': React.lazy(() => import('./themes/OceanMemories')),
  'CampfireNight': React.lazy(() => import('./themes/CampfireNight')),
  'CyberFuture': React.lazy(() => import('./themes/CyberFuture')),
  'RoyalMuseum': React.lazy(() => import('./themes/RoyalMuseum')),
  'GalaxyConstellation': React.lazy(() => import('./themes/GalaxyConstellation')),
  'CherryBlossom': React.lazy(() => import('./themes/CherryBlossom')),
  'GoldenHour': React.lazy(() => import('./themes/GoldenHour')),
  'Christmas': React.lazy(() => import('./themes/Christmas')),
  'RainyWindow': React.lazy(() => import('./themes/RainyWindow')),
  'AuroraDreams': React.lazy(() => import('./themes/AuroraDreams')),
};

interface Props {
  data: VisitorGroupAccess;
  onBack: () => void;
}

// Custom Loader
const CanvasLoader = () => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050816] transition-opacity duration-1000 ease-in-out">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
          {progress < 100 ? `Loading Asset ${progress.toFixed(0)}%` : 'Initializing Environment...'}
        </p>
      </div>
    </div>
  );
};

export const MemoryVaultView: React.FC<Props> = ({ data, onBack }) => {
  const themeId = data.theme || 'CinematicSpace';
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  
  // Determine if it's a low end device
  const isLowEndDevice = useMemo(() => {
    const nav = navigator as any;
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 8;
    return cores < 4 || memory < 4;
  }, []);

  const ThemeComponent = themeComponents[themeId] || themeComponents['CinematicSpace'];
  const pages = Math.max(3, (data.photos?.length || 0) / 2); // Dynamic scroll length

  const bgColor = data.themeSettings?.backgroundColor || '#050816';
  const textColor = data.themeSettings?.textColor || '#ffffff';

  return (
    <ProtectionWrapper groupName={data.groupName} memoryId={data.memoryId} showWatermark={data.showWatermark}>
      <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: bgColor, color: textColor }}>
        
        {/* Global Audio Manager */}
        <AudioManager 
          ambientUrl={data.ambientAudio || data.audioUrl} 
          endingUrl={data.endingAudio}
          isEnding={false} // We can tie this to scroll progress later
        />

        {/* Global HUD */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Portal</span>
            </button>
            <h1 className="mt-4 text-4xl font-bold font-serif drop-shadow-lg" style={{ color: textColor }}>
              {data.groupName}
            </h1>
            <p className="uppercase tracking-widest text-xs mt-1 drop-shadow-md" style={{ color: textColor, opacity: 0.8 }}>
              Cinematic Memory Experience
            </p>
          </div>
        </div>

        {/* 2D Fullscreen Photo Viewer */}
        {activePhotoId && data.photos && (
          <ImageViewer 
            photos={data.photos}
            initialActiveId={activePhotoId}
            onClose={() => setActivePhotoId(null)}
          />
        )}

        {/* 3D Scene */}
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            {/* ScrollControls manages GSAP-like scroll timeline mapping 0-1 */}
            <ScrollControls pages={pages} damping={0.2} distance={1.5}>
              <ThemeComponent 
                data={data} 
                isLowEndDevice={isLowEndDevice}
                activePhotoId={activePhotoId}
                setActivePhotoId={setActivePhotoId}
              />
            </ScrollControls>
          </Suspense>
        </Canvas>

        {/* Suspense fallback for the whole canvas */}
        <Suspense fallback={<CanvasLoader />}>
          {null}
        </Suspense>

      </div>
    </ProtectionWrapper>
  );
};
