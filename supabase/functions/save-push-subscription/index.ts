import { createClient } from "npm:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

const DEFAULT_PREFERENCES = {
  morning: true,
  hydration: true,
  reflection: true,
  morningTime: "08:00",
  hydrationTime: "13:00",
  reflectionTime: "22:30",
  quietHours: true,
  quietStart: "23:00",
  quietEnd: "07:00"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "Missing authorization" }, { status: 401, headers: cors })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors })

    const body = await req.json().catch(() => ({}))

    if (body.action === "config") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")
      if (!vapidPublicKey) return Response.json({ error: "VAPID public key is not configured." }, { status: 500, headers: cors })
      return Response.json({ ok: true, vapidPublicKey }, { headers: { ...cors, "Content-Type": "application/json" } })
    }

    const enabled = body.enabled !== false
    const subscription = body.subscription || null
    const timezone = body.timezone || "Africa/Lagos"
    const preferences = { ...DEFAULT_PREFERENCES, ...(body.preferences || {}) }
    if (body.reflectionTime) preferences.reflectionTime = body.reflectionTime

    if (!subscription?.endpoint && enabled) {
      return Response.json({ error: "Push subscription is required." }, { status: 400, headers: cors })
    }

    const endpoint = subscription?.endpoint || ("disabled:" + user.id)
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint,
      subscription: subscription || {},
      timezone,
      enabled,
      preferences,
      reflection_time: preferences.reflectionTime || "22:30",
      updated_at: new Date().toISOString()
    }, { onConflict: "endpoint" })

    if (error) throw error

    return Response.json({ ok: true }, { headers: { ...cors, "Content-Type": "application/json" } })
  } catch (error) {
    console.error("save-push-subscription:", error)
    return Response.json({ error: error?.message || "Could not save push subscription." }, { status: 500, headers: cors })
  }
})