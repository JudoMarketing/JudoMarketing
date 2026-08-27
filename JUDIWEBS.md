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

## Hacerla sesión local (esto es lo que toca)

**Por qué importa, y no es solo comodidad:** los plugins y los conectores solo
existen en sesiones **Local** y **SSH**. En una sesión de nube el botón `+`
del cuadro de mensaje no ofrece "Plugins", así que los 5 plugins de diseño no
se pueden ni instalar ni usar desde ahí. Todo lo que sea trabajar con plugins
va sí o sí en local.

### En la app de escritorio (lo más directo)

1. Abre la app de Claude y entra a la pestaña **Code**.
2. En el cuadro de mensaje, abre el desplegable de **entorno** y elige
   **Local** (las otras opciones son Cloud, SSH y, en Windows, WSL).
3. En **carpeta del proyecto**, elige la carpeta del repo `JudoMarketing` de
   tu laptop. Si todavía no la tienes ahí:
   ```bash
   git clone https://github.com/JudoMarketing/JudoMarketing
   cd JudoMarketing
   git checkout claude/judo-website-design-5nyn3x
   ```
4. Elige el modelo y el modo de permisos, y manda el primer mensaje (abajo
   está cuál).
5. Los plugins se instalan ahí mismo: botón **`+`** junto al cuadro de
   mensaje → **Plugins** → **Add plugin**.

### Desde la terminal, si prefieres

```bash
cd JudoMarketing
git checkout claude/judo-website-design-5nyn3x
git pull origin claude/judo-website-design-5nyn3x
claude
```

### El primer mensaje, tal cual

> Lee JUDIWEBS.md y docs/CEREBRO.md. Seguimos con judiwebs, la rama de diseño
> de websites. Trabaja en la rama claude/judo-website-design-5nyn3x. Ya tengo
> los plugins de diseño instalados: úsalos todos y sé crítico.

### Para levantar el proyecto en esa máquina

```bash
cp .env.example .env.local   # completar las claves
npm install
npm run dev                  # http://localhost:3000 → /es
npm run revisar -- http://localhost:3000/es
```

## Lo que NO se puede, para no perder tiempo buscándolo

- **Una sesión de nube no se convierte en local.** El menú "Continue in" de la
  app hace el camino contrario (manda una sesión local a la nube) y no existe
  el de vuelta. Lo que se hace es abrir una sesión **Local** nueva sobre la
  misma carpeta: el contexto lo da este archivo.
- **Claude no puede entrar a tu laptop desde una sesión de nube.** Lo que
  viaja entre computadoras es **el repositorio**, no la sesión.
- Una sesión de nube corre en un contenedor de Anthropic que se recicla al
  quedar inactivo. Nada existe hasta que está pusheado.
- **Regla de la casa:** `git push` antes de cerrar, `git pull` antes de
  empezar. Es lo único que hace que la laptop y la nube no se pisen.

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
