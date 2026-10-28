import { createClient } from "@supabase/supabase-js";
import {
  capturaDelHome,
  OCULTOS_SHOWCASE,
  ORDEN_SHOWCASE,
  portadaFija,
  PROYECTOS_FIJOS,
  videoDePortada,
  type Categoria,
  type Trabajo,
} from "@/content/portfolio";

/**
 * Los trabajos del portafolio, leídos de la lista de websites.
 *
 * Se consulta con la llave de servicio y se piden SOLO las columnas que
 * pueden ser públicas: la tabla sites guarda además la clave del Judo Site
 * Kit, que nunca debe salir de aquí.
 *
 * Aparece un website cuando está marcado como visible y no está deshabilitado;
 * desaparece en cuanto Administración lo apaga. Los que todavía están en
 * desarrollo también entran: son trabajo que vale la pena enseñar, y salen
 * marcados como vista previa para que nadie los confunda con algo entregado.
 */

type Fila = {
  name: string;
  status: string;
  domain: string | null;
  portfolio_category: string | null;
  portfolio_desc_es: string | null;
  portfolio_desc_en: string | null;
  portfolio_image: string | null;
  portfolio_shot_at: string | null;
};

// Misma lista que el selector del portal y que el candado de la base
// (migración 0023). Si se agrega una categoría, va en las cuatro.
const CATEGORIAS_VALIDAS = [
  "food",
  "delivery",
  "tiendas",
  "servicios",
  "fundaciones",
  "equipos",
  "educacion",
  "automotriz",
  "construccion",
];

/**
 * Devuelve el dominio que de verdad contesta.
 *
 * Muchos dominios solo responden con www y mandan el resto a esa dirección. El
 * servicio de capturas no sigue esos rebotes: pide melanieosorio.com, le
 * contestan "ve a www", y devuelve una portada en blanco. Aquí se sigue el
 * rebote una vez y se guarda a dónde llegó, para pedirle la foto a esa.
 *
 * Si algo falla (el sitio está caído, tarda demasiado) se devuelve el dominio
 * tal como está guardado: peor es quedarse sin portafolio por una consulta.
 */
async function dominioQueContesta(dominio: string): Promise<string> {
  try {
    const res = await fetch(`https://${dominio}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    // Se conserva la ruta: un sitio alojado en una carpeta
    // (judomarketing.github.io/GeraldMarket) no es su dominio raíz, y la foto
    // del raíz es una página de error.
    const final = new URL(res.url);
    const destino = `${final.hostname}${final.pathname}`.replace(/\/+$/, "");
    return destino || dominio;
  } catch {
    return dominio;
  }
}

const sinWww = (dominio: string) => dominio.replace(/^www\./, "").toLowerCase();

/**
 * Lo del portal, con los proyectos fijos adelante (PROYECTOS_FIJOS). Un fijo
 * que ya está en el portal no se repite: manda el del portal. Al final, los
 * de ORDEN_SHOWCASE pasan al frente en ese orden; el resto no se mueve. Los
 * de OCULTOS_SHOWCASE no salen.
 */
export async function trabajosPublicados(): Promise<Trabajo[]> {
  const limpio = (dominio: string) => sinWww(dominio).replace(/\/+$/, "");
  const ocultos = OCULTOS_SHOWCASE.map(limpio);
  const todos = (await fijosYPortal()).filter((t) => {
    const d = limpio(t.dominio);
    return !ocultos.some((o) => d === o || d.startsWith(`${o}/`));
  });
  const puesto = (t: Trabajo) => {
    const i = ORDEN_SHOWCASE.indexOf(limpio(t.dominio));
    return i === -1 ? ORDEN_SHOWCASE.length : i;
  };
  // sort es estable: los que no están en la lista conservan su orden
  return todos.map((t, i) => ({ t, i })).sort((a, b) => puesto(a.t) - puesto(b.t) || a.i - b.i).map((x) => x.t);
}

async function fijosYPortal(): Promise<Trabajo[]> {
  const delPortal = await trabajosDelPortal();
  const enElPortal = new Set(delPortal.map((t) => sinWww(t.dominio)));
  const fijos: Trabajo[] = PROYECTOS_FIJOS.filter((p) => !enElPortal.has(sinWww(p.dominio))).map((p) => ({
    ...p,
    imagen: portadaFija(p.dominio) ?? capturaDelHome(p.url.replace(/^https?:\/\//, "")),
    video: videoDePortada(p.dominio),
    enDesarrollo: false,
  }));
  return [...fijos, ...delPortal];
}

async function trabajosDelPortal(): Promise<Trabajo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return [];

  try {
    const supabase = createClient(url, llave, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("sites")
      .select(
        "name,status,domain,portfolio_category,portfolio_desc_es,portfolio_desc_en,portfolio_image,portfolio_shot_at"
      )
      .in("status", ["activo", "en_desarrollo"])
      .eq("portfolio_visible", true)
      .not("domain", "is", null)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const filas = (data as Fila[]).filter((fila) => Boolean(fila.domain));

    // Se resuelven todos a la vez: la página es ISR, así que esto corre una vez
    // por revalidación, no en cada visita.
    const paraLaFoto = await Promise.all(
      filas.map(async (fila) => {
        const dominio = fila.domain!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
        // Con imagen propia no hace falta averiguar nada
        return fila.portfolio_image?.trim() ? dominio : dominioQueContesta(dominio);
      })
    );

    return filas.map((fila, i) => {
      const dominio = fila.domain!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const categoria = CATEGORIAS_VALIDAS.includes(fila.portfolio_category ?? "")
        ? (fila.portfolio_category as Categoria)
        : null;
      return {
        nombre: fila.name,
        dominio,
        url: `https://${dominio}`,
        imagen: portadaFija(dominio) ?? capturaDelHome(paraLaFoto[i], fila.portfolio_image, fila.portfolio_shot_at),
        // El video manda incluso sobre una imagen puesta en el portal (Delivery
        // Rush tenía una portada fija): estar en VIDEOS_PORTADA ya es decisión.
        video: videoDePortada(dominio),
        categoria,
        enDesarrollo: fila.status === "en_desarrollo",
        descripcion: {
          es: fila.portfolio_desc_es ?? "",
          en: fila.portfolio_desc_en ?? fila.portfolio_desc_es ?? "",
        },
      };
    });
  } catch {
    // Sin portafolio no se rompe nada: la página muestra su mensaje vacío.
    return [];
  }
}
