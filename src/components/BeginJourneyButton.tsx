import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Compass, Sparkles, X, Heart } from 'lucide-react';

interface BeginJourneyButtonProps {
  isVisible: boolean;
  onPlaySound?: () => void;
}

export const BeginJourneyButton: React.FC<BeginJourneyButtonProps> = ({
  isVisible,
  onPlaySound,
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Play sound if available
    if (onPlaySound) {
      onPlaySound();
    }

    // 2. Confetti burst centered at button click
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { x, y },
      colors: ['#FCD34D', '#F59E0B', '#93C5FD', '#FFFFFF', '#C084FC'],
      shapes: ['star', 'circle'],
      scalar: 1.2,
      zIndex: 100,
    });

    // 3. Show emotional memory reflection message
    setShowModal(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 z-20"
      >
        <button
          onClick={handleClick}
          className="group relative inline-flex items-center justify-center px-10 py-4 overflow-hidden rounded-full font-sans-clean font-medium tracking-widest uppercase text-xs text-white transition-all duration-300 bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/10 hover:border-white/40 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer"
        >
          {/* Animated background subtle sheen */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Icon & Label */}
          <div className="relative flex items-center space-x-3 z-10">
            <Compass className="w-4 h-4 text-white/80 transition-transform duration-700 ease-out group-hover:rotate-180" />
            <span className="tracking-[0.2em] font-medium text-white">
              Begin the Journey
            </span>
            <Sparkles className="w-3.5 h-3.5 text-white/80 opacity-80 group-hover:opacity-100 transition-opacity animate-pulse" />
          </div>
        </button>
      </motion.div>

      {/* Modal / Memory Reflection Pop-over (Keeps user on Page 1 strictly without routing) */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full p-8 rounded-3xl glass-card border border-amber-300/30 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-[#090d21]/90"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon Header */}
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(252,211,77,0.2)]">
                <Heart className="w-7 h-7 text-amber-300 fill-amber-300/40 animate-pulse" />
              </div>

              {/* Title */}
              <h3 className="font-cinzel text-2xl font-bold text-amber-100 text-glow-gold mb-3">
                The Journey Is Infinite
              </h3>

              {/* Message */}
              <p className="font-playfair text-slate-200 text-base md:text-lg leading-relaxed mb-6">
                True friendship is an eternal constellation in the universe of our lives.
                Every laughter shared, every quiet silence understood, and every memory created
                lights up our infinite sky.
              </p>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-400/20 text-amber-200/90 font-sans-clean text-xs tracking-wider uppercase mb-6">
                ✨ Cherish those who shine beside you.
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-full font-cinzel text-xs uppercase tracking-widest bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-200 transition-all cursor-pointer"
              >
                Continue Journey
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
