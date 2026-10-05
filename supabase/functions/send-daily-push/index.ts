import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const cors = { "Access-Control-Allow-Origin": "*" }
const DELIVERY_WINDOW_MINUTES = 5

function alarmIsDue(clock, alarm) {
  const target = toMinutes(String(alarm.alarm_at || '').slice(11, 16), '08:00')
  const now = clock.hour * 60 + clock.minute
  let delta = now - target
  if (delta < 0) delta += 24 * 60
  if (delta < 0 || delta >= DELIVERY_WINDOW_MINUTES) return false
  if (alarm.repeat_type === 'daily') return true
  if (alarm.repeat_type === 'once') return String(alarm.alarm_at || '').slice(0, 10) === clock.date
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: alarm.timezone || 'Africa/Lagos', weekday: 'short' }).format(new Date())
  if (alarm.repeat_type === 'weekdays') return ['Mon','Tue','Wed','Thu','Fri'].includes(weekday)
  if (alarm.repeat_type === 'weekly') {
    const originalWeekday = new Intl.DateTimeFormat('en-US', { timeZone: alarm.timezone || 'Africa/Lagos', weekday: 'short' }).format(new Date(alarm.alarm_at))
    return weekday === originalWeekday
  }
  return false
}

const DEFAULTS = {
  morning: { title: (name) => "Good morning, " + name + " 🌱", body: "Start gently. Choose one thing that would make today feel worthwhile.", defaultTime: "08:00", url: "/dashboard" },
  hydration: { title: () => "A little reset 💧", body: "Take a moment, have some water, and check in with yourself.", defaultTime: "13:00", url: "/dashboard?log=water" },
  reflection: { title: () => "Your day, before you close it 🌙", body: "A quiet moment is waiting. How did today feel?", defaultTime: "22:30", url: "/dashboard?reflection=1" }
}

function localClock(timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value || ""
  return { date: get("year") + "-" + get("month") + "-" + get("day"), hour: Number(get("hour")), minute: Number(get("minute")) }
}

function toMinutes(value, fallback) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "")
  if (!match) return toMinutes(fallback)
  return Number(match[1]) * 60 + Number(match[2])
}

function inQuietHours(clock, preferences) {
  if (!preferences.quietHours) return false
  const now = clock.hour * 60 + clock.minute
  const start = toMinutes(preferences.quietStart, "23:00")
  const end = toMinutes(preferences.quietEnd, "07:00")
  if (start === end) return false
  return start < end ? now >= start && now < end : now >= start || now < end
}

