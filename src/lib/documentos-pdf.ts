// El PDF de un contrato, armado en el momento de enviarlo.
//
// Se hace con pdf-lib y las fuentes estándar del PDF (Helvetica y Times),
// que no hay que embeber y aceptan todo el español (acentos, ñ, ¿¡). Nada de
// Python aquí: esto corre en el servidor de Vercel al pulsar «Enviar».
//
// Sale ya firmado por Judo Marketing. La firma es electrónica: nombre, cargo,
// fecha y el código único del documento, con el trazo del nombre en cursiva.
// Cuando el cliente acepta desde su enlace, se vuelve a generar con su bloque
// de aceptación (nombre, fecha, hora, IP) y esa es la versión definitiva.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { FIRMANTE, type Documento } from "@/content/documentos";

export type Aceptacion = {
  nombre: string;
  /** dd/mm/aaaa hh:mm, ya en Eastern. */
  cuando: string;
  ip: string;
};

// Carta (Miami), en puntos
const ANCHO = 612;
const ALTO = 792;
const MARGEN = 56;
const ANCHO_TEXTO = ANCHO - MARGEN * 2;

const MORADO = rgb(0.48, 0.18, 1);
const TINTA = rgb(0.1, 0.1, 0.14);
const GRIS = rgb(0.45, 0.45, 0.5);
const LINEA = rgb(0.85, 0.84, 0.9);

/** Parte un párrafo en líneas que quepan en el ancho, midiendo con la fuente. */
function envolver(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) {
        linea = prueba;
      } else {
        if (linea) lineas.push(linea);
        linea = palabra;
      }
    }
    lineas.push(linea);
  }
  return lineas;
}

/**
 * Las fuentes estándar solo saben WinAnsi. Casi todo el español entra; lo que
 * no (flechas, palomitas, comillas raras) se cambia por algo equivalente en
 * vez de reventar el PDF entero por un carácter.
 */
function sanear(texto: string): string {
  return texto
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, "->")
    .replace(/✓|✔/g, "OK")
    .replace(/[^\x00-\xFF–—•…€]/g, "?");
}

type Lienzo = {
  doc: PDFDocument;
  pagina: PDFPage;
  y: number;
  normal: PDFFont;
  negrita: PDFFont;
  cursiva: PDFFont;
  titulo: string;
  codigo: string;
  numero: number;
};

function nuevaPagina(l: Lienzo): void {
  l.pagina = l.doc.addPage([ANCHO, ALTO]);
  l.numero += 1;
  // Cabecera fina en cada página: marca a la izquierda, código a la derecha.
  l.pagina.drawText("JUDO MARKETING", {
    x: MARGEN,
    y: ALTO - 34,
    size: 8,
    font: l.negrita,
    color: MORADO,
  });
  const derecha = sanear(`${l.titulo}  ·  ${l.codigo}`);
  l.pagina.drawText(derecha, {
    x: ANCHO - MARGEN - l.normal.widthOfTextAtSize(derecha, 8),
    y: ALTO - 34,
    size: 8,
    font: l.normal,
    color: GRIS,
  });
  l.pagina.drawLine({
    start: { x: MARGEN, y: ALTO - 42 },
    end: { x: ANCHO - MARGEN, y: ALTO - 42 },
    thickness: 0.5,
    color: LINEA,
  });
  l.y = ALTO - 66;
}

function pie(l: Lienzo, total: number): void {
  for (let i = 0; i < l.doc.getPageCount(); i++) {
    const p = l.doc.getPage(i);
    const texto = sanear(`${FIRMANTE.empresa} · ${FIRMANTE.direccion} · ${FIRMANTE.web}`);
    p.drawText(texto, { x: MARGEN, y: 30, size: 7, font: l.normal, color: GRIS });
    const num = `${i + 1} / ${total}`;
    p.drawText(num, {
      x: ANCHO - MARGEN - l.normal.widthOfTextAtSize(num, 7),
      y: 30,
      size: 7,
      font: l.normal,
      color: GRIS,
    });
  }
}

/** Baja el cursor; si no cabe lo que viene, abre página nueva. */
function asegurar(l: Lienzo, alto: number): void {
  if (l.y - alto < MARGEN + 20) nuevaPagina(l);
}

