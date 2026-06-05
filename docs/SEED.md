# Seed demo (OBSOLETO ? no usar en produccion)

El seed demo (`mundial-seed`, usuarios `maria`/`owner`, password `DevSeed2026!`) fue sustituido por acceso cerrado.

## Produccion

Usar solo:

```bash
CONFIRM_PURGE=1 npm run db:purge-demo
ALLOW_BOOTSTRAP=1 npm run db:bootstrap
```

## Archivos legacy (solo referencia local)

- `scripts/dev/seed.sql`
- `lib/dev/seed-ids.ts`

**No hay comando npm** que ejecute el seed demo. No repoblar produccion.
