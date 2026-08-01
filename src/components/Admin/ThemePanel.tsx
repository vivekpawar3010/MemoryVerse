import React, { useState } from 'react';
import { Palette, CheckCircle2, Play, X, Zap, Cpu, Star } from 'lucide-react';
import { THEME_REGISTRY, ThemeMetadata } from '../themes/ThemeRegistry';
import { useEditorStore } from '../../store/EditorStore';
import { useToast, Toast } from '../ui/Toast';

// ─── Mini animated preview per theme ────────────────────────────────────────
const ThemePreview = ({ theme, fullscreen = false }: { theme: ThemeMetadata; fullscreen?: boolean }) => {
  const dummyImg = 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?w=400&q=80';
  const sz = fullscreen ? 'w-56 h-72' : 'w-20 h-28';

  switch (theme.id) {
    case 'CinematicSpace':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: theme.previewBg }}>
          {/* Stars */}
          {[...Array(fullscreen ? 60 : 20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white animate-pulse"
              style={{ width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 3 + 1}s`, opacity: Math.random() * 0.8 + 0.2 }} />
          ))}
          <div className="absolute w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className={`${sz} rounded-xl border border-indigo-500/60 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.5)] z-10`}
            style={{ animation: 'mvFloat 6s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover mix-blend-luminosity opacity-80" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-indigo-300/60 text-sm font-cinzel tracking-widest uppercase">Cinematic Space</div>}
        </div>
      );

    case 'CyberFuture':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: theme.previewBg }}>
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none z-20" />
          {/* Neon grid lines */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className={`${sz} rounded-sm border-2 border-violet-500 overflow-hidden shadow-[0_0_25px_rgba(139,92,246,0.7),inset_0_0_10px_rgba(139,92,246,0.2)] z-10`}
            style={{ animation: 'mvGlitch 3s linear infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover contrast-125 saturate-150 hue-rotate-15" alt="Preview" />
          </div>
          <div className="absolute top-4 right-4 text-violet-400/60 text-[10px] font-mono">SYS:ONLINE</div>
          {fullscreen && <div className="absolute bottom-10 text-violet-300/60 text-sm font-mono tracking-widest uppercase">&gt; CYBER_FUTURE.EXE</div>}
        </div>
      );

    case 'DreamClouds':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #bae6fd 0%, #e0f2fe 50%, #f0abfc 100%)' }}>
          {[...Array(fullscreen ? 8 : 3)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/60 blur-2xl"
              style={{ width: `${60 + i * 40}px`, height: `${30 + i * 20}px`, top: `${10 + i * 15}%`, left: `${10 + i * 12}%`, animation: `mvDrift ${6 + i * 2}s ease-in-out infinite alternate` }} />
          ))}
          <div className={`${sz} rounded-2xl border-4 border-white/80 overflow-hidden shadow-xl z-10`}
            style={{ animation: 'mvFloat 8s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover opacity-90" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-pink-400/80 text-sm font-cinzel tracking-widest">Dream Clouds</div>}
        </div>
      );

    case 'FloatingMuseum':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2d2016 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(90deg, #d4af37 0, #d4af37 1px, transparent 1px, transparent 80px), repeating-linear-gradient(180deg, #d4af37 0, #d4af37 1px, transparent 1px, transparent 80px)' }} />
          <div className={`${sz} overflow-hidden z-10`}
            style={{ border: '6px solid #d4af37', boxShadow: '0 0 40px rgba(212,175,55,0.4), inset 0 0 20px rgba(0,0,0,0.3)', animation: 'mvFloat 10s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover sepia-[0.2]" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-amber-400/70 text-sm font-cinzel tracking-widest">Floating Museum</div>}
        </div>
      );

    case 'GoldenHour':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1c0a00 0%, #7c2d12 50%, #dc8a0a 100%)' }}>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/40 rounded-full blur-3xl" style={{ animation: 'mvPulse 4s ease-in-out infinite' }} />
          <div className={`${sz} rounded-xl overflow-hidden z-10`}
            style={{ boxShadow: '0 0 40px rgba(245,158,11,0.5)', animation: 'mvFloat 7s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover sepia-[0.4] contrast-110" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-amber-300/80 text-sm font-cinzel tracking-widest">Golden Hour</div>}
        </div>
      );

    case 'OceanMemories':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001e3c 0%, #003d6e 60%, #004d8c 100%)' }}>
          {[...Array(fullscreen ? 12 : 5)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-cyan-400/20 blur-xl"
              style={{ width: `${20 + i * 10}px`, height: `${20 + i * 10}px`, bottom: `${5 + i * 8}%`, left: `${5 + i * 9}%`, animation: `mvRise ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
          ))}
          <div className={`${sz} rounded-2xl overflow-hidden z-10`}
            style={{ border: '2px solid rgba(6,182,212,0.5)', boxShadow: '0 0 30px rgba(6,182,212,0.3)', animation: 'mvFloat 9s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover hue-rotate-180 saturate-150" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-cyan-300/80 text-sm font-cinzel tracking-widest">Ocean Memories</div>}
        </div>
      );

    case 'VintageBook':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2d1f0e 0%, #3d2b16 100%)' }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/old-mathematics.png)' }} />
          <div className={`${sz} z-10`}
            style={{ border: '4px solid #92400e', boxShadow: '4px 4px 20px rgba(0,0,0,0.6)', transform: 'rotate(-2deg)', animation: 'mvWiggle 8s ease-in-out infinite' }}>
            <img src={dummyImg} className="w-full h-full object-cover sepia-[0.8] contrast-90" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-amber-700/80 text-sm font-cinzel tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>Vintage Book</div>}
        </div>
      );

    case 'CampfireNight':
      return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: '#0c0902' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-orange-600/40 blur-2xl rounded-full" style={{ animation: 'mvFlicker 1.5s ease-in-out infinite alternate' }} />
          {[...Array(fullscreen ? 15 : 6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-yellow-400/70"
              style={{ width: 2, height: 2, bottom: `${10 + Math.random() * 30}%`, left: `${Math.random() * 100}%`, animation: `mvFirefly ${3 + Math.random() * 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s` }} />
          ))}
          <div className={`${sz} rounded-lg overflow-hidden z-10`}
            style={{ border: '2px solid rgba(234,88,12,0.5)', boxShadow: '0 0 30px rgba(234,88,12,0.3)', animation: 'mvFlicker 3s ease-in-out infinite alternate' }}>
            <img src={dummyImg} className="w-full h-full object-cover sepia-[0.3] contrast-110" alt="Preview" />
          </div>
          {fullscreen && <div className="absolute bottom-10 text-orange-400/80 text-sm font-cinzel tracking-widest">Campfire Night</div>}
        </div>
      );

    default:
      return <div className="absolute inset-0 bg-slate-900" />;
  }
};

