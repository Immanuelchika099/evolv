alter table public.notification_delivery_log enable row level security;

create policy "Users can read their own notification history"
on public.notification_delivery_log
for select
to authenticated
using ((select auth.uid()) = user_id);
