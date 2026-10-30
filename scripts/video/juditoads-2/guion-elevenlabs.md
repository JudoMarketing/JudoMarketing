# «Cinco centavos» · guion para ElevenLabs

Es el guion de `guion-voz.md` (video 2 de JuditoADS, 56 segundos), escrito
para que lo lea tu voz clonada en ElevenLabs. Va en **4 bloques**: si una
frase sale rara, repites solo ese bloque.

## Cómo generarlo

Igual que «Por dentro»:

1. **Modelo:** Eleven Multilingual v2. Si usas Eleven v3, borra las etiquetas
   `<break ... />` y deja los «...».
2. **Voz:** la tuya, la clonada.
3. **Ajustes de la voz:**
   - Velocidad: 1,0.
   - Estabilidad: 45 %. Es un poco menos que en «Por dentro», porque este
     video pide más energía y más cambios de tono.
   - Similitud: 80 %.
   - Exageración de estilo: entre 5 y 15 %.
   - Speaker boost: encendido.
4. **Si en «Por dentro» cambiaste cómo se escribe «JuditoADS»** para que lo
   dijera bien, haz el mismo cambio aquí.
5. **Baja cada bloque en MP3** (`bloque-1.mp3` a `bloque-4.mp3`) y mándamelos.
   Pongo cada frase en su escena y bajo los efectos cuando hablas.

**Cuánto debe durar cada bloque, más o menos:** el 1, 13 segundos; el 2, 9;
el 3, 14; el 4, 20. Este video va más rápido que «Por dentro». Si un bloque
sale dos o más segundos más largo, súbele la velocidad a 1,05 o 1,1 y vuelve a
generarlo.

## Bloque 1 · de 0:00 a 0:13

```
Te llegué por menos de cinco centavos... con dos dólares al día. <break time="0.6s" />
Quédate, que te explico cómo hacerlo sin gurús... y sin comerte cursos carísimos. <break time="1.0s" />
Y lo logré en Miami, una de las ciudades más competitivas del país.
```

Con picardía al principio, como quien cuenta un truco. La pausa larga es
para que suene la caja registradora. «Miami», con orgullo.

## Bloque 2 · de 0:13 a 0:22

```
Invertí cinco años de experiencia en JuditoADS. <break time="0.5s" />
¿Qué hace Judito? Te encuentra a quien sí te compra. <break time="0.5s" />
Pero eso no es lo más loco... <break time="0.8s" />
Es simple: solo cuatro pasos.
```

«Pero eso no es lo más loco...» más lento y más bajo, como un secreto.

## Bloque 3 · de 0:22 a 0:36

```
Uno: te registras. <break time="0.6s" />
Dos: conectas tu Facebook. <break time="0.6s" />
Tres: anuncias una imagen nueva... o un post que ya tienes. <break time="0.6s" />
Cuatro: pones tu presupuesto, por día o por campaña... tú decides. <break time="0.6s" />
¡Listo! Y el presupuesto va directo a Meta, no a nosotros.
```

Claro y práctico, con un golpe en cada número. «¡Listo!», alegre.

## Bloque 4 · de 0:36 a 0:56

```
Y lo que nadie te explica... o te cobran por saberlo... Judito te lo dice. <break time="0.8s" />
Consejos que funcionan... y vigila tus anuncios por ti. <break time="0.8s" />
Por veinte dólares al mes, un estratega que trabaja para ti. <break time="0.6s" />
Si llegaste hasta aquí, pruébalo gratis catorce días. <break time="0.5s" /> Sin tarjeta. No hay motivo para no hacerlo. <break time="0.8s" />
¿Necesitas ayuda para empezar? Escríbeme.
```

Bajito en «Y lo que nadie te explica», como al oído. El cierre, el tono más
humano del video.

## Lo que cambié del guion para grabar, y por qué

- **«Dos: conectas tu cuenta de Meta»** pasó a **«Dos: conectas tu
  Facebook»**. No hay una cuenta de Meta que tener o crear: se entra con
  Facebook y desde ahí se da el permiso. Es la misma corrección que se hizo en
  «Por dentro» (CEREBRO, sección 10).
- **«¿No tienes cuenta de Meta o necesitas ayuda?»** pasó a **«¿Necesitas
  ayuda para empezar?»**, por lo mismo.
- **Los números van en letras** («cinco centavos», «dos dólares», «veinte
  dólares», «catorce días»), para que ElevenLabs no lea «5¢» o «$20» en
  inglés.
