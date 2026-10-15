alter table public.notification_delivery_log
  drop constraint if exists notification_delivery_log_kind_check;

alter table public.notification_delivery_log
  add constraint notification_delivery_log_kind_check
  check (
    kind = any (array['morning'::text, 'hydration'::text, 'reflection'::text])
    or kind like 'routine\_%' escape '\'
  );
