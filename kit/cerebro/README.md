# Cerebro

Memoria compartida entre el dueño y Claude para **construir sitios**.

`NUEVO-SITIO.md` cubre el protocolo de negocio: qué datos pedir, cómo dar de
alta el sitio, cómo conectar la telemetría. Su paso 5 dice "construir el sitio
con la base de Judo, estética de la marca del cliente" — una línea. Este
cerebro es lo que va detrás de esa línea.

## Por qué existe

Cada chat de Claude Code empieza de cero. Sin esto, el método se vuelve a
descubrir en cada sitio, y se vuelven a cometer los mismos errores: el mismo
titular en la tipografía equivocada, la misma paleta sacada del sitio del
logo equivocado, el mismo texto blanco sobre un video sin medir el contraste.

Eso ya pasó. Está anotado en [ERRORES.md](ERRORES.md), con lo que costó cada
uno. Ese archivo es el más valioso de la carpeta: es lo único que no se puede
reconstruir desde el conocimiento general.

## Los archivos

| Archivo | Para qué |
| --- | --- |
| [METODO.md](METODO.md) | El orden en que se toman las decisiones de diseño, de la marca a la verificación |
| [MODERNO.md](MODERNO.md) | Las técnicas que dan el aspecto actual, con el código real y sus trampas |
| [VERIFICACION.md](VERIFICACION.md) | Cómo se comprueba que está bien, con los scripts |
| [ERRORES.md](ERRORES.md) | Los errores que ya se cometieron y qué los causó |
| [PROMPTS.md](PROMPTS.md) | Prompts listos para arrancar y para revisar |

## Cuándo se lee

- **Antes** de escribir la primera línea de CSS de un sitio nuevo: `METODO.md`.
- **Antes** de copiar una técnica de moda: `MODERNO.md` (cada una trae la
  condición bajo la cual funciona y bajo cuál estorba).
- **Antes** de decir que algo está terminado: `VERIFICACION.md`.
- **Cuando algo salga mal**: se anota en `ERRORES.md`. Ese es el trabajo.

## Las tres reglas que no se negocian

Todo lo demás en esta carpeta es criterio discutible. Esto no.

### 1. Se mide, no se mira

El contraste, el peso de un video, el desbordamiento horizontal y el tamaño
real de un icono se comprueban con un número, no con la vista. Un diseñador
mirando una pantalla buena, con luz buena y vista buena, aprueba cosas que en
un móvil al sol no se leen.

Dos ejemplos reales de este repo: un número de paso en amarillo que "se veía
bien" daba 3,09:1 sobre blanco — por debajo del mínimo legible. Un icono de
puzle que era perfecto a 72px se convertía en una mancha dentada a 27px, que
es el tamaño al que de verdad se muestra. Ninguno de los dos se detecta
mirando; los dos se detectan midiendo.

### 2. La autocrítica va antes de la entrega, no después

Antes de decir "listo", el trabajo se revisa buscando qué está mal, no
buscando confirmación de que está bien. Y lo que se encuentre se dice, aunque
nadie lo haya notado.

La forma práctica: releer el propio diff como si fuera de otro y hubiera que
tumbarlo. Si no aparece nada, es que no se buscó de verdad.

Un aviso que vale para Claude: es muy fácil escribir en un comentario que se
está haciendo algo y no hacerlo. En este repo pasó — un CSS decía que estaba
concentrando los colores de la marca mientras hacía lo contrario. **Lo que
dice el comentario no es prueba de nada; la captura de pantalla sí.**

### 3. No se cortan esquinas

Si una parte del encargo no se puede hacer, se dice cuál y por qué, y se
entrega el resto completo. No se entrega la parte fácil en silencio.

En concreto, nunca:

- Dar por bueno un contraste sin calcularlo.
- Dejar un `TODO` sin marcarlo en la entrega.
- Poner una foto de banco de imágenes de una familia o un equipo que no
  existe, como si fuera el cliente.
- Inventar una métrica ("300+ clientes") que el cliente no haya confirmado.
- Publicar un testimonio sin permiso escrito.

Las tres últimas no son cuestión de gusto: comprometen al cliente.

## Dónde vive la memoria (y dónde no)

El contexto de un chat de Claude **muere con el chat**. Lo que se diga en una
conversación no llega a la siguiente. Esta carpeta sí: está versionada, se ve
en el historial de git y `CLAUDE.md` en la raíz hace que **toda sesión sobre
este repo la cargue sola**, sin que nadie tenga que acordarse de mencionarla.

Así que el conocimiento se guarda aquí. Pero no hace falta escribir markdown
para hacerlo: basta decirlo en el chat.

> «Anota esto en el cerebro: el trazo de fondo baja el contraste del texto que
> cae encima, hay que recalcularlo contra el píxel del trazo.»

Claude lo coloca en el archivo que toque, con el formato del archivo, en el
mismo commit. El dueño también puede editar los archivos a mano cuando
prefiera — es markdown normal.

Lo que **no** funciona: dejarlo dicho solo en el chat. Se pierde.

## Cómo crece

Esta carpeta sirve si se escribe en ella. La regla:

> Cuando una sesión aprenda algo que la siguiente necesitaría saber, se anota
> aquí **en el mismo commit** que el trabajo que lo enseñó.

Anotarlo después es anotarlo nunca. Y se anota con el caso concreto y el
número, no en abstracto: "el amarillo del logo no sostiene texto, mide 3,09:1
sobre blanco" sirve; "cuidado con los colores claros" no sirve.

Si algo de aquí resulta equivocado, se corrige y se deja dicho que estaba
equivocado. Un cerebro que solo acumula y nunca se contradice no está
aprendiendo.
