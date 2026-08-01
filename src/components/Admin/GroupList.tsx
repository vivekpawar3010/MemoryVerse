import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Image as ImageIcon, Video, Quote, Search, RefreshCw, Plus, Layers, Edit2, Trash2, Eye } from 'lucide-react';
import { useGroups, useDashboardSummary } from '../../hooks/useAdminData';
import { Group } from '../../types';
import { apiService } from '../../services/api';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast, Toast } from '../ui/Toast';

interface GroupListProps {
  onSelectGroup: (groupId: string) => void;
  onEditGroup: (group: Group) => void;
  onCreateGroup: () => void;
}

export const GroupList: React.FC<GroupListProps> = ({ onSelectGroup, onEditGroup, onCreateGroup }) => {
  const { data: groups, isLoading: loadingGroups, refetch: refetchGroups, isFetching } = useGroups();
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<{ id: string, name: string } | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const filteredGroups = (groups || []).filter(g => {
    const q = searchQuery.toLowerCase();
    return g.groupName.toLowerCase().includes(q) || (g.memoryId ?? '').toLowerCase().includes(q);
  });

  const handleDeleteGroup = (id: string, name: string) => {
    setGroupToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await apiService.deleteGroup(groupToDelete.id);
      refetchGroups();
      setGroupToDelete(null);
      showToast('Group deleted successfully', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete group', 'error');
    }
  };

  const loading = loadingGroups || loadingSummary;

  return (
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
            <button onClick={() => refetchGroups()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onCreateGroup} className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /><span>New Group</span>
            </button>
          </div>
        </div>

        {loadingGroups ? (
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
                  <tr key={group.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-cinzel">
                        {group.groupName.charAt(0)}
                      </div>
                      <span>{group.groupName}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-indigo-300">{group.memoryId}</td>
                    <td className="py-4 px-4 font-mono text-slate-400">{group.password || '—'}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center space-x-3 text-[10px]">
                        <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1 text-blue-400"/> {group.photoCount}</span>
                        <span className="flex items-center"><Video className="w-3 h-3 mr-1 text-amber-400"/> {group.videoCount}</span>
                        <span className="flex items-center"><Quote className="w-3 h-3 mr-1 text-emerald-400"/> {group.quoteCount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => onSelectGroup(group.id)} className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors cursor-pointer flex items-center space-x-1" title="Manage Media">
                          <Eye className="w-4 h-4" /> <span className="hidden lg:inline text-[10px] font-semibold uppercase tracking-wider">Manage</span>
                        </button>
                        <button onClick={() => onEditGroup(group)} className="p-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer" title="Edit Group">
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

      <ConfirmModal 
        isOpen={!!groupToDelete}
        title="Delete Group"
        message={`Delete group "${groupToDelete?.name}"? This permanently removes all photos, videos, and quotes.`}
        confirmText="Delete Group"
        onConfirm={confirmDelete}
        onCancel={() => setGroupToDelete(null)}
      />

      <Toast toast={toast} onClose={hideToast} />
    </motion.div>
  );
};
