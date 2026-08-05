# Judo Marketing — Guía de Marca

Fuente: brand sheet oficial (compartido por el dueño, 2026-08-05).

## Identidad

**Tagline:** "We build smart marketing solutions that help businesses grow, stand out, and stay ahead."
**Valores de marca:** Innovation · Strategy · Growth · Results · Partnership
**Estética:** visuales de alto contraste, elementos 3D, iluminación futurista, fondo negro profundo con brillos morados.

## Paleta de colores

| Rol | Hex |
|---|---|
| Morado primario (botones, acentos, glow) | `#7B2DFF` |
| Morado claro (secundario, highlights de texto) | `#A855F7` |
| Negro base (fondo principal) | `#0B0B12` |
| Negro elevado (tarjetas, superficies) | `#11111A` |
| Blanco suave (texto) | `#F5F5F7` |

## Tipografía

- **Poppins Bold** — titulares.
- **Poppins Regular** — cuerpo de texto.

## Logo

- Wordmark "JUDO" en 3D plateado/cromado con líneas concéntricas estilo huella, con
  "marketing" debajo en minúsculas cromadas.
- Versiones: PNG fondo transparente (para fondos claros) y PNG fondo negro (miniatura /
  favicon / avatar). La versión fondo negro es la miniatura oficial.
- Thumbnail para compartir (Open Graph / redes): imagen hero con logo + robot + laptop
  dashboard sobre fondo negro (archivo pendiente de subir al repo).

## Mascota (robot)

Robot 3D negro brillante con "cara" de dos ojos ovalados que brillan en morado
(`#7B2DFF`/blanco), cabeza redondeada con auriculares laterales, cuerpo compacto.
Comportamiento en la web (Fase 1):
- Sigue al cursor/dedo con movimientos suaves y realistas (mirada y cabeza).
- Burbuja de pensamiento estilo anime para mensajes cortos (ej. pregunta de idioma).
- Versión "triste sentado" para la página de suspensión de sitios morosos (sentado sobre
  el link a www.judomarketing.net).
- Respeta `prefers-reduced-motion` y se simplifica en dispositivos de gama baja.
- Implementación: recreación vectorial/CSS-3D o Rive/Lottie (no imágenes pesadas).

## Elementos gráficos

- Gradientes y glows morados sobre negro; ondas de luz.
- Esfera con gradiente morado, hexágono wireframe, grid de puntos, red de nodos.
- Iconos: estilo outline morado (megáfono, gráfica, robot, globo, diana, avión de papel).
- Botones: primario relleno `#7B2DFF` con flecha →; secundario outline morado.
- Chips/etiquetas: outline con icono (AI ASSISTANTS, MARKETING, GROWTH).

## Datos de la empresa

- **Dirección:** 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130
- **Teléfono/WhatsApp:** 305-934-9981
- **Email:** admin@judomarketing.net
- **Web:** www.judomarketing.net
- **Instagram:** @judo.marketing
- **Supabase (producción):** https://ajsuskyeatgatbubctzl.supabase.co

## Assets en `assets/brand/`

| Archivo | Contenido | Uso |
|---|---|---|
| `logo-white-transparent.png` | Logo blanco, fondo transparente, 3000×3000 | Header del sitio, fondos oscuros |
| `logo-black.jpg` | Logo sobre fondo negro, 1500×1500 (baja resolución) | Miniatura oficial / favicon / avatar |
| `og-thumbnail.png` | Hero con logo + robot + dashboard, 1536×1024 | Open Graph: preview al compartir el sitio |
| `brand-sheet.png` | Hoja de marca completa, 1536×1024 | Referencia de diseño |
| `flyer-servicios.png` | Flyer vertical de servicios/precios, 1024×1536 | Referencia de contenido para la página Servicios |

Pendientes deseables:
- [ ] Logo en SVG o PNG de alta resolución en versión fondo negro (el `.jpg` actual es
  baja resolución — pedir el original si existe)
- [ ] Renders del robot en poses sueltas y fondo transparente (frente, sentado/triste
  para la página de suspensión, saludando) — si no existen, se recrea vectorialmente en
  Fase 1
