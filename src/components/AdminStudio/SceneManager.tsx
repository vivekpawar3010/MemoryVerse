import React from 'react';
import { useEditorStore } from '../../store/EditorStore';
import { Film } from 'lucide-react';

export const SceneManager: React.FC = () => {
  const { items } = useEditorStore();

  return (
    <div className="w-full h-48 bg-[#0a0f26] border-t border-indigo-500/30 flex flex-col shrink-0">
      <div className="p-2 px-4 border-b border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="text-indigo-400 w-4 h-4" />
          <h2 className="font-cinzel text-sm font-bold text-indigo-200">Scene Sequence</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto p-4 flex items-center gap-4">
        {/* Intro */}
        <div className="w-32 h-full bg-black/60 border border-slate-700 rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1">Intro</span>
          <span className="text-xs text-white">Title Screen</span>
        </div>
        
        {/* Middle Items */}
        {items.map((item, index) => (
          <div key={item.id} className="w-32 h-full bg-black/40 border border-slate-800 rounded-lg p-2 flex flex-col shrink-0">
            <span className="text-[10px] uppercase text-indigo-500 font-bold mb-1 line-clamp-1">{item.type} {index + 1}</span>
            <span className="text-xs text-slate-300 line-clamp-2 leading-snug">
              {item.titleOrAuthor || item.textContent || `Item ${index + 1}`}
            </span>
          </div>
        ))}
        
        {/* Ending */}
        <div className="w-32 h-full bg-black/60 border border-slate-700 rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1">Ending</span>
          <span className="text-xs text-white">Final Message</span>
        </div>
      </div>
    </div>
  );
};
