import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Blog } from '../types';
import { SEO } from '../components/SEO';
import { ArrowLeft, Calendar } from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const { data } = await supabase.from('blogs').select('*').eq('slug', slug).single();
      if (data) setPost(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center animate-pulse">Chargement de l'article...</div>;
  if (!post) return <div className="min-h-[60vh] flex items-center justify-center">Article introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        keywords={post.seo_keywords}
      />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/blog" className="inline-flex items-center text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] mb-12 transition-all">
           <ArrowLeft className="w-4 h-4 mr-2" /> Retour au blog
        </Link>
        
        <div className="flex items-center text-sm opacity-60 mb-6 space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Publié le {new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-10 leading-tight">{post.title}</h1>
        
        {/* Render markdown or safe HTML (simulated as text for now, but usually use react-markdown) */}
        <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[var(--accent)] max-w-none whitespace-pre-wrap">
            {post.content}
        </div>
        
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center space-x-3">
               <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--foreground)] font-bold text-xl">B</div>
               <div>
                  <p className="font-medium text-sm">Biteck De Bong Ethan Cade</p>
                  <p className="text-xs opacity-60">Formateur & Auteur</p>
               </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
