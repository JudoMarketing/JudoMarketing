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
};

const CATEGORIAS_VALIDAS = [
  "food",
  "delivery",
  "tiendas",
  "servicios",
  "fundaciones",
  "equipos",
];

export async function trabajosPublicados(): Promise<Trabajo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return [];

  try {
    const supabase = createClient(url, llave, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("sites")
      .select(
        "name,status,domain,portfolio_category,portfolio_desc_es,portfolio_desc_en,portfolio_image"
      )
      .in("status", ["activo", "en_desarrollo"])
      .eq("portfolio_visible", true)
      .not("domain", "is", null)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as Fila[])
      .filter((fila) => Boolean(fila.domain))
      .map((fila) => {
        const dominio = fila.domain!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
        const categoria = CATEGORIAS_VALIDAS.includes(fila.portfolio_category ?? "")
          ? (fila.portfolio_category as Categoria)
          : null;
        return {
          nombre: fila.name,
          dominio,
          url: `https://${dominio}`,
          imagen: capturaDelHome(dominio, fila.portfolio_image),
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
