import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuoteItem } from '../../types';
import { ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react';

interface Props {
  quote: QuoteItem;
  idx: number;
  total: number;
  onMove: (type: 'quote', idx: number, direction: 'up' | 'down') => void;
  onEdit: (type: 'quote', item: any) => void;
  onDelete: (type: 'quote', id: string) => void;
}

export const SortableQuoteItem: React.FC<Props> = ({ quote, idx, total, onMove, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: quote.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl cursor-grab active:cursor-grabbing">
      <div>
        <p className="text-sm text-slate-200 font-serif italic mb-1">"{quote.quote}"</p>
        <p className="text-[10px] text-emerald-400 uppercase tracking-wider">— {quote.author}</p>
      </div>
      <div className="flex items-center space-x-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
        <button onClick={() => onMove('quote', idx, 'up')} className="p-2 text-slate-400 hover:text-white cursor-pointer transition-colors disabled:opacity-30" disabled={idx === 0}><ArrowUp className="w-4 h-4"/></button>
        <button onClick={() => onMove('quote', idx, 'down')} className="p-2 text-slate-400 hover:text-white cursor-pointer transition-colors disabled:opacity-30" disabled={idx === total - 1}><ArrowDown className="w-4 h-4"/></button>
        <button onClick={() => onEdit('quote', quote)} className="p-2 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors"><Edit2 className="w-4 h-4"/></button>
        <button onClick={() => onDelete('quote', quote.id)} className="p-2 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  );
};
