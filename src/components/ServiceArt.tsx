import Image from "next/image";

/**
 * Las tres ilustraciones de los servicios.
 *
 * Cada una tiene un trabajo: explicar el servicio sin que haya que leer. Un
 * párrafo menos por cada dibujo que se entienda. Los archivos viven en
 * public/servicios y comparten estilo, así que las tres secciones se leen como
 * una sola marca.
 *
 * Se guardan recortadas al contenido y a 1200 de ancho, que es de sobra para
 * el tamaño más grande en que se muestran; Next/Image sirve la medida que haga
 * falta en cada pantalla.
 */

/**
 * `prioridad` va solo en la que aparece antes de bajar la página: si se le
 * pone a todas, compiten entre sí y no acelera ninguna.
 */
/**
 * Los renders de JuditoADS y Juditos vienen sobre negro, con su propia viñeta.
 * Quitarles el fondo a mano dejaba una mancha semitransparente detrás de la
 * figura (la sombra del suelo, el resplandor): se veía sucio. Mejor dejar la
 * imagen intacta y desvanecer sus bordes con una máscara radial: el centro
 * queda entero y el negro de las orillas se funde con el fondo del sitio.
 */
const DESVANECIDO = "radial-gradient(ellipse 56% 56% at 50% 50%, #000 58%, transparent 100%)";

function Ilustracion({
  src,
  alto,
  className,
  prioridad = false,
  desvanecer = false,
}: {
  src: string;
  alto: number;
  className: string;
  prioridad?: boolean;
  desvanecer?: boolean;
}) {
  const mascara = desvanecer
    ? { maskImage: DESVANECIDO, WebkitMaskImage: DESVANECIDO }
    : undefined;
  // La imagen toma el ancho que le dé su alto (w-auto) en vez de estirar su
  // caja al ancho del contenedor: así la máscara se aplica sobre la imagen de
  // verdad y no sobre una caja con bandas vacías a los lados, donde los bordes
  // del render quedaban a la vista.
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src={src}
        alt=""
        width={1200}
        height={alto}
        priority={prioridad}
        sizes="(max-width: 768px) 90vw, 560px"
        className="h-full w-auto max-w-full object-contain"
        style={mascara}
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

/** JuditoADS: la mascota levantando el nombre. Es más logo que escena, y va con la marca. */
export function ArteAds({ className = "" }: { className?: string }) {
  return <Ilustracion src="/servicios/juditoads.jpg" alto={1175} className={className} desvanecer />;
}

/** Juditos: la familia de asistentes, cada uno con su oficio. */
export function ArteAi({ className = "" }: { className?: string }) {
  return <Ilustracion src="/servicios/ai-assistants.jpg" alto={686} className={className} desvanecer />;
}
