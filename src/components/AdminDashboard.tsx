import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Video,
  Quote,
  MessageSquare,
  LogOut,
  Sparkles,
  Search,
  Menu,
  X,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Music,
  Compass,
  Globe2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { uploadMediaToSupabaseBucket } from '../lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import { MemoryVaultView } from './MemoryVaultView';
import { SortablePhotoItem } from './Admin/SortablePhotoItem';
import { SortableVideoItem } from './Admin/SortableVideoItem';
import { SortableQuoteItem } from './Admin/SortableQuoteItem';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Group, DashboardSummary, PhotoItem, VideoItem, QuoteItem, VisitorGroupAccess } from '../types';

import { THEME_REGISTRY } from './themes/ThemeRegistry';
import { AUDIO_REGISTRY } from './themes/AudioRegistry';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
}

// ─── small reusable modal wrapper ────────────────────────────────────────────
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="max-w-md w-full p-6 rounded-3xl bg-[#0a0f26] border border-indigo-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-[#0a0f26] z-10 pb-2">
              <h3 className="font-cinzel text-lg font-bold text-indigo-200">{title}</h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── inline error/success banners inside modals ───────────────────────────────
const FormBanner: React.FC<{ msg: string | null; isError?: boolean }> = ({ msg, isError }) => {
  if (!msg) return null;
  return (
    <div className={`flex items-start space-x-2 p-3 rounded-xl text-xs mb-4 ${isError ? 'bg-red-500/10 border border-red-400/30 text-red-300' : 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300'}`}>
      {isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{msg}</span>
    </div>
  );
};

// ─── labelled input helper ────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = (focus = 'focus:border-indigo-400') =>
  `w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${focus} transition-colors`;

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Drill-down State
  const [activeGroup, setActiveGroup] = useState<any>(null); // Details of the currently viewed group
  const [activeGroupTab, setActiveGroupTab] = useState<'photos' | 'videos' | 'quotes' | 'message'>('photos');
  const [groupLoading, setGroupLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // ── Global toast ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Modal visibility ───────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // ── Form state (Create/Edit Group) ─────────────────────────────────────────
  const [createName, setCreateName] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [createTheme, setCreateTheme] = useState('CinematicSpace');
  const [createMembers, setCreateMembers] = useState('');
  const [createCover, setCreateCover] = useState('');
  const [createAmbientAudio, setCreateAmbientAudio] = useState('');
  const [createEndingAudio, setCreateEndingAudio] = useState('');
  const [createIntroQuote, setCreateIntroQuote] = useState('');
  const [createAllowDownload, setCreateAllowDownload] = useState(false);
  const [createAllowShare, setCreateAllowShare] = useState(false);
  const [createShowWatermark, setCreateShowWatermark] = useState(true);
  const [createTextColor, setCreateTextColor] = useState('#ffffff');
  const [createBackgroundColor, setCreateBackgroundColor] = useState('#02040a');
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editTheme, setEditTheme] = useState('CinematicSpace');
  const [editAmbientAudio, setEditAmbientAudio] = useState('');
  const [editEndingAudio, setEditEndingAudio] = useState('');
  const [editIntroQuote, setEditIntroQuote] = useState('');
  const [editAllowDownload, setEditAllowDownload] = useState(false);
  const [editAllowShare, setEditAllowShare] = useState(false);
  const [editShowWatermark, setEditShowWatermark] = useState(true);
  const [editTextColor, setEditTextColor] = useState('');
  const [editBackgroundColor, setEditBackgroundColor] = useState('');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);


  // ── Form state (Add Media) ─────────────────────────────────────────────────
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaFileLoading, setMediaFileLoading] = useState(false);
  const [mediaSubmitting, setMediaSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // ── Library state ──────────────────────────────────────────────────────────
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryPhotos, setLibraryPhotos] = useState<string[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryUrls, setSelectedLibraryUrls] = useState<string[]>([]);

  const openLibrary = async () => {
    setShowLibrary(true);
    setLibraryLoading(true);
    try {
      const photos = await apiService.getAllPhotos();
      setLibraryPhotos(photos);
    } catch (err: unknown) {
      showToast('Failed to load image library', true);
    } finally {
      setLibraryLoading(false);
    }
  };

  // Quote
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');

  // Message
  const [msgTitle, setMsgTitle] = useState('');
  const [msgText, setMsgText] = useState('');

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sumData, groupData] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getGroups(),
      ]);
      setSummary(sumData);
      setGroups(groupData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      showToast(`Load error: ${msg}`, true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load specific group details
  const loadGroupDetails = async (groupId: string, silent = false) => {
    if (!silent) setGroupLoading(true);
    try {
      const details = await apiService.getGroupDetails(groupId);
      setActiveGroup(details);
      setMsgTitle(details.finalMessage?.title || '');
      setMsgText(details.finalMessage?.message || '');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to load group details', true);
      setActiveGroup(null);
    } finally {
      setGroupLoading(false);
    }
  };

  // ── Handlers (Groups) ──────────────────────────────────────────────────────
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr(null);
    if (!createName.trim()) { setCreateErr('Group name is required.'); return; }
    if (!createPass.trim()) { setCreateErr('Access password is required.'); return; }
    setCreateSubmitting(true);
    try {
      const membersArr = createMembers.trim() ? createMembers.split(',').map(m => m.trim()).filter(Boolean) : [];
      await apiService.createGroup({
        groupName: createName,
        password: createPass,
        theme: createTheme,
        members: membersArr.length > 0 ? membersArr : undefined,
        memberCount: membersArr.length || 0,
        coverImage: createCover || undefined,
        audioUrl: createAmbientAudio || undefined,
        ambientAudio: createAmbientAudio || undefined,
        endingAudio: createEndingAudio || undefined,
        introQuote: createIntroQuote || undefined,
        allowDownload: createAllowDownload,
        allowShare: createAllowShare,
        showWatermark: createShowWatermark,
        themeSettings: { textColor: createTextColor, backgroundColor: createBackgroundColor }
      });
      showToast(`Group "${createName}" created!`);
      setShowCreate(false);
      setCreateName(''); setCreatePass(''); setCreateTheme('CinematicSpace'); setCreateMembers(''); setCreateCover(''); setCreateAmbientAudio(''); setCreateEndingAudio(''); setCreateIntroQuote('');
      loadData(true);
    } catch (e: unknown) {
      setCreateErr(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroup) return;
    setEditErr(null);
    if (!editName.trim()) { setEditErr('Group name cannot be empty.'); return; }
    setEditSubmitting(true);
    try {
      await apiService.updateGroup(editGroup.id, {
        groupName: editName,
        password: editPass || undefined,
        theme: editTheme,
        audioUrl: editAmbientAudio || undefined,
        ambientAudio: editAmbientAudio || undefined,
        endingAudio: editEndingAudio || undefined,
        introQuote: editIntroQuote || undefined,
        allowDownload: editAllowDownload,
        allowShare: editAllowShare,
        showWatermark: editShowWatermark,
        themeSettings: { textColor: editTextColor, backgroundColor: editBackgroundColor }
      });
      showToast('Group updated!');
      setEditGroup(null);
      if (activeGroup && activeGroup.groupId === editGroup.id) {
        loadGroupDetails(editGroup.id, true);
      }
      loadData(true);
    } catch (e: unknown) {
      setEditErr(e instanceof Error ? e.message : 'Failed to update group');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!window.confirm(`Delete group "${name}"? This permanently removes all photos, videos, and quotes.`)) return;
    try {
      await apiService.deleteGroup(groupId);
      showToast(`Group "${name}" deleted.`);
      loadData(true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete group', true);
    }
  };

  // ── Handlers (Media) ───────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles(filesArray);
      setMediaUrl(''); // Clear URL if they select files
      setSelectedLibraryUrls([]); // Clear library selections if they select files
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    setMediaSubmitting(true);
    setUploadProgress('');
    try {
      if (activeGroupTab === 'photos') {
        // BATCH FILE UPLOAD FOR PHOTOS
        if (mediaFiles.length > 0) {
          let successCount = 0;
          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            setUploadProgress(`Uploading ${i + 1} of ${mediaFiles.length}...`);
            try {
              const url = await uploadMediaToSupabaseBucket(file, 'media');
              const caption = mediaFiles.length === 1 && mediaTitle ? mediaTitle : file.name;
              await apiService.uploadPhoto(activeGroup.groupId, url, caption);
              successCount++;
            } catch (err: unknown) {
              showToast(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Error'}`, true);
            }
          }
          showToast(`Successfully added ${successCount} photo(s)!`);
        } 
        // SINGLE URL UPLOAD FOR PHOTOS
        else if (mediaUrl) {
          await apiService.uploadPhoto(activeGroup.groupId, mediaUrl, mediaTitle);
          showToast('Photo added!');
        } 
        // BATCH LIBRARY REUSE
        else if (selectedLibraryUrls.length > 0) {
          let successCount = 0;
          for (let i = 0; i < selectedLibraryUrls.length; i++) {
            const url = selectedLibraryUrls[i];
            setUploadProgress(`Adding ${i + 1} of ${selectedLibraryUrls.length}...`);
            try {
              await apiService.uploadPhoto(activeGroup.groupId, url, mediaTitle || 'Reused Photo');
              successCount++;
            } catch (err: unknown) {
              showToast(`Failed to add photo: ${err instanceof Error ? err.message : 'Error'}`, true);
            }
          }
          showToast(`Successfully added ${successCount} photo(s) from library!`);
        } else {
          throw new Error('Please select files, enter a URL, or choose from library.');
        }
      } 
      else if (activeGroupTab === 'videos') {
        // URL ONLY FOR VIDEOS
        if (!mediaUrl) throw new Error('Please enter a YouTube or Google Drive video URL.');
        await apiService.uploadVideo(activeGroup.groupId, mediaUrl, mediaTitle);
        showToast('Video link added!');
      } 
      else if (activeGroupTab === 'quotes') {
        if (!quoteText) throw new Error('Please enter quote text.');
        await apiService.addQuote(activeGroup.groupId, quoteText, quoteAuthor);
        showToast('Quote added!');
      }
      // Reset form
      setMediaUrl(''); setMediaTitle(''); setQuoteText(''); setQuoteAuthor(''); setMediaFiles([]); setSelectedLibraryUrls([]); setUploadProgress('');
      // Refresh list
      loadGroupDetails(activeGroup.groupId, true);
      loadData(true); // updates summary counts
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add item', true);
    } finally {
      setMediaSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    setMediaSubmitting(true);
    try {
      await apiService.setFinalMessage(activeGroup.groupId, msgTitle, msgText);
      showToast('Final message saved!');
      loadGroupDetails(activeGroup.groupId, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save message', true);
    } finally {
      setMediaSubmitting(false);
    }
  };

  const handleDeleteItem = async (type: 'photo' | 'video' | 'quote', id: string) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'photo') await apiService.deletePhoto(id);
      if (type === 'video') await apiService.deleteVideo(id);
      if (type === 'quote') await apiService.deleteQuote(id);
      showToast(`${type} deleted!`);
      loadGroupDetails(activeGroup.groupId, true);
      loadData(true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : `Failed to delete ${type}`, true);
    }
  };

  const handleEditItem = async (type: 'photo' | 'video' | 'quote', item: any) => {
    try {
      if (type === 'photo') {
        const newCaption = window.prompt('Edit photo caption:', item.caption || '');
        if (newCaption !== null && newCaption !== item.caption) {
          await apiService.updatePhoto(item.id, newCaption);
          showToast('Caption updated!');
        }
      } else if (type === 'video') {
        const newTitle = window.prompt('Edit video title:', item.title || '');
        if (newTitle !== null && newTitle !== item.title) {
          await apiService.updateVideo(item.id, newTitle);
          showToast('Video title updated!');
        }
      } else if (type === 'quote') {
        const newQuote = window.prompt('Edit quote text:', item.quote || '');
        if (newQuote !== null) {
          const newAuthor = window.prompt('Edit author:', item.author || '');
          if (newAuthor !== null && (newQuote !== item.quote || newAuthor !== item.author)) {
            await apiService.updateQuote(item.id, newQuote, newAuthor);
            showToast('Quote updated!');
          }
        }
      }
      loadGroupDetails(activeGroup!.groupId, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : `Failed to update ${type}`, true);
    }
  };

  const handleManageForAll = async () => {
    setLoading(true);
    try {
      const forAllId = await apiService.ensureForAllGroup();
      await loadGroupDetails(forAllId, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to load For All group', true);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveItem = async (type: 'photo' | 'video' | 'quote', index: number, direction: 'up' | 'down') => {
    let items: any[] = [];
    if (type === 'photo') items = activeGroup.photos;
    if (type === 'video') items = activeGroup.videos;
    if (type === 'quote') items = activeGroup.quotes;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const item1 = items[index];
    const item2 = items[swapIndex];
    
    let currentOrder1 = item1.displayOrder ?? index;
    let currentOrder2 = item2.displayOrder ?? swapIndex;
    
    if (currentOrder1 === currentOrder2) {
       currentOrder1 = index;
       currentOrder2 = swapIndex;
    }
    
    try {
      if (type === 'photo') {
        await apiService.updatePhotoOrder(item1.id, currentOrder2);
        await apiService.updatePhotoOrder(item2.id, currentOrder1);
      }
      if (type === 'video') {
        await apiService.updateVideoOrder(item1.id, currentOrder2);
        await apiService.updateVideoOrder(item2.id, currentOrder1);
      }
      if (type === 'quote') {
        await apiService.updateQuoteOrder(item1.id, currentOrder2);
        await apiService.updateQuoteOrder(item2.id, currentOrder1);
      }
      loadGroupDetails(activeGroup.groupId, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : `Failed to move ${type}`, true);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent, type: 'photo' | 'video' | 'quote') => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeGroup) return;

    let items: any[] = [];
    if (type === 'photo') items = activeGroup.photos;
    if (type === 'video') items = activeGroup.videos;
    if (type === 'quote') items = activeGroup.quotes;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    
    // Optimistically update UI
    setActiveGroup(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [type + 's']: newItems
      };
    });

    try {
      const promises = newItems.map((item, idx) => {
        if (type === 'photo') return apiService.updatePhotoOrder(item.id, idx);
        if (type === 'video') return apiService.updateVideoOrder(item.id, idx);
        if (type === 'quote') return apiService.updateQuoteOrder(item.id, idx);
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to reorder items', true);
      loadGroupDetails(activeGroup.groupId, true); // revert on failure
    }
  };

  const filteredGroups = groups.filter(g => {
    const q = searchQuery.toLowerCase();
    return g.groupName.toLowerCase().includes(q) || (g.memoryId ?? '').toLowerCase().includes(q);
  });

  if (previewMode && activeGroup) {
    const previewData: VisitorGroupAccess = {
      groupId: activeGroup.groupId,
      groupName: activeGroup.groupName,
      memoryId: activeGroup.memoryId,
      accessGranted: true,
      theme: activeGroup.theme,
      unlockedAt: new Date().toISOString(),
      photos: activeGroup.photos,
      videos: activeGroup.videos,
      quotes: activeGroup.quotes,
      finalMessage: activeGroup.finalMessage,
    };
    return (
      <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
        <MemoryVaultView data={previewData} onBack={() => setPreviewMode(false)} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full bg-[#050816] text-white flex font-sans-clean overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 blur-[150px]" />
      </div>

      {/* ── Global Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-5 right-5 z-[100] max-w-sm p-4 rounded-2xl text-xs font-semibold flex items-start space-x-2 shadow-2xl backdrop-blur-md ${
              toast.isError ? 'bg-red-500/20 border border-red-400/40 text-red-200' : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
            }`}
          >
            {toast.isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
            <span className="leading-relaxed">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#070b1e]/90 backdrop-blur-xl z-20 p-6 h-screen sticky top-0 justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-[#090d21] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div>
              <span className="font-cinzel text-lg font-bold tracking-wider text-white">MemoryVerse</span>
              <span className="block text-[10px] tracking-widest text-indigo-400 uppercase font-mono">Admin Portal</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => { setActiveGroup(null); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                !activeGroup ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => { setShowCreate(true); setSidebarOpen(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10">
          <div className="mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Signed in as</span>
            <span className="text-xs font-mono font-medium text-indigo-300 truncate block">{adminEmail}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-[#070b1e] border-r border-white/10 z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <span className="font-cinzel text-lg font-bold text-white">MemoryVerse</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => { setActiveGroup(null); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                !activeGroup ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>
          </nav>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs cursor-pointer">
          <LogOut className="w-4 h-4" /><span>Logout</span>
        </button>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 min-w-0 z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-[#050816]/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-white/5 text-slate-300 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-cinzel text-lg sm:text-xl font-bold text-white">
              {activeGroup ? activeGroup.groupName : 'Dashboard Overview'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {!activeGroup && (
              <button
                onClick={handleManageForAll}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide flex items-center space-x-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Globe2 className="w-4 h-4" />
                <span>Manage 'For All' Content</span>
              </button>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* =========================================================================
              VIEW 1: DASHBOARD (LIST ALL GROUPS)
              ========================================================================= */}
          {!activeGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Groups', val: summary?.totalGroups, icon: Users },
                  { label: 'Photos', val: summary?.totalPhotos, icon: ImageIcon },
                  { label: 'Videos', val: summary?.totalVideos, icon: Video },
                  { label: 'Quotes', val: summary?.totalQuotes, icon: Quote },
                ].map((m, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{m.label}</span>
                      <span className="text-2xl font-bold text-white">{loading ? '-' : (m.val || 0)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><m.icon className="w-5 h-5"/></div>
                  </div>
                ))}
              </div>

              {/* Groups Table */}
              <div className="rounded-3xl border border-white/10 bg-[#070b1e]/70 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 gap-4 border-b border-white/10">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => loadData(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer">
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setShowCreate(true)} className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer">
                      <Plus className="w-4 h-4" /><span>New Group</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                    <Layers className="w-10 h-10 mb-3 opacity-30" />
                    No groups found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-white/[0.01]">
                          <th className="py-4 px-6">Group Name</th>
                          <th className="py-4 px-4">Memory ID</th>
                          <th className="py-4 px-4">Password</th>
                          <th className="py-4 px-4 text-center">Media</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-xs text-slate-200">
                        {filteredGroups.map(group => (
                          <tr key={group.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-6 font-semibold text-white flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <span className="truncate max-w-[180px]">{group.groupName}</span>
                            </td>
                            <td className="py-4 px-4 font-mono text-indigo-300">{group.memoryId || '—'}</td>
                            <td className="py-4 px-4 font-mono text-slate-400">
                              <div className="flex items-center space-x-2">
                                <span>{showPassMap[group.id] ? (group.password || '(hidden)') : '••••••••'}</span>
                                <button onClick={() => setShowPassMap(p => ({ ...p, [group.id]: !p[group.id] }))} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                                  {showPassMap[group.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-3 text-[10px] font-mono text-slate-400">
                                <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1 text-blue-400"/> {group.photoCount}</span>
                                <span className="flex items-center"><Video className="w-3 h-3 mr-1 text-amber-400"/> {group.videoCount}</span>
                                <span className="flex items-center"><Quote className="w-3 h-3 mr-1 text-emerald-400"/> {group.quoteCount}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => loadGroupDetails(group.id)} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold transition-colors cursor-pointer">
                                  Manage Content
                                </button>
                                <button onClick={() => { setEditGroup(group); setEditName(group.groupName); setEditTheme(group.theme || 'CinematicSpace'); setEditAmbientAudio(group.ambientAudio || group.audioUrl || ''); setEditEndingAudio(group.endingAudio || ''); setEditIntroQuote(group.introQuote || ''); setEditAllowDownload(group.allowDownload ?? false); setEditAllowShare(group.allowShare ?? false); setEditShowWatermark(group.showWatermark ?? true); setEditTextColor(group.themeSettings?.textColor || '#ffffff'); setEditBackgroundColor(group.themeSettings?.backgroundColor || '#02040a'); setEditPass(''); }} className="p-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer" title="Edit Group">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteGroup(group.id, group.groupName)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Delete Group">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 2: GROUP DETAILS (DRILL-DOWN)
              ========================================================================= */}
          {activeGroup && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              
              {/* Back & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setActiveGroup(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-cinzel text-2xl font-bold text-white">{activeGroup.groupName}</h2>
                    <p className="text-xs font-mono text-indigo-300 mt-0.5">Memory ID: {activeGroup.memoryId}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditGroup({
                        id: activeGroup.groupId,
                        groupName: activeGroup.groupName,
                        memoryId: activeGroup.memoryId,
                        theme: activeGroup.theme,
                        ambientAudio: activeGroup.ambientAudio,
                        endingAudio: activeGroup.endingAudio,
                        introQuote: activeGroup.introQuote,
                        allowDownload: activeGroup.allowDownload,
                        allowShare: activeGroup.allowShare,
                        showWatermark: activeGroup.showWatermark,
                        status: 'ACTIVE',
                        createdAt: '',
                        updatedAt: '',
                        photoCount: activeGroup.photos?.length || 0,
                        videoCount: activeGroup.videos?.length || 0,
                        quoteCount: activeGroup.quotes?.length || 0,
                        hasFinalMessage: !!activeGroup.finalMessage
                      });
                      setEditName(activeGroup.groupName);
                      setEditTheme(activeGroup.theme || 'CinematicSpace');
                      setEditAmbientAudio(activeGroup.ambientAudio || activeGroup.audioUrl || '');
                      setEditEndingAudio(activeGroup.endingAudio || '');
                      setEditIntroQuote(activeGroup.introQuote || '');
                      setEditAllowDownload(activeGroup.allowDownload ?? false);
                      setEditAllowShare(activeGroup.allowShare ?? false);
                      setEditShowWatermark(activeGroup.showWatermark ?? true);
                      setEditPass('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Settings</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Visitor View</span>
                  </button>
                </div>
              </div>

              {groupLoading ? (
                <div className="py-20 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />Loading content...</div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Left Col: Tabs & Content List */}
                  <div className="flex-1 space-y-6">
                    {/* Tabs */}
                    <div className="flex space-x-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto hide-scrollbar">
                      {[
                        { id: 'photos', label: `Photos (${activeGroup.photos.length})`, icon: ImageIcon },
                        { id: 'videos', label: `Videos (${activeGroup.videos.length})`, icon: Video },
                        { id: 'quotes', label: `Quotes (${activeGroup.quotes.length})`, icon: Quote },
                        { id: 'message', label: 'Final Msg', icon: MessageSquare },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveGroupTab(tab.id as any)}
                          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            activeGroupTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <tab.icon className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Content List Area */}
                    <div className="bg-[#070b1e]/70 border border-white/10 rounded-3xl p-6 min-h-[400px] max-h-[70vh] overflow-y-auto">
                      
                      {activeGroupTab === 'photos' && (
                        <div className="space-y-4">
                          {activeGroup.photos.length === 0 ? <p className="text-sm text-slate-500 italic py-10 text-center">No photos yet.</p> : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'photo')}>
                              <SortableContext items={activeGroup.photos.map((p: any) => p.id)} strategy={horizontalListSortingStrategy}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {activeGroup.photos.map((p: PhotoItem, idx: number) => (
                                    <SortablePhotoItem 
                                      key={p.id} 
                                      photo={p} 
                                      idx={idx} 
                                      total={activeGroup.photos.length} 
                                      onMove={handleMoveItem} 
                                      onEdit={handleEditItem} 
                                      onDelete={handleDeleteItem} 
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      )}

                      {activeGroupTab === 'videos' && (
                        <div className="space-y-3">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'video')}>
                              <SortableContext items={activeGroup.videos.map((v: any) => v.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                  {activeGroup.videos.map((v: VideoItem, idx: number) => (
                                    <SortableVideoItem
                                      key={v.id}
                                      video={v}
                                      idx={idx}
                                      total={activeGroup.videos.length}
                                      onMove={handleMoveItem}
                                      onEdit={handleEditItem}
                                      onDelete={handleDeleteItem}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                        </div>
                      )}

                      {activeGroupTab === 'quotes' && (
                        <div className="space-y-3">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'quote')}>
                              <SortableContext items={activeGroup.quotes.map((q: any) => q.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                  {activeGroup.quotes.map((q: QuoteItem, idx: number) => (
                                    <SortableQuoteItem
                                      key={q.id}
                                      quote={q}
                                      idx={idx}
                                      total={activeGroup.quotes.length}
                                      onMove={handleMoveItem}
                                      onEdit={handleEditItem}
                                      onDelete={handleDeleteItem}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                        </div>
                      )}

                      {activeGroupTab === 'message' && (
                        <div>
                          {activeGroup.finalMessage ? (
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl relative">
                              <h3 className="font-cinzel text-xl text-indigo-200 mb-3">{activeGroup.finalMessage.title}</h3>
                              <p className="text-sm text-indigo-100/80 leading-relaxed whitespace-pre-wrap">{activeGroup.finalMessage.message}</p>
                              <div className="absolute top-4 right-4 text-xs font-mono text-indigo-400/50">ACTIVE MESSAGE</div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic py-10 text-center">No final message set. Use the form to create one.</p>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Right Col: Add New Item Form */}
                  <div className="w-full lg:w-80 space-y-4">
                    <div className="bg-[#070b1e]/90 border border-indigo-500/20 rounded-3xl p-6 sticky top-24">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center">
                        <Plus className="w-4 h-4 mr-2 text-indigo-400"/>
                        Add {activeGroupTab === 'photos' ? 'Photo' : activeGroupTab === 'videos' ? 'Video' : activeGroupTab === 'quotes' ? 'Quote' : 'Final Message'}
                      </h3>
                      
                      <form onSubmit={activeGroupTab === 'message' ? handleSaveMessage : handleAddMedia} className="space-y-4">
                        {activeGroupTab === 'photos' && (
                          <>
                            <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${mediaFiles.length > 0 ? 'border-indigo-400 bg-indigo-500/10' : 'border-indigo-400/30 hover:border-indigo-400 bg-indigo-500/5'}`}>
                              <Upload className={`w-5 h-5 mb-2 ${mediaFiles.length > 0 ? 'text-indigo-300' : 'text-indigo-400'}`} />
                              <span className="text-[10px] font-semibold uppercase text-indigo-200 text-center">
                                {mediaFiles.length > 0 
                                  ? `${mediaFiles.length} file(s) selected` 
                                  : `Select multiple images`}
                              </span>
                              <input 
                                type="file" 
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect} 
                                disabled={mediaSubmitting} 
                                className="hidden" 
                              />
                            </label>

                            <div className="flex items-center space-x-2 my-2">
                              <div className="h-px bg-white/10 flex-1"></div>
                              <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">OR</span>
                              <div className="h-px bg-white/10 flex-1"></div>
                            </div>
                            
                            <button 
                              type="button" 
                              onClick={openLibrary} 
                              className={`px-4 py-3 rounded-xl border border-dashed transition-all cursor-pointer w-full flex items-center justify-center space-x-2 text-xs font-semibold ${selectedLibraryUrls.length > 0 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white'}`}
                            >
                              <ImageIcon className="w-4 h-4" /> 
                              <span>
                                {selectedLibraryUrls.length > 0 
                                  ? `${selectedLibraryUrls.length} library image(s) selected` 
                                  : 'Browse Existing Library'}
                              </span>
                            </button>
                            
                            {mediaFiles.length === 0 && (
                              <>
                                <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest my-2">— OR URL —</div>
                                <Field label="Photo URL *">
                                  <input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." className={inputCls()} />
                                </Field>
                              </>
                            )}
                            
                            <Field label={mediaFiles.length > 1 ? "Caption (ignored for batch upload)" : "Caption"}>
                               <input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} placeholder="Optional" disabled={mediaFiles.length > 1} className={inputCls()} />
                            </Field>
                          </>
                        )}

                        {activeGroupTab === 'videos' && (
                          <>
                            <Field label="Video URL (YouTube / Google Drive) *">
                              <input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." className={inputCls()} />
                            </Field>
                            <Field label="Video Title">
                               <input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} placeholder="Optional" className={inputCls()} />
                            </Field>
                          </>
                        )}

                        {activeGroupTab === 'quotes' && (
                          <>
                            <Field label="Quote Text *">
                              <textarea rows={4} value={quoteText} onChange={e => setQuoteText(e.target.value)} placeholder="Type the quote..." className={inputCls()} />
                            </Field>
                            <Field label="Author">
                              <input type="text" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value)} placeholder="e.g. Unknown" className={inputCls()} />
                            </Field>
                          </>
                        )}

                        {activeGroupTab === 'message' && (
                          <>
                            <Field label="Message Title *">
                              <input type="text" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Title..." className={inputCls()} />
                            </Field>
                            <Field label="Message Body *">
                              <textarea rows={6} value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Your heartfelt message..." className={inputCls()} />
                            </Field>
                          </>
                        )}

                        <button
                          type="submit"
                          disabled={mediaSubmitting}
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold uppercase tracking-wider text-white transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 mt-6 cursor-pointer"
                        >
                          {mediaSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin"/><span>{uploadProgress || 'Saving...'}</span></> : <span>{mediaFiles.length > 1 ? `Upload ${mediaFiles.length} Files` : 'Save to Memory'}</span>}
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-300/50 text-[10px] uppercase tracking-widest justify-center mt-10">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Supabase Environment</span>
          </div>
        </main>
      </div>

      {/* CREATE GROUP MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Private Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <FormBanner msg={createErr} isError />
          <Field label="Group Name *">
            <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Summer Camp Squad 2026" className={inputCls()} />
          </Field>
          <Field label="Access Password *">
            <input type="text" value={createPass} onChange={e => setCreatePass(e.target.value)} placeholder="e.g. summer2026" className={inputCls()} />
          </Field>
          <Field label="Ambient Audio">
            <div className="flex flex-col space-y-2">
              <select 
                className={inputCls()} 
                value={AUDIO_REGISTRY.ambient.find(a => a.url === createAmbientAudio) ? createAmbientAudio : (createAmbientAudio ? 'custom' : '')}
                onChange={e => {
                  if (e.target.value !== 'custom') setCreateAmbientAudio(e.target.value);
                }}
              >
                <option  value="">None</option>
                {AUDIO_REGISTRY.ambient.map(a => <option  key={a.id} value={a.url}>{a.name}</option>)}
                <option  value="custom">Custom URL...</option>
              </select>
              {(!AUDIO_REGISTRY.ambient.find(a => a.url === createAmbientAudio) && createAmbientAudio !== '') && (
                <input type="text" value={createAmbientAudio} onChange={e => setCreateAmbientAudio(e.target.value)} placeholder="e.g. https://.../ambient.mp3" className={inputCls()} />
              )}
            </div>
          </Field>
          <Field label="Ending Audio">
            <div className="flex flex-col space-y-2">
              <select 
                className={inputCls()} 
                value={AUDIO_REGISTRY.ending.find(a => a.url === createEndingAudio) ? createEndingAudio : (createEndingAudio ? 'custom' : '')}
                onChange={e => {
                  if (e.target.value !== 'custom') setCreateEndingAudio(e.target.value);
                }}
              >
                <option  value="">None</option>
                {AUDIO_REGISTRY.ending.map(a => <option  key={a.id} value={a.url}>{a.name}</option>)}
                <option  value="custom">Custom URL...</option>
              </select>
              {(!AUDIO_REGISTRY.ending.find(a => a.url === createEndingAudio) && createEndingAudio !== '') && (
                <input type="text" value={createEndingAudio} onChange={e => setCreateEndingAudio(e.target.value)} placeholder="e.g. https://.../ending.mp3" className={inputCls()} />
              )}
            </div>
          </Field>

          <Field label="Intro Quote">
            <textarea value={createIntroQuote} onChange={e => setCreateIntroQuote(e.target.value)} placeholder="e.g. 'Memories are the architecture of our identity.'" className={inputCls()} rows={2} />
          </Field>
          <div className="flex items-center space-x-4 mb-4 text-xs text-slate-300">
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={createAllowDownload} onChange={e => setCreateAllowDownload(e.target.checked)} /> <span>Allow Download</span></label>
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={createAllowShare} onChange={e => setCreateAllowShare(e.target.checked)} /> <span>Allow Share</span></label>
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={createShowWatermark} onChange={e => setCreateShowWatermark(e.target.checked)} /> <span>Watermark</span></label>
          </div>
          <Field label="Animation Theme">
            <select
              className={inputCls()}
              value={createTheme}
              onChange={e => setCreateTheme(e.target.value)}
            >
              {THEME_REGISTRY.map(t => (
                <option  key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Text Color">
              <div className="flex space-x-2 items-center">
                <input type="color" value={createTextColor} onChange={e => setCreateTextColor(e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                <input type="text" value={createTextColor} onChange={e => setCreateTextColor(e.target.value)} className={inputCls()} />
              </div>
            </Field>
            <Field label="Background Color">
              <div className="flex space-x-2 items-center">
                <input type="color" value={createBackgroundColor} onChange={e => setCreateBackgroundColor(e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                <input type="text" value={createBackgroundColor} onChange={e => setCreateBackgroundColor(e.target.value)} className={inputCls()} />
              </div>
            </Field>
          </div>
          <Field label="Members (comma-separated names)">
            <input type="text" value={createMembers} onChange={e => setCreateMembers(e.target.value)} placeholder="Alex, Jordan, Sam" className={inputCls()} />
          </Field>
          <button type="submit" disabled={createSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2">
            {createSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Group</span>}
          </button>
        </form>
      </Modal>

      {/* EDIT GROUP MODAL */}
      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title="Edit Group">
        <form onSubmit={handleEditGroup} className="space-y-4">
          <FormBanner msg={editErr} isError />
          <Field label="Group Name">
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls()} />
          </Field>
          <Field label="New Password (leave blank to keep current)">
            <input type="text" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="Leave blank to keep existing" className={inputCls()} />
          </Field>
          <Field label="Ambient Audio">
            <div className="flex flex-col space-y-2">
              <select 
                className={inputCls()} 
                value={AUDIO_REGISTRY.ambient.find(a => a.url === editAmbientAudio) ? editAmbientAudio : (editAmbientAudio ? 'custom' : '')}
                onChange={e => {
                  if (e.target.value !== 'custom') setEditAmbientAudio(e.target.value);
                }}
              >
                <option  value="">None</option>
                {AUDIO_REGISTRY.ambient.map(a => <option  key={a.id} value={a.url}>{a.name}</option>)}
                <option  value="custom">Custom URL...</option>
              </select>
              {(!AUDIO_REGISTRY.ambient.find(a => a.url === editAmbientAudio) && editAmbientAudio !== '') && (
                <input type="text" value={editAmbientAudio} onChange={e => setEditAmbientAudio(e.target.value)} placeholder="e.g. https://.../ambient.mp3" className={inputCls()} />
              )}
            </div>
          </Field>
          <Field label="Ending Audio">
            <div className="flex flex-col space-y-2">
              <select 
                className={inputCls()} 
                value={AUDIO_REGISTRY.ending.find(a => a.url === editEndingAudio) ? editEndingAudio : (editEndingAudio ? 'custom' : '')}
                onChange={e => {
                  if (e.target.value !== 'custom') setEditEndingAudio(e.target.value);
                }}
              >
                <option value="">None</option>
                {AUDIO_REGISTRY.ending.map(a => <option key={a.id} value={a.url}>{a.name}</option>)}
                <option value="custom">Custom URL...</option>
              </select>
              {(!AUDIO_REGISTRY.ending.find(a => a.url === editEndingAudio) && editEndingAudio !== '') && (
                <input type="text" value={editEndingAudio} onChange={e => setEditEndingAudio(e.target.value)} placeholder="e.g. https://.../ending.mp3" className={inputCls()} />
              )}
            </div>
          </Field>

          <Field label="Intro Quote">
            <textarea value={editIntroQuote} onChange={e => setEditIntroQuote(e.target.value)} placeholder="e.g. 'Memories are the architecture of our identity.'" className={inputCls()} rows={2} />
          </Field>
          <div className="flex items-center space-x-4 mb-4 text-xs text-slate-300">
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={editAllowDownload} onChange={e => setEditAllowDownload(e.target.checked)} /> <span>Allow Download</span></label>
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={editAllowShare} onChange={e => setEditAllowShare(e.target.checked)} /> <span>Allow Share</span></label>
            <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={editShowWatermark} onChange={e => setEditShowWatermark(e.target.checked)} /> <span>Watermark</span></label>
          </div>
          <Field label="Animation Theme">
            <select
              className={inputCls()}
              value={editTheme}
              onChange={e => setEditTheme(e.target.value)}
            >
              {THEME_REGISTRY.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Text Color">
              <div className="flex space-x-2 items-center">
                <input type="color" value={editTextColor} onChange={e => setEditTextColor(e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                <input type="text" value={editTextColor} onChange={e => setEditTextColor(e.target.value)} className={inputCls()} />
              </div>
            </Field>
            <Field label="Background Color">
              <div className="flex space-x-2 items-center">
                <input type="color" value={editBackgroundColor} onChange={e => setEditBackgroundColor(e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                <input type="text" value={editBackgroundColor} onChange={e => setEditBackgroundColor(e.target.value)} className={inputCls()} />
              </div>
            </Field>
          </div>
          <button type="submit" disabled={editSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2">
            {editSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
          </button>
        </form>
      </Modal>


      {/* Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div className="bg-[#0a0f26] border border-indigo-500/20 rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                  <span>Image Library (Reuse Existing)</span>
                </h3>
                <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
                {libraryLoading ? (
                  <div className="py-20 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />Loading library...</div>
                ) : libraryPhotos.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">No photos in library.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {libraryPhotos.map((url) => {
                      const isSelected = selectedLibraryUrls.includes(url);
                      return (
                        <div 
                          key={url} 
                          onClick={() => {
                            setSelectedLibraryUrls(prev => isSelected ? prev.filter(u => u !== url) : [...prev, url]);
                            setMediaFiles([]); // clear local file selection if using library
                            setMediaUrl('');
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-emerald-500 scale-95 opacity-80 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:border-white/30'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5 shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-2 pt-4 border-t border-white/10 flex justify-end space-x-3 shrink-0">
                <button onClick={() => setShowLibrary(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => setShowLibrary(false)} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer">
                  Done ({selectedLibraryUrls.length} Selected)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
