-- Kill switch: bloquea nuevas filas de notificaciones in-app y suscripciones push.
-- Reactivar: DROP TRIGGER + DROP FUNCTION (o poner NOTIFICATIONS_ENABLED = true en código
-- y eliminar estos triggers en una migración posterior).

CREATE OR REPLACE FUNCTION public.block_notification_writes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_notifications_insert ON public.notifications;
CREATE TRIGGER trg_block_notifications_insert
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.block_notification_writes();

DROP TRIGGER IF EXISTS trg_block_push_subscriptions_insert ON public.push_subscriptions;
CREATE TRIGGER trg_block_push_subscriptions_insert
  BEFORE INSERT ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_notification_writes();
