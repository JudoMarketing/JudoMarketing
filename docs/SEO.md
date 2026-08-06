# Estrategia SEO de Judo Marketing

Objetivo del dueño: (1) ser el resultado #1 cuando alguien busque
"judo marketing", por encima de los artículos sobre la metáfora del judo
en el marketing, y (2) atraer clientes que buscan páginas web y apps
económicas en español e inglés.

## 1. La batalla por "judo marketing"

Los artículos que hoy dominan esa búsqueda hablan del CONCEPTO. Nosotros
somos un NEGOCIO real. Google favorece a las entidades reales cuando
detecta señales de negocio que un artículo no puede tener:

| Señal | Estado |
|---|---|
| Datos estructurados ProfessionalService (dirección, teléfono, precios, servicios) | ✅ Implementado en todo el sitio |
| Datos estructurados WebSite con nombre "Judo Marketing" | ✅ Implementado |
| Títulos de página con la marca "Judo Marketing" | ✅ Implementado |
| Página Nosotros que captura las búsquedas de "estrategia judo marketing" y las convierte en visitas a la marca | ✅ Ya existe |
| Dominio exacto judomarketing.net + Search Console verificado | ✅ |
| **Perfil de Empresa de Google (Google Business Profile)** | ✅ Activo 08/2026, conectado al schema (sameAs) y a los botones del sitio |
| Perfiles sociales con el nombre exacto "Judo Marketing" | ✅ Instagram y Facebook activos, conectados al schema |
| Reseñas de clientes en Google | ⬜ A medida que lleguen clientes |

Nota honesta: la palabra "judo" a secas es del deporte (federaciones,
olimpiadas) y no es alcanzable ni útil comercialmente. "judo marketing"
sí es totalmente ganable, y es la búsqueda que hace quien ya oyó de
nosotros por un vendedor o un anuncio.

## 2. Keywords objetivo

### Marca (prioridad máxima)
- judo marketing
- judo marketing miami
- judo marketing agencia / agency
- judomarketing

### Español, dinero directo (páginas: inicio y servicios)
- diseño de páginas web miami
- páginas web para negocios pequeños
- página web económica por suscripción / página web mensual
- crear tienda online económica
- página web con sistema de citas
- diseño de páginas web en español estados unidos
- cuánto cuesta una página web (la FAQ responde esto literalmente)
- hacer una página web para mi negocio
- app para mi negocio precio
- agencia de marketing digital miami
- páginas web para barberías / restaurantes / tiendas (nichos de vendedores)

### Inglés (páginas: inicio y servicios en /)
- affordable website design miami
- small business website monthly subscription
- website design for small business $50
- booking website for barbershop / salon
- online store design miami
- bilingual marketing agency miami
- app development for small business

### Informacionales (futuro blog)
- cómo vender por internet en estados unidos
- qué necesita mi negocio para aparecer en google
- tienda online vs redes sociales para vender
- the judo strategy in marketing (¡robarles su propia keyword a los artículos!)

## 3. Implementado en el código (08/2026)

1. **JSON-LD global** (src/components/JsonLd.tsx): ProfessionalService con
   dirección de Miami, teléfono, email, geo, rango de precios, idiomas,
   área servida y las 3 ofertas con precio; WebSite con la marca.
2. **Metadatos únicos por página** (src/lib/seo.ts): título con keywords +
   marca, descripción, canonical y hreflang (en/es/x-default) en
   servicios, nosotros, contacto y legal. Home en messages/meta.
3. **FAQ indexable** en la página de servicios (6 preguntas ES/EN) con
   datos estructurados FAQPage para resultados enriquecidos.
4. Ya existentes: sitemap bilingüe con hreflang, robots.txt, dominio
   verificado en Search Console, sitemap enviado, textos con keywords.

## 4. Pasos del dueño (en orden de impacto)

1. **Perfil de Empresa de Google** (LA más importante, gratis, ~20 min):
   business.google.com → crear perfil "Judo Marketing" → categoría
   "Agencia de marketing" (secundarias: Diseñador de sitios web,
   Desarrollador de software) → dirección 66 W Flagler St (o área de
   servicio si prefieres no mostrar la suite) → teléfono +1 305 934 9981 →
   web judomarketing.net → verificar (correo/video) → subir el logo y
   fotos → publicar. Con esto apareces en el panel lateral de Google y en
   Google Maps cuando busquen "judo marketing".
2. **Perfiles sociales con nombre exacto "Judo Marketing"**: Instagram,
   Facebook e LinkedIn como mínimo, con el logo, el enlace a
   judomarketing.net y la misma dirección/teléfono. Avísale a Claude
   cuando existan para agregarlos al schema (campo sameAs).
3. **Reseñas en Google**: cuando el Perfil de Empresa esté activo, pide a
   cada cliente contento su reseña ahí (además de las del sitio). Las
   reseñas de Google son el factor local #1.
4. **Enlaces (backlinks)**: directorios gratuitos (Yelp, Bing Places,
   cámaras de comercio hispanas de Miami), y cada sitio de cliente que
   construyas puede llevar en su pie "Website por Judo Marketing" con
   enlace. Esa red de sitios propios será oro puro para el SEO.
5. **Search Console, revisar 1 vez al mes**: Rendimiento → ver con qué
   búsquedas apareces; Páginas → confirmar que se indexen.

## 5. Futuro (con Claude)

- Blog bilingüe atacando las keywords informacionales (1 artículo bueno
  al mes rinde más que 10 flojos), incluido un artículo "La estrategia
  judo en el marketing" para competir de frente por esa búsqueda.
- Páginas de nicho: "Páginas web para barberías", "para restaurantes",
  etc., cada una apuntando a lo que venden los vendedores.
- Agregar sameAs al schema cuando existan los perfiles sociales.
- Velocidad: el sitio ya es rápido (Next.js estático); revisar Core Web
  Vitals en Search Console cuando haya datos.

## 6. Enlaces oficiales del negocio (08/2026)

- Perfil de Empresa de Google: https://share.google/L4AqIiUXUBUE9Oav6
- Enlace para pedir reseñas (mandar a cada cliente contento):
  https://g.page/r/CQ6htnynSX33EBM/review
- Instagram: https://www.instagram.com/judo.marketing/
- Facebook: https://www.facebook.com/Judomarketi/

Conectados en el sitio: sameAs del schema (JsonLd.tsx), botones
"Ver en Google" (home y contacto) y botón "Reseñarnos en Google" en la
sección de reseñas del home.
