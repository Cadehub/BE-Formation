import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, ArrowRight, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Formation } from '../types';
import { SEO } from '../components/SEO';
import { isFormationActive } from '../lib/formationStatus';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function FormationsList() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('id, name').order('name', { ascending: true });
      if (data) {
          setCategories([{ id: 'all', name: 'Tous' }, ...data]);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchFormations() {
      setLoading(true);
      let query = supabase
        .from('formations')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });
      
      if (activeCategory !== "Tous") {
        query = query.eq('category_id', activeCategory);
      }

      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setFormations(data.filter(isFormationActive));
      }
      setLoading(false);
    }
    fetchFormations();
  }, [activeCategory, debouncedSearch]);

  // Fonction utilitaire pour formater joliment la date en français
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative overflow-hidden selection:bg-[var(--accent)] selection:text-white pt-24 pb-32">
      <SEO 
        title="Notre Catalogue de Formations | Biteck Ethan" 
        description="Découvrez nos formations d'excellence pour booster votre carrière." 
      />
      
      <section className="px-6 lg:px-12 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter">Catalogue<span className="text-[var(--accent)]">.</span></h1>
            
            <div className="flex flex-col items-end gap-6 w-full md:w-auto">
               {/* Search Input */}
               <div className="relative w-full sm:w-96">
                   <input 
                       type="text" 
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       placeholder="Rechercher une formation..."
                       className="w-full pl-12 pr-4 py-3 rounded-full bg-transparent border border-[var(--border)] hover:border-[var(--foreground)]/30 focus:outline-none focus:border-[var(--accent)] transition-all duration-300 text-sm bg-[var(--card)] "
                   />
                   <Search className="w-5 h-5 absolute left-4 top-1/2 -mt-2.5 opacity-50" />
               </div>

               {/* Filters */}
               <div className="flex flex-wrap gap-2 justify-end w-full">
                  {categories.map(category => (
                      <button
                         key={category.id}
                         onClick={() => setActiveCategory(category.id === 'all' ? "Tous" : category.id)}
                         className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300  ${
                             (activeCategory === category.id || (activeCategory === "Tous" && category.id === 'all'))
                             ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xl' 
                             : 'bg-transparent border border-[var(--border)] hover:border-[var(--foreground)]/30 text-[var(--foreground)]/70'
                         }`}
                      >
                          {category.name}
                      </button>
                  ))}
               </div>
            </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 mt-10">
              {[1,2,3].map(i => (
                <div key={i} className={`h-[450px] lg:h-[600px] border border-[var(--border)] rounded-2xl bg-[var(--card)] p-8 lg:p-12 flex flex-col justify-between ${i === 2 ? 'md:col-span-8' : 'md:col-span-4'}`}>
                  <div className="flex justify-between items-start w-full">
                    <div className="w-24 h-8 bg-[var(--foreground)]/5 rounded-full animate-pulse"></div>
                    <div className="w-32 h-10 bg-[var(--foreground)]/5 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-4 w-full mt-auto">
                    <div className="w-3/4 h-10 lg:h-14 bg-[var(--foreground)]/5 rounded-xl animate-pulse"></div>
                    <div className="w-1/2 h-4 bg-[var(--foreground)]/5 rounded-md animate-pulse mt-4"></div>
                  </div>
                </div>
              ))}
           </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 auto-rows-[480px] lg:auto-rows-[620px] mt-10">
            <AnimatePresence mode="popLayout">
                {formations.map((formation, index) => {
                  const isWide = formations.length > 2 && (index % 4 === 1 || index % 4 === 2);
                  const formattedStartDate = formatDate(formation.start_date);
                  
                  return (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.95,
                            transition: { duration: 0.3, ease: 'easeIn' }
                        }}
                        key={formation.id}
                        className={`group relative rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors duration-500 flex flex-col justify-between
                        ${isWide ? 'md:col-span-8' : 'md:col-span-4'}
                        `}
                    >
                        {formation.image_url ? (
                            <>
                                <img src={formation.image_url} alt={formation.title} className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-[0.16,1,0.3,1]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--card)] to-[var(--background)]"></div>
                        )}
                        
                        {/* Contenu de la carte */}
                        <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-between z-10">
                            {/* Header : Catégorie & Date de début */}
                            <div className="flex flex-wrap justify-between items-center gap-2">
                                <span className="bg-[var(--background)]/90 text-[var(--foreground)] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-[var(--border)] shadow-sm">
                                    {formation.category}
                                </span>
                                {formattedStartDate && (
                                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-md">
                                        <Calendar size={13} />
                                        <span>Dès le {formattedStartDate}</span>
                                    </span>
                                )}
                            </div>
                            
                            {/* Bottom Core Context */}
                            <div className="space-y-4 mt-auto">
                                <h3 className="text-2xl lg:text-4xl font-bold tracking-tight leading-tight group-hover:text-[var(--accent)] transition-colors duration-300">
                                    {formation.title}
                                </h3>
                                <p className="opacity-70 md:opacity-0 md:group-hover:opacity-70 transition-opacity duration-300 line-clamp-2 max-w-xl font-light text-sm">
                                    {formation.description}
                                </p>

                                {/* Blocs de Prix : Inscription & Participation */}
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]/40">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--foreground)]/50 flex items-center gap-1">
                                            <CreditCard size={10} /> Inscription
                                        </span>
                                        <span className="text-base lg:text-lg font-bold text-[var(--foreground)]">
                                            {formation.registration_fee?.toLocaleString() || 0} FCFA
                                        </span>
                                    </div>
                                    <div className="flex flex-col border-l border-[var(--border)]/40 pl-4">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--foreground)]/50 flex items-center gap-1">
                                            <DollarSign size={10} /> Participation
                                        </span>
                                        <span className="text-lg lg:text-xl font-black text-[var(--accent)]">
                                            {formation.price.toLocaleString()} FCFA
                                        </span>
                                    </div>
                                </div>
                                
                                {/* CTA Intuitif et réactif (Visible par défaut sur mobile, animé sur desktop) */}
                                <div className="pt-2 overflow-hidden">
                                    <Link 
                                        to={`/formations/${formation.slug}`}
                                        className="w-full md:w-auto inline-flex items-center justify-center space-x-3 text-xs font-bold tracking-wider uppercase bg-[var(--foreground)] text-[var(--background)] md:bg-transparent md:text-[var(--foreground)] px-5 py-3 md:px-0 md:py-0 rounded-xl md:rounded-none md:opacity-0 md:translate-y-8 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500 ease-[0.16,1,0.3,1] group/btn"
                                    >
                                        <span>Rejoindre la formation</span>
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
            
            {formations.length === 0 && (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-center opacity-40 bg-[var(--card)] rounded-2xl border border-[var(--border)] py-12">
                    <BookOpen className="w-16 h-16 mb-6 stroke-1" />
                    <p className="text-2xl font-light tracking-tight">Aucune formation correspondante.</p>
                </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}
