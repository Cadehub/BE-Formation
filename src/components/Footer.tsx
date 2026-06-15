import { Phone, Mail, Globe, Facebook, Github, Linkedin } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformSettings {
  whatsapp_number?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  address?: string;
  social_facebook?: string;
  social_github?: string;
  social_linkedin?: string;
}

export function Footer() {
  const location = useLocation();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
        if (!error && data) setSettings(data as PlatformSettings);
      } catch (err) {
        console.error('Failed to fetch platform settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Fallback values if loading or not set
  const phone = settings?.phone_number || '+237 6 54 01 60 97';
  const email = settings?.email || 'biteckdebongethancade@gmail.com';
  const website = settings?.website || 'https://biteckethan.com';
  const address = settings?.address || 'Douala, Cameroun';
  const socialFacebook = settings?.social_facebook;
  const socialGithub = settings?.social_github;
  const socialLinkedin = settings?.social_linkedin;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tighter mb-4">C&B<span className="text-[var(--accent)]">.</span> Services</h3>
            <p className="text-sm opacity-80 mb-6 max-w-sm">
              L'excellence de la formation professionnelle à Douala. Partenaire de vos succès.
            </p>
          </div>
          
          <div>
             <h4 className="font-semibold mb-4 text-lg">Contact</h4>
             <div className="space-y-3">
                {phone && (
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                    <Phone size={16} /> <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                    <Mail size={16} /> <span>{email}</span>
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                    <Globe size={16} /> <span>Visiter le site</span>
                  </a>
                )}
             </div>
             {(socialFacebook || socialGithub || socialLinkedin) && (
               <div className="mt-4 pt-4 border-t border-[var(--border)] flex gap-3">
                 {socialFacebook && (
                   <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card)] hover:bg-blue-500/20 transition-colors">
                     <Facebook size={18} />
                   </a>
                 )}
                 {socialGithub && (
                   <a href={socialGithub} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card)] hover:bg-slate-500/20 transition-colors">
                     <Github size={18} />
                   </a>
                 )}
                 {socialLinkedin && (
                   <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card)] hover:bg-blue-500/20 transition-colors">
                     <Linkedin size={18} />
                   </a>
                 )}
               </div>
             )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-lg">Adresse</h4>
            <p className="text-sm opacity-80">
              {address}<br/>
              <span className="text-xs opacity-70 mt-2 block">C&B Services</span>
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center text-xs opacity-60">
          <p>&copy; {new Date().getFullYear()} C&B Services. Tous droits réservés.</p>
          <p className="mt-2 md:mt-0">Plateforme AIO optimisée.</p>
        </div>
      </div>
    </footer>
  );
}
