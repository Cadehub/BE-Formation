import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { Formation } from '../types';

type GraduateRow = {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  profiles?: any;
  profile?: any;
};

export function FormationGraduates() {
  const { slug } = useParams<{ slug: string }>();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [graduates, setGraduates] = useState<GraduateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGraduates() {
      if (!slug) return;
      setLoading(true);
      setError('');

      const { data: formationData, error: formError } = await supabase
        .from('formations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (formError || !formationData) {
        setError('Formation introuvable.');
        setLoading(false);
        return;
      }

      setFormation(formationData);

      const { data, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select('id, full_name, phone, email, profiles(id, student_id, full_name, photo_url, allow_seo_indexing, is_attested), formation_id')
        .eq('formation_id', formationData.id)
        .eq('status', 'participating')
        .order('full_name', { ascending: true });

      if (inscriptionsError) {
        setError('Impossible de charger les étudiants formés.');
        setLoading(false);
        return;
      }

      const normalized = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          }))
        : [];

      setGraduates(normalized as GraduateRow[]);
      setLoading(false);
    }

    loadGraduates();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl font-semibold">{error}</p>
        <Link to="/formations" className="inline-flex items-center space-x-2 text-sm font-semibold bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-xl text-[var(--accent)]">
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <SEO
        title={`Étudiants formés - ${formation?.title || 'Formation'}`}
        description={`Liste des étudiants ayant terminé la formation ${formation?.title || ''}.`}
      />

      <div className="flex flex-col gap-4 mb-12">
        <Link to={`/formations/${slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline">
          <ArrowLeft size={16} /> Retour à la formation
        </Link>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] opacity-60">Étudiants formés</p>
          <h1 className="text-4xl font-bold tracking-tight">
            {formation?.title}
          </h1>
          <p className="text-sm opacity-70 mt-2">{graduates.length} étudiant{graduates.length > 1 ? 's' : ''} ont complété cette session.</p>
        </div>
      </div>

      {graduates.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-lg font-semibold">Aucun étudiant formé n'a encore été recensé pour cette session.</p>
          <p className="mt-3 opacity-70">Vérifiez plus tard pour voir les mises à jour des participants.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {graduates.map((graduate) => {
            const profile = graduate.profile || (Array.isArray(graduate.profiles) ? graduate.profiles[0] : graduate.profiles);
            const studentId = profile?.student_id;

            return (
              <div key={graduate.id} className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] opacity-60">Étudiant formé</p>
                    <h2 className="text-2xl font-bold mt-2">{profile?.full_name || graduate.full_name}</h2>
                    {studentId && (
                      <p className="text-sm mt-2 font-mono text-[var(--accent)]">ID étudiant : {studentId}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-right">
                    {studentId ? (
                      <Link
                        to={`/etudiants/${studentId}`}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      >
                        Voir fiche publique
                      </Link>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] opacity-60">Aucun identifiant public</span>
                    )}
                    {graduate.phone && (
                      <a href={`https://wa.me/${graduate.phone.replace(/\D/g, '')}`} className="block text-sm opacity-70 hover:text-[var(--foreground)]">
                        Contacter sur WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
