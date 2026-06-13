import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
      return null;
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">Installer l'Application</h3>
          <p className="text-sm opacity-70">Ajoutez le Cockpit Admin sur votre écran d'accueil pour un accès rapide et une expérience mobile optimisée.</p>
        </div>
      </div>
      
      {isInstallable ? (
          <button 
             onClick={handleInstallClick}
             className="whitespace-nowrap px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center space-x-2"
          >
             <Download className="w-4 h-4" />
             <span>Installer PWA</span>
          </button>
      ) : (
          <div className="text-xs opacity-60 bg-[var(--background)] px-4 py-3 rounded-lg border border-[var(--border)] max-w-xs">
              <p className="font-bold mb-1">Comment installer (iOS / Safari) :</p>
              <p>Appuyez sur le bouton "Partager" puis sélectionnez "Sur l'écran d'accueil".</p>
          </div>
      )}
    </motion.div>
  );
}
