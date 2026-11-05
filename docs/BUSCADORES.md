# Google, Bing y los buscadores de IA

Lo que hemos hecho para que nuestros sitios aparezcan en Google, en Bing y en
las respuestas de ChatGPT, Claude, Perplexity y Copilot. También dónde está
cada sitio hoy y lo que viene de fábrica en todo website nuevo. Junior lo pidió
el 5 de noviembre de 2026; la regla corta está en CEREBRO, sección 11.

## Cómo nos encuentra cada uno

| Quién | Con qué lee el sitio | Lo que necesita de nosotros |
| --- | --- | --- |
| **Google** (resultados, AI Overviews y AI Mode) | Googlebot, que sí ejecuta JavaScript | Página indexable y con fragmento. No pide nada especial para AI Overviews. El `Google-Extended` del robots.txt solo decide si Gemini entrena con el sitio, no si salimos en Google. |
| **Bing** (y con su índice Copilot, DuckDuckGo, Yahoo y Ecosia) | Bingbot | Sitemap en Bing Webmaster Tools y aviso por IndexNow cuando algo cambia. Bing Webmaster ya enseña cuándo Copilot cita una página (informe «AI Performance»). |
| **ChatGPT** (búsqueda) | OAI-SearchBot. GPTBot es solo para entrenar. | Que robots.txt deje entrar a OAI-SearchBot y que el texto esté en el HTML. |
| **Claude** | Claude-SearchBot (búsqueda) y Claude-User (cuando alguien pide leer una página). ClaudeBot es solo para entrenar. | Lo mismo. |
| **Perplexity** | PerplexityBot | Lo mismo. |

**Lo que más pesa para la IA: los robots de IA no ejecutan JavaScript.**
GPTBot, OAI-SearchBot y ClaudeBot leen el HTML tal como llega del servidor.
Un sitio que arma su contenido en el navegador (React sin servidor, Expo web,
una portada hecha con `<canvas>`) les llega vacío. Para ellos ese negocio no
existe, aunque en Google salga bien.

**`llms.txt` es un extra, no el camino.** Google dijo que no lo usa, y ningún
buscador grande se comprometió a leerlo. Lo ponemos porque cuesta poco. Lo
que nos mete en las respuestas de la IA es el HTML del servidor, un
robots.txt que los deja entrar y datos claros del negocio.

## Lo que ya estaba hecho (antes del 5 de noviembre)

**En judomarketing.net:**
- **Datos estructurados** (`src/components/JsonLd.tsx`):
  - ProfessionalService con dirección, teléfono, precios y servicios;
  - WebSite con la marca;
  - SoftwareApplication para JuditoADS;
  - FAQPage en servicios.
- **Título, descripción, canónica y hreflang** propios en cada página
  (`src/lib/seo.ts`). Las páginas privadas llevan `noindex`.
- **Sitemap bilingüe con hreflang** y robots.txt que solo cierra lo privado.
- **IndexNow** (`src/lib/indexnow.ts`, con la clave en `public/`): el botón
  «📡 Avisar ahora» del portal y `node scripts/bing/indexar.mjs`.
  - **Ojo:** los dos avisan solo por las páginas de judomarketing.net, no por
    las de los clientes.
- **Search Console verificado**, con el sitemap enviado. El portal lee clics e
  impresiones de cada sitio conectado (`docs/google-conexion.md`).
- **Perfil de Empresa de Google**, Instagram y Facebook conectados al schema
  (`sameAs`). La estrategia de palabras clave está en `docs/SEO.md`.
- **La auditoría de los lunes** mide Lighthouse, rastrea el SEO técnico y busca
  la marca en Google y Bing.

**En la plantilla JudiWEB:**
- metadatos por página e idioma;
- sitemap con hreflang;
- JSON-LD del negocio y de las preguntas frecuentes;
- imagen para compartir;
- robots.txt que cierra los previews y los sitios sin dominio puesto.

**En los clientes,** cada uno por su lado: JSON-LD de su rubro en Denali,
Zanoah, Melanie, The Notes, RBT Corner, HR Gutters y Delivery Rush, entre
otros, y `llms.txt` en Zanoah, Delivery Rush y HR Gutters.

