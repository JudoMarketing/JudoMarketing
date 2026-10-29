# Sonido

El video no lleva música con derechos. Los efectos se sintetizan en
`sfx.py` y se colocan en el segundo exacto que pide cada escena. La música de
fondo también se sintetiza (`musica.py`, abajo). Si el cliente prefiere otra,
la pone él desde la biblioteca comercial de Meta o de TikTok al publicar.

**No repitas los sonidos de un video en el siguiente.** El primer video 3 de
JuditoADS tenía los mismos pops del video 2 y Junior lo notó al instante. Con
la capa pro se usan los suaves (abajo); con la biblioteca enérgica, los de la
primera tabla.

## Cómo se escribe

En la plantilla de cada escena: `data-sfx="nombre@segundo[:duración][/nivel]"`,
separados por espacios.

```html
<template id="intro" data-sfx="brillo@0.1 bloop-sube@0.75 pop@0.8 sello@1.75 subida@0:1.7 grave@0/-10">
```

- El **segundo** se cuenta desde el inicio de la escena. Va con el `--d` de lo
  que suena.
- La **duración** solo cuenta en `subida`, `viento`, los `whoosh`, los
  `barrido`, `subida-suave` y `acorde-suave`.
- En `cristal`, `golpe-suave` y `aviso` el número después de `:` es la
  **nota**, no la duración: `cristal@1.9:1`, `cristal@3.5:2`… sube como una
  escala.
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

## Suaves (capa pro)

Poco volumen y poco brillo. Uno o dos por escena, más el del panel.

| Nombre | Suena como | Para |
| --- | --- | --- |
| `sub` | Un grave hondo y corto | El primer cuadro, un corte seco importante |
| `cristal` | Una nota de cristal (`:0` a `:6`, de grave a agudo) | Algo que aparece, un visto, un logo |
| `clic-suave` | Un clic de interfaz | Algo que se enciende, una tarjeta que se marca |
| `tecla` | Un tic muy corto | Un número que cuenta, un deslizador |
| `golpe-suave` | Un golpe blando (`:0` a `:3`) | Lo que cae y se apoya |
| `aviso` | Dos notas de notificación (`:0` neutro, `:1` alerta, `:2` buena noticia) | Avisos que llegan |
| `datos` | Una ráfaga de tics agudos | Datos que llegan, un tablero |
| `barrido-suave` | Un soplo que sube | El panel que cambia de escena |
| `barrido-grave` | Un soplo grave | El panel en círculo |
| `subida-suave` | Una subida con tono | Los bucles: sube y corta con la escena |
| `acorde-suave` | Un acorde que se abre | El cierre |
| `rotura` | Metal que se parte y astillas que caen | Algo que se rompe |
| `silbato` | Dos pitazos de árbitro | Una regla nueva, una jugada que se marca |
| `arranque` | Un zumbido que sube | Una máquina que vuelve a andar |

## Música de fondo

`python3 musica.py` (después de `build.py`) la sintetiza en
`salida/musica.wav` y `sfx.py` la mezcla debajo de los efectos
(`MUSICA_DB`, −9 dB):

- 100 golpes por minuto, cuatro acordes (Fa maj7, La m7, Re m9, Do maj7),
  colchón, arpegio con eco, bombo y platillo bajitos;
- las escenas que duran múltiplos de 0,6 s cortan en el golpe;
- en las escenas de bucle se va la batería y el colchón se oscurece, y vuelve
  de golpe en la escena siguiente;
- al final queda el acorde de Do sonando.

Si no quieres música, borra `salida/musica.wav` antes de correr `sfx.py`.

## Con voz

Si el video lleva voz (la del dueño o un locutor), los efectos tienen que
quedar debajo. `voz.py` los baja solos mientras la voz habla
(`references/voz.md`). Igual conviene:

- **Menos efectos en las escenas con mucha voz**: los pops de cada palabra
  sobran si la voz dice la frase.
- **Dejar sonar los efectos que cuentan algo** (la caja registradora, el
  sello) en una pausa de la voz.
