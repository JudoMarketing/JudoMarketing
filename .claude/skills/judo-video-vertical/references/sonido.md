# Sonido

El video no lleva música con derechos. Los efectos se sintetizan en
`sfx.py` y se colocan en el segundo exacto que pide cada escena. Si el
cliente quiere música, la pone él desde la biblioteca comercial de Meta o de
TikTok al publicar.

## Cómo se escribe

En la plantilla de cada escena: `data-sfx="nombre@segundo[:duración][/nivel]"`,
separados por espacios.

```html
<template id="intro" data-sfx="brillo@0.1 bloop-sube@0.75 pop@0.8 sello@1.75 subida@0:1.7 grave@0/-10">
```

- El **segundo** se cuenta desde el inicio de la escena. Va con el `--d` de lo
  que suena.
- La **duración** solo cuenta en `subida`, `viento` y los `whoosh`.
- El **nivel** va en dB. Más cerca de 0 suena más fuerte; cada sonido trae el
  suyo.
- En cada corte suena solo un swish bajo. Para quitarlo en una escena:
  `data-swish="no"`.

## Los sonidos

| Nombre | Suena como | Para |
| --- | --- | --- |
| `pop` | Un pop corto | Palabras que entran, fichas, nodos |
| `pop-fuerte` | Un pop más grave y marcado | La palabra clave de un bucle |
| `pop-agudo` | Un pop brillante | Avisos chicos, globos |
| `tap` | El toque de un dedo | Botones en el teléfono |
| `campana` | Un "ding" | Algo que se conecta, un ✓ |
| `campana-grave` | Un "ding" más grave | Encontrar algo (la mira) |
| `acorde` | Tres notas que suben | ¡Listo!, algo que se logra |
| `acorde-final` | Un acorde de cierre | La tarjeta de contacto |
| `brillo` | Un arpegio mágico | Aparece un logo, un consejo |
| `sello` | Un golpe seco y grave | Sellos, totales, "Tú decides" |
| `bloop-sube` / `bloop-baja` | Algo que sale o se mete | El genio que sale y vuelve |
| `caja` | Una caja registradora | Precios, cobros |
| `moneda` | Una moneda que gira y cae | Ganchos de dinero, monedas que viajan |
| `plop` | Algo blando que cae | Objetos que caen, emojis |
| `bip` | Un bip suave | Escaneos, datos que llegan |
| `grave` | Un golpe grave | El primer cuadro de un gancho, una presentación |
| `subida` | Un ruido que sube | Los bucles abiertos: sube y corta con la escena |
| `whoosh` | Un barrido | Algo que sale del cuadro |
| `whoosh-suave` | Un barrido suave que sube | Un cambio de escena tranquilo |
| `whoosh-baja` | Un barrido que baja | El teléfono que sale por abajo |
| `swish` | Un barrido corto | Líneas que se dibujan, saltos de opción |
| `viento` | Un viento largo que baja | Un vuelo, una caída larga |

## Con voz

Si el video lleva voz (la del dueño o un locutor), los efectos tienen que
quedar debajo. `voz.py` los baja solos mientras la voz habla
(`references/voz.md`). Igual conviene:

- **Menos efectos en las escenas con mucha voz**: los pops de cada palabra
  sobran si la voz dice la frase.
- **Dejar sonar los efectos que cuentan algo** (la caja registradora, el
  sello) en una pausa de la voz.
