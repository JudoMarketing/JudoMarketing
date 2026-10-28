# Cómo se ve un video de la casa

Salió de los videos de JuditoADS (octubre de 2026). Junior revisó el primero
escena por escena en cinco versiones. Cada regla de aquí es una corrección
suya o algo que costó rehacer.

**El nivel de la casa es el de `estilo-pro.md`:** un fondo distinto en cada
escena, una idea por plano, texto que entra por máscara, iconos vectoriales y
sonido suave con música. Lo de este archivo vale para los dos estilos; donde
dice "rebote" o "resaltado amarillo", es de la biblioteca enérgica.

Contenido:
1. Formato
2. Zonas del cuadro
3. Pantallas reales
4. Que no parezca hecho por IA
5. Mapas y vuelos
6. Mapas conceptuales (videos que explican cómo funciona algo)
7. Cifras
8. Cierre
9. Método de trabajo con el cliente

---

## 1. Formato

- **Medida:** 1080 × 1920 a 60 cuadros por segundo.
- **Duración:** de 20 a 60 segundos según el objetivo (ver
  `estrategia-8-piezas.md`, sección 7).
- **El guion va en texto grande en pantalla**, en la letra de titulares de la
  marca, con la parte clave resaltada en el color de acento. Se entiende sin
  sonido aunque después se le ponga voz.
- **Escenas:** una idea por escena, de 2 a 4 segundos.
- **Listas:** uno por uno, unos 2 segundos cada elemento.
- **Efectos:** cada golpe, toque y transición lleva su efecto. Se sintetizan
  en `sfx.py`: no hay música ni sonidos con derechos.
- **Cara del dueño:** si sale, va al principio y dura 2 o 3 segundos.

## 2. Zonas del cuadro

Medidas en cqw: el ancho del cuadro es 100 y el alto 177,8.

- **Texto entre 14 y 56 cqw** cuando hay un teléfono, una foto o un mapa
  abajo.
- **El teléfono desde 60 cqw**, cortado por abajo.
- **Zonas que tapa la app (Reels y TikTok); ahí no va nada importante:**
  - **Arriba:** de 0 a 14 cqw.
  - **Abajo:** de 142 cqw hasta el final.
  - **Derecha:** de 86 a 100 de ancho, entre 96 y 142 de alto.
- **El teléfono nunca toca el texto.** Fue la corrección de casi todas las
  escenas del primer video.

`revisar.mjs` avisa si un texto cae en esas zonas. En la mesa de revisión, el
botón "Ver zonas" las pinta de rojo.

## 3. Pantallas reales

- **Lo que se muestra es el producto de verdad**, en modo demo con un negocio
  de ejemplo (en JuditoADS, "Café Luna Miami"). Nunca una maqueta, nunca
  datos reales de clientes.
- **Sin zoom en las pantallas.** Junior pidió quitar los acercamientos: la
  captura se ve entera y quieta.
- **Para señalar:**
  - una flecha o un marco amarillo grueso (`.marco`), ajustado al borde de lo
    que se señala;
  - un dedo que toca (`.toque`), en el segundo en que pasa.
- **Ningún titular de la pantalla queda cortado por la barra de estado** del
  teléfono. Se ajusta con `--s`, que sube la captura dentro del teléfono.
- **Sin la isla negra del iPhone** (se leía como "una mancha"): basta una
  barra de estado con la hora.
- **Capturas:** con Playwright, en un viewport de teléfono (390 × 844 a 2x) y
  con la app en modo demo.

## 4. Que no parezca hecho por IA

- **Una ilustración plana genérica se lee barata.** El genio plano del primer
  video se leyó como "un mojón morado".
- **Lo que funcionó:**
  - emojis 3D de Microsoft Fluent (licencia MIT); `preparar` en
    `produccion.md` dice cómo bajarlos;
  - objetos modelados en 3D para la ocasión;
  - sombras de verdad (`drop-shadow`);
  - movimiento con rebote y frenado suave (las curvas de la biblioteca
    enérgica) o, en la capa pro, curvas cortas sin rebote;
  - iconos vectoriales Phosphor duotono (`assets/proyecto/vectores/`,
    licencia MIT) en la capa pro.
