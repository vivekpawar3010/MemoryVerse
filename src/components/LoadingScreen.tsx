import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing Space Coordinates...');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // 2.5 seconds total loading animation
    const duration = 2500;
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const messages = [
      'Initializing Space Coordinates...',
      'Mapping Friendship Constellations...',
      'Igniting Glowing Memory Stars...',
      'Entering Memory Journey...',
    ];

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(nextProgress);

      if (nextProgress > 25 && nextProgress <= 50) {
        setStatusMessage(messages[1]);
      } else if (nextProgress > 50 && nextProgress <= 80) {
        setStatusMessage(messages[2]);
      } else if (nextProgress > 80) {
        setStatusMessage(messages[3]);
      }

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsFinished(true);
          setTimeout(() => {
            onLoadingComplete();
          }, 800); // fade out duration
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050816] text-white select-none px-4"
        >
          {/* Ambient center glow */}
          <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute w-72 h-72 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Central Logo / Glowing Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative mb-8 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>

            {/* Glowing orbiting ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-3 border border-dashed border-amber-400/20 rounded-full pointer-events-none"
            />
          </motion.div>

          {/* Animated Glowing Dots */}
          <div className="flex items-center space-x-2 mb-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#FCD34D]"
              />
            ))}
          </div>

          {/* Title / Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-cinzel text-xl md:text-2xl tracking-[0.2em] font-semibold text-center text-amber-100 text-glow-gold mb-2"
          >
            MEMORY JOURNEY
          </motion.h2>

          <p className="font-sans-clean text-xs tracking-widest text-blue-200/70 uppercase mb-8 h-5 text-center transition-all duration-300">
            {statusMessage}
          </p>

          {/* Progress Bar Container */}
          <div className="w-64 md:w-80 h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner relative">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-blue-400 rounded-full shadow-[0_0_12px_rgba(252,211,77,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>

          {/* Percentage Indicator */}
          <div className="mt-3 font-mono text-xs text-amber-200/80 tracking-widest">
            {progress}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
