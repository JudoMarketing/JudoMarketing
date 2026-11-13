# «Count your yeses» · guion para ElevenLabs

Es el guion del video en inglés «Count your yeses» (las 6 preguntas de «Turn
off your phone», 54 segundos), para tu voz clonada en ElevenLabs. Pedido tuyo
del 13 de noviembre de 2026 en la Biblioteca: «las voces deben coincidir con
el timing del video».

**Cómo se hizo para que calce:**

- **Cada frase empieza en su escena** y dice lo que muestra la pantalla en ese
  segundo (la tabla del final lo pone lado a lado).
- **Las escenas se midieron contra la voz antes de renderizar.** Una frase no
  cabía (la de los anuncios): se acortó la frase y la escena pasó de 4,2 a
  4,8 s.
- **En la lista de arreglos, cada arreglo se dice cuando entra su tarjeta.**
  Las pausas del bloque 6 están puestas para eso.
- **Se probó antes de entregarlo:** un borrador con una voz de prueba puesta
  en el video, transcrito para comprobar que se entiende y cae en su escena.
  Está en la Biblioteca como «Borrador con voz de prueba».

## Todo el texto seguido (para leerlo de corrido)

> Turn off your phone. Is your business still selling? Six questions. Count
> your yeses. One: is your contact form full of bots? Two: to change a price,
> do you wait on someone? Number three made the news… PHP2Shell. Seven in ten
> sites run PHP. Is yours patched? Four: when you don't answer, do sales
> stop? Five costs less than you think… Want ads, but don't know where to
> start? Test with five dollars a day. Six: how many people visited your site
> this week? Every yes has a fix. Bot-proof forms. Prices you change. No PHP,
> daily backups. Juditos that answer. Guided ads. Your visits, in your portal.
> All of this is fixed one chat away. Said yes to any? Message us on WhatsApp.

## Antes de generar

- **Tu voz clonada habla inglés** con Eleven Multilingual v2: pega el texto
  tal cual y el modelo detecta el idioma solo.
- **«PHP2Shell» y «PHP»** se dicen letra por letra: «P-H-P two shell». Si
  ElevenLabs lo lee junto, escríbelo así en el bloque 3: `P H P two Shell`.
  Eso solo cambia lo que lee ElevenLabs; la pantalla sigue diciendo PHP2Shell.
- **«Juditos»** se dice como en español. Si lo lee raro, escríbelo como lo
  pronuncias («Hooditos»).
- **Los números van en letras** («six questions», «five dollars»).
- **Son 7 bloques.** Cada uno empieza en un cambio de escena y ninguno pasa de
  11 segundos, para que una diferencia de ritmo no se vaya sumando.

## Cómo generarlo

1. **Modelo:** Eleven Multilingual v2, que respeta las pausas
   `<break time="…" />`. Si usas Eleven v3, borra esas etiquetas.
2. **Ajustes de la voz:**
   - Estabilidad: 45 %.
   - Similitud: 80 %.
   - Exageración de estilo: entre 10 y 20 % (este video juega más que los de
     JuditoADS).
   - Speaker boost: encendido.
   - Velocidad: 1,0 para empezar.
3. **Genera solo el bloque 6 y mira cuánto dura** (ElevenLabs lo muestra en
   el reproductor). Es el más largo y el que más tiene que calzar: debe durar
   unos 10 s. Con esta tabla eliges la velocidad para todos los bloques; si
   cambia, vuelve a generar el 6:

| Si el bloque 6 dura | Velocidad para los 7 bloques |
| --- | --- |
| menos de 9 s | 0,95 |
| de 9 a 10,4 s | 1,0 (así está bien) |
| de 10,4 a 10,8 s | 1,05 |
| de 10,8 a 11,4 s | 1,1 |
| más de 11,4 s | 1,15, y avísame: hay que acortar frases |

4. **Genera los otros bloques** con la misma velocidad y baja cada uno en MP3:
   `bloque-1.mp3` a `bloque-7.mp3`. Si una frase sale rara, repite solo ese
   bloque.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Count your yeses** y, en «Subir una
versión nueva o tu voz», elige los 7 MP3 a la vez. Después dime **«calza la
voz de Count your yeses»**. Corto cada bloque en sus frases, pongo cada una en
el segundo exacto de su escena (si alguna se pasa, la acelero hasta un 12 %),
bajo la música cuando hablas y te dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

- **Cada bloque va en el segundo que dice su título,** no uno detrás del otro.
- **Si una frase se ve corrida,** corta el audio en el silencio que tiene antes
  y muévela al segundo de su escena (tabla del final).

## Bloque 1 · va en 0:00,0 · dura unos 7,3 s

```
Turn off your phone. <break time="1.4s" />
Is your business still selling? <break time="1.3s" />
Six questions. Count your yeses.
```

## Bloque 2 · va en 0:08,4 · dura unos 6,7 s

```
One: is your contact form full of bots? <break time="1.2s" />
Two: to change a price, do you wait on someone?
```

## Bloque 3 · va en 0:15,6 · dura unos 5,2 s

```
Number three made the news… <break time="0.4s" />
PHP2Shell. Seven in ten sites run PHP. Is yours patched?
```

## Bloque 4 · va en 0:22,2 · dura unos 5,1 s

```
Four: when you don't answer, do sales stop? <break time="1.0s" />
Five costs less than you think…
```

## Bloque 5 · va en 0:27,6 · dura unos 8,1 s

```
Want ads, but don't know where to start? Test with five dollars a day. <break time="0.7s" />
Six: how many people visited your site this week?
```

## Bloque 6 · va en 0:36,0 · dura unos 10 s

