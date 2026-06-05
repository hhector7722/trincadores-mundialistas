# Auth — acceso cerrado (alias + codigo)

## Modelo

- UI: **alias + codigo de acceso** (sin email visible).
- Backend: `toAuthEmail(alias)` + `signInWithPassword(codigo)`.
- Identidad: `auth.users.id` = `profiles.id` = `pool_members.profile_id`.
- RLS sin cambios estructurales: todo depende de `auth.uid()`.

## Supabase Dashboard

- Desactivar confirmacion de email.
- `minimum_password_length` >= 12 (codigos de acceso).
- Site URL / Redirect URLs: produccion + `http://localhost:3000/login`.

## Login

1. Usuario introduce alias + codigo.
2. Server Action `signIn` valida formato.
3. `signInWithPassword` crea sesion Supabase (cookies SSR).
4. Se comprueba `profiles.is_active`.
5. Cookie de pool activo si hay una sola membresia.

## Registro abierto

**Desactivado.** No existe `/register`. Los participantes se precargan con `npm run db:bootstrap`.

## Recuperacion de codigo

No hay recovery por email. El owner regenera codigos con `regenerateAccessCode` (admin).

## Bootstrap produccion

```bash
CONFIRM_PURGE=1 npm run db:purge-demo
ALLOW_BOOTSTRAP=1 npm run db:bootstrap
```

Los codigos se guardan en `access-codes.local.txt` (gitignored). Entregar por canal privado.

## Variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server/scripts)
- `DATABASE_URL` (scripts purge/bootstrap)
- `AUTH_INTERNAL_DOMAIN` (opcional, default `auth.trincadores.local`)
