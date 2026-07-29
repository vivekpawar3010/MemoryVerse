import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PhotoItem } from '../../types';
import { ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react';

interface Props {
  photo: PhotoItem;
  idx: number;
  total: number;
  onMove: (type: 'photo', idx: number, direction: 'up' | 'down') => void;
  onEdit: (type: 'photo', item: any) => void;
  onDelete: (type: 'photo', id: string) => void;
}

export const SortablePhotoItem: React.FC<Props> = ({ photo, idx, total, onMove, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group rounded-xl overflow-hidden aspect-square border border-white/10 bg-black/50 cursor-grab active:cursor-grabbing">
      <img src={photo.imageUrl} alt={photo.caption || 'Photo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3" onPointerDown={e => e.stopPropagation()}>
        <div className="flex justify-end space-x-2">
          <button onClick={() => onMove('photo', idx, 'up')} className="p-2 bg-slate-500/80 hover:bg-slate-500 text-white rounded-lg cursor-pointer disabled:opacity-30" disabled={idx === 0}>
            <ArrowUp className="w-3 h-3" />
          </button>
          <button onClick={() => onMove('photo', idx, 'down')} className="p-2 bg-slate-500/80 hover:bg-slate-500 text-white rounded-lg cursor-pointer disabled:opacity-30" disabled={idx === total - 1}>
            <ArrowDown className="w-3 h-3" />
          </button>
          <button onClick={() => onEdit('photo', photo)} className="p-2 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg cursor-pointer">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete('photo', photo.id)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg cursor-pointer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[10px] text-white truncate">{photo.caption || 'No caption'}</p>
      </div>
    </div>
  );
};
