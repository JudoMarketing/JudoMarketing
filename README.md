# Judo Marketing

Sitio oficial de Judo Marketing (www.judomarketing.net) y plataforma de gestión:
portales de administración, vendedores y clientes, con red de sitios de clientes
supervisados desde un panel central.

- **Plan maestro y fases:** [PLAN.md](PLAN.md)
- **Guía de marca:** [docs/BRAND.md](docs/BRAND.md)
- **Cerebro (cómo se construyen los sitios):** [kit/cerebro/](kit/cerebro/README.md)
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

## Deploy (Vercel)

1. Importar este repo en Vercel (rama `claude/judo-marketing-redesign-ci2rj5` como
   preview; `main` como producción cuando se haga merge).
2. Framework preset: Next.js — sin configuración extra.
3. Variables de entorno: ver `.env.example`.
4. Aplicar `supabase/migrations/0001_init.sql` en el SQL Editor de Supabase.
