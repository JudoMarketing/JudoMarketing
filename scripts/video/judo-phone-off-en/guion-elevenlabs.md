# «Count your yeses» · guion para ElevenLabs, un clip por escena

Es el guion de la voz del video en inglés «Count your yeses» v3 (72 segundos,
16 escenas), para tu voz clonada en ElevenLabs. Lo hizo Vendito el 14 de
noviembre de 2026.

## Por qué la voz va en un clip por escena

- **Antes iba en bloques largos con pausas `<break>`.** La voz de prueba
  calzaba porque habla rápido y parejo. ElevenLabs habla más lento (de 3,3 a
  4,3 sílabas por segundo), y cada frase un poco más larga empujaba a todas
  las que venían detrás en el mismo bloque. Al final del bloque, el atraso ya
  se notaba.
- **Ahora va en 16 clips, uno por escena, sin pausas adentro.** Cada clip
  empieza en el segundo exacto de su escena, así que un clip largo no puede
  atrasar al siguiente.
- **Las frases se escribieron para la voz lenta.** Se midieron a
  3,3 sílabas por segundo y ninguna ocupa más del
  85 % de su escena: si tu voz sale un
  poco más lenta, todavía cabe.

## Todo el texto seguido (para leerlo de corrido)

> Turn off your phone. Is your business still selling? Three questions. Count your yeses. Texts at night. Anyone answering? More calls and orders than you can handle? Then what happens… By morning, they hired your competitor. Ready to invest… but not sure where it works best? Here's the good news. Every yes has a fix. We handle all three. We run your social media and ads. Ad budgets from five dollars a day. Before you spend a dollar: our ninety-nine dollar audit. We compare you to your competitors and give you a plan with deadlines. Sites we built for real businesses. Our promise: better service than you have now. A real person. Said yes to any? Get your audit at judomarketing.net.

## Antes de generar

- **Modelo:** Eleven Multilingual v2. No pongas `<break>`: cada clip es una
  sola frase.
- **Ajustes de la voz, iguales en los 16 clips:**
  - Estabilidad: 45 %.
  - Similitud: 80 %.
  - Exageración de estilo: entre 10 y 20 %.
  - Speaker boost: encendido.
  - Velocidad: 1,0.
- **Los números van en letras** («five dollars», «ninety-nine dollar»), y la
  web se dice «judo marketing dot net». Si ElevenLabs lee raro
  «judomarketing.net», escríbelo así: `Judo Marketing dot net`.

## Cómo generarlo

1. **Primero genera solo el clip 11** (el más largo) y mira cuánto
   dura en el reproductor de ElevenLabs. Debe durar **7,1 s o
   menos**.
   - Si dura **7,1 s o menos:** perfecto, sigue con velocidad
     1,0.
   - Si dura **de 7,1 a 7,8 s:** sube
     la velocidad a 1,1 y genéralo otra vez.
   - Si dura **más de 7,8 s:** avísame. Hay que acortar
     frases (las escenas no se alargan).
2. **Genera los otros clips** con los mismos ajustes y la misma velocidad. Si
   un clip sale raro, repite solo ese.
3. **Baja cada clip en MP3 con el nombre de la tabla.** El número de adelante
   es la escena y el segundo del medio es donde va.

## La línea de tiempo

«Largo ideal» es lo que debería durar el clip con tu voz. «Máximo» es lo más
que puede durar sin pisar la escena siguiente.

