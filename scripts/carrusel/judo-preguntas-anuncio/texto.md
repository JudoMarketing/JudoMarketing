# Cada sí tiene arreglo (anuncio pagado de Judo Marketing)

La versión para anuncio pagado de «Apaga el teléfono», pedida por Junior el
30 de octubre de 2026: corta, con otros colores y con el arreglo en cada
tarjeta.

6 tarjetas de 1080 × 1080, el formato de los anuncios por secuencia de Meta.

## En qué cambia respecto del carrusel normal

- **Cuadrado y claro.** Fondo crema, letra negra, resaltado amarillo y
  morado de Judo. En un feed casi todo oscuro, la tarjeta clara salta. Las
  pantallas (bandeja, chat, mensajes, seguridad) quedan oscuras, como un
  teléfono.
- **Corto: 4 preguntas, no 6.** Quedan las cuatro que más duelen y que más
  claro muestran un servicio: bots, cambios, mensajes y seguridad. Salen la
  de anuncios (rara dentro de un anuncio) y la de visitas.
- **El arreglo va en cada tarjeta.** En un anuncio, Meta puede mostrar las
  tarjetas sueltas, así que cada una dice su pregunta y su respuesta. No hay
  lámina de respuestas.
- **La pregunta de PHP ya no depende de la noticia de octubre.** Ahora es
  «¿Quién le pone los parches de seguridad a tu web?»: sirve en noviembre y
  en marzo.
- **La última tarjeta es morada,** con el botón amarillo de WhatsApp.

## Las tarjetas

| # | Pregunta | El arreglo | Título (debajo de la tarjeta) |
| --- | --- | --- | --- |
| 1 | ¿Tu negocio sigue vendiendo si apagas el teléfono? | Test de 4 preguntas | Haz el test de 4 preguntas |
| 2 | ¿Tu formulario se llena de bots? | Formularios con filtro anti-bots | Formularios sin bots |
| 3 | ¿Para cambiar un precio en tu web, esperas a alguien? | Tú cambias precios y productos | Cambia tus precios tú |
| 4 | ¿Si tú no contestas, nadie vende? | Juditos que contestan 24/7 | Juditos contestan 24/7 |
| 5 | ¿Quién le pone los parches de seguridad a tu web? | Webs sin PHP, con respaldo diario | Webs sin PHP y respaldadas |
| 6 | Todo esto se arregla a un chat de distancia. | Escríbenos por WhatsApp | Escríbenos por WhatsApp |

## Cómo se arma en el Administrador de anuncios

- **Formato:** secuencia (carrusel), las 6 tarjetas en este orden.
- **Apaga «Mostrar primero las tarjetas con mejor rendimiento»**: la tarjeta 1
  abre el test y la 6 cierra.
- **Destino:** WhatsApp, al +1 305 934 9981.
- **Botón:** «Enviar mensaje de WhatsApp».
- **Ubicaciones:** feed de Instagram y feed de Facebook. En historias y reels
  la secuencia se ve recortada.
- **Descripción de cada tarjeta:** «Judo Marketing · Miami».

**Texto principal** (125 caracteres o menos, para que no se corte). Meta deja
probar hasta cinco; empieza con estos tres:

```
¿Tu negocio sigue vendiendo si apagas el teléfono? Haz el test de 4 preguntas. Cada sí tiene arreglo 👉
```

```
Bots en tu formulario, cambios que tardan días, mensajes sin contestar. Todo se arregla a un chat de distancia.
```

```
Si tu negocio solo vende cuando tú contestas, escríbenos. Te decimos con honestidad si podemos ayudarte.
```

## Texto alternativo

1. Tarjeta 1: «¿Tu negocio sigue vendiendo si apagas el teléfono?», sobre el botón de «desliza para apagar» de un teléfono. Arriba: «Test de 4 preguntas».
2. Tarjeta 2: «¿Tu formulario se llena de bots?» Una bandeja con 38 mensajes: spam y, abajo, un cliente real. El arreglo: formularios con filtro anti-bots.
3. Tarjeta 3: «¿Para cambiar un precio en tu web, esperas a alguien?» Un chat: pides cambiar el precio del combo, te dicen «esta semana» y el jueves sigues preguntando. El arreglo: tú cambias precios y productos.
4. Tarjeta 4: «¿Si tú no contestas, nadie vende?» Una pantalla bloqueada a las 11:47 con dos mensajes de clientes sin responder. El arreglo: Juditos que contestan 24/7.
5. Tarjeta 5: «¿Quién le pone los parches de seguridad a tu web?» Un panel de seguridad con una actualización crítica de PHP pendiente y sin respaldo. El arreglo: webs sin PHP, con respaldo diario.
6. Tarjeta 6, morada: «Todo esto se arregla a un chat de distancia.» Te decimos con honestidad si podemos ayudarte. Botón amarillo «Escríbenos por WhatsApp» y el número +1 305 934 9981.

## Reglas de Meta que se revisaron

- Ninguna pregunta habla de un atributo personal: todas son sobre el negocio.
- Nada de promesas de resultados: cada arreglo dice lo que hace el servicio.
- No cae en una categoría especial (crédito, empleo, vivienda, política).
- Los mensajes de las pantallas son de ejemplo y se notan inventados.

## Cómo se cambia

```bash
cd scripts/carrusel/judo-preguntas-anuncio
# editar carrusel.html (las tarjetas están en <main class="tira">)
node revisar.mjs                       # tiene que decir «Sin problemas»
node render.mjs && python3 hoja.py
```
