# «Five cents» · guion para ElevenLabs en inglés

Es el guion de la versión en inglés de «Cinco centavos» (video 2 de
JuditoADS, 56 segundos), para tu voz clonada en ElevenLabs. Está calculado
como la versión 3 del español: cada pausa se mide desde donde termina la frase
anterior y cada frase empieza en el segundo de su escena. Así no se corre como
la versión 2 del español.

## Antes de generar

- **Tu voz clonada habla inglés** con Eleven Multilingual v2: pega el texto
  tal cual y el modelo detecta el idioma solo.
- **«Judito Ads» va separado** para que no lo lea «Judito A-D-S». Si aun así
  lo dice raro, prueba «Hoodito Ads» o como tú lo pronuncias. Eso solo cambia
  lo que lee ElevenLabs; el video sigue diciendo JuditoADS.
- **Los números van en letras** («twenty dollars», «fourteen days»), para que
  no los lea de otra forma.
- **Las frases son cortas a propósito.** El inglés tiene menos sílabas por
  segundo que el español, así que se acortaron las que no cabían. Por ejemplo,
  la de los cuatro pasos quedó en «Yourself, in four steps».

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
   el reproductor). Debe durar unos 7,5 s. Con esta tabla eliges la
   velocidad para todos los bloques; si cambia, vuelve a generar el 1:

| Si el bloque 1 dura | Velocidad para los 7 bloques |
| --- | --- |
| menos de 6,7 s | 0,95 |
| de 6,7 a 7,0 s | 1,0 (así está bien) |
| de 7,0 a 7,3 s | 1,05 |
| de 7,3 a 7,7 s | 1,1 |
| más de 7,7 s | 1,15, y avísame: hay que acortar frases |

4. **Genera los otros bloques** con la misma velocidad y baja cada uno en MP3:
   `bloque-1.mp3` a `bloque-7.mp3`. Si una frase sale rara, repite solo ese
   bloque.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Five cents** y, en «Subir una
versión nueva o tu voz», elige los 7 MP3 a la vez. Después dime **«calza la
voz de Five cents»**. Corto cada bloque en sus frases, pongo cada una en el
segundo exacto de su escena (si alguna se pasa, la acelero hasta un 12 %),
bajo la música cuando hablas y te dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

- **Cada bloque va en el segundo que dice su título,** no uno detrás del otro.
- **Si una frase se ve corrida,** corta el audio en el silencio que tiene antes
  y muévela al segundo de su escena (tabla del final).

## Bloque 1 · va en 0:00,0 · dura unos 7,5 s

```
This ad reached you for under five cents. <break time="0.5s" />
Stick around: I'll show you how, no guru... <break time="0.3s" />
or ten overpriced courses.
```

## Bloque 2 · va en 0:08,8 · dura unos 9,4 s

```
I made it in Miami, one of the toughest markets out there. <break time="0.4s" />
Judito Ads: five years in one app. <break time="0.4s" />
It finds the people who really buy.
```

## Bloque 3 · va en 0:18,5 · dura unos 3,0 s

```
It gets crazier... <break time="0.4s" />
Yourself, in four steps.
```

## Bloque 4 · va en 0:21,9 · dura unos 7,5 s

```
One: sign in to the app. <break time="0.3s" />
Two: connect your Facebook. <break time="0.9s" />
Three: create a new ad... or boost a post.
```

## Bloque 5 · va en 0:29,7 · dura unos 5,8 s

```
Four: set your budget... and you decide. <break time="1.0s" />
Done! Your ad is now in Meta.
```

## Bloque 6 · va en 0:36,3 · dura unos 7,5 s

```
What nobody tells you... <break time="0.4s" />
Judito tells you. <break time="0.8s" />
Tips that really work... <break time="0.8s" />
and watches your ads for you.
```

## Bloque 7 · va en 0:44,1 · dura unos 10,6 s

```
Twenty dollars a month... what a burger costs. <break time="1.1s" />
Made it this far? Try it free. <break time="0.6s" />
Fourteen days, no card. Need help getting started? Message me.
```

## Cada frase en su escena

La columna «Voz» es lo que tarda cada frase a 4,2 sílabas por segundo, el
ritmo de una voz en inglés que habla con energía. Todas caben en su escena.

