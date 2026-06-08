-- Activacion tras onboarding PWA completo (standalone + telefono + credenciales + avatar)

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'Marca de tiempo cuando el usuario completa el onboarding PWA. Solo perfiles activados aparecen en ranking publico.';