**Lo que falta del lado de Junior** (sale cada lunes en la auditoría desde el
25 de septiembre):
- **Bing Webmaster Tools para judomarketing.net.** Se da de alta en un clic con
  «Importar desde Google Search Console». https://www.bing.com/webmasters
- **Solicitar la indexación de las 16 páginas** en Search Console.
  https://search.google.com/search-console
- **Área de servicio y reseñas** en el Perfil de Google.

## Lo que viene de fábrica desde el 5 de noviembre

En la plantilla JudiWEB (`README.md`, «Search engines and AI») y en
`PROMPT-WEBSITE-NUEVO.md`:

1. **HTML del servidor** (Next App Router): el texto del negocio está en la
   página aunque no corra JavaScript.
2. **robots.txt que deja entrar a todos los buscadores:** Google, Bing,
   ChatGPT, Claude y Perplexity.
   - No dejar entrenar a la IA es una opción aparte
     (`site.search.blockAiTraining`), que no saca al sitio de sus búsquedas.
   - Previews y sitios sin dominio siguen cerrados.
3. **Sitemap con hreflang,** con todas las páginas en todos los idiomas.
4. **Título, descripción, canónica, hreflang e imagen para compartir** en cada
   página y cada idioma.
5. **JSON-LD del negocio, WebSite** (el nombre que Google enseña arriba del
   resultado) **y FAQPage.**
