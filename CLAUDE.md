# Judo Marketing (judomarketing.net)

Antes de tocar git, Vercel, dependencias, claves o videos, lee la sección 10
de `docs/CEREBRO.md`: «Errores que ya cometimos (y cómo no repetirlos)». Si
te equivocas en algo nuevo, anótalo ahí el mismo día con qué pasó, qué costó
y la regla.

- Videos verticales y carruseles: skills `judo-video-vertical` y `judo-carrusel` (`.claude/skills/`). Lo compartido entre las dos se edita en `scripts/skills/compartido/` y se copia con `python3 scripts/skills/empacar.py`.
- `master` es la rama de producción. Las otras ramas del repo están en el
  README, sección «Ramas del repositorio».
- Un valor secreto no se imprime nunca, ni enmascarado. Las variables de
  Vercel no se descifran.
- Junior lee en español. Cada respuesta va en tres partes:
  - «Te toca a ti»: lo que depende de él, con enlaces.
  - «Listo»: una línea por cambio.
  - «Ojo»: solo los riesgos.
