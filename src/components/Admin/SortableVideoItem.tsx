import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VideoItem } from '../../types';
import { ArrowUp, ArrowDown, Edit2, Trash2, Video } from 'lucide-react';

interface Props {
  video: VideoItem;
  idx: number;
  total: number;
  onMove: (type: 'video', idx: number, direction: 'up' | 'down') => void;
  onEdit: (type: 'video', item: any) => void;
  onDelete: (type: 'video', id: string) => void;
}

export const SortableVideoItem: React.FC<Props> = ({ video, idx, total, onMove, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl cursor-grab active:cursor-grabbing">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0"><Video className="w-5 h-5"/></div>
        <span className="text-sm text-slate-200 truncate">{video.title || video.videoUrl}</span>
      </div>
      <div className="flex items-center space-x-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
        <button onClick={() => onMove('video', idx, 'up')} className="p-2 text-slate-400 hover:text-white cursor-pointer transition-colors disabled:opacity-30" disabled={idx === 0}><ArrowUp className="w-4 h-4"/></button>
        <button onClick={() => onMove('video', idx, 'down')} className="p-2 text-slate-400 hover:text-white cursor-pointer transition-colors disabled:opacity-30" disabled={idx === total - 1}><ArrowDown className="w-4 h-4"/></button>
        <button onClick={() => onEdit('video', video)} className="p-2 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors"><Edit2 className="w-4 h-4"/></button>
        <button onClick={() => onDelete('video', video.id)} className="p-2 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  );
};
