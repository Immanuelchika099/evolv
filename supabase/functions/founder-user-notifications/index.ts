import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const FOUNDER_USER_ID = "7b5fc531-011c-4cbc-96c6-fe47088be175"
const MILESTONES = [10, 50, 100, 250, 500, 1000, 5000, 10000]
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { ...cors, "Content-Type": "application/json" } })
}

async function countRegisteredUsers(admin: ReturnType<typeof createClient>) {
  let page = 1
  let total = 0
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users || []
    total += users.length
    if (users.length < perPage) break
    page += 1
  }
  return total
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const requestBody = await req.json().catch(() => ({}))
    const url = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
    if (!url || !anonKey || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
      console.error("Founder notification function is missing required environment configuration.")
      return json({ error: "Founder notifications are not configured." }, 500)
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let user: { id: string; created_at: string } | null = null
    if (requestBody?.action === "auth_signup") {
      const requestedUserId = typeof requestBody.user_id === "string" ? requestBody.user_id : ""
      if (!requestedUserId) return json({ error: "Missing newly registered user ID." }, 400)
      const { data: foundUser, error: foundUserError } = await admin.auth.admin.getUserById(requestedUserId)
      if (foundUserError || !foundUser?.user) return json({ error: "Registered account not found." }, 404)
      user = { id: foundUser.user.id, created_at: foundUser.user.created_at }
    } else {
      const authHeader = req.headers.get("Authorization")
      if (!authHeader) return json({ error: "Unauthorized" }, 401)
      const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
      const { data: { user: authenticatedUser }, error: authError } = await caller.auth.getUser()
      if (authError || !authenticatedUser) return json({ error: "Unauthorized" }, 401)
      user = { id: authenticatedUser.id, created_at: authenticatedUser.created_at }
    }
    if (requestBody?.action === "founder_current_count_test") {
      if (user.id !== FOUNDER_USER_ID) return json({ error: "Founder only." }, 403)

      const { data: devices, error: devicesError } = await admin
        .from("push_subscriptions")
        .select("id,subscription")
        .eq("user_id", FOUNDER_USER_ID)
        .eq("enabled", true)
      if (devicesError) throw devicesError
      if (!devices?.length) return json({ error: "No enabled founder push device is registered." }, 409)

      webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:hello@evolv.app", vapidPublic, vapidPrivate)
      const currentCount = await countRegisteredUsers(admin)
      let delivered = 0
      for (const device of devices) {
        try {
          await webpush.sendNotification(device.subscription, JSON.stringify({
            title: "Evolv user count 🚀",
            body: "Sir Iman, your Evolv app currently has " + currentCount + (currentCount === 1 ? " user." : " users."),
            icon: "/evolv-mark.svg",
            badge: "/evolv-mark.svg",
            tag: "evolv-founder-current-count-test-" + Date.now(),
            url: "/dashboard",
            data: { kind: "founder_current_count_test", userCount: currentCount },
          }))
          delivered += 1
        } catch (error) {
          const status = (error as { statusCode?: number })?.statusCode
          console.error("Founder count-test push failed", JSON.stringify({
            deviceId: device.id,
            status,
            error: String((error as Error)?.message || error),
          }))
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", device.id)
          }
        }
      }
      return delivered
        ? json({ ok: true, userCount: currentCount, notifiedFounderDevices: delivered, test: true })
        : json({ error: "Could not deliver the test notification to any founder device." }, 502)
    }

    // This database timestamp is created when the feature is enabled.
    // Older accounts are ignored, preventing an initial burst of alerts.
    const { data: config, error: configError } = await admin
      .from("founder_notification_config")
      .select("enabled_at")
      .eq("id", true)
      .single()
    if (configError || !config?.enabled_at) throw configError || new Error("Missing founder notification activation time.")
    if (new Date(user.created_at) < new Date(config.enabled_at)) {
      return json({ ok: true, ignored: "existing_account" })
    }

    const { data: founderDevices, error: devicesError } = await admin
      .from("push_subscriptions")
      .select("id,subscription")
      .eq("user_id", FOUNDER_USER_ID)
      .eq("enabled", true)

    if (devicesError) throw devicesError
    if (!founderDevices?.length) {
      return json({ error: "No enabled founder push device is registered." }, 409)
    }

    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:hello@evolv.app", vapidPublic, vapidPrivate)
    const userCount = await countRegisteredUsers(admin)

    const { error: eventClaimError } = await admin
      .from("founder_signup_open_events")
      .insert({ user_id: user.id, user_count_at_open: userCount })

    if (eventClaimError) {
      if (eventClaimError.code === "23505") return json({ ok: true, duplicate: true, userCount })
      throw eventClaimError
    }

    async function sendFounderPush(payload: Record<string, unknown>) {
      let delivered = 0
      for (const device of founderDevices) {
        try {
          await webpush.sendNotification(device.subscription, JSON.stringify(payload))
          delivered += 1
        } catch (error) {
          const status = (error as { statusCode?: number })?.statusCode
          console.error("Founder push failed", JSON.stringify({
            deviceId: device.id,
            status,
            error: String((error as Error)?.message || error),
          }))
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", device.id)
          }
        }
      }
      return delivered
    }

    const normalDelivered = await sendFounderPush({
      title: "A new Evolv user 🚀",
      body: "Sir Iman, your Evolv app currently has " + userCount + (userCount === 1 ? " user." : " users."),
      icon: "/evolv-mark.svg",
      badge: "/evolv-mark.svg",
      tag: "evolv-founder-new-user-" + user.id,
      url: "/dashboard",
      data: { kind: "founder_new_user", userCount },
    })

    if (!normalDelivered) {
      await admin.from("founder_signup_open_events").delete().eq("user_id", user.id)
      return json({ error: "Could not deliver the founder signup notification. It can retry on the next app opening." }, 502)
    }

    let milestoneSent: number | null = null
    if (MILESTONES.includes(userCount)) {
      const { error: milestoneClaimError } = await admin
        .from("founder_user_milestones")
        .insert({ milestone: userCount, user_count: userCount })

      if (!milestoneClaimError) {
        const milestoneDelivered = await sendFounderPush({
          title: "Evolv milestone reached 🎉",
          body: userCount >= 100
            ? "Sir Iman, Evolv has reached " + userCount.toLocaleString("en-US") + " registered users. Congratulations! 🥳"
            : "Sir Iman, Evolv has reached " + userCount.toLocaleString("en-US") + " registered users. Keep building! 🚀",
          icon: "/evolv-mark.svg",
          badge: "/evolv-mark.svg",
          tag: "evolv-founder-milestone-" + userCount,
          url: "/dashboard",
          data: { kind: "founder_user_milestone", userCount },
        })

        if (milestoneDelivered) {
          milestoneSent = userCount
        } else {
          await admin.from("founder_user_milestones").delete().eq("milestone", userCount)
          console.error("Milestone push was not delivered; claim released for retry.")
        }
      } else if (milestoneClaimError.code !== "23505") {
        console.error("Could not claim founder milestone", milestoneClaimError.message)
      }
    }

    return json({ ok: true, userCount, notifiedFounderDevices: normalDelivered, milestoneSent })
  } catch (error) {
    console.error("founder-user-notifications failed:", error)
    return json({ error: "Could not process founder notification." }, 500)
  }
})
