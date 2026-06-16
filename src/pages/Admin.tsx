import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { PWAInstall } from '../components/PWAInstall';
import { Search, Loader2, DollarSign, Users, Database, LogOut, Send, Plus, FileText, Award, ExternalLink, Calendar, RefreshCw, Power, Trash2, ChevronDown, CircleCheck, XCircle } from 'lucide-react';
import { Enrollment, Inscription, Formation, Blog, Category } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { AdminCertificatesList } from '../components/AdminCertificatesList';
import { isFormationExpired } from '../lib/formationStatus';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'participating' | 'cancelled' | 'pending'>('all');
  
  const [inscriptions, setInscriptions] = useState<Enrollment[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const activeActionEnrollment = useMemo(
    () => inscriptions.find((ins) => ins.id === openActionMenuId) || null,
    [inscriptions, openActionMenuId]
  );

  const [validationLoading, setValidationLoading] = useState<string | null>(null);

  // Forms states
  const [newFormation, setNewFormation] = useState<Partial<Formation>>({ 
    title: '', 
    description: '', 
    image_url: '', 
    category_id: '', 
    places_max: 10, 
    price: 50000, 
    registration_fee: 10000,
    start_date: '', 
    end_date: '',
    is_active: true,
    whatsapp_url: ''
  });
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newBlog, setNewBlog] = useState<Partial<Blog>>({ title: '', excerpt: '', content: '', seo_keywords: '' });
  const [certInscriptionId, setCertInscriptionId] = useState('');
  const [certLink, setCertLink] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoLoading, setLogoLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [formationSyncLoading, setFormationSyncLoading] = useState(false);
  const [formationModalLoading, setFormationModalLoading] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingFormationId, setDeletingFormationId] = useState<string | null>(null);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [formationDraft, setFormationDraft] = useState<Partial<Formation> | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getAdminToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const loadStats = async () => {
    setLoading(true);

    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('inscriptions')
        .select('*, formations ( title ), profiles (*)')
        .order('created_at', { ascending: false });

      if (enrollmentError) {
        console.error('Erreur chargement inscriptions admin:', enrollmentError.message);
      } else if (Array.isArray(enrollmentData)) {
        setInscriptions(
          enrollmentData.map((item: any) => ({
            ...item,
            profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
            formation: Array.isArray(item.formations) ? item.formations[0] : item.formations,
          }))
        );
      }
    } catch (err: any) {
      console.error('Erreur chargement inscriptions admin:', err.message || err);
    }

    try {
      const [formRes, blogsRes, catRes, setRes] = await Promise.all([
        supabase.from('formations').select('*').order('start_date', { ascending: true }),
        supabase.from('blogs').select('*').order('published_at', { ascending: false }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('platform_settings').select('logo_url, whatsapp_number').eq('id', 1).maybeSingle(),
      ]);
      if (formRes.data) setFormations(formRes.data);
      if (blogsRes.data) setBlogs(blogsRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (setRes.data) {
        setLogoUrl(setRes.data.logo_url || '');
        setWhatsappNumber(setRes.data.whatsapp_number || '');
      }
    } catch (err: any) {
      console.error('Erreur chargement données admin:', err.message || err);
    }

    setLoading(false);
  };

  const refreshEnrollments = async () => {
    setEnrollmentsLoading(true);
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('inscriptions')
        .select('*, formations ( title ), profiles (*)')
        .order('created_at', { ascending: false });

      if (enrollmentError) {
        console.error('Erreur rechargement inscriptions:', enrollmentError.message);
      } else if (Array.isArray(enrollmentData)) {
        setInscriptions(
          enrollmentData.map((item: any) => ({
            ...item,
            profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
            formation: Array.isArray(item.formations) ? item.formations[0] : item.formations,
          }))
        );
      }
    } catch (err: any) {
      console.error('Erreur rechargement inscriptions:', err.message || err);
    }
    setEnrollmentsLoading(false);
  };

  const syncFormationStatuses = async (showAlert = false) => {
    setFormationSyncLoading(true);
    try {
      const now = new Date().toISOString();
      const { data: expiredFormations, error: fetchError } = await supabase
        .from('formations')
        .select('id')
        .lt('end_date', now)
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(fetchError.message || 'Impossible de charger les formations.');
      }

      if (!expiredFormations || expiredFormations.length === 0) {
        if (showAlert) {
          alert('Aucune formation expirée à désactiver.');
        }
        return;
      }

      const ids = expiredFormations.map((formation) => formation.id);
      const updateResult = await supabase
        .from('formations')
        .update({ is_active: false })
        .in('id', ids);
      const updatedFormations = updateResult.data as Array<Record<string, unknown>> | null;
      const updateError = updateResult.error;

      if (updateError) {
        throw new Error(updateError.message || 'Impossible de désactiver les formations expirées.');
      }

      if (showAlert) {
        alert(
          `${updatedFormations ? updatedFormations.length : ids.length} formation(s) expirée(s) ont été désactivées.`
        );
      }
    } catch (err: any) {
      if (showAlert) alert(`Erreur de synchronisation: ${err.message}`);
    } finally {
      setFormationSyncLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await syncFormationStatuses(false);
      await loadStats();
    })();
  }, []);

  const filteredInscriptions = useMemo(() => {
      let filtered = inscriptions;
      if (debouncedSearch) {
          filtered = filtered.filter(i => 
              i.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
              i.phone.includes(debouncedSearch)
          );
      }
      if (statusFilter !== 'all') {
          filtered = filtered.filter(i => i.status === statusFilter);
      }
      return filtered;
  }, [inscriptions, debouncedSearch, statusFilter]);

  const kpis = useMemo(() => {
      const totalRevenue = inscriptions
          .filter(i => i.status !== 'cancelled' && i.amount_paid)
          .reduce((sum, ins) => sum + (ins.amount_paid || 0), 0);
          
      const legacyRevenue = inscriptions
          .filter(i => i.status === 'validated' || i.status === 'participating')
          .reduce((sum, ins) => {
              const f = formations.find(f => f.id === ins.formation_id);
              return sum + (f?.price || 0);
          }, 0);

      return { 
          totalRevenue: totalRevenue > 0 ? totalRevenue : legacyRevenue, 
          activeStudents: inscriptions.length 
      };
  }, [inscriptions, formations]);

  const eligibleInscriptions = useMemo(() => {
    return inscriptions.filter((inscription) =>
      ['validated', 'participating'].includes(inscription.status)
    );
  }, [inscriptions]);

  const selectedInscription = useMemo(() => {
    return eligibleInscriptions.find((inscription) => inscription.id === certInscriptionId) || null;
  }, [eligibleInscriptions, certInscriptionId]);

  const selectedInscriptionFormation = useMemo(() => {
    if (!selectedInscription) return null;
    return formations.find((formation) => formation.id === selectedInscription.formation_id) || null;
  }, [selectedInscription, formations]);

  const updateFormationInState = (updatedFormation: Formation) => {
    setFormations((previous) =>
      previous.map((formation) => (formation.id === updatedFormation.id ? updatedFormation : formation))
    );
  };

  const openFormationEditor = (formation: Formation) => {
    setEditingFormation(formation);
    setFormationDraft({
      start_date: formation.start_date || '',
      end_date: formation.end_date || '',
      whatsapp_url: formation.whatsapp_url || '',
      is_active: formation.is_active !== false,
    });
  };

  const saveFormationUpdate = async (formationId: string, updates: Partial<Formation>, successMessage?: string) => {
    const sanitizedUpdates: Partial<Formation> = {};
    if (updates.start_date !== undefined) sanitizedUpdates.start_date = updates.start_date;
    if (updates.end_date !== undefined) sanitizedUpdates.end_date = updates.end_date;
    if (updates.whatsapp_url !== undefined) sanitizedUpdates.whatsapp_url = updates.whatsapp_url;
    if (typeof updates.is_active === 'boolean') sanitizedUpdates.is_active = updates.is_active;

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new Error('Aucune modification valide reçue');
    }

    const { data, error } = await supabase
      .from('formations')
      .update(sanitizedUpdates)
      .eq('id', formationId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Mise à jour impossible');
    }

    updateFormationInState(data);
    if (editingFormation?.id === data.id) {
      setEditingFormation(data);
    }
    if (successMessage) {
      alert(successMessage);
    }

    return data as Formation;
  };

  const deleteFormation = async (formationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) {
      return;
    }

    setDeletingFormationId(formationId);
    try {
      const { error } = await supabase.from('formations').delete().eq('id', formationId);
      if (error) {
        const message = error.message || 'Impossible de supprimer la formation.';
        alert(`Impossible de supprimer : ${message}`);
        return;
      }
      setFormations((prev) => prev.filter((formation) => formation.id !== formationId));
      if (editingFormation?.id === formationId) {
        setEditingFormation(null);
        setFormationDraft(null);
      }
      alert('Formation supprimée avec succès.');
    } catch (err: any) {
      alert(`Impossible de supprimer : ${err.message || 'Erreur serveur'}`);
    } finally {
      setDeletingFormationId(null);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) {
      return;
    }

    setDeletingCategoryId(categoryId);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) {
        const message = error.message || 'Impossible de supprimer la catégorie.';
        alert(`Impossible de supprimer : ${message}`);
        return;
      }
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      alert('Catégorie supprimée avec succès.');
    } catch (err: any) {
      alert(`Impossible de supprimer : ${err.message || 'Erreur serveur'}`);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleFormationToggle = async (formation: Formation) => {
    const nextActiveState = formation.is_active === false;
    try {
      await saveFormationUpdate(
        formation.id,
        { is_active: nextActiveState },
        nextActiveState ? 'Formation réactivée.' : 'Formation désactivée.'
      );
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleFormationModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormation || !formationDraft) return;

    setFormationModalLoading(true);
    try {
      const updatedFormation = await saveFormationUpdate(
        editingFormation.id,
        {
          start_date: formationDraft.start_date || '',
          end_date: formationDraft.end_date || '',
          whatsapp_url: formationDraft.whatsapp_url || '',
          is_active: formationDraft.is_active !== false,
        },
        'Formation mise à jour.'
      );
      setEditingFormation(null);
      setFormationDraft(null);
      updateFormationInState(updatedFormation);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setFormationModalLoading(false);
    }
  };

  const validatePayment = async (inscriptionId: string) => {
      if (!window.confirm('Confirmer la validation du paiement et marquer l inscription comme soldée ?')) return;
      setValidationLoading(inscriptionId);
      try {
          const { data: inscription, error: inscriptionError } = await supabase
            .from('inscriptions')
            .select('id, formation_id')
            .eq('id', inscriptionId)
            .single();

          if (inscriptionError || !inscription) {
            throw new Error(inscriptionError?.message || 'Inscription introuvable');
          }

          const { data: formation, error: formationError } = await supabase
            .from('formations')
            .select('price')
            .eq('id', inscription.formation_id)
            .single();

          if (formationError || !formation) {
            throw new Error(formationError?.message || 'Formation introuvable');
          }

          const { data: updatedInscription, error: updateError } = await supabase
            .from('inscriptions')
            .update({
              status: 'participating',
              payment_status: 'paid',
              amount_paid: formation.price,
            })
            .eq('id', inscriptionId)
            .select('*')
            .single();

          if (updateError || !updatedInscription) {
            throw new Error(updateError?.message || 'Impossible de valider le paiement');
          }

          setInscriptions((prev) => prev.map((ins) => (ins.id === inscriptionId ? updatedInscription : ins)));
          alert('Paiement validé.');
      } catch (err: any) {
          alert(`Erreur: ${err.message}`);
      } finally {
          setValidationLoading(null);
      }
  };

  const sendAdminRequest = async (path: string, method = 'POST') => {
    const token = await getAdminToken();
    if (!token) {
      throw new Error('Session admin introuvable.');
    }

    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || 'Erreur serveur');
    }

    return json;
  };

  const runEnrollmentAction = async (
    action: 'participation' | 'inscription_only' | 'cancel' | 'delete' | 'attest',
    id: string,
    userId?: string
  ) => {
    if (!id && action !== 'attest') {
      throw new Error('Identifiant introuvable');
    }

    if (action === 'delete' && !window.confirm('Supprimer définitivement cette inscription ?')) {
      return;
    }

    setActionLoadingId(id);
    try {
      if (action === 'participation') {
        await sendAdminRequest(`/api/admin/enrollments/${id}/validate-participation`, 'POST');
      } else if (action === 'inscription_only') {
        await sendAdminRequest(`/api/admin/enrollments/${id}/validate-inscription-only`, 'POST');
      } else if (action === 'cancel') {
        await sendAdminRequest(`/api/admin/enrollments/${id}/cancel`, 'POST');
      } else if (action === 'delete') {
        await sendAdminRequest(`/api/admin/enrollments/${id}`, 'DELETE');
      } else if (action === 'attest') {
        if (!userId) throw new Error('Profil étudiant introuvable');
        await sendAdminRequest(`/api/admin/profiles/${userId}/attest`, 'POST');
      }
      await refreshEnrollments();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
      setOpenActionMenuId(null);
    }
  };

  const addFormation = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormLoading(true);
      const slug = newFormation.title?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from('formations').insert([{
        ...newFormation,
        slug,
        places_max: newFormation.places_max || 10,
        is_active: newFormation.is_active !== false
      }]);
      if (error) alert("Erreur lors de l'ajout: " + error.message);
      else { 
        alert("Formation ajoutée !"); 
        setNewFormation({ 
          title: '', 
          description: '', 
          image_url: '', 
          category_id: '', 
          places_max: 10, 
          price: 50000, 
          registration_fee: 10000,
          start_date: '',
          end_date: '',
          is_active: true,
          whatsapp_url: ''
        }); 
        loadStats(); 
      }
      setFormLoading(false);
  };

  const addCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategory.name.trim()) return;
      setFormLoading(true);
      const slug = newCategory.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from('categories').insert([{ name: newCategory.name, slug }]);
      if (error) alert("Erreur: " + error.message);
      else { alert("Catégorie ajoutée !"); setNewCategory({ name: '' }); loadStats(); }
      setFormLoading(false);
  };

  const addBlog = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormLoading(true);
      const slug = newBlog.title?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from('blogs').insert([{ ...newBlog, slug, published_at: new Date().toISOString() }]);
      if (error) alert("Erreur lors de l'ajout: " + error.message);
      else { alert("Article publié !"); setNewBlog({ title: '', excerpt: '', content: '', seo_keywords: '' }); loadStats(); }
      setFormLoading(false);
  };

  const saveLogo = async (e: React.FormEvent) => {
      e.preventDefault();
      setLogoLoading(true);
      const { error } = await supabase.from('platform_settings').upsert({ id: 1, logo_url: logoUrl, whatsapp_number: whatsappNumber });
      if (error) alert("Erreur lors de l'enregistrement du logo: " + error.message);
      else alert("Logo enregistré avec succès");
      setLogoLoading(false);
  };

  const addCertificate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!certInscriptionId) {
          alert("Veuillez sélectionner une inscription éligible");
          return;
      }
      setFormLoading(true);
      try {
          const { data: inscription, error: inscriptionError } = await supabase
            .from('inscriptions')
            .select('id, full_name, formation_id')
            .eq('id', certInscriptionId)
            .single();

          if (inscriptionError || !inscription) {
            throw new Error(inscriptionError?.message || 'Inscription introuvable');
          }

          const formation = formations.find((f) => f.id === inscription.formation_id);
          if (!formation) {
            throw new Error('Formation associée introuvable');
          }

          const uniqueId = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
          const { error } = await supabase.from('certificates').insert([{
            inscription_id: inscription.id,
            unique_id: uniqueId,
            allow_public_indexing: true,
            is_published: false,
            student_name: inscription.full_name,
            formation_id: inscription.formation_id,
            formation_title: formation.title,
            file_url: '',
            is_sample: false,
          }]);

          if (error) {
            throw new Error(error.message);
          }

          alert("Certificat créé avec succès !");
          setCertInscriptionId('');
          loadStats();
      } catch (err: any) {
          alert(`Erreur: ${err.message}`);
      } finally {
          setFormLoading(false);
      }
  };

    const addCertificateLink = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!certInscriptionId) {
        alert('Veuillez sélectionner une inscription');
        return;
      }
      if (!certLink.trim()) {
        alert('Veuillez fournir un lien pour le certificat');
        return;
      }

      setFormLoading(true);
      try {
        const token = await getAdminToken();
        if (!token) throw new Error('Session admin introuvable');

        const res = await fetch(`/api/admin/enrollments/${certInscriptionId}/certificate-link`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificate_link: certLink.trim() }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erreur serveur');

        alert('Lien de certificat enregistré.');
        setCertInscriptionId('');
        setCertLink('');
        await loadStats();
      } catch (err: any) {
        alert(`Erreur: ${err.message}`);
      } finally {
        setFormLoading(false);
      }
    };

  if (loading && inscriptions.length === 0) {
      return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Cockpit Admin | Biteck Ethan" description="Centre de contrôle" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
         <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Cockpit Administrateur</h1>
            <p className="opacity-60 text-sm">Zone de contrôle principal & monitoring</p>
         </div>
         <div className="flex items-center space-x-4">
           <button onClick={() => navigate('/')} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--foreground)] bg-transparent border border-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] rounded-full transition-colors flex items-center space-x-2">
              <span>Retourner sur la plateforme</span><ExternalLink className="w-3 h-3" />
           </button>
           <div className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>Connecté</span>
           </div>
           <button onClick={handleLogout} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] border border-[var(--border)] rounded-full transition-colors flex items-center space-x-2">
              <span>Déconnexion</span><LogOut className="w-3 h-3" />
            </button>
         </div>
      </div>

      <Tabs defaultValue="vue-generale">
        <TabsList className="mb-8 w-full justify-start overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none pb-1 h-auto pt-1 px-1">
            <TabsTrigger value="vue-generale" className="flex items-center space-x-2 py-3"><DollarSign className="w-4 h-4"/><span>Vue & Bot</span></TabsTrigger>
            <TabsTrigger value="formations" className="flex items-center space-x-2 py-3"><Database className="w-4 h-4"/><span>Formations</span></TabsTrigger>
            <TabsTrigger value="eleves" className="flex items-center space-x-2 py-3"><Users className="w-4 h-4"/><span>Élèves & Paiements</span></TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center space-x-2 py-3"><FileText className="w-4 h-4"/><span>Blog & Certificats</span></TabsTrigger>
        </TabsList>

        {/* ONGLET 1: VUE GENERALE & BOT */}
         <TabsContent value="vue-generale">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-1 md:col-span-2 lg:col-span-2 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Global</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-70 mb-1">Chiffre d'Affaires</p>
                        <p className="text-4xl font-bold tracking-tighter">{kpis.totalRevenue.toLocaleString()} <span className="text-sm opacity-50 font-normal">FCFA</span></p>
                    </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="col-span-1 md:col-span-2 lg:col-span-2 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Impact</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-70 mb-1">Total Élèves Associés</p>
                        <p className="text-4xl font-bold tracking-tighter">{kpis.activeStudents}</p>
                    </div>
                </motion.div>

                {/* BOT META */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="col-span-1 md:col-span-4 lg:col-span-2 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm h-full">
                    <div className="mb-6">
                        <p className="text-sm uppercase tracking-[0.25em] opacity-60">Validation manuelle</p>
                        <h3 className="mt-3 text-xl font-bold">Aucun envoi automatique</h3>
                        <p className="mt-3 text-sm opacity-70">Les paiements en espèces et les inscriptions différées sont validés manuellement depuis l'onglet Élèves.</p>
                    </div>
                    <div className="grid gap-3">
                        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                            <p className="text-sm opacity-70">Inscriptions en attente</p>
                            <p className="text-3xl font-bold mt-3">{inscriptions.filter((ins) => ins.payment_status === 'pending').length}</p>
                        </div>
                        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
                            <p className="text-sm opacity-70">Paiements en espèces</p>
                            <p className="text-3xl font-bold mt-3">{inscriptions.filter((ins) => ins.payment_method === 'cash').length}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
                <PWAInstall />
                
                <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center">Configuration</h2>
                    <form onSubmit={saveLogo} className="space-y-4">
                        <p className="text-sm opacity-70 mb-2">Logo global de la plateforme (pour certificats)</p>
                        <input type="url" placeholder="URL du Logo" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm"/>
                        <div>
                          <p className="text-sm opacity-70 mb-2">Numéro WhatsApp (administration)</p>
                          <input type="tel" placeholder="Ex: +237699999999" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm"/>
                        </div>
                        <button type="submit" disabled={logoLoading} className="px-6 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center transition-transform hover:scale-[1.02]">
                            {logoLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Sauvegarder"}
                        </button>
                    </form>
                </div>
            </div>
        </TabsContent>

        {/* ONGLET 2: FORMATIONS */}
        <TabsContent value="formations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center"><Plus className="w-5 h-5 mr-2" /> Nouvelle Catégorie</h2>
                        <form onSubmit={addCategory} className="space-y-4">
                            <input type="text" placeholder="Nom de la catégorie" required value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                            <button type="submit" disabled={formLoading} className="w-full py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center">
                                {formLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Créer la catégorie"}
                            </button>
                        </form>
                    </div>

                    <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Catégories existantes</h2>
                            <span className="text-xs uppercase tracking-[0.2em] opacity-60">{categories.length} total</span>
                        </div>
                        <div className="space-y-3">
                            {categories.length === 0 ? (
                                <p className="text-sm opacity-60">Aucune catégorie disponible.</p>
                            ) : (
                                categories.map((category) => (
                                    <div key={category.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border)] p-3 bg-[var(--background)]">
                                        <div className="break-words text-sm font-medium">{category.name}</div>
                                        <button
                                            type="button"
                                            disabled={deletingCategoryId === category.id}
                                            onClick={() => deleteCategory(category.id)}
                                            className="inline-flex items-center justify-center rounded-xl border border-red-500 bg-red-500/10 px-3 py-2 text-red-700 text-xs font-semibold transition hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {deletingCategoryId === category.id ? 'Suppression...' : 'Supprimer'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center"><Plus className="w-5 h-5 mr-2" /> Nouvelle Formation</h2>
                        <form onSubmit={addFormation} className="space-y-4">
                            <input type="text" placeholder="Titre complet" required value={newFormation.title} onChange={e => setNewFormation({...newFormation, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                            <textarea placeholder="Description" required value={newFormation.description} onChange={e => setNewFormation({...newFormation, description: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm h-24"/>
                            <input type="text" placeholder="URL Image" required value={newFormation.image_url} onChange={e => setNewFormation({...newFormation, image_url: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                            <select required value={newFormation.category_id} onChange={e => setNewFormation({...newFormation, category_id: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm">
                                <option value="" disabled>Sélectionner une catégorie</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs opacity-70 mb-1 block">Places Max</label>
                                <input type="number" required value={newFormation.places_max} onChange={e => setNewFormation({...newFormation, places_max: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                            </div>
                            <div>
                                <label className="text-xs opacity-70 mb-1 block">Frais Inscription</label>
                                <input type="number" required value={newFormation.registration_fee} onChange={e => setNewFormation({...newFormation, registration_fee: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs opacity-70 mb-1 block">Date de début</label>
                                <input type="date" required value={newFormation.start_date || ''} onChange={e => setNewFormation({...newFormation, start_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm text-[var(--foreground)]"/>
                            </div>
                            <div>
                                <label className="text-xs opacity-70 mb-1 block">Date de fin</label>
                                <input type="date" required value={newFormation.end_date || ''} onChange={e => setNewFormation({...newFormation, end_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm text-[var(--foreground)]"/>
                            </div>
                        </div>

                        {/* --- NOUVEAU CHAMP : URL DU GROUPE WHATSAPP --- */}
                        <div>
                            <label className="text-xs font-bold uppercase opacity-70 mb-1 block text-green-600 dark:text-green-400">Lien du Groupe WhatsApp</label>
                            <input type="url" placeholder="Ex: https://chat.whatsapp.com/..." value={newFormation.whatsapp_url || ''} onChange={e => setNewFormation({...newFormation, whatsapp_url: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-green-500 outline-none text-sm"/>
                            <p className="text-[10px] opacity-60 mt-1">Sera envoyé automatiquement par le bot après le paiement.</p>
                        </div>
                        <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm">
                            <input
                                type="checkbox"
                                checked={newFormation.is_active !== false}
                                onChange={e => setNewFormation({ ...newFormation, is_active: e.target.checked })}
                            />
                            <span>Formation active dès sa création</span>
                        </label>

                        <div>
                            <label className="text-xs opacity-70 mb-1 block">Prix Total Formation</label>
                            <input type="number" required value={newFormation.price} onChange={e => setNewFormation({...newFormation, price: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-blue-600 outline-none text-sm"/>
                        </div>
                        <button type="submit" disabled={formLoading} className="w-full py-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium mt-4 flex items-center justify-center">
                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Ajouter au catalogue"}
                        </button>
                    </form>
                    </div>
                </div>
                
                <div className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Catalogue & statut</h2>
                            <p className="text-sm opacity-60">Les formations expirées sont désactivées automatiquement via leur `end_date`.</p>
                        </div>
                        <button
                            onClick={async () => {
                                await syncFormationStatuses(true);
                                await loadStats();
                            }}
                            disabled={formationSyncLoading}
                            className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--foreground)]/5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {formationSyncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            <span>Synchroniser les expirations</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formations.map((form) => {
                        const participantCount = inscriptions.filter((ins) => ins.formation_id === form.id && ins.status === 'participating').length;
                        return (
                          <div key={form.id} className="p-5 border border-[var(--border)] rounded-2xl bg-[var(--card)] flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-blue-600">{form.category_id ?? 'N/C'}</div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  form.is_active !== false
                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                    : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                }`}>
                                  {form.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg leading-tight mb-2">{form.title}</h3>
                              <p className="text-sm opacity-70 line-clamp-2 mb-4">{form.description}</p>
                              <div className="space-y-2 text-xs opacity-70">
                                <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Début: {form.start_date || 'Non défini'}</p>
                                <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Fin: {form.end_date || 'Non définie'}</p>
                                <p className="break-all">WhatsApp: {form.whatsapp_url || 'Aucun lien configuré'}</p>
                                {participantCount > 0 && (
                                  <p className="text-slate-700 font-medium">Étudiants formés: {participantCount}</p>
                                )}
                                {isFormationExpired(form) && (
                                  <p className="text-amber-600 font-medium">La date de fin est dépassée.</p>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-end border-t border-[var(--border)] pt-4 mt-auto">
                              <div>
                                <p className="text-[10px] uppercase opacity-50 tracking-wider">Inscription</p>
                                <p className="font-semibold text-sm">{form.registration_fee?.toLocaleString() || 0} FCFA</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase opacity-50 tracking-wider">Total</p>
                                <p className="font-bold text-lg text-blue-600">{form.price.toLocaleString()} FCFA</p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <button
                                onClick={() => handleFormationToggle(form)}
                                className="px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--foreground)]/5 text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <Power className="w-4 h-4" />
                                <span>{form.is_active !== false ? 'Terminer' : 'Réactiver'}</span>
                              </button>
                              <button
                                onClick={() => openFormationEditor(form)}
                                className="px-4 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium"
                              >
                                Modifier
                              </button>
                              {participantCount > 0 && (
                                <Link
                                  to={`/formations/${form.slug}/etudiants`}
                                  className="px-4 py-3 rounded-xl border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10"
                                >
                                  Voir étudiants formés
                                </Link>
                              )}
                              <button
                                type="button"
                                disabled={deletingFormationId === form.id}
                                onClick={() => deleteFormation(form.id)}
                                className="px-4 py-3 rounded-xl border border-red-500 bg-red-500/10 text-red-700 hover:bg-red-500/20 text-sm font-medium"
                              >
                                {deletingFormationId === form.id ? 'Suppression...' : 'Supprimer'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
            </div>
        </TabsContent>

        {/* ONGLET 3: ELEVES & PAIEMENTS */}
        <TabsContent value="eleves">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Suivi des Élèves & Paiements</h2>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <select 
                            value={statusFilter} 
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm font-medium"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="validated">Inscrit (Acompte)</option>
                            <option value="validated">Inscription seule</option>
                            <option value="participating">Inscription + participation</option>
                            <option value="participating">Soldé complet</option>
                            <option value="pending">En attente</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                        <div className="relative w-full sm:w-64">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par nom, tél..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:border-blue-600 text-sm"/>
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -mt-2 opacity-50" />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--background)] text-xs uppercase opacity-70 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Candidat</th>
                                <th className="px-6 py-4 font-semibold">ID Étudiant</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Formation</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                                <th className="px-6 py-4 font-semibold text-right">Solde Restant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredInscriptions.map(ins => {
                                const formation = formations.find(f => f.id === ins.formation_id);
                                const totalDue = formation?.price || 0;
                                const remaining = totalDue - (ins.amount_paid || 0);
                                
                                return (
                                <tr key={ins.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                                    <td className="px-6 py-4 font-medium">{ins.full_name}</td>
                                    <td className="px-6 py-4 font-mono opacity-80">{ins.profile?.student_id || ins.user_id || '—'}</td>
                                    <td className="px-6 py-4 font-mono opacity-80">{ins.phone}</td>
                                    <td className="px-6 py-4 font-medium text-sm">{ins.formation?.title || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                                          ins.status === 'participating' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                                          ins.status === 'validated' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' :
                                          ins.status === 'cancelled' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20' :
                                          ins.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' :
                                          'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20'
                                        }`}>
                                          {ins.status === 'participating' ? 'Inscription + participation' : ins.status === 'validated' ? 'Inscription seule' : ins.status === 'cancelled' ? 'Annulé' : ins.status === 'pending' ? 'En attente' : ins.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 relative">
                                        <button
                                            type="button"
                                            onClick={() => setOpenActionMenuId(openActionMenuId === ins.id ? null : ins.id)}
                                            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition"
                                        >
                                            Actions
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>

                                        {openActionMenuId === ins.id && (
                                            <div className="hidden sm:block absolute z-20 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-2">
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === ins.id}
                                                    onClick={() => runEnrollmentAction('participation', ins.id)}
                                                    className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                                >
                                                    <CircleCheck className="w-3.5 h-3.5 inline-block mr-2" />
                                                    Valider Inscription & Participation
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === ins.id}
                                                    onClick={() => runEnrollmentAction('inscription_only', ins.id)}
                                                    className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                                >
                                                    <CircleCheck className="w-3.5 h-3.5 inline-block mr-2" />
                                                    Valider Inscription seule
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === ins.id}
                                                    onClick={() => runEnrollmentAction('cancel', ins.id)}
                                                    className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5 inline-block mr-2" />
                                                    Annuler
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === ins.id}
                                                    onClick={() => window.open(`https://wa.me/${ins.phone.replace(/\D/g, '')}`, '_blank')}
                                                    className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                                >
                                                    Contacter sur WhatsApp
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === ins.id}
                                                    onClick={() => runEnrollmentAction('delete', ins.id)}
                                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                                                >
                                                    Supprimer
                                                </button>
                                                {ins.user_id ? (
                                                    <button
                                                        type="button"
                                                        disabled={actionLoadingId === ins.id}
                                                        onClick={() => runEnrollmentAction('attest', ins.id, ins.user_id)}
                                                        className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                                    >
                                                        Attester l'étudiant
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {remaining > 0 ? (
                                            <span className="font-bold text-red-500">{remaining.toLocaleString()} FCFA</span>
                                        ) : (
                                            <span className="font-medium opacity-50 block text-center sm:text-right">-</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {filteredInscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center opacity-50 font-medium">Aucun élève trouvé.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {activeActionEnrollment && (
                        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:hidden" onClick={() => setOpenActionMenuId(null)}>
                            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                                    <div>
                                        <p className="text-sm font-semibold">Actions pour {activeActionEnrollment.full_name}</p>
                                        <p className="text-xs opacity-70">{activeActionEnrollment.formation?.title || 'Aucune formation'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOpenActionMenuId(null)}
                                        className="rounded-full px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
                                    >
                                        Fermer
                                    </button>
                                </div>
                                <div className="space-y-1 px-4 py-4">
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === activeActionEnrollment.id}
                                        onClick={() => runEnrollmentAction('participation', activeActionEnrollment.id)}
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                    >
                                        <CircleCheck className="w-4 h-4 inline-block mr-2" />
                                        Valider Inscription & Participation
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === activeActionEnrollment.id}
                                        onClick={() => runEnrollmentAction('inscription_only', activeActionEnrollment.id)}
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                    >
                                        <CircleCheck className="w-4 h-4 inline-block mr-2" />
                                        Valider Inscription seule
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === activeActionEnrollment.id}
                                        onClick={() => runEnrollmentAction('cancel', activeActionEnrollment.id)}
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4 inline-block mr-2" />
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === activeActionEnrollment.id}
                                        onClick={() => window.open(`https://wa.me/${activeActionEnrollment.phone.replace(/\D/g, '')}`, '_blank')}
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                    >
                                        Contacter sur WhatsApp
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === activeActionEnrollment.id}
                                        onClick={() => runEnrollmentAction('delete', activeActionEnrollment.id)}
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                        Supprimer
                                    </button>
                                    {activeActionEnrollment.user_id ? (
                                        <button
                                            type="button"
                                            disabled={actionLoadingId === activeActionEnrollment.id}
                                            onClick={() => runEnrollmentAction('attest', activeActionEnrollment.id, activeActionEnrollment.user_id)}
                                            className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 disabled:opacity-50"
                                        >
                                            Attester l'étudiant
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TabsContent>

        {/* ONGLET 4: BLOG & CERTIFICATS */}
        <TabsContent value="blog">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Blog Form */}
                <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center"><FileText className="w-5 h-5 mr-2" /> Publier un Article</h2>
                    <form onSubmit={addBlog} className="space-y-4">
                        <input type="text" placeholder="Titre de l'article" required value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm"/>
                        <input type="text" placeholder="Catégorie / Mots-clés SEO" required value={newBlog.seo_keywords} onChange={e => setNewBlog({...newBlog, seo_keywords: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm"/>
                        <textarea placeholder="Extrait (courte description)" required value={newBlog.excerpt} onChange={e => setNewBlog({...newBlog, excerpt: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm h-20"/>
                        <textarea placeholder="Contenu HTML" required value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm h-40 font-mono"/>
                        <button type="submit" disabled={formLoading} className="w-full py-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium mt-4 flex items-center justify-center">
                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Publier l'article"}
                        </button>
                    </form>
                </div>

                {/* Certificates Form */}
                <div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-2xl h-fit">
                    <h2 className="text-xl font-bold mb-6 flex items-center"><Award className="w-5 h-5 mr-2" /> Générer un Certificat</h2>
                    <form onSubmit={addCertificate} className="space-y-4">
                        <p className="text-sm opacity-70 mb-4">Le certificat est généré à partir d'une inscription réelle, enregistré en brouillon, puis publiable depuis la liste ci-dessous.</p>
                        <div>
                            <label className="text-xs font-bold uppercase opacity-70 block mb-2">Inscription éligible</label>
                            <select required value={certInscriptionId} onChange={e => setCertInscriptionId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm">
                                <option value="" disabled>Sélectionner un élève</option>
                                {eligibleInscriptions.map(inscription => {
                                    const formation = formations.find(f => f.id === inscription.formation_id);
                                    return (
                                      <option key={inscription.id} value={inscription.id}>
                                        {inscription.full_name} · {formation?.title || 'Formation inconnue'}
                                      </option>
                                    );
                                })}
                            </select>
                        </div>
                        {selectedInscription && (
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm space-y-2">
                                <p><span className="font-semibold">Élève :</span> {selectedInscription.full_name}</p>
                                <p><span className="font-semibold">WhatsApp :</span> {selectedInscription.phone}</p>
                                <p><span className="font-semibold">Statut :</span> {selectedInscription.status}</p>
                                <p><span className="font-semibold">Formation :</span> {selectedInscriptionFormation?.title || 'Formation inconnue'}</p>
                                {selectedInscriptionFormation?.whatsapp_url && (
                                    <p className="break-all"><span className="font-semibold">Lien groupe :</span> {selectedInscriptionFormation.whatsapp_url}</p>
                                )}
                            </div>
                        )}
                        <button type="submit" disabled={formLoading} className="w-full py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium mt-4 flex items-center justify-center">
                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Créer le certificat brouillon"}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <h4 className="font-semibold mb-2">Ajouter un lien de certificat à une inscription</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <select value={certInscriptionId} onChange={e => setCertInscriptionId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm">
                          <option value="">Sélectionner une inscription</option>
                          {inscriptions.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.full_name} · {formations.find(f => f.id === ins.formation_id)?.title || 'Formation inconnue'}</option>
                          ))}
                        </select>
                        <input type="url" placeholder="https://.../certificat.pdf" value={certLink} onChange={e => setCertLink(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] outline-none text-sm" />
                        <div className="flex gap-2">
                          <button onClick={addCertificateLink} className="px-4 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium">Enregistrer le lien</button>
                          <button onClick={() => { setCertLink(''); setCertInscriptionId(''); }} className="px-4 py-3 rounded-xl border border-[var(--border)]">Annuler</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[var(--border)]">
                        <h3 className="font-bold text-sm uppercase tracking-wider opacity-70 mb-4">Gestion des Certificats</h3>
                        <AdminCertificatesList formations={formations} inscriptions={inscriptions} />
                    </div>
                </div>
             </div>
        </TabsContent>
        
      </Tabs>

      {editingFormation && formationDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Modifier la formation</h3>
            <p className="text-sm opacity-60 mb-6">{editingFormation.title}</p>

            <form onSubmit={handleFormationModalSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-70 mb-2">Date de début</label>
                  <input
                    type="date"
                    value={formationDraft.start_date || ''}
                    onChange={e => setFormationDraft({ ...formationDraft, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-70 mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={formationDraft.end_date || ''}
                    onChange={e => setFormationDraft({ ...formationDraft, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase opacity-70 mb-2">Lien WhatsApp</label>
                <input
                  type="url"
                  value={formationDraft.whatsapp_url || ''}
                  onChange={e => setFormationDraft({ ...formationDraft, whatsapp_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-sm"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm">
                <input
                  type="checkbox"
                  checked={formationDraft.is_active !== false}
                  onChange={e => setFormationDraft({ ...formationDraft, is_active: e.target.checked })}
                />
                <span>Formation active</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormation(null);
                    setFormationDraft(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--foreground)]/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formationModalLoading}
                  className="flex-1 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center"
                >
                  {formationModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
