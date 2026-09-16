/**
 * El correo de prospección, tal como lo ve el dueño de un negocio.
 *
 * Este archivo no importa nada: así se puede renderizar fuera de Next (por
 * ejemplo para una vista previa) y no depende de variables de entorno. Lo
 * que cambia por lead (saludo, párrafos, idioma) llega por parámetro; lo que
 * es fijo (logo, botones, firma, pie legal) vive aquí.
 *
 * Diseño: tarjeta oscura con la paleta de la marca, tablas e inline styles
 * porque es lo único que los clientes de correo respetan de verdad. Sin
 * degradados ni fuentes web: Gmail, Outlook y Apple Mail lo pintan igual.
 */

export type IdiomaCorreo = "es" | "en";

export type CorreoProspecto = {
  idioma: IdiomaCorreo;
  /** Nombre del negocio, tal cual aparece en Google. */
  negocio: string;
  /** Primera línea, por ejemplo "Hola, equipo de La Carreta". */
  saludo: string;
  /** El cuerpo, ya escrito para ese negocio. Texto plano, sin HTML. */
  parrafos: string[];
  /** Posdata opcional. */
  ps?: string;
  /** Código postal por el que se encontró al negocio (va en el pie). */
  zip: string;
  /** Enlace firmado para darse de baja. */
  urlBaja: string;
};

const SITIO = "https://www.judomarketing.net";
const DIRECCION = "66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130";
const TELEFONO = "+1 305 934 9981";

const TEXTOS = {
  es: {
    agenda: "Agenda una llamada conmigo",
    trabajo: "Ver nuestro trabajo",
    cargo: "Director, Judo Marketing",
    ciudad: "Miami, Florida",
    porque: (negocio: string, zip: string) =>
      `Te escribo porque ${negocio} aparece en Google en la zona ${zip} y creo que podemos ayudarte.`,
    baja: "Si prefieres no recibir más correos míos, dímelo aquí",
    bajaFin: "y no vuelvo a escribirte.",
    rutaContacto: "/es/contacto",
    rutaShowcase: "/es/showcase",
  },
  en: {
    agenda: "Book a call with me",
    trabajo: "See our work",
    cargo: "Director, Judo Marketing",
    ciudad: "Miami, Florida",
    porque: (negocio: string, zip: string) =>
      `I'm writing because ${negocio} shows up on Google in the ${zip} area and I think we can help.`,
    baja: "If you'd rather not hear from me again, let me know here",
    bajaFin: "and I won't write again.",
    rutaContacto: "/contact",
    rutaShowcase: "/showcase",
  },
} as const;

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Enlaces de los botones, con UTM para saber en Analytics qué correo trajo la visita. */
export function enlacesProspecto(idioma: IdiomaCorreo, zip: string) {
  const t = TEXTOS[idioma];
  const utm = `utm_source=correo&utm_medium=prospeccion&utm_campaign=zip-${encodeURIComponent(zip)}`;
  return {
    contacto: `${SITIO}${t.rutaContacto}?${utm}#agendar`,
    showcase: `${SITIO}${t.rutaShowcase}?${utm}`,
  };
}

/** Versión en texto plano: la leen los clientes sin HTML y los filtros de spam la valoran. */
export function textoProspecto(c: CorreoProspecto): string {
  const t = TEXTOS[c.idioma];
  const enlaces = enlacesProspecto(c.idioma, c.zip);
  const lineas = [
    c.saludo,
    "",
    ...c.parrafos.flatMap((p) => [p, ""]),
    ...(c.ps ? [`PS: ${c.ps}`, ""] : []),
    `${t.agenda}: ${enlaces.contacto}`,
    `${t.trabajo}: ${enlaces.showcase}`,
    "",
    "Junior Osorio",
    t.cargo,
    `${SITIO} · ${TELEFONO}`,
    "",
    t.porque(c.negocio, c.zip),
    `${t.baja}: ${c.urlBaja}`,
    `Judo Marketing · ${DIRECCION}`,
  ];
  return lineas.join("\n");
}

