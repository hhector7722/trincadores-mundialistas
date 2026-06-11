-- Una suscripción push por endpoint (re-registro al cambiar dispositivo)

create unique index if not exists push_subscriptions_endpoint_uidx
  on public.push_subscriptions (endpoint);
