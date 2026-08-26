# Errores

Errores **cometidos de verdad**, qué los causó y qué costaron. Es el archivo
más valioso de la carpeta: todo lo demás se puede reconstruir desde el
conocimiento general; esto no.

Formato: qué pasó · por qué se coló · la regla que queda.

---

## 1 · La tipografía del logo en todos los titulares

**Qué pasó.** Se usó Baloo 2 —la redonda gruesa del propio wordmark— para
todos los titulares del sitio ABA. El cliente pidió "profesional" durante un
chat entero y siguió sin estarlo.

**Por qué se coló.** Se defendió con un argumento que suena bien: *"es fiel al
logo"*. La fidelidad al logo se confundió con repetirlo.

**La regla.** La tipografía **equilibra** la marca, no la repite. Logo alegre
→ tipografía seria. El registro juguetón se queda en el logo.

**Costó** una versión entera.

---

## 2 · El color de la marca, invertido

**Qué pasó.** El logo tenía un wordmark naranja y un corazón de cuatro piezas.
Se construyó todo apoyado en el naranja —antetítulos, enlaces, botones,
resplandores, marcadores, pie— y las cuatro piezas quedaron en rayas de 3px.

**Por qué se coló.** El naranja era el color más grande del archivo del logo.
Se confundió superficie con identidad.

**La regla.** Manda **lo que alguien recordaría del logo al día siguiente**.
Casi nunca es el texto. Y el color de acción es **uno solo**: si aparece
también en enlaces e iconos, deja de señalar.

**Costó** otra versión entera.

---

## 3 · El comentario decía una cosa y el código hacía otra

**Qué pasó.** El CSS llevaba escrito, literalmente, que estaba *"concentrando"*
los colores del corazón donde significaran algo. Debajo, el mismo archivo los
reducía a rayas de 3px mientras el naranja se llevaba todo.

**Por qué se coló.** Escribir la intención en un comentario **se siente** como
haberla ejecutado. Nadie vuelve a leer su propio comentario con desconfianza.

**La regla.** Un comentario no es prueba de nada. La captura de pantalla sí.
Cuando un comentario afirme un criterio de diseño, hay que mirar el render y
confirmar que se cumple.

---

## 4 · El clip equivocado en el hero

**Qué pasó.** La portada abría con un plano de archivo de un niño con un
peluche, que podría ilustrar cualquier cosa. El clip que probaba el servicio
—terapeutas en el suelo con varios niños, en una sala preparada— estaba a
media página **y bajo un velo del 93%**.

**Por qué se coló.** Se compuso la plantilla primero (hero con la media en
columna derecha, 3:2) y luego se metió el material del cliente en el hueco.
Se eligió el clip que encajaba en el hueco, no el que decía algo.

**La regla.** Mirar todo el material **antes** de componer y preguntar cuál es
la prueba de lo que hace el negocio. Esa va primero y grande. Un plano general
necesita anchura: va a sangre, no en una columna.

**Corolario.** Al cambiar la imagen hay que cambiar el texto que la acompaña y
su `alt`. Un `alt` que describe la foto anterior es una mentira que solo lee
quien usa lector de pantalla.

---

## 5 · El amarillo que no sostenía texto

**Qué pasó.** El número del paso 2, en el amarillo del logo, daba **3,09:1**
sobre blanco. Es texto: necesita 4,5:1. Se veía perfectamente bien en la
pantalla del que lo hizo.

**Por qué se coló.** Se aprobó mirando. El amarillo es el color donde peor
funciona la intuición: parece vivo y contrasta fatal.

**La regla.** Cada color de marca en dos intensidades — pura para lo
decorativo, profunda (≥4,5:1 en los dos sentidos) para lo que sostiene texto o
un glifo blanco. Y se calcula, siempre.

---

## 6 · El trazo de fondo que se comió el contraste

**Qué pasó.** Al añadir motivos de línea de fondo, el texto secundario que
cayera justo encima de un trazo bajaba a **3,89:1**. El cálculo original se
había hecho contra la superficie limpia.

**Por qué se coló.** Se midió el color de la variable, no el fondo compuesto.

**La regla.** Al añadir cualquier textura de fondo, **recalcular** el texto que
va encima contra el píxel del trazo. Se arregló por los dos lados: secundario
más oscuro y trazo limitado al 13%.

---

## 7 · La pastilla de icono que pisó su propio acento

**Qué pasó.** Las seis tarjetas de servicio salieron con el icono **del mismo
color** en vez de rotar por las cuatro piezas.

**Por qué se coló.** La clase de la pastilla declaraba su propia variable de
acento, que pisa la que hereda de la tarjeta. Y solo se ve en el render: el
código de las dos partes parece correcto por separado.

**La regla.** `--acc: inherit` en la pastilla. Y más general: **una rotación de
color se comprueba en la captura**, no leyendo el CSS.

---

## 8 · El raíl que se pasaba de largo

**Qué pasó.** La línea que unía los cuatro pasos del proceso seguía ~120px más
allá del último nodo, hacia la nada.

**Por qué se coló.** Se dibujó como una sola línea de lado a lado del
contenedor (`left: 8%; right: 8%`) en vez de como tramos entre nodos.

**La regla.** Los conectores los dibuja **cada elemento hacia el siguiente**
(`:not(:last-child)::after`), así terminan solos donde tienen que terminar y
se apagan cuando la rejilla cambia en móvil.

---

## 9 · Falsos positivos que costaron tiempo

No son errores del sitio, sino de la forma de comprobarlo. Cuestan igual.

- **Medir a mitad de la transición.** El barrido reportó bloques "ocultos" en
  media docena de rutas: se medía justo al terminar de hacer scroll, con la
  animación de 0,7 s todavía corriendo. → Esperar ~1,1 s antes de medir.
- **Recortar mal para medir contraste.** Dos superficies dieron "BAJO"; era
  que el recorte dejaba dentro píxeles de texto y una comilla decorativa que
  no era hija del elemento. → Un resultado sospechoso se comprueba antes de
  creerlo.
- **`pkill -f "next start"`.** El patrón coincide con la propia línea de
  comando del shell y lo mata. Peor: deja un servidor viejo sirviendo HTML con
  un hash de CSS que ya no existe, la página sale **sin estilos** y parece un
  fallo de maquetación catastrófico que no existe. → Buscar el PID real o
  arrancar en otro puerto.
- **Barridos demasiado grandes.** Muchas rutas y contextos en un proceso →
  muerte por falta de memoria (código 137). De 5 en 6 rutas.

---

## Cómo añadir uno

En el mismo commit del trabajo que lo enseñó. Con el número o el caso
concreto: *"el amarillo del logo mide 3,09:1 sobre blanco"* sirve; *"cuidado
con los colores claros"* no sirve.

Y si alguno de estos resulta equivocado, se corrige aquí y se deja dicho que
lo estaba.
