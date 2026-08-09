"use client";

/**
 * Firma del Acuerdo de Servicio desde el teléfono del vendedor:
 * 1. El vendedor llena los datos del cliente (incluido su correo).
 * 2. Le muestra el contrato al cliente y el cliente firma en pantalla.
 * 3. El vendedor firma.
 * 4. Se genera el PDF con las TRES firmas (la de Administración se agrega
 *    automáticamente) + código único de verificación, se archiva en el
 *    portal de admin, y se comparte con el cliente por correo/WhatsApp.
 */

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./AuthForms";
import { precio } from "@/lib/pricing";
import SignaturePad from "./SignaturePad";
import {
  ADMIN_SIGNER_NAME,
  ADMIN_SIGNER_TITLE,
  contractSections,
} from "@/content/client-contract";

type Step = "pick" | "form" | "client-sign" | "seller-sign" | "done";

export type VisitOption = { id: string; name: string; company: string };
export type NewSignedContract = {
  id: string;
  code: string;
  client_name: string;
  business_name: string | null;
  pdf_path: string;
  created_at: string;
};

// El precio sale del calendario: sube solo el 1 de septiembre. El vendedor
// lo puede cambiar a mano si acordó otra cosa con el cliente.
const PLANS: Record<string, { name: string; price: number }> = {
  essential: { name: "Website Esencial", price: precio("essential") },
  complex: { name: "Website Complejo", price: precio("complex") },
  apps: { name: "App para Teléfonos", price: precio("apps") },
};

function makeCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `JM-${new Date().getFullYear()}-${hex}`;
}

