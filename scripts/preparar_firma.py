#!/usr/bin/env python3
"""Convierte una foto o escaneo de la firma (sobre fondo blanco o
transparente) en src/content/firma.ts: PNG con fondo transparente, recortado
al trazo y embebido en base64, que es lo que estampa el PDF de los contratos.

Uso:  python scripts/preparar_firma.py firma.jpg
Necesita Pillow (pip install pillow)."""

import base64
import sys
from pathlib import Path

from PIL import Image, ImageOps

DESTINO = Path("src/content/firma.ts")
ANCHO = 1400
TINTA = (18, 16, 48, 255)  # azul casi negro, como bolígrafo

CABECERA = '''/**
 * La firma de Junior Osorio, Director de Judo Marketing, para estamparla en
 * los contratos que salen del portal. PNG con fondo transparente, recortado
 * al trazo, embebido en base64 para que viaje dentro del código y no dependa
 * de que un archivo suelto llegue al servidor de Vercel.
 *
 * Origen: imagen enviada por el propio Junior el 07/09/2026. Para cambiarla,
 * reemplazar la cadena: scripts/preparar_firma.py la genera a partir de una
 * foto o escaneo de la firma sobre fondo blanco.
 */
export const FIRMA_PNG_BASE64 =
  "'''


def preparar(origen: Path) -> None:
    src = Image.open(origen)
    # Si viene con transparencia, se aplana sobre blanco antes de mirar la tinta
    if "A" in src.mode:
        fondo = Image.new("RGBA", src.size, (255, 255, 255, 255))
        fondo.alpha_composite(src.convert("RGBA"))
        src = fondo
    gris = src.convert("L")
    # Cuanto más oscuro el pixel, más opaco queda; el fondo casi blanco desaparece
    alpha = ImageOps.invert(gris).point(lambda v: 0 if v < 40 else min(255, int((v - 40) * 1.6)))
    bbox = alpha.getbbox()
    if not bbox:
        raise SystemExit("No se encontró trazo en la imagen.")
    pad = 30
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
            min(gris.width, bbox[2] + pad), min(gris.height, bbox[3] + pad))
    alpha = alpha.crop(bbox)
    tinta = Image.new("RGBA", alpha.size, TINTA)
    tinta.putalpha(alpha)
    tinta = tinta.resize((ANCHO, int(alpha.height * ANCHO / alpha.width)), Image.LANCZOS)

    salida = Path("/tmp/firma.png")
    tinta.save(salida, optimize=True)
    b64 = base64.b64encode(salida.read_bytes()).decode()
    DESTINO.write_text(CABECERA + b64 + '";\n', encoding="utf-8")
    print(f"firma {tinta.size[0]}x{tinta.size[1]} → {DESTINO} ({len(b64)} caracteres)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    preparar(Path(sys.argv[1]))
