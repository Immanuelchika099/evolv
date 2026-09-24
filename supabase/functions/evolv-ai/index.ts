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

const toolDeclarations = [
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
  {
    name: "log_metric",
    description: "Logs a value to one of the user's Evolv metrics. Use when the user clearly asks to log, record, track, or save something such as sleep, water, exercise, steps, learning, focus, mood, stress, energy, spending, income, savings, weight, or another available metric.",
    parameters: { type: "object", properties: {
      metric: { type: "string", description: "Metric name, key, or title." },
      value: { type: "number", description: "Numeric value to log." },
      note: { type: "string", description: "Optional note." },
      date: { type: "string", description: "Optional YYYY-MM-DD date. Defaults to today." },
    }, required: ["metric", "value"] },
  },
  {
    name: "log_meal",
    description: "Logs a meal for the signed-in user. Use when the user clearly asks to log or record breakfast, lunch, dinner, or a snack.",
    parameters: { type: "object", properties: {
      meal_type: { type: "string", description: "breakfast, lunch, dinner, or snack." },
      description: { type: "string", description: "What the user ate." },
      calories: { type: "number" }, protein_g: { type: "number" }, carbs_g: { type: "number" }, fat_g: { type: "number" }, water_ml: { type: "number" },
      note: { type: "string" },
    }, required: ["meal_type", "description"] },
  },
  {
    name: "log_reflection",
    description: "Logs the user's daily reflection. Use when the user clearly asks to record how they felt, their mood, or a reflection.",
    parameters: { type: "object", properties: {
      mood: { type: "integer", description: "Mood from 1 to 5." },
      day_feeling: { type: "string" }, note: { type: "string" },
      date: { type: "string", description: "Optional YYYY-MM-DD date." },
    } },
  },
  {
    name: "checkin_goal",
    description: "Records a check-in note on one of the user's goals.",
    parameters: { type: "object", properties: {
      goal_id: { type: "string" }, note: { type: "string" },
      date: { type: "string", description: "Optional YYYY-MM-DD date." },
    }, required: ["goal_id"] },
  },
]

