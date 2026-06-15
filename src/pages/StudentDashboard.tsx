import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Loader2, Star } from 'lucide-react';
import { Enrollment, Certificate, Profile } from '../types';

export function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedEnrollment = useMemo(() => {
    if (!selectedEnrollmentId) return enrollments[0] || null;
    return enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) || enrollments[0] || null;
  }, [enrollments, selectedEnrollmentId]);

  const formation = selectedEnrollment?.formation || null;
  const hasParticipating = enrollments.some(e => e.status === 'participating');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/student/login', { replace: true });
        return;
      }

      setUserId(session.user.id);
      const token = session.access_token;
      const response = await fetch('/api/public/student/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || 'Impossible de charger votre espace étudiant.';
        if (response.status === 401) {
          navigate('/student/login', { replace: true });
          return;
        }
        setDashboardError(message);
        setLoading(false);
        return;
      }

      const payload = await response.json();
      if (payload.profile?.is_admin) {
        navigate('/admin', { replace: true });
        return;
      }

      const enrollmentData = Array.isArray(payload.enrollments) ? payload.enrollments : [];
      setProfile(payload.profile || null);

      if (enrollmentData.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      setEnrollments(enrollmentData as Enrollment[]);
      setSelectedEnrollmentId(enrollmentData[0].id);

      const firstEnrollmentId = enrollmentData[0].id;
      const { data: certificateData } = await supabase
        .from('certificates')
        .select('*')
        .eq('inscription_id', firstEnrollmentId)
        .eq('is_published', true)
        .single();

      if (certificateData) {
        setCertificate(certificateData as Certificate);
      }

      setLoading(false);
    }

    load();
  }, [navigate]);

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !selectedEnrollment?.formation_id) {
      alert('Impossible de récupérer votre session ou la formation.');
      return;
    }

    setReviewLoading(true);
    setReviewSuccess(false);

    try {
      const response = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          formation_id: selectedEnrollment.formation_id,
          rating,
          comment: reviewComment,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Erreur serveur');
      }

      setReviewSuccess(true);
      setReviewComment('');
      setRating(5);
    } catch (err: any) {
      alert(`Erreur lors de l'enregistrement de l'avis : ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const whatsappLink = formation?.whatsapp_url || '';
  const adminPhone = import.meta.env.VITE_ADMIN_WHATSAPP || '';
  const adminMessage = `Bonjour, je souhaite contacter l'administration au sujet de ma formation (${formation?.title || 'formation'}).`;
  const contactAdminUrl = `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(adminMessage)}`;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-xl text-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Erreur d'accès</h1>
          <p className="opacity-70 mb-6">{dashboardError}</p>
          <button onClick={() => navigate('/student/login')} className="px-6 py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold">
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0 || !selectedEnrollment) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-xl text-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Aucune formation trouvée</h1>
          <p className="opacity-70 mb-6">Vous n'avez pas encore de formation associée. Veuillez vous inscrire à une formation ou contacter l'administration.</p>
          <button onClick={() => navigate('/formations')} className="px-6 py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold">
            Explorer les formations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SEO title="Espace Étudiant | Biteck Ethan" description="Gestion des formations et avis étudiants." />

      <div className={`grid gap-10 ${hasParticipating ? 'lg:grid-cols-[0.95fr_1.45fr]' : 'lg:grid-cols-1'}`}>
        {hasParticipating && (
        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] opacity-60">Mes Formations</p>
                <h2 className="text-2xl font-bold">Sélectionnez une formation</h2>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700">{enrollments.length}</span>
            </div>
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <button
                  key={enrollment.id}
                  type="button"
                  onClick={() => setSelectedEnrollmentId(enrollment.id)}
                  className={`w-full rounded-3xl border px-5 py-5 text-left transition ${
                    enrollment.id === selectedEnrollment.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--foreground)]/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{enrollment.formation?.title || 'Formation inconnue'}</p>
                      <p className="text-sm opacity-70 mt-1">{enrollment.full_name}</p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.25em] font-semibold text-slate-500">
                      {enrollment.status === 'participating' ? 'Inscription + participation' : enrollment.status === 'validated' ? 'Inscription seule' : enrollment.status === 'cancelled' ? 'Annulé' : enrollment.status === 'pending' ? 'En attente' : enrollment.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background)] p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] opacity-70">Besoin d'aide ?</p>
            <p className="mt-4 text-sm opacity-70">Contactez l'administration via WhatsApp si vous avez besoin d'assistance sur votre dossier.</p>
            <a href={contactAdminUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition-opacity">
              Contacter l'administration
            </a>
          </div>
        </aside>
        )}

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] opacity-70">Détails de la formation</p>
                <h1 className="text-3xl font-bold mt-3">{formation?.title || 'Formation sélectionnée'}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{formation?.description || 'Description non disponible.'}</p>
              </div>
                <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-60">Type</p>
                  <p className="mt-2 text-sm font-semibold">{formation?.category_id || 'N/C'}</p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-60">Statut</p>
                  <p className="mt-2 text-sm font-semibold">{selectedEnrollment.payment_status === 'paid' ? 'Payé' : selectedEnrollment.status || selectedEnrollment.payment_status}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Début</p>
                <p className="mt-2 font-semibold">{formation?.start_date ? new Date(formation.start_date).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Places</p>
                <p className="mt-2 font-semibold">{(typeof formation?.places_max === 'number' && typeof formation?.current_students === 'number') ? Math.max(0, formation.places_max - formation.current_students) : formation?.places_max ?? 'N/C'}</p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Tarif</p>
                <p className="mt-2 font-semibold">{formation?.price?.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background)] p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] opacity-70">Laisser un avis</p>
                <h2 className="text-2xl font-bold">Votre retour compte</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-700">
                <Star className="w-4 h-4" /> {rating}/5
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Note</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setRating(value)}
                      className={`rounded-full border p-3 transition ${
                        value <= rating ? 'border-amber-400 bg-amber-100 text-amber-600' : 'border-[var(--border)] text-slate-500'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Commentaire</label>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={6}
                  placeholder="Partagez votre expérience avec cette formation..."
                  className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="inline-flex items-center justify-center rounded-3xl bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition"
              >
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer mon avis'}
              </button>

              {reviewSuccess && (
                <p className="rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Merci ! Votre avis a bien été enregistré.</p>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
