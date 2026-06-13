import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Loader2, Lock, CheckCircle2, ArrowRight, Mail, Download, MessageCircle } from 'lucide-react';
import { Inscription, Formation, Certificate } from '../types';

export function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [inscription, setInscription] = useState<Inscription | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/student/login', { replace: true });
        return;
      }

      setUserId(session.user.id);
      const { data: profiles } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
      if (profiles?.is_admin) {
        navigate('/admin', { replace: true });
        return;
      }

      const { data: userInscription, error: inscriptionError } = await supabase
        .from('inscriptions')
        .select('*, formations(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inscriptionError || !userInscription) {
        setLoading(false);
        return;
      }

      setInscription(userInscription as Inscription);
      setFormation((userInscription as any).formations || null);

      const { data: certificateData } = await supabase
        .from('certificates')
        .select('*')
        .eq('inscription_id', userInscription.id)
        .eq('is_published', true)
        .single();

      if (certificateData) {
        setCertificate(certificateData as Certificate);
      }

      setLoading(false);
    }

    load();
  }, [navigate]);

  const triggerPayment = () => {
    if (!inscription || !formation) return;
    const checkoutUrl = `https://checkout.chariow.cm/pay?amount=${formation.price}&order_id=${inscription.id}&return_url=${encodeURIComponent(window.location.origin + '/dashboard')}`;
    window.location.href = checkoutUrl;
  };

  const whatsappLink = formation?.whatsapp_url || '';
  const adminPhone = import.meta.env.VITE_ADMIN_WHATSAPP || '';
  const adminMessage = `Bonjour, je souhaite contacter l'administration au sujet de mon inscription (${inscription?.full_name || 'Étudiant'}).`;
  const contactAdminUrl = `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(adminMessage)}`;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-xl text-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Aucune inscription trouvée</h1>
          <p className="opacity-70 mb-6">Vous n'avez pas encore de dossier associé. Veuillez vous inscrire à une formation ou contacter l'administration.</p>
          <button onClick={() => navigate('/formations')} className="px-6 py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold">
            Explorer les formations
          </button>
        </div>
      </div>
    );
  }

  const isPaid = inscription.payment_status === 'paid';
  const isPending = inscription.payment_status === 'pending';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SEO title="Dashboard Étudiant | Biteck Ethan" description="Votre espace personnel de suivi de paiement." />

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] opacity-60">Bonjour {inscription.full_name.split(' ')[0] || 'Cher étudiant'}</p>
                <h1 className="text-4xl font-bold tracking-tight">Mon espace de formation</h1>
              </div>
              <div className="inline-flex items-center gap-2 rounded-3xl bg-blue-500/10 px-4 py-2 text-blue-700 font-semibold text-sm">
                <Lock className="w-4 h-4" />
                Statut : {inscription.payment_status === 'paid' ? 'Payé' : 'En attente'}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Formation</p>
                <p className="font-semibold text-lg mt-2">{formation?.title || 'Formation inconnue'}</p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Paiement</p>
                <p className="font-semibold text-lg mt-2 capitalize">{inscription.payment_method === 'cash' ? 'Espèces' : 'En ligne via Chariow'}</p>
                <p className="text-sm opacity-70 mt-2">{inscription.payment_timing === 'now' ? 'Paiement immédiat' : 'Paiement différé'}</p>
              </div>
            </div>
          </div>

          {isPending && (
            <div className="rounded-[2rem] border border-yellow-300/30 bg-yellow-50/60 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-700 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Paiement en attente</h2>
                  <p className="opacity-70">Votre accès reste verrouillé tant que le paiement n'est pas validé.</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6">
                  <p className="text-sm uppercase tracking-[0.25em] opacity-60 mb-3">Récapitulatif</p>
                  <p className="font-medium">Mode de paiement : {inscription.payment_method === 'cash' ? 'Espèces' : 'En ligne via Chariow'}</p>
                  <p className="font-medium">Moment du paiement : {inscription.payment_timing === 'now' ? 'Maintenant' : 'Plus tard'}</p>
                </div>

                {inscription.payment_method === 'chariow' ? (
                  <button onClick={triggerPayment} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Payer en ligne maintenant
                  </button>
                ) : (
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-3">
                    <p className="text-lg font-semibold">Paiement en espèces</p>
                    <p className="opacity-70">Votre dossier sera validé manuellement par l'administration une fois le paiement reçu.</p>
                    <div className="rounded-2xl bg-white border border-[var(--border)] p-4">
                      <p className="text-sm font-semibold">Contact Administration</p>
                      <p className="text-sm opacity-70 mt-2">Utilisez votre propre application WhatsApp pour écrire à l'administration. Ce lien n'est pas rendu dans le DOM.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPaid && (
            <div className="rounded-[2rem] border border-green-300/30 bg-green-50/60 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Paiement validé</h2>
                  <p className="opacity-70">Vous pouvez maintenant accéder aux ressources officielles.</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--border)] bg-[var(--background)] py-5 px-6 text-left shadow-sm hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="font-semibold">Rejoindre le groupe WhatsApp</p>
                  </div>
                  <p className="text-sm opacity-70">Accès instantané au groupe de formation.</p>
                </a>
                <a href={contactAdminUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--border)] bg-[var(--background)] py-5 px-6 text-left shadow-sm hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold">Contacter l'Admin</p>
                  </div>
                  <p className="text-sm opacity-70">Envoyer un message pré-rempli à l'administration.</p>
                </a>
              </div>
            </div>
          )}

          {certificate && (
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] opacity-60">Certificat publié</p>
                  <h2 className="text-2xl font-bold">Téléchargez votre certificat</h2>
                </div>
                <Download className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <a href={certificate.file_url || '#'} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)] px-6 py-3 font-semibold hover:opacity-90 transition-opacity">
                Télécharger mon certificat
              </a>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
            <p className="text-sm uppercase tracking-[0.25em] opacity-70">Informations utiles</p>
            <div className="mt-6 space-y-4 text-sm opacity-80">
              <p>Votre paiement est actuellement <strong>{inscription.payment_status}</strong>.</p>
              <p>{formation?.start_date ? `La formation commence le ${new Date(formation.start_date).toLocaleDateString('fr-FR')}.` : 'Aucune date de début configurée.'}</p>
              <p>Pour valider un paiement en espèces, contactez l'administration et demandez la confirmation manuelle du statut.</p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Besoin d'aide ?</h3>
            <p className="mt-3 text-sm opacity-70">Si vous ne voyez pas votre inscription après paiement, envoyez un message à l'administration en utilisant le lien ci-dessus.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
