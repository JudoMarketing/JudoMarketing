# Auditoría de presencia en línea para clientes (la rutina)

Es la auditoría que Judo Marketing le entrega a un cliente o a un prospecto:
dónde está hoy en Google, Bing, la IA, las redes y los directorios, qué le
falta y el plan para 12 meses. Se hizo así con NV Labs (nov 2026), y el 27 de
noviembre con The Notes (en español) y Delivery Rush Florida (en inglés).
Esta es la versión que sale de esas tres.

**No es** la auditoría semanal de judomarketing.net (`AUDITORIA-RUTINA.md`)
ni el diagnóstico de $99 del website (`/diagnostic`), aunque usa las mismas
herramientas.

## Lo que se entrega

Un PDF de unas 15 páginas, en el idioma del cliente:

- portada con el puntaje de hoy y la meta;
- resumen con lo que más le cuesta;
- las 9 áreas del website;
- búsquedas, capturas, velocidad, SEO técnico, IA y competencia;
- las 10 áreas de fuera del website, revisión por revisión;
- los hallazgos;
- el plan en 3 fases;
- el método.

**Solo diagnóstico y plan** (Junior, 27 nov 2026). El precio, si lo hay, va en
la propuesta, que es otro documento. El PDF y los datos del cliente viven en
el scratchpad, nunca en el repositorio: es público.

## El puntaje

**19 áreas en dos bloques, cada una de 0 a 100:**

- **Website (9 áreas):** el promedio de sus 9 áreas.
- **Fuera del website (10 áreas):** el promedio de sus 10 áreas.
- **Puntaje total:** el promedio de los dos bloques. Así un website perfecto
  con cero reseñas no sale en 90.

**Cada área tiene su meta a 12 meses:** lo que es realista con trabajo, no
100 por defecto. La meta es un objetivo, no una garantía, y el PDF lo dice.

**Cómo se puntúa fuera del website:** cada área tiene 5 revisiones. Cada una
vale 1 (sí), ½ (a medias) o 0 (no). El área es `100 × suma / 5`, y así dos
personas que miden lo mismo sacan el mismo número. Lo que no se pudo
comprobar vale 0 y lo dice («No se pudo comprobar: …»); ½ solo con evidencia
parcial.

### Bloque 1: el website (9 áreas)

| id | Área | De dónde sale el número |
| --- | --- | --- |
| speed | Velocidad en el teléfono | Lighthouse móvil del inicio (dos corridas) y de las páginas que venden. |
| experience | Experiencia y accesibilidad | Accesibilidad de Lighthouse y `movil.mjs`: zoom, campos de 16 px, cada página arriba, contraste. |
| seo | SEO técnico | Las 16 revisiones de `SEO_CHECKS`. |
| visibility | Visibilidad en búsquedas | Las búsquedas de compra: cuántas encuentra y en qué lugar. |
| ai | Preparación para la IA | Las 8 revisiones de `IA_CHECKS` y `buscadores.mjs`. |
| conversion | Camino a la compra | Clics hasta pedir o contactar, fricción, precio visible. |
| content | Contenido y mensaje | Largo, claridad, prueba real, páginas por servicio. |
| reputation | Reputación y redes (en el sitio) | Reseñas, testimonios y redes visibles en el website. |
| security | Seguridad y confianza técnica | Encabezados de seguridad, SPF, DKIM, DMARC, `vigilar-sitios.py`. |

### Bloque 2: fuera del website (10 áreas, 5 revisiones cada una)

1. **Perfil de Google** (`google`):
   - existe y sale por el nombre;
   - categoría y servicios correctos;
   - ubicación o zona de servicio correcta (el punto del mapa también);
   - horario, teléfono y web iguales al sitio;
   - 10 fotos reales o más, y una publicación de los últimos 30 días.
2. **Reseñas** (`resenas`):
   - 10 o más en Google;
   - promedio de 4.5 o más;
   - una de los últimos 60 días;
   - el dueño responde;
   - reseñas en una segunda plataforma del rubro (Yelp, Facebook, G2,
     Capterra, Thumbtack, BBB).
3. **Directorios y datos iguales** (`directorios`):
   - Yelp;
   - Bing Places o Apple Maps;
   - página de Facebook con datos;
   - BBB o un directorio del rubro;
   - el mismo nombre, teléfono y zona en todos, sin datos viejos.
4. **Redes sociales** (`redes`):
   - 2 o más redes activas enlazadas desde el sitio;
   - una publicación en los últimos 14 días;
   - bio igual a la oferta de hoy, con enlace al sitio;
   - 500 seguidores o más en la principal;
   - contenido con prueba real: caras, trabajos, clientes.
