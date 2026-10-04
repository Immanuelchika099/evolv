import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function extractText(result: any) {
  const parts = result?.candidates?.[0]?.content?.parts
  return Array.isArray(parts)
    ? parts
        .filter((part: any) => typeof part?.text === "string")
        .map((part: any) => part.text)
        .join("")
        .trim()
    : ""
}

const autoLoggingGuidance = `
AUTO-LOGGING:
- EVOLV is also the user's hands-free logging assistant.
- If the user states a completed, measurable action or event as a fact (for example, "I drank 750ml of water", "I studied for 45 minutes", "I walked 6,000 steps", "I spent ₦3,000", "I ate rice and chicken for lunch"), automatically log it using the appropriate logging tool.
- Do NOT wait for the user to say "log this" when the statement is clearly a record of something that happened.
- Do NOT log hypothetical plans, questions, advice, or vague conversation.
- Do NOT infer sensitive or uncertain measurements. If the amount/date/type is genuinely unclear, ask a short clarification.
- When several distinct things are stated in one message, log each clearly supported item.
- After logging, briefly tell the user what you recorded. Never claim a log was saved unless the tool succeeded.
- Normalize values to Evolv's stored units: sleep hours; water litres; steps steps; exercise/focus/learning/building/reading/social/personal/reflection minutes; mood/energy/stress 1-5; money metrics NGN.
- Use today's date unless the user explicitly gives another date.
`

const toolDeclarations = [
  {
    name: "log_metric",
    description: "Automatically records a completed measurable activity or metric when the user states it happened, without requiring them to say 'log it'. Do not use for plans, hypotheticals, or vague statements.",
    parameters: {
      type: "object",
      properties: {
        metric_slug: { type: "string", description: "Evolv metric slug such as water, sleep, steps, exercise, learning, building, focus, reading, mood, energy, stress, income, spending, savings, or bills." },
        value: { type: "number", description: "Normalized numeric value in the metric's stored unit." },
        logged_for: { type: "string", description: "Optional date in YYYY-MM-DD format." },
        note: { type: "string", description: "Optional short note." }
      },
      required: ["metric_slug", "value"]
    }
  },
  {
    name: "log_meal",
    description: "Automatically records a meal the user says they ate, without requiring a separate manual logging action.",
    parameters: {
      type: "object",
      properties: {
        meal_type: { type: "string", description: "One of breakfast, lunch, dinner, or snack." },
        description: { type: "string", description: "What the user ate or drank." },
        calories: { type: "number", description: "Only when explicitly provided." },
        protein_g: { type: "number", description: "Only when explicitly provided." },
        carbs_g: { type: "number", description: "Only when explicitly provided." },
        fat_g: { type: "number", description: "Only when explicitly provided." },
        water_ml: { type: "number", description: "Only when explicitly provided." },
        logged_at: { type: "string", description: "Optional ISO timestamp." },
        note: { type: "string", description: "Optional short note." }
      },
      required: ["meal_type", "description"]
    }
  },

  {
    name: "get_ai_memory",
    description: "Gets the user's saved Evolv AI memory. Use it to personalize responses when relevant. Never invent memories.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "remember_user",
    description: "Saves a preference or long-term fact only when the user explicitly asks Evolv to remember it.",
    parameters: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key","value"] },
  },
  {
    name: "get_user_insights",
    description: "Analyzes the user's last 30 days of Evolv data for trends, averages, changes, consistency, mood and goal status. Use for pattern and progress questions.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_user_goals",
    description: "Gets the signed-in user's current Evolv goals. Use this when the user asks what goals they have, wants to review goals, or asks about goal progress.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_progress",
    description: "Gets the signed-in user's latest Evolv progress, including goals, recent health logs, meals, and daily reflections. Use this when the user asks about their actual tracked data.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_goal",
    description: "Creates a new goal for the signed-in user in Evolv. Use this when the user clearly asks you to add or create a goal.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The goal title.",
        },
        description: {
          type: "string",
          description: "Optional short description of the goal.",
        },
        due_date: {
          type: "string",
          description: "Optional due date in YYYY-MM-DD format.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_goal_progress",
    description: "Updates the progress percentage of one of the signed-in user's goals. Use this when the user clearly asks to update or mark progress on a specific goal.",
    parameters: {
      type: "object",
      properties: {
        goal_id: {
          type: "string",
          description: "The UUID of the goal to update.",
        },
        progress: {
          type: "integer",
          description: "Progress percentage from 0 to 100.",
        },
      },
      required: ["goal_id", "progress"],
    },
  },
]

