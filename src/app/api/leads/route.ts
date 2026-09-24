// Prospección por correo: la puerta que usa la sesión automática.
//
// La sesión (docs/LEADS.md) no tiene base de datos ni SMTP: le pide todo a
// esta ruta con el secreto LEADS_SECRET. El secreto vive en Vercel y en el
// entorno de la sesión, nunca en el navegador ni en el repo.
//
//   GET  ?corridas=1            últimas 400 corridas (para rotar la zona)
//   GET  ?memoria=1             últimas 21 corridas con su resumen y aprendizajes
//                               (lo que la sesión lee antes de elegir)
//   GET  ?zip=33130             leads de ese zip con su estado
//   GET  ?reporte=1[&desde=ISO] bajas, clics, respuestas y envíos (auditoría)
//   GET  ?archivos=1            archivos diarios de Sunbiz ya procesados
//   POST {accion:"buscar"}      negocios de un zip según Google Places
//   POST {accion:"buscar_nombre"} ¿existe este negocio (de Sunbiz) en Google? y su detalle
//   POST {accion:"archivo"}     marca un archivo de Sunbiz como procesado
//   POST {accion:"guardar"}     guarda lo investigado (upsert por place_id)
//   POST {accion:"posicion"}    puesto del negocio en Google Maps para una búsqueda
//   POST {accion:"pagespeed"}   lo que Google mide de su página (PageSpeed Insights)
//   POST {accion:"posicion_web"} puesto de su dominio en la búsqueda web (si hay CSE)
//   POST {accion:"borradores"}  guarda los borradores (con PDF) para que el sitio los mande solo
//                               desde /api/leads/cron; es lo que usa la sesión automática
//   POST {accion:"enviar"}      manda los borradores ahora mismo, con todos los candados
//   POST {accion:"actualizar"}  completa un lead (correo hallado en internet, rubro, nota)
//   POST {accion:"descartar"}   marca leads que no se van a escribir
//   POST {accion:"corrida"}     deja registro de la corrida

import { NextRequest, NextResponse } from "next/server";
import {
  autorizado,
  buscarNegocios,
  buscarPorNombre,
  clienteServicio,
  detallePlace,
  enviarBorradores,
  guardarBorradores,
  pageSpeed,
  paisDeZona,
  posicionEnMaps,
  posicionWeb,
  reporte,
  secretoLeads,
  zonaValida,
  ZONA_RE,
  type Borrador,
  type Pais,
} from "@/lib/leads";

// Places tarda entre 10 y 30 llamadas por zip; el envío, hasta 10 correos.
export const maxDuration = 120;

