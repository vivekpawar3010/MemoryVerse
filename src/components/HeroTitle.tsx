import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, User, Heart } from 'lucide-react';

interface HeroTitleProps {
  isVisible: boolean;
  visitorName: string;
  onVisitorNameChange: (name: string) => void;
  onWishTrigger?: (name?: string) => void;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({
  isVisible,
  visitorName,
  onVisitorNameChange,
  onWishTrigger,
}) => {
  const [fillProgress, setFillProgress] = useState(0); // 0 to 100
  const [isFilling, setIsFilling] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  // Auto-trigger 2-second water fill animation once hero becomes visible
  useEffect(() => {
    if (isVisible && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      triggerGreenWaterFill();
    }
  }, [isVisible]);

  const triggerGreenWaterFill = () => {
    if (isFilling) return;
    setIsFilling(true);
    setFillProgress(0);

    const startTime = performance.now();
    const fillDuration = 2000; // Exactly 2 seconds

    const animateFill = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(100, (elapsed / fillDuration) * 100);
      setFillProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(animateFill);
      } else {
        setIsFilling(false);
        if (onWishTrigger) {
          onWishTrigger(visitorName);
        }
      }
    };

    requestAnimationFrame(animateFill);
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto z-10 select-none">
      {/* Decorative top badge */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center space-x-2 mb-3 px-3.5 py-1 rounded-full bg-white/[0.04] border border-amber-300/20 backdrop-blur-md shadow-[0_0_15px_rgba(252,211,77,0.1)] pointer-events-auto"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span className="font-sans-clean text-[11px] uppercase tracking-[0.2em] text-amber-200/90 font-semibold">
          A Celestial Celebration
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      </motion.div>

      {/* Main Title: Happy Friendship Day (compact responsive size to prevent overflow) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative group mb-3"
      >
        <h1 className="font-serif-sleek text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white leading-tight text-glow-sleek">
          Happy <br />
          <span className="text-white font-medium drop-shadow-2xl">
            Friendship Day
          </span>
        </h1>

        {/* Soft background aura behind text */}
        <div className="absolute -inset-x-8 -inset-y-4 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 blur-2xl rounded-full -z-10 pointer-events-none" />
      </motion.div>

      {/* Interactive Green Liquid Fill Heart Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="flex flex-col items-center justify-center mb-3"
      >
        <div className="flex items-center space-x-4 my-1 w-64 sm:w-80">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-emerald-400" />

          {/* Liquid Green Heart Container Button */}
          <button
            onClick={triggerGreenWaterFill}
            disabled={isFilling}
            title="Click green heart to fill with liquid & trigger star shower wish!"
            className="relative w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-full bg-emerald-950/40 border-2 border-emerald-400/60 hover:border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center group overflow-hidden"
          >
            {/* SVG Heart with Liquid Water Clip Effect */}
            <svg
              viewBox="0 0 24 24"
              className="w-11 h-11 sm:w-14 sm:h-14 relative z-10 transition-transform group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.8))' }}
            >
              <defs>
                <clipPath id="greenHeartClip">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </clipPath>

                <linearGradient id="emeraldWaterGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>

              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="rgba(6, 78, 59, 0.3)"
                stroke="#34D399"
                strokeWidth="1.5"
              />

              <g clipPath="url(#greenHeartClip)">
                <rect
                  x="0"
                  y={24 - (24 * fillProgress) / 100}
                  width="24"
                  height="24"
                  fill="url(#emeraldWaterGrad)"
                  className="transition-all ease-linear"
                />

                {fillProgress > 0 && fillProgress < 100 && (
                  <ellipse
                    cx="12"
                    cy={24 - (24 * fillProgress) / 100}
                    rx="12"
                    ry="1.5"
                    fill="#6EE7B7"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )}
              </g>
            </svg>

            <div
              className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md pointer-events-none transition-all duration-300"
              style={{
                opacity: 0.3 + (fillProgress / 100) * 0.7,
                transform: `scale(${1 + (fillProgress / 100) * 0.25})`,
              }}
            />
          </button>

          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-emerald-400/40 to-emerald-400" />
        </div>
      </motion.div>

      {/* Enter Your Name Field below the Green Heart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="w-full max-w-sm mb-3 flex flex-col items-center"
      >
        <div className="relative flex items-center w-full max-w-xs">
          <User className="absolute left-3.5 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            value={visitorName}
            onChange={(e) => onVisitorNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                triggerGreenWaterFill();
              }
            }}
            placeholder="Enter your name..."
            className="w-full pl-10 pr-16 py-2 bg-emerald-950/20 border border-emerald-400/50 rounded-full text-xs font-semibold text-emerald-100 placeholder-emerald-300/50 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-400/50 transition-all text-center"
          />
          {visitorName.trim() && (
            <button
              onClick={() => triggerGreenWaterFill()}
              title="Click to wish with your name!"
              className="absolute right-1.5 px-2.5 py-1 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 text-[10px] font-bold text-emerald-200 border border-emerald-400/50 transition-all cursor-pointer"
            >
              Wish! ✨
            </button>
          )}
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.2, ease: 'easeOut' }}
        className="font-sans-clean font-light text-sm sm:text-base md:text-lg text-slate-300 tracking-wide opacity-90 max-w-xl leading-relaxed"
      >
        "Every friendship is a journey filled with unforgettable memories."
      </motion.p>
    </div>
  );
};



