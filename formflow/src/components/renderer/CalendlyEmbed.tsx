'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { CalendarCheck, Check, ExternalLink } from 'lucide-react';

interface CalendlyEmbedProps {
  calendlyUrl: string;
  prefillName?: string;
  prefillEmail?: string;
  onEventScheduled?: (eventData: CalendlyEventData) => void;
  borderRadius?: string;
  primaryColor?: string;
  questionColor?: string;
}

export interface CalendlyEventData {
  event_uri?: string;
  invitee_uri?: string;
  event_type_name?: string;
  event_start_time?: string;
  event_end_time?: string;
  scheduled?: boolean;
}

export default function CalendlyEmbed({
  calendlyUrl,
  prefillName,
  prefillEmail,
  onEventScheduled,
  borderRadius = '8px',
  primaryColor = '#6366f1',
  questionColor = '#f1f5f9',
}: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Build Calendly URL with prefill and embed parameters
  const buildCalendlyUrl = useCallback(() => {
    try {
      const url = new URL(calendlyUrl);

      // Add embed params
      url.searchParams.set('embed_type', 'Inline');
      url.searchParams.set('embed_domain', window.location.hostname);

      // Add prefill params
      if (prefillName) url.searchParams.set('name', prefillName);
      if (prefillEmail) url.searchParams.set('email', prefillEmail);

      // Style: make background transparent
      url.searchParams.set('background_color', '1a1a2e');
      url.searchParams.set('text_color', 'ffffff');
      url.searchParams.set('primary_color', primaryColor.replace('#', ''));

      return url.toString();
    } catch {
      return calendlyUrl;
    }
  }, [calendlyUrl, prefillName, prefillEmail, primaryColor]);

  // Listen for Calendly postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.event) return;

      // Calendly fires these events via postMessage
      if (event.data.event === 'calendly.event_scheduled') {
        setIsScheduled(true);

        const eventData: CalendlyEventData = {
          event_uri: event.data.payload?.event?.uri,
          invitee_uri: event.data.payload?.invitee?.uri,
          event_type_name: event.data.payload?.event_type?.name,
          event_start_time: event.data.payload?.event?.start_time,
          event_end_time: event.data.payload?.event?.end_time,
          scheduled: true,
        };

        onEventScheduled?.(eventData);
      }

      if (event.data.event === 'calendly.page_height') {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEventScheduled]);

  // Fallback loading timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!calendlyUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12 border-2 border-dashed"
        style={{ borderColor: `${questionColor}30`, borderRadius }}
      >
        <CalendarCheck size={48} style={{ color: `${questionColor}40` }} />
        <p className="mt-4 text-sm" style={{ color: `${questionColor}60` }}>
          URL do Calendly não configurada
        </p>
      </div>
    );
  }

  if (isScheduled) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ borderRadius }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Check size={32} style={{ color: primaryColor }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: questionColor }}>
          Agendamento confirmado!
        </h3>
        <p className="text-sm" style={{ color: `${questionColor}80` }}>
          Você receberá um email com os detalhes do agendamento.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full flex flex-col">
      {/* Loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius }}
        >
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: primaryColor }} />
          <p className="mt-3 text-sm" style={{ color: questionColor }}>
            Carregando agenda...
          </p>
        </div>
      )}

      {/* Calendly Iframe */}
      <div
        className="overflow-hidden flex-1"
        style={{
          minHeight: 600,
          borderRadius,
          backgroundColor: '#1a1a2e',
        }}
      >
        <iframe
          src={buildCalendlyUrl()}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Agendar horário"
          style={{ minWidth: '320px' }}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Fallback link */}
      <a
        href={calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-3 text-xs transition-opacity hover:opacity-100 flex-shrink-0"
        style={{ color: `${questionColor}50`, opacity: 0.7 }}
      >
        <ExternalLink size={12} />
        Abrir em nova aba
      </a>
    </div>
  );
}
