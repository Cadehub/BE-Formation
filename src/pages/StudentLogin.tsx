import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

export function StudentLogin() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [formationId, setFormationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Veuillez entrer votre nom complet.');
        return;
      }
      if (!phone.trim()) {
        setError('Veuillez entrer votre numéro de téléphone.');
        return;
      }
      if (!formationId.trim()) {
        setError('Veuillez indiquer l\'ID de la formation.');
        return;
      }
      if (!age.trim() || Number.isNaN(Number(age))) {
        setError('Veuillez entrer un âge valide.');
        return;
      }
      if (!paymentMethod.trim()) {
        setError('Veuillez indiquer le mode de paiement.');
        return;
      }
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/dashboard`;

      if (mode === 'signup') {
        const randomPassword =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password: randomPassword,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              formation_id: formationId,
              full_name: fullName,
              phone,
              age: parseInt(age, 10),
              payment_method: paymentMethod,
            },
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data?.user?.id) {
          setIsSuccess(true);
          setSuccessMessage(
            'Inscription réussie ! Un e-mail de confirmation vous a été envoyé. Veuillez cliquer sur le lien dans l\'e-mail pour activer votre compte et accéder à votre espace.'
          );
          setEmail('');
          setFullName('');
          setPhone('');
          setAge('');
          setPaymentMethod('');
          setFormationId('');
        } else {
          setError('Impossible de créer le compte. Veuillez réessayer plus tard.');
        }
      } else {
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
      if (err.message?.includes('504') || err.message?.toLowerCase().includes('timeout')) {
        setError(
          "Le serveur a mis trop de temps à répondre. Vérifiez quand même votre boîte email. Si rien n'arrive dans 5 minutes, réessayez."
        );
      } else {
        setError(err.message || 'Erreur inattendue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <SEO title="Confirmation d'email envoyée | Biteck Ethan" description="Vérifiez votre email pour activer votre compte étudiant." />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl text-center">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Inscription réussie !</h1>
            <p className="text-sm opacity-80 mb-6">
              Un e-mail de confirmation vous a été envoyé.
              Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte et accéder à votre espace.
            </p>
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Retour au formulaire
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+237 6 99 99 99 99"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">Âge</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      placeholder="22"
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">Mode de paiement</label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      placeholder="Carte / Espèces / Mobile money"
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">ID de la formation</label>
                  <input
                    type="text"
                    value={formationId}
                    onChange={(e) => setFormationId(e.target.value)}
                    required
                    placeholder="UUID de la formation"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                  />
                </div>
              </>
            )}

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
