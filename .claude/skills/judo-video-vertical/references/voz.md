# Guion para voz

Cuando el dueño (o un locutor) va a ponerle su voz al video. Lo pidió Junior
para los videos de JuditoADS: "dame un guion que concuerde con el timing de
las imágenes, para ponerle mi voz detrás, y ayúdame con el tono".

## El guion

**Una línea por escena, con el tiempo exacto.** La voz va con lo que se ve:
- si en pantalla aparece "Tú decides", la voz dice "tú decides" en ese
  segundo;
- si el marco salta a la segunda opción, la voz nombra la segunda opción en
  ese momento.

| Tiempo | Lo que se ve | Tu voz | Cómo decirlo |
| --- | --- | --- | --- |
| 0:00 – 0:03 | La moneda de 5¢ | **Te llegué por menos de cinco centavos… con dos dólares al día.** | Con picardía, sonriendo. |

- **Ritmo:**
  - unas 6 sílabas por segundo en un anuncio y 5 en un video que explica;
  - cuenta las sílabas de cada línea y compáralas con lo que dura la escena.
    Si no cabe, recorta la frase, no la escena.
- **Una frase puede empezar medio segundo antes del corte** (la voz adelanta
  lo que viene), pero no más.
- **La voz no tiene que repetir el texto de la pantalla.** Puede decir lo mismo
  con otras palabras o completarlo, pero no contradecirlo.
- **Los números se escriben como se dicen:** "cinco centavos", "veinte
  dólares", "catorce días".
- **Verdad:** lo mismo que el texto (`reglas.md`). Si el texto que manda el
  cliente trae algo que no se puede sostener, se cambia y se le dice por qué,
  en una sección "Lo que cambié de tu texto".
  - Ejemplos de JuditoADS: "en tiempo real" quedó fuera; "con solo Instagram"
    se corrigió a "página de Facebook".

## Los tiempos salen del video final

**Los tiempos del guion se sacan de `salida/escenas.json` del video ya
armado, no del storyboard.** El guion del video 2 de JuditoADS salió de un
corte anterior: cuando se puso la voz, «Si llegaste hasta aquí» caía un
segundo antes de su escena y el gancho no cabía en su moneda.

1. Copia cada inicio de escena a `voz.json`, con su frase:
   `{"t": 0.0, "texto": "Te llegué por menos de cinco centavos."}`.
2. `python3 calzar-voz.py voz.json --guion` mide cada frase contra su escena
   (sílabas ÷ 5,5 por segundo) y avisa las que no caben. Se recorta la frase,
   no la escena.
3. El mismo comando escribe los bloques para ElevenLabs con las pausas
   (`<break>`) que calzan.

## El tono

Tres registros, y el guion marca cuál va en cada línea:

1. **Energía**: el gancho, los pasos, el precio. De pie, sonriendo.
2. **Secreto**: los bucles abiertos. Más lento y más bajo, casi al oído. Es lo
   que hace que la gente se quede.
3. **Cercano**: el cierre. Como si le escribieras a un amigo.

- **De dueño a dueño, no de locutor de radio.** Seguro, cercano, sin gritar
  ni vender a la fuerza.
- **En un video que explica (para quien ya preguntó):** de asesor que explica
  con una pizarra; más pausado; las dudas ("¿y mi dinero?") en voz baja.
- **Las palabras que se marcan** van en una lista corta al final del guion.

## Cómo grabar (va en el guion)

1. **Un cuarto chico** con ropa o cortinas, sin eco; un clóset funciona.
2. **El teléfono a un palmo de la boca**, un poco de lado, para que la "p" y la
   "t" no golpeen.
3. **De pie**, si puede.
4. **Tres tomas seguidas del guion entero**, sin parar si se equivoca.

## Poner la voz en el video

**Si la voz viene de ElevenLabs (o de cualquier lector) en bloques:**

```bash
python3 calzar-voz.py voz.json bloque-1.mp3 bloque-2.mp3 …
```

- Corta cada bloque en sus frases por los silencios, eligiendo los que dejan
  frases del largo esperado: así una coma o unos «...» no se confunden con
  el final de una frase.
- Pone cada frase en el segundo de su escena. Si no cabe, la acelera hasta un
  12 %. Si aun así se pasa, la siguiente entra un poco después en vez de
  pisarla, y lo avisa.
- Al final llama a `voz.py`, que baja los efectos mientras habla.

**Si la voz es grabada de una sola toma:**

```bash
python3 voz.py salida/video.mp4 voz.m4a --desfase 0.2 --efectos -9
```

- `--desfase` corre la voz en segundos; negativo la adelanta. Se ajusta
  escuchando el gancho y el primer corte.
- `voz.py` hace cuatro cosas:
  1. limpia los graves de la voz;
  2. la comprime suave y la deja a −16 LUFS (el volumen de Reels y TikTok);
  3. baja los efectos mientras la voz habla;
  4. saca `salida/<video>-con-voz.mp4`.
- **Escúchalo entero antes de entregar.** Que ninguna frase pise el sonido
  clave de una escena (la caja registradora, el sello).
