> Investigación del 14 de noviembre de 2026 (agente investigador con fuentes). El método que sale de aquí está en `.claude/skills/vendito/references/metodo.md`, sección 6.

# Sincronizar una voz de ElevenLabs con un video ya editado

Investigación del 14 de noviembre de 2026. Las fuentes van al final. Lo que no
está documentado se dice como tal.

## La respuesta corta

El desfase viene del método más que de la cifra: un bloque con varias
`<break>` suma el error de cada frase. Piper calzó porque cada frase se puso
en su segundo. Con ElevenLabs hay que hacer lo mismo: un clip por escena.

## 1. Velocidad a speed 1,0

- **No hay cifra oficial** para ningún modelo. Sus límites (10.000 caracteres,
  unos 10 minutos en Multilingual v2) dan unos 1.000 caracteres por minuto,
  cerca de 2,8 palabras por segundo.
- **Mediciones de terceros, en inglés:**
  - Oakgen (octubre de 2026, voz Rachel, Multilingual v2): 2,8 a 2,9 palabras
    por segundo (80 palabras en 27,49 s; 43 en 15,46 s).
  - Un proyecto en GitHub que cronometró la API, sin decir el modelo: una voz
    a 163 palabras por minuto y otra a 188. La misma voz fue de 101 a 162
    según el texto.
  - GlobalGPT: 2,67 a 2,86 palabras por segundo.
- **En sílabas (cálculo nuestro):** nuestros guiones en inglés tienen 1,22 a
  1,37 sílabas por palabra, así que esas voces van a 3,3 a 4,3 sílabas por
  segundo, pausas naturales incluidas.
  - Piper hizo 3,9 (152 sílabas en 39,3 s).
  - La fórmula de `calzar-voz.py` (4,2 más 0,25 s por coma o punto) equivale
    a 3,7 a 3,9. Una voz de ElevenLabs puede ir un 15 % más lenta.
- **Por modelo:** no hay datos separados de Multilingual v2, v3 ni Flash
  v2.5. Turbo v2.5 está obsoleto y es «funcionalmente equivalente» a Flash.
- **Voces clonadas:** «la IA intentará imitar todo lo que oye», ritmo
  incluido. No hay cifra para Instant ni para Professional: la velocidad es la
  del dueño en sus muestras, y hay que medirla.

## 2. El parámetro speed

- **Rango:** 0,7 a 1,2; 1,0 por defecto. La guía de la web dice que no existe
  en Eleven v3 ni en v4 (Oakgen dice que sí en v3; manda la oficial).
- **Efecto real, casi proporcional:** 0,8 dejó una voz en el 81 % de su ritmo
  y 0,81 dejó otra en el 82 %. Pero 1,1 no garantiza un clip un 10 % más
  corto, porque cada generación cambia las pausas (Oakgen).
- **Tono y calidad:** solo dice que «los valores extremos pueden afectar la
  calidad». No publica desde qué valor ni si cambia el tono.

## 3. Las etiquetas `<break time="..."/>`

- **Funcionan en** Multilingual v2, Flash v2 y Flash v2.5, hasta 3 s cada una.
- **Eleven v3 y v4 no las admiten.** Usan audio tags (la guía de v3 da
  `[Brief pause]`), puntos suspensivos y la estructura del texto. No está
  documentado si la etiqueta se ignora o se lee.
- **Muchas en una generación** causan «inestabilidad»: la voz «puede
  acelerarse o meter ruidos o artefactos». No dice cuántas son demasiadas.
- **Los guiones y los «...»** son «menos consistentes»; los «...» pueden sonar
  dudosos.

## 4. Por qué se desfasa un bloque largo con pausas

- **El error se suma.** Si la voz habla un 10 % más lento que lo supuesto,
  8 s de habla planeada terminan 0,8 s tarde; con un 15 %, 1,2 s.
- **Generaciones:** «fijar los controles no garantiza el mismo resultado cada
  vez». El `seed` es solo de la API y «el determinismo no está garantizado».
- **Stability** regula «la aleatoriedad entre cada generación»; muy baja, la
  voz puede «hablar demasiado rápido».
- **Puntuación:** el punto ya trae una pausa natural, de largo no
  documentado, y la `<break>` se suma encima. Los «...» agregan «pausa y
  peso», de largo variable.
- **Números:** «$1,000,000» sale «one million dollars» en Multilingual v2 y
  «one thousand thousand dollars» en Flash v2.5. Una sigla como «PHP2Shell»
  dura según cómo la lea.
- **Modelo:** si la web generó con v3 o v4, las pausas no existen y el bloque
  se adelanta.

## 5. Los métodos, comparados

- **Un clip por escena:** el error no se suma y una frase mala se regenera
  sola. ElevenLabs recomienda generar por segmentos y unirlos en un editor; un
  artículo técnico sobre v4 pide cortar en los cambios de escena. En contra,
  la entonación puede variar entre clips: la API lo corrige con
  `previous_text` y `next_text`; en la web no está documentado.
- **API with-timestamps:** da el inicio y el fin de cada carácter; corta un
  bloque en frases con exactitud, pero solo por API. Forced Alignment hace lo
  mismo con un audio ya hecho (también API).
- **Studio 4.0 (21 de septiembre de 2026):** se sube el MP4, se genera la voz y
  cada clip se arrastra a la línea de tiempo, con zoom al cuadro y clips que
  se pegan. Es la vía oficial en la web. El viejo Voiceover Studio se apagó el
  15 de mayo de 2026.
