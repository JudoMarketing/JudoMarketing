import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { trabajosPublicados } from "@/lib/portfolio";

/**
 * El show de websites del home (Junior, 25 de noviembre de 2026: «reduce el
 * tamaño y que vayan moviéndose horizontalmente, como un show»).
 *
 * Son los mismos trabajos del showcase (src/lib/portfolio.ts), sin los que
 * todavía están en desarrollo, con su portada. La fila va dos veces seguida y
 * se desliza la mitad, así el giro no tiene costura. Se detiene con el mouse
 * encima o con el foco del teclado, y con movimiento reducido se queda quieta
 * y se recorre con el dedo. La vuelta dura dos pulsos por sitio (globals.css,
 * --pulso): el mismo compás que el resto de la página.
 *
 * Cada ficha es el website de un cliente con su nombre: son negocios de
 * nuestros clientes, no Judo Marketing.
 */
export default async function ShowDeWebsites({ locale }: { locale: string }) {
  const trabajos = (await trabajosPublicados()).filter((t) => !t.enDesarrollo);
  if (trabajos.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "home" });

  const base = trabajos.map((trabajo) => ({
    nombre: trabajo.nombre,
    dominio: trabajo.dominio.replace(/^www\./, ""),
    url: trabajo.url,
    imagen: trabajo.video?.poster ?? trabajo.imagen,
  }));
  // Con pocos sitios la fila no llenaría la pantalla: se repite hasta tener
  // al menos ocho, para que el show siempre se vea lleno.
  let fichas = base;
  while (fichas.length < 8) fichas = fichas.concat(base);

  return (
    <div
      className="show-websites"
      style={{ ["--vuelta" as string]: `calc(var(--pulso) * ${fichas.length * 2})` }}
    >
      <div className="show-pista">
        {[0, 1].map((copia) =>
          fichas.map((ficha, i) => (
            <a
              key={`${copia}-${i}-${ficha.url}`}
              href={ficha.url}
              target="_blank"
              rel="noopener noreferrer"
              // La segunda copia solo existe para que el giro no tenga costura:
              // el lector de pantalla y el tabulador la saltan.
              aria-hidden={copia === 1 ? true : undefined}
              tabIndex={copia === 1 ? -1 : undefined}
              className="show-ficha group"
            >
              <span className="block overflow-hidden rounded-xl border border-white/10 bg-judo-surface shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] transition duration-300 group-hover:border-judo-lilac/40">
                <span className="flex items-center gap-1 border-b border-white/10 px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <span className="ml-1.5 truncate text-[11px] text-judo-fog/45">{ficha.dominio}</span>
                </span>
                <Image
                  src={ficha.imagen}
                  alt={copia === 0 ? t("showAlt", { nombre: ficha.nombre }) : ""}
                  width={480}
                  height={300}
                  sizes="260px"
                  className="block aspect-[16/10] h-auto w-full object-cover object-top"
                />
              </span>
              <span className="mt-2 block truncate text-sm font-semibold text-judo-fog/85">{ficha.nombre}</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
