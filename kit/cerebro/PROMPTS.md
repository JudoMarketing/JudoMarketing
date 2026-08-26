# Prompts

Para pegar en un chat de Claude Code. Están en imperativo y con las
restricciones dentro, porque un prompt sin restricciones devuelve una
plantilla.

---

## 1 · Arrancar un sitio nuevo

```
Vamos a construir el sitio de <NEGOCIO>.

Antes de escribir código, lee kit/cerebro/METODO.md y kit/cerebro/ERRORES.md.

Contexto:
- A qué se dedica: <…>
- Quién visita el sitio y en qué estado llega: <…>
- Qué tiene que conseguir el sitio: <llamadas | reservas | ventas | …>
- Material: logo en <ruta>, fotos/video en <ruta>
- Idiomas: <es | es+en>

Antes de componer nada:
1. Muestrea la paleta del archivo del logo y dime QUÉ MITAD del logo mandará
   y por qué.
2. Propón el emparejamiento tipográfico, teniendo en cuenta que la tipografía
   EQUILIBRA la marca, no la repite.
3. Mira TODO el material y dime cuál es la prueba de lo que hace el negocio.
   Esa va en el hero.

Pásame esas tres decisiones antes de maquetar. No uses emoji como iconos ni
fotos de banco de imágenes fingiendo ser el cliente.
```

---

## 2 · Revisión autocrítica

El que más rinde. Se lanza **antes** de dar algo por terminado.

```
Revisa lo que acabas de construir buscando qué está MAL, no confirmación de
que está bien. Lee kit/cerebro/ERRORES.md primero: los errores de esa lista
son los que más se repiten.

Concretamente:
- Toma capturas y MÍRALAS. No des por bueno nada leyendo el código: en este
  repo ya pasó que un comentario afirmaba un criterio que el código no
  cumplía, y que seis tarjetas salieran del mismo color.
- ¿La tipografía equilibra la marca o la repite?
- ¿Manda la mitad correcta del logo? ¿Hay UN color de acción?
- ¿El material del cliente está usado por lo que prueba, o por lo que encajaba
  en el hueco de la plantilla?
- ¿Hay algún texto cuyo contraste no hayas calculado? Calcúlalo.
- ¿Queda algún dato de relleno sin marcar?

Dime lo que encuentres aunque no lo haya notado nadie. Si no encuentras nada,
no buscaste de verdad.
```

---

## 3 · Verificar antes de entregar

```
Verifica siguiendo kit/cerebro/VERIFICACION.md y pásame los números, no un
"está bien":

- typecheck / lint / build
- todas las rutas a 390, 768 y 1440: desbordamiento horizontal y errores de
  consola
- todos los pares de texto de la paleta, con su ratio
- si hay texto sobre imagen o video: medido sobre píxeles renderizados, en
  varios fotogramas
- sin JavaScript y con prefers-reduced-motion

Si algo no pasa, arréglalo y vuelve a medir. Si algo no se puede arreglar,
dime cuál y por qué.
```

---

## 4 · Guardar conocimiento en el cerebro

Es la que mantiene vivo esto. Basta decirlo en el chat: Claude escribe el
archivo.

```
Anota esto en kit/cerebro/: <lo aprendido>.

Ponlo en el archivo que corresponda (ERRORES.md si fue un fallo, METODO.md si
es una decisión de diseño, MODERNO.md si es una técnica, VERIFICACION.md si es
una comprobación). Con el caso concreto y el número, no en abstracto. Si
contradice algo que ya está escrito, corrígelo y deja dicho que estaba
equivocado.
```

Y al terminar un trabajo:

```
¿Aprendiste algo en esta sesión que la siguiente necesitaría saber? Si sí,
anótalo en kit/cerebro/ en este mismo commit.
```

---

## 5 · Rediseñar un sitio que ya existe

```
Rediseña <SITIO>. Antes de tocar nada, lee kit/cerebro/METODO.md y sé
autocrítico con lo que hay: dime las 3 o 4 cosas que hacen que hoy no se lea
profesional, con el motivo concreto de cada una.

No cambies el texto ni la estructura de páginas salvo que la razón sea de
diseño (por ejemplo: si cambia la imagen de un bloque, su texto y su alt
tienen que cambiar con ella — y me lo dices).

Empieza por las decisiones de identidad (paleta, tipografía, material) y
pásamelas antes de maquetar.
```

---

## 6 · Iconos

```
Sustituye los emoji por un juego de iconos SVG propio: rejilla de 24, grosor
1,75, remates redondos, currentColor y aria-hidden.

Tipa los nombres (IconName), no string, para que un nombre mal escrito no
llegue a producción como un hueco.

Luego monta una hoja de contactos con cada icono a 72px Y a su tamaño real de
uso, y MÍRALA. Cualquier metáfora que no sobreviva al tamaño real, cámbiala
por otra — no agrandes el icono.
```

---

## 7 · Después de cambiar la maquetación

El que habría evitado el fallo más caro de la lista de errores.

```
Acabas de cambiar <QUÉ CAMBIÓ: p. ej. el hero de una caja de 3:2 a todo el
ancho>. Revisa ahora los recursos que viven dentro de ese bloque, porque las
decisiones que se tomaron para la maquetación anterior ya no valen:

- Video e imágenes: ¿a qué tamaño se muestran HOY? Mide la calidad al tamaño
  real con SSIM contra el máster, no a ojo.
- ¿Hay algún efecto (paralaje, zoom, escala) ampliando ese material?
- Recortes y object-position: ¿sigue viéndose lo que importa?
- Tamaños de tipografía y de icono en el bloque.

Dime qué encontraste con números, y qué tuviste que rehacer.
```

## 8 · Qué esconde el panel

```
El hero lleva un panel de texto sobre <imagen | video>. Píntame el contorno
del panel sobre el plano SIN velo y sin el texto, y dime exactamente qué está
tapando.

Si tapa algo que importa, renderiza 3 alternativas de encuadre o de
composición y enséñamelas antes de elegir. No decidas sobre el papel.
```


---

## Lo que no hay que pedir

No hace falta pedir "que quede bonito" ni "moderno" a secas: eso devuelve la
plantilla del mes. Lo que cambia el resultado es decir **quién visita el sitio
y qué tiene que conseguir**, y exigir que las decisiones de identidad se
justifiquen antes de maquetar.
