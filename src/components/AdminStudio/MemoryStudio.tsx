import React, { useEffect, useState } from 'react';
import { MediaLibrary } from './MediaLibrary';
import { MemoryTimeline } from './MemoryTimeline';
import { PropertyPanel } from './PropertyPanel';
import { PreviewRenderer } from './PreviewRenderer';
import { SceneManager } from './SceneManager';
import { useEditorStore, EditorItem } from '../../store/EditorStore';
import { VisitorGroupAccess } from '../../types';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

interface MemoryStudioProps {
  groupDetails: VisitorGroupAccess;
  onBack: () => void;
}

export const MemoryStudio: React.FC<MemoryStudioProps> = ({ groupDetails, onBack }) => {
  const { setItems, setGroupId, setGroupDetails } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setGroupId(groupDetails.groupId);
    setGroupDetails(groupDetails);
    // Map backend items to EditorItem type
    const items: EditorItem[] = [];
    
    groupDetails.photos?.forEach(p => {
      items.push({ ...p, type: 'photo', contentUrl: p.imageUrl, textContent: p.caption, titleOrAuthor: '' });
    });
    groupDetails.videos?.forEach(v => {
      items.push({ ...v, type: 'video', contentUrl: v.videoUrl, titleOrAuthor: v.title, textContent: '' });
    });
    groupDetails.quotes?.forEach(q => {
      items.push({ ...q, type: 'quote', textContent: q.quote, titleOrAuthor: q.author });
    });

    // Sort by order
    items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    setItems(items);
  }, [groupDetails, setItems, setGroupId, setGroupDetails]);

  return (
    <div className="w-full h-full bg-[#02040a] flex flex-col font-sans text-white overflow-hidden relative">
      
      {/* Floating Restore Button (when expanded) */}
      {isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 left-4 z-[60] bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-xs font-bold"
          title="Restore Panels"
        >
          <Minimize2 size={16} /> Restore Editor
        </button>
      )}

      {/* Top Header */}
      {!isExpanded && (
        <header className="h-14 bg-[#050816] border-b border-indigo-500/30 flex items-center justify-between px-4 shrink-0 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-cinzel text-sm font-bold tracking-wider text-indigo-200">MemoryStudio Pro</h1>
              <p className="text-[10px] text-slate-400 font-mono">Editing: {groupDetails.groupName}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-colors"
          >
            <Maximize2 size={14} /> Broad View
          </button>
        </header>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Library (Fixed Width) */}
        {!isExpanded && (
          <div className="w-72 shrink-0 h-full transition-all duration-300">
            <MediaLibrary />
          </div>
        )}

        {/* Center Panel: Timeline & Scene Manager (Flex) */}
        {!isExpanded && (
          <div className="flex flex-col w-80 shrink-0 border-r border-indigo-500/30 h-full transition-all duration-300">
            <div className="flex-1 overflow-hidden">
               <MemoryTimeline />
            </div>
            <SceneManager />
          </div>
        )}

        {/* Right Area: Live Preview & Property Inspector */}
        <div className="flex-1 flex h-full">
          {/* Live Preview takes remaining space */}
          <div className="flex-1 h-full bg-black relative">
            <PreviewRenderer />
          </div>

          {/* Property Inspector (Fixed Width on the far right) */}
          {!isExpanded && (
            <div className="w-72 shrink-0 h-full bg-[#050816]">
              <PropertyPanel />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
