# Sillas de invitado — lo que tiene que hacer cada app hermana

Una **silla de invitado** es una persona que entra a una de nuestras apps y no
paga suscripción: pruebas, familia, socios, un cliente al que se le regala el
acceso, un tester de la app del teléfono.

Se dan desde el portal de admin de judomarketing.net → pestaña **Invitados**.

## El reparto (la regla de siempre)

| Qué | Dónde vive | Quién lo hace |
| --- | --- | --- |
| La pestaña, el formulario, la lista, el registro de quién la dio y por qué | `JudoMarketing` (tabla `guest_seats`) | Chat de Judo Marketing — **ya está hecho** |
| **Dejar de cobrarle de verdad** a esa persona | La app hermana, en su base | Chat de cada app — **falta** |

La lista vive en judomarketing.net a propósito: así el portal la muestra aunque
la app esté caída, queda constancia de quién regaló el acceso y por qué, y si
una app se migra la lista se vuelve a empujar. Pero **el que no cobra es cada
app**: aquí solo se guarda la orden y si la aceptó.

## El endpoint que cada app tiene que exponer

```
POST {base}/api/admin/invitados
Authorization: Bearer <el secreto compartido de esa app>
Content-Type: application/json

{
  "accion": "otorgar" | "revocar",
  "email":  "persona@correo.com",   // siempre en minúsculas
  "nombre": "Nombre o null",
  "nota":   "por qué se le dio",
  "expira": "2026-12-31T23:59:59.000Z" | null   // null = para siempre
}

→ 200 { "ok": true }
→ 4xx/5xx { "error": "explicación en una línea" }
```

`{base}` es el mismo origen que ya usa el resumen de admin de esa app:
`.../juditoads` para JuditoADS, `.../juditos` para Juditos, y el origen pelado
para JudiMental (no tiene prefijo).

### Qué significa cada acción, del lado de la app

**`otorgar`**
- Si la persona **ya tiene cuenta**: se le marca como invitada y deja de
  cobrársele. Ni cobro, ni recordatorio de pago, ni pantalla de "tu prueba
  terminó", ni bloqueo por falta de suscripción.
- Si **todavía no tiene cuenta**: se guarda el correo como invitado pendiente,
  y cuando esa persona se registre con ese correo entra ya como invitada. No se
  le crea la cuenta ni se le manda invitación desde aquí.
- Con `expira`: el día siguiente a esa fecha vuelve a ser un usuario normal —
  es decir, vuelve a pagar o pierde el acceso, según cómo funcione tu app.
- **Idempotente:** si ya era invitada, contestar `200 {ok:true}` igual. El
  portal reintenta.

**`revocar`**
- Deja de ser invitada. Vuelve a las reglas normales de la app.
- **No se borra la cuenta ni sus datos.** Quitar una silla no es echar a nadie.
- También idempotente: si no era invitada, `200 {ok:true}`.

### Errores

Contesta `{ "error": "..." }` con texto legible: el portal lo enseña tal cual
al lado de la silla, y la silla se queda en **pendiente** con un botón de
reintentar. Nunca contestes `200` si no la aplicaste — una silla que aparenta
estar dada y no lo está es una persona bloqueada que cree que tiene acceso, o
un cobro que sigue corriendo.

Mientras el endpoint no exista, el portal responde
«*todavía no acepta esta orden: falta implementarla en su app*» y deja la silla
pendiente. Eso ya pasó con las acciones de JuditoADS: los botones estuvieron
listos días antes que el otro extremo, y cada clic daba 405. Es esperado, no
está roto.

## Además, solo para JudiMental

JudiMental también expone un resumen de **solo lectura** para el portal:

```
GET {base}/api/admin/resumen
Authorization: Bearer <JUDIMENTAL_ADMIN_TOKEN>

→ 200 {
  "totales": { "registrados": 0, "activos7d": 0, "sesiones": 0 },
  "personas": [
    {
      "id": "...",
      "nombre": "...",
      "email": "...",
      "registradoEn": "2026-08-30T...",
      "ultimaActividad": "2026-08-30T..." | null,
      "racha": 5,
      "plan": "gratis" | "invitado" | "...",
      "progreso": { "etiqueta": "Semana 3 de 8", "porcentaje": 37 }
    }
  ]
}
```

Todos los campos menos `id` son opcionales: el portal pinta «—» donde falte.

> **Lo que NO sale de JudiMental.** El portal muestra el **avance**, nunca el
> **contenido**: nada de lo que la persona escribe, responde o registra dentro
> de la app. Es una app de salud mental; ese contenido no debe salir de su base
> de datos ni pasar por el servidor de judomarketing.net. Si algún día hace
> falta más, se piensa aparte y se escribe en la política antes de construirlo.
>
> Por eso la ruta `/api/admin/judimental` del portal solo tiene `GET`.

## Lo que hay que pegar en Vercel (judomarketing.net)

Dos variables por app, con el nombre de la app. Nunca en el código:

| App | Variables |
| --- | --- |
| JuditoADS | `JUDITOADS_URL`, `JUDITOADS_ADMIN_TOKEN` |
| Juditos | `JUDITOS_URL`, `JUDITOS_ADMIN_TOKEN` |
| JudiMental | `JUDIMENTAL_URL`, `JUDIMENTAL_ADMIN_TOKEN` |

El secreto vive **solo** en el servidor de judomarketing.net. Si estuviera en
el navegador, cualquiera con la consola abierta podría regalarse una silla en
las tres apps.

## Cómo agregar una cuarta app

1. `src/content/apps-hermanas.ts` → una línea más en `APPS_INVITADO`.
2. `src/lib/apps-hermanas.ts` → una línea más en `RUTAS`.
3. Una migración que agregue el nombre al `check` de `guest_seats.app`.
4. Las dos variables en Vercel, y el endpoint de arriba en la app.
