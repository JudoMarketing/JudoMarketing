# Método

El orden en que se toman las decisiones de diseño de un sitio de cliente.

El orden importa: cada paso restringe al siguiente. Si se elige la tipografía
antes que el tono, se elige a ojo; si se elige la paleta antes de mirar el
logo, hay que rehacerla cuando llegue el logo.

---

## 0 · Antes de abrir el editor

Hace falta el logo en su archivo original (no una captura de la web vieja),
**el material audiovisual en su máxima resolución**, saber a qué se dedica el
negocio, y **quién es el visitante y en qué estado llega**.

Lo de la resolución no es un detalle técnico: es un techo. Un clip de 720p se
deshace en un hero a todo el ancho y eso no se arregla codificando mejor. Se
pide el día 1, con el resto de los accesos.

Lo tercero es lo que decide casi todo lo demás y es lo que más se salta.

> En el sitio de terapia ABA el visitante es una madre que acaba de recibir un
> diagnóstico, cansada, mirando el móvil entre dos cosas. Eso decidió que el
> teléfono viviera fijo en una barra inferior (zona del pulgar), que los
> seguros aparecieran arriba y no al final (es su primer filtro real), y que
> el titular respondiera qué, para quién y cómo empezar en tres segundos.

Un sitio de contratistas, un restaurante y una clínica **no** se distinguen
por el color: se distinguen por lo que el visitante necesita resolver.

---

## 1 · La paleta sale del logo, no del gusto

Se abre el archivo del logo y se muestrean sus colores reales. No se eligen
colores "que peguen".

Y dentro del logo hay que decidir **qué mitad manda**. Es la decisión de
identidad más importante y la más fácil de fallar.

> El logo de la agencia ABA tenía un wordmark naranja y un corazón de cuatro
> piezas de colores. Se construyó una versión entera apoyada en el naranja
> —antetítulos, enlaces, botones, resplandores, pie— con las cuatro piezas
> reducidas a rayas de 3px. Estaba al revés: el corazón es la marca, el
> naranja es una palabra escrita. Hubo que rehacerlo.

Cómo decidirlo: **lo que alguien recordaría del logo al día siguiente** es lo
que manda. Casi nunca es el texto.

### Un color de acción, y solo uno

Un color, reservado para el botón que se quiere que pulsen. Si ese color
aparece también en enlaces, iconos y adornos, deja de señalar.

En el sitio ABA el naranja quedó **solo** en el botón de acción — ni siquiera
en los resplandores de las bandas oscuras. El resto lo lleva un azul
institucional.

### Colores de marca que no sostienen texto

Un amarillo o un verde claro de logo casi nunca dan contraste. La solución no
es descartarlos: es darle a cada color **dos intensidades**.

- **Pura** — decorativa: reglas, cintas, marcas, fondos donde nada se apoya.
- **Profunda** — funcional: cualquier cosa que sostenga texto o un glifo
  blanco. Se oscurece hasta que dé 4,5:1 con blanco encima **y** 4,5:1 como
  texto sobre blanco. Con las dos condiciones, la gama se puede usar rotunda
  en cualquier sitio sin casos especiales.

Del amarillo `#f8e000` salió el oro `#8a6a00` (5,07:1 en ambos sentidos).
Oscurecer un amarillo hacia el **oro** conserva la identidad de la pieza;
hacia el oliva la pierde.

En [VERIFICACION.md](VERIFICACION.md) está el script que calcula esto.

---

## 2 · La tipografía equilibra la marca, no la repite

Regla que costó una versión entera aprender:

> **Si el logo es alegre, la tipografía del sitio va seria. Si el logo es
> serio, la tipografía puede permitirse carácter.**

Se usó Baloo 2 —la redonda gruesa del propio wordmark— para todos los
titulares, defendiéndolo como "fiel al logo". Era justo lo que impedía que el
sitio se leyera como profesional: el logo ya es juguetón, y repetir ese
registro en cada titular duplica la simpatía en vez de equilibrarla. Una
tipografía seria al lado de una marca alegre se lee como una consulta; una
alegre al lado de otra alegre, como una guardería.

El registro juguetón se queda donde le corresponde: **en el logo**.

Emparejamiento de partida (Google Fonts, buena cobertura de español):
titulares en **Plus Jakarta Sans**, texto largo en **Inter**.

Y fuera las manuscritas en la interfaz. Una firma en tipografía de puño y
letra convierte cualquier página en una tarjeta de felicitación.

---

## 3 · Nada de emoji como iconos

Un emoji lo dibuja el sistema operativo: cambia de forma, de color y de peso
entre Windows, Android e iOS. La misma tarjeta se ve distinta en cada visita
y nunca se parece a la marca.

Se dibuja un juego propio: misma rejilla (24), mismo grosor (1,75), mismos
remates. En [MODERNO.md](MODERNO.md) está el componente.

**Los iconos se juzgan al tamaño real de uso**, montados en una hoja de
contactos. A 72px todo se entiende; a 27px, que es como se muestran, una pieza
de puzle es una mancha dentada y un apretón de manos es un garabato. Los dos
hubo que cambiarlos (por un edificio de clínica y por un adulto con un niño).

Cuando una metáfora no sobreviva al tamaño real, se cambia la metáfora. No se
agranda el icono.

---

## 4 · El lienzo decide si la marca se ve

Un fondo crema apaga los rojos y amarillos; un neutro frío los hace cantar.
Si la identidad depende de colores vivos, el lienzo va neutro y frío.

Tres superficies bastan: blanco, un gris muy claro y otro un punto más
oscuro. Con eso se alterna el ritmo de la página sin inventar fondos.

---

## 5 · La composición sirve al visitante, no al portafolio

