import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) navigate('/admin/login', { replace: true, state: { from: location.pathname } });
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        await supabase.auth.signOut();
        if (mounted) navigate('/', { replace: true });
        return;
      }

      if (mounted) {
        setIsAuthorized(true);
        setLoading(false);
      }
    }
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
            navigate('/admin/login', { replace: true });
            return;
        }

        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!currentProfile?.is_admin) {
            await supabase.auth.signOut();
            navigate('/', { replace: true });
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] mb-4" />
        <p className="text-sm opacity-60 uppercase tracking-widest font-semibold text-[var(--foreground)]">Vérification de sécurité...</p>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
