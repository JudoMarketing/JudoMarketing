# La marca de cada empresa

El contenido tiene que verse de la empresa, no de una plantilla. Antes de
diseñar, consigue estas siete cosas.

| Qué | De dónde sale |
| --- | --- |
| Logo (PNG transparente o SVG) | El usuario, o el sitio web (`scripts/marca.mjs`) |
| Color de acción (uno solo) | El botón principal del sitio, o el color que más recuerda el logo |
| Fondo y superficies | El sitio; si no hay, claro u oscuro según el nicho (`nichos.md`) |
| Color del texto | El que tenga 4,5:1 o más sobre el fondo |
| Letra de titulares y letra de texto | El sitio; si no se puede, una pareja de Google Fonts (abajo) |
| Tono | Cómo escribe el negocio en su sitio y sus redes; tú o usted |
| Contacto para el llamado | WhatsApp, @usuario, dirección web |

## Sacarla del sitio web

```bash
node scripts/marca.mjs https://www.ejemplo.com salida/marca
```

Guarda en la carpeta indicada:
- `marca.json`: un borrador con colores, letras, logo, `theme-color` y la
  imagen para compartir;
- `logo.png`;
- `sitio.png`: una captura de la primera pantalla.

**Míralo antes de usarlo.** El script adivina:
- a veces el "color de acción" es el de un banner;
- a veces el logo es un ícono del menú.

Corrige `marca.json` a mano.

## Aplicarla

Los dos proyectos (video y carrusel) tienen en el HTML un bloque
`/* MARCA:INICIO */ … /* MARCA:FIN */` con variables CSS y un bloque
`<!-- FUENTES:INICIO --> … <!-- FUENTES:FIN -->` con las letras.

```bash
python3 scripts/aplicar-marca.py marca.json storyboard.html
```

Hace lo siguiente:
- reescribe los dos bloques;
- prueba que Google Fonts tenga esas letras, y si no, avisa y deja una de
  respaldo;
- mide el contraste de texto sobre fondo y de texto de acento sobre acento;
- avisa si algo baja de 4,5:1.

Formato de `marca.json`:

```json
{
  "nombre": "Judo Marketing",
  "fondo": "#12111d",
  "superficie": "#1b1928",
  "texto": "#f5f5f7",
  "acento": "#ffc533",
  "acento-texto": "#16101f",
  "primario": "#7b2dff",
  "fuente-display": "Poppins",
  "fuente-cuerpo": "Inter",
  "logo": "marca/logo.png",
  "contacto": { "whatsapp": "+1 305 934 9981", "instagram": "@judo.marketing", "web": "judomarketing.net" }
}
```

- `acento` es el color que resalta palabras clave y botones; tiene que verse
  sobre el fondo.
- `acento-texto` es el color de la letra encima del acento.
- `primario` es el color de los brillos y las fichas; puede ser el mismo que
  el acento.

## Parejas de letras que funcionan (Google Fonts)

| Carácter | Titulares | Texto |
| --- | --- | --- |
| Fuerte, de oficio (contratistas, autos, comida a la parrilla) | Anton o Barlow Condensed | Inter |
| Moderno y directo (SaaS, apps, agencias) | Archivo o Poppins | Inter o Instrument Sans |
| Cálido y serio (salud, terapia) | Plus Jakarta Sans | Inter |
| Personal y elegante (belleza, sastrería) | Playfair Display o Fraunces | Inter |
| Amable (comunidad, educación) | Nunito o Figtree | Figtree |

La letra de titulares **equilibra** el logo, no lo repite. Si el logo es
alegre, los titulares van serios. Usar la letra del logo en todos los
titulares le costó una versión entera a un sitio.

## Marcas de la casa (listas para usar)

Están en `assets/marcas/`:
- `judo-marketing/`: noche morada.
  - Fondo `#12111d`, superficie `#1b1928`, texto `#f5f5f7`.
  - Morado `#7b2dff` y lila `#a855f7`.
  - Poppins para titulares e Inter para texto.
  - Logo blanco para fondos oscuros.
  - Contacto: WhatsApp +1 305 934 9981, @judo.marketing, judomarketing.net.
- `juditoads/`: el estilo del video de JuditoADS.
  - Fondo `#0d0a17`.
  - Violeta `#8b5cf6` con resaltado amarillo `#ffc533` y letra `#16101f`.
  - Archivo para titulares e Instrument Sans para texto.

Cada carpeta trae su `marca.json`.
