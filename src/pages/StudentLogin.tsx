import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

export function StudentLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    }

    checkSession();
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setLoading(true);
    const signupTimeoutMs = 30000; // 30s timeout
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const redirectTo = `${window.location.origin}/dashboard`;

      if (mode === 'signup') {
        const randomPassword =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

        // Create a timeout promise for signup
        const signupPromise = supabase.auth.signUp({
          email,
          password: randomPassword,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), signupTimeoutMs)
        );

        const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;

        if (error) {
          setError(error.message);
          return;
        }

        if (data?.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email,
              is_admin: false,
            });
          } catch (profileErr) {
            console.warn('Profile creation delayed (will sync on confirmation):', profileErr);
          }
        }

        // Show confirmation email message instead of success message
        setSuccessMessage(
          "✓ Un email de confirmation vous a été envoyé. Veuillez cliquer sur le lien pour activer votre compte C&B Services et accéder à votre espace étudiant."
        );
        setMode('login');
        // Reset form but don't redirect
        setEmail('');
      } else {
        // OTP/Magic link flow
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        setSuccessMessage(
          "Un lien magique a été envoyé à votre adresse email. Cliquez dessus pour accéder à votre espace étudiant."
        );
        setEmail('');
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.message === 'TIMEOUT') {
        setError(
          "⏱️ Le serveur met trop de temps à répondre. Ne vous inquiétez pas ! Vérifiez votre boîte email (y compris les spams). Si vous n'avez rien reçu dans 5 minutes, veuillez réessayer."
        );
      } else if (err.message?.includes('504') || err.message?.includes('timeout')) {
        setError(
          "⏱️ Le serveur est momentanément surchargé. Vérifiez votre email quand même et réessayez plus tard si nécessaire."
        );
      } else {
        setError(err.message || 'Erreur inattendue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <SEO title="Connexion Étudiant | Biteck Ethan" description="Accédez à votre espace étudiant." />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Espace Étudiant</h1>
            <p className="text-sm opacity-70">{mode === 'login' ? 'Connectez-vous' : 'Créez votre compte étudiant'}.</p>
          </div>

          {(error || successMessage) && (
            <div className={`rounded-2xl p-4 mb-6 text-sm ${error ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>
              {error || successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
              />
              <p className="mt-2 text-xs opacity-70">
                {mode === 'login'
                  ? "Un lien magique sera envoyé à votre email pour vous connecter."
                  : "Nous créerons un compte et vous enverrons un email de confirmation."
                }
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm opacity-70">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => setMode('signup')} className="font-semibold text-blue-600 hover:underline">
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                Déjà inscrit ?{' '}
                <button type="button" onClick={() => setMode('login')} className="font-semibold text-blue-600 hover:underline">
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
