import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

export default function App() {
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Restore Supabase session on mount + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.email) {
        setAdminEmail(s.user.email);
        setAdminLoggedIn(true);
      }
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.email) {
        setAdminEmail(s.user.email);
        setAdminLoggedIn(true);
      } else {
        setAdminLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAdminLoginSuccess = (email: string) => {
    setAdminEmail(email);
    setAdminLoggedIn(true);
    navigate('/admin');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminLoggedIn(false);
    navigate('/');
  };

  if (sessionLoading) return null; // Wait for session check before rendering

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/admin/*" element={
          adminLoggedIn ? (
            <AdminDashboard
              adminEmail={adminEmail}
              onLogout={handleLogout}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onNavigateHome={() => navigate('/')}
            />
          )
        } />

        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
