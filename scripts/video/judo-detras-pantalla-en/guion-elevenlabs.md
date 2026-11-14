# «Behind the screen» · guion para ElevenLabs, un clip por escena

Es el guion de la voz en off del video en inglés «Behind the screen» (72
segundos, 15 escenas), para tu voz clonada en ElevenLabs. Las tres escenas
donde hablas a cámara no van aquí: están en `guion-camara.md`. Lo hizo
Vendito el 14 de noviembre de 2026.

## Por qué la voz va en un clip por escena

- **Antes iba en bloques largos con pausas `<break>`.** La voz de prueba
  calzaba porque habla rápido y parejo. ElevenLabs habla más lento (de 3,3 a
  4,3 sílabas por segundo), y cada frase un poco más larga empujaba a todas
  las que venían detrás en el mismo bloque. Al final del bloque, el atraso ya
  se notaba.
- **Ahora va en 12 clips, uno por escena, sin pausas adentro.** Cada clip
  empieza en el segundo exacto de su escena, así que un clip largo no puede
  atrasar al siguiente.
- **Las frases se escribieron para la voz lenta.** Se midieron a
  3,3 sílabas por segundo y ninguna ocupa más del
  85 % de su escena: si tu voz sale un
  poco más lenta, todavía cabe.

## Todo el texto seguido (para leerlo de corrido)

> Everyone knows Latinos work hard. Few talk about the ones behind a screen. Like so many immigrants, I've given this country my best. We work just as hard. Just on a keyboard. But hard work alone… …doesn't beat bigger companies. Leverage does. So I built Judo Marketing. What's broken? Complex problems need complex solutions. We rebuild the machine. With code and AI, we take your business further. Or help carry the weight of running a company. Message me on WhatsApp. Let's take your business to the next level.

## Antes de generar

- **Modelo:** Eleven Multilingual v2. No pongas `<break>`: cada clip es una
  sola frase.
- **Ajustes de la voz, iguales en los 12 clips:**
  - Estabilidad: 45 %.
  - Similitud: 80 %.
  - Exageración de estilo: entre 10 y 20 %.
  - Speaker boost: encendido.
  - Velocidad: 1,0.
- **Los números van en letras** («five dollars», «ninety-nine dollar»), y la
  web se dice «judo marketing dot net». Si ElevenLabs lee raro
  «judomarketing.net», escríbelo así: `Judo Marketing dot net`.

## Cómo generarlo

1. **Primero genera solo el clip 9** (el más largo) y mira cuánto
   dura en el reproductor de ElevenLabs. Debe durar **5,9 s o
   menos**.
   - Si dura **5,9 s o menos:** perfecto, sigue con velocidad
     1,0.
   - Si dura **de 5,9 a 6,5 s:** sube
     la velocidad a 1,1 y genéralo otra vez.
   - Si dura **más de 6,5 s:** avísame. Hay que acortar
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
| 1 | 0:00,0 | 2,7 s | **3,5 s** | Everyone knows Latinos work hard. | `01_000.0_everyone-knows.mp3` |
| 2 | 0:03,6 | 3,0 s | **3,5 s** | Few talk about the ones behind a screen. | `02_003.6_behind-screen.mp3` |
| 3 | 0:14,4 | 4,8 s | **5,9 s** | Like so many immigrants, I've given this country my best. | `03_014.4_so-many.mp3` |
| 4 | 0:20,4 | 3,3 s | **4,1 s** | We work just as hard. Just on a keyboard. | `04_020.4_just-as.mp3` |
| 5 | 0:24,6 | 1,5 s | **1,7 s** | But hard work alone… | `05_024.6_hard-work.mp3` |
| 6 | 0:26,4 | 3,6 s | **4,7 s** | …doesn't beat bigger companies. Leverage does. | `06_026.4_leverage-does.mp3` |
| 7 | 0:31,2 | 2,4 s | **3,5 s** | So I built Judo Marketing. | `07_031.2_built-judo.mp3` |
| 8 | 0:34,8 | 0,9 s | **1,7 s** | What's broken? | `08_034.8_whats-broken.mp3` |
| 9 | 0:36,6 | 5,1 s | **5,9 s** | Complex problems need complex solutions. We rebuild the machine. | `09_036.6_complex-problems.mp3` |
| 10 | 0:49,2 | 3,6 s | **4,7 s** | With code and AI, we take your business further. | `10_049.2_code-ai.mp3` |
| 11 | 0:54,0 | 3,9 s | **4,7 s** | Or help carry the weight of running a company. | `11_054.0_carry-weight.mp3` |
| 12 | 1:04,8 | 5,1 s | **7,1 s** | Message me on WhatsApp. Let's take your business to the next level. | `12_064.8_message-me.mp3` |

