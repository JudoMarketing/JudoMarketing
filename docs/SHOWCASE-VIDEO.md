# Videos de portada del showcase

Desde el 4 de octubre de 2026 (pedido de Junior) las fichas del showcase de
los sitios con movimiento enseñan un video corto en vez de la foto: la
entrada animada del hero y un recorrido suave hacia abajo que dispara las
animaciones de las secciones. Unos 5 a 6 segundos, en bucle, sin audio.
Hoy son 14 sitios. God's Home (godshome.app, 12 de octubre de 2026) es la
excepción: enseña sus primeros 7 segundos tal cual, la intro de la creación
que termina en el hero.

## Cómo funciona en la página

- `src/content/portfolio.ts` → `VIDEOS_PORTADA`: los dominios (tal como están
  en el portal, sin `www`) que tienen video. El resto sigue con su foto.
- Los archivos viven en `public/showcase/video/<slug>.mp4` y `<slug>.jpg`
  (el póster: el hero ya cargado). El slug es el dominio con guiones.
- `src/components/PortfolioGrid.tsx` → `PortadaEnVideo`: enseña el póster,
  no baja el video hasta que la ficha entra en pantalla, lo pausa al salir.
  Con "reducir movimiento" o "ahorro de datos" se queda el póster.
- Si el sitio está en `VIDEOS_PORTADA`, el video manda aunque en el portal
  tenga una imagen propia (`portfolio_image`), como pasaba con Delivery Rush.

## Cómo se graba

```bash
pip install imageio-ffmpeg          # ffmpeg con libx264
node scripts/showcase/grabar-videos.mjs              # todos
node scripts/showcase/grabar-videos.mjs zanoah.shop  # uno
```

El script abre cada sitio en Chrome a 1440x900, lo visita una vez para
calentar la caché, y graba la segunda visita con el screencast de Chrome
(cada cuadro con su hora real). Se salta solo la pantalla en blanco, el
destello sin estilos y los cargadores; deja hasta 2.2 s de la entrada, corta
la espera con el hero quieto y pega la bajada completa.

Por sitio se puede ajustar en `SITIOS`: `entrada` (cuánto esperar antes de
bajar, para cargadores largos como el de Johan Moreno), `bajar` (cuántas
pantallas), `saltar` (segundos que se saltan del arranque), `ocultar`
(selectores que se esconden: ventanas de reseñas, cookies, chats), `ancho`
(una pantalla más chica agranda el contenido: JudiMental), `minimo` (para
sitios casi todos negros) y `mp4` (el sitio tiene video propio en MP4: el
Chrome de grabación no reproduce H.264, así que se pasa a WebM al vuelo;
es el caso del hero de The Equipment Source). Con `primeros` no se baja: se
enseñan esos segundos de la entrada tal cual, grabados en una pestaña nueva
porque hay intros que se ven una sola vez por pestaña (God's Home); el póster
es el último cuadro, o el segundo que diga `poster`.

## Para sumar un sitio

1. Agregarlo a `SITIOS` en `scripts/showcase/grabar-videos.mjs`.
2. Grabarlo y **mirar el video entero** antes de subirlo: que no salga una
   ventana emergente, un error de carga o el sitio a medio pintar.
3. Agregar el mismo dominio a `VIDEOS_PORTADA`.

Un proyecto que no está en el portal (sin cliente ni cobro, como God's Home)
se agrega a `PROYECTOS_FIJOS` en `src/content/portfolio.ts` con su nombre,
categoría y descripción en los dos idiomas. Sale primero en el showcase; si
algún día se da de alta en el portal con el mismo dominio, manda el portal.

Se vuelve a grabar cuando un sitio cambia de diseño. Cada video pesa entre
130 y 300 KB, y solo se baja cuando su ficha está en pantalla.

## Fuera, y por qué

| Sitio | Motivo |
| --- | --- |
| vanventuremia.com | Una sola pantalla, sin movimiento. Lleva portada fija (`PORTADAS_FIJAS` en `src/content/portfolio.ts`): el arte de "Private van tours in Miami" que eligió Junior |
| milcoloresapp.vercel.app/hoy | Igual: app de una pantalla |
