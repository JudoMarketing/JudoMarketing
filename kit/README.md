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

## Cómo instalarlo en un sitio nuevo

1. En el portal de admin (judomarketing.net/es/admin, pestaña Websites), crea el
   sitio y copia su **clave del kit** (kit key).
2. Copia estos archivos al proyecto del cliente:
   - `middleware.ts` → a la raíz (o fusiónalo con el middleware existente)
   - `app/judo-suspendido/page.tsx` → tal cual
   - `lib/judo-kit.ts` → tal cual
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
