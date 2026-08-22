/**
 * Los tres dibujos de la página de servicios.
 *
 * Son SVG hechos a mano, no fotos ni imágenes generadas: pesan nada, se ven
 * nítidos en cualquier pantalla y toman el color de su familia desde
 * `var(--svc)`, así que cambiar el color de un servicio los cambia solos.
 *
 * Cada uno tiene un trabajo: explicar el servicio sin que haya que leer. Un
 * párrafo menos por cada dibujo que se entienda.
 */

const trazo = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Websites: la misma página, vista en computadora y en teléfono. */
export function ArteWebsites({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} fill="none" aria-hidden>
      {/* Monitor */}
      <rect
        x="8" y="14" width="164" height="106" rx="10"
        fill="rgba(255,255,255,0.03)" stroke="var(--svc-luz)" strokeWidth="2" opacity="0.9"
      />
      {/* Barra del navegador */}
      <path d="M8 34h164" stroke="var(--svc-luz)" strokeWidth="2" opacity="0.55" />
      <circle cx="22" cy="24" r="3" fill="var(--svc-luz)" opacity="0.8" />
      <circle cx="33" cy="24" r="3" fill="var(--svc-luz)" opacity="0.5" />
      <circle cx="44" cy="24" r="3" fill="var(--svc-luz)" opacity="0.3" />
      {/* Contenido: un titular, texto y una galería */}
      <rect x="24" y="48" width="72" height="9" rx="4.5" fill="var(--svc)" />
      <rect x="24" y="64" width="118" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.35" />
      <rect x="24" y="75" width="96" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.35" />
      <rect x="24" y="92" width="34" height="22" rx="5" fill="var(--svc)" opacity="0.55" />
      <rect x="64" y="92" width="34" height="22" rx="5" fill="var(--svc)" opacity="0.35" />
      <rect x="104" y="92" width="34" height="22" rx="5" fill="var(--svc)" opacity="0.2" />
      {/* Base del monitor */}
      <path d="M74 120v10h32v-10M62 132h56" stroke="var(--svc-luz)" strokeWidth="2" opacity="0.55" {...trazo} />
      {/* Teléfono con lo mismo, para que se lea "se ve bien en todos lados" */}
      <rect
        x="182" y="42" width="50" height="92" rx="10"
        fill="rgba(255,255,255,0.03)" stroke="var(--svc-luz)" strokeWidth="2"
      />
      <rect x="198" y="49" width="18" height="3" rx="1.5" fill="var(--svc-luz)" opacity="0.6" />
      <rect x="190" y="62" width="30" height="7" rx="3.5" fill="var(--svc)" />
      <rect x="190" y="76" width="34" height="4" rx="2" fill="var(--svc-luz)" opacity="0.35" />
      <rect x="190" y="86" width="24" height="4" rx="2" fill="var(--svc-luz)" opacity="0.35" />
      <rect x="190" y="98" width="34" height="16" rx="4" fill="var(--svc)" opacity="0.45" />
      <rect x="190" y="120" width="34" height="7" rx="3.5" fill="var(--svc)" />
    </svg>
  );
}