async function executeTool(
  supabase: any,
  userId: string,
  name: string,
  args: Record<string, any>,
) {
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

  if (name === "log_metric") {
    const metricName = typeof args.metric === "string" ? args.metric.trim() : "";
    const value = Number(args.value);
    if (!metricName) throw new Error("A metric name is required.");
    if (!Number.isFinite(value) || value < 0) throw new Error("A valid non-negative numeric value is required.");
    const { data: definitions, error: definitionError } = await supabase.from("metric_definitions").select("id,title,metric_key,slug,name,unit,input_type").eq("is_active", true).limit(100);
    if (definitionError) throw definitionError;
    const needle = metricName.toLowerCase();
    const metric = (definitions || []).find((item:any) => [item.title,item.metric_key,item.slug,item.name].filter(Boolean).some((v:string) => v.toLowerCase() === needle))
      || (definitions || []).find((item:any) => [item.title,item.metric_key,item.slug,item.name].filter(Boolean).some((v:string) => v.toLowerCase().includes(needle) || needle.includes(v.toLowerCase())));
    if (!metric) throw new Error("I couldn't find an Evolv metric called " + metricName + ".");
    if (metric.input_type === "scale" && (value < 1 || value > 5)) throw new Error(metric.title + " must be between 1 and 5.");
    const date = typeof args.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("metric_logs").insert({user_id:userId,metric_id:metric.id,logged_for:date,value_numeric:value,value,unit:metric.unit || null,note:typeof args.note==="string"?args.note.trim().slice(0,1000)||null:null}).select("id,metric_id,logged_for,value_numeric,value,unit,note").single();
    if (error) throw error;
    return {success:true,metric:metric.title,log:data};
  }

  if (name === "log_meal") {
    const mealType = typeof args.meal_type === "string" ? args.meal_type.toLowerCase().trim() : "";
    const description = typeof args.description === "string" ? args.description.trim() : "";
    if (!["breakfast","lunch","dinner","snack"].includes(mealType)) throw new Error("Meal type must be breakfast, lunch, dinner, or snack.");
    if (!description) throw new Error("A meal description is required.");
    const num=(v:any)=>v==null||v===""?null:Number(v);
    const calories=num(args.calories),protein=num(args.protein_g),carbs=num(args.carbs_g),fat=num(args.fat_g),water=num(args.water_ml);
    for (const v of [calories,protein,carbs,fat,water]) if(v!==null&&(!Number.isFinite(v)||v<0)) throw new Error("Meal numbers must be valid non-negative values.");
    const {data,error}=await supabase.from("meal_logs").insert({user_id:userId,meal_type:mealType,description:description.slice(0,2000),calories,protein_g:protein,carbs_g:carbs,fat_g:fat,water_ml:water,note:typeof args.note==="string"?args.note.trim().slice(0,1000)||null:null}).select("id,meal_type,eaten_at,description,calories,protein_g,carbs_g,fat_g,water_ml,note").single();
    if(error) throw error;
    return {success:true,meal:data};
  }

  if (name === "log_reflection") {
    const mood=args.mood==null||args.mood===""?null:Number(args.mood);
    if(mood!==null&&(!Number.isInteger(mood)||mood<1||mood>5)) throw new Error("Mood must be a whole number from 1 to 5.");
    const date=typeof args.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(args.date)?args.date:new Date().toISOString().slice(0,10);
    const {data:existing,error:existingError}=await supabase.from("daily_reflections").select("id").eq("user_id",userId).eq("reflection_date",date).maybeSingle();
    if(existingError) throw existingError;
    const payload={user_id:userId,reflection_date:date,mood,day_feeling:typeof args.day_feeling==="string"?args.day_feeling.trim().slice(0,500)||null:null,note:typeof args.note==="string"?args.note.trim().slice(0,2000)||null:null,updated_at:new Date().toISOString()};
    const query=existing?supabase.from("daily_reflections").update(payload).eq("id",existing.id).eq("user_id",userId):supabase.from("daily_reflections").insert(payload);
    const {data,error}=await query.select("id,reflection_date,mood,day_feeling,note,updated_at").single();
    if(error) throw error;
    return {success:true,reflection:data};
  }

  if (name === "checkin_goal") {
    const goalId=typeof args.goal_id==="string"?args.goal_id:"";
    if(!goalId) throw new Error("A goal ID is required.");
    const date=typeof args.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(args.date)?args.date:new Date().toISOString().slice(0,10);
    const {data:goal,error:goalError}=await supabase.from("goals").select("id,title").eq("id",goalId).eq("user_id",userId).maybeSingle();
    if(goalError) throw goalError;
    if(!goal) throw new Error("That goal does not belong to the signed-in user.");
    const {data,error}=await supabase.from("goal_checkins").insert({goal_id:goalId,user_id:userId,checkin_date:date,note:typeof args.note==="string"?args.note.trim().slice(0,2000)||null:null}).select("id,goal_id,checkin_date,note,created_at").single();
    if(error) throw error;
    return {success:true,goal,checkin:data};
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authorization = req.headers.get("Authorization")
    if (!authorization) return json({ error: "Unauthorized" }, 401)

    const { messages, profile, progress } = await req.json()

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

    const instructions = `You are EVOLV, a genuinely warm, natural personal growth companion inside a private wellness and life-tracking app.

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
- Use emojis only when they genuinely fit. Usually 0–2 emojis.
- Never invent memories, facts, goals, progress, logs, actions, or personal details.
- When a tool gives you real Evolv data, treat it as the source of truth for that request.
- You have access to Evolv tools for the signed-in user. Use them when the user asks about their actual goals/progress or asks you to make a change.
- Never ask the user for their user ID. The app already knows which signed-in user is making the request.
- Only create or update data when the user's request clearly asks for that action.
- If a requested action is ambiguous, ask a short clarification instead of changing data.
- After a successful write, tell the user what actually changed. Do not pretend an action happened if the tool failed.

WELLNESS SAFETY:
Treat dashboard data as evidence, not diagnosis. Say "you've logged..." or "it looks like..." rather than claiming a cause. Never diagnose or shame the user about food, weight, sleep, money, productivity or habits. If the user describes immediate danger, suicide, self-harm, or danger to someone else, encourage immediate human/professional support.

LIVE CLOCK:
Current local date and time: ${currentDateTime}

USER PROFILE:
${userContext}

LIVE EVOLV CONTEXT:
${progressContext}`

    let contents = safeMessages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }))

    const tools = [{ functionDeclarations: toolDeclarations }]
    const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    let lastStatus = 503
    let lastMessage = ""
    let preparedCalendarEvent: any = null

    for (const model of models) {
      let modelContents = [...contents]

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
            ...(preparedCalendarEvent ? { calendarEvent: preparedCalendarEvent } : {}),
            reply:
              extractText(result) ||
              `I'm here, ${firstName}. What would you like to talk through?`,
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

            if (call.name === "prepare_calendar_event" && toolResult?.requires_confirmation && toolResult?.event) {
              preparedCalendarEvent = toolResult.event
            }

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
