import { createClient } from "@supabase/supabase-js";
import { capturaDelHome, type Categoria, type Trabajo } from "@/content/portfolio";

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
 * Si algo falla —el sitio está caído, tarda demasiado— se devuelve el dominio
 * tal como está guardado: peor es quedarse sin portafolio por una consulta.
 */
async function dominioQueContesta(dominio: string): Promise<string> {
  try {
    const res = await fetch(`https://${dominio}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    const destino = new URL(res.url).hostname;
    return destino || dominio;
  } catch {
    return dominio;
  }
}

export async function trabajosPublicados(): Promise<Trabajo[]> {
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
        imagen: capturaDelHome(paraLaFoto[i], fila.portfolio_image, fila.portfolio_shot_at),
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
