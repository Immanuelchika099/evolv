import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const cors = { "Access-Control-Allow-Origin": "*" }
const DELIVERY_WINDOW_MINUTES = 10

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
  reflection: { title: () => "Your day, before you close it 🌙", body: "A quiet moment is waiting. How did today feel?", defaultTime: "22:30", url: "/dashboard?reflection=1" }
}

async function generatePersonalNotification(admin, userId, profile, date) {
  const apiKey = Deno.env.get("GEMINI_API_KEY")
  if (!apiKey) {
    console.error("EVOLV AI notification skipped: GEMINI_API_KEY is not configured.")
    return null
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [goalsResult, logsResult, reflectionResult] = await Promise.all([
    admin.from("goals").select("title,description,status,progress").eq("user_id", userId).limit(10),
    admin.from("metric_logs").select("logged_at,value,unit,note,metric_id").eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: false }).limit(20),
    admin.from("daily_reflections").select("reflection_date,mood,notes").eq("user_id", userId).gte("reflection_date", date.slice(0, 7) + "-01").order("reflection_date", { ascending: false }).limit(5)
  ])

  const context = {
    firstName: profile?.first_name || null,
    goals: goalsResult.error ? [] : goalsResult.data || [],
    recentLogs: logsResult.error ? [] : logsResult.data || [],
    reflections: reflectionResult.error ? [] : reflectionResult.data || [],
    date
  }
  if (!context.firstName && !context.goals.length && !context.recentLogs.length && !context.reflections.length) return null

  const prompt = [
    "Create one personalised push notification for a calm, AI-powered productivity and personal growth app.",
    "Use only this data; never invent progress, feelings, habits, or missed activities.",
    "Return JSON only with string keys title and body.",
    "Title: friendly natural lowercase, 2-5 words. Body: one short sentence, ideally 8-14 words.",
    "No app name, no brand footer, no emoji, no guilt, no generic water or meal reminders.",
    "If there are no logs, encourage a first small step related to an actual goal if one exists.",
    "If context is too thin to provide a genuinely useful message, return JSON with empty title and body.",
    "User data: " + JSON.stringify(context)
  ].join("\n")

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json", maxOutputTokens: 160 }
      }),
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) {
      console.error("EVOLV AI notification generation failed:", response.status)
      return null
    }
    const result = await response.json()
    const raw = result?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim()
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const title = String(parsed.title || "").replace(/[\r\n]+/g, " ").trim().slice(0, 48).toLowerCase()
    const body = String(parsed.body || "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 140)
    if (!title || !body || body.split(/\s+/).length > 22) return null
    return { title, body }
  } catch (error) {
    console.error("EVOLV AI notification error:", String(error?.message || error))
    return null
  }
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

function minutesBefore(time, leadMinutes = 10) {
  const total = (toMinutes(time, "08:00") - leadMinutes + 1440) % 1440
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0")
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

  // A user can have several active devices (e.g. iPhone Home Screen + another browser).
  // Claim each reminder once per user, but deliver it to every active endpoint for that user.
  async function sendToAllDevices(userId, payload, kind) {
    let delivered = 0
    const targets = (rows || []).filter(target => target.user_id === userId)
    for (const target of targets) {
      try {
        await webpush.sendNotification(target.subscription, JSON.stringify(payload))
        delivered += 1
        sent += 1
      } catch (deviceError) {
        const status = deviceError?.statusCode
        console.error("EVOLV push failed for device", JSON.stringify({
          subscriptionId: target.id,
          kind,
          status,
          error: String(deviceError?.message || deviceError)
        }))
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", target.id)
          removed += 1
        }
      }
    }
    return delivered
  }

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

      let notification = { title: message.title(names[row.user_id] || "there"), body: message.body }
      if (kind === "morning") {
        const generated = await generatePersonalNotification(admin, row.user_id, (profiles || []).find(profile => profile.id === row.user_id), clock.date)
        if (!generated) {
          await admin.from("notification_delivery_log").delete()
            .eq("user_id", row.user_id).eq("delivery_date", clock.date).eq("kind", kind)
          continue
        }
        notification = generated
      }

      const payload = {
        title: notification.title,
        body: notification.body,
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
        const deliveredToDevices = await sendToAllDevices(row.user_id, payload, kind)
        if (!deliveredToDevices) throw new Error("No active device accepted the push.")
        lastSent[kind] = clock.date
      } catch (pushError) {
        console.error("EVOLV push failed for all devices", JSON.stringify({
          userId: row.user_id,
          kind,
          error: String(pushError?.message || pushError)
        }))
        // Retry on the next scheduler tick if none of the user's devices accepted it.
        await admin.from("notification_delivery_log").delete()
          .eq("user_id", row.user_id).eq("delivery_date", clock.date).eq("kind", kind)
      }
    }
    const routineReminders = Array.isArray(preferences.routineReminders) ? preferences.routineReminders : []
    for (const reminder of routineReminders) {
      if (!reminder || reminder.enabled === false || !reminder.id || !reminder.time) continue
      const kind = "routine_" + String(reminder.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32)
      const leadMinutes = Math.min(720, Math.max(0, Number(preferences.routineReminderLeadMinutes ?? reminder.leadMinutes ?? 10)))
      const target = minutesBefore(String(reminder.time), leadMinutes)
      if (inQuietHours(clock, preferences) || !isDue(clock, target)) continue
      const { error: claimError } = await admin.from("notification_delivery_log").insert({
        user_id: row.user_id, delivery_date: clock.date, kind
      })
      if (claimError) {
        if (claimError.code === "23505") { skippedDuplicate += 1; continue }
        console.error("EVOLV routine reminder claim failed", claimError.message)
        continue
      }
      const label = String(reminder.label || "Your next routine").slice(0, 80)
      const payload = {
        title: leadMinutes === 0 ? "It’s time for " + label.toLowerCase() : label + " in " + leadMinutes + (leadMinutes === 1 ? " minute" : " minutes"),
        body: leadMinutes === 0 ? "Your planned routine is scheduled for now." : "A gentle heads-up from EVOLV. Get ready when you can.",
        icon: "/evolv-mark.svg", badge: "/evolv-mark.svg",
        tag: "evolv-" + kind, url: "/dashboard",
        data: { reminder: kind, routineId: reminder.id },
        actions: [{ action: "open", title: "Open EVOLV" }]
      }
      try {
        const deliveredToDevices = await sendToAllDevices(row.user_id, payload, kind)
        if (!deliveredToDevices) throw new Error("No active device accepted the routine reminder.")
        lastSent[kind] = clock.date
      } catch (pushError) {
        console.error("EVOLV routine push failed for all devices", JSON.stringify({
          userId: row.user_id, kind, error: String(pushError?.message || pushError)
        }))
        await admin.from("notification_delivery_log").delete()
          .eq("user_id", row.user_id).eq("delivery_date", clock.date).eq("kind", kind)
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