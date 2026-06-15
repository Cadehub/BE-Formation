import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  MessageCircle,
  Twitter,
  Youtube,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Profile } from '../types';

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  github: Github,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  website: Globe,
  portfolio: ExternalLink,
};

export function StudentProfile() {
  const { student_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platformWhatsApp, setPlatformWhatsApp] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!student_id) {
        setError('Identifiant étudiant manquant.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/profiles/${encodeURIComponent(student_id)}`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || 'Profil introuvable');
        }

        const payload = await response.json();
        setProfile(payload.profile || null);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du profil.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [student_id]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/public/settings');
        if (!response.ok) return;
        const data = await response.json();
        if (data?.whatsapp_number) {
          setPlatformWhatsApp(data.whatsapp_number);
        }
      } catch (err) {
        console.error('Impossible de récupérer le WhatsApp de la plateforme', err);
      }
    }

    fetchSettings();
  }, []);

  const parsedSocialLinks = (() => {
    if (!profile?.social_links) return {} as Record<string, string>;
    if (typeof profile.social_links === 'string') {
      try {
        return JSON.parse(profile.social_links) as Record<string, string>;
      } catch {
        return {} as Record<string, string>;
      }
    }

    return profile.social_links as Record<string, string>;
  })();

  const socialItems = Object.entries(parsedSocialLinks).filter(([, url]) => typeof url === 'string' && url.trim().length > 0);
  const whatsappNumber = profile?.phone?.replace(/\D/g, '');
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined;

  // Profile table does not include `full_name`/`photo_url` in the current schema.
  const heroTitle = profile?.full_name || profile?.student_id || profile?.email || 'Profil étudiant';
  const heroSubtitle = profile?.bio || 'Découvrir le parcours de cet étudiant.';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {profile?.allow_seo_indexing && (
        <SEO
          title={`${heroTitle} | Profil étudiant`}
          description={profile.bio || 'Profil étudiant sur C&B Services'}
          url={`/etudiants/${student_id}`}
          image={profile.photo_url || undefined}
        />
      )}

      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-10 shadow-xl">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] items-start">
          <div className="space-y-6 text-center">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-4xl font-bold text-slate-500">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name || profile.student_id || 'Étudiant'} className="h-full w-full object-cover" />
              ) : (
                <span>{profile?.student_id?.slice(0, 1) || 'E'}</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] opacity-60">Mini-CV étudiant</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">{heroTitle}</h1>
            </div>
            {profile?.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
              >
                Voir le portfolio
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] opacity-60">Bio</p>
                  <p className="mt-3 text-lg leading-8 text-slate-700">{heroSubtitle}</p>
                </div>
                {profile?.student_id && (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                    {profile.student_id}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-60">Email</p>
                  <p className="mt-2 font-medium text-sm text-slate-800">{profile?.email || 'Non renseigné'}</p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-60">Téléphone</p>
                  <p className="mt-2 font-medium text-sm text-slate-800">{profile?.phone || 'Non renseigné'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.25em] opacity-60">Réseaux sociaux</p>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700">{socialItems.length} actifs</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {socialItems.length > 0 ? (
                  socialItems.map(([network, url]) => {
                    const Icon = socialIcons[network.toLowerCase()] || ExternalLink;
                    return (
                      <a
                        key={network}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[var(--foreground)]/10"
                      >
                        <Icon className="h-4 w-4 text-slate-700" />
                        {network}
                      </a>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">Aucun lien social renseigné pour ce profil.</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-blue-50/60 p-6 text-slate-700 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] opacity-70">Lancez votre carrière</p>
              <h2 className="mt-3 text-2xl font-bold">Vous aussi, lancez votre carrière en Tech</h2>
              <p className="mt-4 text-sm leading-7 opacity-80">Découvrez les formations de C&B Services et trouvez le parcours qui transforme vos projets en métier.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/formations"
                  className="inline-flex items-center gap-2 rounded-3xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] hover:opacity-90"
                >
                  Voir les formations
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {platformWhatsApp && (
                  <a
                    href={`https://wa.me/${platformWhatsApp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--background)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
                  >
                    Contacter l'équipe via WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-8 right-8 z-50 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-2xl transition hover:bg-emerald-600"
        >
          <MessageCircle className="h-5 w-5" />
          Contacter
        </a>
      )}

      {loading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
          <p className="text-lg font-semibold">Erreur</p>
          <p className="mt-3">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