/** JuditoADS: un anuncio saliendo al mundo y los números subiendo. */
export function ArteAds({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} fill="none" aria-hidden>
      {/* El anuncio, en el teléfono del dueño */}
      <rect
        x="10" y="16" width="72" height="118" rx="12"
        fill="rgba(255,255,255,0.03)" stroke="var(--svc-luz)" strokeWidth="2"
      />
      <circle cx="24" cy="32" r="6" fill="var(--svc)" opacity="0.7" />
      <rect x="35" y="28" width="28" height="4" rx="2" fill="var(--svc-luz)" opacity="0.5" />
      <rect x="35" y="36" width="18" height="3" rx="1.5" fill="var(--svc-luz)" opacity="0.3" />
      <rect x="20" y="46" width="52" height="40" rx="6" fill="var(--svc)" opacity="0.45" />
      {/* Botoncito de "me gusta" y el llamado a la acción */}
      <path
        d="M32 96c0-3 2.4-5 5-5 1.7 0 3 .9 3.7 2 .7-1.1 2-2 3.7-2 2.6 0 5 2 5 5 0 4.2-8.7 9-8.7 9S32 100.2 32 96z"
        fill="var(--svc-luz)" opacity="0.85"
      />
      <rect x="20" y="114" width="52" height="12" rx="6" fill="var(--svc)" />
      {/* Hacia dónde sale: las plataformas */}
      <path
        d="M88 62c18-10 30-10 44-6M88 78c18 4 30 10 44 22"
        stroke="var(--svc-luz)" strokeWidth="2" strokeDasharray="4 5" opacity="0.7" {...trazo}
      />
      <circle cx="140" cy="52" r="14" fill="var(--svc)" opacity="0.2" stroke="var(--svc-luz)" strokeWidth="1.5" />
      <rect x="133" y="45" width="14" height="14" rx="4.5" stroke="var(--svc-luz)" strokeWidth="1.8" />
      <circle cx="140" cy="52" r="3" fill="var(--svc-luz)" />
      <circle cx="140" cy="108" r="14" fill="var(--svc)" opacity="0.2" stroke="var(--svc-luz)" strokeWidth="1.5" />
      <path
        d="M142 101h3v-5h-4c-3.3 0-5 2-5 5v3h-3v5h3v11h5v-11h4l1-5h-5v-2c0-.7.3-1 1-1z"
        fill="var(--svc-luz)"
      />
      {/* El resultado: la gente que llega */}
      <path d="M170 124V96M188 124V78M206 124V58M224 124V36" stroke="var(--svc)" strokeWidth="9" {...trazo} />
      <path d="M166 128h62" stroke="var(--svc-luz)" strokeWidth="2" opacity="0.5" {...trazo} />
      <path d="M168 90l18-18 18-20 18-22" stroke="var(--svc-luz)" strokeWidth="2.5" opacity="0.9" {...trazo} />
      <path d="M216 14h12v12" stroke="var(--svc-luz)" strokeWidth="2.5" {...trazo} />
    </svg>
  );
}

/** AI Assistants: el robot contestando mientras el dueño duerme. */
export function ArteAi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} fill="none" aria-hidden>
      {/* Pregunta del cliente */}
      <path
        d="M18 26h84a8 8 0 018 8v22a8 8 0 01-8 8H36l-14 12V64h-4a8 8 0 01-8-8V34a8 8 0 018-8z"
        fill="rgba(255,255,255,0.04)" stroke="var(--svc-luz)" strokeWidth="1.8" opacity="0.85"
      />
      <rect x="28" y="38" width="58" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.45" />
      <rect x="28" y="49" width="38" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.3" />
      {/* Respuesta del asistente, del color de la familia */}
      <path
        d="M138 84h84a8 8 0 018 8v22a8 8 0 01-8 8h-4v12l-14-12h-66a8 8 0 01-8-8V92a8 8 0 018-8z"
        fill="var(--svc)" opacity="0.35"
      />
      <path
        d="M138 84h84a8 8 0 018 8v22a8 8 0 01-8 8h-4v12l-14-12h-66a8 8 0 01-8-8V92a8 8 0 018-8z"
        stroke="var(--svc-luz)" strokeWidth="1.8"
      />
      <rect x="150" y="96" width="60" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.7" />
      <rect x="150" y="107" width="42" height="5" rx="2.5" fill="var(--svc-luz)" opacity="0.5" />
      {/* El robot en el medio, contestando */}
      <circle cx="120" cy="80" r="26" className="svc-halo" opacity="0.5" />
      <rect x="99" y="58" width="42" height="38" rx="16" fill="#1b1928" stroke="var(--svc-luz)" strokeWidth="2" />
      <circle cx="94" cy="77" r="5" fill="#1b1928" stroke="var(--svc-luz)" strokeWidth="1.6" />
      <circle cx="146" cy="77" r="5" fill="#1b1928" stroke="var(--svc-luz)" strokeWidth="1.6" />
      <ellipse cx="111" cy="76" rx="4.5" ry="6" fill="var(--svc-luz)" />
      <ellipse cx="129" cy="76" rx="4.5" ry="6" fill="var(--svc-luz)" />
      <path d="M120 58V48" stroke="var(--svc-luz)" strokeWidth="2" {...trazo} />
      <circle cx="120" cy="44" r="4" fill="var(--svc)" />
      {/* Reloj: contesta también de madrugada */}
      <circle cx="40" cy="112" r="15" fill="rgba(255,255,255,0.03)" stroke="var(--svc-luz)" strokeWidth="1.8" />
      <path d="M40 104v8l6 4" stroke="var(--svc-luz)" strokeWidth="2" {...trazo} />
      <text
        x="62" y="117"
        fill="var(--svc-luz)" opacity="0.75"
        fontSize="13" fontWeight="700" fontFamily="inherit"
      >
        24/7
      </text>
    </svg>
  );
}
