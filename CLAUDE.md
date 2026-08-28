# JudoMarketing

Sitio oficial de Judo Marketing (www.judomarketing.net) y plataforma de
gestión: portales de administración y clientes, con red de sitios de clientes
supervisados desde un panel central.

**Se responde y se escribe en español.** El código y los comentarios también.

## Antes de tocar nada

| Si vas a... | Lee primero |
|---|---|
| Diseñar o construir un website de cliente | `docs/CEREBRO.md` completo |
| Dar de alta un sitio nuevo | `kit/NUEVO-SITIO.md` |
| Tocar el kit que va en los sitios de cliente | `kit/README.md` |
| Seguir la rama de diseño (`judiwebs`) | `JUDIWEBS.md` |
| Entender el plan y las fases | `PLAN.md` |
| Marca, logos y paleta de Judo | `docs/BRAND.md` |

`docs/CEREBRO.md` es el activo más importante del repo: lo aprendido
construyendo 10 websites, destilado. Todo lo que se aprenda haciendo un sitio
y sirva para el siguiente, vuelve ahí.

## Stack

- Next.js 15 (App Router) + Tailwind CSS 4, deploy en Vercel
- next-intl, bilingüe ES (default) / EN con rutas `/es` y `/en`
- Supabase (Postgres, Auth, Storage) con migraciones en `supabase/migrations/`
- Poppins · `#7B2DFF` `#A855F7` `#0B0B12` `#11111A` `#F5F5F7`

## Comandos

```bash
npm run dev                              # http://localhost:3000 → /es
npm run build
npm run revisar -- <url>                 # checklist de entrega, ejecutado
npx tsc --noEmit                         # el repo entero, kit/ incluido
```

`npm run dev` necesita `.env.local` (copiar de `.env.example`); sin las claves
de Supabase, el home devuelve 500 pero el resto de las rutas carga.

## Reglas de la casa

- **Nada de raya larga** en los textos que ve el visitante.
- **Un idioma por vista, completo.** Si un texto existe en español, existe en
  inglés. `messages/es.json` y `messages/en.json` van a la par.
- **El sitio del cliente nunca depende del panel central para funcionar**
  (fail-open del kit).
- **El pie de los sitios de cliente lleva el enlace a judomarketing.net sin
  `nofollow`.** Es la red de enlaces de la marca.
- **Solo se afirma lo que se puede probar.** Ni en el copy de los sitios ni en
  lo que se le reporta al dueño.
- Ramas: se trabaja en la rama que indique el dueño, nunca directo sobre la
  principal. `git push` antes de cerrar, `git pull` antes de empezar.
