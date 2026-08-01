import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/EditorStore';
import { Layers, Volume2, Eye, EyeOff, Film, LayoutTemplate, Music, Play, Pause, Check, X, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useToast, Toast } from '../ui/Toast';
import { BACKGROUND_AUDIO, SOUND_EFFECTS, ENDING_AUDIO, AudioTrack, getStoredCustomTracks } from '../themes/AudioRegistry';
import { uploadMediaToSupabaseBucket } from '../../lib/supabase';

const RichTextArea = ({ value, onChange, label }: { value: string, onChange: (v: string) => void, label: string }) => {
  const insertText = (prefix: string, suffix: string) => {
    onChange(value + prefix + suffix);
  };
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">{label}</label>
      <div className="bg-black/40 border border-slate-700 rounded-lg overflow-hidden flex flex-col focus-within:border-indigo-500 transition-colors">
        <div className="flex items-center gap-1 p-1.5 border-b border-slate-700/50 bg-white/5">
          <button onClick={() => insertText('**bold**', '')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded font-bold text-xs" title="Bold">B</button>
          <button onClick={() => insertText('*italic*', '')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded italic text-xs font-serif" title="Italic">I</button>
          <button onClick={() => insertText('[Link text](url)', '')} className="px-2 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded text-xs underline" title="Link">Link</button>
        </div>
        <textarea 
          className="w-full px-3 py-2 bg-transparent text-xs text-white focus:outline-none resize-none custom-scrollbar"
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your story..."
        />
      </div>
    </div>
  );
};

export const PropertyPanel: React.FC = () => {
  const { items, selectedItemIds, updateItemProps, groupDetails, updateGroupDetailsLocally } = useEditorStore();
  const item = selectedItemIds.length > 0 ? items.find(i => i.id === selectedItemIds[0]) : null;
  const [activeSection, setActiveSection] = useState<'basic' | 'transform' | 'visuals' | 'advanced'>('basic');
  const { toast, showToast, hideToast } = useToast();

  // Audio Library Selector modal state
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const [audioTarget, setAudioTarget] = useState<'ambient' | 'ending' | 'hover' | 'override' | null>(null);
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleUpdateGroup = (updates: any) => {
    updateGroupDetailsLocally(updates);
    showToast('Updated draft locally (Deploy to publish!)', 'success');
  };

  const handleGroupTextChange = (field: string, value: string) => {
    updateGroupDetailsLocally({ [field]: value });
  };

  const openAudioSelector = (target: 'ambient' | 'ending' | 'hover' | 'override') => {
    setAudioTarget(target);
    setShowAudioSelector(true);
  };

  const applySelectedAudioUrl = (url: string) => {
    if (audioTarget === 'ambient') {
      handleUpdateGroup({ ambientAudio: url });
    } else if (audioTarget === 'ending') {
      handleUpdateGroup({ endingAudio: url });
    } else if (audioTarget === 'hover' && item) {
      updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: url } });
    } else if (audioTarget === 'override' && item) {
      updateItemProps(item.id, { audioSettings: { ...item.audioSettings, url } });
    }
    setShowAudioSelector(false);
    audioPreviewRef.current?.pause();
    setPlayingPreviewUrl(null);
    showToast('Audio track applied!', 'success');
  };

  const togglePreviewPlay = (url: string) => {
    if (playingPreviewUrl === url) {
      audioPreviewRef.current?.pause();
      setPlayingPreviewUrl(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = url;
        audioPreviewRef.current.play().catch(() => {});
        setPlayingPreviewUrl(url);
      }
    }
  };

  const catalogTracks: AudioTrack[] = [
    ...BACKGROUND_AUDIO.filter(t => t.id !== 'custom_upload'),
    ...SOUND_EFFECTS,
    ...ENDING_AUDIO
  ];

  if (!item) {
    if (!groupDetails) {
      return (
        <div className="w-full h-full bg-[#0a0f26] border-l border-indigo-500/30 p-6 flex items-center justify-center text-slate-500 text-xs text-center">
          Loading space details...
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#0a0f26] border-l border-indigo-500/30 flex flex-col font-sans">
        <audio ref={audioPreviewRef} onEnded={() => setPlayingPreviewUrl(null)} />
        
        <div className="p-4 border-b border-indigo-500/30">
          <h2 className="font-cinzel text-lg font-bold text-indigo-200">Space Settings</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Global / Group Level</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar animate-in fade-in duration-300">
           
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">3D Environment Theme</label>
              <select 
                value={groupDetails.theme || 'CinematicSpace'} 
                onChange={(e) => handleUpdateGroup({ theme: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
              >
                 <option value="CinematicSpace">Cinematic Space (Starlight)</option>
                 <option value="CyberFuture">Cyber Future (Neon City)</option>
                 <option value="DreamClouds">Dream Clouds (Heavenly)</option>
                 <option value="FloatingMuseum">Floating Museum (Art Gallery)</option>
                 <option value="GoldenHour">Golden Hour (Sunset)</option>
                 <option value="OceanMemories">Ocean Memories (Deep Blue)</option>
                 <option value="VintageBook">Vintage Book (Nostalgic)</option>
                 <option value="CampfireNight">Campfire Night (Cozy)</option>
              </select>
            </div>

            {/* Animation Toggle Checklist */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Enabled Card Animations</label>
              <div className="space-y-2 bg-black/40 border border-slate-700 rounded-lg p-3">
                {[
                  { id: 'float', label: 'Floating Sway' },
                  { id: 'spin', label: 'Continuous Spin' },
                  { id: 'pulse', label: 'Pulse Scale' },
                  { id: 'orbit', label: 'Circular Orbit' },
                  { id: 'static', label: 'Clean Static' }
                ].map(anim => {
                  const enabledAnims = (groupDetails.themeSettings as any)?.enabledAnimations || ['float', 'spin', 'pulse', 'orbit', 'static'];
                  const isChecked = enabledAnims.includes(anim.id);
                  return (
                    <label key={anim.id} className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const nextAnims = e.target.checked
                            ? [...enabledAnims, anim.id]
                            : enabledAnims.filter(a => a !== anim.id);
                          handleUpdateGroup({
                            themeSettings: {
                              ...groupDetails.themeSettings,
                              enabledAnimations: nextAnims.length > 0 ? nextAnims : ['float']
                            }
                          });
                        }}
                        className="rounded border-slate-700 bg-transparent text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>{anim.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Preset Background Songs</label>
              <select 
                value={
                  groupDetails.ambientAudio === 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3' ? 'friendship_1' :
                  groupDetails.ambientAudio === 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2441951560.mp3' ? 'friendship_2' :
                  groupDetails.ambientAudio ? 'custom' : 'none'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'friendship_1') {
                    handleUpdateGroup({ ambientAudio: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3' });
                  } else if (val === 'friendship_2') {
                    handleUpdateGroup({ ambientAudio: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2441951560.mp3' });
                  } else if (val === 'none') {
                    handleUpdateGroup({ ambientAudio: null });
                  }
                }}
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
              >
                 <option value="none">No Background Music</option>
                 <option value="friendship_1">Acoustic Memories (Guitar)</option>
                 <option value="friendship_2">Endless Horizons (Piano & Strings)</option>
                 <option value="custom">Custom URL Link</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Ambient Audio URL</label>
                <button onClick={() => openAudioSelector('ambient')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Music size={11} /> Library
                </button>
              </div>
              <input 
                 type="text"
                 value={groupDetails.ambientAudio || ''}
                 placeholder="Custom audio link (https://...)"
                 onChange={(e) => handleGroupTextChange('ambientAudio', e.target.value)}
                 onBlur={(e) => handleUpdateGroup({ ambientAudio: e.target.value })}
                 className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Ending Audio URL (Final Message)</label>
                <button onClick={() => openAudioSelector('ending')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Music size={11} /> Library
                </button>
              </div>
              <input 
                 type="text"
                 value={groupDetails.endingAudio || ''}
                 placeholder="Custom audio link (https://...)"
                 onChange={(e) => handleGroupTextChange('endingAudio', e.target.value)}
                 onBlur={(e) => handleUpdateGroup({ endingAudio: e.target.value })}
                 className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 leading-relaxed">
                Space settings saved in local memory. Click the <b>"Deploy"</b> button at the top to publish your draft changes.
              </p>
            </div>
        </div>

        {/* Audio Tracks Library Modal Selector */}
        {showAudioSelector && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0a0f26] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                  <Music className="text-indigo-400" size={18} /> Select Audio Track
                </h3>
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all ${isUploadingModalAudio ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingModalAudio ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingModalAudio(true);
                        try {
                          const url = await uploadMediaToSupabaseBucket(file, 'media');
                          const customTrack = {
                            id: `custom_${Date.now()}`,
                            name: file.name.replace(/\.[^/.]+$/, ''),
                            url,
                            category: 'ambient' as const,
                            description: 'Custom uploaded track'
                          };
                          const existing = getStoredCustomTracks();
                          localStorage.setItem('custom_audio_tracks', JSON.stringify([customTrack, ...existing]));
                          applySelectedAudioUrl(url);
                        } catch (err) {
                          console.error('Modal audio upload error:', err);
                        } finally {
                          setIsUploadingModalAudio(false);
                        }
                      }}
                    />
                  </label>
                  <button onClick={() => { setShowAudioSelector(false); audioPreviewRef.current?.pause(); setPlayingPreviewUrl(null); }} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {catalogTracks.map(t => {
                  const isPlaying = playingPreviewUrl === t.url;
                  return (
                    <div key={t.id} className="p-3 bg-black/40 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between gap-3 transition-colors">
                      <button onClick={() => togglePreviewPlay(t.url)} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPlaying ? 'bg-indigo-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                      </div>
                      <button onClick={() => applySelectedAudioUrl(t.url)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0">
                        Apply
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Toast toast={toast} onClose={hideToast} />
      </div>
    );
  }

  // Filter selection based on Space checklist settings
  const enabledAnims = (groupDetails?.themeSettings as any)?.enabledAnimations || ['float', 'spin', 'pulse', 'orbit', 'static'];

  return (
    <div className="w-full h-full bg-[#0a0f26] border-l border-indigo-500/30 flex flex-col font-sans">
      <audio ref={audioPreviewRef} onEnded={() => setPlayingPreviewUrl(null)} />

      <div className="p-4 border-b border-indigo-500/30 flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-indigo-200">Properties</h2>
          <p className="text-[10px] text-slate-400 capitalize mt-0.5">Editing {item.type}</p>
        </div>
        <button 
          onClick={() => updateItemProps(item.id, { isVisible: !item.isVisible })}
          className={`p-2 rounded-lg transition-colors ${item.isVisible ? 'text-indigo-400 hover:bg-white/10' : 'text-slate-500 hover:text-white bg-red-500/10'}`}
          title="Toggle Visibility"
        >
          {item.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <div className="flex px-2 pt-2 gap-1 border-b border-indigo-500/30 overflow-x-auto custom-scrollbar">
        {[
          { id: 'basic', label: 'Basic' },
          { id: 'transform', label: '3D' },
          { id: 'visuals', label: 'Visuals' },
          { id: 'advanced', label: 'Advanced' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
              activeSection === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Basic Properties */}
        {activeSection === 'basic' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {(item.type === 'photo' || item.type === 'quote') && (
              <RichTextArea 
                label={item.type === 'photo' ? 'Caption' : 'Quote'}
                value={item.textContent || ''}
                onChange={(v) => updateItemProps(item.id, { textContent: v })}
              />
            )}
            
            {(item.type === 'video' || item.type === 'quote') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">{item.type === 'video' ? 'Title' : 'Author'}</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                    value={item.titleOrAuthor || ''}
                    onChange={(e) => updateItemProps(item.id, { titleOrAuthor: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Cover Photo URL</label>
                  <input 
                    type="text"
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                    value={item.coverPhotoUrl || ''}
                    onChange={(e) => updateItemProps(item.id, { themeSettings: { ...item.themeSettings, coverPhotoUrl: e.target.value }, coverPhotoUrl: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3D Transform Properties */}
        {activeSection === 'transform' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Scale</span>
                <span className="text-indigo-400">{item.scale?.toFixed(2) || '1.00'}</span>
              </label>
              <input 
                type="range" min="0.1" max="5" step="0.1"
                className="w-full accent-indigo-500"
                value={item.scale ?? 1}
                onChange={(e) => updateItemProps(item.id, { scale: parseFloat(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Distance (Depth)</span>
                <span className="text-indigo-400">{item.positionZ?.toFixed(1) || '0.0'}</span>
              </label>
              <input 
                type="range" min="-50" max="10" step="0.5"
                className="w-full accent-indigo-500"
                value={item.positionZ ?? 0}
                onChange={(e) => updateItemProps(item.id, { positionZ: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rotation (X, Y, Z)</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" step="0.1" value={item.rotationX ?? 0} onChange={(e) => updateItemProps(item.id, { rotationX: parseFloat(e.target.value) })} className="w-full px-2 py-1.5 bg-black/40 border border-slate-700 rounded-md text-xs text-white text-center font-mono focus:border-indigo-500 outline-none" />
                <input type="number" step="0.1" value={item.rotationY ?? 0} onChange={(e) => updateItemProps(item.id, { rotationY: parseFloat(e.target.value) })} className="w-full px-2 py-1.5 bg-black/40 border border-slate-700 rounded-md text-xs text-white text-center font-mono focus:border-indigo-500 outline-none" />
                <input type="number" step="0.1" value={item.rotationZ ?? 0} onChange={(e) => updateItemProps(item.id, { rotationZ: parseFloat(e.target.value) })} className="w-full px-2 py-1.5 bg-black/40 border border-slate-700 rounded-md text-xs text-white text-center font-mono focus:border-indigo-500 outline-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1"><Layers size={12}/> Layer Index</span>
                <span className="text-indigo-400">{item.layerIndex ?? 0}</span>
              </label>
              <input 
                type="number" step="1"
                className="w-full px-3 py-1.5 bg-black/40 border border-slate-700 rounded-md text-xs text-white focus:border-indigo-500 outline-none"
                value={item.layerIndex ?? 0}
                onChange={(e) => updateItemProps(item.id, { layerIndex: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
        )}

        {/* Style & Colors */}
        {activeSection === 'visuals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                <LayoutTemplate size={12}/> Frame Style
              </label>
              <select 
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                value={item.frameStyle || 'glass'}
                onChange={(e) => updateItemProps(item.id, { frameStyle: e.target.value })}
              >
                <option value="glass">Holographic Glass</option>
                <option value="solid">Solid Border</option>
                <option value="none">Borderless</option>
                <option value="neon">Neon Glow</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Glow Strength</span>
                <span className="text-indigo-400">{item.glowStrength?.toFixed(2) || '1.00'}</span>
              </label>
              <input 
                type="range" min="0" max="5" step="0.1"
                className="w-full accent-indigo-500"
                value={item.glowStrength ?? 1}
                onChange={(e) => updateItemProps(item.id, { glowStrength: parseFloat(e.target.value) })}
              />
            </div>

            {/* Quote Custom Colors */}
            {item.type === 'quote' && (
              <div className="space-y-5 pt-4 border-t border-slate-800">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">Quote Color Styling</h4>

                {/* Text Color */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Quote Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.themeSettings?.textColor || item.themeColor || '#ffffff'}
                      onChange={(e) => updateItemProps(item.id, {
                        themeSettings: { ...item.themeSettings, textColor: e.target.value },
                        themeColor: e.target.value
                      })}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {['#ffffff', '#fef08a', '#60a5fa', '#f472b6', '#34d399', '#c084fc'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateItemProps(item.id, {
                            themeSettings: { ...item.themeSettings, textColor: color },
                            themeColor: color
                          })}
                          className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform shadow"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Quote Frame Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.themeSettings?.backgroundColor || '#1e1b4b'}
                      onChange={(e) => updateItemProps(item.id, {
                        themeSettings: { ...item.themeSettings, backgroundColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {['#1e1b4b', '#0f172a', '#3b0764', '#064e3b', '#451a03', '#09090b'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateItemProps(item.id, {
                            themeSettings: { ...item.themeSettings, backgroundColor: color }
                          })}
                          className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform shadow"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Advanced Properties */}
        {activeSection === 'advanced' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                <Film size={12}/> Animation preset
              </label>
              <select 
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                value={item.animationType || 'float'}
                onChange={(e) => updateItemProps(item.id, { animationType: e.target.value })}
              >
                {enabledAnims.includes('float') && <option value="float">Soft Float</option>}
                {enabledAnims.includes('spin') && <option value="spin">Slow Spin</option>}
                {enabledAnims.includes('static') && <option value="static">Static</option>}
                {enabledAnims.includes('pulse') && <option value="pulse">Pulse</option>}
                {enabledAnims.includes('orbit') && <option value="orbit">Orbit around center</option>}
              </select>
            </div>

            {/* Hover sound selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Volume2 size={12}/> Hover Sound Effect
                </label>
                <button onClick={() => openAudioSelector('hover')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Music size={11} /> Library
                </button>
              </div>
              <select 
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                value={
                  item.audioSettings?.soundEffectUrl === 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav' ? 'chime' :
                  item.audioSettings?.soundEffectUrl === 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav' ? 'click' :
                  item.audioSettings?.soundEffectUrl === 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav' ? 'ping' :
                  item.audioSettings?.soundEffectUrl ? 'custom' : 'none'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'chime') {
                    updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav' } });
                  } else if (val === 'click') {
                    updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav' } });
                  } else if (val === 'ping') {
                    updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav' } });
                  } else if (val === 'none') {
                    updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: null } });
                  }
                }}
              >
                <option value="none">No Sound Effect</option>
                <option value="chime">Gentle Chime Preset</option>
                <option value="click">Camera Shutter Click Preset</option>
                <option value="ping">Soft Acoustic Ping Preset</option>
                <option value="custom">Custom Sound URL Link</option>
              </select>
            </div>

            {(item.audioSettings?.soundEffectUrl && !['https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav'].includes(item.audioSettings.soundEffectUrl)) && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Custom Sound URL</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                  value={item.audioSettings?.soundEffectUrl || ''}
                  onChange={(e) => updateItemProps(item.id, { audioSettings: { ...item.audioSettings, soundEffectUrl: e.target.value } })}
                />
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Volume2 size={12}/> Audio override
                </label>
                <button onClick={() => openAudioSelector('override')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Music size={11} /> Library
                </button>
              </div>
              <input 
                type="text"
                placeholder="Custom audio URL..."
                className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                value={item.audioSettings?.url || ''}
                onChange={(e) => updateItemProps(item.id, { audioSettings: { ...item.audioSettings, url: e.target.value } })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Audio Volume</span>
                <span className="text-indigo-400">{item.audioSettings?.volume || '1.0'}</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.1"
                className="w-full accent-indigo-500"
                value={item.audioSettings?.volume ?? 1}
                onChange={(e) => updateItemProps(item.id, { audioSettings: { ...item.audioSettings, volume: parseFloat(e.target.value) } })}
              />
            </div>
          </div>
        )}
        
      </div>

      {/* Audio Tracks Library Modal Selector */}
      {showAudioSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f26] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                <Music className="text-indigo-400" size={18} /> Select Audio Track
              </h3>
              <button onClick={() => { setShowAudioSelector(false); audioPreviewRef.current?.pause(); setPlayingPreviewUrl(null); }} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {catalogTracks.map(t => {
                const isPlaying = playingPreviewUrl === t.url;
                return (
                  <div key={t.id} className="p-3 bg-black/40 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between gap-3 transition-colors">
                    <button onClick={() => togglePreviewPlay(t.url)} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPlaying ? 'bg-indigo-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-300'}`}>
                      {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                    </div>
                    <button onClick={() => applySelectedAudioUrl(t.url)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0">
                      Apply
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};
