import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ICONS = ['✨', '💖', '⭐', '💫', '💕', '🌟'];

interface Particle {
  id: number;
  icon: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

export const FloatingEffects: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const generateParticle = (id: number): Particle => ({
      id,
      icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      left: Math.random() * 100, // percentage
      duration: 10 + Math.random() * 15, // 10-25s
      delay: Math.random() * 10,
      size: 10 + Math.random() * 14, // 10px - 24px
    });

    // Keep around 30 particles on screen
    setParticles(Array.from({ length: 30 }).map((_, i) => generateParticle(i)));

    // Every few seconds, replace a random particle to keep it feeling continuous and endless
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = [...prev];
        const replaceIdx = Math.floor(Math.random() * next.length);
        next[replaceIdx] = generateParticle(Date.now());
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: '110vh', opacity: 0, x: 0 }}
            animate={{ 
              y: '-10vh', 
              opacity: [0, 0.8, 0.8, 0],
              x: Math.sin(p.id) * 50 // Wavy motion
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "linear",
              repeat: Infinity
            }}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
            }}
          >
            {p.icon}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
