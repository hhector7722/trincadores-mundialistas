# Auth (Fase 1a)

## Supabase Dashboard (obligatorio)

- Desactivar confirmacion de email.
- `minimum_password_length` >= 6 (app exige 8).
- Site URL / Redirect URLs: incluir `http://localhost:3000` y `http://localhost:3000/login`.

## Login

- UI: username + password.
- Backend: `toAuthEmail(username)` + `signInWithPassword`.

## Registro

- Requiere codigo de invitacion.
- Orden: signUp -> insert profiles -> RPC `consume_invite_and_join`.
- Si falla profile o RPC: rollback con `admin.deleteUser` (+ delete profiles si aplica).

## Recovery (1a) — limitacion operativa

- Mecanismo tecnico: `resetPasswordForEmail(toAuthEmail(username))` (email sintetico interno).
- **No es recovery usable en produccion** salvo que exista un canal de correo real que entregue mensajes a ese dominio (no hay inbox en `auth.trincadores.local`).
- La UI muestra mensaje generico; eso no implica que el usuario reciba el enlace.
- Para recovery real en fases posteriores: SMTP operativo y/o `profiles.recovery_email` (futuro).

## Bootstrap pool + owner

- **Fuera de 1a.** Usar `npm run db:seed` o service_role.
- RPC `create_pool_with_owner`: documentada para fase posterior.

## Seed dev

- Codigo invitacion: `SEED2026`
- Usuario ejemplo: `maria` / password `DevSeed2026!` (ver `lib/dev/seed-ids.ts`)

## Probar en local

1. Aplicar migraciones 0b + `20260605000000_phase_1a_auth_rpc.sql`.
2. `.env.local` con URL, anon key, service role, `AUTH_INTERNAL_DOMAIN`, `NEXT_PUBLIC_SITE_URL`.
3. `npm run db:seed` (opcional).
4. `npm run dev` -> http://localhost:3000 (redirige a login si no hay sesion).
5. Registro con codigo nuevo de invitacion o `SEED2026` y usuario nuevo.
6. Login con usuario seed.
7. Logout desde cabecera en `/`.
8. Recovery en `/recover`: solo verifica que la accion no rompe; no esperes email salvo SMTP configurado.
