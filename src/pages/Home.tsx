import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'motion/react';
import { ArrowRight, Fingerprint, Layers, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { ReviewsCarousel } from '../components/ReviewsCarousel';

function Counter({ value, className }: { value: number, className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [value, isInView]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

export function Home() {
  const [stats, setStats] = useState({ totalStudents: 0, activeCohorts: 0 });
  const [hasTestimonials, setHasTestimonials] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      const [studentsRes, cohortsRes] = await Promise.all([
         supabase.from('inscriptions').select('*', { count: 'exact', head: true }).eq('status', 'participating'),
         supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      setStats({ 
          totalStudents: studentsRes.count || 0, 
          activeCohorts: cohortsRes.count || 0 
      });
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchTestimonialsCount() {
      const { count, error } = await supabase
        .from('formation_reviews')
        .select('id', { count: 'exact', head: true });

      if (!error && count && count > 0) {
        setHasTestimonials(true);
      }
    }

    fetchTestimonialsCount();
  }, []);

  return (
    <div className="relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
      <SEO 
        title="Formations d'Excellence à Douala" 
        description="Rejoignez C&B Services pour propulser votre carrière. Formations en informatique, marketing digital, et bureautique à Douala." 
      />
      
      {/* Background Abstract */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none flex justify-center">
         <div className="absolute top-[-10%] w-[80vw] h-[50vh] bg-[var(--accent)]/10 blur-[150px] rounded-[100%]"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vh] bg-[var(--accent)]/5 blur-[120px] rounded-[100%]"></div>
      </div>

      {/* Avant-Garde Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 lg:px-12 max-w-[1600px] mx-auto pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(20px)', y: 40 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 z-10 space-y-8"
          >
            <div className="inline-flex items-center space-x-3 border border-[var(--border)] rounded-full px-5 py-2 bg-[var(--card)] ">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]"></span>
              </span>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80">Nouvelle Ère d'Apprentissage</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-[7rem] font-bold tracking-[-0.04em] leading-[0.9] text-[var(--foreground)]">
              Maîtrisez <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] opacity-80">Vos Compétences.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl opacity-60 max-w-2xl font-light leading-relaxed">
              C&B Services redéfinit l'apprentissage professionnel à Douala. Une immersion totale, des programmes chirurgicaux, aucune théorie superflue.
            </p>
            
            <div className="pt-8">
              <Link to="/formations" className="group relative inline-flex items-center justify-center px-10 py-5 font-semibold text-[var(--background)] bg-[var(--foreground)] rounded-full overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="absolute inset-0 bg-[var(--accent)] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]"></div>
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Explorer le Catalogue</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>

          {/* Abstract Geometric Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 hidden lg:flex h-[600px] relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-[var(--border)] to-transparent rounded-3xl rotate-3 bg-[var(--card)] border border-[var(--border)] backdrop-blur-3xl overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]"></div>
                 <div className="w-48 h-48 rounded-full border border-[var(--foreground)]/20 absolute -top-10 -right-10"></div>
                 <div className="w-64 h-64 rounded-full border border-[var(--foreground)]/10 absolute -bottom-20 -left-20"></div>
                 <Layers strokeWidth={0.5} className="w-48 h-48 text-[var(--foreground)]/20 drop-shadow-2xl" />
             </div>
          </motion.div>
        </div>
      </section>

      {hasTestimonials && <ReviewsCarousel />}

      {/* Certification & Vision Statement */}
      <section className="py-32 px-6 lg:px-12 max-w-[1600px] mx-auto border-t border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
           <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight">
              L'excellence n'est pas un acte, <span className="opacity-40 italic font-serif">mais une habitude.</span>
           </h2>
           <div className="space-y-8 text-lg opacity-80 font-light leading-relaxed">
              <p>
                Sous l'égide de <strong className="font-medium text-[var(--foreground)]">C&B Services</strong>, nos certifications sont reconnues pour leur exigence et leur alignement direct avec les réalités du marché. 
              </p>
              <p>
                Nous ne formons pas des spectateurs, nous forgeons des professionnels prêts à repousser les limites de leur industrie à travers une pédagogie immersive et asymétrique.
              </p>
              <div className="flex items-center space-x-4 pt-4 border-t border-[var(--border)]/50">
                  <Fingerprint className="w-10 h-10 text-[var(--accent)] opacity-80" />
                  <span className="text-sm font-semibold tracking-wider uppercase opacity-60">Certifications Authentiques & Vérifiables</span>
              </div>
           </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 px-6 lg:px-12 max-w-[1600px] mx-auto min-h-[50vh] flex flex-col justify-center border-t border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
           <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               className="flex flex-col space-y-4 p-8 bg-[var(--card)] rounded-2xl border border-[var(--border)] relative overflow-hidden"
           >
               <div className="absolute -right-6 -top-6 text-[var(--accent)]/10">
                   <Users size={120} strokeWidth={1} />
               </div>
               <Users className="w-8 h-8 text-[var(--accent)] mb-4" />
               <h3 className="text-sm font-semibold tracking-widest uppercase opacity-60">Étudiants Formés</h3>
               <div className="text-6xl md:text-7xl font-bold tracking-tighter">
                   <Counter value={stats.totalStudents} />
                   <span className="text-[var(--accent)]">+</span>
               </div>
           </motion.div>

           <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
               className="flex flex-col space-y-4 p-8 bg-[var(--card)] rounded-2xl border border-[var(--border)] relative overflow-hidden"
           >
               <div className="absolute -right-6 -top-6 text-[var(--accent)]/10">
                   <Award size={120} strokeWidth={1} />
               </div>
               <Award className="w-8 h-8 text-[var(--accent)] mb-4" />
               <h3 className="text-sm font-semibold tracking-widest uppercase opacity-60">Programmes Actifs</h3>
               <div className="text-6xl md:text-7xl font-bold tracking-tighter">
                   <Counter value={stats.activeCohorts} />
               </div>
           </motion.div>
        </div>
      </section>
    </div>
  );
}
