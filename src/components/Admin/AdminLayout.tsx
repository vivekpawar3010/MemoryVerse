import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  MonitorPlay, 
  Image as ImageIcon, 
  Palette, 
  Music, 
  BarChart2, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  onLogout,
  activeTab = 'dashboard',
  onTabChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'groups', label: 'Groups', icon: FolderOpen },
    { id: 'studio', label: 'Memory Studio', icon: MonitorPlay },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'stats', label: 'Statistics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#02040a] text-white overflow-hidden font-sans">
      {/* Sidebar (Panel 1) */}
      <aside 
        className={`flex flex-col bg-[#050816] border-r border-indigo-500/20 transition-all duration-300 z-50 relative \${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-indigo-500/20 shrink-0">
          {!isCollapsed && (
            <span className="font-cinzel font-bold text-sm tracking-wider text-indigo-400 truncate">
              MemoryVerse
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors ml-auto"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group \${
                  isActive 
                    ? 'bg-indigo-600/20 text-indigo-400' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                {!isCollapsed && (
                  <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-indigo-500/20 shrink-0">
          <button
            onClick={onLogout}
            title={isCollapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};