| Escena | Lo que se ve | Voz | Frase | Quiere decir | Cómo decirla |
| --- | --- | --- | --- | --- | --- |
| 0:00,0 – 0:02,6 | La moneda de 5¢ | 2,1 s | This ad reached you for under five cents. | Este anuncio te llegó por menos de cinco centavos. | Con picardía, sonriendo, como quien cuenta un truco. |
| 0:02,6 – 0:05,8 | El genio sale de la lámpara y cae el sello NO | 2,9 s | Stick around: I'll show you how, no guru... | Quédate: te enseño cómo, sin gurú... | Cercano; más bajo en «no guru». |
| 0:05,8 – 0:08,8 | La torre de cursos: $6,823 y 134 horas | 1,7 s | or ten overpriced courses. | ni diez cursos carísimos. | Con un poco de burla en «overpriced». Después suena la caja registradora. |
| 0:08,8 – 0:13,3 | El vuelo de la Tierra a la oficina | 4,1 s | I made it in Miami, one of the toughest markets out there. | Lo logré en Miami, uno de los mercados más difíciles. | Con orgullo, subiendo la energía. |
| 0:13,3 – 0:16,1 | «And I built…» y el logo de JuditoADS | 2,4 s | Judito Ads: five years in one app. | JuditoADS: cinco años en una app. | Firme. Marca «five years». |
| 0:16,1 – 0:18,5 | La mira encuentra a una persona | 2,1 s | It finds the people who really buy. | Encuentra a la gente que sí compra. | Seguro. |
| 0:18,5 – 0:20,1 | «But wait, it gets crazier…» | 1,2 s | It gets crazier... | Y se pone más loco... | Más lento y más bajo, como un secreto. |
| 0:20,1 – 0:21,9 | «You launch it yourself. In 4 steps:» | 1,4 s | Yourself, in four steps. | Tú mismo, en cuatro pasos. | Vuelve la energía. |
| 0:21,9 – 0:23,9 | Paso 1: la pantalla de entrada | 1,7 s | One: sign in to the app. | Uno: entra a la app. | Claro y práctico, con un golpe en cada número. |
| 0:23,9 – 0:26,5 | Paso 2: el panel y tus cuentas | 1,7 s | Two: connect your Facebook. | Dos: conecta tu Facebook. | Igual. |
| 0:26,5 – 0:29,7 | Paso 3: el marco salta de una opción a la otra | 2,9 s | Three: create a new ad... or boost a post. | Tres: crea un anuncio nuevo... o promociona un post. | «Or boost a post» cuando salta el marco. |
| 0:29,7 – 0:33,3 | Paso 4: el presupuesto y el sello «You decide» | 2,6 s | Four: set your budget... and you decide. | Cuatro: pon tu presupuesto... y tú decides. | «You decide» cuando cae el sello. |
| 0:33,3 – 0:36,3 | «Done! Your ad is now in Meta.» | 2,2 s | Done! Your ad is now in Meta. | ¡Listo! Tu anuncio ya está en Meta. | Alegre. |
| 0:36,3 – 0:38,1 | «And what comes next, almost nobody tells you…» | 1,4 s | What nobody tells you... | Lo que nadie te dice... | Bajito, de secreto. |
| 0:38,1 – 0:40,1 | «Judito tells you:» y el primer consejo | 1,2 s | Judito tells you. | Judito te lo dice. | Con complicidad, subiendo. |
| 0:40,1 – 0:42,1 | El segundo consejo | 1,2 s | Tips that really work... | Consejos que sí funcionan... | Pausado: que se lean las tarjetas. |
| 0:42,1 – 0:44,1 | El tercer consejo | 1,7 s | and watches your ads for you. | y vigila tus anuncios por ti. | Tranquilo. |
| 0:44,1 – 0:48,1 | $20 al mes, la hamburguesa y «14 days FREE» | 2,9 s | Twenty dollars a month... what a burger costs. | Veinte dólares al mes... lo que cuesta una hamburguesa. | Con orgullo, sin gritar. Marca «twenty dollars». |
| 0:48,1 – 0:50,6 | «If you made it this far, try it free»; el dedo toca el botón | 1,9 s | Made it this far? Try it free. | ¿Llegaste hasta aquí? Pruébalo gratis. | Directo, como hablándole a una sola persona. |
| 0:50,6 – 0:56,1 | Tu @ y tu WhatsApp | 4,1 s | Fourteen days, no card. Need help getting started? Message me. | Catorce días, sin tarjeta. ¿Necesitas ayuda para empezar? Escríbeme. | Cálido, el tono más humano del video. Sonriendo. |
