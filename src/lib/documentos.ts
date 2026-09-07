// Lo que comparten las rutas de documentos: el código, las fechas en hora
// del Este, el PDF a partir de una fila de la tabla, el correo que lo lleva y
// el cliente de servicio para cuando quien actúa no tiene sesión (el cliente
// que acepta).
//
// Solo servidor.

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  documento,
  FIRMANTE,
  NOMBRE_TIPO,
  type DatosDocumento,
  type TipoDocumento,
} from "@/content/documentos";
import { generarPdf, type Aceptacion } from "@/lib/documentos-pdf";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

export const SITIO = "https://www.judomarketing.net";
export const BUCKET = "contracts";

/** Una fila de la tabla documents, tal como la usan las rutas y el portal. */
export type FilaDocumento = {
  id: string;
  code: string;
  kind: TipoDocumento;
  recipient_name: string;
  business_name: string | null;
  recipient_email: string;
  plan: string | null;
  monthly_price: number | string;
  project: string | null;
  starts_on: string;
  pdf_path: string;
  sent_at: string | null;
  send_error: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  accepted_ip: string | null;
  accepted_agent: string | null;
  created_at: string;
};

export const COLUMNAS_DOCUMENTO =
  "id, code, kind, recipient_name, business_name, recipient_email, plan, monthly_price, project, starts_on, pdf_path, sent_at, send_error, accepted_at, accepted_name, accepted_ip, accepted_agent, created_at";

/**
 * Código del contrato: va impreso en el PDF y es el enlace de aceptación.
 * Sin 0/O ni 1/I para que se pueda leer por teléfono sin confundirse; doce
 * caracteres de un alfabeto de 32 son unos 60 bits, más que de sobra para
 * que nadie lo adivine.
 */
export function codigoNuevo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let s = "";
  for (let i = 0; i < 12; i++) s += alfabeto[bytes[i] % alfabeto.length];
  return `JM-${s}`;
}

/** dd/mm/aaaa en hora del Este, que es la de la empresa. */
export function fechaEste(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-US", {
    timeZone: "America/New_York",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** dd/mm/aaaa hh:mm en hora del Este. */
export function fechaHoraEste(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-US", {
    timeZone: "America/New_York",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(",", "");
}

/** "2026-09-15" (columna date) → "15/09/2026". Sin pasar por Date: un date no tiene hora. */
function fechaDeColumna(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function rutaPdf(uid: string, code: string): string {
  return `${uid}/documentos/${code}.pdf`;
}

export function datosDeFila(f: FilaDocumento): DatosDocumento {
  return {
    codigo: f.code,
    fecha: fechaEste(new Date(f.created_at)),
    clienteNombre: f.recipient_name,
    clienteEmpresa: f.business_name,
    clienteEmail: f.recipient_email,
    plan: f.plan,
    precioMensual: Number(f.monthly_price),
    proyecto: f.project,
    inicio: fechaDeColumna(f.starts_on),
  };
}

function aceptacionDeFila(f: FilaDocumento): Aceptacion | null {
  if (!f.accepted_at || !f.accepted_name) return null;
  return {
    nombre: f.accepted_name,
    cuando: fechaHoraEste(new Date(f.accepted_at)),
    ip: f.accepted_ip ?? "desconocida",
  };
}

/** El PDF de una fila, con o sin la aceptación según lo que la fila tenga. */
export async function pdfDeFila(f: FilaDocumento): Promise<Uint8Array> {
  const datos = datosDeFila(f);
  return generarPdf(documento(f.kind, datos), f.code, datos.fecha, aceptacionDeFila(f));
}

export function nombreArchivo(f: FilaDocumento): string {
  return `Contrato-JudoMarketing-${f.kind}-${f.code}.pdf`;
}

export function enlaceAceptacion(code: string): string {
  return `${SITIO}/es/acepto/${code}`;
}

/**
 * El correo que lleva el contrato al cliente. Devuelve null si salió bien o
 * el motivo si no, para que la fila lo guarde y el portal lo enseñe.
 */
export async function enviarContrato(f: FilaDocumento, pdf: Uint8Array): Promise<string | null> {
  if (!isEmailConfigured()) return "El envío de correo no está configurado (SMTP_USER / SMTP_PASS).";
  const servicio = NOMBRE_TIPO[f.kind];
  const html = brandedEmail({
    title: "Tu contrato con Judo Marketing",
    greeting: `Hola, ${f.recipient_name}`,
    paragraphs: [
      `Te adjuntamos el acuerdo de servicio de <b>${servicio}</b>, ya firmado por Judo Marketing. Léelo con calma: ahí está lo que incluye, lo que cuesta y cómo te protege.`,
      `Cuando estés de acuerdo, acéptalo desde el botón. Te pedirá tu nombre y quedará registrado con fecha y hora. Después recibirás una copia con tu aceptación incluida.`,
      `Código del contrato: <b>${f.code}</b>. Si tienes cualquier duda, responde a este correo.`,
    ],
    ctaLabel: "Leer y aceptar el contrato",
    ctaUrl: enlaceAceptacion(f.code),
  });
  try {
    await sendBrandedEmail(f.recipient_email, `Tu contrato de ${servicio} · ${f.code}`, html, {
      replyTo: FIRMANTE.correo,
      adjuntos: [{ nombre: nombreArchivo(f), contenido: Buffer.from(pdf) }],
    });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudo enviar el correo.";
  }
}

/** La copia final, con la aceptación, para el cliente y para Administración. */
export async function enviarCopiaAceptada(f: FilaDocumento, pdf: Uint8Array): Promise<string | null> {
  if (!isEmailConfigured()) return "El envío de correo no está configurado.";
  const servicio = NOMBRE_TIPO[f.kind];
  const cuando = f.accepted_at ? fechaHoraEste(new Date(f.accepted_at)) : "";
  const html = brandedEmail({
    title: "Contrato aceptado",
    greeting: `${f.accepted_name ?? f.recipient_name} aceptó el contrato`,
    paragraphs: [
      `El acuerdo de servicio de <b>${servicio}</b> (código <b>${f.code}</b>) quedó aceptado el ${cuando}, hora del Este.`,
      "Adjuntamos la versión definitiva, con la firma de Judo Marketing y la aceptación del cliente. Guárdala: es el contrato.",
    ],
  });
  try {
    await sendBrandedEmail(
      [f.recipient_email, FIRMANTE.correo],
      `Contrato aceptado · ${servicio} · ${f.code}`,
      html,
      { replyTo: FIRMANTE.correo, adjuntos: [{ nombre: nombreArchivo(f), contenido: Buffer.from(pdf) }] }
    );
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudo enviar la copia.";
  }
}

/**
 * Cliente con la llave de servicio, para lo que hace el servidor en nombre
 * de alguien sin cuenta: el cliente que acepta su contrato. Null si la llave
 * no está puesta.
 */
export function clienteDeServicio(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return null;
  return createClient(url, llave, { auth: { persistSession: false } });
}
