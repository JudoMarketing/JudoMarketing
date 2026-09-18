// Seguimiento de clics de los correos de prospección.
//
// Los dos botones del correo apuntan aquí con el id del negocio y una firma
// HMAC. Se anota el clic en el lead y se redirige a la página real (contacto
// o showcase) con sus UTM. Si algo falla, se redirige igual: el visitante
// nunca se queda sin destino.

import { NextRequest, NextResponse } from "next/server";
import { registrarClic, secretoLeads, verificarClic } from "@/lib/leads";
import { enlacesProspecto } from "@/lib/leads-correo";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const idioma = q.get("i") === "es" ? "es" : "en";
  const zip = (q.get("z") ?? "").replace(/[^0-9]/g, "").slice(0, 5) || "00000";
  const accion = q.get("a") === "showcase" ? "showcase" : "contacto";
  const destino = enlacesProspecto(idioma, zip)[accion];

  if (secretoLeads()) {
    const clic = verificarClic(q.get("l"), q.get("a"), q.get("t"));
    if (clic) await registrarClic(clic.leadId, clic.accion);
  }
  return NextResponse.redirect(destino, { status: 302, headers: { "Cache-Control": "no-store" } });
}
