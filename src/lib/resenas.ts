/**
 * Reseñas de visitantes aprobadas por Administración, leídas en el servidor.
 *
 * Antes la portada bajaba la librería entera de Supabase (50 KB de
 * JavaScript, la pieza más pesada de la página) solo para pedir estas nueve
 * filas desde el navegador. Ahora se piden por REST al generar la página y
 * llegan ya pintadas: Google las lee, el teléfono no ejecuta nada, y la
 * portada se regenera cada dos minutos, así que una reseña recién aprobada
 * tarda eso en salir.
 */

export type Resena = { id: string; name: string; place: string; body: string };

export async function resenasAprobadas(): Promise<Resena[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llave) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/reviews?select=id,name,place,body&status=eq.aprobada&order=created_at.desc&limit=9`,
      {
        headers: { apikey: llave, Authorization: `Bearer ${llave}` },
        next: { revalidate: 120 },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as Resena[];
  } catch {
    return [];
  }
}
