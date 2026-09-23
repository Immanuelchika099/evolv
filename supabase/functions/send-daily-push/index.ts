import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const cors = { "Access-Control-Allow-Origin": "*" }

const MESSAGES = {
  morning: { title: (name) => "Good morning, " + name + " 🌱", body: "Take a moment to check in and start your day intentionally.", hour: 8, minute: 0 },
  hydration: { title: () => "Time to check in 💧", body: "How are you doing with your hydration today?", hour: 13, minute: 0 },
  evening: { title: () => "Evening check-in ✨", body: "Take a moment to reflect on how today went.", hour: 20, minute: 0 },
  sleep: { title: () => "Time to wind down 🌙", body: "Give yourself a little space to slow down and rest.", hour: 22, minute: 30 }
}

function localClock(timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value || ""
  return { date: get("year") + "-" + get("month") + "-" + get("day"), hour: Number(get("hour")), minute: Number(get("minute")) }
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("EVOLV_CRON_SECRET")
  if (!cronSecret || req.headers.get("x-evolv-cron-secret") !== cronSecret) return new Response("Unauthorized", { status: 401, headers: cors })

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@evolv.app"
  if (!vapidPublic || !vapidPrivate) return Response.json({ error: "VAPID keys are not configured." }, { status: 500, headers: cors })

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  const { data: rows, error } = await admin.from("push_subscriptions")
    .select("id,user_id,subscription,timezone,preferences,last_sent").eq("enabled", true)

  if (error) return Response.json({ error: error.message }, { status: 500, headers: cors })

  let sent = 0
  let removed = 0
  const now = new Date()

  for (const row of rows || []) {
    const clock = localClock(row.timezone || "Africa/Lagos")
    const preferences = row.preferences || {}
    const lastSent = row.last_sent || {}

    for (const [kind, message] of Object.entries(MESSAGES)) {
      if (!preferences[kind] || clock.hour !== message.hour || clock.minute !== message.minute || lastSent[kind] === clock.date) continue

      const { data: profile } = await admin.from("profiles").select("first_name").eq("id", row.user_id).maybeSingle()
      const name = profile?.first_name?.trim() || "there"
      const payload = {
        title: message.title(name), body: message.body,
        icon: "/evolv-mark.svg", badge: "/evolv-mark.svg",
        tag: "evolv-" + kind, url: "/dashboard", data: { reminder: kind }
      }

      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload))
        lastSent[kind] = clock.date
        sent += 1
      } catch (pushError) {
        const status = pushError?.statusCode
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id)
          removed += 1
          break
        }
        console.error("push failed:", row.id, kind, pushError)
      }
    }

    await admin.from("push_subscriptions").update({ last_sent: lastSent, updated_at: now.toISOString() }).eq("id", row.id)
  }

  return Response.json({ ok: true, checked: rows?.length || 0, sent, removed }, { headers: cors })
})
