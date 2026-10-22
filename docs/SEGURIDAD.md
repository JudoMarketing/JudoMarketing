# Seguridad de Judo Marketing y sus clientes

Escrito el 22 de octubre de 2026, el día de **PHP2Shell**:
- dos fallas críticas de PHP (CVE-2026-109618 y CVE-2026-109619) que dejan
  tomar un servidor sin contraseña;
- el mismo día, Next.js publicó una ejecución remota de código en su
  optimizador de imágenes (GHSA-2464-fhr4-w9xw).

Las reglas cortas están en `CEREBRO.md`, sección 9. Este archivo es el
inventario, el procedimiento de emergencia y las excepciones conocidas.

## Lo que se hizo ese día

- **PHP:** ninguno de nuestros sitios corre PHP. Todos son Next.js o
  estáticos en Vercel; The Notes corre en Railway y GeraldMarket en GitHub
  Pages. Revisado desde afuera (`scripts/seguridad/sondear-sitios.py`) y en
  los 34 repos: cero archivos PHP. El único dominio en otro servidor es
  pachypinchos.com, que muestra una página del creador de sitios de
  Hostinger. Ese servidor lo parcha Hostinger, no nosotros.
- **Next.js:** 20 repos tenían la falla crítica.
  - Los de las líneas 15 y 16 subieron a 15.5.28 y 16.4.2.
  - Cuatro seguían en Next 14, una línea sin parches: JuditoADS, RBT Corner,
    Zanoah y ABA for Happiness. Se migraron a Next 15.5.28 con React 19.
  - Cada cambio se probó primero en un preview de Vercel, comparando cada
    ruta contra producción, y solo después se subió a la rama de producción.
- **Otras dependencias:** nodemailer 10, sharp 0.35.5, postcss, nanoid y
  proxy-addr. Se cerraron sin subir de versión mayor salvo nodemailer, cuya
  API no cambió.
- **Fallas propias encontradas en la revisión:**
  - Zanoah tenía `/api/diag` abierto: cualquiera podía crear órdenes, mandar
    correos a los admins, abrir sesiones de Stripe y ver los correos de los
    admins. Ahora pide sesión de admin.
  - Zanoah tenía el optimizador de imágenes aceptando cualquier dominio
    (`hostname: "**"`). Quedó cerrado.
  - Zanoah tenía la contraseña del admin escrita en `DEPLOY-VERCEL.md`. Se
    quitó del documento; **hay que cambiarla en Vercel** (sigue en el
    historial del repo).
- **Cabeceras de base** (nosniff, Referrer-Policy, X-Frame-Options y una CSP
  que no toca scripts) en todos los sitios que no las tenían.
- **Vigilancia:** cada repo con dependencias lleva
  `.github/workflows/seguridad.yml`. Corre lunes, miércoles y viernes, y
  cuando cambian las dependencias. Si aparece una vulnerabilidad crítica o
  alta, PHP o un optimizador abierto, GitHub manda un correo. La plantilla
  JudiWEB ya lo trae, así que cada cliente nuevo nace vigilado.

## Inventario (dónde vive cada cosa)

La rama de producción es la que Vercel publica. **No siempre es la
principal del repo:** antes de parchar, hay que confirmarla en Vercel (en la
lista de despliegues de producción, el campo `githubCommitRef`).

| Sitio | Repo (JudoMarketing/…) | Rama de producción | Dónde corre |
| --- | --- | --- | --- |
| judomarketing.net | JudoMarketing | master | Vercel |
| judomarketing.net/juditoads | Judito-Ads | claude/meta-ads-portal-5je6kf | Vercel (rewrite) |
| judomarketing.net/juditos | AI-Assistants | claude/meta-virtual-assistants-portal-j9nemm | Vercel (rewrite) |
| abaforhappiness.com | ABA-For-Happiness | claude/aba-happiness-v2-ezkofa (se promueve a mano; ver abajo) | Vercel |
| accustomsmiami.com | Accustoms-miami | claude/diseno-visual | Vercel (el dominio no está conectado: da 404) |
| dameunamano.org | DameUnaMano | claude/dameunamano-landing-design-23zs94 | Vercel |
| denalibehaviorcrt.com | Denali-CRT | main | Vercel (estático) |
| deliveryrushflorida.com | delivery-rush-florida | main | Vercel |
| godshome.app | Jesucristoeltodopoderoso | claude/eager-wright-yoj8bu | Vercel |
| judimental.com | JudiMental | claude/reminders-daily-organization-app-88z4eb | Vercel (Expo web) |
| johanmorenotailor.com | JOhan-Tailoring | claude/vercel-preview-page-4aii4b | Vercel |
| juniorosorio.com | MathGames | claude/math-game-airplanes-cards-2rbijj | Vercel (estático) |
| melanieosorio.com | Melanie-Osorio | claude/mel-training-platform-121qpc | Vercel |
| pachy-pinchos.vercel.app | Pachy-Pinchos | claude/pachy-pinchos-redesign-v1h9a9 | Vercel (el dominio está en Hostinger) |
| paradiseranch22.com | Paradise-Ranch | claude/land-clearance-website-c1bkzb | Cloudflare |
| rbtcorner.com | RBTCorner | claude/rebuild-online-courses-platform-g0gvph | Vercel |
| thenotes.net | DailyNotesAssistant | claude/clinical-notes-platform-as4unu | Railway (Docker) |
| vanventuremia.com | VAN-Venture-MIA | claude/vanventure-mia-website-b0rsqw | Vercel |
| zanoah.shop | ZANOAH | main (la principal es otra) | Vercel |
| maybayker.vercel.app | May-Baykery- | claude/may-bakery-website (la principal es main) | Vercel |
| milcoloresapp.vercel.app | milcoloresapp | claude/milcoloreslife-app-i5zzhk | Vercel |
| JudiCRM, SPX-Trading, MentalMarketing | — | principal | sin despliegue público |
| GeraldMarket | GeraldMarket | gerald-market-site | GitHub Pages (no admite cabeceras) |
| Plantilla de clientes | JudiWEB | main | Vercel (judito-starter) |

