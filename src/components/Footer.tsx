import { Phone, Mail, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function Footer() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
      return null;
  }

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
                <a href="tel:+237654016097" className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                  <Phone size={16} /> <span>+237 6 54 01 60 97</span>
                </a>
                <a href="mailto:biteckdebongethancade@gmail.com" className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                  <Mail size={16} /> <span>biteckdebongethancade@gmail.com</span>
                </a>
                <a href="https://biteckethan.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm hover:text-[var(--accent)] transition-colors">
                  <Globe size={16} /> <span>biteckethan.com</span>
                </a>
             </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-lg">Adresse</h4>
            <p className="text-sm opacity-80">
              Douala, Cameroun<br/>
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