| Clip | Empieza en | Largo ideal | Máximo | Texto | Archivo |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00,0 | 1,2 s | **2,9 s** | Turn off your phone. | `01_000.0_turn-off.mp3` |
| 2 | 0:03,0 | 2,1 s | **2,9 s** | Is your business still selling? | `02_003.0_still-selling.mp3` |
| 3 | 0:06,0 | 2,4 s | **2,9 s** | Three questions. Count your yeses. | `03_006.0_three-questions.mp3` |
| 4 | 0:09,0 | 2,7 s | **3,5 s** | Texts at night. Anyone answering? | `04_009.0_texts-night.mp3` |
| 5 | 0:12,6 | 3,0 s | **4,1 s** | More calls and orders than you can handle? | `05_012.6_more-calls.mp3` |
| 6 | 0:16,8 | 1,2 s | **1,7 s** | Then what happens… | `06_016.8_what-happens.mp3` |
| 7 | 0:18,6 | 3,3 s | **4,7 s** | By morning, they hired your competitor. | `07_018.6_by-morning.mp3` |
| 8 | 0:23,4 | 3,9 s | **5,3 s** | Ready to invest… but not sure where it works best? | `08_023.4_ready-invest.mp3` |
| 9 | 0:28,8 | 1,2 s | **1,7 s** | Here's the good news. | `09_028.8_good-news.mp3` |
| 10 | 0:30,6 | 3,6 s | **4,7 s** | Every yes has a fix. We handle all three. | `10_030.6_every-yes.mp3` |
| 11 | 0:35,4 | 5,7 s | **7,1 s** | We run your social media and ads. Ad budgets from five dollars a day. | `11_035.4_social-media.mp3` |
| 12 | 0:42,6 | 4,8 s | **5,9 s** | Before you spend a dollar: our ninety-nine dollar audit. | `12_042.6_spend-dollar.mp3` |
| 13 | 0:48,6 | 5,5 s | **6,5 s** | We compare you to your competitors and give you a plan with deadlines. | `13_048.6_compare-competitors.mp3` |
| 14 | 0:55,2 | 2,4 s | **3,5 s** | Sites we built for real businesses. | `14_055.2_sites-built.mp3` |
| 15 | 0:58,8 | 5,0 s | **5,9 s** | Our promise: better service than you have now. A real person. | `15_058.8_our-promise.mp3` |
| 16 | 1:04,8 | 4,8 s | **7,1 s** | Said yes to any? Get your audit at judomarketing.net. | `16_064.8_said-yes.mp3` |

## Si un clip sale más largo que su máximo

- **Hasta un 5 % más largo:** acelera ese clip a 1,05×. No se nota.
- **Hasta un 10 % más largo:** acelera a 1,1×. Es lo máximo.
- **Más que eso:** genéralo otra vez con velocidad 1,1, o avísame y acorto la
  frase.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Count your yeses** y, en «Subir una
versión nueva o tu voz», elige los 16 MP3 a la vez. Después dime **«calza la
voz de Count your yeses»**. Pongo cada clip en el segundo de su escena (si
alguno se pasa, lo acelero hasta un 10 %), bajo la música cuando hablas y te
dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

1. **Pon el video** y, encima, una pista de audio.
2. **Cada clip va en el segundo de la columna «Empieza en»**, no uno detrás
   del otro. Para encontrar el segundo, agranda la línea de tiempo con dos
   dedos hasta ver las décimas.
3. **Si un clip pisa el siguiente,** tócalo, entra en «Velocidad» y súbelo a
   1,05× (no se nota) o, como mucho, a 1,1×.
4. **Baja la música** a un 20 % debajo de la voz.

## Cada clip, con lo que se ve y cómo decirlo

### Clip 1 · empieza en 0:00,0 · máximo 2,9 s

```
Turn off your phone.
```

- **En pantalla:** Business owners · Turn off your phone.
- **Cómo decirlo:** Tranquilo y bajo, como un reto. Termina en «phone»: la pantalla se apaga en 0:01,6.
- **Archivo:** `01_000.0_turn-off.mp3`

### Clip 2 · empieza en 0:03,0 · máximo 2,9 s

```
Is your business still selling?
```

- **En pantalla:** Is your business still selling?
- **Cómo decirlo:** Una pregunta de verdad, un poco preocupado. Sube en «still selling». El letrero pasa a CLOSED en 0:04,5.
- **Archivo:** `02_003.0_still-selling.mp3`

### Clip 3 · empieza en 0:06,0 · máximo 2,9 s

```
Three questions. Count your yeses.
```

- **En pantalla:** 3 questions. Count your yeses.
- **Cómo decirlo:** Más energía, amable, como quien empieza un juego. Sonríe en «yeses».
- **Archivo:** `03_006.0_three-questions.mp3`

### Clip 4 · empieza en 0:09,0 · máximo 3,5 s

```
Texts at night. Anyone answering?
```

- **En pantalla:** A customer texts at 9:04 PM. Anyone answering?
- **Cómo decirlo:** Bajito, de noche. Una pausa corta después de «night».
- **Archivo:** `04_009.0_texts-night.mp3`

### Clip 5 · empieza en 0:12,6 · máximo 4,1 s

