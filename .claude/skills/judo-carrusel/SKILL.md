---
name: judo-carrusel
description: Carruseles para Instagram, Facebook y LinkedIn que se deslizan hasta el final, para cualquier negocio a partir de un texto guía. Gancho, bucles y llamado en láminas PNG y PDF.
license: Uso interno de Judo Marketing
---

# Carruseles que se deslizan hasta el final

Convierte un texto guía en un carrusel listo para publicar. Hace todo esto:
- la portada que frena;
- las láminas en 8 piezas;
- los PNG de 1080 × 1350 (y el PDF para LinkedIn);
- el pie de foto;
- el texto alternativo de cada lámina.

Se adapta al nicho y a la marca de cualquier negocio. Es el método de Judo
Marketing (Miami), el mismo de sus videos verticales.

Úsala también para un post de una sola imagen: es un carrusel de una lámina,
con gancho, una idea y el llamado.

## Antes de empezar, lee

| Archivo | Cuándo |
| --- | --- |
| `references/estrategia-8-piezas.md` | Siempre. Es la estructura y la autocrítica. |
| `references/nichos.md` | Siempre: busca el nicho del negocio. |
| `references/reglas.md` | Siempre: verdad, reglas de Meta, derechos. |
| `references/diseno.md` | Al armar las láminas: formatos, tipos de lámina, medidas. |
| `references/marca.md` | Para poner la marca del negocio. |
| `references/pie-de-foto.md` | Para el texto que acompaña la publicación. |

## 1. Entender el pedido

Saca del texto guía lo que puedas y **pregunta lo que falte en una sola
lista**:

- **El negocio** y su ciudad.
- **El objetivo:** guardar y compartir, conseguir contactos, vender.
- **La idea del carrusel:** qué se lleva el que desliza.
- **La prueba que hay:**
  - fotos reales;
  - pantallas del producto;
  - números que el cliente puede confirmar.
- **El siguiente paso exacto.**
- **La marca** (`marca.md`), **el idioma** y **dónde se publica** (cambia el
  formato).

Si el usuario pide ir directo, avanza y marca lo que falte como **"Por
confirmar"**. No inventes datos para no preguntar.

## 2. Escribir el carrusel

1. **Clasifica el nicho** (`nichos.md`): quién mira y qué le duele.
2. **Cinco titulares de portada de fórmulas distintas**, con la rúbrica de
   `estrategia-8-piezas.md`. Elige uno y guarda los otros cuatro.
3. **Las láminas en 8 piezas** (`diseno.md`, sección 3). Una tabla con:
   - la lámina y su pieza;
   - el titular;
   - el texto;
   - la imagen.

   Los bucles van al final de las láminas 4 y 6 y se cierran en la lámina
   siguiente.
4. **La autocrítica** (la lista de `estrategia-8-piezas.md`). Corrige antes
   de diseñar, y anota qué cambiaste y por qué.

**Lo que está "Por confirmar" no va en las láminas.** Se escribe la lámina sin
ese dato (o sin la frase que lo necesita) y se lista aparte. Cuando el cliente
lo confirma, se agrega.

Cuando el texto guía trae algo que no se puede sostener, cámbialo y explícalo.
Si tienes el código o el sitio del producto, **comprueba ahí** lo que dice el
texto.

Un ejemplo de lo que la autocrítica encontró en el ejemplo de la skill: "si
Meta frena tu anuncio, sigues pagando el mes" era falso. Meta no cobra lo que
no muestra; lo cierto era "pierdes días de ventas".

## 3. Diseñar y producir

```bash
cp -r <esta skill>/assets/proyecto <destino>/<nombre>   # ya trae los scripts de revisión y de marca
cd <destino>/<nombre>
python3 aplicar-marca.py marca.json carrusel.html
```

- **`marca.json`** va en la carpeta del proyecto (formato en `marca.md`). El
  logo, en `marca/logo.png`.
- **Para sacar la marca de un sitio web:**
  `node <esta skill>/scripts/marca.mjs https://sitio.com marca`.

1. **Escribe las láminas** en `carrusel.html` con los tipos de `diseno.md`.
   Pon el logo, el @ y el nombre de la marca en la tira (`data-logo`,
   `data-usuario`, `data-nombre`).
   - **Reemplaza todo el ejemplo**: es de JuditoADS.
   - **Borra de `img/` lo que no uses.**
2. `node revisar.mjs` y corrige **todo** lo que avise:
   - líneas partidas;
   - bordes;
   - contraste;
   - contenido que no cabe;
   - palabras de más;
   - texto alternativo.
3. `node render.mjs --pdf && python3 hoja.py`, y **mira `salida/hoja.jpg`**
   como si la deslizaras.

Si no hay navegador (`node` con Playwright), entrega:
- el carrusel escrito: la tabla de láminas, lista para diseñar;
- el pie de foto;
- y di que los PNG se producen en Claude Code con esta skill.

## 4. Entregar

Manda los PNG en orden (y el PDF si es para LinkedIn) y responde con:

- **Qué cambió y por qué**, si se corrigió el texto guía. Corto.
- **El pie de foto**, listo para pegar (`pie-de-foto.md`).
- **El texto alternativo de cada lámina**, en orden.
- **"Por confirmar":** cada cifra o promesa que falta confirmar. Si no hay,
  no pongas la sección.
- **Los otros cuatro titulares de portada**, una línea cada uno.

Si el usuario tiene una forma de respuesta propia (por ejemplo, "Te toca a
ti / Listo / Ojo" en Judo Marketing), úsala. Las mismas cosas van adentro:
- el pie y los textos alternativos, en "Listo" o al final;
- lo que falta confirmar, en "Te toca a ti";
- los riesgos, en "Ojo".

## Lo que no se negocia

- **Solo se afirma lo que se puede probar.**
- **Una idea por lámina.** La portada se entiende en un segundo.
- **Un solo llamado a la acción**, al final, con verbo y lugar.
- **Fotos reales del negocio.** Nada que parezca hecho por IA ni banco de
  imágenes haciéndose pasar por el cliente.
- **Ningún texto con una palabra sola en la última línea, el resaltado
  partido, pegado al borde ni con contraste bajo.** `revisar.mjs` lo dice;
  no se entrega con avisos sin resolver.
