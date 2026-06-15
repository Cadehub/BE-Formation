import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Formation } from '../types';
import { SEO } from '../components/SEO';
import { Loader2, Users, ShieldCheck, ArrowLeft, Share2, Check, Calendar, MessageCircle } from 'lucide-react';
import { isFormationActive } from '../lib/formationStatus';

export function FormationDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [remainingPlaces, setRemainingPlaces] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [formationUnavailable, setFormationUnavailable] = useState(false);
  const [hasGraduates, setHasGraduates] = useState(false);
  const [graduatesCount, setGraduatesCount] = useState(0);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      
      const { data: fData, error: fError } = await supabase
        .from('formations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
        
      if (fError) {
        setLoading(false);
        return;
      }

      if (fData) {
        setFormation(fData);
        const { count: studentsCount, error: studentCountError } = await supabase
          .from('inscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('formation_id', fData.id)
          .eq('status', 'participating');

        if (!studentCountError) {
          setGraduatesCount(studentsCount || 0);
          setHasGraduates(Boolean(studentsCount && studentsCount > 0));
        }

        if (!isFormationActive(fData)) {
          setFormationUnavailable(true);
          setLoading(false);
          return;
        }

        // Load remaining places
        const { count } = await supabase
          .from('inscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('formation_id', fData.id)
          .in('status', ['validated', 'participating']);
          
        setRemainingPlaces(fData.places_max - (count || 0));
      }
      setLoading(false);
    }
    
    loadData();
  }, [slug]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formation) return;
    
    setSubmitting(true);
    setErrorMsg('');
    
    try {
        // Normalize phone number
        let cleanPhone = phone.trim().replace(/[\s\-\+]/g, '');
        
        if (cleanPhone.startsWith('6') && cleanPhone.length === 9) {
            cleanPhone = '237' + cleanPhone;
        }
        
        if (cleanPhone.length < 9) {
            throw new Error("Le numéro de téléphone entré est incomplet.");
        }

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Call enroll server action
        const response = await fetch('/api/public/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formation_id: formation.id,
                full_name: fullName,
                email,
                phone: cleanPhone,
                user_id: userId,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription.');
        }

        // Redirect to WhatsApp
        window.location.href = data.whatsapp_url;
        
    } catch (err: any) {
        setErrorMsg(err.message || "Une erreur est survenue.");
        setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Impossible de copier le lien", err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[var(--accent)]" /></div>;
  }

  if (!formation) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-xl">
        <p>Formation introuvable.</p>
        <Link to="/formations" className="inline-flex items-center space-x-2 text-sm font-semibold bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-xl text-[var(--accent)]">
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    );
  }

  if (formationUnavailable) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold">Cette formation n’est plus active pour le moment.</p>
        <p className="opacity-70">Vérifiez le catalogue pour voir les sessions actuellement ouvertes.</p>
        {hasGraduates && (
          <Link
            to={`/formations/${slug}/etudiants`}
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] hover:opacity-90"
          >
            Voir les {graduatesCount} étudiant{graduatesCount > 1 ? 's' : ''} formé{graduatesCount > 1 ? 's' : ''}
          </Link>
        )}
        <Link to="/formations" className="inline-flex items-center space-x-2 text-sm font-semibold bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-xl text-[var(--accent)]">
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    );
  }

  const isSoldOut = remainingPlaces !== null && remainingPlaces <= 0;
  const formattedStartDate = formatDate(formation.start_date);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <SEO 
        title={`${formation.title} - Formation Complète`} 
        description={formation.description.substring(0, 160)}
        schema={{
          "@type": "Course",
          "name": formation.title,
          "description": formation.description,
          "provider": {
             "@type": "EducationalOrganization",
             "name": "Biteck Ethan Formation"
          }
        }}
      />

      {/* Barre d'actions supérieure */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          to="/formations" 
          className="inline-flex items-center space-x-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Retour au catalogue</span>
        </Link>

        <button 
          onClick={handleShare}
          className="inline-flex items-center space-x-2 text-xs font-semibold bg-[var(--card)] hover:bg-[var(--border)]/30 border border-[var(--border)] px-4 py-2.5 rounded-full transition-all"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Lien copié !</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>Partager cette formation</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 leading-tight">{formation.title}</h1>
              {hasGraduates && (
                <div className="mb-4 rounded-3xl border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-sm font-semibold text-[var(--accent)]">
                  Cette formation a déjà formé {graduatesCount} étudiant{graduatesCount > 1 ? 's' : ''}.{' '}
                  <Link to={`/formations/${slug}/etudiants`} className="underline">Voir la liste des diplômés</Link>
                </div>
              )}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="bg-[var(--card)] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-[var(--border)] shadow-sm">
                  {formation.category_id || 'N/C'}
                </span>
                  <span className="flex items-center text-sm opacity-80 bg-[var(--card)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-[var(--accent)]" /> Certifiant
                  </span>
                  {formattedStartDate && (
                      <span className="flex items-center text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full font-medium">
                          <Calendar size={14} className="mr-1.5" />
                          Débute le {formattedStartDate}
                      </span>
                  )}
              </div>
              
              {formation.image_url && (
                  <div className="w-full h-[450px] rounded-2xl overflow-hidden mb-12 border border-[var(--border)] bg-[var(--card)] shadow-inner">
                      <img src={formation.image_url} alt={formation.title} className="w-full h-full object-cover" />
                  </div>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h2 className="text-2xl font-bold tracking-tight mb-4 border-b border-[var(--border)]/60 pb-2">À propos de cette formation</h2>
                  <p className="opacity-80 leading-relaxed whitespace-pre-wrap font-light">{formation.description}</p>
              </div>
            </motion.div>
        </div>

        {/* Sidebar d'inscription */}
        <div className="lg:col-span-1">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="sticky top-28 p-8 bg-[var(--card)] rounded-2xl shadow-xl border border-[var(--border)] space-y-6"
            >
                <div>
                    <div className="text-xs uppercase font-bold tracking-wider opacity-50 mb-1">Frais de participation</div>
                    <div className="text-4xl font-black text-[var(--accent)]">{formation.price.toLocaleString()} FCFA</div>
                    {formation.registration_fee && (
                      <div className="text-sm opacity-70 mt-1">
                        + Frais d'inscription : <strong>{formation.registration_fee.toLocaleString()} FCFA</strong>
                      </div>
                    )}
                </div>
                
                {remainingPlaces !== null && (
                   <div className="flex items-center space-x-2 text-sm bg-[var(--background)] px-4 py-3 rounded-xl border border-[var(--border)]">
                      <Users className="w-4 h-4 text-[var(--accent)]" />
                      <span>
                        <strong className={isSoldOut ? 'text-red-500' : 'text-[var(--foreground)]'}>
                          {remainingPlaces}
                        </strong> places restantes sur {formation.places_max}
                      </span>
                   </div>
                )}

                {isSoldOut ? (
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-xl font-medium text-center border border-red-500/20">
                        Cette session est complète.
                    </div>
                ) : (
                    <form onSubmit={handleEnroll} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">Nom complet</label>
                            <input 
                                type="text" 
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                                placeholder="Ex: Biteck Ethan"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">Adresse Email</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                                placeholder="Ex: contact@biteck.cm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">Numéro WhatsApp</label>
                            <input 
                                type="tel" 
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                                placeholder="Ex: 6XXXXXXXX"
                            />
                        </div>
                        
                        {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full flex items-center justify-center space-x-3 bg-[var(--foreground)] text-[var(--background)] py-4 rounded-xl font-semibold mt-6 hover:opacity-95 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <MessageCircle className="w-5 h-5" />
                                    <span>S'inscrire via WhatsApp</span>
                                </>
                            )}
                        </button>
                        <p className="text-[11px] text-center opacity-60 mt-4 leading-normal">
                            En cliquant sur le bouton, vous serez redirigé vers WhatsApp pour confirmer votre inscription auprès de l'administration.
                        </p>
                    </form>
                )}
            </motion.div>
        </div>
      </div>
    </div>
  );
}

