# «Por dentro» · guion para ElevenLabs

Es el mismo guion de `guion-voz.md` (video 3 de JuditoADS, 62 segundos),
escrito para que lo lea tu voz clonada en ElevenLabs. Va en **4 bloques**: si
una frase sale rara, repites solo ese bloque y no todo.

## Cómo generarlo

1. **Modelo:** Eleven Multilingual v2. Es el que respeta las pausas
   `<break time="…" />`. Si usas Eleven v3, borra esas etiquetas y deja los
   «...», porque v3 no las lee.
2. **Voz:** la tuya, la clonada.
3. **Ajustes de la voz:**
   - Velocidad: 1,0.
   - Estabilidad: 50 %.
   - Similitud: 80 %.
   - Exageración de estilo: entre 0 y 10 %.
   - Speaker boost: encendido.
4. **Primero genera el bloque 1 y escúchalo.** Fíjate en cómo dice «Judo» y
   «JuditoADS». Si los dice con jota («Hudo», «Hudito»), cambia en los cuatro
   bloques «Judo» por «Yudo» y «JuditoADS» por «Yudito Ads», o escríbelos
   como tú los dices. Eso solo cambia lo que lee ElevenLabs: en el video sigue
   diciendo Judo y JuditoADS.
5. **Genera los otros tres bloques** y baja cada uno en MP3 (o WAV si tu plan
   lo deja), con el nombre `bloque-1.mp3`, `bloque-2.mp3`, etcétera.
6. **Mándamelos.** Pongo cada frase en su escena y bajo la música cuando
   hablas.

**Cuánto debe durar cada bloque, más o menos:** el 1, 16 segundos; el 2, 17;
el 3, 11; el 4, 18. Si uno sale dos o más segundos más largo, súbele la
velocidad a 1,05 y vuelve a generarlo.

## Bloque 1 · de 0:00 a 0:16

```
Judo Marketing no es solo una empresa de marketing. <break time="0.8s" />
Para problemas complejos... <break time="1.2s" /> también creamos soluciones complejas. <break time="0.8s" />
Por eso creamos JuditoADS. Así funciona por dentro. <break time="0.8s" />
Meta permite que JuditoADS maneje tus anuncios... con tu permiso.
```

Seguro, con una sonrisa. La pausa larga de la segunda línea es cuando se
rompe la máquina.

## Bloque 2 · de 0:16 a 0:34

```
Tú conectas tu Facebook, y Judito le dice a Meta qué hacer. <break time="1.0s" />
¿Y tu dinero? <break time="1.0s" />
A Judo solo le pagas veinte dólares al mes. <break time="0.8s" />
Tu presupuesto lo eliges tú... y se lo pagas directo a Meta. <break time="1.0s" />
Nosotros no tocamos tu dinero ni tu presupuesto.
```

«¿Y tu dinero?» más bajo y lento. «Nosotros no tocamos tu dinero» despacio:
es la frase que más confianza da.

## Bloque 3 · de 0:34 a 0:44

```
¿Y cómo sabes si funciona? <break time="1.0s" />
Meta le cuenta a Judito cómo va tu anuncio... y Judito te da consejos para mejorar tus estrategias. <break time="0.5s" />
Para que no botes tu dinero.
```

La pregunta, como pregunta de verdad. «Para que no botes tu dinero», más
bajito.

## Bloque 4 · de 0:44 a 1:02

```
Para empezar, solo necesitas tu Facebook: con él entras y das el permiso... una página... tu Instagram, si lo tienes... y tu cuenta de anuncios, con una tarjeta. <break time="0.8s" />
Y listo: ya puedes anunciarte en redes como todo un profesional. <break time="1.0s" />
Pruébalo gratis catorce días. <break time="1.0s" /> Y si necesitas ayuda para empezar, escríbeme.
```

Tranquilo en la lista de lo que se necesita; sube la energía en «Y listo»; el
cierre, el tono más humano del video.

## Por qué está escrito así

- **Los números van en letras** («veinte dólares», «catorce días»), para que
  ElevenLabs no lea «$20» en inglés ni «14» como «uno cuatro».
- **Las pausas van con `<break>`** y ninguna pasa de 1,2 segundos. Más de
  cinco por bloque pueden hacer que la voz se acelere o meta ruidos.
- **Los «...» son pausas cortas**, las mismas del guion para grabar.
- **Cada bloque cierra en un cambio de escena**, así que no importa si uno dura
  medio segundo de más: al calzarlo, cada frase empieza con su escena.
