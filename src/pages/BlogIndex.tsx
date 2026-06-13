import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Blog } from '../types';
import { SEO } from '../components/SEO';
import { Calendar, ArrowRight } from 'lucide-react';

export function BlogIndex() {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .order('published_at', { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <SEO 
        title="Le Blog - Expertise & Tendances" 
        description="Lisez nos derniers articles sur le marketing digital, la comptabilité et l'informatique." 
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Le Blog <span className="text-[var(--accent)]">Biteck Ethan</span></h1>
        <p className="opacity-80 max-w-2xl mx-auto text-lg">Décryptez les tendances et apprenez des meilleurs experts.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl animate-pulse bg-[var(--card)] glass"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group glass rounded-3xl p-8 hover:border-[var(--accent)] transition-colors duration-300 flex flex-col"
            >
              <div className="flex items-center text-xs opacity-60 mb-4 space-x-2">
                 <Calendar className="w-3 h-3" />
                 <span>{new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight group-hover:text-[var(--accent)] transition-colors">{post.title}</h2>
              <p className="opacity-70 mb-6 flex-grow leading-relaxed">{post.excerpt}</p>
              
              <Link 
                to={`/blog/${post.slug}`}
                className="inline-flex items-center text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity mt-auto"
              >
                 <span className="mr-2">Lire l'article</span>
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.article>
          ))}
          {posts.length === 0 && (
             <div className="col-span-full py-20 text-center opacity-60">
                 Aucun article publié pour le moment.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
