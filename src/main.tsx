import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {/* @ts-ignore */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);

