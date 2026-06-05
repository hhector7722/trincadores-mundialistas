# Seed de desarrollo (oficial)

## Orden
1. Aplicar `20260604220000_initial_schema.sql`
2. Aplicar `20260604230000_schema_0b1_alignments.sql`
3. `npm run db:seed`

## Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Opcional `DATABASE_URL` para aplicar `seed.sql` automatico
- `AUTH_INTERNAL_DOMAIN=auth.trincadores.local`

## Usuarios (password `DevSeed2026!`)
owner, admin, maria, pedro, lucia, diego, ana — ver `lib/dev/seed-ids.ts`

## Datos
- Pool `mundial-seed`, roles owner/admin/player
- Partido finished 2-1 con puntos recalculados
- `pool_member_scores` por jornada con rank y cumulative