Hay más sitios en Vercel: art-foundation, hr-gutters, mr-naples-hauling-llc,
sofla-contractors, the-equipment-source y athena-beauty, que está en pausa.
La lista para la revisión externa vive en `scripts/seguridad/sitios.txt`.

## Cuando sale una vulnerabilidad grande (el procedimiento)

1. **Entender qué afecta.** Versiones, si aplica en Vercel o solo en
   servidores propios, y si hay parche por línea. Fuentes: el aviso de
   GitHub (`github.com/advisories/GHSA-…`), el del proyecto y Sansec, Wiz o
   Rapid7.
2. **judomarketing primero**, después los clientes.
3. **Revisar todos los repos.** Por cada repo con dependencias:

   ```bash
   bash scripts/seguridad/auditar.sh /ruta/del/repo
   ```

   Da las versiones de Next y React y las vulnerabilidades críticas y altas
   de producción, solo con el lockfile y sin instalar nada.
4. **Parchar** con `bash scripts/seguridad/parchar.sh /ruta/del/repo`.
   - Sube Next a la última versión de su línea.
   - Aplica `npm audit fix` sin saltos de versión mayor y con
     `--ignore-scripts`.
   - Si el repo fijaba versiones exactas, se mantienen exactas.
5. **Probar antes de producción.**
   - Se sube a una rama `seguridad/…`; Vercel arma el preview.
   - Se comparan las rutas (las del sitemap y las fijas) entre el preview y
     el dominio real con `bash scripts/seguridad/comparar.sh`. Los previews
     piden acceso de Vercel: el enlace compartido sale de la herramienta
     `get_access_to_vercel_url`.
   - Mismo código y mismo título en cada ruta, o se explica la diferencia.
6. **Subir a producción** solo si la rama no se movió mientras tanto (avance
   rápido, nunca a la fuerza). Después, confirmar que el despliegue de
   producción quedó READY y que el dominio contesta.
   - ABA se publica creando un despliegue de producción a mano, con sus
     variables. Su dominio no está en la lista de dominios del proyecto: es
     un alias. Después del despliegue hay que apuntar `www.abaforhappiness.com`
     y `abaforhappiness.com` (este con redirección 308 a www) al despliegue
     nuevo con `assign_alias`. Si no, el dominio sigue en el anterior.
   - Si la rama de producción no es la principal, el push no basta: hay que
     revisar en Vercel que salió como producción.
7. **Línea sin parches** (como Next 14): se migra a la línea con soporte en
   una rama aparte, con build, tipos, pruebas de rutas y del navegador
   contra la versión anterior. Con React 19, si un formulario pierde lo
   escrito tras un error del servidor, se arregla. RBT Corner tiene un
   `ActionForm` que lo resuelve para todos sus formularios.

## Excepciones conocidas

- **GHSA-ggr8-5vv4-36mx**: deepmerge-ts dentro del CLI de Prisma 6. Afecta a
  JuditoADS, RBT Corner, Zanoah y Pachy Pinchos. Solo corre en el build al
  leer la configuración, sin datos de afuera. Está permitido en su
  `seguridad.yml` y se quita al pasar a Prisma 7.
- **JudiMental** (Expo / React Native): las alertas son de herramientas de
  compilación (metro, expo-cli, node-forge). No llegan al sitio web, que es
  estático. Se resuelve al actualizar Expo; por eso no lleva todavía el flujo
  de seguridad, que fallaría de entrada.
- **GeraldMarket** está en GitHub Pages, que no deja poner cabeceras.
- **Previews con datos reales:** en Zanoah y RBT Corner, el preview usa la
  misma base de datos, Stripe en vivo y correo real. Una compra de prueba en
  el preview es una compra real.
