# A quién le pido cada cambio

Un chat por proyecto, y cada uno manda en su repo. La duda típica es cuando
algo se ve en un sitio pero los datos vienen de otro. Esta es la regla.

## La regla, en una línea

> **Se pide donde SE VE, no donde nacen los datos.**

## La regla, con detalle

**Todo lo que se ve o se toca en `judomarketing.net` se pide en el chat de
Judo Marketing.** Eso incluye el portal de administración completo: pestañas,
tablas, columnas, botones, colores, textos, qué se muestra y en qué orden. No
importa de qué aplicación vengan los números.

**Lo que la otra aplicación HACE se pide en su chat.** La acción de verdad
—suspender de verdad una cuenta, borrarla de su base, calcular un dato,
generar un informe— la ejecuta la app dueña, en su repositorio.

## El ejemplo que ya vivimos: la pestaña JuditoADS

| Qué | Dónde vive | A quién se le pide |
| --- | --- | --- |
| La pestaña, la tabla, los botones «Suspender» y «Eliminar» | `JudoMarketing` | Chat de Judo Marketing |
| El puente `/api/admin/juditoads` que lleva la orden | `JudoMarketing` | Chat de Judo Marketing |
| El `POST /api/admin/usuarios` que ejecuta la orden de verdad | `Judito-Ads` | Chat de Judito-Ads |

Pasó exactamente así: los botones estuvieron listos días antes que el
endpoint del otro lado, y cada clic daba 405. Ninguno de los dos lados estaba
mal; faltaba el otro extremo. **Un puente se pide en los dos chats.**

## Cómo se arma un puente nuevo

Cuando el portal tenga que mostrar o mandar algo a otra app (por ejemplo, una
pestaña de AI Assistants):

1. **En el chat de la otra app:** que exponga una API de administración
   protegida con un secreto compartido — un `GET` que devuelva la lista y un
   `POST` que acepte las acciones. Que conteste JSON y que distinga «no
   autorizado» de «no encontrado» de «no pude».
2. **Ahí mismo:** que te dé la URL del despliegue y el secreto.
3. **En Vercel** (judomarketing.net): las dos variables de entorno, con el
   nombre de la app: `XXX_URL` y `XXX_ADMIN_TOKEN`. Nunca en el código.
4. **En el chat de Judo Marketing:** con esas dos, se arma la ruta puente y la
   pestaña.

El secreto vive **solo** en el servidor de judomarketing.net. Si estuviera en
el navegador, cualquiera con la consola abierta leería la lista completa de
clientes.

## Estado hoy

| Pestaña del portal | De dónde salen los datos | Puente |
| --- | --- | --- |
| Resumen, Formularios, Contratos, Websites, Dinero, Reseñas | Base propia de judomarketing.net | — |
| JuditoADS | App Judito-Ads | `JUDITOADS_URL` + `JUDITOADS_ADMIN_TOKEN` |
| Juditos (AI Assistants) | App AI-Assistants | `JUDITOS_URL` + `JUDITOS_ADMIN_TOKEN` |

Los detalles del puente de Juditos están en `juditos-integracion.md`.

## Los dos caminos, y cuál conviene

Hay dos formas de que una pestaña nueva llegue al portal, y las dos funcionan:

**A. Se pide aquí.** Tú lo pides en el chat de Judo Marketing y, si hace falta
algo del otro lado, se te dice qué pegarle a ese chat. Fue lo de JuditoADS.

**B. El otro chat la trae hecha.** El chat de la app hermana se conecta a este
repositorio y empuja la pestaña él mismo. Fue lo de Juditos: el chat de
AI-Assistants montó su pestaña, su ruta puente y su documento.

**Cuál conviene:** B es más rápido cuando el cambio es casi todo del lado de la
otra app y el portal solo la muestra. A es mejor cuando el cambio toca el
aspecto o la organización del portal, porque aquí es donde vive el criterio de
diseño y se ve el conjunto. Si dudas, pídelo aquí: desde acá se ve el portal
entero y se sabe si algo choca con lo demás.

**En los dos casos:** el que empuja a este repositorio empuja a la rama por
defecto, y si el push choca, `git pull --rebase`. Varias sesiones trabajan a
la vez sobre la misma rama.

## Y si no estás seguro

Pídelo aquí. Si resulta que la mitad va en otro repo, se te dice cuál es la
mitad y qué pegarle a ese chat — como se hizo con el `POST` de Judito-Ads.
