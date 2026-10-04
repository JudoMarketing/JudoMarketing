# Videos de portada del showcase

Desde el 4 de octubre de 2026 (pedido de Junior) las fichas del showcase de
los sitios con movimiento enseñan un video corto en vez de la foto: la
entrada animada del hero y un recorrido suave hacia abajo que dispara las
animaciones de las secciones. Unos 5 a 6 segundos, en bucle, sin audio.
Hoy son 11 sitios.

## Cómo funciona en la página

- `src/content/portfolio.ts` → `VIDEOS_PORTADA`: los dominios (tal como están
  en el portal, sin `www`) que tienen video. El resto sigue con su foto.
- Los archivos viven en `public/showcase/video/<slug>.mp4` y `<slug>.jpg`
  (el póster: el hero ya cargado). El slug es el dominio con guiones.
- `src/components/PortfolioGrid.tsx` → `PortadaEnVideo`: enseña el póster,
  no baja el video hasta que la ficha entra en pantalla, lo pausa al salir.
  Con "reducir movimiento" o "ahorro de datos" se queda el póster.
- Si en el portal el sitio tiene una imagen propia (`portfolio_image`), esa
  manda y no sale video. Es el caso de Delivery Rush.

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
pantallas), `saltar` (segundos que se saltan del arranque) y `ocultar`
(selectores que se esconden: ventanas de reseñas, cookies, chats).

## Para sumar un sitio

1. Agregarlo a `SITIOS` en `scripts/showcase/grabar-videos.mjs`.
2. Grabarlo y **mirar el video entero** antes de subirlo: que no salga una
   ventana emergente, un error de carga o el sitio a medio pintar.
3. Agregar el mismo dominio a `VIDEOS_PORTADA`.

Se vuelve a grabar cuando un sitio cambia de diseño. Cada video pesa entre
130 y 300 KB, y solo se baja cuando su ficha está en pantalla.

## Fuera, y por qué

| Sitio | Motivo |
| --- | --- |
| judimental.com | En el Chrome de grabación el home sale negro con el nombre |
| deliveryrushflorida.com | En mantenimiento; su ficha usa imagen propia |
| vanventuremia.com | Una sola pantalla, sin movimiento: el video sería la foto |
| milcoloresapp.vercel.app/hoy | Igual: app de una pantalla |
