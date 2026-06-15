import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { motion } from 'motion/react';
import { Phone, Search, Loader2, ArrowRight } from 'lucide-react';
import { Inscription, Formation } from '../types';

export function Payer() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inscriptions, setInscriptions] = useState<(Inscription & { formations: Partial<Formation> })[]>([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // In a real scenario, this would query a backend API to safely fetch user records.
      // E.g. fetch(`/api/public/inscriptions?phone=${phone}`)
      const response = await fetch(`/api/public/inscriptions?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la recherche");
      }
      
      setInscriptions(data.inscriptions || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <SEO title="Récupération de Paiement | Biteck Ethan" description="Finalisez le paiement de votre scolarité." />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Finaliser mon paiement</h1>
          <p className="opacity-70 text-lg">Retrouvez votre dossier grâce à votre numéro de téléphone.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full mb-12">
           <div className="relative flex items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all overflow-hidden lg:p-3">
              <Phone className="absolute left-6 w-5 h-5 opacity-50" />
              <input 
                 type="tel"
                 value={phone}
                 onChange={e => setPhone(e.target.value)}
                 placeholder="Ex: +237612345678"
                 className="flex-grow bg-transparent border-none pl-14 pr-4 py-3 outline-none text-lg font-medium"
                 required
              />
              <button 
                type="submit" 
                disabled={loading || !phone.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="hidden sm:inline">Chercher</span>
              </button>
           </div>
           {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </form>

        {searched && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Dossiers trouvés</h2>
              
              {inscriptions.length === 0 ? (
                  <div className="text-center p-8 border border-[var(--border)] rounded-2xl bg-[var(--card)] opacity-70">
                      Aucun dossier en attente de paiement trouvé pour ce numéro.
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {inscriptions.map((ins) => {
                          const courseTitle = ins.formations?.title || "Formation Inconnue";
                          const totalPrice = ins.formations?.price || 0;
                          const amountPaid = ins.amount_paid || 0;
                          const remaining = totalPrice - amountPaid;
                          
                          return (
                              <div key={ins.id} className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                 <div>
                                     <div className="flex items-center space-x-2 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                                          ins.status === 'validated' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                                        }`}>
                                          {ins.status === 'validated' ? 'Inscrit' : 'En attente'}
                                        </span>
                                        <span className="text-xs opacity-50 font-mono">{ins.id.split('-')[0]}</span>
                                     </div>
                                     <h3 className="font-bold text-lg">{courseTitle}</h3>
                                     <p className="text-sm opacity-70 mt-1">{ins.full_name}</p>
                                     <div className="flex items-center space-x-6 mt-4">
                                        <div>
                                            <p className="text-[10px] uppercase opacity-50 tracking-wider">Payé</p>
                                            <p className="font-semibold">{amountPaid.toLocaleString()} FCFA</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase opacity-50 tracking-wider">Reste à Payer</p>
                                            <p className="font-bold text-red-500">{remaining.toLocaleString()} FCFA</p>
                                        </div>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={() => navigate(`/pay/${ins.id}`)}
                                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-medium flex items-center justify-center space-x-2 shrink-0 group hover:opacity-90 transition-opacity"
                                 >
                                    <span>Payer le solde</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                 </button>
                              </div>
                          );
                      })}
                  </div>
              )}
           </motion.div>
        )}
      </motion.div>
    </div>
  );
}
