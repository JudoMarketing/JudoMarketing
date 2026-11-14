# El mapa del sistema de Judo Marketing

Para encontrar algo sin leer todo el repositorio. Se abre solo la fila que
hace falta. Si algo se mueve o nace, se actualiza aquí el mismo día.

## Lo que manda (leer antes de decidir)

| Qué | Dónde |
| --- | --- |
| Las decisiones de Junior (precios, tono, qué no se dice) | `docs/vendito/decisiones.md` |
| Los briefs de cada pieza, con su feedback y versión | `docs/vendito/briefs/` |
| Los precios de Estados Unidos (única fuente) | `src/content/pricing.json` |
| Las reglas de la casa y los errores que no se repiten | `docs/CEREBRO.md` (sección 10 antes de tocar git, Vercel, claves o videos) |
| La estrategia y la meta de $10,000 al mes | `docs/ESTRATEGIA.md` |
| La marca de Judo (colores, letra) | `docs/BRAND.md` |
| A quién se le pide cada cambio (qué chat, qué repo) | `docs/QUIEN-HACE-QUE.md` |

## El contenido de marketing

| Qué | Dónde |
| --- | --- |
| La Biblioteca Judo (todo lo terminado, los pedidos de Junior) | Artifact `https://claude.ai/artifact/4KiYxCkFTvDfuuQayTYJYr`; cómo se sube, `docs/BIBLIOTECA.md` |
| Los videos (cada uno en su carpeta, con `armar.py`) | `scripts/video/` (`judo-phone-off-en` es «Count your yeses») |
| Los carruseles | `scripts/carrusel/` |
| La fábrica de videos | skill `judo-video-vertical` (`.claude/skills/`) |
| La fábrica de carruseles | skill `judo-carrusel` |
| Lo compartido entre las dos skills (reglas, nichos, marcas) | `scripts/skills/compartido/`; se copia con `python3 scripts/skills/empacar.py` |
| El guion de ventas (PDF interno) | `scripts/generate_guion_ventas.py` → `docs/legal/Guion_de_Ventas.pdf` |
| Los PDF de Latinoamérica (kit del vendedor y planes) | En la Biblioteca. No van al repo: el repo es público |

## El sitio judomarketing.net (producción: rama `master`, Vercel)

| Qué | Dónde |
| --- | --- |
| Textos en español e inglés | `messages/es.json`, `messages/en.json` |
| Páginas | `src/app/[locale]/` (servicios, diagnóstico, pago, salud mental, showcase) |
| El cobro con Stripe | `src/app/api/checkout/route.ts` |
| Los contratos que salen del portal | `src/content/documentos.ts` |
| La política de servicio | `docs/legal/service-policy.md` (maestro) y `src/content/service-policy.ts` |
| El chatbot del sitio | `src/content/chatbot.ts` |
| SEO, sitemap, JSON-LD | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/components/JsonLd.tsx` |
| La prospección por correo | `docs/LEADS.md`, `src/lib/leads.ts`, `scripts/leads/` |
| Las auditorías semanales del sitio | `docs/AUDITORIA-RUTINA.md`, `docs/auditorias/` |

## Pruebas que se corren antes de entregar

| Prueba | Comando |
| --- | --- |
| Teléfono (390 y 360 px, zoom, desborde) | `node scripts/auditoria/movil.mjs <sitio>` |
| Buscadores e IA | `node scripts/auditoria/buscadores.mjs <sitio>` |
| Firma «Site built by Judo Marketing» | `node scripts/auditoria/firma.mjs` |
| Textos de un video o carrusel | `node revisar.mjs` en su carpeta |
| La voz de un video contra sus escenas | `python3 calzar-voz.py voz.json --guion` y `python3 ../borrador-voz.py voz.json` |
| Un video con escenas de Junior a cámara (guía para grabar y cómo se montan) | `scripts/video/judo-detras-pantalla-en/guion-camara.md` y `docs/BIBLIOTECA.md`, «Las tomas de Junior a cámara» |
| El guion de ElevenLabs por clips (tabla con segundo, largo y archivo) | `python3 guion-clips.py voz.json` (en `scripts/video/judo-phone-off-en/`; se copia a la carpeta del video nuevo) |

## Herramientas que no están en el repo

- **Vercel:** proyecto `judo-marketing` (equipo `judomarketing`). El build
  restaura su caché: si una página nueva sale sin estilos, se cambia la
  «Versión del caché de build» de `next.config.ts`.
- **Stripe:** cobra el sitio (planes, pago anual, diagnóstico).
- **ElevenLabs:** la voz clonada de Junior. Se genera desde su cuenta; Vendito
  le da el guion por clips.
- **Meta (Facebook e Instagram):** donde corren los anuncios de los clientes.
