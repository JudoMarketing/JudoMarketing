# El método de Vendito

Junior lo pidió así (14 nov 2026): que cuando llegue una idea desordenada se
ordene, que con feedback lleguemos a un producto final, que el contenido se
mire como lo vería una persona y que no empecemos de cero cada vez.

## 1. Ordenar la idea: el brief

Toda pieza empieza con un brief en `docs/vendito/briefs/AAAA-MM-DD-nombre.md`.
Se llena con lo que Junior dijo, lo que ya está en `decisiones.md` y lo que se
deduce del sistema. Lo que no se puede deducir se marca «Por confirmar».

```markdown
# Brief · <nombre de la pieza> · v1

- **Pedido de Junior (sus palabras, resumidas):** …
- **Objetivo:** qué tiene que pasar después de verla (escribir por WhatsApp,
  comprar el diagnóstico, guardar el video).
- **Para quién:** el dueño concreto (rubro, ciudad, momento).
- **Su dolor, en sus palabras:** lo que diría él, no nosotros.
- **Lo que quiere de verdad:** el resultado, no el servicio.
- **Nivel de conciencia:** no sabe que tiene el problema / sabe el problema /
  conoce soluciones / nos conoce.
- **La promesa:** una frase que se pueda cumplir.
- **La prueba:** lo que lo hace creíble (showcase, garantía, informe real).
- **La oferta y el llamado:** qué recibe, cuánto cuesta y el paso exacto.
- **Formato:** video, carrusel, anuncio, página; idioma; duración.
- **Lo que no se dice:** de `decisiones.md` y `negocio.md`.
- **Por confirmar:** …
```

**Preguntas:** solo las que cambian lo que se va a hacer, todas juntas y con
una recomendación en cada una. El resto se decide y se dice en la entrega.

## 2. El ángulo: dos o tres caminos y una elección

Antes de producir se escriben de dos a tres ángulos. Cada uno lleva:

- el dolor que ataca;
- el gancho (la primera frase y la primera imagen);
- por qué funcionaría con este cliente;
- su riesgo.

Se elige uno y se explica por qué en dos líneas. Los otros se guardan como
ganchos alternativos para la entrega. Junior pidió que la idea pueda ser mejor
que su pedido: si el ángulo elegido cambia algo de lo que pidió, se dice en
«Lo que cambié y por qué».

## 3. Producir

- Video: skill `judo-video-vertical` (8 piezas, capa pro, revisor).
- Carrusel: skill `judo-carrusel`.
- Sitio: el repo, con las reglas de CEREBRO.
- Voz: un clip por escena para ElevenLabs (sección 6).

## 4. La prueba del humano (antes de entregar, siempre)

Se mira la pieza **como el dueño que la recibe**, sin saber nada de Judo. Si
la pieza es importante, se le pide al subagente `cliente-esceptico` (lee la
pieza sin el brief, para que no lo anclemos con nuestra conclusión).

| Pregunta | Pasa si… |
| --- | --- |
| ¿Qué me ofrecen? | Se entiende en 3 segundos, sin sonido. |
| ¿Es para mí? | Me veo en el dolor: un rubro, una hora, una escena que me pasó. |
| ¿Por qué ellos? | Hay una prueba, no un adjetivo. |
| ¿Cuánto me cuesta y qué arriesgo? | El precio o el primer paso está claro, y el riesgo es chico. |
| ¿Qué hago ahora? | Un solo paso, con dónde y cómo. |
| ¿Me queda una duda? | Ninguna que me frene. Si queda una, se responde en la pieza o en el pie. |
| ¿Algo suena a mentira o a IA? | Nada genérico, nada exagerado, nada que no se pueda probar. |

Lo que falle se arregla antes de entregar. En la entrega se dice qué se
arregló gracias a esta prueba.

## 5. El feedback de Junior

1. Se copia su comentario tal cual en el brief, sección «Feedback vN».
2. Se traduce a la causa: «está mal la voz» puede ser el ritmo, el tono, el
   texto o el tiempo. Si no se puede saber, se pregunta con opciones.
3. Se arregla la causa en la pieza y en el método (si es una regla nueva, va a
   `decisiones.md` y, si aplica, a la skill que corresponda).
4. Se entrega la versión siguiente con «Qué cambió desde vN».

## 6. La voz para ElevenLabs: un clip por escena

Lección del 14 nov 2026: los bloques largos con pausas se desfasan con la voz
real, aunque la voz de prueba calce. La voz de ElevenLabs habla más lento que
la de prueba, y cada diferencia se acumula dentro del bloque.

- **Un clip por escena** (o por frase), sin pausas `<break>` adentro. Cada clip
  tiene su segundo exacto de inicio y su largo máximo.
- **Las escenas se diseñan para la voz real:** ElevenLabs Multilingual v2
  habla a unas 3,3 a 4,3 sílabas por segundo; se calcula a 3,3 y la frase no
  ocupa más del 85 % de su escena. Cuando se mida la voz clonada de Junior (un
  párrafo de unas 100 sílabas a speed 1,0), se usa el 90 % de su ritmo y se
  anota en `decisiones.md`.
- **Los clips se nombran** `NN_SSS.s_dos-palabras.mp3` (escena, segundo de
  inicio, dos palabras), con Multilingual v2 y los mismos ajustes en todos.
- **La tabla de la línea de tiempo** dice: clip, segundo de inicio (como lo
  muestra CapCut), largo máximo y qué hacer si sale largo: acelerar hasta un
  5 % no se nota; 10 % es el máximo; más que eso, se regenera o se acorta.
- **Si Junior sube los clips a la Biblioteca,** `calzar-voz.py` los pone solos
  en su segundo (acelera hasta un 10 %).
- **La tabla no se escribe a mano:** `voz.json` lleva una frase por bloque
  con su `clip`, `ve` y `como`; `python3 calzar-voz.py voz.json --guion`
  dice si todo cabe y `python3 guion-clips.py voz.json` escribe
  `guion-elevenlabs.md` (el primero que lo usó: `scripts/video/judo-phone-off-en`).
- **Si hay muchas escenas cortas:** Junior puede grabarse leyendo sobre el
  video y pasar la grabación por Voice Changer a su voz clonada; así el ritmo
  es el suyo y calza siempre.
- La investigación completa, con fuentes: `docs/vendito/investigacion/elevenlabs.md`.

## 7. La entrega

Siempre en este orden, después de «Hola Junior, Vendito aquí.»:

- **Te toca a ti:** lo que depende de él, con enlaces.
- **Listo:** una línea por cambio. Incluye la versión, el ángulo elegido y lo
  que cambió de su pedido.
- **Ojo:** solo los riesgos.

Y al cerrar: se anotan las decisiones nuevas en `docs/vendito/decisiones.md`
y el brief queda con su estado («entregado vN», «aprobado»).