5. **Qué responde la IA** (`ia_respuestas`):
   - preguntándole por el nombre, sabe qué es;
   - los datos que dice son los de hoy;
   - aparece cuando se le piden recomendaciones del rubro en la ciudad;
   - hay fuentes de terceros que puede citar;
   - ficha de empresa en LinkedIn o Crunchbase.
6. **Medición** (`medicion`):
   - analítica instalada (GA4, Tag Manager u otra);
   - Search Console verificado;
   - Bing verificado;
   - conversiones medidas (formulario, llamada, etiqueta de Ads, píxel);
   - aviso de cookies si usa píxeles de anuncios (sin píxeles, cuenta 1).
7. **Anuncios** (`anuncios`):
   - anuncios activos en Meta (Ad Library);
   - anuncios en Google (Ads Transparency Center);
   - el anuncio lleva a una página que cumple lo que promete;
   - la conversión del anuncio se mide;
   - está igual o más presente en anuncios que su competidor principal.

   Si no anuncia, es una oportunidad, y el PDF lo dice así: no es una falla del
   sitio.
8. **Autoridad y menciones** (`autoridad`):
   - 5 sitios externos o más lo nombran o enlazan;
   - una mención en prensa o en un blog del rubro;
   - un directorio o asociación del rubro (cámara de comercio, asociación
     profesional);
   - dominio de más de 1 año (RDAP);
   - un enlace de socios o clientes.
9. **Contacto y respuesta** (`contacto`):
   - teléfono para tocar en la primera pantalla del teléfono;
   - WhatsApp o texto;
   - formulario corto (5 campos o menos) o un camino directo a pedir;
   - correo con dominio propio, con MX;
   - horario o tiempo de respuesta dicho en el sitio.
10. **Confianza y cumplimiento** (`confianza`):
    - privacidad y términos;
    - consentimiento para SMS si pide el teléfono para textear (TCPA, 10DLC);
    - quién está detrás: dueño o equipo con nombre, y una zona real;
    - licencias, seguros o credenciales del rubro a la vista;
    - afirmaciones que se pueden probar (nada de «garantizado» ni
      «compliant» sin respaldo).

## Los pasos

Todo se corre desde la raíz del repo. La carpeta de trabajo va en el
scratchpad, por ejemplo `<scratchpad>/<cliente>/`.

### 1. Lo automático (5 minutos)

```bash
node scripts/auditoria/presencia/medir.mjs <dominio> <carpeta> <es|en>
node scripts/auditoria/rastrear.mjs --origen https://<dominio> --salida <carpeta>/rastreo.json
node scripts/auditoria/buscadores.mjs <dominio> > <carpeta>/buscadores.txt
node scripts/auditoria/movil.mjs <dominio> > <carpeta>/movil.txt
python3 scripts/seguridad/vigilar-sitios.py <dominio> > <carpeta>/vigilar.txt
```

- **`medir.mjs`:**
  - saca las capturas del PDF en el idioma del informe;
  - revisa la medición (GA4, Ads, píxel), la verificación de Search Console y
    de Bing, y el DNS del correo;
  - la fecha de registro del dominio;
  - el contacto (tel, WhatsApp, formularios, si se puede llamar desde la
    primera pantalla);
  - las redes enlazadas, la parte legal y el JSON-LD.
- **`rastrear.mjs`:** avisa de títulos y descripciones repetidos entre
  páginas.

### 2. Velocidad (10 minutos)

Lighthouse 13: el inicio en el teléfono dos veces, en la computadora una vez,
y las 2 páginas que venden en el teléfono.

```bash
CHROME_PATH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1) npx -y lighthouse https://<dominio>/ --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=<carpeta>/lh/home-movil-1.json
```

Para la computadora se agrega `--preset=desktop`.

### 3. Búsquedas y competencia (a mano, con criterio)

- **5 búsquedas de compra** como las haría el cliente del cliente, en sus dos
  idiomas si atiende en dos.
- **Una búsqueda del nombre de la marca.** Para cada búsqueda se anota si
  aparece, en qué lugar y quién sale en su lugar.
- **5 competidores**, medidos igual:
  - velocidad en el teléfono;
  - si tienen datos estructurados;
  - las páginas de su sitemap;
  - su modelo de precio;
  - sus reseñas.

### 4. Fuera del website (a mano, con la lista de arriba)

- **Perfil de Google:** abrirlo con Playwright, que muestra el mapa.
- **Ad Library de Meta:**
  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=<nombre>`
- **Ads Transparency de Google:**
  `https://adstransparency.google.com/?region=US&domain=<dominio>`
