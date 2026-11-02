# «Cinco centavos» · guion para ElevenLabs (versión 3)

Es el guion del video 2 de JuditoADS (56 segundos) para tu voz clonada en
ElevenLabs. Reemplaza a la versión 2 (30 de octubre), que se corría.

## Por qué la versión 2 quedaba corrida

- **Las pausas duraban 0,6 segundos como mínimo.** Cuando una frase llenaba su
  escena, la pausa siguiente igual duraba 0,6 s, y ese pedacito de más se iba
  sumando frase tras frase. En el bloque 2, «Judito encuentra…» entraba 0,4 s
  tarde, «Pero no es lo más loco» 0,8 s y «Tú solo, en cuatro pasos» 1,2 s,
  aunque tu voz hablara al ritmo exacto.
- **Los bloques eran largos**, de hasta 14 segundos. Si tu voz habla un poco
  más lento o más rápido que la medida, la diferencia crece hasta el final del
  bloque.

## Qué cambió

- **Cada pausa se mide desde donde termina la frase anterior,** así que el
  atraso ya no se suma. Cada frase empieza en el segundo de su escena; las que
  más se corren, 0,1 s.
- **Son 7 bloques cortos en vez de 5.** Cada uno empieza justo en un cambio de
  escena y dura entre 3 y 11 segundos.
- **Cada bloque dice cuánto debe durar.** Con el bloque 1 eliges la velocidad
  que calza con tu voz (paso 3).
- **«Pero no es lo más loco» pasa a «Y no es lo más loco»:** es más corta y
  cabe con su pausa antes de «Tú solo».

## Cómo generarlo

1. **Modelo:** Eleven Multilingual v2, que respeta las pausas
   `<break time="…" />`. Si usas Eleven v3, borra esas etiquetas.
2. **Ajustes de la voz:**
   - Estabilidad: 45 %.
   - Similitud: 80 %.
   - Exageración de estilo: entre 5 y 15 %.
   - Speaker boost: encendido.
   - Velocidad: 1,0 para empezar.
3. **Genera solo el bloque 1 y mira cuánto dura** (ElevenLabs lo muestra en
   el reproductor). Debe durar unos 7,8 s. Con esta tabla eliges la
   velocidad para todos los bloques; si cambia, vuelve a generar el 1:

| Si el bloque 1 dura | Velocidad para los 7 bloques |
| --- | --- |
| menos de 7,0 s | 0,95 |
| de 7,0 a 7,3 s | 1,0 (así está bien) |
| de 7,3 a 7,6 s | 1,05 |
| de 7,6 a 8,0 s | 1,1 |
| más de 8,0 s | 1,15, y avísame: hay que acortar frases |

4. **Genera los otros bloques** con la misma velocidad y baja cada uno en MP3:
   `bloque-1.mp3` a `bloque-7.mp3`. Si una frase sale rara, repite solo ese
   bloque.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Cinco centavos** y, en «Subir una
versión nueva o tu voz», elige los 7 MP3 a la vez. Después dime **«calza la
voz de Cinco centavos»**. Corto cada bloque en sus frases, pongo cada una en
el segundo exacto de su escena (si alguna se pasa, la acelero hasta un 12 %),
bajo la música cuando hablas y te dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

- **Cada bloque va en el segundo que dice su título,** no uno detrás del otro.
- **Si una frase se ve corrida,** corta el audio en el silencio que tiene antes
  y muévela al segundo de su escena (tabla del final).

## Bloque 1 · va en 0:00,0 · dura unos 7,8 s

```
Te llegué por menos de cinco centavos. <break time="0.4s" />
Quédate: te enseño a hacerlo sin gurús... <break time="0.4s" />
y sin comerte diez cursos carísimos.
```

## Bloque 2 · va en 0:08,8 · dura unos 9,6 s

```
Lo logré en Miami, una de las ciudades más competitivas. <break time="0.8s" />
JuditoADS: cinco años de experiencia. <break time="0.3s" />
Judito encuentra a quien sí te compra.
```

## Bloque 3 · va en 0:18,5 · dura unos 3,3 s

```
Y no es lo más loco... <break time="0.5s" />
Tú solo, en cuatro pasos.
```

## Bloque 4 · va en 0:21,9 · dura unos 7,3 s

```
Uno: entras a la app. <break time="0.5s" />
Dos: conectas tu Facebook. <break time="0.7s" />
Tres: algo nuevo... o un post que ya tienes.
```

## Bloque 5 · va en 0:29,7 · dura unos 6,0 s

```
Cuatro: tu presupuesto... y tú decides cuánto. <break time="0.7s" />
¡Listo! Tu anuncio ya está en Meta.
```

## Bloque 6 · va en 0:36,3 · dura unos 7,4 s

