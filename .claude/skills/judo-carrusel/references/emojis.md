# Emojis 3D (Microsoft Fluent, licencia MIT)

Se ven bien, no parecen hechos por IA y se pueden usar en anuncios. Se bajan
con el nombre de su carpeta, en inglés:

```bash
python3 emoji.py "light bulb" img/foco.webp
```

Vienen de 256 px:
- en un video se ven bien hasta unos 40 cqw de ancho;
- en un carrusel, hasta unos 30 cqw.

Más grandes se ven blandos.

Todos estos nombres se comprobaron el 28 de octubre de 2026. Para otro:
1. Búscalo en https://github.com/microsoft/fluentui-emoji/tree/main/assets.
2. Usa el nombre de la carpeta sin apóstrofos ni puntos ("Nine oclock").

Los que tienen tonos de piel (manos, personas) bajan con el tono por defecto.

| Para | Nombres |
| --- | --- |
| Dinero y precio | Money bag · Coin · Dollar banknote · Credit card · Gem stone · Hundred points |
| Tiempo | Hourglass not done · Alarm clock · Calendar · Spiral calendar |
| Avisos y estado | Bell · Warning · Check mark button · Cross mark · Locked · Key · Shield |
| Ideas y resultados | Light bulb · Brain · Chart increasing · Bar chart · Bullseye · Trophy · Rocket · Sparkles · Star · Glowing star · Fire |
| Comunicación | Megaphone · Speech balloon · Envelope · Telephone receiver · Mobile phone · Laptop |
| Caras (bucles y ganchos) | Thinking face · Shushing face · Exploding head · Face with monocle · Eyes · Smiling face with sunglasses · Partying face |
| Manos | Thumbs up · Clapping hands · Handshake · Waving hand · Raising hands · Flexed biceps |
| Compras y celebración | Shopping cart · Shopping bags · Wrapped gift · Party popper · Birthday cake |
| Hogar y oficios | House · House with garden · Hammer and wrench · Toolbox · Gear · Delivery truck · Automobile |
| Comida | Hamburger · Pizza · Taco · Hot beverage |
| Belleza y salud | Lipstick · Nail polish · Scissors · Tooth · Stethoscope · Pill · Red heart |
| Educación | Graduation cap · Books |
| Lugar y clima | Round pushpin · World map · Globe showing americas · Sun · Cloud with rain · Umbrella with rain drops · Droplet · Seedling |
| Foto y video | Camera with flash · Movie camera · Clapper board |
| Piezas | Puzzle piece |

**Cuidado con los que tienen orientación** (un reloj, un camión, una flecha):
- no los pongas con `.girando`, que los muestra al revés mientras giran;
- usa `.golpea`, `.cae` o `.flota`.
