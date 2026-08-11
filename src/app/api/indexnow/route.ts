import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { avisarBuscadores, urlsPublicas } from "@/lib/indexnow";

/**
 * Avisa a Bing, Yandex y compañía que hay contenido nuevo.
 *
 * Solo lo dispara Administración desde su portal: no es algo que deba poder
 * llamar cualquiera, porque avisar de más termina en que el buscador ignore
 * los avisos.
 */
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
  const { data: userData } = await supabase.auth.getUser(jwt);
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (prof?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const urls = urlsPublicas();
  const resultados = await avisarBuscadores(urls);
  return NextResponse.json({ urls: urls.length, resultados });
}
