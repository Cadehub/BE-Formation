import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, Fingerprint } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasStudents, setHasStudents] = useState(false);
  const [hasBlog, setHasBlog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function fetchMenuState() {
      try {
        const response = await fetch('/api/public/menu');
        if (!response.ok) return;
        const payload = await response.json();
        setHasStudents(Boolean(payload.hasStudents));
        setHasBlog(Boolean(payload.hasBlog));
      } catch {
        // Keep defaults false to avoid flashing unavailable links
      }
    }

    fetchMenuState();
  }, []);

  // Close menu when route changes
  useEffect(() => {
     setIsOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const newCount = clickCount + 1;
    
    if (newCount >= 3) {
      setClickCount(0);
      navigate('/admin');
    } else {
      setClickCount(newCount);
      if (newCount === 1) {
        navigate('/');
      }
    }

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      setClickCount(0);
    }, 2000); // 2 second timeout for triple click
  };

  if (location.pathname.startsWith('/admin')) {
      return null;
  }

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] md:w-auto md:min-w-[700px] glass backdrop-blur-2xl border border-[var(--border)] rounded-full shadow-2xl transition-all duration-300">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            
            <a href="/" onClick={handleLogoClick} className="flex items-center space-x-3 group mr-8 cursor-pointer">
              <img src="/icon.svg" alt="Biteck Ethan Formation" className="w-10 h-10 rounded-full bg-[var(--background)] p-1 shadow-lg" />
              <div className="flex flex-col select-none justify-center">
                 <div className="flex items-baseline whitespace-nowrap">
                   <span className="text-xl font-bold tracking-tighter leading-none">BITECK&nbsp;</span>
                   <span className="text-xl font-bold tracking-tighter leading-none text-blue-600 dark:text-blue-500">ETHAN</span>
                 </div>
                 <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mt-0.5 leading-none pl-[1px]">Formations</span>
              </div>
            </a>

            <div className="hidden md:flex items-center space-x-8 bg-[var(--card)]/50 px-6 py-2 rounded-full">
              <Link to="/" className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Accueil</Link>
              <Link to="/formations" className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Nos Formations</Link>
              {hasBlog && (
                <Link to="/blog" className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Journal</Link>
              )}
              {hasStudents && (
                <Link to="/etudiants" className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Nos Étudiants</Link>
              )}
              <Link to="/student/login" className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Espace Étudiant</Link>
            </div>

            <div className="flex items-center space-x-4 ml-8">
              {mounted && (
                <button 
                  onClick={toggleTheme} 
                  className="p-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
              
              <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="p-2.5 rounded-full bg-[var(--foreground)] text-[var(--background)] md:hidden transition-transform active:scale-95"
              >
                {isOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-28 left-6 right-6 z-40 glass backdrop-blur-3xl border border-[var(--border)] rounded-2xl p-8 shadow-2xl md:hidden"
          >
            <div className="flex flex-col space-y-6">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Accueil</Link>
              <div className="w-full h-[1px] bg-[var(--border)]"></div>
              <Link to="/formations" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Nos Formations</Link>
              {hasBlog && (
                <>
                  <div className="w-full h-[1px] bg-[var(--border)]"></div>
                  <Link to="/blog" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Journal</Link>
                </>
              )}
              {hasStudents && (
                <>
                  <div className="w-full h-[1px] bg-[var(--border)]"></div>
                  <Link to="/etudiants" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Nos Étudiants</Link>
                </>
              )}
              <div className="w-full h-[1px] bg-[var(--border)]"></div>
              <Link to="/verify" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Vérifier un Certificat</Link>
              <div className="w-full h-[1px] bg-[var(--border)]"></div>
              <Link to="/student/login" onClick={() => setIsOpen(false)} className="text-3xl font-light tracking-tighter hover:text-[var(--accent)] transition-colors">Espace Étudiant</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
