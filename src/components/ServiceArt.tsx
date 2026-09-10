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

/**
 * JuditoADS: la mascota levantando el nombre. Es más logo que escena, y va
 * con la marca. Venía sobre negro; se le quitó el fondo para que el
 * resplandor se funda con el del sitio en vez de verse un rectángulo.
 */
export function ArteAds({ className = "" }: { className?: string }) {
  return <Ilustracion src="/servicios/juditoads.png" alto={1210} className={className} />;
}

/** Juditos: la familia de asistentes, cada uno con su oficio. Mismo tratamiento. */
export function ArteAi({ className = "" }: { className?: string }) {
  return <Ilustracion src="/servicios/ai-assistants.png" alto={675} className={className} />;
}