function isDue(clock, target) {
  const now = clock.hour * 60 + clock.minute
  const scheduled = toMinutes(target, "08:00")
  let delta = now - scheduled
  if (delta < 0) delta += 24 * 60
  return delta >= 0 && delta < DELIVERY_WINDOW_MINUTES
}

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const cronSecret = req.headers.get("x-evolv-cron-secret")
  const { data: cronAuthorized, error: cronAuthError } = await admin.rpc("validate_evolv_cron_secret", { p_secret: cronSecret })
  if (cronAuthError || cronAuthorized !== true) {
    return new Response("Unauthorized", { status: 401, headers: cors })
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@evolv.app"
  if (!vapidPublic || !vapidPrivate) {
    return Response.json({ error: "VAPID keys are not configured." }, { status: 500, headers: cors })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id,user_id,subscription,timezone,preferences,last_sent,reflection_time")
    .eq("enabled", true)

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: cors })
  }

  const { data: alarms, error: alarmsError } = await admin
    .from("alarms")
    .select("id,user_id,title,note,alarm_at,repeat_type,enabled,timezone,last_fired_at")
    .eq("enabled", true)
    .eq("platform", "web")

  if (alarmsError) console.error("EVOLV alarm query failed", alarmsError.message)

  const userIds = [...new Set([
    ...(rows || []).map(row => row.user_id),
    ...(alarms || []).map(alarm => alarm.user_id)
  ].filter(Boolean))]

  const [{ data: profiles }, { data: waterMetric }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id,first_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    admin.from("metric_definitions").select("id").eq("slug", "water").maybeSingle()
  ])

  const names = Object.fromEntries((profiles || []).map(profile => [
    profile.id,
    profile.first_name?.trim() || "there"
  ]))

  let sent = 0
  let skippedDuplicate = 0
  let removed = 0
  const now = new Date()

  for (const row of rows || []) {
    const clock = localClock(row.timezone || "Africa/Lagos")
    const preferences = { ...row.preferences }

    if (row.reflection_time) preferences.reflectionTime = row.reflection_time

    const lastSent = row.last_sent || {}

    if (inQuietHours(clock, preferences)) continue

    for (const [kind, message] of Object.entries(DEFAULTS)) {
      if (!preferences[kind]) continue

      const target = preferences[kind + "Time"] || message.defaultTime
      if (!isDue(clock, target)) continue

      const { error: claimError } = await admin
        .from("notification_delivery_log")
        .insert({
          user_id: row.user_id,
          delivery_date: clock.date,
          kind
        })

      if (claimError) {
        if (claimError.code === "23505") {
          skippedDuplicate += 1
          continue
        }

        console.error("EVOLV delivery claim failed", JSON.stringify({
          subscriptionId: row.id,
          kind,
          error: claimError.message
        }))
        continue
      }

      let skip = false

      if (kind === "hydration" && waterMetric?.id) {
        const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        const { data: recentWater } = await admin
          .from("metric_logs")
          .select("id")
          .eq("user_id", row.user_id)
          .eq("metric_id", waterMetric.id)
          .gte("logged_at", since)
          .limit(1)

        if (recentWater?.length) skip = true
      }

      if (kind === "reflection") {
        const { data: reflection } = await admin
          .from("daily_reflections")
          .select("id")
          .eq("user_id", row.user_id)
          .eq("reflection_date", clock.date)
          .maybeSingle()

        if (reflection) skip = true
      }

      if (skip) {
        lastSent[kind] = clock.date
        continue
      }

      const payload = {
        title: message.title(names[row.user_id] || "there"),
        body: message.body,
        icon: "/evolv-mark.svg",
        badge: "/evolv-mark.svg",
        tag: "evolv-" + kind,
        url: message.url,
        data: { reminder: kind },
        actions: kind === "reflection"
          ? [{ action: "open", title: "Reflect now" }]
          : kind === "hydration"
            ? [{ action: "open", title: "Log water" }]
            : [{ action: "open", title: "Open EVOLV" }]
      }

      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload))
        lastSent[kind] = clock.date
        sent += 1
      } catch (pushError) {
        const status = pushError?.statusCode

        console.error("EVOLV push failed", JSON.stringify({
          subscriptionId: row.id,
          kind,
          status,
          error: String(pushError?.message || pushError)
        }))

        // A transient failure should be retried on the next minute.
        await admin
          .from("notification_delivery_log")
          .delete()
          .eq("user_id", row.user_id)
          .eq("delivery_date", clock.date)
          .eq("kind", kind)

        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id)
          removed += 1
          break
        }
      }
    }

    await admin
      .from("push_subscriptions")
      .update({
        last_sent: lastSent,
        updated_at: now.toISOString()
      })
      .eq("id", row.id)
  }


  let alarmsSent = 0
  let alarmsSkipped = 0

  for (const alarm of alarms || []) {
    const clock = localClock(alarm.timezone || "Africa/Lagos")
    if (!alarmIsDue(clock, alarm)) continue

    const lastFiredDate = alarm.last_fired_at
      ? localClock(alarm.timezone || "Africa/Lagos").date
      : null

    if (alarm.last_fired_at) {
      const firedParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: alarm.timezone || "Africa/Lagos",
        year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(new Date(alarm.last_fired_at))
      const get = (type) => firedParts.find(part => part.type === type)?.value || ""
      const firedDate = get("year") + "-" + get("month") + "-" + get("day")
      if (firedDate === clock.date) {
        alarmsSkipped += 1
        continue
      }
    }

    const subscriptions = (rows || []).filter(row => row.user_id === alarm.user_id)
    if (!subscriptions.length) continue

    const payload = {
      title: alarm.title || "Evolv alarm",
      body: alarm.note || "Your Evolv alarm is ready.",
      icon: "/evolv-mark.svg",
      badge: "/evolv-mark.svg",
      tag: "evolv-alarm-" + alarm.id,
      renotify: true,
      requireInteraction: true,
      url: "/dashboard",
      data: { alarmId: alarm.id, kind: "alarm" }
    }

    let delivered = false

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription.subscription, JSON.stringify(payload))
        delivered = true
        alarmsSent += 1
      } catch (pushError) {
        const status = pushError?.statusCode
        console.error("EVOLV alarm push failed", JSON.stringify({
          alarmId: alarm.id,
          subscriptionId: subscription.id,
          status,
          error: String(pushError?.message || pushError)
        }))
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id)
          removed += 1
        }
      }
    }

    if (delivered) {
      await admin
        .from("alarms")
        .update({
          last_fired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(alarm.repeat_type === "once" ? { enabled: false } : {})
        })
        .eq("id", alarm.id)
        .eq("enabled", true)
    }
  }

  return Response.json({
    ok: true,
    checked: rows?.length || 0,
    sent,
    skippedDuplicate,
    alarmsChecked: alarms?.length || 0,
    alarmsSent,
    alarmsSkipped,
    removed
  }, { headers: cors })
})