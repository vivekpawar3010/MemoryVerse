import React, { useState, Suspense, useMemo } from 'react';
import { useEditorStore } from '../../store/EditorStore';
import { Monitor, Tablet, Smartphone, Maximize, ZoomIn, ZoomOut, Save, RotateCcw, RotateCw, Play, Pause, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll } from '@react-three/drei';

// Theme imports
import CinematicSpaceTheme from '../themes/CinematicSpace';
import FloatingMuseumTheme from '../themes/FloatingMuseum';
import VintageBookTheme from '../themes/VintageBook';
import DreamCloudsTheme from '../themes/DreamClouds';
import OceanMemoriesTheme from '../themes/OceanMemories';
import CampfireNightTheme from '../themes/CampfireNight';
import CyberFutureTheme from '../themes/CyberFuture';
import GoldenHourTheme from '../themes/GoldenHour';

const THEME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'CinematicSpace': CinematicSpaceTheme,
  'FloatingMuseum': FloatingMuseumTheme,
  'VintageBook': VintageBookTheme,
  'DreamClouds': DreamCloudsTheme,
  'OceanMemories': OceanMemoriesTheme,
  'CampfireNight': CampfireNightTheme,
  'CyberFuture': CyberFutureTheme,
  'GoldenHour': GoldenHourTheme,
};

// ScrollBridge connects bottom progress bar slider, auto-tour, and wheel scrolling to R3F's useScroll hook
const ScrollBridge: React.FC<{
  scrollProgress: number;
  setScrollProgress: (p: number) => void;
  isPlaying: boolean;
  targetProgress: number | null;
  setTargetProgress: (p: number | null) => void;
}> = ({ scrollProgress, setScrollProgress, isPlaying, targetProgress, setTargetProgress }) => {
  const scroll = useScroll();

  useFrame((state, delta) => {
    if (!scroll.el) return;
    const maxScroll = scroll.el.scrollHeight - scroll.el.clientHeight;
    if (maxScroll <= 0) return;

    if (targetProgress !== null) {
      scroll.el.scrollTop = targetProgress * maxScroll;
      setTargetProgress(null);
    } else if (isPlaying) {
      if (scroll.el.scrollTop < maxScroll) {
        scroll.el.scrollTop += 22 * delta; // Smooth auto-tour scroll velocity
      } else {
        scroll.el.scrollTop = 0; // Loop auto-tour back to start
      }
    }

    // Sync current scroll offset back to local state to advance the slider
    if (Math.abs(scrollProgress - scroll.offset) > 0.005) {
      setScrollProgress(scroll.offset);
    }
  });

  return null;
};