- **Fotos reales del negocio** antes que cualquier imagen genérica. Una foto
  de banco de imágenes no se hace pasar por el cliente.

## 5. Mapas y vuelos

- **Nunca Google Earth ni Google Maps en un anuncio:** sus reglas lo
  prohíben.
- Para "de la Tierra a la oficina", el video 1 de JuditoADS usó CesiumJS con
  imágenes públicas y el crédito visible:
  - NASA para la Tierra;
  - Sentinel-2 de EOX para la región;
  - USGS y NAIP para la ciudad y el edificio.
- Tiene que ser un solo movimiento continuo, sin cortes. Al llegar: un punto
  rojo con una etiqueta blanca y el logo.
- El vuelo se graba aparte y entra como video real (`img.secuencia` con
  `data-video`, ver `escenas.md`).

## 6. Mapas conceptuales (videos que explican cómo funciona algo)

Salió de la primera versión del video 3 de JuditoADS ("Cómo funciona por
dentro", 28 de octubre de 2026). Ver `escenas.md`, sección «Mapa».

**Ojo:** un mapa en todas las escenas se lee como plantilla. Junior lo
rechazó ("idéntico al anterior… los ejemplos son repetitivos"). Úsalo en dos
o tres escenas como mucho y cuenta el resto con las piezas de
`estilo-pro.md`, una composición distinta por idea.

- **Un solo mapa para todo el video**, con los nodos siempre en el mismo
  lugar. Escena a escena cambia lo que se enciende y lo que viaja, nunca la
  posición. Lo que ya estaba lleva `.ya` y la transición es `corte`: se ve
  como un solo movimiento.
- **Tres o cuatro nodos como mucho**, con el logo real de cada parte. Los
  logos de otras marcas van solo para decir que funciona con ellas, con su
  crédito ("Meta, Facebook e Instagram son marcas de Meta Platforms, Inc.").
- **Cada línea tiene un color con significado y se mantiene:**
  - las órdenes en el color primario;
  - el dinero en el acento;
  - la información que vuelve en verde.
- **Lo que viaja dice qué es:**
  - una llave para el permiso;
  - monedas para el dinero;
  - gráficas para los datos;
  - o una etiqueta con texto corto ("el anuncio").
- **La cámara se mueve poco:**
  - un acercamiento para presentar;
  - un alejamiento para mostrar el todo.
- **En los bucles el mapa se apaga** (`--luz-hasta:.18`) y vuelve a
  encenderse en la escena que cierra el bucle.

## 7. Cifras

- **Toda cifra tiene que ser verdad:** la confirma el cliente o tiene fuente.
  "Te llegó por menos de 5¢" se dijo solo cuando Junior confirmó que su
  campaña de $2 al día lo cumplía.
- **Se entienden de un vistazo:**
  - el total y el promedio ("$3,832 y 72 horas · en promedio $639 por
    curso");
  - una comparación cotidiana y corta ("Lo que cuesta una hamburguesa").
- **El precio dice lo que se paga aparte.** En JuditoADS: "+ el presupuesto
  de tus anuncios, que pagas directo a Meta".

## 8. Cierre

- El llamado a la acción, con la dirección exacta, y el dedo tocando el botón
  si hay pantalla.
- **Después, unos 5 segundos quietos con el contacto** (el @ y el WhatsApp
  del negocio). Si la marca es Judo Marketing: @judo.marketing y +1 305 934
  9981.

## 9. Método de trabajo con el cliente

1. **Guion primero.** Se enseña como storyboard (la mesa de revisión de
   `storyboard.html`), escena por escena, con lo que se ve y lo que suena. Si
   se puede publicar como artifact, mejor: el cliente comenta escena por
   escena.
2. **Producir el MP4 cuando el cliente lo aprueba**, o cuando pide el video
   directo.
3. **Antes de entregar:**
   - `revisar.mjs` sin avisos;
   - la hoja con un cuadro cada 2 segundos y la de los cortes (`qa.py`),
     **miradas de verdad**.
   Así salieron los dos últimos arreglos del video 1: un titular cortado por
   la barra de estado y un sello que se iba antes de tiempo.