function parrafo(
  l: Lienzo,
  texto: string,
  opciones: { fuente?: PDFFont; tam?: number; color?: ReturnType<typeof rgb>; x?: number; ancho?: number; despues?: number } = {}
): void {
  const fuente = opciones.fuente ?? l.normal;
  const tam = opciones.tam ?? 9.5;
  const interlinea = tam * 1.42;
  const x = opciones.x ?? MARGEN;
  const ancho = opciones.ancho ?? ANCHO_TEXTO;
  const lineas = envolver(sanear(texto), fuente, tam, ancho);
  for (const linea of lineas) {
    asegurar(l, interlinea);
    l.pagina.drawText(linea, { x, y: l.y, size: tam, font: fuente, color: opciones.color ?? TINTA });
    l.y -= interlinea;
  }
  l.y -= opciones.despues ?? tam * 0.6;
}

/**
 * Un párrafo cuyo arranque va en negrita hasta el primer punto: es como
 * están escritas las cláusulas ("Garantía de entrega de 30 días. Si...").
 * Si el párrafo no tiene esa forma, va normal.
 */
function clausula(l: Lienzo, texto: string): void {
  const m = texto.match(/^([^.]{3,70}\.)\s+([\s\S]+)$/);
  if (!m) return parrafo(l, texto);
  const [, cabeza, resto] = m;
  const tam = 9.5;
  const interlinea = tam * 1.42;
  // Se envuelve el texto completo, pero la primera línea se pinta en dos
  // tramos: cabeza en negrita, resto en normal.
  const anchoCabeza = l.negrita.widthOfTextAtSize(sanear(cabeza), tam);
  const lineasResto = envolver(sanear(resto), l.normal, tam, ANCHO_TEXTO - anchoCabeza - 4);
  asegurar(l, interlinea);
  l.pagina.drawText(sanear(cabeza), { x: MARGEN, y: l.y, size: tam, font: l.negrita, color: TINTA });
  l.pagina.drawText(lineasResto[0] ?? "", {
    x: MARGEN + anchoCabeza + 4,
    y: l.y,
    size: tam,
    font: l.normal,
    color: TINTA,
  });
  l.y -= interlinea;
  const cola = lineasResto.slice(1).join(" ");
  if (cola) {
    for (const linea of envolver(cola, l.normal, tam, ANCHO_TEXTO)) {
      asegurar(l, interlinea);
      l.pagina.drawText(linea, { x: MARGEN, y: l.y, size: tam, font: l.normal, color: TINTA });
      l.y -= interlinea;
    }
  }
  l.y -= tam * 0.6;
}

function tablaDatos(l: Lienzo, filas: [string, string][]): void {
  const tam = 9;
  const colEtiqueta = 130;
  for (const [etiqueta, valor] of filas) {
    const lineas = envolver(sanear(valor), l.normal, tam, ANCHO_TEXTO - colEtiqueta - 10);
    const alto = Math.max(1, lineas.length) * tam * 1.45 + 6;
    asegurar(l, alto);
    l.pagina.drawLine({
      start: { x: MARGEN, y: l.y + tam + 3 },
      end: { x: ANCHO - MARGEN, y: l.y + tam + 3 },
      thickness: 0.4,
      color: LINEA,
    });
    l.pagina.drawText(sanear(etiqueta), { x: MARGEN, y: l.y, size: tam, font: l.negrita, color: GRIS });
    let y = l.y;
    for (const linea of lineas) {
      l.pagina.drawText(linea, { x: MARGEN + colEtiqueta, y, size: tam, font: l.normal, color: TINTA });
      y -= tam * 1.45;
    }
    l.y -= alto;
  }
  l.y -= 10;
}

function bloqueFirma(
  l: Lienzo,
  x: number,
  ancho: number,
  titulo: string,
  lineas: { texto: string; fuente?: PDFFont; tam?: number; color?: ReturnType<typeof rgb> }[]
): void {
  let y = l.y;
  l.pagina.drawText(sanear(titulo), { x, y, size: 8, font: l.negrita, color: MORADO });
  y -= 30;
  for (const ln of lineas) {
    const fuente = ln.fuente ?? l.normal;
    const tam = ln.tam ?? 9;
    l.pagina.drawText(sanear(ln.texto), { x, y, size: tam, font: fuente, color: ln.color ?? TINTA });
    y -= tam * 1.5;
  }
  l.pagina.drawLine({
    start: { x, y: l.y - 16 },
    end: { x: x + ancho, y: l.y - 16 },
    thickness: 0.6,
    color: LINEA,
  });
}

