---
name: judo-auditoria
description: Auditoría de presencia en línea para un cliente o prospecto de Judo Marketing (como NV Labs, The Notes y Delivery Rush). Mide el website y lo que pasa fuera de él (Perfil de Google, reseñas, directorios, redes, qué responde la IA, medición, anuncios, autoridad, contacto, confianza) y arma un PDF con el puntaje de hoy, la meta a 12 meses, los hallazgos y el plan. Úsala siempre que Junior pida una auditoría, una evaluación, un diagnóstico o «cómo está» la presencia en internet de un negocio o un dominio, o que vuelva a medir a un cliente.
---

# Auditoría de presencia en línea

El método completo está en `docs/AUDITORIA-CLIENTES.md`. Léelo antes de
empezar: tiene las 19 áreas con sus revisiones, los comandos y lo que ya salió
mal una vez.

## Antes de medir, pregunta en una sola lista lo que falte

- El dominio y el nombre del negocio.
- El idioma del informe: el del cliente. Si son dos sitios, puede ser uno en
  cada idioma.
- Para quién es: el dueño, un prospecto o el mismo Junior.
- Si lleva precio. Por defecto no: solo diagnóstico y plan. El precio va en
  una propuesta aparte.

## El flujo

1. **Lo automático:**
   - `medir.mjs`, `rastrear.mjs --origen`, `buscadores.mjs`, `movil.mjs` y
     `vigilar-sitios.py`;
   - Lighthouse: el inicio dos veces en el teléfono y una en la computadora,
     más las páginas que venden.
2. **Lo que pide criterio:**
   - 5 búsquedas de compra y una de la marca;
   - 5 competidores medidos igual;
   - las 10 áreas de fuera del website, cada una con sus 5 revisiones.

   Con dos sitios o más, un agente por sitio en segundo plano, con la lista
   de revisiones y el formato de `fuera.json` en su encargo.
3. **Los datos:** `datos.json` y `fuera.json` en una carpeta del scratchpad,
   nunca en el repo.
4. **El PDF:**
   `python3 scripts/auditoria/presencia/armar.py <carpeta> <es|en> "<Nombre>" "<dominio>" "<Preparado para …>" <salida.pdf>`.
5. **La revisión de cada página:** la hoja de contacto de `pdftoppm`, y la
   lista «Antes de entregar» del documento.
6. **La entrega:** el PDF con SendUserFile y la respuesta en «Te toca a ti /
   Listo / Ojo». En «Ojo» va lo que no se pudo comprobar.

## Lo que no se negocia

- **Solo se afirma lo que se puede probar.** Lo que no se pudo comprobar vale
  0 y lo dice.
- **Nunca** se llenan formularios, se hacen pedidos, se crean cuentas ni se
  contacta al negocio.
- **Texto directo y simple:** una frase por hallazgo, con su dato. Sin rayas
  largas.
- **Lo nuevo que aprendas** va el mismo día a `docs/AUDITORIA-CLIENTES.md`
  («Lo aprendido»), y si fue un error, también a CEREBRO §10.
