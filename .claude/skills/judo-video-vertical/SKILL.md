---
name: judo-video-vertical
description: Videos verticales (Reels, TikTok, Shorts) que se ven hasta el final, para cualquier negocio a partir de un texto guía. Guion en 8 piezas, gancho, bucles, voz y MP4 1080x1920.
license: Uso interno de Judo Marketing
---

# Videos verticales que se ven hasta el final

Convierte un texto guía en un video vertical listo para publicar: el gancho,
el guion en 8 piezas, el storyboard, el guion para voz si lo va a tener, el
MP4 de 1080 × 1920 con efectos y el pie de video. Se adapta al nicho y a la
marca de cualquier negocio. Es el método con el que Judo Marketing (Miami)
hizo los videos de JuditoADS.

Úsala también cuando el usuario pida parte del trabajo: solo el guion, solo
los ganchos, solo el guion para su voz, o rehacer un video con otra
estructura.

## Antes de empezar, lee

Las referencias son cortas y cada una evita un error que ya se cometió.

| Archivo | Cuándo |
| --- | --- |
| `references/estrategia-8-piezas.md` | Siempre. Es la estructura y la autocrítica. |
| `references/nichos.md` | Siempre: busca el nicho del negocio. |
| `references/reglas.md` | Siempre: verdad, reglas de Meta y TikTok, derechos. |
| `references/estilo.md` | Antes de diseñar escenas. |
| `references/escenas.md` | Al escribir el storyboard: el catálogo de escenas con su marcado. |
| `references/marca.md` | Para poner la marca del negocio. |
| `references/voz.md` | Si el video va a llevar voz. |
| `references/sonido.md` | Al poner los efectos. |
| `references/produccion.md` | Para producir el MP4. |
| `references/pie-de-foto.md` | Para el texto que acompaña la publicación. |

## 1. Entender el pedido

Saca del texto guía lo que puedas y **pregunta lo que falte en una sola
lista**, no de a una pregunta:

- **El negocio:** quién es, a qué se dedica, ciudad.
- **El objetivo del video:** vender, conseguir contactos, explicar a quien ya
  preguntó, alcance. Cambia el largo y el llamado.
- **Qué se lleva el que mira:** la promesa.
- **La prueba que hay:**
  - pantallas del producto;
  - fotos o videos del trabajo;
  - números que el cliente puede confirmar.
- **El siguiente paso exacto:** la dirección web, el WhatsApp, la palabra
  para mandar por mensaje.
- **La marca:** logo, colores, sitio web (`marca.md`).
- **El idioma.** Por defecto, el del texto guía. Si quiere dos idiomas, son
  dos videos.
- **Si va a llevar voz.**

Si el usuario pide ir directo, avanza con lo que hay y marca lo que falta
como **"Por confirmar"**. Inventar un dato para no preguntar es peor que
preguntar.

## 2. Escribir el guion

1. **Clasifica el nicho** (`nichos.md`) y anota en una línea quién mira y qué
   le duele.
2. **Cinco ganchos de fórmulas distintas**, puntuados con la rúbrica de
   `estrategia-8-piezas.md`. Elige uno y guarda los otros cuatro para
   enseñarlos.
3. **El guion en 8 piezas**, repartido en escenas de 2 a 4 segundos. Una tabla
   con:
   - la pieza;
   - los segundos;
   - el texto en pantalla;
   - lo que se ve;
   - el sonido.

   Los bucles duran menos de 2 segundos y se cierran con todas las letras en
   la escena siguiente.
4. **La autocrítica** (la lista del final de `estrategia-8-piezas.md`).
   Arregla lo que falle antes de enseñarlo, y anota qué cambiaste y por qué:
   al usuario le sirve saberlo.
5. **Si lleva voz,** el guion de voz por escena, con tiempos, ritmo y tono
   (`voz.md`).

