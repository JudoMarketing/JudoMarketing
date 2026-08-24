import Image from "next/image";

/**
 * Los tres dibujos de los servicios.
 *
 * Cada uno tiene un trabajo: explicar el servicio sin que haya que leer. Un
 * párrafo menos por cada dibujo que se entienda.
 *
 * Se están reemplazando uno a uno por las ilustraciones de la marca, que viven
 * en public/servicios. El que todavía no tiene la suya sigue siendo un SVG
 * hecho a mano que toma el color de su familia desde `var(--svc)`.
 */

const trazo = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

/**
 * Una ilustración de servicio. Todas se guardan recortadas al contenido y a
 * 1200 de ancho, que es de sobra para el tamaño más grande en que se muestran;
 * Next/Image se encarga de servir la medida que haga falta.
 *
 * `prioridad` va solo en la que aparece antes de bajar la página: si se le
 * pone a todas, compiten entre sí y no acelera ninguna.
 */
function Ilustracion({
  src,
  alto,
  className,
  prioridad = false,
}: {
  src: string;
  alto: number;
  className: string;
  prioridad?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt=""
        width={1200}
        height={alto}
        priority={prioridad}
        sizes="(max-width: 768px) 90vw, 560px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/** Websites: la mascota con el panel de control en la mano. */
export function ArteWebsites({ className = "" }: { className?: string }) {
  return (
    <Ilustracion src="/servicios/websites.png" alto={686} className={className} prioridad />
  );
}

/** JuditoADS: el anuncio saliendo a las redes y los números subiendo. */
export function ArteAds({ className = "" }: { className?: string }) {
  return <Ilustracion src="/servicios/juditoads.png" alto={699} className={className} />;
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