- **Redes:** abrirlas y anotar seguidores, la fecha de la última publicación
  y qué dice la bio.
- **IA:** hacerle preguntas a un buscador con IA, por el nombre y por el
  rubro en la ciudad.
- **Nunca** llenar formularios, hacer pedidos, crear cuentas ni escribirle al
  negocio.

### 5. Los datos

- **`datos.json` (website):** `DIMENSIONES`, `BUSQUEDAS`, `SEO_CHECKS`,
  `IA_CHECKS`, `PAGINAS_TEXTO`, `VELOCIDAD_PAGINAS`, `COMPETENCIA`,
  `HALLAZGOS`, `PLAN`, `METODO`, `RESUMEN.fecha`.
- **`fuera.json`:** `FUERA`, `FUERA_CHECKS`, `FUERA_HALLAZGOS`, `FUERA_PLAN`,
  `METODO_FUERA`.

El formato exacto de cada fila está en la cabecera de
`scripts/auditoria/presencia/armar.py`. Los ejemplos completos más recientes
son las carpetas `tn/` y `drf/` del 27 de noviembre de 2026; si ya no están,
el esquema de la cabecera basta.

- Los hallazgos van ordenados por lo que le cuestan al cliente, no por área.
- Cada uno es una frase con el dato que lo prueba.

### 6. El PDF

```bash
python3 scripts/auditoria/presencia/armar.py <carpeta> <es|en> "<Nombre>" "<dominio>" "<Preparado para …>" <salida.pdf>
```

Dice si algo se sale de su hoja y si quedó alguna raya larga. Después se
revisa **cada página** a ojo:
`pdftoppm -r 60 -jpeg <pdf> <carpeta>/prev/p` y una hoja de contacto.

### 7. Antes de entregar

- [ ] Las capturas en el idioma del informe.
- [ ] Ninguna celda vacía con raya larga: va «s/d» o «n/a».
- [ ] Toda cifra tiene su fuente en la carpeta; lo que no se pudo comprobar
      lo dice.
- [ ] Ningún precio ni dato interno de Judo en un informe para terceros.
- [ ] La prueba del humano: leerlo como el dueño del negocio. ¿Entiende qué
      le cuesta y qué hacer primero?
- [ ] Mandarlo con SendUserFile y responder en «Te toca a ti / Listo / Ojo».

## Lo aprendido (y por qué la rutina es así)

- **El navegador decide el idioma del sitio.** Las capturas de The Notes
  salieron en inglés en un informe en español. `medir.mjs` ahora abre con el
  locale del informe.
- **«No (búsqueda normal)» no es «encontrado».** Una celda que empezaba con
  «no (…)» se contó como aparición. El armador cuenta como no encontrado todo
  lo que empieza con «no»; el detalle va en la nota de la búsqueda, no en el
  estado.
- **Bing desde la nube devuelve resultados sin relación** (pierde la
  ubicación de EE. UU.). No se usa para posiciones: se dice en el método y
  se confirma con Bing Webmaster cuando hay acceso.
- **rdap.org responde 403 a los robots.** La edad del dominio sale del
  servidor del registro que lista IANA (`medir.mjs` ya lo hace).
- **Un sitio que se arma en el navegador le da el mismo HTML a todas sus
  páginas** (Delivery Rush: 4 páginas, 1 título, canónica al inicio). Google
  ve una sola página. `rastrear.mjs` ahora lo avisa.
- **Los datos estructurados y el teléfono dicen quién es el negocio.** En
  Delivery Rush, el `legalName` y el teléfono eran los de Judo Marketing, y
  Google y la IA mezclaban los dos negocios. Se revisa siempre en los sitios
  que construimos.
- **La IA repite lo viejo.** Precio y ciudad cambiados en el sitio siguen
  viviendo en Facebook, en los directorios y en los resúmenes. Por eso
  «datos iguales en todas partes» es un área propia.
- **Un sitio con una semana de vida no sale en búsquedas por tiempo, no por
  falla.** Se dice, y se propone medir de nuevo en 60 a 90 días.
- **Un servicio humano que compite con IA más barata tiene que explicar la
  diferencia** (The Notes). La auditoría mira el mensaje, no solo la técnica.
- **Las tablas de 9 filas con texto largo no caben:** letra de 10.4 px en la
  tabla de áreas y gráfico más bajo. El armador ya viene así.

## Volver a medir

La misma carpeta, el mismo `datos.json` como base y las mismas búsquedas,
cada 3 meses o 60 a 90 días después de un sitio nuevo. El informe nuevo dice
cuánto subió cada área desde la medición anterior.