export async function generarPdf(
  documento: Documento,
  codigo: string,
  fecha: string,
  aceptacion: Aceptacion | null
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${documento.titulo} · ${codigo}`);
  doc.setAuthor(FIRMANTE.empresa);
  doc.setSubject(documento.subtitulo);
  doc.setCreator("judomarketing.net");

  const l: Lienzo = {
    doc,
    pagina: null as unknown as PDFPage,
    y: 0,
    normal: await doc.embedFont(StandardFonts.Helvetica),
    negrita: await doc.embedFont(StandardFonts.HelveticaBold),
    cursiva: await doc.embedFont(StandardFonts.TimesRomanItalic),
    titulo: documento.titulo.replace(/^Acuerdo de servicio · /, ""),
    codigo,
    numero: 0,
  };
  nuevaPagina(l);

  // Portada del documento: título, subtítulo, estado
  parrafo(l, documento.titulo, { fuente: l.negrita, tam: 18, despues: 2 });
  parrafo(l, documento.subtitulo, { tam: 10, color: GRIS, despues: 6 });
  parrafo(
    l,
    aceptacion
      ? `Firmado por Judo Marketing el ${fecha} y aceptado por el cliente el ${aceptacion.cuando}.`
      : `Firmado por Judo Marketing el ${fecha}. Pendiente de aceptación del cliente.`,
    { fuente: l.negrita, tam: 9, color: aceptacion ? rgb(0.05, 0.5, 0.35) : MORADO, despues: 14 }
  );

  tablaDatos(l, documento.datos);

  for (const s of documento.secciones) {
    asegurar(l, 40);
    parrafo(l, s.titulo, { fuente: l.negrita, tam: 11.5, color: MORADO, despues: 3 });
    for (const p of s.parrafos) clausula(l, p);
    l.y -= 4;
  }

  // Firmas: siempre juntas, en una página con sitio
  asegurar(l, 150);
  l.y -= 6;
  parrafo(l, "Firmas", { fuente: l.negrita, tam: 11.5, color: MORADO, despues: 8 });
  const yFirmas = l.y;
  const anchoCol = (ANCHO_TEXTO - 24) / 2;

  bloqueFirma(l, MARGEN, anchoCol, "JUDO MARKETING", [
    { texto: FIRMANTE.nombre, fuente: l.cursiva, tam: 20, color: MORADO },
    { texto: FIRMANTE.nombre, fuente: l.negrita },
    { texto: FIRMANTE.cargo },
    { texto: `Firmado electrónicamente el ${fecha}`, color: GRIS },
    { texto: `Código de verificación: ${codigo}`, color: GRIS },
  ]);

  l.y = yFirmas;
  bloqueFirma(
    l,
    MARGEN + anchoCol + 24,
    anchoCol,
    "EL CLIENTE",
    aceptacion
      ? [
          { texto: aceptacion.nombre, fuente: l.cursiva, tam: 20, color: rgb(0.05, 0.5, 0.35) },
          { texto: aceptacion.nombre, fuente: l.negrita },
          { texto: `Aceptado electrónicamente el ${aceptacion.cuando} (hora del Este)`, color: GRIS },
          { texto: `Desde la dirección IP ${aceptacion.ip}`, color: GRIS },
          { texto: `Código de verificación: ${codigo}`, color: GRIS },
        ]
      : [
          { texto: "Pendiente de aceptación", fuente: l.cursiva, tam: 12, color: GRIS },
          { texto: "El cliente acepta desde el enlace que recibió por correo.", color: GRIS },
          { texto: "Al aceptar, este documento se vuelve a emitir con su nombre,", color: GRIS },
          { texto: "fecha, hora y dirección IP en este espacio.", color: GRIS },
        ]
  );
  l.y = yFirmas - 110;

  pie(l, doc.getPageCount());
  return doc.save();
}
