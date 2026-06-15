import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

function generateStudentId(): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BEF-2026-${randomPart}`;
}

export function StudentSettings() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState('{}');
  const [allowSeo, setAllowSeo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      let p = data;
      if (!p) {
        // Create minimal profile
        const student_id = generateStudentId();
        const { data: created } = await supabase.from('profiles').insert([{ id: userId, student_id }]).select('*').maybeSingle();
        p = created;
      }

      setProfile(p);
      setBio(p?.bio || '');
      setPortfolioUrl(p?.portfolio_url || '');
      setSocialLinks(JSON.stringify(p?.social_links || {}, null, 2));
      setAllowSeo(Boolean(p?.allow_seo_indexing));
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      let parsed = {} as any;
      try { parsed = JSON.parse(socialLinks); } catch { parsed = {}; }

      const { data, error } = await supabase.from('profiles').update({ bio, portfolio_url: portfolioUrl, social_links: parsed, allow_seo_indexing: allowSeo }).eq('id', profile.id).select('*').maybeSingle();
      if (error) throw error;
      setProfile(data);
      alert('Profil enregistré');
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title="Mon Profil" description="Modifier votre profil étudiant" />
      <h1 className="text-2xl font-bold mb-4">Mon Profil</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Student ID</label>
          <div className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">{profile?.student_id || 'N/C'}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Portfolio URL</label>
          <input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Social Links (JSON)</label>
          <textarea value={socialLinks} onChange={e => setSocialLinks(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)]" rows={6} />
        </div>
        <div className="flex items-center space-x-3">
          <input id="allowSeo" type="checkbox" checked={allowSeo} onChange={e => setAllowSeo(e.target.checked)} />
          <label htmlFor="allowSeo" className="text-sm">Autoriser l'indexation publique (allow_seo_indexing)</label>
        </div>
        <div className="flex items-center space-x-3">
          <button type="submit" disabled={saving} className="px-4 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)]">Enregistrer</button>
          <a href={`/etudiants/${profile?.student_id}`} className="text-sm opacity-70">Voir ma fiche publique</a>
        </div>
      </form>
    </div>
  );
}

export default StudentSettings;