function rechazar(req: NextRequest): NextResponse | null {
  if (!secretoLeads()) {
    return NextResponse.json(
      { error: "Prospección no configurada: falta LEADS_SECRET en Vercel." },
      { status: 503 }
    );
  }
  if (!autorizado(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

function conTablas(e: unknown): NextResponse {
  const msg = (e as Error).message ?? String(e);
  if (/relation .* does not exist|leads/.test(msg) && /does not exist/.test(msg)) {
    return NextResponse.json(
      { error: "Falta aplicar supabase/migrations/0027_leads.sql en el SQL Editor de Supabase." },
      { status: 500 }
    );
  }
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const no = rechazar(req);
  if (no) return no;
  const supabase = clienteServicio();
  const zip = req.nextUrl.searchParams.get("zip");
  try {
    if (req.nextUrl.searchParams.get("corridas")) {
      // Para rotar las zonas: hasta 400 corridas (a 3 por día son más de
      // los 60 días de la rotación), sin el resumen para que pese poco.
      const { data, error } = await supabase
        .from("leads_corridas")
        .select("zip, encontrados, con_correo, enviados, modo, creado_en")
        .order("creado_en", { ascending: false })
        .limit(400);
      if (error) throw error;
      return NextResponse.json({ corridas: data ?? [] });
    }
    if (req.nextUrl.searchParams.get("memoria")) {
      // Lo que la sesión lee antes de elegir: los resúmenes y aprendizajes
      // de las últimas corridas.
      const { data, error } = await supabase
        .from("leads_corridas")
        .select("zip, enviados, modo, resumen, creado_en")
        .not("resumen", "is", null)
        .order("creado_en", { ascending: false })
        .limit(21);
      if (error) throw error;
      return NextResponse.json({ memoria: data ?? [] });
    }
    if (req.nextUrl.searchParams.get("reporte")) {
      return NextResponse.json(await reporte(req.nextUrl.searchParams.get("desde") ?? undefined));
    }
    if (req.nextUrl.searchParams.get("archivos")) {
      const { data, error } = await supabase
        .from("leads_archivos")
        .select("archivo, registros, en_zona, candidatos, procesado_en")
        .order("archivo", { ascending: false })
        .limit(400);
      if (error) throw error;
      return NextResponse.json({ archivos: data ?? [] });
    }
    if (zip) {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nombre, email, estado, puntaje, enviado_en, website, telefono")
        .eq("zip", zip)
        .order("puntaje", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ leads: data ?? [] });
    }
    return NextResponse.json({ error: "Falta ?zip= o ?corridas=1" }, { status: 400 });
  } catch (e) {
    return conTablas(e);
  }
}

type LeadEntrante = {
  place_id: string;
  nombre: string;
  zip: string;
  direccion?: string | null;
  telefono?: string | null;
  website?: string | null;
  email?: string | null;
  tipo_google?: string | null;
  rubro?: string | null;
  rating?: number | null;
  resenas?: number | null;
  idioma?: "es" | "en" | null;
  constructor?: string | null;
  senales?: string[];
  resumen_sitio?: string | null;
  puntaje?: number;
  fuente?: "places" | "sunbiz";
  sunbiz_numero?: string | null;
  sunbiz_fecha?: string | null;
  oficial?: string | null;
  direccion_postal?: string | null;
};

export async function POST(req: NextRequest) {
  const no = rechazar(req);
  if (no) return no;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const accion = cuerpo.accion;

  try {
    if (accion === "buscar") {
      const zip = String(cuerpo.zip ?? "").trim();
      if (!ZONA_RE.test(zip)) {
        return NextResponse.json({ error: "zip debe ser un zip de 5 dígitos o una zona país:ciudad (scripts/leads/zonas.json)" }, { status: 400 });
      }
      // Un zip de Florida se busca tal cual; una ciudad trae su consulta y
      // las palabras que verifican la dirección.
      const zona = zonaValida(cuerpo.zona) ? cuerpo.zona : /^\d{5}$/.test(zip) ? { id: zip, consulta: zip, verificar: [zip] } : null;
      if (!zona || zona.id !== zip) {
        return NextResponse.json({ error: "falta zona {id, consulta, verificar} para esa ciudad" }, { status: 400 });
      }
      const maximo = Math.min(Number(cuerpo.maximo ?? 100), 150);
      const semilla = Number(cuerpo.semilla ?? 0);
      const { candidatos, consultas, aviso } = await buscarNegocios(zona, maximo, semilla);

      // Qué candidatos ya conocemos, para que la sesión no repita trabajo.
      const supabase = clienteServicio();
      const ids = candidatos.map((c) => c.place_id);
      const conocidos = new Map<string, { id: string; estado: string; enviado_en: string | null; email: string | null }>();
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await supabase
          .from("leads")
          .select("id, place_id, estado, enviado_en, email")
          .in("place_id", ids.slice(i, i + 100));
        if (error) throw error;
        for (const fila of data ?? []) conocidos.set(fila.place_id, fila);
      }
      return NextResponse.json({
        zip,
        consultas,
        aviso,
        candidatos: candidatos.map((c) => ({ ...c, conocido: conocidos.get(c.place_id) ?? null })),
      });
    }

    if (accion === "buscar_nombre") {
      const nombre = String(cuerpo.nombre ?? "").trim();
      const ciudad = String(cuerpo.ciudad ?? "").trim();
      const zip = String(cuerpo.zip ?? "").trim();
      if (!nombre || !/^\d{5}$/.test(zip)) {
        return NextResponse.json({ error: "faltan nombre y zip" }, { status: 400 });
      }
      const hallado = await buscarPorNombre(nombre, ciudad, zip);
      if (!hallado) return NextResponse.json({ en_google: false });
      const detalle = cuerpo.detalle === false ? null : await detallePlace(hallado.place_id);
      return NextResponse.json({ en_google: true, ...hallado, detalle });
    }

    if (accion === "archivo") {
      const archivo = String(cuerpo.archivo ?? "");
      if (!/^\d{8}c\.txt$/.test(archivo)) {
        return NextResponse.json({ error: "archivo inválido" }, { status: 400 });
      }
      const supabase = clienteServicio();
      const { error } = await supabase.from("leads_archivos").upsert({
        archivo,
        registros: Number(cuerpo.registros ?? 0),
        en_zona: Number(cuerpo.en_zona ?? 0),
        candidatos: Number(cuerpo.candidatos ?? 0),
        procesado_en: new Date().toISOString(),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (accion === "guardar") {
      const entrantes = (cuerpo.leads ?? []) as LeadEntrante[];
      if (!Array.isArray(entrantes) || entrantes.length === 0 || entrantes.length > 200) {
        return NextResponse.json({ error: "leads: entre 1 y 200" }, { status: 400 });
      }
      const supabase = clienteServicio();
      const { data: existentes, error: e1 } = await supabase
        .from("leads")
        .select("id, place_id, estado, email, enviado_en")
        .in("place_id", entrantes.map((l) => l.place_id));
      if (e1) throw e1;
      const porPlace = new Map((existentes ?? []).map((f) => [f.place_id, f]));

      const salida: Array<{ id: string; place_id: string; estado: string; email: string | null; nuevo: boolean }> = [];
      for (const l of entrantes) {
        if (!l.place_id || !l.nombre || !ZONA_RE.test(l.zip ?? "")) continue;
        const email = l.email?.trim().toLowerCase() || null;
        const investigado = {
          nombre: l.nombre.slice(0, 200),
          zip: l.zip,
          pais: paisDeZona(l.zip) as Pais,
          direccion: l.direccion ?? null,
          telefono: l.telefono ?? null,
          website: l.website ?? null,
          tipo_google: l.tipo_google ?? null,
          rubro: l.rubro ?? null,
          rating: l.rating ?? null,
          resenas: l.resenas ?? null,
          idioma: l.idioma && ["es", "en", "de"].includes(l.idioma) ? l.idioma : null,
          constructor: l.constructor ?? null,
          senales: Array.isArray(l.senales) ? l.senales.slice(0, 20) : [],
          resumen_sitio: l.resumen_sitio?.slice(0, 1200) ?? null,
          puntaje: Number.isFinite(l.puntaje) ? Number(l.puntaje) : 0,
          fuente: l.fuente === "sunbiz" ? "sunbiz" : "places",
          sunbiz_numero: l.sunbiz_numero ?? null,
          sunbiz_fecha: l.sunbiz_fecha && /^\d{4}-\d{2}-\d{2}$/.test(l.sunbiz_fecha) ? l.sunbiz_fecha : null,
          oficial: l.oficial?.slice(0, 120) ?? null,
          direccion_postal: l.direccion_postal?.slice(0, 200) ?? null,
        };
        const previo = porPlace.get(l.place_id);
        if (!previo) {
          const { data, error } = await supabase
            .from("leads")
            .insert({ place_id: l.place_id, email, estado: email ? "nuevo" : "sin_correo", ...investigado })
            .select("id, place_id, estado, email")
            .single();
          if (error) throw error;
          salida.push({ ...data, nuevo: true });
          continue;
        }
        // Ya estaba: se refresca la investigación, pero el estado y el correo
        // de un lead escrito o dado de baja no se tocan.
        const cambios: Record<string, unknown> = { ...investigado };
        const sinHistoria = previo.estado === "nuevo" || previo.estado === "sin_correo";
        if (sinHistoria) {
          const correoFinal = previo.email ?? email;
          cambios.email = correoFinal;
          cambios.estado = correoFinal ? "nuevo" : "sin_correo";
        }
        const { data, error } = await supabase
          .from("leads")
          .update(cambios)
          .eq("id", previo.id)
          .select("id, place_id, estado, email")
          .single();
        if (error) throw error;
        salida.push({ ...data, nuevo: false });
      }
      return NextResponse.json({ leads: salida });
    }

    if (accion === "posicion") {
      const consulta = String(cuerpo.consulta ?? "").trim().slice(0, 80);
      const zip = String(cuerpo.zip ?? "").trim();
      const placeId = String(cuerpo.place_id ?? "").trim();
      const lugar = typeof cuerpo.lugar === "string" ? cuerpo.lugar.slice(0, 120) : undefined;
      if (!consulta || !ZONA_RE.test(zip) || !placeId) {
        return NextResponse.json({ error: "faltan consulta, zip y place_id" }, { status: 400 });
      }
      return NextResponse.json(await posicionEnMaps(consulta, zip, placeId, lugar));
    }

    if (accion === "pagespeed") {
      const url = String(cuerpo.url ?? "").trim();
      if (!/^https?:\/\/[^\s]+$/.test(url)) return NextResponse.json({ error: "url inválida" }, { status: 400 });
      const estrategia = cuerpo.estrategia === "desktop" ? "desktop" : "mobile";
      return NextResponse.json(await pageSpeed(url, estrategia));
    }

    if (accion === "posicion_web") {
      const consulta = String(cuerpo.consulta ?? "").trim().slice(0, 80);
      const dominio = String(cuerpo.dominio ?? "").trim().toLowerCase();
      if (!consulta || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) {
        return NextResponse.json({ error: "faltan consulta y dominio" }, { status: 400 });
      }
      const idioma = cuerpo.idioma === "es" ? "es" : cuerpo.idioma === "de" ? "de" : "en";
      const pais = typeof cuerpo.pais === "string" && ["us", "es", "uk", "de"].includes(cuerpo.pais) ? (cuerpo.pais as Pais) : "us";
      return NextResponse.json(await posicionWeb(consulta, dominio, idioma, pais));
    }

    if (accion === "enviar" || accion === "borradores") {
      const borradores = (cuerpo.borradores ?? []) as Borrador[];
      if (!Array.isArray(borradores) || borradores.length === 0) {
        return NextResponse.json({ error: "borradores vacío" }, { status: 400 });
      }
      if (borradores.length > 40) {
        return NextResponse.json({ error: "máximo 40 borradores por petición" }, { status: 400 });
      }
      const resultado = accion === "enviar" ? await enviarBorradores(borradores) : await guardarBorradores(borradores);
      return NextResponse.json(resultado);
    }

    if (accion === "actualizar") {
      // La sesión encontró algo más tarde (un correo buscando en internet, el
      // rubro, una nota). Solo sobre leads sin historia de envío.
      const id = String(cuerpo.lead_id ?? "");
      if (!id) return NextResponse.json({ error: "falta lead_id" }, { status: 400 });
      const cambios: Record<string, unknown> = {};
      const email = typeof cuerpo.email === "string" ? cuerpo.email.trim().toLowerCase() : null;
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
          return NextResponse.json({ error: "correo inválido" }, { status: 400 });
        }
        cambios.email = email;
        cambios.estado = "nuevo";
      }
      if (typeof cuerpo.rubro === "string") cambios.rubro = cuerpo.rubro.slice(0, 80);
      if (typeof cuerpo.notas === "string") cambios.notas = cuerpo.notas.slice(0, 1000);
      if (typeof cuerpo.idioma === "string" && ["es", "en"].includes(cuerpo.idioma)) cambios.idioma = cuerpo.idioma;
      if (Object.keys(cambios).length === 0) {
        return NextResponse.json({ error: "nada que actualizar" }, { status: 400 });
      }
      const supabase = clienteServicio();
      const { data, error } = await supabase
        .from("leads")
        .update(cambios)
        .eq("id", id)
        .in("estado", ["nuevo", "sin_correo"])
        .select("id, estado, email")
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "lead no existe o ya tiene historia" }, { status: 404 });
      return NextResponse.json({ lead: data });
    }

    if (accion === "descartar") {
      const ids = (cuerpo.lead_ids ?? []) as string[];
      const motivo = String(cuerpo.motivo ?? "").slice(0, 300);
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "lead_ids vacío" }, { status: 400 });
      }
      const supabase = clienteServicio();
      const { error } = await supabase
        .from("leads")
        .update({ estado: "descartado", notas: motivo || null })
        .in("id", ids)
        .in("estado", ["nuevo", "sin_correo"]);
      if (error) throw error;
      return NextResponse.json({ ok: true, descartados: ids.length });
    }

    if (accion === "corrida") {
      const supabase = clienteServicio();
      const fila = {
        zip: String(cuerpo.zip ?? ""),
        encontrados: Number(cuerpo.encontrados ?? 0),
        con_correo: Number(cuerpo.con_correo ?? 0),
        enviados: Number(cuerpo.enviados ?? 0),
        modo: (process.env.LEADS_MODO ?? "prueba") === "real" ? "real" : "prueba",
        resumen: String(cuerpo.resumen ?? "").slice(0, 4000) || null,
      };
      if (!ZONA_RE.test(fila.zip)) {
        return NextResponse.json({ error: "zip inválido" }, { status: 400 });
      }
      const { error } = await supabase.from("leads_corridas").insert(fila);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "accion desconocida" }, { status: 400 });
  } catch (e) {
    return conTablas(e);
  }
}