```
Y casi nadie te lo dice... <break time="0.3s" />
Judito sí te lo dice. <break time="0.5s" />
Consejos que funcionan... <break time="0.7s" />
y vigila tus anuncios por ti.
```

## Bloque 7 · va en 0:44,1 · dura unos 11,0 s

```
Veinte dólares al mes... lo que cuesta una hamburguesa. <break time="0.7s" />
Si llegaste aquí, pruébalo gratis. <break time="0.3s" />
Catorce días, sin tarjeta. ¿Necesitas ayuda? Escríbeme.
```

## Cada frase en su escena

La columna «Voz» es lo que tarda cada frase a 5,5 sílabas por segundo.
Todas caben en su escena.

| Escena | Lo que se ve | Voz | Frase | Cómo decirla |
| --- | --- | --- | --- | --- |
| 0:00,0 – 0:02,6 | La moneda de 5¢ | 2,2 s | Te llegué por menos de cinco centavos. | Con picardía, sonriendo, como quien cuenta un truco. |
| 0:02,6 – 0:05,8 | El genio sale de la lámpara y cae el sello NO | 2,8 s | Quédate: te enseño a hacerlo sin gurús... | Cercano; más bajo en «sin gurús». |
| 0:05,8 – 0:08,8 | La torre de cursos: $6,823 y 134 horas | 2,0 s | y sin comerte diez cursos carísimos. | Con un poco de burla en «carísimos». Después suena la caja registradora. |
| 0:08,8 – 0:13,3 | El vuelo de la Tierra a la oficina | 3,7 s | Lo logré en Miami, una de las ciudades más competitivas. | Con orgullo, subiendo la energía. |
| 0:13,3 – 0:16,1 | «Y creé…» y el logo de JuditoADS | 2,6 s | JuditoADS: cinco años de experiencia. | Firme. Marca «cinco años». |
| 0:16,1 – 0:18,5 | La mira encuentra a una persona | 2,2 s | Judito encuentra a quien sí te compra. | Seguro. |
| 0:18,5 – 0:20,1 | «Pero eso no es lo más loco…» | 1,1 s | Y no es lo más loco... | Más lento y más bajo, como un secreto. |
| 0:20,1 – 0:21,9 | «Lo lanzas tú solo. En 4 pasos:» | 1,7 s | Tú solo, en cuatro pasos. | Vuelve la energía. |
| 0:21,9 – 0:23,9 | Paso 1: la pantalla de entrada | 1,5 s | Uno: entras a la app. | Claro y práctico, con un golpe en cada número. |
| 0:23,9 – 0:26,5 | Paso 2: el panel y tus cuentas | 1,9 s | Dos: conectas tu Facebook. | Igual. |
| 0:26,5 – 0:29,7 | Paso 3: el marco salta de una opción a la otra | 2,7 s | Tres: algo nuevo... o un post que ya tienes. | «O un post que ya tienes» cuando salta el marco. |
| 0:29,7 – 0:33,3 | Paso 4: el presupuesto y el sello «Tú decides» | 2,9 s | Cuatro: tu presupuesto... y tú decides cuánto. | «Tú decides» cuando cae el sello. |
| 0:33,3 – 0:36,3 | «¡Listo! Tu anuncio ya está en Meta.» | 2,4 s | ¡Listo! Tu anuncio ya está en Meta. | Alegre. |
| 0:36,3 – 0:38,1 | «Y lo que sigue, casi nadie te lo dice…» | 1,5 s | Y casi nadie te lo dice... | Bajito, de secreto. |
| 0:38,1 – 0:40,1 | «Judito sí te lo dice:» y el primer consejo | 1,5 s | Judito sí te lo dice. | Con complicidad, subiendo. |
| 0:40,1 – 0:42,1 | El segundo consejo | 1,3 s | Consejos que funcionan... | Pausado: que se lean las tarjetas. |
| 0:42,1 – 0:44,1 | El tercer consejo | 1,6 s | y vigila tus anuncios por ti. | Tranquilo. |
| 0:44,1 – 0:48,1 | $20 al mes, la hamburguesa y «14 días GRATIS» | 3,3 s | Veinte dólares al mes... lo que cuesta una hamburguesa. | Con orgullo, sin gritar. Marca «veinte dólares». |
| 0:48,1 – 0:50,6 | «Si llegaste hasta aquí, pruébalo gratis»; el dedo toca el botón | 2,2 s | Si llegaste aquí, pruébalo gratis. | Directo, como hablándole a una sola persona. |
| 0:50,6 – 0:56,1 | Tu @ y tu WhatsApp | 4,4 s | Catorce días, sin tarjeta. ¿Necesitas ayuda? Escríbeme. | Cálido, el tono más humano del video. Sonriendo. |
