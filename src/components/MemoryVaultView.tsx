import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, useProgress, useTexture } from '@react-three/drei';
import { ArrowLeft, Settings2, Play, Pause } from 'lucide-react';
import { VisitorGroupAccess } from '../types';
import { AudioManager } from './AudioManager';
import { ImageViewer } from './ImageViewer';
import { ProtectionWrapper } from './ProtectionWrapper';
import { THEME_REGISTRY } from './themes/ThemeRegistry';
import { FloatingEffects } from './FloatingEffects';
import { AutoScroller } from './AutoScroller';
import { BACKGROUND_AUDIO } from './themes/AudioRegistry';
import { Music } from 'lucide-react';

// Lazy load all themes
const themeComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'CinematicSpace': React.lazy(() => import('./themes/CinematicSpace')),
  'FloatingMuseum': React.lazy(() => import('./themes/FloatingMuseum')),
  'VintageBook': React.lazy(() => import('./themes/VintageBook')),
  'DreamClouds': React.lazy(() => import('./themes/DreamClouds')),
  'OceanMemories': React.lazy(() => import('./themes/OceanMemories')),
  'CampfireNight': React.lazy(() => import('./themes/CampfireNight')),
  'CyberFuture': React.lazy(() => import('./themes/CyberFuture')),
  'GoldenHour': React.lazy(() => import('./themes/GoldenHour')),
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
  const initialThemeId = data.theme || 'CinematicSpace';
  const [localThemeId, setLocalThemeId] = useState(initialThemeId);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [visitorAudioUrl, setVisitorAudioUrl] = useState<string | null>(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [customAudioInput, setCustomAudioInput] = useState("");
  
  // Preload all textures so the 3D canvas doesn't stutter on scroll
  useEffect(() => {
    if (data.photos?.length) {
      useTexture.preload(data.photos.map(p => p.imageUrl));
    }
  }, [data.photos]);

  // Determine if it's a low end device
  const isLowEndDevice = useMemo(() => {
    const nav = navigator as any;
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 8;
    return cores < 4 || memory < 4;
  }, []);

  const ThemeComponent = themeComponents[localThemeId] || themeComponents['CinematicSpace'];
  const pages = Math.max(3, (data.photos?.length || 0) / 2); // Dynamic scroll length

  const activeThemeMetadata = useMemo(() => THEME_REGISTRY.find(t => t.id === localThemeId) || THEME_REGISTRY[0], [localThemeId]);
  const primaryColor = activeThemeMetadata.primaryColor;

  const bgColor = data.themeSettings?.backgroundColor || '#050816';
  const textColor = data.themeSettings?.textColor || '#ffffff';

  return (
    <ProtectionWrapper groupName={data.groupName} memoryId={data.memoryId} showWatermark={data.showWatermark}>
      <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: bgColor, color: textColor }}>
        
        {/* Ambient Effects */}
        <FloatingEffects />

        {/* Global Audio Manager */}
        <AudioManager 
          ambientUrl={visitorAudioUrl || data.ambientAudio || data.audioUrl} 
          endingUrl={data.endingAudio}
          isEnding={false} // We can tie this to scroll progress later
        />

        {/* Global HUD */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <button 
              onClick={onBack} 
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer backdrop-blur-md animate-in fade-in"
              style={{ backgroundColor: `${primaryColor}40`, border: `1px solid ${primaryColor}80`, color: textColor }}
            >
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
          
          <div className="pointer-events-auto flex flex-col items-end gap-2 relative">
            <div className="flex items-center">
              <button 
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-lg backdrop-blur-md mr-2"
                style={{ backgroundColor: `${primaryColor}40`, border: `1px solid ${primaryColor}80`, color: textColor }}
              >
                {isAutoScrolling ? <Pause className="w-4 h-4 sm:mr-2" /> : <Play className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{isAutoScrolling ? 'Pause Tour' : 'Auto Tour'}</span>
              </button>
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-lg backdrop-blur-md animate-in fade-in"
                style={{ backgroundColor: `${primaryColor}40`, border: `1px solid ${primaryColor}80`, color: textColor }}
              >
                <Settings2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Change Theme</span>
              </button>
            </div>
            
            {data.allowAudioChange !== false && (
              <button 
                onClick={() => setShowAudioSettings(true)}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-lg backdrop-blur-md animate-in fade-in"
                style={{ backgroundColor: `${primaryColor}40`, border: `1px solid ${primaryColor}80`, color: textColor }}
              >
                <Music className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Audio Settings</span>
              </button>
            )}
            
            {showThemeMenu && (
              <div className="absolute right-0 mt-12 w-64 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-white/10 mb-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Select Environment</p>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {THEME_REGISTRY.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setLocalThemeId(t.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm transition-colors text-white/80 hover:bg-white/10"
                      style={localThemeId === t.id ? { backgroundColor: `${primaryColor}60`, color: '#ffffff' } : {}}
                    >
                      <p className="font-semibold leading-tight">{t.name}</p>
                      <p className="text-[10px] text-white/50 mt-1">{t.style}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <AutoScroller isPlaying={isAutoScrolling} />
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
    
        {/* Audio Settings Modal */}
        {showAudioSettings && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#090d21] border border-white/10 rounded-2xl max-w-md w-full p-6 text-white space-y-6">
              <h2 className="font-cinzel text-xl font-bold">Background Audio</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {BACKGROUND_AUDIO.map(track => (
                  <button
                    key={track.id}
                    onClick={() => {
                      if (track.id === 'custom_upload') {
                        // handled by text input below
                      } else {
                        setVisitorAudioUrl(track.url);
                        setShowAudioSettings(false);
                      }
                    }}
                    className={`w-full flex flex-col items-start p-4 rounded-xl border transition-all cursor-pointer ${
                      (visitorAudioUrl === track.url || (visitorAudioUrl === null && track.url === (data.ambientAudio || data.audioUrl)))
                        ? 'border-indigo-500 bg-indigo-500/20' 
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold text-sm">{track.name}</span>
                    <span className="text-xs text-slate-400 mt-1">{track.description}</span>
                  </button>
                ))}
              </div>
              <div>
                <span className="text-xs text-slate-400 mb-2 block">Custom Audio URL:</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customAudioInput}
                    onChange={e => setCustomAudioInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      if (customAudioInput) {
                        setVisitorAudioUrl(customAudioInput);
                        setShowAudioSettings(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                  >
                    Set
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        )}

    </ProtectionWrapper>
  );
};
