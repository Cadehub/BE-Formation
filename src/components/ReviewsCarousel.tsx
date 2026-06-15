import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
  profiles?: {
    full_name?: string | null;
  };
};

export function ReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      // profiles.full_name is not present in the current schema; request basic review data
      const { data, error } = await supabase
        .from('formation_reviews')
        .select('id, rating, comment, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && Array.isArray(data)) {
        setReviews(data as ReviewItem[]);
      }
      setLoading(false);
    }

    loadReviews();
  }, []);

  useEffect(() => {
    if (!reviews.length) return;
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [reviews.length]);

  return (
    <section className="py-20 px-6 lg:px-12 max-w-[1600px] mx-auto border-t border-[var(--border)]">
      <div className="mb-10 flex flex-col gap-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] opacity-60">Témoignages</p>
        <h2 className="text-4xl font-bold tracking-tight">Ils ont transformé leur parcours avec C&B Services</h2>
        <p className="max-w-2xl mx-auto text-sm opacity-70">Retrouvez les derniers avis de nos étudiants et inspirez-vous de leurs réussites.</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2].map((placeholder) => (
            <div key={placeholder} className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 animate-pulse h-72" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-16 text-center opacity-70">
          Aucun avis disponible pour le moment.
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ x: `-${activeIndex * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="flex gap-6"
          >
            {reviews.map((review) => {
              const name = (review as any).profiles?.full_name || (review as any).user_name || 'Étudiant anonyme';
              const stars = Array.from({ length: 5 }, (_, index) => index + 1);

              return (
                <div key={review.id} className="min-w-full rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] opacity-60">Note</p>
                      <div className="mt-3 flex items-center gap-1">
                        {stars.map((value) => (
                          <Star
                            key={value}
                            className={value <= review.rating ? 'h-5 w-5 text-amber-400' : 'h-5 w-5 text-slate-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="rounded-3xl bg-[var(--foreground)]/5 px-4 py-2 text-sm font-semibold text-slate-700">{review.rating}/5</span>
                  </div>

                  <p className="min-h-[7rem] text-slate-700 leading-7">{review.comment || 'Aucun commentaire fourni.'}</p>

                  <div className="mt-8 border-t border-[var(--border)] pt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] opacity-60">Par</p>
                      <p className="mt-2 text-lg font-semibold">{name}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.25em] opacity-50">{review.created_at ? new Date(review.created_at).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          <div className="mt-6 flex justify-center gap-3">
            {reviews.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === activeIndex ? 'bg-[var(--accent)]' : 'bg-slate-300/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
