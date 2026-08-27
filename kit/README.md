# Judo Site Kit

Archivos que se incluyen en **cada website de cliente** de Judo Marketing (Next.js
App Router). Conectan el sitio al panel central de judomarketing.net:

1. **Kill switch**: cada ~60 segundos el middleware consulta el estado del sitio.
   Si Administración lo marcó `deshabilitado`, todo el sitio muestra la página
   "Temporalmente deshabilitado" con la mascota triste y el enlace a
   www.judomarketing.net. **Fail-open**: si el panel central no responde, el
   sitio del cliente sigue funcionando normal (nunca se cae un cliente solvente
   por un fallo nuestro).
2. **Telemetría**: el helper `reportMetrics` envía ventas, tráfico y salud del
   sitio al panel central para que Administración las vea en su portal.
3. **Footer**: el pie de página del sitio, con la línea "Website por Judo
   Marketing" enlazada. Ver [Footer](#footer-el-pie-de-los-sitios) más abajo.

Aparte de eso, y **opcional**, está [`kit/ui/`](ui/README.md): los patrones de
diseño de `docs/CEREBRO.md` ya escritos en código (tema derivado de un color,
hero, fondo vivo con video o canvas, pasos, reseñas, cierre y barra de acción
móvil) para que un sitio nuevo no arranque desde cero. Eso es ayuda de diseño;
lo de arriba es lo que conecta el sitio al panel y va sí o sí.

## Cómo instalarlo en un sitio nuevo

1. En el portal de admin (judomarketing.net/admin, pestaña Websites), crea el
   sitio y copia su **clave del kit** (kit key).
2. Copia estos archivos al proyecto del cliente:
   - `middleware.ts` → a la raíz (o fusiónalo con el middleware existente)
   - `app/judo-suspendido/page.tsx` → tal cual
   - `lib/judo-kit.ts` → tal cual
   - `components/JudoFooter.tsx` y `lib/judo-red.ts` → tal cual
3. Agrega las variables de entorno en Vercel del cliente:
   ```
   JUDO_KIT_KEY=<la clave del kit copiada del portal>
   NEXT_PUBLIC_JUDO_STATUS_URL=https://ajsuskyeatgatbubctzl.supabase.co
   JUDO_ANON_KEY=<la anon key de Supabase de Judo>
   ```
4. Deploy. Probar: en el portal de admin toca "Deshabilitar" y recarga el sitio
   del cliente (aparece la página con la mascota en menos de un minuto); toca
   "Reactivar" y vuelve a la normalidad.

## Telemetría (opcional por sitio)

Donde el sitio del cliente registre una venta o quieras reportar tráfico:

```ts
import { reportMetrics } from "@/lib/judo-kit";
await reportMetrics({ sales: 1 }); // suma una venta al panel central
```

O programa un cron de Vercel que llame a `reportMetrics({ traffic, seo })` a
diario.

## Footer: el pie de los sitios

`components/JudoFooter.tsx` es el pie de página que va en el layout de cada
sitio de cliente. Es autocontenido (sin Tailwind, sin next-intl, sin imágenes)
y los colores se pasan por `tema`, así que se ve del **cliente**, no de Judo.
Lo único fijo es la última línea: *"Website por Judo Marketing"* con enlace
seguido a www.judomarketing.net.

Por qué importa: cada sitio que construimos es un enlace real hacia
judomarketing.net desde un dominio distinto y con contenido de verdad. Esa red
es la base del SEO de la marca (ver `docs/SEO.md` §4.4).

En `app/layout.tsx` del cliente, al final del `<body>`:

```tsx
import JudoFooter from "@/components/JudoFooter";

<JudoFooter
  idioma="es"
  negocio={{
    nombre: "Nombre del negocio",
    tagline: { es: "Frase corta", en: "Short line" },
    direccion: "Calle 1, Miami, FL",
    telefono: "+1 305 000 0000",
    email: "hola@ejemplo.com",
    instagram: "usuario",
  }}
  enlaces={[
    { texto: { es: "Menú", en: "Menu" }, href: "/menu" },
    { texto: { es: "Contacto", en: "Contact" }, href: "/contacto" },
  ]}
  tema={{ fondo: "#111", texto: "#fff", acento: "#e0a", tenue: "rgba(255,255,255,.6)", borde: "rgba(255,255,255,.12)" }}
/>
```

### Los sitios del mismo dueño (`red`)

`lib/judo-red.ts` lleva la lista de sitios que pertenecen a la **misma
persona**. Enlazarlos entre sí es legítimo y le dice al buscador que son
negocios hermanos; lo que se penaliza son enlaces cruzados entre dominios sin
relación real. Por eso:

- En un sitio de **cliente ajeno**: no se pasa `red` (queda vacío).
- En un sitio **del dueño**: se pasa `otrosSitios("<su id>")` y el footer
  muestra los demás bajo "También del mismo dueño".

Hoy la red del dueño (Junior Osorio) son Zanoah y Delivery Rush Florida. Para
sumar otro sitio suyo: agregarlo a `RED_PROPIA` y volver a desplegar los sitios
de la red.

**En zanoah.shop:**

```tsx
import { otrosSitios } from "@/lib/judo-red";

<JudoFooter
  idioma="es"
  negocio={{
    nombre: "Zanoah",
    tagline: {
      es: "Postres saludables en Miami, sin azúcar refinada.",
      en: "Healthy desserts in Miami, no refined sugar.",
    },
    /* dirección, teléfono, email e instagram reales del negocio */
  }}
  red={otrosSitios("zanoah")}
/>
```

**En deliveryrushflorida.com:**

```tsx
import { otrosSitios } from "@/lib/judo-red";

<JudoFooter
  idioma="es"
  negocio={{
    nombre: "Delivery Rush Florida",
    tagline: {
      es: "Mensajería urgente en Miami y Orlando, en menos de dos horas.",
      en: "Rush courier in Miami and Orlando, in under two hours.",
    },
  }}
  red={otrosSitios("delivery-rush")}
/>
```

### Un paso más (opcional): `creator` en el schema

Si el sitio ya emite datos estructurados de `WebSite`, vale la pena declarar
quién lo construyó. La propiedad correcta es `creator`, no `sameAs`:

```json
"creator": {
  "@type": "Organization",
  "name": "Judo Marketing",
  "url": "https://www.judomarketing.net"
}
```

Ojo con la diferencia, porque es fácil equivocarse:

- `publisher` / `Organization` del sitio = **el negocio del cliente**.
- `creator` del `WebSite` = **quien hizo el website**, o sea Judo.
- `sameAs` = otras páginas que hablan del MISMO negocio (su Instagram, su
  perfil de Google). Meter ahí un sitio hermano o a Judo es una afirmación
  falsa: son otras empresas, no otro perfil de esta.

El enlace entre sitios hermanos no necesita schema: el enlace visible del pie
ya es la señal, y el buscador arma el resto por el grafo de enlaces.

Nada de esto lo hace el footer solo, a propósito: si el sitio ya trae su
propio schema, dos bloques en la misma página se estorban.