export default function ContractSigner({
  sellerId,
  sellerName,
  visits,
  onClose,
  onSigned,
}: {
  sellerId: string;
  sellerName: string;
  visits: VisitOption[];
  onClose: () => void;
  onSigned?: (contract: NewSignedContract) => void;
}) {
  const supabase = getSupabase();
  const [step, setStep] = useState<Step>(visits.length > 0 ? "pick" : "form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [plan, setPlan] = useState("essential");
  const [price, setPrice] = useState(String(precio("essential")));
  const [domain, setDomain] = useState("");

  const [clientSig, setClientSig] = useState<string | null>(null);
  const [sellerSig, setSellerSig] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const buildPdf = async (): Promise<Uint8Array> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
    const purple = rgb(0.48, 0.18, 1);
    const dark = rgb(0.07, 0.07, 0.1);
    const gray = rgb(0.4, 0.4, 0.45);

    let page = doc.addPage([612, 792]);
    let y = 740;
    const left = 60;
    const width = 612 - left * 2;

    const newPageIfNeeded = (needed: number) => {
      if (y - needed < 60) {
        page = doc.addPage([612, 792]);
        y = 740;
      }
    };

    const wrap = (text: string, f = font, size = 9): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) > width) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const draw = (text: string, f = font, size = 9, color = dark, gap = 12.5) => {
      for (const line of wrap(text, f, size)) {
        newPageIfNeeded(gap);
        page.drawText(line, { x: left, y, size, font: f, color });
        y -= gap;
      }
    };

    // Encabezado
    page.drawText("ACUERDO DE SERVICIO", { x: left, y, size: 20, font: bold, color: dark });
    y -= 16;
    draw("JUDO MARKETING · Contrato de suscripción de website y servicios digitales · Plazo: 12 meses", font, 9, gray);
    y -= 4;
    const now = new Date();
    draw(`Código de verificación: ${code}   ·   Fecha: ${now.toLocaleDateString("es-US")} ${now.toLocaleTimeString("es-US")}`, bold, 9, purple);
    y -= 8;

    // Datos del servicio
    const planInfo = PLANS[plan];
    const rows = [
      `Cliente: ${clientName}${businessName ? `   ·   Empresa: ${businessName}` : ""}`,
      `Email del cliente: ${clientEmail}`,
      `Plan: ${planInfo.name}   ·   Precio acordado: $${price}/mes (USD)${domain ? `   ·   Dominio: ${domain}` : ""}`,
      `Vendedor asignado: ${sellerName}`,
    ];
    for (const row of rows) draw(row, font, 10, dark, 14);
    y -= 8;

    // Secciones
    for (const section of contractSections) {
      newPageIfNeeded(30);
      draw(section.title, bold, 11, purple, 15);
      for (const paragraph of section.body) draw(paragraph, font, 9, dark, 12.5);
      y -= 5;
    }

    // Firmas
    newPageIfNeeded(170);
    y -= 10;
    page.drawLine({ start: { x: left, y }, end: { x: 612 - left, y }, thickness: 0.5, color: gray });
    y -= 20;
    const colWidth = width / 3;
    const sigY = y - 60;

    const embedSig = async (dataUrl: string) => doc.embedPng(dataUrl);

    if (clientSig) {
      const img = await embedSig(clientSig);
      const dims = img.scaleToFit(colWidth - 20, 50);
      page.drawImage(img, { x: left, y: sigY, width: dims.width, height: dims.height });
    }
    if (sellerSig) {
      const img = await embedSig(sellerSig);
      const dims = img.scaleToFit(colWidth - 20, 50);
      page.drawImage(img, { x: left + colWidth, y: sigY, width: dims.width, height: dims.height });
    }
    // Firma de Administración (automática)
    page.drawText(ADMIN_SIGNER_NAME, { x: left + colWidth * 2, y: sigY + 22, size: 17, font: italic, color: dark });
    page.drawText("Autorizado electrónicamente", { x: left + colWidth * 2, y: sigY + 8, size: 7, font, color: gray });

    const labels: [string, string][] = [
      ["EL CLIENTE", clientName],
      ["EL VENDEDOR", sellerName],
      [ADMIN_SIGNER_TITLE, ADMIN_SIGNER_NAME],
    ];
    labels.forEach(([role, name], i) => {
      const x = left + colWidth * i;
      page.drawLine({ start: { x, y: sigY - 6 }, end: { x: x + colWidth - 24, y: sigY - 6 }, thickness: 0.7, color: dark });
      page.drawText(role, { x, y: sigY - 18, size: 8, font: bold, color: dark });
      page.drawText(name, { x, y: sigY - 29, size: 8, font, color: gray });
      page.drawText(`Firmado: ${now.toLocaleDateString("es-US")}`, { x, y: sigY - 40, size: 7, font, color: gray });
    });

    page.drawText(
      `Documento firmado electrónicamente · Código ${code} · Judo Marketing · www.judomarketing.net · admin@judomarketing.net`,
      { x: left, y: 40, size: 7, font, color: gray }
    );

    return doc.save();
  };

  const finalize = async () => {
    setBusy(true);
    setError("");
    try {
      const pdfBytes = await buildPdf();
      const path = `${sellerId}/${code}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("contracts")
        .upload(path, new Blob([pdfBytes as BlobPart], { type: "application/pdf" }));
      if (upErr) throw upErr;
      const { data: inserted, error: insErr } = await supabase
        .from("signed_contracts")
        .insert({
          code,
          seller_id: sellerId,
          client_name: clientName.trim(),
          business_name: businessName.trim() || null,
          client_email: clientEmail.trim(),
          plan,
          monthly_price: Number(price),
          domain: domain.trim() || null,
          pdf_path: path,
        })
        .select("id, code, client_name, business_name, pdf_path, created_at")
        .single();
      if (insErr) throw insErr;
      if (inserted && onSigned) onSigned(inserted as NewSignedContract);
      const { data: signed } = await supabase.storage
        .from("contracts")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      setPdfUrl(signed?.signedUrl ?? "");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el contrato");
    } finally {
      setBusy(false);
    }
  };

  const mailtoLink = () => {
    const subject = encodeURIComponent(`Tu contrato con Judo Marketing, código ${code}`);
    const body = encodeURIComponent(
      `Hola ${clientName},\n\n¡Bienvenido a Judo Marketing! 💜\n\nTu Acuerdo de Servicio quedó firmado por ti, por tu vendedor ${sellerName} y por ${ADMIN_SIGNER_NAME} (Administración).\n\nCódigo de verificación: ${code}\nDescarga tu contrato firmado aquí:\n${pdfUrl}\n\nCualquier duda, tu canal directo es tu vendedor, o escríbenos en www.judomarketing.net/es/contacto\n\nJudo Marketing\n66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130`
    );
    return `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  const waLink = () =>
    `https://wa.me/?text=${encodeURIComponent(`Tu contrato firmado con Judo Marketing (código ${code}): ${pdfUrl}`)}`;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-judo-black/90 p-4 backdrop-blur">
      <div className="mx-auto my-6 max-w-lg rounded-2xl border border-judo-lilac/30 bg-judo-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">📝 Firmar contrato</h2>
          <button onClick={onClose} className="text-judo-fog/50 hover:text-judo-lilac">✕</button>
        </div>

        {/* PASO 0: elegir a quién (desde las visitas del vendedor) */}
        {step === "pick" && (
          <div className="mt-4">
            <p className="text-sm text-judo-fog/70">
              📍 Elige a quién le vas a enviar el contrato:
            </p>
            <ul className="mt-3 max-h-56 divide-y divide-judo-lilac/10 overflow-y-auto rounded-xl border border-judo-lilac/20">
              {visits.map((visit) => (
                <li key={visit.id}>
                  <button
                    onClick={() => {
                      setClientName(visit.name);
                      setBusinessName(visit.company);
                      setStep("form");
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-judo-purple/10"
                  >
                    <span>
                      <span className="font-medium">{visit.name}</span>
                      {visit.company && (
                        <span className="text-judo-fog/50"> · {visit.company}</span>
                      )}
                    </span>
                    <span className="text-judo-lilac">→</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setClientName("");
                setBusinessName("");
                setStep("form");
              }}
              className="btn-secondary mt-3 w-full py-2 text-sm"
            >
              ✏️ Otro cliente, escribir los datos
            </button>
          </div>
        )}

        {/* PASO 1: datos */}
        {step === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCode(makeCode());
              setStep("client-sign");
            }}
            className="mt-4 flex flex-col gap-3"
          >
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre y apellido del cliente" className={inputClass} />
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nombre de la empresa (opcional)" className={inputClass} />
            <input required type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Correo del cliente (recibirá el contrato firmado)" className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <select value={plan} onChange={(e) => { setPlan(e.target.value); setPrice(String(PLANS[e.target.value].price)); }} className={inputClass}>
                {Object.entries(PLANS).map(([key, p]) => (
                  <option key={key} value={key} className="bg-judo-surface">{p.name}</option>
                ))}
              </select>
              <input required type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio $/mes" className={inputClass} />
            </div>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Dominio deseado (opcional)" className={inputClass} />
            <button type="submit" className="btn-primary">Continuar: firma del cliente →</button>
            {visits.length > 0 && (
              <button type="button" onClick={() => setStep("pick")} className="text-xs text-judo-fog/50 hover:text-judo-lilac">
                ← Elegir otra persona
              </button>
            )}
          </form>
        )}

        {/* PASO 2: el cliente lee y firma */}
        {step === "client-sign" && (
          <div className="mt-4">
            <p className="text-sm text-judo-fog/70">
              📱 Entrégale el teléfono a <b>{clientName}</b> para que lea y firme.
            </p>
            <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-judo-lilac/20 bg-judo-black/50 p-4 text-xs leading-relaxed text-judo-fog/80">
              <p className="font-bold text-judo-fog">ACUERDO DE SERVICIO DE JUDO MARKETING</p>
              <p className="mt-1 text-judo-lilac">Código: {code} · {clientName} · ${price}/mes · 12 meses</p>
              {contractSections.map((s) => (
                <div key={s.title} className="mt-3">
                  <p className="font-semibold text-judo-lilac">{s.title}</p>
                  {s.body.map((p, i) => (<p key={i} className="mt-1">{p}</p>))}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <SignaturePad label={`Firma del cliente: ${clientName}`} onChange={setClientSig} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep("form")} className="btn-secondary flex-1 py-2 text-sm">← Atrás</button>
              <button disabled={!clientSig} onClick={() => setStep("seller-sign")} className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: firma el vendedor */}
        {step === "seller-sign" && (
          <div className="mt-4">
            <p className="text-sm text-judo-fog/70">Ahora firmas tú, <b>{sellerName}</b>.</p>
            <div className="mt-4">
              <SignaturePad label={`Firma del vendedor: ${sellerName}`} onChange={setSellerSig} />
            </div>
            <p className="mt-3 rounded-xl border border-judo-lilac/20 bg-judo-black/40 px-3 py-2 text-xs text-judo-fog/60">
              ✒️ La firma y autorización de <b>{ADMIN_SIGNER_NAME}</b> ({ADMIN_SIGNER_TITLE}) se agrega automáticamente al documento.
            </p>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep("client-sign")} className="btn-secondary flex-1 py-2 text-sm">← Atrás</button>
              <button disabled={!sellerSig || busy} onClick={finalize} className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                {busy ? "Generando…" : "Firmar y generar PDF ✓"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: listo */}
        {step === "done" && (
          <div className="mt-4 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 font-semibold">¡Contrato firmado por las tres partes!</p>
            <p className="mt-1 text-sm text-judo-fog/60">
              Código de verificación: <b className="text-judo-lilac">{code}</b>
            </p>
            <p className="mt-1 text-xs text-judo-fog/50">
              Quedó archivado automáticamente en el portal de Administración.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a href={mailtoLink()} className="btn-primary text-sm">✉️ Enviar al correo de {clientName.split(" ")[0]}</a>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">💬 Compartir por WhatsApp</a>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-judo-lilac hover:underline">
                  ⬇ Descargar el PDF firmado
                </a>
              )}
            </div>
            <button onClick={onClose} className="mt-4 text-sm text-judo-fog/50 hover:text-judo-lilac">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
