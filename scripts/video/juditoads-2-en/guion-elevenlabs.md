# «Five cents» · guion para ElevenLabs en inglés (versión 4)

Es el guion de la versión en inglés de «Cinco centavos» (video 2 de
JuditoADS, 56 segundos), para tu voz clonada en ElevenLabs.

**Qué cambió en la versión 4** (pedido tuyo del 12 de noviembre de 2026 en la
Biblioteca: «los textos no completan el mensaje, parece que se cortan a
medias»):

- **Cada frase es una idea completa** y dice lo que la pantalla muestra en ese
  segundo. Ya no hay frases colgadas como «no guru...», «It gets crazier...»
  o «Yourself, in four steps».
- **Los consejos de Judito ahora son los de las tarjetas**: la oferta manda,
  tres anuncios y no uno, y no tocarlos en tres días. Antes la voz decía
  «Tips that really work» mientras la tarjeta decía otra cosa.
- **El precio dice la verdad completa**: veinte al mes, «plus ad spend» (lo que
  pagas a Meta va aparte, como dice la pantalla).
- **Quité «no card»**: la pantalla no lo dice y no lo pude comprobar.
- **Se probó antes de entregarlo**: armé un borrador con una voz de prueba
  puesta en el video, cada frase en el segundo de su escena, y lo transcribí
  para comprobar que se entiende y que cae sobre su imagen. Está en la
  Biblioteca como «Borrador con voz de prueba».

## Todo el texto seguido (para leerlo de corrido)

> This ad reached you for under five cents. Stay, I'll show you how. No guru
> needed. No ten courses for nearly seven grand. My agency is in Miami, one
> of the toughest markets. I built Judito Ads: five years in one app. It finds
> the people who really buy. And it gets crazier. Launch it yourself in four
> steps. One: sign in to the app. Two: connect your Facebook account. Three:
> create a new ad, or boost a post. Four: set your budget. You decide. Done!
> Your ad is now in Meta. No one tells you what's next. Judito does. Your
> offer wins. Launch three ads, not one. Then don't touch them for three days.
> Twenty bucks a month, like a burger, plus ad spend. Made it this far? Try it
> free. Need help getting started? Follow me, or message me on WhatsApp.

## Antes de generar

- **Tu voz clonada habla inglés** con Eleven Multilingual v2: pega el texto
  tal cual y el modelo detecta el idioma solo.
- **«Judito Ads» va separado** para que no lo lea «Judito A-D-S». Si aun así
  lo dice raro, escríbelo como tú lo pronuncias («Hoodito Ads»). Eso solo
  cambia lo que lee ElevenLabs; el video sigue diciendo JuditoADS.
- **Los números van en letras** («five cents», «twenty bucks»), para que no
  los lea de otra forma.
- **Son 8 bloques**, cada uno empieza en un cambio de escena y ninguno pasa de
  10 segundos, para que una diferencia de ritmo no se vaya sumando.

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
   el reproductor). Debe durar unos 8 s. Con esta tabla eliges la velocidad
   para todos los bloques; si cambia, vuelve a generar el 1:

| Si el bloque 1 dura | Velocidad para los 8 bloques |
| --- | --- |
| menos de 7,4 s | 0,95 |
| de 7,4 a 8,4 s | 1,0 (así está bien) |
| de 8,4 a 8,8 s | 1,05 |
| de 8,8 a 9,3 s | 1,1 |
| más de 9,3 s | 1,15, y avísame: hay que acortar frases |

4. **Genera los otros bloques** con la misma velocidad y baja cada uno en MP3:
   `bloque-1.mp3` a `bloque-8.mp3`. Si una frase sale rara, repite solo ese
   bloque.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Five cents** y, en «Subir una
versión nueva o tu voz», elige los 8 MP3 a la vez. Después dime **«calza la
voz de Five cents»**. Corto cada bloque en sus frases, pongo cada una en el
segundo exacto de su escena (si alguna se pasa, la acelero hasta un 12 %),
bajo la música cuando hablas y te dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

- **Cada bloque va en el segundo que dice su título,** no uno detrás del otro.
- **Si una frase se ve corrida,** corta el audio en el silencio que tiene antes
  y muévela al segundo de su escena (tabla del final).

## Bloque 1 · va en 0:00,0 · dura unos 8 s

```
This ad reached you for under five cents. <break time="0.5s" />
Stay, I'll show you how. No guru needed. <break time="0.3s" />
No ten courses for nearly seven grand.
```

## Bloque 2 · va en 0:08,8 · dura unos 9,8 s

```
My agency is in Miami, one of the toughest markets. <break time="0.4s" />
I built Judito Ads: five years in one app. <break time="0.3s" />
It finds the people who really buy.
```

## Bloque 3 · va en 0:18,5 · dura unos 3,4 s

```
And it gets crazier. <break time="0.3s" />
Launch it yourself in four steps.
```

## Bloque 4 · va en 0:21,9 · dura unos 7,5 s

```
One: sign in to the app. <break time="0.3s" />
Two: connect your Facebook account. <break time="0.4s" />
Three: create a new ad, or boost a post.
```

## Bloque 5 · va en 0:29,7 · dura unos 5,8 s

```
Four: set your budget. You decide. <break time="1.2s" />
Done! Your ad is now in Meta.
```

## Bloque 6 · va en 0:36,3 · dura unos 7,7 s

```
No one tells you what's next. <break time="0.4s" />
Judito does. Your offer wins. <break time="0.3s" />
Launch three ads, not one. <break time="0.3s" />
Then don't touch them for three days.
```

## Bloque 7 · va en 0:44,1 · dura unos 3,4 s

```
Twenty bucks a month, like a burger, plus ad spend.
```

