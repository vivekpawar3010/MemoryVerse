import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Disc } from 'lucide-react';
import { motion } from 'motion/react';

interface BackgroundMusicProps {
  // Optional audio source path for future integration
  audioSrc?: string;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);

  // Synthesize soft ambient space chord using Web Audio API (100% royalty free & asset-less)
  const startSpaceAmbientSynth = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Space ambient chord frequencies (C Major 7th / F Major 9th / A Minor)
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [174.61, 220.0, 261.63, 349.23],  // Fmaj7
      [220.0, 261.63, 329.63, 392.0],   // Am7
      [196.0, 246.94, 293.66, 392.0],   // G
    ];

    let currentChordIndex = 0;

    const playChord = () => {
      if (!audioCtxRef.current || ctx.state !== 'running') return;

      const chord = chords[currentChordIndex];
      currentChordIndex = (currentChordIndex + 1) % chords.length;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Soft sine wave for celestial atmosphere
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Soft attack & long decay envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 8);
      });
    };

    playChord();
    synthIntervalRef.current = window.setInterval(playChord, 7000);
  };

  const stopSpaceAmbientSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      if (audioRef.current && audioSrc) {
        audioRef.current.pause();
      }
      stopSpaceAmbientSynth();
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioSrc) {
        audioRef.current.play().catch(() => {
          // Fallback to ambient synth if custom file fails
          startSpaceAmbientSynth();
        });
      } else {
        startSpaceAmbientSynth();
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      stopSpaceAmbientSynth();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Optional future HTML5 Audio tag for custom mp3 file integration */}
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} loop preload="auto" />
      )}

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 2.2 }}
        onClick={toggleSound}
        className="group relative flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        title={isPlaying ? 'Mute Cinematic Ambient Sound' : 'Play Cinematic Audio Track'}
      >
        {/* Audio Wave Visualizer */}
        <div className="flex gap-1 items-end h-3">
          {[1, 0.6, 0.8, 0.4].map((heightRatio, i) => (
            <motion.div
              key={i}
              className={`w-[2px] rounded-full ${isPlaying ? 'bg-white' : 'bg-white/40'}`}
              animate={isPlaying ? { scaleY: [0.3, heightRatio, 0.3] } : { scaleY: heightRatio }}
              transition={
                isPlaying
                  ? {
                      duration: 0.8 + i * 0.2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }
                  : {}
              }
              style={{ height: '100%', transformOrigin: 'bottom' }}
            />
          ))}
        </div>

        <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold font-sans-clean">
          {isPlaying ? 'Cinematic Audio Playing' : 'Cinematic Audio Track'}
        </span>

        {/* Small glowing circle indicator */}
        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isPlaying ? 'bg-amber-300 shadow-[0_0_6px_#FCD34D]' : 'bg-white/50'}`} />
        </div>
      </motion.button>
    </div>
  );
};
