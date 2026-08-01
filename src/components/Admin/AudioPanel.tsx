import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Upload, Trash2, CheckCircle2, Copy, Check, Volume2, Sparkles, Search, Loader2 } from 'lucide-react';
import { BACKGROUND_AUDIO, SOUND_EFFECTS, ENDING_AUDIO, AudioTrack, getStoredCustomTracks, saveCustomTracksToLocalStorage } from '../themes/AudioRegistry';
import { useToast, Toast } from '../ui/Toast';
import { uploadMediaToSupabaseBucket } from '../../lib/supabase';

export const AudioPanel: React.FC = () => {
  const builtInTracks = [
    ...BACKGROUND_AUDIO.filter(t => t.id !== 'custom_upload'),
    ...SOUND_EFFECTS,
    ...ENDING_AUDIO
  ];

  const [tracks, setTracks] = useState<AudioTrack[]>(builtInTracks);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'ambient' | 'effect' | 'ending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const custom = getStoredCustomTracks();
    if (custom && custom.length > 0) {
      setTracks([...custom, ...builtInTracks]);
    }
  }, []);

  const handlePlayToggle = (track: AudioTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(() => {});
        setPlayingId(track.id);
      }
    }
  };

  const handleCopyLink = (track: AudioTrack) => {
    navigator.clipboard.writeText(track.url);
    setCopiedId(track.id);
    showToast(`Copied ${track.name} link to clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const persistentUrl = await uploadMediaToSupabaseBucket(file, 'media');
      const newTrack: AudioTrack = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: persistentUrl,
        category: activeTab === 'all' ? 'ambient' : activeTab,
        description: 'Custom uploaded track'
      };

      const updatedCustomTracks = [newTrack, ...tracks.filter(t => t.id.startsWith('custom_'))];
      saveCustomTracksToLocalStorage(updatedCustomTracks);
      
      setTracks([newTrack, ...tracks]);
      showToast(`Uploaded ${newTrack.name} successfully!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload audio file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    const updated = tracks.filter(t => t.id !== id);
    setTracks(updated);
    
    const customOnly = updated.filter(t => t.id.startsWith('custom_'));
    saveCustomTracksToLocalStorage(customOnly);
    
    showToast('Track removed from library', 'success');
  };

  const filteredTracks = tracks.filter(t => {
    const matchesTab = activeTab === 'all' || t.category === activeTab;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-6xl mx-auto animate-in fade-in duration-300 font-sans">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-white mb-2 flex items-center gap-3">
            <Music className="text-indigo-400" />
            Audio Tracks & Sound Effects Library
          </h1>
          <p className="text-slate-400 text-sm">Browse, preview, copy links, and upload custom audio tracks for background music and card animations.</p>
        </div>
        <label className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 shrink-0 ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}>
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{isUploading ? 'Uploading Audio...' : 'Upload Custom Track'}</span>
          <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      {/* Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex p-1 bg-black/40 border border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'All Tracks' },
            { id: 'ambient', label: 'Ambient Music' },
            { id: 'effect', label: 'Card Sound Effects' },
            { id: 'ending', label: 'Ending Themes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTracks.map((track) => {
          const isPlaying = playingId === track.id;
          const isCopied = copiedId === track.id;
          const isCustom = track.id.startsWith('custom_');

          return (
            <div key={track.id} className={`bg-black/40 border rounded-2xl p-4 flex items-center gap-4 transition-all group ${isPlaying ? 'border-indigo-500/80 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-slate-800 hover:border-slate-600'}`}>
              
              <button 
                onClick={() => handlePlayToggle(track)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse' 
                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white'
                }`}
                title={isPlaying ? "Pause Preview" : "Play Preview"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {track.name}
                  </h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full shrink-0 ${
                    track.category === 'ambient' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    track.category === 'effect' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {track.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{track.description}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate mt-1 select-all">{track.url}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleCopyLink(track)}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isCopied 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Copy Direct Audio URL"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>

                {isCustom && (
                  <button 
                    onClick={(e) => handleDelete(track.id, e)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                    title="Remove Track"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-16">
          No audio tracks found matching your filter.
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};