```
More calls and orders than you can handle?
```

- **En pantalla:** More calls and orders than you can handle?
- **Cómo decirlo:** Más rápido, un poco agobiado, como si la bandeja se llenara mientras hablas.
- **Archivo:** `05_012.6_more-calls.mp3`

### Clip 6 · empieza en 0:16,8 · máximo 1,7 s

```
Then what happens…
```

- **En pantalla:** Then what happens…
- **Cómo decirlo:** Más lento. Baja la voz en «happens» y déjalo en el aire.
- **Archivo:** `06_016.8_what-happens.mp3`

### Clip 7 · empieza en 0:18,6 · máximo 4,7 s

```
By morning, they hired your competitor.
```

- **En pantalla:** By morning, they hired your competitor.
- **Cómo decirlo:** Sin drama, como un hecho. Un golpe chico en «competitor».
- **Archivo:** `07_018.6_by-morning.mp3`

### Clip 8 · empieza en 0:23,4 · máximo 5,3 s

```
Ready to invest… but not sure where it works best?
```

- **En pantalla:** Ready to invest… but not sure where it works best?
- **Cómo decirlo:** Con respeto, de dueño a dueño. Una pausa corta después de «invest».
- **Archivo:** `08_023.4_ready-invest.mp3`

### Clip 9 · empieza en 0:28,8 · máximo 1,7 s

```
Here's the good news.
```

- **En pantalla:** Here’s the good news.
- **Cómo decirlo:** Cálido, con una sonrisa que se oiga. Rápido.
- **Archivo:** `09_028.8_good-news.mp3`

### Clip 10 · empieza en 0:30,6 · máximo 4,7 s

```
Every yes has a fix. We handle all three.
```

- **En pantalla:** Every yes has a fix.
- **Cómo decirlo:** Seguro y tranquilo. «We handle all three» más lento, como una promesa.
- **Archivo:** `10_030.6_every-yes.mp3`

### Clip 11 · empieza en 0:35,4 · máximo 7,1 s

```
We run your social media and ads. Ad budgets from five dollars a day.
```

- **En pantalla:** We run your social media and your ads · Daily ad budget $5 · You pick it. Paid straight to Meta.
- **Cómo decirlo:** Claro, como explicándole a un amigo. «Five dollars a day» despacio: la tarjeta de $5 cuenta en 0:38,6.
- **Archivo:** `11_035.4_social-media.mp3`

### Clip 12 · empieza en 0:42,6 · máximo 5,9 s

```
Before you spend a dollar: our ninety-nine dollar audit.
```

- **En pantalla:** Before you spend a dollar: our $99 audit.
- **Cómo decirlo:** Inclínate hacia adelante, como un buen consejo. Una parada chica después de «dollar».
- **Archivo:** `12_042.6_spend-dollar.mp3`

### Clip 13 · empieza en 0:48,6 · máximo 6,5 s

```
We compare you to your competitors and give you a plan with deadlines.
```

- **En pantalla:** You vs. your competitors. A plan with deadlines.
- **Cómo decirlo:** Firme y concreto. Marca «deadlines».
- **Archivo:** `13_048.6_compare-competitors.mp3`

### Clip 14 · empieza en 0:55,2 · máximo 3,5 s

```
Sites we built for real businesses.
```

- **En pantalla:** Real websites we built.
- **Cómo decirlo:** Orgulloso pero simple. Sin voz de vendedor.
- **Archivo:** `14_055.2_sites-built.mp3`

### Clip 15 · empieza en 0:58,8 · máximo 5,9 s

```
Our promise: better service than you have now. A real person.
```

- **En pantalla:** Our promise: better service than you have now.
- **Cómo decirlo:** Sincero, más lento. Pausa después de «promise». «A real person» más suave, en serio.
- **Archivo:** `15_058.8_our-promise.mp3`

### Clip 16 · empieza en 1:04,8 · máximo 7,1 s

```
Said yes to any? Get your audit at judomarketing.net.
```

- **En pantalla:** Said yes to any? · Get your $99 audit · judomarketing.net/diagnostic · Questions? Message me
- **Cómo decirlo:** Cálido y directo, como cerrando el juego: «Said yes to any?» con una sonrisa, pausa corta, y la dirección natural: «judo marketing dot net».
- **Archivo:** `16_064.8_said-yes.mp3`
