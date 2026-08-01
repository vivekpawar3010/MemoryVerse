import { create } from 'zustand';
import { PhotoItem, VideoItem, QuoteItem, BaseMemoryItem, VisitorGroupAccess } from '../types';
import { apiService } from '../services/api';

type MediaItemType = 'photo' | 'video' | 'quote';

export type EditorItem = BaseMemoryItem & {
  type: MediaItemType;
  contentUrl?: string; // imageUrl or videoUrl
  textContent?: string; // caption or quote
  titleOrAuthor?: string; // title or author
  date?: string;
  location?: string;
  themeColor?: string;
  textColor?: string;
  backgroundColor?: string;
};

interface EditorState {
  groupId: string | null;
  groupDetails: VisitorGroupAccess | null;
  items: EditorItem[];
  selectedItemIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  previewMode: 'desktop' | 'tablet' | 'mobile';
  hasUnsavedChanges: boolean;
  
  // Actions
  setGroupId: (id: string) => void;
  setGroupDetails: (details: VisitorGroupAccess | null) => void;
  setItems: (items: EditorItem[]) => void;
  addItem: (item: EditorItem) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null, multi?: boolean) => void;
  clearSelection: () => void;
  updateItemProps: (id: string, props: Partial<EditorItem>) => void;
  reorderItems: (newItems: EditorItem[]) => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  updateGroupDetailsLocally: (fields: Partial<VisitorGroupAccess>) => void;
  deployChanges: () => Promise<void>;
  
  // Undo / Redo
  history: EditorItem[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  groupId: null,
  groupDetails: null,
  items: [],
  selectedItemIds: [],
  isLoading: false,
  isSaving: false,
  saveStatus: 'idle',
  previewMode: 'desktop',
  hasUnsavedChanges: false,
  
  history: [],
  historyIndex: -1,

  setGroupId: (id) => set({ groupId: id }),
  setGroupDetails: (details) => set({ groupDetails: details }),

  setItems: (items) => {
    set({ items, history: [items], historyIndex: 0, hasUnsavedChanges: false });
  },
  
  addItem: (item) => {
    const { items, history, historyIndex } = get();
    const newItems = [...items, item];
    const newHistory = [...history.slice(0, historyIndex + 1), newItems];
    set({ 
      items: newItems, 
      history: newHistory, 
      historyIndex: historyIndex + 1,
      hasUnsavedChanges: true 
    });
  },

  removeItem: (id) => {
    const { items, history, historyIndex, selectedItemIds } = get();
    const newItems = items.filter(i => i.id !== id);
    const newHistory = [...history.slice(0, historyIndex + 1), newItems];
    set({ 
      items: newItems, 
      history: newHistory, 
      historyIndex: historyIndex + 1,
      selectedItemIds: selectedItemIds.filter(x => x !== id),
      hasUnsavedChanges: true
    });
  },
  
  selectItem: (id, multi = false) => set(state => {
    if (!id) return { selectedItemIds: [] };
    if (multi) {
      if (state.selectedItemIds.includes(id)) {
        return { selectedItemIds: state.selectedItemIds.filter(x => x !== id) };
      }
      return { selectedItemIds: [...state.selectedItemIds, id] };
    }
    return { selectedItemIds: [id] };
  }),
  clearSelection: () => set({ selectedItemIds: [] }),
  
  updateItemProps: (id, props) => {
    const { items, history, historyIndex } = get();
    
    // Update locally in Zustand memory state
    const newItems = items.map(item => item.id === id ? { ...item, ...props } : item);
    const newHistory = [...history.slice(0, historyIndex + 1), newItems];
    
    set({ 
      items: newItems, 
      history: newHistory, 
      historyIndex: historyIndex + 1, 
      hasUnsavedChanges: true,
      saveStatus: 'idle'
    });
  },

  updateGroupDetailsLocally: (fields) => {
    const { groupDetails } = get();
    if (!groupDetails) return;
    set({
      groupDetails: { ...groupDetails, ...fields },
      hasUnsavedChanges: true
    });
  },

  deployChanges: async () => {
    const { groupId, groupDetails, items, hasUnsavedChanges } = get();
    if (!groupId || !hasUnsavedChanges) return;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      // 1. Deploy group setting adjustments
      if (groupDetails) {
        await apiService.updateGroup(groupId, {
          theme: groupDetails.theme,
          ambientAudio: groupDetails.ambientAudio,
          endingAudio: groupDetails.endingAudio,
          themeSettings: groupDetails.themeSettings,
          allowDownload: groupDetails.allowDownload,
          allowShare: groupDetails.allowShare,
          showWatermark: groupDetails.showWatermark,
          allowAudioChange: groupDetails.allowAudioChange,
        });
      }

      // 2. Deploy item position/property edits in batch and sync their timeline order
      const tableMap = {
        'photo': 'photos',
        'video': 'videos',
        'quote': 'quotes'
      } as const;

      await Promise.all(items.map((item, index) => {
        const tableName = tableMap[item.type];
        return apiService.updateMemoryItem3DProps(tableName, item.id, {
          positionX: item.positionX,
          positionY: item.positionY,
          positionZ: item.positionZ,
          rotationX: item.rotationX,
          rotationY: item.rotationY,
          rotationZ: item.rotationZ,
          scale: item.scale,
          frameStyle: item.frameStyle,
          glowStrength: item.glowStrength,
          animationType: item.animationType,
          layerIndex: item.layerIndex,
          isVisible: item.isVisible,
          animationSettings: item.animationSettings,
          audioSettings: item.audioSettings,
          themeSettings: item.themeSettings,
          textContent: item.textContent,
          titleOrAuthor: item.titleOrAuthor,
          displayOrder: index, // Sync order array positions back into DB rows
        });
      }));

      set({ isSaving: false, saveStatus: 'saved', hasUnsavedChanges: false });
      setTimeout(() => set((s) => (s.saveStatus === 'saved' ? { ...s, saveStatus: 'idle' } : s)), 3000);
    } catch (error) {
      console.error("Failed to deploy changes to database:", error);
      set({ isSaving: false, saveStatus: 'error' });
    }
  },
  
  reorderItems: (newItems) => {
    const { history, historyIndex } = get();
    const newHistory = [...history.slice(0, historyIndex + 1), newItems];
    set({ 
      items: newItems, 
      history: newHistory, 
      historyIndex: historyIndex + 1,
      hasUnsavedChanges: true
    });
  },
  
  setPreviewMode: (mode) => set({ previewMode: mode }),
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ 
        items: history[historyIndex - 1], 
        historyIndex: historyIndex - 1,
        hasUnsavedChanges: true 
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ 
        items: history[historyIndex + 1], 
        historyIndex: historyIndex + 1,
        hasUnsavedChanges: true
      });
    }
  }
}));
