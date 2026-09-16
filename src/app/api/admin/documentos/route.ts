// Documentos formales desde el portal: generar el contrato ya firmado por
// Judo Marketing, guardarlo, mandarlo al cliente y llevar el registro.
//
//   GET                  la lista
//   GET ?descargar=<id>  enlace firmado (1 hora) al PDF
//   POST { accion: "enviar", tipo, email, nombre, empresa, plan, precio, proyecto, inicio }
//   POST { accion: "reenviar", id }
//   POST { accion: "eliminar", id }   solo si el cliente no lo aceptó
//
// Todo con la sesión del admin y sus políticas RLS; la llave de servicio no
// hace falta aquí. La aceptación del cliente vive en /api/acepto.

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/content/documentos";
import {
  BUCKET,
  COLUMNAS_DOCUMENTO,
  codigoNuevo,
  enviarContrato,
  pdfDeFila,
  rutaPdf,
  type FilaDocumento,
} from "@/lib/documentos";

type Admin = { supabase: SupabaseClient; uid: string };

async function comoAdmin(req: NextRequest): Promise<Admin | null> {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  return prof?.role === "admin" ? { supabase, uid: userData.user.id } : null;
}

const noAutorizado = () =>
  NextResponse.json({ error: "Solo para Administración" }, { status: 403 });

const errorDeBase = (e: { code?: string; message: string }) =>
  NextResponse.json(
    {
      error:
        e.code === "42P01"
          ? "Falta correr la migración 0026 (tabla documents)."
          : e.message,
    },
    { status: 500 }
  );

export async function GET(req: NextRequest) {
  const admin = await comoAdmin(req);
  if (!admin) return noAutorizado();
  const { supabase } = admin;

  const id = req.nextUrl.searchParams.get("descargar");
  if (id) {
    const { data: fila } = await supabase
      .from("documents")
      .select("pdf_path")
      .eq("id", id)
      .single();
    if (!fila) return NextResponse.json({ error: "No existe" }, { status: 404 });
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(fila.pdf_path, 3600);
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Sin PDF" }, { status: 500 });
    }
    return NextResponse.json({ url: data.signedUrl });
  }

  const { data, error } = await supabase
    .from("documents")
    .select(COLUMNAS_DOCUMENTO)
    .order("created_at", { ascending: false });
  if (error) return errorDeBase(error);
  return NextResponse.json({ documentos: (data ?? []) as FilaDocumento[] });
}

export async function POST(req: NextRequest) {
  const admin = await comoAdmin(req);
  if (!admin) return noAutorizado();
  const { supabase, uid } = admin;

  const body = (await req.json().catch(() => ({}))) as {
    accion?: string;
    id?: string;
    tipo?: string;
    email?: string;
    nombre?: string;
    empresa?: string;
    plan?: string;
    precio?: number | string;
    proyecto?: string;
    inicio?: string;
  };

  // ── Generar, guardar y mandar uno nuevo ──────────────────────────
  if (body.accion === "enviar") {
    const email = (body.email ?? "").trim().toLowerCase();
    const nombre = (body.nombre ?? "").trim();
    const precio = Number(body.precio);
    const inicio = (body.inicio ?? "").slice(0, 10);

    if (!body.tipo || !TIPOS_DOCUMENTO.includes(body.tipo as TipoDocumento)) {
      return NextResponse.json({ error: "Tipo de documento desconocido" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Ese correo no se ve bien" }, { status: 400 });
    }
    if (nombre.length < 2) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    if (!Number.isFinite(precio) || precio <= 0) {
      return NextResponse.json({ error: "El precio mensual tiene que ser mayor que cero" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
      return NextResponse.json({ error: "Falta la fecha de inicio" }, { status: 400 });
    }

    const code = codigoNuevo();
    const { data: creada, error } = await supabase
      .from("documents")
      .insert({
        code,
        kind: body.tipo,
        recipient_name: nombre,
        business_name: body.empresa?.trim() || null,
        recipient_email: email,
        plan: body.plan?.trim() || null,
        monthly_price: precio,
        project: body.proyecto?.trim() || null,
        starts_on: inicio,
        pdf_path: rutaPdf(uid, code),
        created_by: uid,
      })
      .select(COLUMNAS_DOCUMENTO)
      .single();
    if (error || !creada) return errorDeBase(error ?? { message: "No se guardó" });

    const fila = creada as FilaDocumento;
    const pdf = await pdfDeFila(fila);

    // Si el PDF no se puede guardar, la fila no debe quedar como si nada:
    // se borra y se avisa. Un contrato del que no hay archivo no existe.
    const subida = await supabase.storage
      .from(BUCKET)
      .upload(fila.pdf_path, pdf, { contentType: "application/pdf" });
    if (subida.error) {
      await supabase.from("documents").delete().eq("id", fila.id);
      return NextResponse.json(
        { error: `No se pudo guardar el PDF: ${subida.error.message}` },
        { status: 500 }
      );
    }

    const fallo = await enviarContrato(fila, pdf);
    const { data: final } = await supabase
      .from("documents")
      .update(fallo ? { send_error: fallo } : { sent_at: new Date().toISOString(), send_error: null })
      .eq("id", fila.id)
      .select(COLUMNAS_DOCUMENTO)
      .single();

    return NextResponse.json({ ok: !fallo, error: fallo ?? undefined, documento: final ?? fila });
  }

  // ── Lo demás actúa sobre uno que ya existe ───────────────────────
  if (!body.id) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  const { data: existente } = await supabase
    .from("documents")
    .select(COLUMNAS_DOCUMENTO)
    .eq("id", body.id)
    .single();
  if (!existente) return NextResponse.json({ error: "Ese documento ya no existe" }, { status: 404 });
  const fila = existente as FilaDocumento;

  if (body.accion === "reenviar") {
    // Se vuelve a armar en vez de bajarlo: sale igual, y si ya está aceptado
    // sale con la aceptación, que es la versión que el cliente debe tener.
    const pdf = await pdfDeFila(fila);
    const fallo = await enviarContrato(fila, pdf);
    const { data: final } = await supabase
      .from("documents")
      .update(fallo ? { send_error: fallo } : { sent_at: new Date().toISOString(), send_error: null })
      .eq("id", fila.id)
      .select(COLUMNAS_DOCUMENTO)
      .single();
    return NextResponse.json({ ok: !fallo, error: fallo ?? undefined, documento: final ?? fila });
  }

  if (body.accion === "eliminar") {
    // Un contrato aceptado es un registro legal: no se borra desde un botón.
    if (fila.accepted_at) {
      return NextResponse.json(
        { error: "Este contrato ya fue aceptado por el cliente y no se borra. Si hace falta anularlo, se hace por escrito y queda constancia." },
        { status: 409 }
      );
    }
    await supabase.storage.from(BUCKET).remove([fila.pdf_path]);
    const { error } = await supabase.from("documents").delete().eq("id", fila.id);
    if (error) return errorDeBase(error);
    return NextResponse.json({ ok: true, eliminado: fila.id });
  }

  return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
}