## Si un clip sale más largo que su máximo

- **Hasta un 5 % más largo:** acelera ese clip a 1,05×. No se nota.
- **Hasta un 10 % más largo:** acelera a 1,1×. Es lo máximo.
- **Más que eso:** genéralo otra vez con velocidad 1,1, o avísame y acorto la
  frase.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **Behind the screen** y, en «Subir una
versión nueva o tu voz», elige los 12 MP3 a la vez. Después dime **«calza la
voz de Behind the screen»**. Pongo cada clip en el segundo de su escena (si
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

### Clip 1 · empieza en 0:00,0 · máximo 3,5 s

```
Everyone knows Latinos work hard.
```

- **En pantalla:** Everyone knows Latinos work hard.
- **Cómo decirlo:** Con orgullo, tranquilo, como quien dice algo que todos saben.
- **Archivo:** `01_000.0_everyone-knows.mp3`

### Clip 2 · empieza en 0:03,6 · máximo 3,5 s

```
Few talk about the ones behind a screen.
```

- **En pantalla:** Few talk about the ones behind a screen.
- **Cómo decirlo:** Más bajo y cercano, como un secreto. Marca «behind a screen».
- **Archivo:** `02_003.6_behind-screen.mp3`

### Clip 3 · empieza en 0:14,4 · máximo 5,9 s

```
Like so many immigrants, I've given this country my best.
```

- **En pantalla:** Since 2015, giving this country my best.
- **Cómo decirlo:** Sincero, con calma, sin drama. Sube un poco en «my best».
- **Archivo:** `03_014.4_so-many.mp3`

### Clip 4 · empieza en 0:20,4 · máximo 4,1 s

```
We work just as hard. Just on a keyboard.
```

- **En pantalla:** We work just as hard. Just on a keyboard.
- **Cómo decirlo:** Firme en «just as hard», con una sonrisa en «keyboard».
- **Archivo:** `04_020.4_just-as.mp3`

### Clip 5 · empieza en 0:24,6 · máximo 1,7 s

```
But hard work alone…
```

- **En pantalla:** But hard work alone…
- **Cómo decirlo:** Más lento. Déjalo en el aire.
- **Archivo:** `05_024.6_hard-work.mp3`

### Clip 6 · empieza en 0:26,4 · máximo 4,7 s

```
…doesn't beat bigger companies. Leverage does.
```

- **En pantalla:** …doesn’t beat bigger companies. Leverage does.
- **Cómo decirlo:** Continúa la frase anterior. Golpe seguro en «Leverage does».
- **Archivo:** `06_026.4_leverage-does.mp3`

### Clip 7 · empieza en 0:31,2 · máximo 3,5 s

```
So I built Judo Marketing.
```

- **En pantalla:** So I built Judo Marketing.
- **Cómo decirlo:** Orgulloso, claro. «Judo» como en español.
- **Archivo:** `07_031.2_built-judo.mp3`

### Clip 8 · empieza en 0:34,8 · máximo 1,7 s

```
What's broken?
```

- **En pantalla:** What’s broken in your business?
- **Cómo decirlo:** Pregunta directa, corta.
- **Archivo:** `08_034.8_whats-broken.mp3`

### Clip 9 · empieza en 0:36,6 · máximo 5,9 s

```
Complex problems need complex solutions. We rebuild the machine.
```

- **En pantalla:** Complex problems, complex solutions. Rebuilt · running better.
- **Cómo decirlo:** Como un ingeniero que sabe lo que hace. Pausa corta después de «solutions».
- **Archivo:** `09_036.6_complex-problems.mp3`

### Clip 10 · empieza en 0:49,2 · máximo 4,7 s

```
With code and AI, we take your business further.
```

- **En pantalla:** With code and AI, we take your business further.
- **Cómo decirlo:** Con energía, mirando hacia adelante.
- **Archivo:** `10_049.2_code-ai.mp3`

### Clip 11 · empieza en 0:54,0 · máximo 4,7 s

```
Or help carry the weight of running a company.
```

- **En pantalla:** Or help you carry the weight of running a company.
- **Cómo decirlo:** Más suave, con empatía: sabes lo que pesa.
- **Archivo:** `11_054.0_carry-weight.mp3`

### Clip 12 · empieza en 1:04,8 · máximo 7,1 s

```
Message me on WhatsApp. Let's take your business to the next level.
```

- **En pantalla:** Tell me your problem · WhatsApp · $99 diagnosis + action plan
- **Cómo decirlo:** Cálido y directo, como una invitación. Sonríe en «next level».
- **Archivo:** `12_064.8_message-me.mp3`
