# Judo Marketing — instrucciones del repo

Este archivo se carga solo en cada sesión de Claude Code sobre este repo.
Es corto a propósito: apunta, no repite.

## El proyecto

Sitio oficial de Judo Marketing y plataforma de gestión (portales de
administración, vendedores y clientes) con red de sitios de clientes
supervisados desde un panel central.

Next.js App Router + Tailwind CSS 4 · next-intl (ES por defecto, EN) ·
Supabase · deploy en Vercel. Detalle en [README.md](README.md) y el plan de
fases en [PLAN.md](PLAN.md).

## El cerebro: memoria entre sesiones

`kit/cerebro/` es la memoria compartida del dueño y de Claude para **construir
sitios**. Cada chat empieza de cero; eso no.

**Antes de diseñar o construir cualquier sitio, léelo.** No es documentación
de consulta opcional: los errores que evita ya se cometieron, y volver a
cometerlos cuesta versiones enteras.

| Archivo | Cuándo |
| --- | --- |
| [kit/cerebro/METODO.md](kit/cerebro/METODO.md) | Antes de la primera decisión de diseño |
| [kit/cerebro/MODERNO.md](kit/cerebro/MODERNO.md) | Antes de copiar una técnica de moda |
| [kit/cerebro/VERIFICACION.md](kit/cerebro/VERIFICACION.md) | Antes de decir que algo está listo |
| [kit/cerebro/ERRORES.md](kit/cerebro/ERRORES.md) | Antes de todo, y cuando algo salga mal |
| [kit/cerebro/PROMPTS.md](kit/cerebro/PROMPTS.md) | Para arrancar y para revisar |

### La regla de la memoria

> Cuando una sesión aprenda algo que la siguiente necesitaría saber, se anota
> en `kit/cerebro/` **en el mismo commit** que el trabajo que lo enseñó.

Anotarlo después es anotarlo nunca. Y se anota con el caso concreto y el
número: *"el amarillo del logo mide 3,09:1 sobre blanco"* sirve; *"cuidado con
los colores claros"* no.

Si el dueño dice algo en el chat que valga para la próxima vez, no hay que
esperar a que lo escriba él: se le ofrece anotarlo y se anota.

## Las tres reglas que no se negocian

1. **Se mide, no se mira.** Contraste, peso, desbordamiento y tamaño real de
   un icono se comprueban con un número.
2. **La autocrítica va antes de la entrega.** Se revisa buscando qué está mal,
   y se dice aunque nadie lo haya notado. Un comentario que afirma un criterio
   no es prueba de que se cumpla — la captura sí.
3. **No se cortan esquinas.** Si algo no se puede hacer, se dice cuál y por
   qué, y se entrega el resto completo. Nunca datos inventados, testimonios
   sin permiso ni fotos de banco de imágenes fingiendo ser el cliente.

## Despliegue: siempre el último en producción

Instrucción permanente del dueño: **lo último que se empuja va a producción.**
No hay que preguntar cada vez.

Mecánica y trampas en [kit/NUEVO-SITIO.md](kit/NUEVO-SITIO.md) — resumidas:
un despliegue de *preview* **no se puede promover** (se construyó con otras
variables; la API devuelve 422), así que se crea uno nuevo con
`target: "production"`; y si el proyecto tiene despliegue por fases, producción
apunta al commit nuevo mientras el dominio **sigue sirviendo el anterior**
hasta que el canario llega al 100%. Verificar siempre sobre el HTML público,
no sobre el estado del proyecto.

## Sitios de cliente

El protocolo de alta (datos que pedir, kill switch, telemetría, cobro) está en
[kit/NUEVO-SITIO.md](kit/NUEVO-SITIO.md); la instalación del kit, en
[kit/README.md](kit/README.md). El **cómo se construye** es el cerebro.

## Convenciones

- Documentación y comentarios de código **en español**, explicando el porqué y
  avisando de la trampa fácil — el registro de `kit/README.md`.
- El diseño de cada sitio de cliente va con la identidad **del cliente**, no
  con el morado de Judo.
- `JUDO_KIT_KEY` nunca lleva el prefijo `NEXT_PUBLIC`.
