import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Certificate } from '../types';
import { SEO } from '../components/SEO';
import { Search, CheckCircle, XCircle } from 'lucide-react';

export function VerifyCertificate() {
  const { certificate_id } = useParams<{ certificate_id?: string }>();
  const navigate = useNavigate();
  
  const [certId, setCertId] = useState(certificate_id || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(!!certificate_id);

  useEffect(() => {
    if (certificate_id) {
        verify(certificate_id);
    }
  }, [certificate_id]);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!certId.trim()) return;
      navigate(`/verify/${certId.trim()}`);
  };

  const verify = async (id: string) => {
      setLoading(true);
      setSearched(true);
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('is_published', true)
        .or(`id.eq.${id},unique_id.eq.${id}`)
        .maybeSingle();
      setCertificate(data);
      setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[70vh]">
      <SEO 
        title={certificate ? `Certificat - ${certificate.student_name}` : "Vérification de Certificat"}
        description="Vérifiez l'authenticité d'un certificat délivré par C&B Services." 
      />
      
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Portail de Vérification</h1>
        <p className="opacity-80">Saisissez l'ID du certificat pour vérifier son authenticité.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-16 relative">
          <input 
              type="text" 
              value={certId}
              onChange={e => setCertId(e.target.value)}
              placeholder="Ex: CERT-2026-XYZ..."
              className="w-full px-6 py-4 rounded-full bg-[var(--card)] border focus:border-[var(--accent)] focus:outline-none pr-16 bg-[var(--background)] shadow-sm"
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-[var(--foreground)] text-[var(--background)] px-4 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
             <Search className="w-5 h-5" />
          </button>
      </form>

      {loading && <div className="text-center opacity-60 animate-pulse">Recherche en cours dans la base de données...</div>}

      {!loading && searched && (
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-[var(--card)] rounded-2xl p-8 md:p-12 text-center border ${certificate ? 'border-green-500/30' : 'border-red-500/30'}`}
         >
             {certificate ? (
                 <div className="space-y-6">
                     <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                         <CheckCircle className="w-10 h-10 text-green-500" />
                     </div>
                     <h2 className="text-3xl font-bold tracking-tight text-[var(--accent)]">Certificat Authentique</h2>
                     
                     <div className="bg-[var(--background)] rounded-2xl p-6 md:p-8 max-w-2xl mx-auto border border-[var(--border)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 rounded-bl-[100px]"></div>
                        <p className="text-sm opacity-60 uppercase tracking-widest mb-2">Décerné à</p>
                        <p className="text-2xl font-bold mb-6">{certificate.student_name}</p>
                        <p className="text-sm opacity-60 uppercase tracking-widest mb-2">Pour la formation</p>
                        <p className="text-xl font-bold mb-6 text-[var(--accent)]">{certificate.formation_title || 'Formation Inconnue'}</p>
                        <p className="text-xs opacity-50 mb-2">Identifiant Unique</p>
                        <p className="font-mono text-sm bg-[var(--card)] px-3 py-1 inline-block rounded border border-[var(--border)]">{certificate.id}</p>
                        
                        <div className="mt-8 pt-6 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-sm text-left">
                           <div>
                              <p className="opacity-60 text-xs">Émis le</p>
                              <p className="font-medium">{new Date(certificate.created_at).toLocaleDateString('fr-FR')}</p>
                           </div>
                           <div>
                              <p className="opacity-60 text-xs">Auteur / Plateforme</p>
                              <p className="font-medium">C&B Services</p>
                           </div>
                        </div>
                     </div>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                         <XCircle className="w-10 h-10 text-red-500" />
                     </div>
                     <h2 className="text-2xl font-bold tracking-tight">Certificat Invalide</h2>
                     <p className="opacity-70">L'identifiant que vous avez saisi ne correspond à aucun document certifié par C&B Services.</p>
                 </div>
             )}
         </motion.div>
      )}
    </div>
  );
}
