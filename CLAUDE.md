# Judo Marketing (judomarketing.net)

Antes de tocar git, Vercel, dependencias, claves o videos, lee la sección 10
de `docs/CEREBRO.md`: «Errores que ya cometimos (y cómo no repetirlos)». Si
te equivocas en algo nuevo, anótalo ahí el mismo día con qué pasó, qué costó
y la regla.

- Videos verticales y carruseles: skills `judo-video-vertical` y `judo-carrusel` (`.claude/skills/`). Lo compartido entre las dos se edita en `scripts/skills/compartido/` y se copia con `python3 scripts/skills/empacar.py`.
- Todo video, carrusel o herramienta de marketing terminado se sube a la Biblioteca Judo (artifact) con un nombre propio, y "revisa los pedidos de la biblioteca" se resuelve desde ahí: `docs/BIBLIOTECA.md`.
- Cada cosa que se hace se optimiza y se prueba también en el teléfono (390 y
  360 px): cada página empieza arriba, ningún campo hace zoom (16 px), nada se
  sale por el lado. `node scripts/auditoria/movil.mjs <sitio>` y CEREBRO,
  regla 16 de la sección 2.
- Todo website nace encontrable por Google, Bing y la IA (ChatGPT, Claude,
  Perplexity): el texto en el HTML del servidor, robots.txt abierto a los
  buscadores, sitemap, JSON-LD e IndexNow. CEREBRO, sección 11, y
  `node scripts/auditoria/buscadores.mjs <sitio>`.
- `master` es la rama de producción. Las otras ramas del repo están en el
  README, sección «Ramas del repositorio».
- Un valor secreto no se imprime nunca, ni enmascarado. Las variables de
  Vercel no se descifran.
- Junior lee en español. Cada respuesta va en tres partes:
  - «Te toca a ti»: lo que depende de él, con enlaces.
  - «Listo»: una línea por cambio.
  - «Ojo»: solo los riesgos.