```
Every yes has a fix. <break time="0.2s" />
Bot-proof forms. <break time="0.2s" />
Prices you change. <break time="0.2s" />
No PHP, daily backups. <break time="0.1s" />
Juditos that answer. <break time="0.1s" />
Guided ads. <break time="0.1s" />
Your visits, in your portal.
```

## Bloque 7 · va en 0:46,8 · dura unos 5 s

```
All of this is fixed one chat away. <break time="0.5s" />
Said yes to any? Message us on WhatsApp.
```

## Cada frase en su escena

«Voz de prueba» es lo que tardó cada frase en el borrador, ya puesta en el
video. Todas caben; la de «#5» va justa (1,7 s de 1,8) y el calce la acelera
un 1 %, que no se nota.

| Escena | Lo que se ve | Voz de prueba | Frase | Quiere decir | Cómo decirla |
| --- | --- | --- | --- | --- | --- |
| 0:00,0 – 0:02,4 | «Turn off your phone.»: el botón rojo se desliza y la pantalla se apaga (0:01,2) | 1,0 s | Turn off your phone. | Apaga tu teléfono. | Tranquilo, casi un reto en voz baja. Termina en «phone», cuando la pantalla se pone negra. |
| 0:02,4 – 0:05,4 | «Is your business still selling?»: la tienda a las 11:47 PM; el letrero pasa de OPEN a CLOSED (0:03,9) | 1,6 s | Is your business still selling? | ¿Tu negocio sigue vendiendo? | Pregunta de verdad. Sube en «still selling». |
| 0:05,4 – 0:08,4 | «6 questions. Count your yeses.»: seis fichas y «Yes / No» | 2,0 s | Six questions. Count your yeses. | Seis preguntas. Cuenta tus «sí». | Sube la energía, como quien empieza un juego. |
| 0:08,4 – 0:12,0 | Pregunta 1: la bandeja llega a 38 mensajes de bots y la clienta real se enciende | 2,4 s | One: is your contact form full of bots? | Uno: ¿tu formulario de contacto está lleno de bots? | Ligero, con algo de gracia. «One» en el golpe. |
| 0:12,0 – 0:15,6 | Pregunta 2: el chat del lunes al jueves y el reloj de arena | 2,8 s | Two: to change a price, do you wait on someone? | Dos: para cambiar un precio, ¿esperas a alguien? | Un poco cansado en «wait on someone», como quien ya lo vivió. |
| 0:15,6 – 0:17,4 | «#3 made the news…» y el periódico que llega girando | 1,3 s | Number three made the news… | La número tres salió en las noticias… | Más bajo y lento. Déjala colgando: la música se queda sola. |
| 0:17,4 – 0:22,2 | Pregunta 3: la alerta PHP2Shell, 9,2 de 10, y «7 in 10 websites run PHP» | 4,5 s | PHP2Shell. Seven in ten sites run PHP. Is yours patched? | PHP2Shell. Siete de cada diez sitios usan PHP. ¿El tuyo tiene el parche? | Serio y claro. «P-H-P two shell» despacio. Marca «patched». |
| 0:22,2 – 0:25,8 | Pregunta 4: el teléfono bloqueado a las 11:47 y dos mensajes sin responder | 2,5 s | Four: when you don't answer, do sales stop? | Cuatro: cuando no contestas, ¿se paran las ventas? | Cercano, un poco preocupado. |
| 0:25,8 – 0:27,6 | «#5 costs less than you think…» y la etiqueta de precio | 1,7 s | Five costs less than you think… | La cinco cuesta menos de lo que crees… | Secreto con sonrisa, y rápido: la escena dura 1,8 s. La música se vuelve a quedar sola. |
| 0:27,6 – 0:32,4 | Pregunta 5: el presupuesto sube a $5 al día, Miami · 10 mi, el dedo toca «Publish ad» (0:30,4) | 3,8 s | Want ads, but don't know where to start? Test with five dollars a day. | ¿Quieres anuncios pero no sabes por dónde empezar? Prueba con cinco dólares al día. | Vuelve la energía. «Five dollars a day» cuando el dedo toca el botón. |
| 0:32,4 – 0:36,0 | Pregunta 6: el tablero de visitas vacío, el «?» y «You're paying blind.» | 2,7 s | Six: how many people visited your site this week? | Seis: ¿cuánta gente visitó tu sitio esta semana? | Curioso, pregunta de verdad. Pausa corta después de «six». |
| 0:36,0 – 0:46,8 | «Every yes has a fix.» y las 6 tarjetas: formularios 0:37,7; precios 0:38,6; PHP 0:39,7; Juditos 0:41,6; anuncios 0:43,2; visitas 0:44,0 | 9,0 s | Every yes has a fix. Bot-proof forms. Prices you change. No PHP, daily backups. Juditos that answer. Guided ads. Your visits, in your portal. | Cada sí tiene arreglo. Formularios sin bots. Precios que cambias tú. Sin PHP, con copias diarias. Juditos que contestan. Anuncios guiados. Tus visitas, en tu portal. | Seguro y cálido. Di cada arreglo cuando entra su tarjeta. |
| 0:46,8 – 0:54,0 | «All of this is fixed one chat away.»; después «Said yes to any? Message us.» con WhatsApp, la web y el Instagram (0:49,8) | 4,0 s | All of this is fixed one chat away. Said yes to any? Message us on WhatsApp. | Todo esto se arregla a un chat de distancia. ¿Dijiste que sí a alguna? Escríbenos por WhatsApp. | El tono más humano del video. Pausa antes de «Said yes to any?», cuando cambia la pantalla. |