async function executeTool(
  supabase: any,
  userId: string,
  name: string,
  args: Record<string, any>,
) {
  if (name === "log_metric") {
    const slug = typeof args.metric_slug === "string" ? args.metric_slug.trim().toLowerCase() : ""
    const value = Number(args.value)
    if (!slug) throw new Error("A metric is required.")
    if (!Number.isFinite(value)) throw new Error("A numeric value is required.")

    const { data: definition, error: definitionError } = await supabase
      .from("metric_definitions")
      .select("id,slug,name,unit,input_type,is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()

    if (definitionError) throw definitionError
    if (!definition) throw new Error(`I couldn't find an Evolv metric called "${slug}".`)
    if (definition.input_type === "scale" && (value < 1 || value > 5)) throw new Error(`${definition.name} must be between 1 and 5.`)
    if (value < 0) throw new Error("Metric values cannot be negative.")

    const date = typeof args.logged_for === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.logged_for)
      ? args.logged_for : new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase.from("metric_logs").insert({
      user_id: userId, metric_id: definition.id, logged_for: date,
      value_numeric: value, value: value, unit: definition.unit || null,
      note: typeof args.note === "string" ? args.note.trim().slice(0, 500) || null : null,
      metadata: { source: "evolv_ai", automatic: true }, logged_at: new Date().toISOString()
    }).select("id,metric_id,value,unit,note,metadata,logged_at,created_at").single()

    if (error) throw error
    return { success: true, action: "metric_logged", log: { ...data, metric_slug: definition.slug, metric_name: definition.name } }
  }

  if (name === "log_meal") {
    const mealType = typeof args.meal_type === "string" ? args.meal_type.trim().toLowerCase() : ""
    const description = typeof args.description === "string" ? args.description.trim() : ""
    if (!["breakfast", "lunch", "dinner", "snack"].includes(mealType)) throw new Error("Meal type must be breakfast, lunch, dinner, or snack.")
    if (!description) throw new Error("A meal description is required.")
    if (description.length > 1000) throw new Error("Meal description is too long.")

    const num = key => Number.isFinite(Number(args[key])) ? Number(args[key]) : null
    const { data, error } = await supabase.from("meal_logs").insert({
      user_id: userId, meal_type: mealType, description,
      calories: num("calories"), protein_g: num("protein_g"), carbs_g: num("carbs_g"), fat_g: num("fat_g"), water_ml: num("water_ml"),
      note: typeof args.note === "string" ? args.note.trim().slice(0, 500) || null : null,
      logged_at: typeof args.logged_at === "string" && !Number.isNaN(new Date(args.logged_at).getTime()) ? new Date(args.logged_at).toISOString() : new Date().toISOString(),
      metadata: { source: "evolv_ai", automatic: true }
    }).select("id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at").single()

    if (error) throw error
    return { success: true, action: "meal_logged", meal: data }
  }

  if (name === "get_ai_memory") {
    const { data, error } = await supabase.from("ai_user_memory").select("memory_key,memory_value,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(40)
    if (error) throw error
    return { memories: (data || []).map((item:any) => ({ key:item.memory_key, value:item.memory_value, updated_at:item.updated_at })) }
  }

  if (name === "remember_user") {
    const key = typeof args.key === "string" ? args.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0,80) : ""
    const value = typeof args.value === "string" ? args.value.trim().slice(0,500) : ""
    if (!key || !value) throw new Error("A memory key and value are required.")
    const { data, error } = await supabase.from("ai_user_memory").upsert({ user_id:userId, memory_key:key, memory_value:value, updated_at:new Date().toISOString() }, { onConflict:"user_id,memory_key" }).select("memory_key,memory_value,updated_at").single()
    if (error) throw error
    return { success:true, action:"memory_saved", memory:data }
  }

  if (name === "get_user_insights") {
    const since = new Date(Date.now()-30*86400000).toISOString().slice(0,10)
    const [goalsResult, metricsResult, mealsResult, reflectionsResult] = await Promise.all([
      supabase.from("goals").select("id,title,status,progress,due_date,metric_id,target_value,start_value,unit,target_direction,target_period,updated_at").eq("user_id",userId).neq("status","archived").order("updated_at",{ascending:false}).limit(30),
      supabase.from("metric_logs").select("metric_id,logged_for,value_numeric,value,unit,created_at").eq("user_id",userId).gte("logged_for",since).order("logged_for",{ascending:true}).limit(500),
      supabase.from("meal_logs").select("meal_type,calories,protein_g,logged_at").eq("user_id",userId).gte("logged_at",new Date(Date.now()-30*86400000).toISOString()).order("logged_at",{ascending:true}).limit(300),
      supabase.from("daily_reflections").select("reflection_date,mood").eq("user_id",userId).gte("reflection_date",since).order("reflection_date",{ascending:true}).limit(31),
    ])
    if (goalsResult.error) throw goalsResult.error
    if (metricsResult.error) throw metricsResult.error
    if (mealsResult.error) throw mealsResult.error
    if (reflectionsResult.error) throw reflectionsResult.error
    const groups:Record<string,number[]> = {}
    for (const row of metricsResult.data || []) { const id=row.metric_id; if(!groups[id]) groups[id]=[]; groups[id].push(Number(row.value_numeric ?? row.value ?? 0)) }
    const ids=Object.keys(groups)
    const defs=ids.length ? await supabase.from("metric_definitions").select("id,name,slug,unit").in("id",ids) : {data:[],error:null}
    if(defs.error) throw defs.error
    const byId=Object.fromEntries((defs.data||[]).map((d:any)=>[d.id,d]))
    const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0
    const trends=ids.map(id=>{ const v=groups[id], mid=Math.max(1,Math.ceil(v.length/2)), earlier=v.slice(0,mid), recent=v.slice(mid), a=avg(earlier), b=avg(recent); return {metric:byId[id]?.name||id,slug:byId[id]?.slug||null,unit:byId[id]?.unit||null,entries:v.length,average_30d:Number(avg(v).toFixed(2)),recent_average:Number(b.toFixed(2)),earlier_average:Number(a.toFixed(2)),change_percent:a?Number((((b-a)/Math.abs(a))*100).toFixed(1)):null} })
    const moods=(reflectionsResult.data||[]).map((r:any)=>Number(r.mood)).filter((n:number)=>Number.isFinite(n))
    return {period_days:30,goals:goalsResult.data||[],metric_trends:trends,reflection_mood_average:moods.length?Number(avg(moods).toFixed(2)):null,reflection_days:moods.length,meals_logged:(mealsResult.data||[]).length,note:"Descriptive trends only; not a diagnosis."}
  }

  if (name === "get_user_goals") {
    const { data, error } = await supabase
      .from("goals")
      .select("id,title,description,status,progress,due_date,created_at,updated_at")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) throw error

    return {
      goals: (data || []).map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        progress: Number(goal.progress || 0),
        due_date: goal.due_date,
      })),
    }
  }

  if (name === "get_user_progress") {
    const [goalsResult, metricsResult, mealsResult, reflectionsResult] = await Promise.all([
      supabase
        .from("goals")
        .select("id,title,status,progress,due_date,updated_at")
        .eq("user_id", userId)
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(30),
      supabase
        .from("metric_logs")
        .select("id,metric_id,logged_for,value_numeric,value_text,value_boolean,unit,note,created_at")
        .eq("user_id", userId)
        .order("logged_for", { ascending: false })
        .limit(30),
      supabase
        .from("meal_logs")
        .select("id,meal_type,eaten_at,description,calories,protein_g,carbs_g,fat_g,water_ml,note")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false })
        .limit(20),
      supabase
        .from("daily_reflections")
        .select("id,reflection_date,mood,day_feeling,note")
        .eq("user_id", userId)
        .order("reflection_date", { ascending: false })
        .limit(14),
    ])

    if (goalsResult.error) throw goalsResult.error
    if (metricsResult.error) throw metricsResult.error
    if (mealsResult.error) throw mealsResult.error
    if (reflectionsResult.error) throw reflectionsResult.error

    return {
      goals: goalsResult.data || [],
      metric_logs: metricsResult.data || [],
      meals: mealsResult.data || [],
      reflections: reflectionsResult.data || [],
    }
  }

  if (name === "create_goal") {
    const title = typeof args.title === "string" ? args.title.trim() : ""
    if (!title) throw new Error("A goal title is required.")
    if (title.length > 240) throw new Error("Goal title is too long.")

    const description =
      typeof args.description === "string" && args.description.trim()
        ? args.description.trim().slice(0, 2000)
        : null

    const dueDate =
      typeof args.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.due_date)
        ? args.due_date
        : null

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title,
        description,
        due_date: dueDate,
        status: "active",
        progress: 0,
      })
      .select("id,title,description,status,progress,due_date")
      .single()

    if (error) throw error

    return {
      success: true,
      goal: data,
    }
  }

  if (name === "update_goal_progress") {
    const goalId = typeof args.goal_id === "string" ? args.goal_id : ""
    const progress = Number(args.progress)

    if (!goalId) throw new Error("A goal ID is required.")
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw new Error("Progress must be a whole number from 0 to 100.")
    }

    const status = progress >= 100 ? "completed" : "active"

    const { data, error } = await supabase
      .from("goals")
      .update({
        progress,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", userId)
      .select("id,title,status,progress,due_date")
      .single()

    if (error) throw error

    return {
      success: true,
      goal: data,
    }
  }

  throw new Error("Unknown Evolv tool.")
}


