import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/EditorStore';
import { apiService } from '../../services/api';
import { supabase, uploadMediaToSupabaseBucket } from '../../lib/supabase';
import { Upload, Image as ImageIcon, Video, Quote as QuoteIcon, Search, Trash2, Grid, List as ListIcon, Loader2, Plus, RefreshCw, Globe, Layers, Eye, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast, Toast } from '../ui/Toast';

interface GlobalPhotoItem {
  id: string;
  url: string;
  title: string;
}

const DEFAULT_SAMPLE_PHOTOS: GlobalPhotoItem[] = [
  { id: 'sample_1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', title: 'Beach Hangout' },
  { id: 'sample_2', url: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?w=800&q=80', title: 'Friends Story' },
  { id: 'sample_3', url: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80', title: 'Road Trip' },
  { id: 'sample_4', url: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80', title: 'Night Celebration' },
  { id: 'sample_5', url: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=800&q=80', title: 'Forest Camping' },
  { id: 'sample_6', url: 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=800&q=80', title: 'Graduation Day' },
];

export const MediaLibrary: React.FC = () => {
  const { items, selectItem, addItem, removeItem, groupId } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'group' | 'global'>('group');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Global photos & Multi-select states
  const [globalPhotos, setGlobalPhotos] = useState<GlobalPhotoItem[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [addingPhotoUrl, setAddingPhotoUrl] = useState<string | null>(null);
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const { toast, showToast, hideToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set of URLs already added to the active group
  const existingGroupUrls = new Set(items.map(i => i.contentUrl).filter(Boolean));

  // Fetch all photos from Database and Supabase Storage bucket
  const loadGlobalPhotos = async () => {
    setLoadingGlobal(true);
    try {
      const dbUrls = await apiService.getAllPhotos().catch(() => []);
      
      let storagePhotos: GlobalPhotoItem[] = [];
      const { data: storageList } = await supabase.storage.from('media').list('uploads', { limit: 150 });
      if (storageList && storageList.length > 0) {
        storagePhotos = storageList
          .filter(f => f.name !== '.emptyFolderPlaceholder')
          .map(f => {
            const { data } = supabase.storage.from('media').getPublicUrl(`uploads/${f.name}`);
            return {
              id: f.id || f.name,
              url: data.publicUrl,
              title: f.name
            };
          });
      }

      const combined: GlobalPhotoItem[] = [...storagePhotos];
      dbUrls.forEach((url, i) => {
        if (!combined.some(p => p.url === url)) {
          combined.push({ id: `db_${i}`, url, title: `Photo ${i + 1}` });
        }
      });

      DEFAULT_SAMPLE_PHOTOS.forEach(sp => {
        if (!combined.some(p => p.url === sp.url)) {
          combined.push(sp);
        }
      });

      setGlobalPhotos(combined);
    } catch (err) {
      console.error('Failed to load global photos:', err);
      setGlobalPhotos(DEFAULT_SAMPLE_PHOTOS);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    loadGlobalPhotos();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!groupId) {
      showToast('No group selected. Please open a group first.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        const url = await uploadMediaToSupabaseBucket(file, 'media');
        if (file.type.startsWith('video/')) {
          const dbItem = await apiService.uploadVideo(groupId, url, file.name);
          addItem({ ...dbItem, type: 'video', contentUrl: dbItem.videoUrl, titleOrAuthor: dbItem.title, textContent: '' });
        } else {
          const dbItem = await apiService.uploadPhoto(groupId, url, file.name);
          addItem({ ...dbItem, type: 'photo', contentUrl: dbItem.imageUrl, textContent: dbItem.caption, titleOrAuthor: '' });
        }
      }
      showToast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully!`, 'success');
      loadGlobalPhotos();
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Upload failed. Check storage permissions.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddGlobalPhotoToSpace = async (photo: GlobalPhotoItem) => {
    if (!groupId) {
      showToast('No active group open in studio', 'error');
      return;
    }
    setAddingPhotoUrl(photo.url);
    try {
      const dbItem = await apiService.uploadPhoto(groupId, photo.url, photo.title);
      addItem({
        ...dbItem,
        type: 'photo',
        contentUrl: dbItem.imageUrl,
        textContent: dbItem.caption,
        titleOrAuthor: ''
      });
      showToast('Photo added to 3D Space!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add photo to group', 'error');
    } finally {
      setAddingPhotoUrl(null);
    }
  };

  const toggleSelectPhoto = (url: string) => {
    if (selectedPhotoUrls.includes(url)) {
      setSelectedPhotoUrls(selectedPhotoUrls.filter(u => u !== url));
    } else {
      setSelectedPhotoUrls([...selectedPhotoUrls, url]);
    }
  };

  const handleBatchAddPhotos = async () => {
    if (!groupId) {
      showToast('No group selected.', 'error');
      return;
    }
    if (selectedPhotoUrls.length === 0) return;

    setIsBatchAdding(true);
    try {
      let addedCount = 0;
      for (const url of selectedPhotoUrls) {
        // Skip if already in space
        if (existingGroupUrls.has(url)) continue;
        const photo = globalPhotos.find(p => p.url === url);
        const title = photo ? photo.title : 'Photo';
        const dbItem = await apiService.uploadPhoto(groupId, url, title);
        addItem({
          ...dbItem,
          type: 'photo',
          contentUrl: dbItem.imageUrl,
          textContent: dbItem.caption,
          titleOrAuthor: ''
        });
        addedCount++;
      }
      showToast(`Added ${addedCount} photo${addedCount !== 1 ? 's' : ''} to 3D Space!`, 'success');
      setSelectedPhotoUrls([]);
      setMultiSelectMode(false);
      setActiveTab('group');
    } catch (err: any) {
      showToast(err?.message || 'Failed batch add', 'error');
    } finally {
      setIsBatchAdding(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    try {
      if (item.type === 'photo') await apiService.deletePhoto(item.id);
      else if (item.type === 'video') await apiService.deleteVideo(item.id);
      else if (item.type === 'quote') await apiService.deleteQuote(item.id);
      removeItem(item.id);
      showToast('Item deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete item.', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (item.titleOrAuthor || '').toLowerCase().includes(q) ||
           (item.textContent || '').toLowerCase().includes(q) ||
           (item.type || '').toLowerCase().includes(q);
  });

  const filteredGlobalPhotos = globalPhotos.filter(p => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (p.title || '').toLowerCase().includes(q);
  });

  return (
    <div 
      className={`w-full h-full bg-[#0a0f26] border-r border-indigo-500/30 flex flex-col transition-colors min-h-0 relative ${isDragging ? 'bg-indigo-900/20' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-3 border-b border-indigo-500/30 flex justify-between items-center shrink-0">
        <h2 className="font-cinzel text-base font-bold text-indigo-200">Library</h2>
        
        <div className="flex items-center gap-1.5">
          {activeTab === 'global' && (
            <button
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                setSelectedPhotoUrls([]);
              }}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                multiSelectMode ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
              title="Select Multiple Photos"
            >
              <CheckSquare size={14} />
              <span className="text-[10px] hidden sm:inline">Select</span>
            </button>
          )}

          <button 
            onClick={loadGlobalPhotos}
            disabled={loadingGlobal}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Refresh All Media"
          >
            <RefreshCw size={14} className={loadingGlobal ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 transition-colors"
            title="Toggle Layout"
          >
            {viewMode === 'grid' ? <ListIcon size={14} /> : <Grid size={14} />}
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} 
            <span>Upload</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept="image/*,video/*"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-indigo-500/30 text-xs font-semibold shrink-0 bg-black/20">
        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'group'
              ? 'border-indigo-500 text-indigo-300 font-bold bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={13} />
          <span>Space Media ({items.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'global'
              ? 'border-indigo-500 text-indigo-300 font-bold bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Globe size={13} />
          <span>All Library ({globalPhotos.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-2.5 border-b border-indigo-500/30 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'group' ? 'Search group media...' : 'Search all photos...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-slate-700 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-0 pb-16">
        {activeTab === 'group' ? (
          /* Group Media View */
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2.5 auto-rows-max' : 'space-y-2'}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => selectItem(item.id)}
                className={`group relative bg-slate-900/90 border border-slate-800 rounded-xl p-2 cursor-pointer hover:border-indigo-500/80 transition-all shrink-0 ${
                  viewMode === 'grid' ? 'flex flex-col gap-2 h-32' : 'flex items-center gap-3 h-14'
                }`}
              >
                <div className={`rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden ${
                  viewMode === 'grid' ? 'w-full h-20' : 'w-10 h-10'
                }`}>
                  {item.type === 'photo' ? (
                    item.contentUrl ? <img src={item.contentUrl} alt="thumb" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-slate-500" />
                  ) : item.type === 'video' ? (
                    <Video size={18} className="text-slate-500" />
                  ) : (
                    <QuoteIcon size={18} className="text-slate-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate leading-tight">
                    {item.titleOrAuthor || item.textContent || `${item.type} Item`}
                  </p>
                  <p className="text-[9px] text-slate-400 capitalize">{item.type}</p>
                </div>
                
                <button 
                  onClick={(e) => handleDelete(e, item)}
                  className="absolute right-2 top-2 p-1 bg-black/70 hover:bg-red-600 rounded text-white transition-colors opacity-0 group-hover:opacity-100 z-10" 
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center text-slate-500 text-xs py-10">
                No media in space. Switch to "All Library" to add photos.
              </div>
            )}
          </div>
        ) : (
          /* Global All Photos Tab */
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2.5 auto-rows-max' : 'space-y-2'}>
            {loadingGlobal ? (
              <div className="col-span-full text-center text-slate-400 text-xs py-10 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-indigo-400" /> Fetching database media...
              </div>
            ) : filteredGlobalPhotos.map((photo) => {
              const isAdded = existingGroupUrls.has(photo.url);
              const isSelected = selectedPhotoUrls.includes(photo.url);

              return (
                <div
                  key={photo.id}
                  onClick={() => multiSelectMode && toggleSelectPhoto(photo.url)}
                  className={`group relative bg-slate-900 border rounded-xl overflow-hidden transition-all shrink-0 ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-800 hover:border-indigo-500/80'
                  } ${viewMode === 'grid' ? 'h-36 flex flex-col' : 'h-16 flex items-center gap-3 p-2'}`}
                >
                  {/* Added Indicator Badge */}
                  {isAdded && (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md shadow-md">
                      <CheckCircle2 size={10} /> Added
                    </div>
                  )}

                  {/* Multi-select Checkbox */}
                  {multiSelectMode && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-indigo-400 fill-indigo-900" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                    </div>
                  )}

                  {/* Image Thumbnail */}
                  <div className={`relative bg-black shrink-0 overflow-hidden ${viewMode === 'grid' ? 'w-full h-24' : 'w-12 h-12 rounded-lg'}`}>
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" loading="lazy" />
                    
                    {/* Hover action overlay */}
                    {!multiSelectMode && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(photo.url); }}
                          className="p-1.5 bg-black/80 hover:bg-white/20 rounded-md text-white transition-colors"
                          title="Preview"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info & Action Button */}
                  <div className={`flex items-center justify-between gap-1 p-2 bg-slate-950/80 ${viewMode === 'grid' ? 'h-12 border-t border-slate-800/60' : 'flex-1'}`}>
                    <span className="text-[10px] font-medium text-slate-300 truncate max-w-[85px]" title={photo.title}>
                      {photo.title}
                    </span>

                    {!multiSelectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddGlobalPhotoToSpace(photo); }}
                        disabled={addingPhotoUrl === photo.url || isAdded}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                          isAdded 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {addingPhotoUrl === photo.url ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : isAdded ? (
                          <span>In Space</span>
                        ) : (
                          <>
                            <Plus size={11} /> Add
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!loadingGlobal && filteredGlobalPhotos.length === 0 && (
              <div className="col-span-full text-center text-slate-500 text-xs py-10">
                No photos found in media library.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Select Floating Action Bar */}
      {activeTab === 'global' && multiSelectMode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-indigo-950/95 border border-indigo-500/50 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
          <span className="text-xs text-indigo-200 font-semibold pl-1">
            {selectedPhotoUrls.length} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPhotoUrls(filteredGlobalPhotos.map(p => p.url))}
              className="text-[10px] text-slate-300 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
            >
              Select All
            </button>

            <button
              onClick={handleBatchAddPhotos}
              disabled={selectedPhotoUrls.length === 0 || isBatchAdding}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50 shadow-md"
            >
              {isBatchAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add Selected ({selectedPhotoUrls.length})
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img src={previewImageUrl} alt="Preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Drop zone overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center border-2 border-indigo-400 border-dashed rounded-xl m-3 pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-indigo-300">
            <Upload size={28} className="animate-bounce" />
            <span className="font-bold text-xs tracking-wider uppercase">Drop Files Here</span>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};
