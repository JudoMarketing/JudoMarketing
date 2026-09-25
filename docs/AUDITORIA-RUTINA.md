# Auditoría semanal de judomarketing.net

Judo Marketing es la empresa madre: es la que mantiene vivo todo lo demás.
Por eso se audita a sí misma cada semana con las mismas herramientas que
usa contra los prospectos, y con la meta que Junior fijó el 25 de septiembre
de 2026: en uno o dos años, estar entre las mejores agencias de marketing.
Junior hace el trabajo con los clientes; la sesión automática cuida lo de
internet.

La línea base es `AUDITORIA-JUDO-MARKETING.md` (25 de septiembre de 2026):
notas por área, evidencia y el plan de 90 días. Cada semana se mide contra
eso y contra la semana anterior.

## Cuándo y cómo

Una rutina de Claude Code ("Auditoría semanal de Judo Marketing") corre los
lunes a las 7 de la mañana de Miami en una sesión nueva. Dura entre 20 y 40
minutos. Al terminar deja el informe en `docs/auditorias/AAAA-MM-DD.md`, lo
sube al repositorio y le manda a Junior un aviso con lo que depende de él.

## Lo que se mide, en orden

1. **Velocidad:** `bash scripts/auditoria/velocidad.sh <carpeta>`. Lighthouse
   móvil de las 8 páginas principales y escritorio de la portada. Se anota
   rendimiento, LCP, TBT, CLS, accesibilidad, SEO. Meta: 85 o más en móvil
   en todas; ninguna baja de la semana anterior en más de 5 puntos.
2. **SEO técnico:** `node scripts/auditoria/rastrear.mjs --salida <carpeta>/rastreo.json`.
   Títulos y descripciones (largo y que no se repitan), canónica, hreflang,
   un solo h1, imágenes sin alt, datos estructurados, enlaces externos
   rotos, redirecciones temporales (307) que deberían ser permanentes,
   páginas nuevas sin `og:image`. Comparar el número de páginas y el
   sitemap con la semana anterior.
3. **Google y Bing:** con WebSearch y WebFetch: `site:judomarketing.net` en
   Google (¿siguen saliendo títulos o URLs del sitio viejo?), la marca
   "Judo Marketing Miami" (¿salimos primero o salen clubes de judo?), y en
   Bing `https://www.bing.com/search?q=site%3Ajudomarketing.net`. Anotar
   cuántos resultados y si el título de la portada es el actual.
4. **Presencia y confianza:** la ficha de Google (`https://maps.google.com/?cid=17833491083157741838`,
   WebFetch; si no entrega datos, decirlo), reseñas visibles en la portada,
   y una búsqueda de "Judo Marketing" en Clutch, DesignRush, Yelp, LinkedIn
   para ver si ya existen las fichas del plan.
5. **Correo:** `https://dns.google/resolve?name=_dmarc.judomarketing.net&type=TXT`
   (¿sigue en `p=none`?), SPF y DKIM presentes.
6. **Seguridad y salud:** cabeceras (`curl -I`), `https://www.judomarketing.net/api/leads/cron`
   sin autorización responde 401 (no 500), `/sitemap.xml` y `/robots.txt`
   responden, `/favicon.ico` responde 200, `judomarketing.net` redirige a
   `www` con 308, certificado vigente.
7. **Contenido:** ¿se publicó algo nuevo esta semana (artículo, página de
   servicio, caso)? Contar páginas del sitemap. Si no hay nada nuevo en dos
   semanas seguidas, decirlo en el informe: el plan de contenido está en la
   sección 2.7 de la línea base.

## Lo que la sesión puede corregir sola

Solo cambios pequeños, mecánicos y sin decisión de diseño, y siempre con
`npx tsc --noEmit` y `npm run build` en verde antes de subir:

- Un título o descripción demasiado largo, corto o repetido.
- Una imagen sin `alt`, un enlace externo roto (quitar o apuntar al nuevo),
  una URL nueva que da 404 y tiene reemplazo claro (redirección permanente
  en `next.config.ts`).
- Una página nueva que falta en `sitemap.ts` o sin `og:image`.
- Un dato de contacto que no coincide entre pie, JSON-LD y página de
  contacto (se toma el del pie).
- Dependencias con vulnerabilidad crítica (`npm audit`) si la actualización
  es de parche.

Se sube en un solo commit al `master` con el mensaje "Auditoría semanal:
..." y la lista de lo tocado. Si el push falla por permisos, el informe lo
dice y Junior lo sube desde su chat.

## Lo que NO toca nunca

Textos de venta, precios, diseño, animaciones, el hero, la mascota,
contratos, la política, la prospección, variables de entorno, la base de
datos, ni nada que cambie cómo se ve el sitio. Eso se propone en el informe
con evidencia y lo decide Junior en su chat.

## El informe (`docs/auditorias/AAAA-MM-DD.md`)

En español, corto, en este orden:

1. **Tabla de la semana:** por página, rendimiento móvil de hoy y de la
   semana pasada; páginas indexadas en Google y Bing; reseñas visibles;
   DMARC; páginas del sitemap.
2. **Lo que se corrigió** (una línea por cambio, con el commit).
3. **Te toca a ti:** lo que solo Junior puede hacer, en orden de impacto,
   con el enlace exacto. Máximo cinco cosas. Lo que ya estaba pendiente la
   semana anterior y sigue pendiente se repite arriba, marcado "sigue
   pendiente desde el día X".
4. **Lo que se propone cambiar** (para que Junior lo pida en su chat):
   qué, por qué, qué se gana.
5. **Ojo:** algo que pueda morder (una caída de nota, un 404 nuevo, un
   dominio por vencer, una reseña negativa).

El aviso a Junior lleva solo los puntos 3 y 5.

## Metas por trimestre (se revisan en cada informe)

| Métrica | Sept 2026 | Dic 2026 | Jun 2027 | Sept 2028 |
| --- | --- | --- | --- | --- |
| Lighthouse móvil, todas las páginas | 52 a 80 | 85+ | 90+ | 95+ |
| Páginas indexadas por Google | 19 | 40 | 80 | 150 |
| Reseñas en Google | ? | 25 | 60 | 150 |
| Clics desde Google al mes | casi 0 | 300 | 1.500 | 5.000 |
| Fichas en directorios | 0 | 8 | 8 con reseñas | Top 10 en Clutch Miami |
| Casos de éxito publicados con números | 0 | 3 | 8 | 20 |
| Citas al mes desde el sitio | sin medir | 15 | 40 | 100 |