6. **Verificación de Search Console y Bing** por etiqueta, si no se hizo por
   DNS: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` y
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
7. **IndexNow propio de cada sitio:**
   - `npm run buscadores:clave` una vez (deja `public/<clave>.txt`);
   - `npm run buscadores:avisar` después de publicar algo que cambió.
8. **`/llms.txt`,** generado del mismo config y diccionario que la página.
9. **Lo del teléfono:** campos a 16 px y cada página empieza arriba (CEREBRO,
   sección 3).

**Al lanzar, a mano** (una vez por sitio):
- Search Console con propiedad de dominio y el sitemap enviado.
- Bing Webmaster con «Importar desde Search Console».
- `npm run buscadores:avisar`.
- Perfil de Empresa de Google si el negocio atiende en un lugar, con el mismo
  nombre, teléfono y dirección del sitio.

**La prueba:** `node scripts/auditoria/buscadores.mjs <dominio>`. Mide desde
afuera, como un buscador:
- la portada sin JavaScript;
- el robots.txt para cada robot;
- el sitemap;
- si los robots de IA reciben la página (un 403 suele ser el cortafuegos);
- www contra sin www;
- `llms.txt`.

La auditoría de los lunes la corre en todos los sitios.

## Dónde está cada sitio (medido el 5 de noviembre de 2026)

«Palabras sin JS» es lo que lee un robot de IA en la portada. Menos de 120 es
casi nada. Los tres robots de IA (OAI-SearchBot, Claude-SearchBot y
PerplexityBot) recibieron la página en todos los sitios que responden:
ningún cortafuegos los bloquea.

**Con dominio propio:**

| Sitio | Palabras sin JS | Datos estructurados | Sitemap | Lo que falta |
| --- | --- | --- | --- | --- |
| judomarketing.net | 403 | Negocio, WebSite, App | 16, con hreflang | Bing Webmaster y la indexación en Search Console (Junior). `llms.txt` desde hoy. |
| abaforhappiness.com | 1.048 | **ninguno** | 14, sin hreflang | El JSON-LD del negocio y el hreflang en el sitemap. |
| accustomsmiami.com | — | — | — | El dominio da 404: no está conectado. |
| dameunamano.org | 755 | Organización, WebSite | 20, con hreflang | Nada. |
| denalibehaviorcrt.com | 1.190 | Clínica, WebSite | 52, con hreflang | Nada. |
| deliveryrushflorida.com | 435 | Negocio, FAQ | 4 | Nada (no deja entrenar a la IA: decisión del dueño). |
| godshome.app | **21** | WebSite | 6, con hreflang | La portada es una animación en `<canvas>`: la IA no sabe de qué trata. |
| judimental.com | **21** | App | 2 | Es Expo web: todo sale con JavaScript. Necesita una portada en HTML. |
| johanmorenotailor.com | **26** | Sastrería | 7 | **La IA ve una página vacía** (`<div id="root">`, React sin servidor) y no hay h1. |
| juniorosorio.com | 155 | ninguno | **no** | Canónica, imagen para compartir, robots.txt y sitemap. |
| melanieosorio.com | 1.449 | Salón, FAQ | 25 | Canónica e imagen para compartir en la portada. |
| pachypinchos.com | 97 | WebSite | 3 | Es de Hostinger Website Builder, no código nuestro. |
| paradiseranch22.com | **42** | **ninguno** | 1 | Casi sin texto en el HTML, sin h1 ni JSON-LD, y **paradiseranch22.com (sin www) no redirige**: Google ve dos sitios. |
| rbtcorner.com | 1.115 | Escuela, WebSite | 24, sin hreflang | El hreflang en el sitemap. |
| thenotes.net | 2.145 | Organización, WebSite, servicio, FAQ | 7 | Nada. |
| vanventuremia.com | 58 | Negocio | 7 | La portada es una puerta (Día o Noche) con muy poco texto. |
| zanoah.shop | 608 | Panadería, WebSite, FAQ, catálogo | 7 | **www.zanoah.shop no redirige** a zanoah.shop: Google ve dos sitios. |

**Sin dominio propio** (en `vercel.app` o en GitHub Pages). Un `noindex` aquí
puede ser a propósito, si el sitio todavía no se lanza:

| Sitio | Lo que encontró la prueba |
| --- | --- |
| maybayker.vercel.app | **noindex y robots.txt que cierra todo:** no sale en ningún buscador. |
| the-equipment-source.vercel.app | **noindex y robots.txt que cierra todo.** Sin descripción, canónica ni JSON-LD. |
| sofla-contractors.vercel.app | **noindex.** Sin robots.txt, sitemap, canónica ni JSON-LD. |
| milcoloresapp.vercel.app | **noindex.** 53 palabras sin JS, sin robots.txt ni sitemap. |
| art-foundation.vercel.app | robots.txt y sitemap dan **error 500**. Sin JSON-LD ni imagen para compartir. |
| mr-naples-hauling-llc.vercel.app | Sin robots.txt, sitemap, canónica ni JSON-LD. |
| hr-gutters.vercel.app | Falta la imagen para compartir. Lo demás, completo (con `llms.txt`). |
| pachy-pinchos.vercel.app | Sin JSON-LD. |
| math-games.vercel.app | Casi todo: descripción, canónica, JSON-LD, robots.txt. 78 palabras sin JS. |
| GeraldMarket (GitHub Pages) | Sin JSON-LD ni sitemap. Está fuera del showcase. |
| athena-beauty.vercel.app | Da 503: está en pausa. |

Nadie lleva la etiqueta de verificación de Bing en el HTML. Desde afuera no se
puede saber si están verificados por DNS o importados de Search Console. Eso
se ve en Bing Webmaster.

## Cómo se vuelve a medir

```bash
node scripts/auditoria/buscadores.mjs                        # todos los de scripts/seguridad/sitios.txt
node scripts/auditoria/buscadores.mjs www.judomarketing.net  # uno
```

## De dónde sale cada dato (5 de noviembre de 2026)

- Robots de OpenAI y para qué sirve cada uno:
  https://developers.openai.com/api/docs/bots
- Robots de Anthropic: https://support.claude.com/en/articles/8896518-anthropic-crawlers
- Robots de Perplexity: https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md
- Google y las funciones de IA: https://developers.google.com/search/docs/appearance/ai-features
- Los robots de IA no ejecutan JavaScript (análisis de Vercel y MERJ):
  https://vercel.com/blog/the-rise-of-the-ai-crawler
- Google y `llms.txt`: https://seroundtable.com/google-llms-txt-files-hurt-help-41512.html
- El informe de IA de Bing Webmaster Tools:
  https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- El bloqueo de robots de IA en Vercel viene apagado:
  https://vercel.com/docs/security/vercel-waf/managed-rulesets
