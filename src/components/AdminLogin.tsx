import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Mail, Lock, Sparkles, ArrowLeft, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !data.session) {
        throw new Error('Invalid administrator email or password.');
      }

      onLoginSuccess(data.user.email ?? email);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050816] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans-clean overflow-hidden select-none">
      {/* Background Ambient Space Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[130px]" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[130px]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-2">
        <button
          onClick={onNavigateHome}
          className="flex items-center space-x-2 px-4 py-2 rounded-full glass-card hover:border-amber-400/40 text-xs font-medium text-slate-300 hover:text-amber-200 transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          <span className="font-sans-clean tracking-wider uppercase text-[11px]">Visitor Portal</span>
        </button>

        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="font-cinzel text-sm tracking-widest text-slate-300 uppercase font-semibold">
            MemoryVerse Admin
          </span>
        </div>
      </header>

      {/* Main Admin Login Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 sm:p-10 rounded-3xl glass-card border border-indigo-500/30 bg-[#0a0f26]/85 shadow-[0_0_60px_rgba(5,8,22,0.9)] relative backdrop-blur-xl"
        >
          {/* Card Header */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)]">
            <ShieldAlert className="w-7 h-7 text-indigo-300" />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-tight text-white text-glow-white mb-2">
              Administrator Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans-clean">
              Authorized system administrators only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
                Administrator Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-indigo-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@memoryverse.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40 transition-all font-sans-clean"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-indigo-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40 transition-all font-sans-clean"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
              >
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-cinzel font-semibold tracking-widest uppercase text-xs text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Dashboard</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-500 font-sans-clean tracking-wider">
              Authorized personnel only. All access is logged.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 font-sans-clean tracking-wider">
        MemoryVerse Administrator Authentication Engine
      </footer>
    </div>
  );
};
