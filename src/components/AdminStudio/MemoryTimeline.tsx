import React from 'react';
import { useEditorStore } from '../../store/EditorStore';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast, Toast } from '../ui/Toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  item: any;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (e: React.MouseEvent, id: string, type: string) => void;
}

const SortableTimelineItem: React.FC<SortableItemProps> = ({ id, item, isSelected, onSelect, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
      className={`group p-3 rounded-xl border cursor-pointer transition-colors flex items-center gap-3 ${
        isSelected 
          ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
          : 'bg-black/40 border-slate-800 hover:border-slate-600'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab hover:bg-white/10 p-1 rounded transition-colors"
      >
        <GripVertical size={14} className="text-slate-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
            {item.type}
          </span>
          <span className="text-[10px] text-slate-500">
            Order: {item.displayOrder}
          </span>
        </div>
        <p className="text-xs text-slate-200 line-clamp-1">
          {item.titleOrAuthor || item.textContent || `Untitled ${item.type}`}
        </p>
      </div>

      <button 
        onClick={(e) => onDelete(e, item.id, item.type)}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
        title="Delete Item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export const MemoryTimeline: React.FC = () => {
  const { items, reorderItems, selectItem, selectedItemIds, addItem, removeItem, groupId } = useEditorStore();
  const { toast, showToast, hideToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddText = async (defaultText: string = "New text event...") => {
    if (!groupId) return;
    try {
      const dbItem = await apiService.addQuote(groupId, defaultText, "Anonymous");
      addItem({ ...dbItem, type: 'quote', textContent: dbItem.quote, titleOrAuthor: dbItem.author });
    } catch (err) {
      console.error(err);
      showToast('Failed to add text event.', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, type: string) => {
    e.stopPropagation();
    try {
      if (type === 'photo') await apiService.deletePhoto(id);
      else if (type === 'video') await apiService.deleteVideo(id);
      else if (type === 'quote') await apiService.deleteQuote(id);
      removeItem(id);
      showToast('Event deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete item.', 'error');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        displayOrder: index + 1
      }));

      reorderItems(newItems);
    }
  };

  return (
    <div className="w-80 h-full bg-[#0a0f26] border-r border-indigo-500/30 flex flex-col font-sans">
      <div className="p-4 border-b border-indigo-500/30">
        <h2 className="font-cinzel text-lg font-bold text-indigo-200">Timeline</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Drag to Reorder Events</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <SortableTimelineItem 
                  key={item.id}
                  id={item.id}
                  item={item}
                  isSelected={selectedItemIds.includes(item.id)}
                  onSelect={selectItem}
                  onDelete={(e) => handleDelete(e, item.id, item.type)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex flex-col gap-2 mt-4">
          <button 
            onClick={() => handleAddText('Start Title')}
            className="w-full py-3 border border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={14} /> Add Start Title
          </button>
          <button 
            onClick={() => handleAddText('End Title')}
            className="w-full py-3 border border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={14} /> Add End Title
          </button>
        </div>
      </div>

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};
