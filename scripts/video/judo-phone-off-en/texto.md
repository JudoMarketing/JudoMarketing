# «Count your yeses» (video en inglés de Judo Marketing)

Pedido de Junior en la Biblioteca el 13 de noviembre de 2026, sobre el
carrusel «Turn off your phone»: un video con la misma estructura de todos (8
piezas), diseño de primera con muchos vectores y sombras, en inglés, y con un
guion para ElevenLabs que calce con los tiempos del video.

Dura 54 segundos, 13 escenas. Las 6 preguntas, los datos y las respuestas
son los del carrusel (`scripts/carrusel/judo-preguntas-en/texto.md`).

## El guion en 8 piezas

| Pieza | Segundos | En pantalla | Voz |
| --- | --- | --- | --- |
| 1 · Gancho | 0:00 – 0:05,4 | «Turn off your phone.» (el teléfono se apaga) y «Is your business still selling?» (el letrero pasa de OPEN a CLOSED) | Turn off your phone. Is your business still selling? |
| 2 · Introducción | 0:05,4 – 0:08,4 | «6 questions. Count your yeses.» | Six questions. Count your yeses. |
| 3 · Cuerpo 1 | 0:08,4 – 0:15,6 | Pregunta 1: el formulario lleno de bots. Pregunta 2: esperar a alguien para cambiar un precio | One: is your contact form full of bots? Two: to change a price, do you wait on someone? |
| 4 · Bucle | 0:15,6 – 0:17,4 | «#3 made the news…» | Number three made the news… |
| 5 · Cuerpo 2 | 0:17,4 – 0:25,8 | Pregunta 3: PHP2Shell, 9,2 de 10, 7 de cada 10 sitios usan PHP. Pregunta 4: los mensajes sin responder a las 11:47 | PHP2Shell. Seven in ten sites run PHP. Is yours patched? Four: when you don't answer, do sales stop? |
| 6 · Bucle | 0:25,8 – 0:27,6 | «#5 costs less than you think…» | Five costs less than you think… |
| 7 · Cuerpo 3 | 0:27,6 – 0:46,8 | Pregunta 5: anuncios desde $5 al día. Pregunta 6: las visitas que nadie mide. «Every yes has a fix.» y las 6 respuestas | Want ads, but don't know where to start? Test with five dollars a day. Six: how many people visited your site this week? Every yes has a fix… |
| 8 · Llamado | 0:46,8 – 0:54,0 | «All of this is fixed one chat away.» y «Said yes to any? Message us.» con WhatsApp, web e Instagram | All of this is fixed one chat away. Said yes to any? Message us on WhatsApp. |

## Lo que cambió respecto del carrusel

- **Los bucles nombran el número** («#3 made the news…», «#5 costs less than
  you think…») porque el video lleva arriba el rastreador «Question 3 / 6»: así
  el bucle y el rastreador cuentan lo mismo.
- **La pregunta 1 dice «full of bots»** y no «flooded with bot messages»: es
  más corta y cabe en tres líneas grandes.
- **Los $5 al día** son los de la versión en inglés del carrusel (pedido de
  Junior del 30 de octubre). Están por encima del mínimo de $1 de Meta.

## Pie de video

```
Turn off your phone for a day. Does your business keep selling? 👇

6 quick questions: bots in your contact form, waiting on someone to change a price, October’s PHP flaw, unanswered messages, ads and website visits.
Count your yeses. Every yes has a fix.

Message us on WhatsApp: +1 305 934 9981. We’ll tell you honestly if we can help.

How many yeses did you get?

#MiamiBusiness #MiamiSmallBusiness #SmallBusinessTips #MiamiEntrepreneur
```

## Los otros cuatro ganchos

1. «6 questions. Count your yeses.» (empieza por el juego).
2. «38 messages in your inbox. One is a real customer.» (la bandeja de bots).
3. «7 in 10 websites run PHP. Is yours patched?» (la noticia de octubre).
4. «It’s 11:47 PM. Two customers are waiting.» (la pantalla bloqueada).

## De dónde sale cada dato

- **7 de cada 10 sitios usan PHP:** W3Techs (en pantalla dice «Source:
  W3Techs»).
- **PHP2Shell, crítica, 9,2 de 10, 21 de octubre de 2026:** los boletines que
  usó el carrusel.
- **Las 6 respuestas:** el código de Judo y de JuditoADS, igual que en el
  carrusel.
- **La bandeja, el chat, la pantalla bloqueada, el anuncio y el tablero** son
  ejemplos dibujados; el anuncio lleva la etiqueta «Example».

## Cómo se cambia

```bash
cd scripts/video/judo-phone-off-en
python3 armar.py && python3 build.py && node revisar.mjs   # «Sin problemas de texto»
node render.mjs --hilos 4                                  # o solo las escenas que cambian: node render.mjs e05
python3 musica.py && python3 sfx.py && python3 montar.py Judo-turn-off-your-phone && python3 qa.py salida/Judo-turn-off-your-phone.mp4
python3 calzar-voz.py voz.json --guion                     # la voz: ninguna frase «NO CABE»
```

Los estilos propios están en `diseno.css`; los dibujos (teléfono, tienda,
reloj de arena, periódico, etiqueta, mapa y globo) en `armar.py`.
