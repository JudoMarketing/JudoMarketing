# Escribe guion-elevenlabs.md desde voz.json: un clip por escena, con su
# segundo de inicio, su largo ideal, su largo máximo y el nombre del archivo.
# Método de Vendito (skill vendito, references/metodo.md, sección 6).
#
# Uso (desde la carpeta del video):
#   python3 calzar-voz.py voz.json --guion   # primero: que todo quepa
#   python3 guion-clips.py voz.json
#
# voz.json lleva un bloque por escena con una sola frase, y cada frase su
# "clip" (dos palabras para el nombre del archivo), "ve" (lo que dice la
# pantalla) y "como" (cómo decirlo, en español).
import importlib.util, json, os, sys

D = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("cv", os.path.join(D, "calzar-voz.py"))
cv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cv)

cfg = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, "voz.json"), encoding="utf-8"))
sps, idioma = cv.ritmo(cfg)
fr = cv.frases(cfg)
coma = lambda x: f"{x:.1f}".replace(".", ",")


def mmss(t):
    m, s = divmod(t, 60)
    return f"{int(m)}:{s:04.1f}".replace(".", ",")


clips = []
for i, f in enumerate(fr, 1):
    ideal, maximo = cv.habla(f["texto"], sps, idioma), round(f["hueco"] - 0.1, 1)
    clips.append({**f, "n": i, "ideal": ideal, "max": maximo, "archivo": f"{i:02d}_{f['t']:05.1f}_{f['clip']}.mp3"})
largo = max(clips, key=lambda c: c["ideal"])
n = len(clips)

filas = "\n".join(f"| {c['n']} | {mmss(c['t'])} | {coma(c['ideal'])} s | **{coma(c['max'])} s** | {c['texto']} | `{c['archivo']}` |" for c in clips)
detalle = "\n".join(f"### Clip {c['n']} · empieza en {mmss(c['t'])} · máximo {coma(c['max'])} s\n\n```\n{c['texto']}\n```\n\n"
                    f"- **En pantalla:** {c['ve']}\n- **Cómo decirlo:** {c['como']}\n- **Archivo:** `{c['archivo']}`\n" for c in clips)

md = f"""# «{cfg['titulo']}» · guion para ElevenLabs, un clip por escena

{cfg['intro']}

## Por qué la voz va en un clip por escena

- **Antes iba en bloques largos con pausas `<break>`.** La voz de prueba
  calzaba porque habla rápido y parejo. ElevenLabs habla más lento (de 3,3 a
  4,3 sílabas por segundo), y cada frase un poco más larga empujaba a todas
  las que venían detrás en el mismo bloque. Al final del bloque, el atraso ya
  se notaba.
- **Ahora va en {n} clips, uno por escena, sin pausas adentro.** Cada clip
  empieza en el segundo exacto de su escena, así que un clip largo no puede
  atrasar al siguiente.
- **Las frases se escribieron para la voz lenta.** Se midieron a
  {coma(sps)} sílabas por segundo y ninguna ocupa más del
  {round(cfg.get('uso_max', 0.95) * 100)} % de su escena: si tu voz sale un
  poco más lenta, todavía cabe.

## Todo el texto seguido (para leerlo de corrido)

> {' '.join(c['texto'] for c in clips)}

## Antes de generar

- **Modelo:** Eleven Multilingual v2. No pongas `<break>`: cada clip es una
  sola frase.
- **Ajustes de la voz, iguales en los {n} clips:**
  - Estabilidad: 45 %.
  - Similitud: 80 %.
  - Exageración de estilo: entre 10 y 20 %.
  - Speaker boost: encendido.
  - Velocidad: 1,0.
- **Los números van en letras** («five dollars», «ninety-nine dollar»), y la
  web se dice «judo marketing dot net». Si ElevenLabs lee raro
  «judomarketing.net», escríbelo así: `Judo Marketing dot net`.

## Cómo generarlo

1. **Primero genera solo el clip {largo['n']}** (el más largo) y mira cuánto
   dura en el reproductor de ElevenLabs. Debe durar **{coma(largo['max'])} s o
   menos**.
   - Si dura **{coma(largo['max'])} s o menos:** perfecto, sigue con velocidad
     1,0.
   - Si dura **de {coma(largo['max'])} a {coma(largo['max'] * 1.1)} s:** sube
     la velocidad a 1,1 y genéralo otra vez.
   - Si dura **más de {coma(largo['max'] * 1.1)} s:** avísame. Hay que acortar
     frases (las escenas no se alargan).
2. **Genera los otros clips** con los mismos ajustes y la misma velocidad. Si
   un clip sale raro, repite solo ese.
3. **Baja cada clip en MP3 con el nombre de la tabla.** El número de adelante
   es la escena y el segundo del medio es donde va.

## La línea de tiempo

«Largo ideal» es lo que debería durar el clip con tu voz. «Máximo» es lo más
que puede durar sin pisar la escena siguiente.

| Clip | Empieza en | Largo ideal | Máximo | Texto | Archivo |
| --- | --- | --- | --- | --- | --- |
{filas}

## Si un clip sale más largo que su máximo

- **Hasta un 5 % más largo:** acelera ese clip a 1,05×. No se nota.
- **Hasta un 10 % más largo:** acelera a 1,1×. Es lo máximo.
- **Más que eso:** genéralo otra vez con velocidad 1,1, o avísame y acorto la
  frase.

## Para que quede exacto: súbelos a la Biblioteca

En la Biblioteca Judo, abre la ficha de **{cfg['titulo']}** y, en «Subir una
versión nueva o tu voz», elige los {n} MP3 a la vez. Después dime **«calza la
voz de {cfg['titulo']}»**. Pongo cada clip en el segundo de su escena (si
alguno se pasa, lo acelero hasta un 10 %), bajo la música cuando hablas y te
dejo el video terminado en la Biblioteca.

## Si lo armas tú en CapCut

1. **Pon el video** y, encima, una pista de audio.
2. **Cada clip va en el segundo de la columna «Empieza en»**, no uno detrás
   del otro. Para encontrar el segundo, agranda la línea de tiempo con dos
   dedos hasta ver las décimas.
3. **Si un clip pisa el siguiente,** tócalo, entra en «Velocidad» y súbelo a
   1,05× (no se nota) o, como mucho, a 1,1×.
4. **Baja la música** a un 20 % debajo de la voz.

## Cada clip, con lo que se ve y cómo decirlo

{detalle}"""
open(os.path.join(D, "guion-elevenlabs.md"), "w", encoding="utf-8").write(md)
print(f"guion-elevenlabs.md: {n} clips; el más largo es el {largo['n']} ({coma(largo['ideal'])} s de {coma(largo['max'])} s)")