// ─── Fullscreen Preview Modal ────────────────────────────────────────────────
const FullscreenPreview = ({ theme, onClose }: { theme: ThemeMetadata; onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
    <div className="relative w-full h-full max-w-5xl max-h-[85vh] m-8 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <ThemePreview theme={theme} fullscreen />
      {/* Overlay info */}
      <div className="absolute top-6 left-6 z-20">
        <h2 className="text-2xl font-cinzel font-bold text-white drop-shadow-lg">{theme.name}</h2>
        <p className="text-sm text-white/60 mt-1 max-w-xs">{theme.description}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);

// ─── Performance badge colors ────────────────────────────────────────────────
const perfColor = (p: string) => {
  if (p === 'Low') return 'bg-emerald-500/20 text-emerald-300';
  if (p === 'Medium') return 'bg-amber-500/20 text-amber-300';
  return 'bg-red-500/20 text-red-300';
};

// ─── Main Panel ──────────────────────────────────────────────────────────────
export const ThemePanel: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeMetadata | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const { groupId, groupDetails, updateGroupDetailsLocally } = useEditorStore();

  const handleSetTheme = async (theme: ThemeMetadata) => {
    setActiveTheme(theme.id);
    if (groupId) {
      setSaving(theme.id);
      try {
        updateGroupDetailsLocally({ theme: theme.id });
        showToast(`Theme "${theme.name}" applied locally. Deploy to publish!`, 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to update theme', 'error');
      } finally {
        setSaving(null);
      }
    } else {
      showToast('No group open. Select a group first.', 'error');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-6xl mx-auto animate-in fade-in duration-300">
      <style>{`
        @keyframes mvFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(2deg); } }
        @keyframes mvGlitch { 0%,100% { transform: translate(0); } 20% { transform: translate(-3px,3px); } 40% { transform: translate(-3px,-3px); } 60% { transform: translate(3px,3px); } 80% { transform: translate(3px,-3px); } }
        @keyframes mvDrift { 0% { transform: translateX(0); } 100% { transform: translateX(30px); } }
        @keyframes mvPulse { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.2); } }
        @keyframes mvRise { 0%,100% { transform:translateY(0) scale(1); opacity:0.4; } 50% { transform:translateY(-20px) scale(1.3); opacity:0.9; } }
        @keyframes mvWiggle { 0%,100% { transform:rotate(-2deg); } 50% { transform:rotate(2deg); } }
        @keyframes mvFlicker { 0% { opacity:0.7; } 100% { opacity:1; } }
        @keyframes mvFirefly { 0%,100% { transform:translateY(0); opacity:0.4; } 50% { transform:translateY(-20px); opacity:1; } }
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-white mb-2 flex items-center gap-3">
          <Palette className="text-indigo-400" />
          Theme Registry
        </h1>
        <p className="text-slate-400 text-sm">
          {groupId ? 'Click "Set Theme" to apply a theme to the current group.' : 'Open a group to apply a theme.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {THEME_REGISTRY.map(theme => {
          const isActive = activeTheme === theme.id || (groupDetails as any)?.theme === theme.id;
          const isSaving = saving === theme.id;
          return (
            <div
              key={theme.id}
              className={`bg-black/40 rounded-2xl overflow-hidden transition-all group cursor-pointer relative border ${
                isActive ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Theme animated preview */}
              <div className="aspect-video relative overflow-hidden">
                <ThemePreview theme={theme} />

                {/* Hover overlay with buttons */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4 gap-2">
                  {/* Preview button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewTheme(theme); }}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                  >
                    <Play size={12} /> Preview
                  </button>
                  {/* Set theme button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetTheme(theme); }}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/30 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-60"
                  >
                    {isSaving ? <span className="animate-pulse">Saving...</span> : <><Star size={12} /> Set Theme</>}
                  </button>
                </div>

                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm z-20">
                    <CheckCircle2 size={10} /> Active
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-white mb-1">{theme.name}</h3>
                <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{theme.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 ${perfColor(theme.performance)}`}>
                    {theme.performance === 'High' ? <Zap size={9} /> : theme.performance === 'Medium' ? <Cpu size={9} /> : null}
                    {theme.performance}
                  </span>
                  <span className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0" style={{ backgroundColor: theme.primaryColor }} title={theme.primaryColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Preview Modal */}
      {previewTheme && (
        <FullscreenPreview theme={previewTheme} onClose={() => setPreviewTheme(null)} />
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};
