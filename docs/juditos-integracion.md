# Conectar Juditos con judomarketing.net

Instrucciones para el proyecto **judomarketing** (este repo). Juditos vive
aparte, en el repo `AI-Assistants`, y se sirve bajo `judomarketing.net/juditos`
con el mismo patrón que JuditoADS bajo `/juditoads`.

Cómo están las piezas:

```
Judo Marketing (este repo)
├── websites de clientes
├── /juditoads   → JuditoADS   (repo Judito-Ads,    su propia base de datos)
└── /juditos     → Juditos     (repo AI-Assistants, su propia base de datos)
```

JuditoADS y Juditos comparten **la misma app de Meta**: con una sola
autorización del cliente se le dan los dos servicios, anuncios y chats.

---

## Lo que ya está hecho

- Rewrite de `/juditos` en `next.config.ts`, condicionado a `JUDITOS_URL`.
- `/juditos` excluido del middleware de idiomas (si no, next-intl lo manda a
  `/es/juditos` y la app no carga).
- `src/app/api/admin/juditos/route.ts` pide el resumen con el secreto compartido.
- Pestaña **AI Assistants** en el portal de administración.

Variables ya configuradas en Vercel: `JUDITOS_URL`, `JUDITOS_ADMIN_TOKEN`.

> **Los rewrites se hornean en el build.** Si cambias `JUDITOS_URL`, hay que
> volver a desplegar; poner la variable y reiniciar no basta.

---

## Lo que falta: el botón de "añadir Juditos" en el portal del cliente

El cliente que ya usa JuditoADS debe poder contratar Juditos **sin crear otra
cuenta**. La pieza que lo permite es un enlace firmado: el portal manda al
cliente a Juditos con su identidad dentro, firmada con el secreto compartido.

### 1. Generar el enlace (en el servidor, nunca en el navegador)

```ts
import { createHmac } from "node:crypto";

/** Enlace de contratación de Juditos para un cliente ya identificado aquí. */
function enlaceJuditos(usuario: { id: string; email: string; nombre?: string; empresa?: string }) {
  const cuenta = {
    id: usuario.id,          // el id del usuario en el portal (Supabase)
    email: usuario.email,
    nombre: usuario.nombre,
    empresa: usuario.empresa,
    exp: Math.floor(Date.now() / 1000) + 600,   // vale 10 minutos
  };

  const cuerpo = Buffer.from(JSON.stringify(cuenta)).toString("base64url");
  const mac = createHmac("sha256", process.env.JUDITOS_ADMIN_TOKEN!)
    .update(cuerpo)
    .digest("base64url");

  return `/juditos/contratar?cuenta=${cuerpo}.${mac}`;
}
```

Juditos verifica la firma y la caducidad; si algo no cuadra, trata al visitante
como anónimo y le pide los datos a mano. **El secreto no puede salir al
navegador**: quien lo tuviera podría contratar en nombre de cualquiera.

### 2. Saber si ya tiene Juditos

Para decidir si enseñar "Añadir Juditos — $20/mes" o "Ver mis Juditos":

```
GET {JUDITOS_URL}/juditos/api/cuenta/estado?cuenta=<id del usuario>
Authorization: Bearer {JUDITOS_ADMIN_TOKEN}
```

Responde:

```json
{
  "tiene": true,
  "estado": "NUEVA",
  "plan": { "id": "juditos", "nombre": "Juditos", "precioCents": 2000 },
  "juditos": 2,
  "enlaceFormulario": "/juditos/contratar/<id>"
}
```

`enlaceFormulario` viene con valor mientras la solicitud no esté montada: es
donde el cliente puede seguir completando o corrigiendo su cuestionario.

### 3. El cobro

Juditos **no cobra**: el cobro vive donde ya está Stripe, que es aquí. La
solicitud nace con `pagoEstado = PENDIENTE` y se marca como pagada desde el
panel de Juditos. Si quieres automatizarlo, el webhook de Stripe puede llamar
a Juditos cuando el pago se confirme — pídeme esa ruta y la añado.

Precios (definidos en `AI-Assistants/src/lib/planes.ts`, que es la única
fuente de verdad):

| Plan | Precio | Juditos | Mensajes/mes |
|---|---|---|---|
| Juditos | $20/mes | hasta 3 | 2.000 |
| Juditos Pro | $49/mes | hasta 3 | 2.000, modelo más capaz |
| Paquete extra | $8 | — | +1.000 mensajes |

---

## La pestaña AI Assistants

Ya existe y muestra el resumen de todos los clientes. El resumen incluye
`totales.solicitudesPendientes`: negocios que contrataron, rellenaron su
cuestionario y esperan a que alguien los monte. **Conviene enseñarlo como
aviso**, igual que los pagos pendientes — es dinero esperando a entrar.

El montaje en sí se hace desde el panel de Juditos
(`/juditos/solicitudes`), donde un botón crea el cliente, sus Juditos con el
cerebro ya escrito y los documentos como conocimiento.
