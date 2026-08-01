import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioManagerProps {
  ambientUrl?: string;
  endingUrl?: string;
  isEnding?: boolean;
}

export const AudioManager: React.FC<AudioManagerProps> = ({ ambientUrl, endingUrl, isEnding }) => {
  const [hasInteracted, setHasInteracted] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const endingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ambientUrl && !ambientRef.current) {
      ambientRef.current = new Audio(ambientUrl);
      ambientRef.current.loop = true;
      ambientRef.current.volume = 0;
      ambientRef.current.preload = 'auto';
    }
    if (endingUrl && !endingRef.current) {
      endingRef.current = new Audio(endingUrl);
      endingRef.current.loop = false;
      endingRef.current.volume = 0;
      endingRef.current.preload = 'auto';
    }

    const triggerPlayOnUserAction = () => {
      if (ambientRef.current && ambientRef.current.paused) {
        ambientRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', triggerPlayOnUserAction, { once: true });
    window.addEventListener('click', triggerPlayOnUserAction, { once: true });
    window.addEventListener('scroll', triggerPlayOnUserAction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', triggerPlayOnUserAction);
      window.removeEventListener('click', triggerPlayOnUserAction);
      window.removeEventListener('scroll', triggerPlayOnUserAction);
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
      if (endingRef.current) {
        endingRef.current.pause();
        endingRef.current = null;
      }
    };
  }, [ambientUrl, endingUrl]);

  // Handle Playback and Fades
  useEffect(() => {
    if (!hasInteracted) return;

    const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration = 1000) => {
      if (isMuted) targetVolume = 0;
      
      const startVolume = audio.volume;
      const steps = 20;
      const stepTime = duration / steps;
      const volumeStep = (targetVolume - startVolume) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        let newVolume = startVolume + volumeStep * currentStep;
        if (newVolume < 0) newVolume = 0;
        if (newVolume > 1) newVolume = 1;
        
        audio.volume = newVolume;

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepTime);
    };

    if (isEnding && endingRef.current) {
      // Fade out ambient
      if (ambientRef.current) {
        fadeAudio(ambientRef.current, 0, 1000);
        setTimeout(() => ambientRef.current?.pause(), 1000);
      }
      // Fade in ending
      endingRef.current.play().catch(console.error);
      fadeAudio(endingRef.current, isMuted ? 0 : 0.8, 1000);
    } else if (ambientRef.current) {
      // Normal playback
      ambientRef.current.play().catch(console.error);
      fadeAudio(ambientRef.current, isMuted ? 0 : 0.5, 2000);
      
      if (endingRef.current) {
        fadeAudio(endingRef.current, 0, 500);
        setTimeout(() => endingRef.current?.pause(), 500);
      }
    }
  }, [hasInteracted, isEnding, isMuted]);

  // If no audio provided, return null
  if (!ambientUrl && !endingUrl) return null;

  return (
    <>
      {/* Enable Sound Overlay */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <button
                  onClick={() => setHasInteracted(true)}
                  className="group flex flex-col items-center justify-center space-y-4 cursor-pointer"
                >
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all group-hover:scale-110">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-serif text-white tracking-widest uppercase">Enable Sound</h2>
                  <p className="text-white/50 text-sm max-w-xs">For the best cinematic experience, please allow audio playback.</p>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Mute Toggle */}
      {hasInteracted && (
        <div className="absolute bottom-6 right-6 z-[90]">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white/50" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        </div>
      )}
    </>
  );
};