export function htmlProspecto(c: CorreoProspecto): string {
  const t = TEXTOS[c.idioma];
  const enlaces = enlacesProspecto(c.idioma, c.zip);
  const parrafos = c.parrafos
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#e4e4ec;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${escapar(p)}</p>`
    )
    .join("");
  const ps = c.ps
    ? `<p style="margin:18px 0 0;color:#b9b9c8;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;"><strong style="color:#e4e4ec;">PS:</strong> ${escapar(c.ps)}</p>`
    : "";
  // Lo primero que el cliente de correo enseña junto al asunto, sin abrir el
  // mensaje. Va oculto en el cuerpo.
  const preheader = escapar(c.parrafos[0] ?? "").slice(0, 140);

  return `<!doctype html>
<html lang="${c.idioma}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Judo Marketing</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0b12;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0b0b12;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0b12" style="background-color:#0b0b12;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

        <!-- Cabecera: logo y nombre -->
        <tr>
          <td style="padding:0 6px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <a href="${SITIO}" style="text-decoration:none;">
                    <img src="${SITIO}/brand/logo-white-transparent.png" width="44" height="44" alt="Judo Marketing" style="display:block;border:0;" />
                  </a>
                </td>
                <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;">
                  <span style="display:block;color:#f5f5f7;font-size:16px;font-weight:bold;letter-spacing:0.2px;">Judo Marketing</span>
                  <span style="display:block;color:#8a8a9c;font-size:12px;">Build Trust, Create Value</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Tarjeta -->
        <tr>
          <td bgcolor="#11111a" style="background-color:#11111a;border:1px solid #2c2444;border-radius:18px;padding:34px 30px 30px;">
            <p style="margin:0 0 18px;color:#f5f5f7;font-size:17px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">${escapar(c.saludo)}</p>
            ${parrafos}
            ${ps}

            <!-- Botones -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
              <tr>
                <td bgcolor="#7b2dff" style="background-color:#7b2dff;border-radius:999px;">
                  <a href="${enlaces.contacto}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${t.agenda}</a>
                </td>
                <td style="width:12px;"></td>
                <td style="border:1px solid #a855f7;border-radius:999px;">
                  <a href="${enlaces.showcase}" style="display:inline-block;padding:12px 24px;color:#d9b8ff;font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${t.trabajo}</a>
                </td>
              </tr>
            </table>

            <!-- Firma -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;border-top:1px solid #26263a;width:100%;">
              <tr>
                <td style="padding-top:20px;font-family:Arial,Helvetica,sans-serif;">
                  <span style="display:block;color:#f5f5f7;font-size:15px;font-weight:bold;">Junior Osorio</span>
                  <span style="display:block;color:#a855f7;font-size:13px;margin-top:2px;">${t.cargo}</span>
                  <span style="display:block;color:#8a8a9c;font-size:13px;margin-top:6px;">
                    <a href="${SITIO}" style="color:#c9c9d4;text-decoration:none;">www.judomarketing.net</a>
                    &nbsp;·&nbsp; <a href="tel:+13059349981" style="color:#c9c9d4;text-decoration:none;">${TELEFONO}</a>
                    &nbsp;·&nbsp; ${t.ciudad}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Pie: por qué recibes esto, baja y dirección -->
        <tr>
          <td style="padding:22px 10px 0;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 8px;color:#6b6b7a;font-size:12px;line-height:1.6;">
              ${escapar(t.porque(c.negocio, c.zip))}
              ${t.baja.replace(/dímelo aquí|let me know here/, (m) => `<a href="${c.urlBaja}" style="color:#a855f7;text-decoration:underline;">${m}</a>`)} ${t.bajaFin}
            </p>
            <p style="margin:0;color:#55556a;font-size:11px;line-height:1.6;">Judo Marketing · ${DIRECCION}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