## Bloque 8 · va en 0:48,1 · dura unos 6,8 s

```
Made it this far? Try it free. <break time="0.6s" />
Need help getting started? Follow me, or message me on WhatsApp.
```

## Cada frase en su escena

«Voz de prueba» es lo que tardó cada frase en el borrador, ya puesta en el
video. Dos frases se pasan una o dos décimas de su escena y el calce las
acelera un poco (hasta un 12 %, no se nota).

| Escena | Lo que se ve | Voz de prueba | Frase | Quiere decir | Cómo decirla |
| --- | --- | --- | --- | --- | --- |
| 0:00,0 – 0:02,6 | «This ad reached you for under 5¢» y la moneda | 1,9 s | This ad reached you for under five cents. | Este anuncio te llegó por menos de cinco centavos. | Con picardía, sonriendo, como quien cuenta un truco. |
| 0:02,6 – 0:05,8 | «Stick around: I'll show you how, no guru needed»; el sello NO cae sobre el genio | 2,4 s | Stay, I'll show you how. No guru needed. | Quédate, te enseño cómo. Sin gurú. | Cercano. Firme en «no guru needed», cuando cae el sello. |
| 0:05,8 – 0:08,8 | «Or paying for 10 courses»: la torre de cursos y $6,823 | 2,3 s | No ten courses for nearly seven grand. | Ni diez cursos por casi siete mil dólares. | Con un poco de burla en «nearly seven grand». Después suena la caja registradora. |
| 0:08,8 – 0:13,3 | El vuelo de la Tierra a la oficina: «My agency is in Miami» | 3,0 s | My agency is in Miami, one of the toughest markets. | Mi agencia está en Miami, uno de los mercados más difíciles. | Con orgullo, subiendo la energía. |
| 0:13,3 – 0:16,1 | «And I built…», el logo y «5 years of experience, packed into an app» | 2,7 s | I built Judito Ads: five years in one app. | Creé JuditoADS: cinco años en una app. | Firme. Marca «five years». |
| 0:16,1 – 0:18,5 | «It finds the people who actually buy»; la mira elige a una persona | 1,8 s | It finds the people who really buy. | Encuentra a la gente que sí compra. | Seguro. |
| 0:18,5 – 0:20,1 | «But wait, it gets crazier…» | 1,1 s | And it gets crazier. | Y se pone más loco. | Más lento y más bajo, como un secreto. |
| 0:20,1 – 0:21,9 | «You launch it yourself. In 4 steps:» y los números 1 a 4 | 2,0 s | Launch it yourself in four steps. | Lánzalo tú mismo en cuatro pasos. | Vuelve la energía. |
| 0:21,9 – 0:23,9 | Paso 1: la pantalla de entrada | 1,4 s | One: sign in to the app. | Uno: entra a la app. | Claro y práctico, con un golpe en cada número. |
| 0:23,9 – 0:26,5 | Paso 2: «Connect your Facebook» y tus cuentas | 1,7 s | Two: connect your Facebook account. | Dos: conecta tu cuenta de Facebook. | Igual. |
| 0:26,5 – 0:29,7 | Paso 3: el marco salta de «New creative» a «A post I already have» | 2,4 s | Three: create a new ad, or boost a post. | Tres: crea un anuncio nuevo, o promociona un post. | «Or boost a post» cuando salta el marco. |
| 0:29,7 – 0:33,3 | Paso 4: «Set your budget: daily or total» y el sello «You decide» | 2,0 s | Four: set your budget. You decide. | Cuatro: pon tu presupuesto. Tú decides. | «You decide» cuando cae el sello. |
| 0:33,3 – 0:36,3 | «Done! Your ad is now in Meta.» y el confeti | 1,3 s | Done! Your ad is now in Meta. | ¡Listo! Tu anuncio ya está en Meta. | Alegre. |
| 0:36,3 – 0:38,1 | «And what comes next, almost nobody tells you…» | 1,5 s | No one tells you what's next. | Lo que sigue, nadie te lo dice. | Bajito, de secreto. |
| 0:38,1 – 0:40,1 | «Judito tells you:» y el consejo 1, «Your offer beats your audience» | 2,2 s | Judito does. Your offer wins. | Judito sí. Tu oferta es lo que gana. | Con complicidad, subiendo. |
| 0:40,1 – 0:42,1 | Consejo 2: «Three ads, not one» | 1,4 s | Launch three ads, not one. | Lanza tres anuncios, no uno. | Claro, de consejo de amigo. |
| 0:42,1 – 0:44,1 | Consejo 3: «Don't touch it for three days» | 1,8 s | Then don't touch them for three days. | Y no los toques en tres días. | Tranquilo, sonriendo. |
| 0:44,1 – 0:48,1 | $20 al mes, la hamburguesa, «14 days FREE» y «+ your ad budget, paid straight to Meta» | 2,9 s | Twenty bucks a month, like a burger, plus ad spend. | Veinte al mes, como una hamburguesa, más lo que inviertes en anuncios. | Con orgullo, sin gritar. Marca «twenty bucks»; «plus ad spend» más ligero. |
| 0:48,1 – 0:50,6 | «If you made it this far, try it free»; el dedo toca el botón | 1,6 s | Made it this far? Try it free. | ¿Llegaste hasta aquí? Pruébalo gratis. | Directo, como hablándole a una sola persona. |
| 0:50,6 – 0:56,1 | «Need help getting started? Follow me or message me:», tu @ y tu WhatsApp | 3,4 s | Need help getting started? Follow me, or message me on WhatsApp. | ¿Necesitas ayuda para empezar? Sígueme o escríbeme por WhatsApp. | Cálido, el tono más humano del video. Sonriendo. |
