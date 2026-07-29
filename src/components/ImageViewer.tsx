import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { PhotoItem } from '../types';

interface ImageViewerProps {
  photos: PhotoItem[];
  initialActiveId: string | null;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ photos, initialActiveId, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = photos.findIndex(p => p.id === initialActiveId);
    return idx >= 0 ? idx : 0;
  });

  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  // Preload adjacent images
  useEffect(() => {
    const preload = (index: number) => {
      if (index >= 0 && index < photos.length) {
        const img = new Image();
        img.src = photos[index].imageUrl;
      }
    };
    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }, [currentIndex, photos]);

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setScale(1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setScale(1);
    }
  };

  if (!photos.length) return null;
  
  const currentPhoto = photos[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl touch-none"
        onClick={(e) => {
          if (e.target === e.currentTarget && scale === 1) onClose();
        }}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
          <div className="text-white/50 text-sm font-mono tracking-widest pointer-events-auto">
            {currentIndex + 1} / {photos.length}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto cursor-pointer backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: scale }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              drag={scale > 1}
              dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
              onDoubleClick={() => setScale(s => s === 1 ? 2 : 1)}
            >
              <img 
                src={currentPhoto.imageUrl} 
                alt={currentPhoto.caption}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                draggable={false} // Disable native drag
              />
              
              {/* Caption Overlay inside viewer */}
              {currentPhoto.caption && scale === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white text-sm max-w-[80%] text-center"
                >
                  {currentPhoto.caption}
                  {(currentPhoto.date || currentPhoto.location) && (
                    <div className="text-white/50 text-xs mt-1 font-mono">
                      {currentPhoto.date} {currentPhoto.date && currentPhoto.location && '•'} {currentPhoto.location}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {currentIndex < photos.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-md"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        
        {/* Zoom Hint */}
        <div className="absolute bottom-6 left-6 text-white/30 text-xs flex items-center space-x-2">
          <ZoomIn className="w-4 h-4" />
          <span>Double-click to zoom</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