- **Lo que decide la llamada va arriba.** En una agencia de salud, los
  seguros; en un contratista, la zona que cubre; en un restaurante, si hay
  reparto.
- **La acción principal, al alcance del pulgar en móvil** — barra fija
  inferior, no solo en la cabecera.
- **Una acción por pantalla.** Dos botones del mismo peso es ninguno.
- **Nada de fotos de banco de imágenes fingiendo ser el cliente.** Si no hay
  fotos reales, se resuelve con tipografía, color y trazo. Un testimonio con
  la inicial en un disco de color es honesto; con una cara comprada, no.

### El material real manda sobre la plantilla

> El sitio ABA abría con un clip de archivo de un niño con un peluche, que
> podría ilustrar cualquier cosa. El clip que probaba el servicio —terapeutas
> en el suelo con varios niños— estaba a media página bajo un velo del 93%.

Antes de componer: mirar todo el material del cliente y preguntar **cuál es la
prueba de lo que hace**. Esa va primero, y grande. Un plano general necesita
anchura: va a sangre, no dentro de una columna.

Y cuando cambie la imagen, cambia el texto que la acompaña y su texto
alternativo. Un `alt` que describe la foto anterior es una mentira que solo
lee quien usa lector de pantalla.

---

## 5b · La escala: lo que hace que "todo encaje"

Cuando un cliente dice que algo se ve **rústico** y no sabe señalar qué, casi
siempre es esto: los espacios no comparten serie.

En el sitio de terapia, la hoja no tenía **ni un solo token de espaciado**.
Cada hueco era un `clamp()` inventado para ese elemento: 20, 30, 26, 16, 10,
22, 8. Doce clamps distintos, ninguno relacionado con otro. Nada estaba mal
por separado y el conjunto parecía improvisado, porque lo estaba.

**Una serie, y el paso crece con la importancia del corte.**

```css
--s-1: 4px;   --s-2: 8px;   --s-3: 12px;
--s-4: 16px;  --s-5: 24px;  --s-6: 32px;
--s-7: 48px;  --s-8: 64px;  --s-9: 96px;
```

Y se reparten por jerarquía, no por lo que "queda bien":

| Entre | Paso | Por qué |
| --- | --- | --- |
| cinta y antetítulo | `--s-2` | Son **una** pieza |
| antetítulo y titular | `--s-4` | Misma unidad |
| titular y entradilla | `--s-5` | Cambio de nivel |
| entradilla y acción | `--s-6` | **El corte mayor**: de informar a actuar |

El error concreto que había: el hueco tras el titular (20px) era **menor** que
el hueco tras la entradilla (30px). Es decir, el espaciado decía que el
titular y la entradilla estaban menos relacionados que la entradilla y el
botón. Justo al revés.

### Y una forma por función

Tres rectángulos iguales seguidos —dos "pastillas" de dato y un botón— y el
ojo no sabe cuál pulsar. Un dato se ve como dato (texto), una acción se ve
como acción (botón). Si la acción principal vive en una barra fija, el botón
que quede en el bloque va **de contorno**: dos botones macizos en la misma
pantalla es ninguno.

### Nada muere bajo la interfaz fija

Si hay barra fija de llamada, el bloque reserva su alto
(`padding-bottom: calc(... + var(--callbar))`). Contenido cortado por debajo
de una barra es la señal más clara de algo mal montado.

### El enemigo silencioso: media queries que se pisan

El ritmo montado sobre la escala se veía pisado y no se entendía por qué. La
causa: un `@media (max-width: 640px)` **posterior** redeclaraba los mismos
márgenes y rellenos con valores a mano, y por orden de aparición ganaba.

> Cada media query lleva **sólo lo que de verdad cambia en ese ancho**. Una
> segunda copia de lo que ya resuelve el bloque anterior es una trampa que se
> descubre midiendo el estilo computado, no leyendo el archivo.

```js
// lo que lo delató
getComputedStyle(li).padding   // "8px 15px" cuando la regla decía 0
```

## 6 · Al cambiar la maquetación, revisar los recursos

La regla que más caro ha salido, y la más fácil de olvidar:

> **Un cambio de maquetación invalida las decisiones de recurso tomadas bajo
> la maquetación anterior.**

Mover un video de una caja de 600px a un hero a sangre no es sólo CSS: el peso,
la resolución, el recorte y hasta el efecto de paralaje que lo amplía dejan de
estar bien calculados. Lo mismo con imágenes, iconos y tamaños de tipografía.

Y un panel de texto sobre imagen **esconde algo**: hay que ver qué, pintando su
contorno sobre el plano limpio. Ver `VERIFICACION.md`.

## 7 · Verificar antes de entregar

No es un paso opcional del final: es parte del trabajo.
Ver [VERIFICACION.md](VERIFICACION.md).

---

## Resumen para pegar en un chat

```
1. Quién visita y en qué estado llega.
2. Paleta muestreada del logo; decidir qué mitad manda; un color de acción.
   Cada color de marca en dos intensidades (pura y profunda ≥4,5:1).
3. Tipografía que EQUILIBRA el logo (alegre → seria). Sin manuscritas.
4. Iconos SVG propios, juzgados a su tamaño real.
5. Lienzo neutro frío si la marca depende de colores vivos.
6. Arriba lo que decide la llamada. El material real del cliente manda.
7. Espaciado de UNA escala, repartido por jerarquía. Una forma por función.
   Nada debajo de la barra fija. Media queries sin copias que se pisen.
8. Si cambia la maquetación, revisar los recursos que vivían dentro.
9. Medir contraste, fidelidad del material, y qué tapa cada panel. Barrer las
   rutas; comprobar sin JS y con reduced-motion.
```