async function generateChatTitle(geminiKey: string, messages: any[]) {
  const safe = messages.filter((m: any) =>
    m && ["user", "assistant"].includes(m.role) &&
    typeof m.content === "string" && m.content.trim()
  ).slice(-14).map((m: any) => ({ role: m.role, content: m.content.slice(0, 2500) }))

  const conversation = safe.map((m: any) => `${m.role === "user" ? "User" : "Evolv"}: ${m.content}`).join("\n")
  const prompt = `Create a short chat-history headline for this conversation.

Rules:
- Understand the actual topic and context of the whole conversation.
- Return ONLY the headline. No quotes, no punctuation at the end, no explanation.
- Keep it short: ideally 2–5 words, maximum 6 words.
- Make it specific enough to recognize the conversation later.
- Match the user's natural language. If it is Nigerian Pidgin or mixed Nigerian English/Pidgin, a natural matching headline is okay.
- Do not force slang, emojis, or Nigerian references when they do not fit.
- Do not use the user's name.
- Avoid generic titles such as "New conversation", "Chat", "Discussion", or "Life advice".

Conversation:
${conversation}`

  const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
  for (const model of models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 40, temperature: 0.35 },
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      if ([429,500,502,503,504].includes(response.status)) continue
      throw new Error(result?.error?.message || "Could not generate a chat title.")
    }
    const title = extractText(result)
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .replace(/[.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim().slice(0, 80)
    if (title) return title
  }
  throw new Error("Could not generate a chat title.")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authorization = req.headers.get("Authorization")
    if (!authorization) return json({ error: "Unauthorized" }, 401)

    const { messages, profile, progress, action, attachments = [] } = await req.json()

    if (!Array.isArray(messages) || !messages.length) {
      return json({ error: "A message is required." }, 400)
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

    if (!geminiKey) return json({ error: "Evolv AI is missing GEMINI_API_KEY." }, 503)
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "Evolv AI is missing Supabase configuration." }, 503)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return json({ error: "Unauthorized" }, 401)

    if (action === "generate_chat_title") {
      if (!Array.isArray(messages) || !messages.length) {
        return json({ error: "A conversation is required." }, 400)
      }
      try {
        return json({ title: await generateChatTitle(geminiKey, messages) })
      } catch (titleError: any) {
        console.error("EVOLV chat title generation failed", titleError)
        return json({ error: titleError?.message || "Could not generate a chat title." }, 502)
      }
    }


    const safeMessages = messages
      .filter(
        (m: any) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.trim(),
      )
      .slice(-14)
      .map((m: any) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      }))

    const firstName = profile?.first_name?.trim() || "there"
    const timezone =
      typeof profile?.timezone === "string" && profile.timezone.trim()
        ? profile.timezone.trim()
        : "Africa/Lagos"

    const now = new Date()
    const currentDateTime =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now) +
      " (" +
      timezone +
      ")"

    const userContext = profile
      ? `First name: ${firstName}
Current focus: ${profile.focus || "not set"}
Growth areas: ${Array.isArray(profile.growth_areas) ? profile.growth_areas.join(", ") : "not set"}
First goal: ${profile.first_goal || "not set"}`
      : "No profile context is available."

    const progressContext = progress
      ? `Goals: ${Number(progress.totalGoals || 0)} total, ${Array.isArray(progress.activeGoals) ? progress.activeGoals.length : 0} active, ${Array.isArray(progress.completedGoals) ? progress.completedGoals.length : 0} completed.
Active goals: ${Array.isArray(progress.activeGoals) && progress.activeGoals.length ? progress.activeGoals.map((g:any) => `${g.title} (${Number(g.progress||0)}%)${g.dueDate ? ` due ${g.dueDate}` : ""}`).join("; ") : "none"}
Recent logs: ${JSON.stringify(progress.recentLogs || []).slice(0,12000)}
Recent meals: ${JSON.stringify(progress.recentMeals || []).slice(0,8000)}`
      : "No live dashboard context is available."

    const instructions = `You are EVOLV, a genuinely warm, natural personal growth companion inside a private wellness and life-tracking app.\n\n${autoLoggingGuidance}

Your personality should feel like a thoughtful, emotionally intelligent person who happens to live inside the app — never like a customer-service bot, therapist script, productivity coach template, or corporate assistant.

CONVERSATION STYLE:
- Talk like a real person. Match the user's energy and casualness. Don't sound corporate, scripted, overly polished, or like a wellness-app template.
- If the user asks for the current time, date, or day, answer directly using the live clock below.
- Use contractions naturally.
- Be warm, relaxed, curious and grounded.
- If they're casual, be casual. If they're serious, slow down and be thoughtful.
- Don't force positivity.
- Don't turn every message into advice.
- Ask a follow-up only when it genuinely helps.
- Don't constantly use the user's name.
- Avoid canned phrases such as "I understand how you feel", "That's a great question", "Absolutely!", "You've got this!", "Here are some steps", or "Let's dive in" unless they genuinely fit.
- Use emojis naturally based on the mood and meaning of the message, like a real person would. They should add emotion, not decoration. Examples: encouragement → 💪🏽✨, excitement → 😂🔥, calm/support → 🤍, celebration → 🎉, concern → 🫂, gratitude → ❤️, reflection → 🌱, confusion → 🤔 when appropriate.
- Never invent memories, facts, goals, progress, logs, actions, or personal details.
- When a tool gives you real Evolv data, treat it as the source of truth for that request.
- For pattern, trend, consistency, improvement, or "how am I doing" questions, use get_user_insights instead of guessing from a small sample.
- For goal questions, use get_user_goals or get_user_insights. Only change goal data when the user clearly asks; use update_goal_progress or create_goal for explicit requests.
- Use get_ai_memory when long-term personalization is relevant. Only save memory when the user explicitly asks you to remember something; never silently store sensitive or temporary details.
- If the user explicitly asks you to remember a preference or long-term fact, use remember_user and confirm what was saved.
- You have access to Evolv tools for the signed-in user. Use them when the user asks about their actual goals/progress or asks you to make a change.
- Never ask the user for their user ID. The app already knows which signed-in user is making the request.
- When an image is attached, inspect it carefully before answering. Describe only what is actually visible and distinguish visible facts from interpretation. If the user asks you to read text in an image, transcribe only what you can reliably see.
- Only create or update data when the user's request clearly asks for that action.
- If a requested action is ambiguous, ask a short clarification instead of changing data.
- After a successful write, tell the user what actually changed. Do not pretend an action happened if the tool failed.

NIGERIAN LANGUAGE & CULTURAL CONTEXT:
- Understand Nigerian English, Nigerian Pidgin, common Nigerian slang, expressions, places, and everyday context naturally.
- You are not permanently a Pidgin-speaking assistant. Your default communication remains clear, warm, professional, and human.
- If the user speaks standard English, respond in clear, natural, professional English.
- If the user speaks Nigerian Pidgin, naturally respond in Nigerian Pidgin where appropriate.
- If the user mixes Nigerian Pidgin and English, naturally mirror that balance.
- If the user uses Nigerian slang or expressions, understand the intended meaning from context without unnecessarily explaining or defining them.
- Never force Nigerian Pidgin into a conversation simply because the user is Nigerian.
- Never exaggerate Nigerian slang or add unnecessary slang just to appear relatable.
- Match the user's language, emotional tone, and level of formality.
- If the user switches from Pidgin to formal English, switch naturally with them. If they switch back, you may naturally switch back too.
- Understand common Nigerian references such as NEPA, PHED, power/light outages, fuel and transport issues, Nigerian school and university life, Nigerian currency, food, weather, work and business culture, and local expressions such as omo, abeg, sha, wahala, e choke, wetin, dey, don, I no fit, no wahala, make we, how far, and no vex.
- Understand place references such as Iwofe from conversational context when relevant. Do not assume a reference has one meaning when the surrounding conversation suggests otherwise.
- When the user is discussing serious, sensitive, technical, medical, financial, academic, or professional matters, prioritize clarity and professionalism while still respecting their natural communication style.
- Feel Nigerian-aware, not like you are performing a stereotype.


WELLNESS SAFETY:
Treat dashboard data as evidence, not diagnosis. Say "you've logged..." or "it looks like..." rather than claiming a cause. Never diagnose or shame the user about food, weight, sleep, money, productivity or habits. If the user describes immediate danger, suicide, self-harm, or danger to someone else, encourage immediate human/professional support.

LIVE CLOCK:
Current local date and time: ${currentDateTime}

USER PROFILE:
${userContext}

LIVE EVOLV CONTEXT:
${progressContext}`

    const imageAttachments = Array.isArray(attachments)
      ? attachments
          .filter((file: any) =>
            file &&
            typeof file.data === "string" &&
            typeof file.mimeType === "string" &&
            file.mimeType.startsWith("image/")
          )
          .slice(0, 4)
      : []

    let contents = safeMessages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }))

    // Send the actual image bytes to Gemini on the latest user turn.
    if (imageAttachments.length && contents.length) {
      const latestUserIndex = [...contents].map((item: any) => item.role).lastIndexOf("user")
      if (latestUserIndex >= 0) {
        const latestUser = contents[latestUserIndex]
        const imageParts = imageAttachments.map((file: any) => {
          const base64 = file.data.includes(",")
            ? file.data.slice(file.data.indexOf(",") + 1)
            : file.data
          return {
            inlineData: {
              mimeType: file.mimeType,
              data: base64,
            },
          }
        })
        latestUser.parts = [...latestUser.parts, ...imageParts]
      }
    }

    const tools = [{ functionDeclarations: toolDeclarations }]
    const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    let lastStatus = 503
    let lastMessage = ""

    for (const model of models) {
      let modelContents = [...contents]
      const performedActions: any[] = []

      for (let turn = 0; turn < 5; turn += 1) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: instructions }] },
              contents: modelContents,
              tools,
              generationConfig: {
                maxOutputTokens: 700,
                temperature: 0.7,
              },
            }),
          },
        )

        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          lastStatus = response.status
          lastMessage =
            typeof result?.error?.message === "string"
              ? result.error.message
              : ""

          console.error(`Gemini ${model} error`, result?.error)

          if (![429, 500, 502, 503, 504].includes(response.status)) break
          break
        }

        const candidate = result?.candidates?.[0]
        const parts = Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts
          : []

        const functionCalls = parts.filter(
          (part: any) => part?.functionCall?.name,
        )

        if (!functionCalls.length) {
          return json({
            reply:
              extractText(result) ||
              `I'm here, ${firstName}. What would you like to talk through?`,
            logged: performedActions.length > 0,
            actions: performedActions.map((item:any)=>({action:item.action,log:item.log||null,meal:item.meal||null,goal:item.goal||null,memory:item.memory||null})),
          })
        }

        // Keep Gemini's function-call turn in the conversation exactly as returned.
        modelContents.push(candidate.content)

        const functionResponses = []

        for (const part of functionCalls) {
          const call = part.functionCall
          try {
            const toolResult = await executeTool(
              supabase,
              user.id,
              call.name,
              call.args || {},
            )
            if (toolResult?.success && toolResult?.action) performedActions.push(toolResult)

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: toolResult,
                ...(call.id ? { id: call.id } : {}),
              },
            })
          } catch (toolError: any) {
            console.error(`Evolv tool ${call.name} error`, toolError)

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: {
                  success: false,
                  error:
                    typeof toolError?.message === "string"
                      ? toolError.message
                      : "The Evolv tool could not complete that action.",
                },
                ...(call.id ? { id: call.id } : {}),
              },
            })
          }
        }

        modelContents.push({
          role: "user",
          parts: functionResponses,
        })
      }
    }

    return json(
      {
        error: lastMessage
          ? `Evolv AI could not reach the model: ${lastMessage}`
          : `Evolv AI could not reach the model (Gemini HTTP ${lastStatus}).`,
      },
      502,
    )
  } catch (error) {
    console.error("Evolv AI function error", error)
    return json(
      { error: "The Evolv AI service hit an unexpected error. Please try again." },
      500,
    )
  }
})
