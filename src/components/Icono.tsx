/**
 * Los iconos de Judo Marketing, dibujados a mano en una sola rejilla.
 *
 * Nada de emoji como iconos (kit/cerebro/METODO.md, sección 3): un emoji lo
 * dibuja el sistema operativo y se ve distinto en cada teléfono. Aquí todos
 * comparten rejilla (24), grosor (1,75) y remates redondos, y toman el color
 * del texto que los rodea (currentColor). Se juzgan al tamaño en que se usan,
 * no a 72 px: si una metáfora no se entiende a 20 px, se cambia la metáfora.
 *
 * El nombre va tipado: un icono mal escrito no compila.
 */
export type IconName =
  | "navegador"
  | "crecer"
  | "brujula"
  | "check"
  | "escudo"
  | "pin"
  | "telefono"
  | "mensaje"
  | "flecha"
  | "externo"
  | "buscar"
  | "chispa"
  | "barras"
  | "estrella"
  | "cerrar"
  | "calendario";

const TRAZOS: Record<IconName, React.ReactNode> = {
  // Una ventana de navegador con su contenido: el website
  navegador: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M6.2 6.75h.01M8.7 6.75h.01" />
      <path d="M7 13h7M7 16h4.5" />
    </>
  ),
  // La línea que sube: crecer
  crecer: (
    <>
      <path d="M3.5 17.5 9.5 11.5l4 4 7-7.5" />
      <path d="M15 8h5.5v5.5" />
    </>
  ),
  // La brújula: hacia dónde ir, la asesoría
  brujula: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.4 8.6-1.9 4.9-4.9 1.9 1.9-4.9z" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  escudo: (
    <>
      <path d="M12 3.5 5 6.2v5.3c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6.2z" />
      <path d="m9 12.2 2.1 2.1 4.1-4.3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  telefono: (
    <path d="M5.2 4.5h3l1.6 4-2 1.3a10.5 10.5 0 0 0 6.4 6.4l1.3-2 4 1.6v3a1.7 1.7 0 0 1-1.8 1.7A15.2 15.2 0 0 1 3.5 6.3a1.7 1.7 0 0 1 1.7-1.8z" />
  ),
  mensaje: <path d="M4.5 5.5h15v10h-8.2L7 19v-3.5H4.5z" />,
  flecha: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  externo: (
    <>
      <path d="M8 16 16 8" />
      <path d="M9.5 8H16v6.5" />
    </>
  ),
  // La lupa: buscar en Google
  buscar: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  // El destello: la inteligencia artificial
  chispa: (
    <>
      <path d="M11 3.5c.7 3.9 2.6 5.8 6.5 6.5-3.9.7-5.8 2.6-6.5 6.5-.7-3.9-2.6-5.8-6.5-6.5 3.9-.7 5.8-2.6 6.5-6.5z" />
      <path d="M18 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" />
    </>
  ),
  // Las barras: cómo te comparas con la competencia
  barras: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V8M17 20v-9" />
    </>
  ),
  cerrar: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  // La estrella: la reputación, las reseñas
  estrella: (
    <path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.7z" />
  ),
};

export default function Icono({
  nombre,
  tamano = 24,
  className,
}: {
  nombre: IconName;
  tamano?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