Cuando el texto guía del cliente trae algo que no se puede sostener (una
cifra sin fuente, "en tiempo real", "garantizado", una función que el
producto no tiene), cámbialo y explícalo en una sección "Lo que cambié de tu
texto". Si tienes acceso al código o al sitio del producto, **comprueba ahí
lo que dice el texto** antes de escribirlo. Así se descubrió que JuditoADS
necesita una página de Facebook y no solo Instagram.

## 3. Storyboard

1. **Copia el proyecto:** `cp -r <esta skill>/assets/proyecto <destino>`
   (`produccion.md` dice dónde y cómo).
2. **Pon la marca:** `python3 aplicar-marca.py marca.json storyboard.html`.
   Los scripts de marca están en `scripts/`.
3. **Escribe las plantillas** de cada escena con la biblioteca de
   `escenas.md`, y la lista de escenas con su pieza, texto, lo que se ve y la
   voz.
   - **Reemplaza todo el ejemplo**: es el video de JuditoADS, nada de eso se
     queda.
   - Si una escena se repite con cambios (un mapa conceptual), escríbela con
     un script que la arme una sola vez.
4. **Revisa:**
   - `python3 build.py && node revisar.mjs` y corrige **todo** lo que avise;
   - `node render.mjs --muestra` y mira los cuadros.
5. **Enséñalo:**
   - `storyboard.html` es una mesa de revisión que se abre en el navegador:
     cada escena en bucle, con su texto, su voz y su sonido;
   - si puedes publicar artifacts, publícalo
     (`incrustar.py` arma una sola página con las imágenes adentro);
   - si no, manda el archivo.

## 4. Producir

```bash
python3 build.py && node revisar.mjs && node render.mjs && python3 sfx.py && python3 montar.py <nombre> && python3 qa.py salida/<nombre>.mp4
```

- **El render tarda de 10 a 20 minutos:** déjalo corriendo en segundo plano y
  mientras tanto escribe el pie de video.
- **Al terminar, mira de verdad las hojas** `qa-cada2s.jpg` y `qa-cortes.jpg`.
  Busca:
  - textos cortados o encimados;
  - algo que se va antes de tiempo;
  - un corte que salta.
- **Arregla, renderiza solo esas escenas** y monta otra vez.
- **Si llega la voz grabada:** `python3 voz.py salida/<nombre>.mp4 voz.m4a`
  (`voz.md`).

Si no hay navegador para renderizar (`produccion.md`, sección 1), entrega el
guion y el storyboard y di que el MP4 se produce en Claude Code con esta
misma skill.

## 5. Entregar

Manda el MP4 (y la portada) y responde con:

- **Qué cambió y por qué**, si se rehízo algo o se corrigió el texto guía.
  Corto, en viñetas.
- **El pie de video**, listo para pegar (`pie-de-foto.md`).
- **"Por confirmar":** cada cifra o promesa que el cliente todavía tiene que
  confirmar. Si no hay, no pongas la sección.
- **Los otros cuatro ganchos**, una línea cada uno, por si prefiere otro.

Si el usuario tiene una forma de respuesta propia (por ejemplo, "Te toca a
ti / Listo / Ojo" en Judo Marketing), úsala en vez de esta.

## Lo que no se negocia

Detalle en `reglas.md` y `estilo.md`:

- **Solo se afirma lo que se puede probar.**
- **El gancho se mueve desde el primer cuadro** y se entiende sin sonido.
- **Nada importante en las zonas que tapa la app.** El teléfono y las fotos
  nunca tocan el texto.
- **Pantallas reales en modo demo, sin zoom.** Fotos reales del negocio.
  Nada que parezca hecho por IA.
- **Sin música con derechos.** Sin Google Earth ni Google Maps.
- **Ningún texto con una palabra sola en la última línea, el resaltado
  partido ni contraste bajo.** `revisar.mjs` lo dice; no se entrega con
  avisos sin resolver.