- **Dubbing Studio:** es para traducir. Con duración «fija» la voz se apura;
  con «dinámica», «puede afectar la sincronía».
- **Voice Changer (Speech-to-Speech):** el dueño se graba leyendo sobre el
  video y se pasa a su voz clonada. «Sigue con precisión la cadencia de
  entrada» y acepta MP4 de hasta 5 minutos. Calza por construcción, pero
  conserva el acento de la grabación.
- **ElevenLabs** no tiene guía para narrar un video ya editado; Studio solo
  dice «ajusta los clips en la línea de tiempo».

## 6. Para el dueño: web de ElevenLabs y CapCut

- **Generar:**
  - Multilingual v2: «el más estable en textos largos», con speed. La guía de
    v3 dice que las voces Professional «no están del todo optimizadas» para
    v3; v4 sirve, pero sin speed.
  - Un clip por escena, sin `<break>`.
  - Ajustes iguales en todos: estabilidad 50 %, similitud 75 a 80 %, estilo 0
    (lo que recomienda ElevenLabs), el mismo speed.
  - Dos regeneraciones gratis antes de 2 horas, sin recargar la página.
- **Nombrar:** escena, segundo de inicio y dos palabras:
  `07_036.0_every-yes.mp3`. Se ordenan solos y dicen dónde van.
- **Poner en CapCut:**
  1. el video en la pista principal;
  2. el cabezal en el segundo del nombre, con la línea de tiempo acercada al
     máximo;
  3. el clip arrastrado hasta que se pegue al cabezal;
  4. el silencio inicial recortado, para que la primera sílaba caiga en el
     corte (puede adelantarse medio segundo, como dice `voz.md`).
- **Si un clip sale largo:**
  1. recortar el silencio final;
  2. acelerarlo en «Velocidad», modo «Normal»: hasta un 5 % no se nota (el
     umbral del tempo en el habla, Quené 2007); hasta un 10 % pasa;
  3. si hace falta más, regenerar con speed 1,05 a 1,1 o acortar la frase.
  - La opción que conserva el tono se llama «Pitch» o «Keep pitch», y las
    guías se contradicen sobre si va marcada. Si la voz sube de tono, se
    cambia.

## 7. Cuántas sílabas suponer al escribir

- **3,3 sílabas por segundo, con las pausas incluidas** (unas 150 palabras por
  minuto), y 0,3 s libres al final de cada escena. En `calzar-voz.py` es
  `"silabas_por_segundo": 3.6`, que con sus 0,25 s por pausa da 3,2 a 3,4
  (cálculo nuestro).
- **Por qué:** la voz medida más lenta va a unos 3,3. Llegar antes solo deja
  silencio; llegar tarde descuadra. En 1,8 s caben unas 5 sílabas.
- **Mejor aún:** medir la voz del dueño y usar el 90 % de su ritmo.

## Método recomendado

1. **Medir la voz del dueño:** en Multilingual v2 y speed 1,0, un párrafo de
   unas 100 sílabas sin `<break>`; cronometrarlo y anotar sus sílabas por
   segundo.
2. **Escribir el guion** al 90 % de ese ritmo (3,3 si aún no se midió), con
   0,3 s libres por escena. Números y siglas, escritos como se dicen.
3. **Entregar una línea por escena** con su segundo de inicio y su duración
   máxima, no bloques con pausas.
4. **Generar un clip por línea** con los mismos ajustes, empezando por la más
   justa. Si se pasa, speed 1,05 o 1,1 para todas.
5. **Nombrar** `NN_SSS.s_palabras` y, en CapCut, poner cada clip en su
   segundo, sin el silencio inicial.
6. **Si uno se pasa:** acelerar hasta un 5 % (máximo 10 %) o regenerar.
7. **O subir los clips a la Biblioteca:** con un clip por escena,
   `calzar-voz.py` no tiene que adivinar dónde se corta cada frase.
8. **Con muchas escenas cortas:** grabarse sobre el video y pasarlo por Voice
   Changer a la voz clonada.

## Fuentes

- Buenas prácticas: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- Pausas: https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-can-i-add-pauses
- Velocidad: https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/can-i-change-the-pace-of-the-voice
- Ajustes en la web: https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
- Modelos: https://elevenlabs.io/docs/overview/models
- Eleven v3: https://elevenlabs.io/docs/best-practices/prompting/eleven-v3
- Clonación: https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning
- With-timestamps: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- Forced Alignment: https://elevenlabs.io/docs/overview/capabilities/forced-alignment
- Studio: https://elevenlabs.io/docs/eleven-creative/products/studio
- Studio 4.0: https://elevenlabs.io/blog/introducing-studio-4
- Voiceover Studio: https://elevenlabs.io/docs/eleven-creative/audio-tools/voiceover-studio
- Dubbing Studio: https://elevenlabs.io/docs/product/dubbing/studio
- Voice Changer: https://elevenlabs.io/docs/eleven-creative/playground/voice-changer
- Oakgen: https://oakgen.ai/blog/ai-voiceover-timing-30-second-video
- GitHub: https://github.com/coletebou/book-club/pull/29
- GlobalGPT: https://www.glbgpt.com/hub/elevenlabs-multilingual-v2-review/
- Cortar por escena: https://www.nemovideo.com/blog/ai-video-models/eleven-v4-voiceover-timing
- Quené (2007): https://dspace.library.uu.nl/handle/1874/295947
- CapCut: https://www.movavi.com/learning-portal/how-to-speed-up-a-video-on-capcut y https://explee.com/media/speed-up-video-capcut
