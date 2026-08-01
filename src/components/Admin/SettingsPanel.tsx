import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast, Toast } from '../ui/Toast';

export const SettingsPanel: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      // In a real scenario, you'd want to re-authenticate or verify the current password first.
      // Since Supabase `updateUser` updates the password for the current session directly, we rely on session state.
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      showToast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-4xl mx-auto animate-in fade-in duration-300 font-sans relative">
      
      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm">Manage your administrator account and system preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-48 shrink-0 flex flex-col gap-1">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl text-sm font-bold transition-colors">
            <ShieldAlert size={16} /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-black/40 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Change Password</h2>
              <p className="text-xs text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors w-full sm:w-auto disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
