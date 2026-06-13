import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { motion } from 'motion/react';
import { Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Inscription, Formation } from '../types';

export function PayInscription() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ inscription: Inscription, formation: Formation } | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const response = await fetch(`/api/public/inscriptions/${id}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Dossier introuvable.");
        }
        
        setData({
            inscription: result.inscription,
            formation: result.inscription.formations
        });
      } catch (err: any) {
        setError(err.message || "Erreur réseau.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  const handlePayment = () => {
      // In a real application, you would initialize the Chariow SDK or redirect to the Chariow checkout URL.
      alert("Redirection vers la passerelle de paiement Chariow...");
      // e.g. window.location.href = "https://pay.chariow.com/checkout?amount=" + remaining + "&ref=" + id;
  };

  if (loading) {
      return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error || !data) {
      return (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
               <div className="text-center">
                   <h1 className="text-2xl font-bold mb-4">Dossier Introuvable</h1>
                   <p className="opacity-70">{error}</p>
                   <a href="/payer" className="mt-6 inline-block text-blue-600 hover:underline">← Retourner à la recherche</a>
               </div>
          </div>
      );
  }

  const { inscription, formation } = data;
  const amountPaid = inscription.amount_paid || 0;
  const remaining = formation.price - amountPaid;
  const isFullyPaid = inscription.status === 'fully_paid' || remaining <= 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <SEO title="Facture & Paiement | Biteck Ethan" description="Réglez votre solde." />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
          <div className="p-8 md:p-10 rounded-[2rem] bg-[var(--card)] border border-[var(--border)] shadow-xl relative overflow-hidden">
             
             {isFullyPaid ? (
                 <div className="text-center py-6">
                     <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 mx-auto flex items-center justify-center mb-6">
                         <CheckCircle2 className="w-10 h-10" />
                     </div>
                     <h1 className="text-3xl font-bold tracking-tight mb-2">Paiement Terminé</h1>
                     <p className="opacity-70">Ce dossier a été intégralement soldé. Vous pouvez fermer cette page.</p>
                 </div>
             ) : (
                 <>
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Votre Facture</h1>
                    
                    <div className="space-y-6 mb-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Candidat</p>
                            <p className="font-medium text-lg">{inscription.full_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Formation</p>
                            <p className="font-medium">{formation.title}</p>
                        </div>
                        
                        <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] mt-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-70">Total de la formation</span>
                                <span className="font-medium">{formation.price.toLocaleString()} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-70">Déjà réglé</span>
                                <span className="font-medium">{amountPaid.toLocaleString()} FCFA</span>
                            </div>
                            <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
                                <span className="font-bold">Solde Restant</span>
                                <span className="font-bold text-xl text-blue-600">{remaining.toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePayment}
                        className="w-full py-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center space-x-2 group hover:opacity-90 transition-opacity"
                    >
                        <span>Payer par Mobile Money / Carte</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] uppercase font-bold tracking-widest opacity-40">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Paiement sécurisé par Chariow</span>
                    </div>
                 </>
             )}
          </div>
      </motion.div>
    </div>
  );
}
