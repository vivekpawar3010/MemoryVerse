import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, X, Search, RefreshCw, Star, Loader2 } from 'lucide-react';
import { supabase, uploadMediaToSupabaseBucket } from '../../lib/supabase';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast, Toast } from '../ui/Toast';

// 10 default/sample images always shown
const DEFAULT_PHOTOS = [
  { id: 'def_1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', title: 'Group hangout at the beach', isDefault: true },
  { id: 'def_2', url: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?w=800&q=80', title: 'Friends laughing together', isDefault: true },
  { id: 'def_3', url: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80', title: 'Road trip adventures', isDefault: true },
  { id: 'def_4', url: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80', title: 'Party night', isDefault: true },
  { id: 'def_5', url: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=800&q=80', title: 'Camping in the woods', isDefault: true },
  { id: 'def_6', url: 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=800&q=80', title: 'Graduation day', isDefault: true },
  { id: 'def_7', url: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=800&q=80', title: 'Cafe hangout', isDefault: true },
  { id: 'def_8', url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=800&q=80', title: 'Concert memories', isDefault: true },
  { id: 'def_9', url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80', title: 'Snow trip', isDefault: true },
  { id: 'def_10', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', title: 'Festival vibes', isDefault: true },
];

interface Photo {
  id: string;
  url: string;
  title: string;
  isDefault?: boolean;
  storagePath?: string;
}

export const GlobalMediaLibrary: React.FC = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all uploaded photos from Supabase storage
  const loadPhotos = async () => {
    setIsLoadingPhotos(true);
    try {
      const { data, error } = await supabase.storage.from('media').list('uploads', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        console.warn('Storage list error:', error.message);
        setUploadedPhotos([]);
        return;
      }

      const photos: Photo[] = (data ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(`uploads/${file.name}`);
          return {
            id: file.id ?? file.name,
            url: urlData.publicUrl,
            title: file.name,
            storagePath: `uploads/${file.name}`,
          };
        });

      setUploadedPhotos(photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setUploadedPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      for (const file of files) {
        await uploadMediaToSupabaseBucket(file, 'media');
      }
      showToast(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`, 'success');
      await loadPhotos(); // Refresh
    } catch (err: any) {
      showToast(err?.message || 'Upload failed. Check bucket permissions.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!photoToDelete || photoToDelete.isDefault) return;
    try {
      if (photoToDelete.storagePath) {
        const { error } = await supabase.storage.from('media').remove([photoToDelete.storagePath]);
        if (error) throw new Error(error.message);
      }
      setUploadedPhotos(prev => prev.filter(p => p.id !== photoToDelete.id));
      showToast('Photo deleted.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo.', 'error');
    } finally {
      setPhotoToDelete(null);
    }
  };

  const q = search.toLowerCase();
  const filteredUploaded = uploadedPhotos.filter(p => p.title.toLowerCase().includes(q));
  const filteredDefaults = DEFAULT_PHOTOS.filter(p => p.title.toLowerCase().includes(q));

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-7xl mx-auto animate-in fade-in duration-300 flex flex-col font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-white mb-2 flex items-center gap-3">
            <ImageIcon className="text-indigo-400" />
            Global Media Library
          </h1>
          <p className="text-slate-400 text-sm">
            {isLoadingPhotos ? 'Loading...' : `${uploadedPhotos.length} uploaded · ${DEFAULT_PHOTOS.length} defaults`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <button
            onClick={loadPhotos}
            disabled={isLoadingPhotos}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoadingPhotos ? 'animate-spin' : ''} />
          </button>
          <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 whitespace-nowrap">
            {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {/* Uploaded by Admin */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Upload size={14} className="text-indigo-400" /> Uploaded by Admin
          <span className="text-slate-600 font-normal normal-case">({filteredUploaded.length})</span>
        </h2>

        {isLoadingPhotos ? (
          <div className="flex items-center justify-center h-32 text-slate-500 gap-2 text-sm">
            <RefreshCw size={16} className="animate-spin" /> Loading from storage...
          </div>
        ) : filteredUploaded.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 border border-dashed border-slate-800 rounded-2xl">
            <ImageIcon size={28} className="mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No results' : 'No uploads yet. Click Upload to add photos.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredUploaded.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onView={() => setSelectedImage(photo.url)}
                onDelete={() => setPhotoToDelete(photo)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Default Images */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Star size={14} className="text-amber-400" /> Default Images
          <span className="text-slate-600 font-normal normal-case ml-1">(built-in samples, not deletable)</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDefaults.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onView={() => setSelectedImage(photo.url)}
              onDelete={null} // defaults are not deletable
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            alt="Preview"
          />
        </div>
      )}

      <ConfirmModal
        isOpen={!!photoToDelete}
        title="Delete Photo"
        message={`Delete "${photoToDelete?.title}" from storage? This cannot be undone.`}
        confirmText="Delete Photo"
        onConfirm={confirmDelete}
        onCancel={() => setPhotoToDelete(null)}
      />

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

// ─── Photo card sub-component ─────────────────────────────────────────────────
const PhotoCard: React.FC<{
  photo: { id: string; url: string; title: string; isDefault?: boolean };
  onView: () => void;
  onDelete: (() => void) | null;
}> = ({ photo, onView, onDelete }) => (
  <div
    onClick={onView}
    className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden cursor-pointer border border-indigo-500/10 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]"
  >
    <img
      src={photo.url}
      alt={photo.title}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
      <h3 className="text-white font-semibold text-xs truncate drop-shadow-md">{photo.title}</h3>
    </div>

    {/* Default badge */}
    {photo.isDefault && (
      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/80 text-white text-[9px] font-bold rounded backdrop-blur-sm flex items-center gap-1">
        <Star size={8} /> Default
      </div>
    )}

    {/* Delete Button (only for non-defaults) */}
    {onDelete && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md"
        title="Delete Photo"
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
);
