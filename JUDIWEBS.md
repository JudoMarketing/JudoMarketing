# judiwebs · La sesión de diseño de websites

Este archivo existe para una cosa: que este trabajo se pueda retomar desde
**cualquier computadora** sin volver a explicar nada. Si acabas de abrir el
repo en otra PC, lee esto y ya estás al día.

- **Sesión:** `judiwebs`
- **Rama:** `claude/judo-website-design-5nyn3x`
- **Repo:** https://github.com/JudoMarketing/JudoMarketing
- **De qué va:** el sistema de diseño de websites de Judo. No el sitio de
  judomarketing.net (eso vive en `claude/judo-marketing-redesign-ci2rj5`),
  sino **cómo se diseñan los sitios que vendemos**.

---

## Cómo seguir en tu laptop (local)

```bash
git clone https://github.com/JudoMarketing/JudoMarketing
cd JudoMarketing
git checkout claude/judo-website-design-5nyn3x
git pull origin claude/judo-website-design-5nyn3x

cp .env.example .env.local   # completar las claves
npm install
npm run dev                  # http://localhost:3000 → /es
```

Y para retomar la conversación desde ahí, dentro de esa carpeta:

```bash
claude
```

El primer mensaje que le das, tal cual:

> Lee JUDIWEBS.md y docs/CEREBRO.md. Seguimos con judiwebs, la rama de diseño
> de websites. Trabaja en la rama claude/judo-website-design-5nyn3x.

Con eso queda con todo el contexto: qué hay hecho, qué falta y cómo se
trabaja aquí.

## Sobre "conectar con la otra PC"

Conviene tenerlo claro para no perder tiempo buscándolo:

- Esta sesión corre en un contenedor **en la nube de Claude**, no en tu
  máquina, y el contenedor se recicla cuando queda inactivo. Por eso nada
  vale hasta que está **commiteado y pusheado** a la rama.
- Una sesión de la nube **no se muda** a tu laptop, y yo no puedo entrar a tu
  laptop desde aquí. Lo que viaja entre computadoras es **el repositorio**:
  cada PC hace `git pull` y sigue.
- Desde el navegador o la app, la sesión se reabre por nombre (`judiwebs`) en
  claude.ai/code. Desde la laptop, es el `claude` de arriba dentro de la
  carpeta del repo. Los dos caminos trabajan sobre la misma rama; lo único que
  no se puede es escribir en la rama desde dos lados a la vez sin hacer pull
  primero.
- **Regla de la casa:** antes de cerrar la laptop, `git push`. Antes de
  empezar en otra PC, `git pull`.

---

## Qué hay hecho en esta rama

### 1. El cerebro de diseño, ampliado · `docs/CEREBRO.md`

Era la destilación de 10 websites (firma de la casa, reglas duras, esqueleto
de home, dirección de arte por rubro). Ahora además es el sistema por escrito:

| Sección | Qué resuelve |
|---|---|
| §5 Tipografía | Escala fluida con `clamp()`, 16px mínimo en campos, medida de 62ch, pesos que se cargan |
| §6 Color | La paleta entera derivada de un color con `color-mix`, contraste 4.5:1, sombras de color |
| §7 Movimiento | Los tres niveles, video de fondo, fondos interactivos, navegación, 60fps, lo prohibido |
| §8 Accesibilidad | El piso: un H1, foco visible, 44px, alt, label, lang |
| §9 Formularios | Captcha verificado en servidor, campos mínimos, no perder lo escrito |
| §10 Imágenes | Peso, `next/image`, LCP bajo 2.5s en 4G |
| §11 Copy bilingüe | Se escribe en el idioma, no se traduce |
| §12 SEO técnico | Title con oficio, JSON-LD por rubro, `creator` vs `publisher` vs `sameAs` |
| §13 Checklist | Lo automatizable con un comando, lo demás a mano |

§7 es la que más importa para lo que queremos vender: sitios complejos, con
video de fondo y fondos interactivos, que se sientan bien al navegar.

### 2. Los patrones en código · `kit/ui/`

Autocontenidos: sin Tailwind, sin next-intl, sin dependencias. Se copian al
proyecto del cliente y se ven del **cliente**, no de Judo. Detalle completo en
`kit/ui/README.md`.

- `tema.ts` — la paleta completa derivada de UN color, con contraste WCAG y
  `revisarPaleta()` que canta en consola lo que no pasa.
- `JudoFondoVivo.tsx` — video de fondo o canvas interactivo con todas las
  reglas de §7 ya resueltas (poster, pausa fuera de pantalla, off en móvil y
  en `prefers-reduced-motion`, velo de contraste, sin robar clics).
- `fondos.ts` — `particulas()`, fondo interactivo con densidad por área.
- `JudoHero.tsx`, `JudoPasos.tsx`, `JudoResenas.tsx`, `JudoCierre.tsx`,
  `JudoCtaMovil.tsx` — el esqueleto de home de §3, bloque por bloque.

### 3. El checklist ejecutado · `scripts/revisar-sitio.mjs`

```bash
npm run revisar -- https://www.elsitiodelcliente.com
npm run revisar -- http://localhost:3000/es --json
```

Abre el sitio en un navegador de verdad (escritorio y teléfono 390px) y revisa
24 cosas: metadata, OpenGraph, favicon, un solo H1, encabezados en orden,
`lang`, `hreflang`, canónico, JSON-LD, el enlace del pie a judomarketing.net
sin `nofollow`, botones que no dicen qué pasa, `alt`, imágenes servidas más
grandes de lo que se ven, peso, fondo negro puro, contraste real del texto,
consola, peticiones rotas, desborde horizontal, áreas táctiles de 44px, campos
bajo 16px y la redirección entre `www` y el dominio pelado. Sale con código 1
si hay fallas, así que sirve en CI o en un cron.

Corriéndolo contra el propio judomarketing.net ya salieron cosas reales:
`/es/nosotros` no tiene `og:image`, el título pasa de 65 caracteres, la
descripción pasa de 165, hay texto a 3.59:1 de contraste ("NAVEGACIÓN" en el
pie) y el logo se sirve a 128px para mostrarse a 56px. Están sin arreglar a
propósito: son de la otra rama.

---

## Qué falta

1. **Los 5 plugins de diseño.** Todavía no están instalados (`ListPlugins`
   devuelve vacío). Cuando estén, se usan los cinco, con criterio, y se anota
   aquí cuál sirvió para qué y cuál no aportó.
2. **Un sitio de demostración** que use `kit/ui/` completo, con video de fondo
   y fondo interactivo, para vender mostrando en vez de explicando.
3. **Video de fondo de referencia**: falta el ejemplo real (8s, WebM + MP4,
   bajo 2.5 MB) para tener la vara de lo que se le pide a un cliente.
4. **Pasar el checker a los 10 sitios del portafolio** y arreglar por lista.

---

## Cómo se trabaja aquí

- Antes de escribir una línea de un sitio nuevo: `docs/CEREBRO.md` completo, y
  `kit/NUEVO-SITIO.md` para el alta (los accesos se piden el día 1, no a los
  tres meses).
- Todo lo que se aprenda construyendo un sitio y sirva para el siguiente,
  vuelve a `docs/CEREBRO.md`. Ese archivo es el activo; los sitios son la
  consecuencia.
- El sitio del cliente nunca depende del panel central para funcionar
  (fail-open del kit).
