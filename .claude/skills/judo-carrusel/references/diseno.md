# Cómo se diseña un carrusel de la casa

Contenido:
1. Formatos
2. Lo que lleva cada lámina
3. Las 8 piezas en láminas
4. Tipos de lámina (marcado)
5. Medidas, letra y contraste
6. Producción y revisión

---

## 1. Formatos

| Para | Medida | Cómo |
| --- | --- | --- |
| Instagram y Facebook (feed) | 1080 × 1350 (4:5) | Por defecto. `.tira` con `style="--alto:1350px"`. |
| Cuadrado | 1080 × 1080 (1:1) | `style="--alto:1080px"`. |
| LinkedIn (documento) | 1080 × 1350 | `node render.mjs --pdf` arma el PDF. |

- **Instagram admite hasta 20 láminas.** Lo que funciona son de 7 a 10.
- **En la cuadrícula del perfil**, Instagram recorta la portada a 3:4. Lo
  importante de la lámina 1 va dentro de los 88 cqw del centro.
  `revisar.mjs` lo comprueba.
- **Medidas en cqw:** el ancho de la lámina es 100; el alto, 125 en 4:5.

## 2. Lo que lleva cada lámina

El script de `carrusel.html` lo agrega solo:

- **El pie:**
  - el logo y el @ de la marca (`MARCA` en el script);
  - el progreso (una barra por lámina, la actual resaltada);
  - "Desliza →" en todas menos la última, que dice "Guárdalo".
- **El hilo:** una línea suave que cruza todas las láminas a la altura del
  pie, con un punto en cada unión. Hace que el carrusel se lea como una sola
  pieza e invita a deslizar.

**Una idea por lámina.** Si una lámina necesita dos títulos, son dos
láminas.

## 3. Las 8 piezas en láminas

| Lámina | Pieza | Qué lleva |
| --- | --- | --- |
| 1 | Gancho | Un titular de 12 palabras o menos, grande, con una palabra resaltada; un kicker (el tema) y una imagen que sorprende (un emoji 3D, una foto real). |
| 2 | Introducción | Qué se lleva el que desliza ("Desliza: los 5, en orden"). Funciona sola, porque Instagram a veces vuelve a mostrar el carrusel empezando por la 2. |
| 3 a 4 | Cuerpo 1 | Lo primero útil. La lámina 4 termina con el bucle abierto (`.bucle`). |
| 5 a 6 | Cuerpo 2 | Se abre cerrando el bucle. La 6 termina con el segundo bucle. |
| 7 | Cuerpo 3 | Lo más valioso: lo que se guarda. |
| 8 | Llamado a la acción | "Si llegaste hasta aquí" + un solo siguiente paso (`.boton`) + el contacto. |

Con más o menos contenido se estira o se encoge el número de láminas por
cuerpo. El orden no se cambia.

Cada lámina lleva `data-pieza` (por ejemplo `"5 · Cuerpo 2 + 6 · Bucle
abierto"`) y `data-alt` (el texto alternativo). `revisar.mjs` avisa si falta
una pieza o un texto alternativo.

## 4. Tipos de lámina (marcado)

El ejemplo (`carrusel.html`, "5 errores que hacen que tu anuncio no venda")
usa casi todos. Cada lámina es una `<section class="lamina">` con un
`<div class="cuerpo">` adentro.

| Pieza | Marcado |
| --- | --- |
| Portada | `.kicker` + `.titular` (con `.hl` en la idea clave) + `.emoji` con `margin-top:auto` |
| Promesa | `.titular.mediano` + `.fichas-mini` (los números que vienen) + `.texto` |
| Paso o error numerado | `.emoji.esquina` + `.fila` (`.numero` y `.titular.mediano`) + `.texto` |
| Mal y bien | `.mal` y `.bien`, cada uno con `<b>` de título y una frase |
| Bucle abierto | `.bucle` al final del cuerpo: queda abajo, con flecha |
| Dato grande | `.dato` (un número de 30 cqw) + `.texto` con la fuente |
| Captura del producto | `.telefono` con la captura real en `<img>` |
| Foto real de fondo | `.foto-fondo` + `.velo` en la lámina; el cuerpo encima |
| Llamado | `.titular.mediano` + `.texto` + `.boton` + la dirección + `.contacto` |

- **Énfasis:**
  - `.hl` resalta con fondo del color de acento, para la idea principal;
  - `.acento` solo cambia el color, para las frases clave dentro de un
    párrafo.
- **Emojis 3D de Fluent** (licencia MIT): se bajan de
  `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/<Nombre>/3D/<nombre>_3d.png`.
  El nombre exacto se busca en el repositorio: 🎯 es `Bullseye`, no
  `Direct hit`.

## 5. Medidas, letra y contraste

- **Márgenes de 7 cqw.** Nada pegado al borde (a menos de 5 cqw).
- **Letra mínima de 28 px** a 1080 de ancho. El texto normal va en
  `.texto`, a 5,3 cqw (57 px).
- **Palabras:**
  - el titular de la portada, 12 como mucho;
  - cada lámina, 40 como mucho.
  - Si no cabe, sobra texto: recorta, no achiques la letra.
- **Contraste medido:**
  - 4,5:1 para el texto;
  - 3:1 para los titulares muy grandes;
  - lo mismo para el texto sobre el resaltado.
- **El contenido cabe en el cuerpo.** Si se mete en el pie, `revisar.mjs`
  avisa: recorta texto o achica la imagen.

## 6. Producción y revisión

```bash
cp -r <esta skill>/assets/proyecto <destino>/<nombre>
cd <destino>/<nombre>
python3 aplicar-marca.py marca.json carrusel.html   # la marca (references/marca.md)
node revisar.mjs                                    # textos, márgenes, contraste, que quepa
node render.mjs --pdf                               # salida/01.png … y carrusel.pdf
python3 hoja.py                                     # salida/hoja.jpg: todas en fila
```

1. **Pon en el script** de `carrusel.html` el logo y el @ de la marca
   (`MARCA`).
2. **Abre `carrusel.html`** en el navegador para ver la mesa: la tira entera y
   las notas de cada lámina.
3. **Mira `salida/hoja.jpg`** antes de entregar. Busca:
   - que se lean como una sola pieza;
   - que ninguna lámina quede vacía a medias;
   - que el hilo no tape nada.
