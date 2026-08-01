import React, { useState } from 'react';
import { AdminLayout } from './Admin/AdminLayout';
import { useEditorStore } from '../store/EditorStore';
import { GroupList } from './Admin/GroupList';
import { ThemePanel } from './Admin/ThemePanel';
import { AudioPanel } from './Admin/AudioPanel';
import { GlobalMediaLibrary } from './Admin/GlobalMediaLibrary';
import { StatsPanel } from './Admin/StatsPanel';
import { SettingsPanel } from './Admin/SettingsPanel';
import { MemoryStudio } from './AdminStudio/MemoryStudio';
import { Group, VisitorGroupAccess } from '../types';
import { apiService } from '../services/api';
import { useToast, Toast } from './ui/Toast';
import { Sparkles, X, Plus, Loader2, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
}

// ─── Create Group Modal ──────────────────────────────────────────────────────
const CreateGroupModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [membersText, setMembersText] = useState('');
  const [theme, setTheme] = useState('CinematicSpace');
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) { showToast('Group name is required.', 'error'); return; }
    if (!password.trim()) { showToast('Password is required.', 'error'); return; }
    setSaving(true);
    try {
      const members = membersText
        .split('\n')
        .map(m => m.trim())
        .filter(Boolean);
      await apiService.createGroup({
        groupName: groupName.trim(),
        password: password.trim(),
        theme,
        members,
      });
      showToast(`Group "${groupName}" created!`, 'success');
      setTimeout(() => { onCreated(); onClose(); }, 800);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create group.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0d1229] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-lg font-cinzel font-bold text-white">New Memory Group</h2>
              <p className="text-xs text-slate-500">Fill in the details to create a new group</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Group Name *</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Starlight Squad 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access Password *</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="e.g. friendship2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            <p className="text-[10px] text-slate-600 mt-1">Visitors will enter this to unlock the group.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Theme</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {['CinematicSpace', 'CyberFuture', 'DreamClouds', 'FloatingMuseum', 'GoldenHour', 'OceanMemories', 'VintageBook', 'CampfireNight'].map(t => (
                <option key={t} value={t} className="bg-slate-900">{t.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users size={12} /> Members <span className="font-normal text-slate-600 normal-case">(optional, one per line)</span>
            </label>
            <textarea
              value={membersText}
              onChange={e => setMembersText(e.target.value)}
              placeholder={"Alex Johnson\nSarah Williams\nMichael Chen"}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-600 mt-1">These names can be used to verify visitors by name.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Create Group</>}
            </button>
          </div>
        </form>

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeGroup, setActiveGroup] = useState<VisitorGroupAccess | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();

  const handleSelectGroup = async (groupId: string) => {
    try {
      setLoadingGroup(true);
      const groupData = await apiService.getGroupDetails(groupId);
      const group = groupData as unknown as VisitorGroupAccess;
      setActiveGroup(group);
      const { setGroupId, setGroupDetails } = useEditorStore.getState();
      setGroupId(group.groupId ?? groupId);
      setGroupDetails(group);
      setActiveTab('studio');
    } catch (e: any) {
      showToast(e.message || 'Failed to load group details', 'error');
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleGroupCreated = () => {
    // Invalidate the groups query so the list refreshes
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
  };

  const renderContent = () => {
    if (activeTab === 'studio' && activeGroup) {
      return (
        <MemoryStudio
          groupDetails={activeGroup}
          onBack={() => {
            setActiveGroup(null);
            setActiveTab('groups');
          }}
        />
      );
    }

    if (activeTab === 'dashboard' || activeTab === 'groups' || (activeTab === 'studio' && !activeGroup)) {
      return (
        <div className="p-8 h-full overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-cinzel font-bold text-white mb-2">Workspace</h1>
              <p className="text-slate-400 text-sm">Logged in as {adminEmail}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {loadingGroup && <div className="text-indigo-400 animate-pulse text-sm font-semibold">Loading Studio...</div>}

              {/* Create Group button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <Plus size={15} /> New Group
              </button>

              {/* Edit Global Space button */}
              <button
                onClick={async () => {
                  try {
                    setLoadingGroup(true);
                    const globalGroup = await apiService.getDefaultForPublicJourney();
                    setActiveGroup(globalGroup);
                    const { setGroupId, setGroupDetails } = useEditorStore.getState();
                    setGroupId(globalGroup.groupId);
                    setGroupDetails(globalGroup);
                    setActiveTab('studio');
                  } catch (e: any) {
                    showToast(e.message || 'Failed to load global space', 'error');
                  } finally {
                    setLoadingGroup(false);
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} /> Edit Global Space
              </button>
            </div>
          </div>

          {activeTab === 'studio' && !activeGroup && (
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">!</div>
              <p className="text-sm text-indigo-200">Please select a group below to open the Memory Studio editor.</p>
            </div>
          )}

          <GroupList
            onSelectGroup={handleSelectGroup}
            onEditGroup={(g) => handleSelectGroup(g.id)}
            onCreateGroup={() => setShowCreateModal(true)}
          />
        </div>
      );
    }

    if (activeTab === 'themes') return <ThemePanel />;
    if (activeTab === 'audio') return <AudioPanel />;
    if (activeTab === 'media') return <GlobalMediaLibrary />;
    if (activeTab === 'stats') return <StatsPanel />;
    if (activeTab === 'settings') return <SettingsPanel />;

    return (
      <div className="p-8 h-full flex items-center justify-center text-slate-500">
        This panel is under construction.
      </div>
    );
  };

  return (
    <AdminLayout onLogout={onLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
      <Toast toast={toast} onClose={hideToast} />

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </AdminLayout>
  );
};
