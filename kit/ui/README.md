# Judo UI · Los patrones de diseño en código

`kit/` tiene dos cosas y conviene no confundirlas:

- **`kit/` (raíz): obligatorio.** Kill switch, telemetría y `JudoFooter`. Va en
  TODOS los sitios de cliente porque los conecta al panel central. Ver
  [`kit/README.md`](../README.md).
- **`kit/ui/`: opcional.** Los patrones de
  [`docs/CEREBRO.md`](../../docs/CEREBRO.md) ya escritos en código, para
  arrancar un sitio nuevo desde aquí y no desde cero. Se copian, se les cambia
  lo que haga falta y se borra lo que no se use.

Todos son autocontenidos: **sin Tailwind, sin next-intl, sin dependencias**.
Solo React y CSS propio. Los colores salen de variables CSS, así que cada
componente se ve del **cliente** y no de Judo.

## Empezar: el tema

Un color dueño por sitio, todo lo demás derivado de él (CEREBRO §6):

```ts
// app/layout.tsx
import { paletaDesde, cssDeTema, revisarPaleta } from "@/kit/ui/tema";

const tema = paletaDesde("#e0399b", "claro"); // rosa pastel, sitio claro
if (process.env.NODE_ENV !== "production") console.warn(revisarPaleta(tema));

export default function Layout({ children }) {
  return (
    <html lang="es">
      <head><style dangerouslySetInnerHTML={{ __html: cssDeTema(tema) }} /></head>
      <body>{children}</body>
    </html>
  );
}
```

De ahí salen `--marca`, `--marca-luz`, `--marca-honda`, `--sobre-marca`,
`--fondo`, `--fondo-alto`, `--texto`, `--tenue`, `--borde` y `--sombra`. Todos
los componentes de esta carpeta leen esas variables y traen valor de respaldo,
así que funcionan aunque el tema no esté puesto todavía.

`revisarPaleta` canta en consola lo que no pasa contraste antes de que lo vea
el cliente. `legibleSobre(color, fondo)` sube o baja un color hasta que se
lee: es el arreglo del clásico "el morado de marca no contrasta sobre negro".

## Los componentes

| Archivo | Qué es | Dónde va |
|---|---|---|
| `tema.ts` | La paleta derivada de un color + contraste WCAG | En el layout |
| `texto.ts` | `{ es, en }` y el helper `t()` | Lo usan todos |
| `JudoHero.tsx` | Kicker → titular con una palabra en color → apoyo → CTA fuerte + discreto → ancla de confianza | Arriba del todo |
| `JudoFondoVivo.tsx` | Video de fondo o canvas interactivo, con todas las reglas de CEREBRO §7 resueltas | Envolviendo el hero |
| `JudoPasos.tsx` | "Cómo funciona" en 3-4 pasos numerados | Después del hero |
| `JudoResenas.tsx` | Prueba social con nombre, lugar y fuente | Antes del cierre |
| `JudoCierre.tsx` | CTA repetido + dirección, teléfono y horario | Antes del pie |
| `JudoCtaMovil.tsx` | Barra de acción fija, solo en teléfono y solo pasado el hero | Al final del layout |
| `fondos.ts` | Pintores para `JudoFondoVivo` (`particulas()`) | Con el fondo vivo |

El orden de la tabla es el esqueleto de home de CEREBRO §3. El pie es
`JudoFooter` de `kit/components/`, que además es obligatorio.

## Un hero con fondo vivo, completo

```tsx
import JudoFondoVivo from "@/kit/ui/JudoFondoVivo";
import JudoHero from "@/kit/ui/JudoHero";
import { particulas } from "@/kit/ui/fondos";

<JudoFondoVivo
  poster="/hero-poster.jpg"
  video={{ webm: "/hero.webm", mp4: "/hero.mp4" }}
  velo={0.6}
>
  <JudoHero
    idioma="es"
    kicker={{ es: "MIAMI · DESDE 2008 · CONTESTAMOS EN 1 HORA", en: "MIAMI · SINCE 2008 · WE ANSWER IN 1 HOUR" }}
    titular={{ es: "Te dejamos el jardín impecable.", en: "We leave your yard spotless." }}
    palabraAcento={{ es: "impecable", en: "spotless" }}
    apoyo={{ es: "Corte, poda y limpieza cada dos semanas, sin contrato.", en: "Mowing, trimming and cleanup every two weeks, no contract." }}
    ctaFuerte={{ texto: { es: "Pedir cotización", en: "Get a quote" }, href: "/cotizar" }}
    ctaDiscreto={{ texto: { es: "Ver trabajos", en: "See our work" }, href: "/trabajos" }}
    ancla={{ es: "4.9 en Google · 212 reseñas", en: "4.9 on Google · 212 reviews" }}
  />
</JudoFondoVivo>
```

Para fondo interactivo en vez de video, se cambia `video` por
`pintar={particulas({ densidad: 8 })}`. Los dos pueden ir juntos: el canvas se
pinta encima del video.

## Lo que estos componentes ya resuelven (y que no hay que volver a discutir)

- El video de fondo se pausa al salir de pantalla y al ocultarse la pestaña,
  no corre en teléfono, se apaga con `prefers-reduced-motion` y con
  `saveData`, y siempre tiene poster.
- El canvas limita el DPR a 2, calcula la densidad por área y detiene el
  `requestAnimationFrame` cuando no se ve.
- Ningún fondo se roba un clic (`pointer-events: none`).
- Botones de 48px de alto, foco visible con `:focus-visible`, y la barra móvil
  no es alcanzable con teclado mientras está escondida.
- Todo texto que ve el visitante se pide en los dos idiomas: si falta uno, no
  compila.

## Lo que NO hacen a propósito

- No traen tipografía: la display y la sans las elige el sitio (CEREBRO §5).
- No traen schema JSON-LD: dos bloques en la misma página se estorban.
- No usan `next/image`: el kit no obliga a Next. En un proyecto Next se cambia
  el `<img>` del hero por `<Image sizes=... priority />`, y está comentado
  dónde.
