alter table public.notification_delivery_log
  drop constraint if exists notification_delivery_log_kind_check;

alter table public.notification_delivery_log
  add constraint notification_delivery_log_kind_check
  check (
    kind = any (array['morning','lunch','dinner','hydration','reflection','weekly_summary']::text[])
    or kind like 'routine\_%' escape '\'
    or kind like 'streak\_%' escape '\'
  );
