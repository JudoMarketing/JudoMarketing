// Revisión de los textos de una pieza (un cuadro de video o una lámina de
// carrusel), dentro del navegador. La usan revisar.mjs de las dos skills con
// page.addScriptTag({ path }) y después window.revisarTextos(raiz, opciones).
// Devuelve { problemas: [texto], legibles: [{ txt, palabras }] }.
//
// Opciones:
//   zonas:   [{ l, t, r, b, motivo }] en píxeles: franjas donde no va texto
//   minPx:   letra mínima (24 en video, 28 en carrusel)
//   otros:   selector de lo que no se debe tapar con texto
//   grupos:  selector de composiciones donde encimar es a propósito
//   ignorar: selector de bloques que no se revisan (créditos, la pantalla del teléfono)
// Lo que lleva la clase .encima (un sello, un total) puede ir sobre otras cosas.
window.revisarTextos = function (raiz, op) {
  const R = raiz.getBoundingClientRect();
  const W = R.width, H = R.height;
  const opacidad = (el) => {
    let o = 1;
    for (let n = el; n && n !== raiz.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  };
  // Un rectángulo recortado por los antepasados con overflow oculto
  const recortar = (el, r) => {
    let c = { l: r.left, t: r.top, r: r.right, b: r.bottom };
    for (let n = el.parentElement; n && n !== raiz.parentElement; n = n.parentElement) {
      if (getComputedStyle(n).overflow === "visible") continue;
      const a = n.getBoundingClientRect();
      c = { l: Math.max(c.l, a.left), t: Math.max(c.t, a.top), r: Math.min(c.r, a.right), b: Math.min(c.b, a.bottom) };
    }
    return c.r > c.l && c.b > c.t ? { l: c.l - R.left, t: c.t - R.top, r: c.r - R.left, b: c.b - R.top } : null;
  };
  const lineasDe = (el) => {
    const rg = document.createRange(); rg.selectNodeContents(el);
    return [...rg.getClientRects()].filter((x) => x.width > 1 && x.height > 1).map((x) => recortar(el, x)).filter(Boolean);
  };
  const union = (rs) => rs.length && { l: Math.min(...rs.map((x) => x.l)), t: Math.min(...rs.map((x) => x.t)), r: Math.max(...rs.map((x) => x.r)), b: Math.max(...rs.map((x) => x.b)) };
  const area = (x) => Math.max(0, x.r - x.l) * Math.max(0, x.b - x.t);
  const inter = (a, c) => area({ l: Math.max(a.l, c.l), t: Math.max(a.t, c.t), r: Math.min(a.r, c.r), b: Math.min(a.b, c.b) });
  // Cuánto de lo más chico queda debajo de lo otro (0 a 1)
  const choca = (ls, c) => { const s = ls.reduce((t, l) => t + inter(l, c), 0); return s / Math.max(1, Math.min(ls.reduce((t, l) => t + area(l), 0), area(c))); };
  const corto = (el) => { const t = el.textContent.trim().replace(/\s+/g, " "); return `«${t.slice(0, 40)}${t.length > 40 ? "…" : ""}»`; };

  // Cualquier color CSS (oklab, color-mix…) a RGB, a través de un canvas
  const lienzo = document.createElement("canvas"); lienzo.width = lienzo.height = 1;
  const cx = lienzo.getContext("2d", { willReadFrequently: true });
  const rgba = (color) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = color; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data]; };
  const lum = (c) => { const [r, g, b] = rgba(c).slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contraste = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const fondoDe = (el) => {
    const propia = el.getBoundingClientRect();
    for (let n = el; n && n !== raiz.parentElement; n = n.parentElement) {
      // Un antepasado solo es el fondo si el texto cae dentro de él (una etiqueta puede salirse de su nodo)
      if (n !== el && n !== raiz) {
        const a = n.getBoundingClientRect();
        const dentro = inter({ l: propia.left, t: propia.top, r: propia.right, b: propia.bottom }, { l: a.left, t: a.top, r: a.right, b: a.bottom });
        if (dentro < area({ l: propia.left, t: propia.top, r: propia.right, b: propia.bottom }) * 0.5) continue;
      }
      const cs = getComputedStyle(n);
      if (rgba(cs.backgroundColor)[3] > 150 && !/rgba?\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) return { color: cs.backgroundColor, solido: n !== raiz };
      // Un degradado o una imagen de fondo no se puede medir con un color
      if (n !== raiz && cs.backgroundImage !== "none") return { color: null, solido: true };
    }
    return { color: getComputedStyle(raiz).getPropertyValue("--fondo").trim() || "#000", solido: false };
  };

  const bloque = (el) => { for (let n = el; n && n !== raiz; n = n.parentElement) if (!getComputedStyle(n).display.startsWith("inline")) return n; return el; };
  const hojas = [...raiz.querySelectorAll("*")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const bloques = [...new Set(hojas.map(bloque))].filter((el) => opacidad(el) > 0.6 && !(op.ignorar && el.closest(op.ignorar)));
  const otros = op.otros ? [...raiz.querySelectorAll(op.otros)].filter((o) => opacidad(o) > 0.5) : [];
  const fotos = [...raiz.querySelectorAll(".foto, .secuencia, .foto-fondo")].filter((f) => opacidad(f) > 0.5).map((f) => recortar(f, f.getBoundingClientRect())).filter(Boolean);
  const grupo = (x) => (op.grupos ? x.closest(op.grupos) : null);
  // .encima marca lo que va encima de otra cosa a propósito (un sello, un total que cae sobre la pila)
  const encima = (x) => Boolean(x.closest(".encima"));
  const problemas = [], legibles = [], hechos = [];

  for (const el of bloques) {
    const ls = lineasDe(el);
    if (!ls.length) continue;
    const c = union(ls);
    const propias = hojas.filter((h) => bloque(h) === el);
    const tamanos = propias.map((h) => parseFloat(getComputedStyle(h).fontSize));
    const px = Math.max(...tamanos, 1), pxMin = Math.min(...tamanos);
    const txt = el.textContent.trim().replace(/\s+/g, " ");
    legibles.push({ txt, palabras: txt.split(" ").length });
    hechos.push({ el, ls });

    // Las palabras de este bloque (sin las de sus bloques hijos), por línea
    const palabras = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (bloque(n.parentElement) !== el) continue;
      for (const m of n.textContent.matchAll(/\S+/g)) {
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const rr = rg.getBoundingClientRect();
        if (rr.width > 0) palabras.push({ w: m[0], y: rr.top + rr.height / 2 });
      }
    }
    const lineas = [];
    for (const w of palabras) {
      const l = lineas.find((x) => Math.abs(x.y - w.y) < px * 0.45);
      if (l) l.ws.push(w.w); else lineas.push({ y: w.y, ws: [w.w] });
    }
    lineas.sort((a, b) => a.y - b.y);
    const ultima = lineas.at(-1);
    if (lineas.length >= 2 && ultima.ws.length === 1 && palabras.length >= 4 && /[\p{L}\p{N}]/u.test(ultima.ws[0]))
      problemas.push(`${corto(el)}: «${ultima.ws[0]}» queda sola en la última línea`);
    for (const hl of el.querySelectorAll(".hl")) {
      if (bloque(hl) !== el) continue;
      const filas = new Set([...hl.getClientRects()].filter((x) => x.width > 2).map((x) => Math.round(x.top / (px * 0.5))));
      if (filas.size > 1) problemas.push(`${corto(el)}: el resaltado ${corto(hl)} se parte en dos líneas`);
    }
    if (c.l < -1 || c.t < -1 || c.r > W + 1 || c.b > H + 1) problemas.push(`${corto(el)}: se sale de la pieza`);
    for (const z of op.zonas || []) if (choca(ls, z) > 0.05) problemas.push(`${corto(el)}: ${z.motivo}`);
    if (pxMin < (op.minPx || 24)) problemas.push(`${corto(el)}: letra de ${Math.round(pxMin)} px, chica para un teléfono (mínimo ${op.minPx || 24})`);

    const fondo = fondoDe(el);
    const cs = getComputedStyle(el);
    if (!fondo.solido && fotos.some((f) => choca(ls, f) > 0.2)) {
      if (!raiz.querySelector(".velo")) problemas.push(`${corto(el)}: está sobre una foto sin velo`);
    } else {
      const k = fondo.color ? contraste(cs.color, fondo.color) : 99;
      const grande = px >= 48 && Number(cs.fontWeight) >= 700;
      if (k < (grande ? 3 : 4.5)) problemas.push(`${corto(el)}: contraste ${k.toFixed(2)}:1 (mínimo ${grande ? 3 : 4.5}:1)`);
    }
    for (const hl of el.querySelectorAll(".hl")) {
      const h = getComputedStyle(hl);
      const k = contraste(h.color, h.backgroundColor);
      if (k < 4.5) problemas.push(`${corto(hl)}: contraste del resaltado ${k.toFixed(2)}:1 (mínimo 4,5:1)`);
    }
    for (const o of otros) {
      if (o.contains(el) || el.contains(o) || (grupo(el) && grupo(el) === grupo(o)) || encima(el) || encima(o)) continue;
      const r = recortar(o, o.getBoundingClientRect());
      if (r && choca(ls, r) > 0.12) problemas.push(`${corto(el)}: se monta sobre ${o.alt ? `la imagen «${o.alt}»` : "." + String(o.className).split(" ")[0]}`);
    }
  }
  for (let i = 0; i < hechos.length; i++) for (let j = i + 1; j < hechos.length; j++) {
    const a = hechos[i], b = hechos[j];
    if (a.el.contains(b.el) || b.el.contains(a.el) || (grupo(a.el) && grupo(a.el) === grupo(b.el)) || encima(a.el) || encima(b.el)) continue;
    if (b.ls.some((l) => choca(a.ls, l) > 0.12)) problemas.push(`${corto(a.el)} y ${corto(b.el)} se enciman`);
  }
  return { problemas, legibles };
};
