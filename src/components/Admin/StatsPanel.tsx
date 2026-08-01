import React from 'react';
import { BarChart2, Users, Eye, Image as ImageIcon, Activity, Clock, RefreshCw, Quote, Video } from 'lucide-react';
import { useVisitorLogs } from '../../hooks/useAdminData';
import { useDashboardSummary } from '../../hooks/useAdminData';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
}

export const StatsPanel: React.FC = () => {
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary, isFetching: fetchingSummary } = useDashboardSummary();
  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs, isFetching: fetchingLogs } = useVisitorLogs();

  const STATS = [
    { label: 'Total Visitors', value: logs?.length ?? 0, icon: Users, color: 'indigo' },
    { label: 'Total Groups', value: summary?.totalGroups ?? 0, icon: Activity, color: 'purple' },
    { label: 'Photos', value: summary?.totalPhotos ?? 0, icon: ImageIcon, color: 'blue' },
    { label: 'Videos', value: summary?.totalVideos ?? 0, icon: Video, color: 'amber' },
    { label: 'Quotes', value: summary?.totalQuotes ?? 0, icon: Quote, color: 'emerald' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    purple: 'bg-purple-500/10 text-purple-400',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  };

  const isLoading = loadingSummary || loadingLogs;
  const isFetching = fetchingSummary || fetchingLogs;

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-7xl mx-auto animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-white mb-2 flex items-center gap-3">
            <BarChart2 className="text-indigo-400" />
            Analytics Overview
          </h1>
          <p className="text-slate-400 text-sm">Live data from your MemoryVerse database. Auto-refreshes every 30 seconds.</p>
        </div>
        <button
          onClick={() => { refetchSummary(); refetchLogs(); }}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-black/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden hover:border-slate-700 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colorMap[stat.color]}`}>
                <Icon size={18} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {isLoading ? <span className="w-12 h-6 bg-white/10 rounded animate-pulse block" /> : stat.value.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-black/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Recent Visitors</h2>
            <p className="text-xs text-slate-400">Latest visitors logged across all memory groups.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{logs?.length ?? 0} entries</span>
        </div>

        {loadingLogs ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading visitor data...
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <Eye size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No visitor logs yet.</p>
            <p className="text-xs text-slate-700 mt-1">Logs appear when visitors access a memory group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Visitor</th>
                  <th className="px-6 py-4 font-semibold">Group Accessed</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {initials(log.visitorName)}
                        </div>
                        <div className="text-sm font-semibold text-white">{log.visitorName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300">
                        {log.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={13} className="text-slate-500" />
                        {timeAgo(log.visitedAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
