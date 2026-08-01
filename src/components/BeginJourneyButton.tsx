import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Compass, Sparkles, X, Heart, Lock } from 'lucide-react';

interface BeginJourneyButtonProps {
  isVisible: boolean;
  disabled?: boolean;
  onPlaySound?: () => void;
  onContinue?: () => void;
}

export const BeginJourneyButton: React.FC<BeginJourneyButtonProps> = ({
  isVisible,
  disabled = false,
  onPlaySound,
  onContinue,
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

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
        transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 sm:mt-8 z-20 flex flex-col items-center"
      >
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`group relative inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-4 overflow-hidden rounded-full font-sans-clean font-medium tracking-widest uppercase text-xs transition-all duration-300 backdrop-blur-md border ${
            disabled
              ? 'bg-white/[0.03] border-white/10 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
              : 'bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-indigo-500/20 border-emerald-400/50 hover:border-emerald-300 text-white hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] cursor-pointer'
          }`}
        >
          {/* Animated background subtle sheen when enabled */}
          {!disabled && (
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}

          {/* Icon & Label */}
          <div className="relative flex items-center space-x-3 z-10">
            {disabled ? (
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            ) : (
              <Compass className="w-4 h-4 text-emerald-300 transition-transform duration-700 ease-out group-hover:rotate-180 shrink-0" />
            )}
            
            <span className={`tracking-[0.2em] font-bold ${disabled ? 'text-slate-500' : 'text-emerald-100'}`}>
              Begin the Journey
            </span>

            {disabled ? (
              <span className="text-[10px] text-amber-300/80 font-normal uppercase tracking-normal hidden sm:inline">
                (Enter Name First)
              </span>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 opacity-90 group-hover:opacity-100 transition-opacity animate-pulse shrink-0" />
            )}
          </div>
        </button>

        {disabled && (
          <p className="mt-2 text-[11px] text-amber-300/70 font-semibold tracking-wider animate-pulse">
            🔒 Enter your name above to unlock the journey
          </p>
        )}
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
                onClick={() => {
                  setShowModal(false);
                  if (onContinue) onContinue();
                }}
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
