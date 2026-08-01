import React, { useEffect } from 'react';

interface ProtectionWrapperProps {
  children: React.ReactNode;
  groupName?: string;
  memoryId?: string;
  showWatermark?: boolean;
}

export const ProtectionWrapper: React.FC<ProtectionWrapperProps> = ({ 
  children, 
  groupName, 
  memoryId,
  showWatermark = true 
}) => {
  
  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu on input fields for usability if needed, otherwise block
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
    };

    // Disable common save shortcuts (Ctrl+S, Cmd+S, Ctrl+C, Cmd+C)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'c')) {
        e.preventDefault();
      }
    };

    // Disable drag start globally to prevent dragging images to desktop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-full select-none"
      style={{
        // Prevent long-press context menu on iOS/Android
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
      
      {/* Subtle Watermark overlay */}
      {showWatermark && (groupName || memoryId) && (
        <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden opacity-[0.03] mix-blend-overlay flex flex-wrap items-center justify-center gap-20 p-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="transform -rotate-45 text-white font-serif text-2xl whitespace-nowrap">
              {groupName} {memoryId && `| ${memoryId}`}
            </div>
          ))}
        </div>
      )}

      {/* Floating Developer Info Badge */}
      <div className="fixed bottom-3 right-3 z-[9999] pointer-events-auto">
        <a 
          href="https://vivekpawar.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-[10px] text-slate-300 hover:text-amber-300 transition-all shadow-lg group"
          title="Visit Vivek Pawar's Developer Portfolio"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-sans-clean font-medium tracking-wide">Developer: Vivek Pawar</span>
        </a>
      </div>
    </div>
  );
};
