import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Quote,
  Heart,
  PartyPopper,
  KeyRound,
  User,
} from 'lucide-react';
import { apiService, extractDisplayName } from '../services/api';
import { VisitorGroupAccess } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { SpaceBackground } from './SpaceBackground';
import { HeroTitle } from './HeroTitle';
import { BeginJourneyButton } from './BeginJourneyButton';
import { BackgroundMusic } from './BackgroundMusic';
import { MemoryVaultView } from './MemoryVaultView';

export const LandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVaultForm, setShowVaultForm] = useState(false);

  const [visitorName, setVisitorName] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessData, setAccessData] = useState<VisitorGroupAccess | null>(null);
  const [wishToast, setWishToast] = useState<string | null>(null);
  const [isBrightened, setIsBrightened] = useState(false);

  const triggerStarShower = async (nameOverride?: string) => {
    // Brighten up the 3D space background and multiply glowing stars
    setIsBrightened(true);

    // 1. Play celebratory harmonic space chime
    playSpaceSoundEffect();

    // 2. Trigger multi-angle star burst using canvas-confetti
    const count = 250;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#F59E0B', '#FCD34D', '#EC4899', '#6366F1', '#FFFFFF'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      shapes: ['star', 'circle'],
      scalar: 1.2,
    });
    fire(0.2, {
      spread: 60,
      shapes: ['star'],
      scalar: 1.5,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 1,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.3,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    // Side cannons
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#EC4899', '#38BDF8'],
        shapes: ['star'],
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#EC4899', '#38BDF8'],
        shapes: ['star'],
      });
    }, 250);

    // 3. Extract friend's actual name for wish toast (e.g. "Alex vivek's friend" -> "Alex")
    const rawInput = (nameOverride !== undefined ? nameOverride : visitorName).trim();
    const cleanName = extractDisplayName(rawInput);

    const msg = cleanName && cleanName !== 'Friend'
      ? `✨ Happy Friendship Day, ${cleanName}! May your bond shine forever in the stars! 🤝🌟`
      : '✨ Happy Friendship Day to Everyone! May your bond shine forever in the stars! 🤝🌟';

    setWishToast(msg);
    setTimeout(() => setWishToast(null), 8000);
  };

  const playSpaceSoundEffect = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.08 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 2.1);
      });
    } catch {
      // Ignore if web audio not available
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim()) {
      setError('Please enter your name first.');
      return;
    }

    if (!groupNameInput.trim() || !password) {
      setError('Please fill in both Group Name and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiService.verifyVisitorMemoryAccess(groupNameInput, password);
      setAccessData(res);
      triggerStarShower(visitorName.trim());
      apiService.logVisitorAccess(visitorName.trim(), res.groupId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Group not found or incorrect password. Please check with admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCredentials = (groupName: string, demoPass: string) => {
    setGroupNameInput(groupName);
    setPassword(demoPass);
    if (!visitorName.trim()) {
      setVisitorName("Guest User");
    }
    setError(null);
    setShowVaultForm(true);
  };

  const handleContinueJourney = async () => {
    setLoading(true);
    try {
      const res = await apiService.getDefaultForPublicJourney();
      setAccessData(res);
      const vName = visitorName.trim() || "Guest";
      triggerStarShower(vName);
      apiService.logVisitorAccess(vName, res.groupId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No default public group found. Please login via the Vault portal.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (accessData) {
    return <MemoryVaultView data={accessData} onBack={() => setAccessData(null)} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050816] text-white flex flex-col items-center justify-between p-3 sm:p-5 font-sans-clean overflow-x-hidden select-none">
      {/* 1. Loading Screen Sequence */}
      {!isLoaded && <LoadingScreen onLoadingComplete={() => setIsLoaded(true)} />}

      {/* 2. Deep Space 3D Starfield Canvas */}
      <SpaceBackground isLoaded={isLoaded} isBrightened={isBrightened} />

      {/* Top Header Navigation Bar with Logo */}
      {isLoaded && (
        <header className="relative z-20 w-full max-w-5xl flex items-center justify-between py-2.5 px-2">
          <div className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-500 p-[1px] shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#080d21] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="font-cinzel text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-amber-100 via-amber-300 to-amber-200 bg-clip-text text-transparent">
                MemoryVerse
              </span>
              <span className="block text-[9px] sm:text-[10px] font-semibold tracking-widest text-slate-400 uppercase font-sans-clean">
                Friendship Vault & Memory Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Top Right Header Unlock Vault button (Appears when name is entered) */}
            {visitorName.trim() && (
              <button
                onClick={() => {
                  setShowVaultForm(true);
                  playSpaceSoundEffect();
                }}
                className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 border border-purple-400/50 hover:border-pink-400/80 text-white hover:text-pink-200 hover:scale-105 text-xs font-bold tracking-widest flex items-center space-x-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] backdrop-blur-md"
              >
                <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300 animate-pulse shrink-0" />
                <span className="hidden sm:inline">🔓 UNLOCK VAULT</span>
                <span className="sm:hidden">🔓</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      {isLoaded && (
        <main className="relative z-20 w-full max-w-3xl my-auto py-2 sm:py-4 flex flex-col items-center justify-center text-center">
          {/* Wish Toast Banner Notification */}
          <AnimatePresence>
            {wishToast && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.9 }}
                className="mb-4 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-purple-500/30 border border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-md text-amber-100 text-xs sm:text-sm font-bold tracking-wide flex items-center space-x-2.5"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 animate-spin shrink-0" />
                <span>{wishToast}</span>
                <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Greeting Section */}
          <HeroTitle
            isVisible={isLoaded}
            visitorName={visitorName}
            onVisitorNameChange={setVisitorName}
            onWishTrigger={triggerStarShower}
          />

          <div className="flex items-center justify-center mt-3">
            <BeginJourneyButton 
              isVisible={isLoaded} 
              disabled={!visitorName.trim()}
              onPlaySound={playSpaceSoundEffect}
              onContinue={handleContinueJourney} 
            />
          </div>

          {/* Unlock Memory Vault Full Screen Dedicated Page */}
          <AnimatePresence>
            {showVaultForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#050816]/98 backdrop-blur-2xl overflow-y-auto"
              >
                <div className="w-full max-w-lg p-6 sm:p-10 rounded-3xl glass-card border border-amber-400/30 bg-[#0a0f26]/95 shadow-[0_0_100px_rgba(245,158,11,0.25)] relative text-left">
                  {/* Top Bar with Back to Home Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowVaultForm(false)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-amber-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <span>← Back to Home</span>
                    </button>
                    <span className="text-xs font-bold font-cinzel text-amber-300 tracking-widest uppercase">
                      Vault Security Portal
                    </span>
                  </div>

                  {/* Greeting Banner */}
                  <div className="mb-6 py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 border border-amber-400/50 text-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <span className="text-xs font-bold tracking-wide text-amber-200 flex items-center justify-center space-x-2">
                      <Heart className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                      <span>Unlock Your Assigned Memory Files 🤝✨</span>
                    </span>
                  </div>

                  {/* Heading & Instructions */}
                  <div className="text-center mb-6">
                    <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-tight text-amber-100 text-glow-gold mb-2">
                      Memory Vault Access
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-sans-clean">
                      Enter your group details assigned by the Admin to view your private group photos, videos, and memories.
                    </p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Your Name Field */}
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5">
                        Your Name <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 w-4 h-4 text-emerald-400" />
                        <input
                          type="text"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          placeholder="e.g. Alex or Sarah"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm tracking-wide text-emerald-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 transition-all font-sans-clean"
                        />
                      </div>
                    </div>

                    {/* Group Name Field */}
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5">
                        Group Name / Memory ID <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Users className="absolute left-3.5 w-4 h-4 text-amber-400/80" />
                        <input
                          type="text"
                          value={groupNameInput}
                          onChange={(e) => setGroupNameInput(e.target.value)}
                          placeholder="e.g. The Starlight Squad 2026"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm tracking-wide text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all font-sans-clean"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5">
                        Group Access Password <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <ShieldCheck className="absolute left-3.5 w-4 h-4 text-amber-400/80" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm tracking-wider text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all"
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-snug"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-6 rounded-xl font-cinzel font-semibold tracking-widest uppercase text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Unlocking Assigned Files...</span>
                        </>
                      ) : (
                        <>
                          <span>🔓 Open My Assigned Files</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>


                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Background Ambient Audio Control */}
      {isLoaded && <BackgroundMusic />}

      {/* Footer */}
      {isLoaded && (
        <footer className="relative z-20 w-full text-center py-2.5 text-[11px] text-slate-400 font-sans-clean tracking-wider flex flex-wrap items-center justify-center gap-2">
          <span>© 2026 MemoryVerse • Private Memory Sharing System</span>
          <span className="hidden sm:inline">•</span>
          <a
            href="https://vivekpawar.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-all font-medium group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Developer: Vivek Pawar</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </footer>
      )}
    </div>
  );
};

