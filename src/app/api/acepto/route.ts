// El cliente acepta su contrato.
//
// Llega desde /acepto/<código> con su nombre. No tiene cuenta, así que el
// servidor actúa con la llave de servicio: busca el contrato por código,
// comprueba que no estuviera aceptado, y guarda nombre, fecha, IP y
// navegador. Después vuelve a emitir el PDF con el bloque de aceptación y
// manda la copia definitiva al cliente y a Administración.
//
// El código es la única llave. Es largo y aleatorio, y una vez aceptado no
// se puede volver a aceptar: quien tenga el enlace después ya no cambia nada.

import { NextRequest, NextResponse } from "next/server";
import {
  BUCKET,
  COLUMNAS_DOCUMENTO,
  clienteDeServicio,
  enviarCopiaAceptada,
  pdfDeFila,
  type FilaDocumento,
} from "@/lib/documentos";

// Un mismo origen no acepta contratos a chorro.
const intentos = new Map<string, number[]>();
function demasiados(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  recientes.push(ahora);
  intentos.set(ip, recientes);
  return recientes.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
  if (demasiados(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }

  const { code, nombre } = (await req.json().catch(() => ({}))) as {
    code?: string;
    nombre?: string;
  };
  const codigo = (code ?? "").trim().toUpperCase();
  const quien = (nombre ?? "").trim();
  if (!/^JM-[A-Z2-9]{12}$/.test(codigo)) {
    return NextResponse.json({ error: "Ese enlace no es válido." }, { status: 400 });
  }
  if (quien.length < 3 || quien.length > 120) {
    return NextResponse.json({ error: "Escribe tu nombre completo." }, { status: 400 });
  }

  const supabase = clienteDeServicio();
  if (!supabase) {
    return NextResponse.json(
      { error: "El servidor no tiene la llave de servicio (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 501 }
    );
  }

  const { data: existente } = await supabase
    .from("documents")
    .select(COLUMNAS_DOCUMENTO)
    .eq("code", codigo)
    .single();
  if (!existente) return NextResponse.json({ error: "Ese enlace no es válido." }, { status: 404 });
  if ((existente as FilaDocumento).accepted_at) {
    return NextResponse.json({ error: "Este contrato ya fue aceptado." }, { status: 409 });
  }

  // La condición accepted_at IS NULL en el propio update evita que dos
  // aceptaciones al mismo tiempo se pisen: solo una encuentra la fila.
  const { data: aceptada } = await supabase
    .from("documents")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_name: quien,
      accepted_ip: ip,
      accepted_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    })
    .eq("code", codigo)
    .is("accepted_at", null)
    .select(COLUMNAS_DOCUMENTO)
    .single();
  if (!aceptada) return NextResponse.json({ error: "Este contrato ya fue aceptado." }, { status: 409 });

  const fila = aceptada as FilaDocumento;
  const pdf = await pdfDeFila(fila);
  await supabase.storage
    .from(BUCKET)
    .upload(fila.pdf_path, pdf, { contentType: "application/pdf", upsert: true });
  const falloCorreo = await enviarCopiaAceptada(fila, pdf);

  return NextResponse.json({
    ok: true,
    cuando: fila.accepted_at,
    copia: falloCorreo ? `Aceptado, pero la copia por correo no salió: ${falloCorreo}` : null,
  });
}
