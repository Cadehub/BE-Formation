'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function FloatingWhatsApp() {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWhatsAppNumber() {
      try {
        const { data, error } = await supabase.from('platform_settings').select('whatsapp_number').eq('id', 1).single();
        if (!error && data) setWhatsappNumber(data.whatsapp_number || null);
      } catch (err) {
        console.error('Failed to fetch WhatsApp number:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWhatsAppNumber();
  }, []);

  if (isLoading || !whatsappNumber) {
    return null;
  }

  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 hover:bg-green-600"
      aria-label="Contact via WhatsApp"
      title="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
