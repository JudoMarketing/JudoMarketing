# Prompt para arrancar un website nuevo

Se pega en el chat nuevo del cliente (su propio repo, su propio chat). Se
llenan los datos entre corchetes; lo que no se sepa se deja en blanco y el
chat lo pregunta. Salió de estudiar los 26 sitios en vivo del portafolio y el
código de 10 repos (28 de septiembre de 2026): cada regla de abajo corrige un
error que ya pasó.

Si el proyecto es solo una página de una app o un rediseño, el mismo prompt
sirve: el paso 1 lo clasifica.

---

```
Vamos a construir el proyecto de [NOMBRE DEL NEGOCIO] para Judo Marketing.

ANTES DE ESCRIBIR CÓDIGO, lee completos estos cuatro archivos (repo público):
- https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/CEREBRO.md  (reglas de diseño y construcción de la casa)
- https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/NICHOS.md  (qué lleva cada tipo de proyecto)
- https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/PORTAFOLIO-VISUAL.md  (cómo se ven nuestros sitios y qué les falla)
- https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/CEREBRO-APORTES.md  (lecciones con evidencia; lee al menos las de AC-Customs y "la vara del dueño")
Si es un sitio de negocio en Next.js, parte de la plantilla JudoMarketing/JudiWEB y lee su README.

DATOS DEL CLIENTE (lo que falte, pregúntamelo en una sola lista):
- A qué se dedica, en palabras del dueño: [ ]
- Quién visita el sitio y en qué estado llega: [ ]
- Qué tiene que conseguir el sitio (llamadas, citas, pedidos, ventas, inscripciones, descargas): [ ]
- Ciudad y zonas que cubre: [ ]
- Teléfono, WhatsApp, correo que recibe los avisos: [ ]
- Servicios o productos, con precio "desde" o "se cotiza": [ ]
- Horario, cupo por día, aviso mínimo, cancelación (si hay citas o reservas): [ ]
- Promesas que son verdad y se pueden probar (años, licencia con número, seguro, 24/7, calificación de Google): [ ]
- Link de su Perfil de Empresa de Google y redes activas: [ ]
- Logo en su archivo original, fotos y videos en máxima resolución (dónde están): [ ]
- Idiomas (por defecto EN y ES completos): [ ]
- Dominio, con www o sin www, y dónde está registrado: [ ]
- Sitios que le gustan y cosas que NO quiere: [ ]
- Lo que el dueño describió tal cual (pégalo sin editar): [ ]

PASO 1 · Clasifica. Dime en qué tipo de NICHOS.md cae (puede ser mezcla, por ejemplo Salud + Plataforma), qué sitio nuestro es la referencia más cercana, y la lista de lo que va a llevar: secciones de la home en orden, funciones, integraciones y stack. Marca qué pidió el cliente y qué agregas tú sin que lo pidiera. Si es una app de teléfono, son dos piezas: la app y la página pública que la vende.

PASO 2 · Guarda el brief. Crea docs/BRIEF.md con lo que describió el dueño íntegro, la checklist numerada de lo pedido y lo agregado, las decisiones abiertas que solo el dueño puede tomar, y una autocrítica corta del brief (qué falta, qué no cuadra). Crea también el CLAUDE.md del repo con las reglas de este proyecto.

PASO 3 · Identidad, antes de maquetar. Pásame estas decisiones y espera mi visto bueno:
1. Qué mitad del logo manda (lo que alguien recordaría al día siguiente) y el color de acción, que es uno solo.
2. Claro u oscuro según el rubro, y el par tipográfico: display con carácter arriba, sans tranquila para el cuerpo. La tipografía equilibra el logo, no lo repite.
3. Cuál es, de todo el material del cliente, la prueba de lo que hace el negocio. Esa va en el hero, grande.
4. El kicker (lugar + prueba + velocidad) y tres opciones de H1: promesa dicha por una persona seria, con punto final. Si podría decirse en broma, está mal.

PASO 4 · Construye por fases, cada una con puerta de salida (algo que el dueño puede ver y aprobar):
- Fase 1: diseño completo y funciones principales con datos de muestra, en un preview de Vercel, nunca en el dominio del cliente.
- Fase 2: lo real: formularios que avisan por correo, base de datos, calendario, panel de administración si hace falta.
- Fase 3: pagos, si hay.
- Fase 4: lanzamiento: dominio, analítica, Search Console, checklist de entrega.
Divide en fases también lo que yo no haya dividido, sin perder ningún detalle del brief.

REGLAS QUE NO SE NEGOCIAN (cada una ya costó algo):
- Nada inventado sobre el negocio: ni reseñas, ni cifras, ni licencias, ni seguros, ni servicios, ni zonas. Las reseñas son un arreglo vacío que oculta la sección hasta tener reales, más un botón a la ficha de Google. El relleno puede inventar forma, nunca afirmaciones.
- Nada de borrador en producción: sin insignias, "YOUR NAME HERE", teléfonos 555 o 000, "Photo coming", testimonios de relleno ni instrucciones visibles. Si falta un dato, el bloque se diseña para verse bien vacío o no se pone.
- Sin raya larga (— o –) en ningún texto visible. Sin palabras de agencia. Sin promesas de resultados.
- Header: teléfono visible, EN/ES y UN solo botón protagonista. En teléfono, barra fija inferior con las 2 o 3 acciones del negocio (Llamar / WhatsApp o Texto / Cotizar, Reservar u Ordenar) y un header que no se sature.
- El contenido se ve sin JavaScript: las animaciones de entrada realzan, nunca esconden. Nada animado pasa por encima del texto.
- Fotos reales del cliente. Si todavía no hay, ilustración con carácter en el lenguaje del sitio, nunca banco de imágenes fingiendo ser el cliente. Video en MP4 H.264 (HEVC no se ve en Chrome), con póster.
- Todo dato del negocio en un archivo de configuración y todo texto en diccionarios tipados; ninguno escrito dentro de un componente. Si falta una traducción, que falle el build.
- Formularios: trampa anti-bots aceptada en el esquema y descartada después, captcha verificado en el servidor, fallan con error ruidoso si faltan las claves de correo. Se prueban en el sitio publicado, en los dos idiomas.
- Toda clave externa (mapas, calendario, correo, pagos) configurada antes de enseñar la función. Un mapa con "API KEY REQUIRED" es peor que no tener mapa.
- Toda escritura de administración se comprueba contra la base (que la fila cambió, no que el botón dijo ✓).
- Si es SaaS o app, se muestra el producto: capturas reales, no solo texto.

ANTES DE ENTREGAR CADA FASE:
- next build + next start de verdad (no solo dev), typecheck y lint limpios.
- Capturas con Playwright a 360, 390, 768 y 1440, bajando con scroll, y MÍRALAS: desbordes, textos cortados, cosas que tapan otras, secciones vacías.
- Contraste medido con número (4,5:1 mínimo) en cada par de texto.
- Revisión autocrítica: busca lo que está MAL, no confirmación de que está bien.
- Pásame la lista de todas las afirmaciones verificables que hace el sitio para que el dueño las confirme. Lo que no confirme, fuera.

AL LANZAR:
- Dominio decidido (www o sin www) y el otro redirigiendo con 308.
- JSON-LD del rubro, sitemap con hreflang, robots, imagen para compartir, title con oficio + ciudad, GA4 (y Pixel si habrá anuncios).
- Dame los pasos para registrarlo en el portal de admin de judomarketing.net (dominio, precio, día de cobro, showcase, categoría, descripción ES/EN) y para mandarlo a Search Console.
- Si aprendiste algo que el siguiente proyecto necesita saber, agrégalo a docs/CEREBRO-APORTES.md de JudoMarketing con su evidencia.

CÓMO ME HABLAS: en español. Cada respuesta con tres partes: "Te toca a ti" (lo que depende de mí, con enlaces), "Listo" (una línea por cambio) y "Ojo" (solo si algo puede morder). No me cuentes el proceso; dime lo que necesito decidir o hacer.
```

---

## Notas de uso

- **Si el cliente todavía no tiene nada** (ni logo ni fotos), el paso 3 igual
  se hace: la identidad sale de lo que el cliente describe y se ajusta cuando
  llegue el material. Pedir el material el primer día.
- **Si el proyecto es un rediseño**, añadir al principio: "Rediseña [SITIO].
  Antes de tocar nada, dime las 3 o 4 cosas que hoy no se leen profesionales,
  con el motivo concreto de cada una."
- **Este prompt se mejora** cuando un proyecto enseña algo nuevo: primero va a
  `CEREBRO-APORTES.md`, se cura en el chat de Judo Marketing, y si es una
  regla de arranque, se agrega aquí.
