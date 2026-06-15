import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

export function StudentsDirectory() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        setCategories(cats || []);

        // initial load: attested + allow_seo_indexing
        const { data } = await supabase.from('profiles').select('*').eq('is_attested', true).eq('allow_seo_indexing', true).order('student_id');
        setProfiles(data || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    })();
  }, []);

  const filterByCategory = async (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      if (!categoryId) {
        const { data } = await supabase.from('profiles').select('*').eq('is_attested', true).eq('allow_seo_indexing', true).order('student_id');
        setProfiles(data || []);
        return;
      }

      // get formations in category
      const { data: forms } = await supabase.from('formations').select('id').eq('category_id', categoryId);
      const formationIds = (forms || []).map((f: any) => f.id);
      if (formationIds.length === 0) {
        setProfiles([]);
        return;
      }

      const { data: ins } = await supabase.from('inscriptions').select('user_id').in('formation_id', formationIds).not('user_id', 'is', null);
      const userIds = Array.from(new Set((ins || []).map((i: any) => i.user_id))).filter(Boolean);

      if (userIds.length === 0) {
        setProfiles([]);
        return;
      }

      const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds).eq('is_attested', true).eq('allow_seo_indexing', true);
      setProfiles(profs || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SEO title="Annuaire des étudiants" description="Liste des étudiants attestés" />
      <h1 className="text-3xl font-bold mb-6">Annuaire des étudiants</h1>

      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm opacity-70">Filtrer par catégorie :</label>
        <select value={selectedCategory || ''} onChange={e => filterByCategory(e.target.value || null)} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]">
          <option value="">Toutes</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center opacity-70">Aucun étudiant trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <div key={profile.id} className="p-4 border border-[var(--border)] rounded-2xl bg-[var(--card)]">
              <h3 className="font-bold">{profile.student_id || profile.email || 'Étudiant'}</h3>
              <p className="text-sm opacity-70 mt-2">{profile.bio || 'Pas de bio'}</p>
              {profile.portfolio_url && <a href={profile.portfolio_url} className="text-sm text-[var(--accent)] mt-3 block">Portfolio</a>}
              <a className="text-sm mt-3 block opacity-70" href={`/etudiants/${profile.student_id}`}>Fiche publique</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentsDirectory;