export const PreviewRenderer: React.FC = () => {
  const { 
    items, 
    previewMode, 
    setPreviewMode, 
    saveStatus, 
    undo, 
    redo, 
    history, 
    historyIndex, 
    selectedItemIds, 
    selectItem, 
    groupDetails,
    hasUnsavedChanges,
    isSaving,
    deployChanges
  } = useEditorStore();
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState<number | null>(null);

  const activeThemeId = groupDetails?.theme || 'CinematicSpace';
  const ThemeComponent = THEME_COMPONENTS[activeThemeId] || CinematicSpaceTheme;

  const pages = Math.max(3, items.length / 2);

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'w-[375px] h-[812px]';
      case 'tablet': return 'w-[768px] h-[1024px]';
      case 'desktop': default: return 'w-full h-full';
    }
  };

  // Node navigation helper
  const activeIndex = items.findIndex(i => i.id === selectedItemIds[0]);

  const handlePrevNode = () => {
    if (items.length === 0) return;
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
    selectItem(items[nextIdx].id, false);
  };

  const handleNextNode = () => {
    if (items.length === 0) return;
    const nextIdx = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
    selectItem(items[nextIdx].id, false);
  };

  const themeData = useMemo(() => ({
    photos: items.filter(i => i.type === 'photo'),
    videos: items.filter(i => i.type === 'video'),
    quotes: items.filter(i => i.type === 'quote')
  }), [items]);

  return (
    <div className="w-full h-full bg-[#050714] flex flex-col relative overflow-hidden font-sans">
      
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-indigo-500/30 rounded-full px-4 py-2 shadow-2xl">
        <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Desktop View">
          <Monitor size={14} />
        </button>
        <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded-md transition-colors ${previewMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Tablet View">
          <Tablet size={14} />
        </button>
        <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Mobile View">
          <Smartphone size={14} />
        </button>
        
        <div className="w-px h-4 bg-slate-700 mx-2" />
        
        <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
        <span className="text-[10px] text-white font-mono">100%</span>
        <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
        <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Fit Screen"><Maximize size={14} /></button>

        <div className="w-px h-4 bg-slate-700 mx-2" />

        <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo"><RotateCcw size={14} /></button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo"><RotateCw size={14} /></button>

        <div className="w-px h-4 bg-slate-700 mx-2" />

        <button 
          onClick={deployChanges} 
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-lg ${
            hasUnsavedChanges 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white animate-pulse' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Deploy Changes to Live Portal"
        >
          <Save size={12} />
          <span>Deploy</span>
        </button>
      </div>

      {/* Save Status */}
      <div className="absolute top-4 right-4 z-20">
        {saveStatus === 'saving' && <div className="text-xs text-indigo-400 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-indigo-500/30"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" /> Deploying...</div>}
        {saveStatus === 'saved' && <div className="text-xs text-emerald-400 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-emerald-500/30"><Save size={12} /> Deployed Successfully</div>}
        {saveStatus === 'error' && <div className="text-xs text-red-400 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-red-500/30">Failed to deploy</div>}
      </div>

      {/* Main 3D Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
        <div className={`transition-all duration-300 relative border border-slate-800 shadow-2xl rounded-xl overflow-hidden bg-black ${getPreviewDimensions()}`}>
          
          {/* Live 3D Canvas with ScrollControls */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
              <Suspense fallback={null}>
                <ScrollControls pages={pages} damping={0.25} distance={1.5}>
                  <ScrollBridge 
                    scrollProgress={scrollProgress} 
                    setScrollProgress={setScrollProgress} 
                    isPlaying={isAutoScrolling}
                    targetProgress={targetProgress}
                    setTargetProgress={setTargetProgress}
                  />
                  <ThemeComponent 
                    data={{
                      ...groupDetails,
                      photos: items.filter(i => i.type === 'photo'),
                      videos: items.filter(i => i.type === 'video'),
                      quotes: items.filter(i => i.type === 'quote')
                    } as any}
                    isLowEndDevice={false}
                    activePhotoId={selectedItemIds.length > 0 ? selectedItemIds[0] : null}
                    setActivePhotoId={(id: string | null) => selectItem(id, false)}
                    isAdminEditMode={true}
                  />
                </ScrollControls>
              </Suspense>
            </Canvas>
          </div>
          
        </div>
      </div>

      {/* Bottom Floating Scroll & Node Inspection Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/80 backdrop-blur-xl border border-indigo-500/40 rounded-2xl px-5 py-2.5 shadow-2xl w-full max-w-xl">
        {/* Play/Pause Scroll Tour */}
        <button
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shrink-0 text-xs font-bold"
          title={isAutoScrolling ? "Pause Scroll Zoom Tour" : "Play Scroll Zoom Tour"}
        >
          {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
          <span>{isAutoScrolling ? 'Pause' : 'Auto Tour'}</span>
        </button>

        {/* Scroll Progress Slider Scrubber */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1"><Compass size={11} className="text-indigo-400" /> Scroll Depth Zoom</span>
            <span className="text-indigo-300 font-bold">{Math.round(scrollProgress * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={scrollProgress}
            onChange={(e) => setTargetProgress(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Node Navigator */}
        <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-3">
          <button
            onClick={handlePrevNode}
            disabled={items.length === 0}
            className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-30"
            title="Previous Node"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] text-slate-300 font-mono px-1 font-bold">
            {activeIndex >= 0 ? `${activeIndex + 1}/${items.length}` : `0/${items.length}`}
          </span>
          <button
            onClick={handleNextNode}
            disabled={items.length === 0}
            className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-30"
            title="Next Node"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
