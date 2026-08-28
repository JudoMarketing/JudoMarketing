# Aportes al cerebro

La bandeja de entrada del cerebro (`CEREBRO.md`). Cada proyecto de la casa
—Judito-Ads, los websites de clientes, los Juditos— agrega aquí lo que
aprendió, **al final del archivo, sin tocar lo de los demás**. Después, desde
el chat de Judo Marketing, se curan estos aportes y los buenos pasan al
cerebro.

## Cómo aportar (desde el chat de cualquier proyecto)

1. Conecta este repo a tu sesión: `add_repo JudoMarketing/JudoMarketing` y
   clónalo (es de la misma organización).
2. Agrega tu entrada **al final** de este archivo con el formato de abajo.
3. Commit y push a `master`. Si el push choca porque otro proyecto aportó al
   mismo tiempo: `git pull --rebase` y reintenta.

Qué vale la pena aportar: un patrón que funcionó, un error que costó caro y
cómo se arregló, una decisión de diseño con su porqué, un texto que convirtió
mejor que otro. Qué no: pasos rutinarios, cosas específicas de un solo
cliente que no enseñan nada general.

## Formato

```
---
### AAAA-MM-DD · Proyecto · rubro
**Qué aprendimos:** una a tres líneas, directo.
**Evidencia:** qué pasó que lo demuestra (opcional pero vale doble).
```

---

### 2026-08-28 · JudoMarketing · agencia
**Qué aprendimos:** el servicio de capturas de pantalla guarda cada foto 24
horas contra la URL exacta, salga bien o en blanco. Si un sitio pesado sale
en blanco, la portada mala se queda pegada un día. La cura: esperar 8
segundos antes del disparo y tener forma de cambiar la URL (un sello de
fecha) para forzar captura nueva.
**Evidencia:** las portadas de Melanie Osorio y Art Foundation salieron en
blanco en el showcase y no había forma de rehacerlas hasta el otro día.
