# Judo Marketing

Sitio oficial de Judo Marketing (www.judomarketing.net) y plataforma de gestión:
portales de administración, vendedores y clientes, con red de sitios de clientes
supervisados desde un panel central.

- **Plan maestro y fases:** [PLAN.md](PLAN.md)
- **Guía de marca:** [docs/BRAND.md](docs/BRAND.md)
- **Documentos legales:** [docs/legal/](docs/legal/README.md)

## Stack

- Next.js (App Router) + Tailwind CSS 4 — deploy en Vercel
- next-intl — bilingüe ES (default) / EN con rutas `/es` y `/en`
- Supabase — Postgres, Auth y Storage (`supabase/migrations/`)
- Tipografía Poppins · Paleta: `#7B2DFF` `#A855F7` `#0B0B12` `#11111A` `#F5F5F7`

## Desarrollo

```bash
npm install
npm run dev    # http://localhost:3000 → redirige a /es
npm run build  # build de producción
```

## Ramas del repositorio

| Rama | Para qué | Quién la trabaja |
| --- | --- | --- |
| `master` | Judo Marketing: judomarketing.net y el portal. Es la rama de producción en Vercel. | Chat de Judo Marketing |
| `juditoads` | Lo que el chat de JuditoADS toca en este repo: su pestaña del portal, el puente `/juditoads`, sus aportes al cerebro. | Chat de JuditoADS (repo `Judito-Ads`) |
| `juditos` | Lo mismo para Juditos: pestaña AI Assistants, puente `/juditos`, aportes. | Chat de Juditos (repo `AI-Assistants`) |
| `ads-and-sell-strategies` | Estrategias de anuncios y de venta. | Chat de estrategias |

Reglas:

- Cada chat empuja a su rama. Antes de empujar, `git pull --rebase` por si
  otra sesión empujó primero.
- Nada llega a judomarketing.net hasta que su rama se une a `master` desde el
  chat de Judo Marketing (`git merge juditoads`, por ejemplo). Empujar a
  `juditoads` o `juditos` no cambia producción por sí solo.
- Las ramas viejas no se borraron a ciegas: quedaron como ramas de archivo
  `archivo/<nombre>` (`archivo/judiwebs`, `archivo/kit-cerebro`,
  `archivo/footer-dos-sitios`). No se trabaja sobre ellas; se recuperan con
  `git checkout -b <nombre> origin/archivo/<nombre>`.

## Deploy (Vercel)

1. Importar este repo en Vercel con `master` como rama de producción
   (Settings → Git → Production Branch). Las demás ramas salen como preview.
2. Framework preset: Next.js — sin configuración extra.
3. Variables de entorno: ver `.env.example`. Todas van en el ambiente
   Production. En Preview van solo `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sin ellas el build de una vista previa
   falla con "supabaseUrl is required"). La service role key y las llaves de
   Stripe y Google nunca van en Preview: una vista previa tendría acceso
   total a la base de producción.
4. Aplicar `supabase/migrations/0001_init.sql` en el SQL Editor de Supabase.
