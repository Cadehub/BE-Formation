import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { motion } from 'motion/react';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!profileError && profile?.is_admin) {
          navigate('/admin');
        } else {
          supabase.auth.signOut();
          setError("Accès refusé. Vous n'avez pas les droits d'administration.");
        }
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session?.user?.id)
      .single();

    if (!profile || profileError || !profile.is_admin) {
        await supabase.auth.signOut();
        setError("Accès refusé. Compte non autorisé.");
        setLoading(false);
        return;
    }

    const from = location.state?.from || '/admin';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <SEO title="Admin Login | Biteck Ethan" description="Portail d'administration sécurisé" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="p-8 md:p-10 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl relative overflow-hidden ">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-600 mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Accès Sécurisé</h1>
            <p className="text-sm opacity-60">Authentification requise pour le cockpit admin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-70">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="biteckdebongethancade@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-70">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Ouvrir le Cockpit</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
