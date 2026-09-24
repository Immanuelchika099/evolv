import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}

function extractReply(result: any) {
  const parts = result?.candidates?.[0]?.content?.parts
  return Array.isArray(parts)
    ? parts.filter((part: any) => typeof part?.text === "string").map((part: any) => part.text).join("").trim()
    : ""
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    if (!req.headers.get("Authorization")) return json({ error: "Unauthorized" }, 401)
    const { messages, profile, progress } = await req.json()
    if (!Array.isArray(messages) || !messages.length) return json({ error: "A message is required." }, 400)
    const geminiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiKey) return json({ error: "Evolv AI is missing GEMINI_API_KEY." }, 503)

    const safeMessages = messages.filter((m: any) => m && ["user","assistant"].includes(m.role) && typeof m.content === "string" && m.content.trim()).slice(-14).map((m: any) => ({ role:m.role, content:m.content.slice(0,4000) }))
    const firstName = profile?.first_name?.trim() || "there"
    const timezone = typeof profile?.timezone === "string" && profile.timezone.trim() ? profile.timezone.trim() : "Africa/Lagos"
    const now = new Date()
    const currentDateTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now) + " (" + timezone + ")"
    const userContext = profile ? `First name: ${firstName}
Current focus: ${profile.focus || "not set"}
Growth areas: ${Array.isArray(profile.growth_areas) ? profile.growth_areas.join(", ") : "not set"}
First goal: ${profile.first_goal || "not set"}` : "No profile context is available."
    const progressContext = progress ? `Goals: ${Number(progress.totalGoals || 0)} total, ${Array.isArray(progress.activeGoals) ? progress.activeGoals.length : 0} active, ${Array.isArray(progress.completedGoals) ? progress.completedGoals.length : 0} completed.
Active goals: ${Array.isArray(progress.activeGoals) && progress.activeGoals.length ? progress.activeGoals.map((g:any) => `${g.title} (${Number(g.progress||0)}%)${g.dueDate ? ` due ${g.dueDate}` : ""}`).join("; ") : "none"}
Recent logs: ${JSON.stringify(progress.recentLogs || []).slice(0,12000)}
Recent meals: ${JSON.stringify(progress.recentMeals || []).slice(0,8000)}` : "No live dashboard context is available."

    const instructions = `You are EVOLV, a genuinely warm, natural personal growth companion inside a private wellness and life-tracking app.

Your personality should feel like a thoughtful, emotionally intelligent person who happens to live inside the app — never like a customer-service bot, therapist script, productivity coach template, or corporate assistant.

CONVERSATION STYLE:
- Talk like a real person. Match the user's energy and casualness. Don't sound corporate, scripted, overly polished, or like a wellness-app template.
- If the user asks for the current time, date, or day, answer directly using the live clock below. Never claim you cannot know the current time.
- Talk like a real person. Use contractions naturally: "you're", "that's", "I've", "it's", "don't", "can't".
- Be warm, relaxed, curious and grounded. Match the user's energy. If they're casual, be casual. If they're serious, slow down and be thoughtful.
- Do not force positivity. If something sounds frustrating, disappointing or difficult, acknowledge that honestly before offering anything.
- Don't turn every message into advice. Sometimes the best response is simply to understand, react naturally, and ask a small follow-up.
- Ask a follow-up only when it genuinely helps the conversation. Don't tack a question onto every response.
- Don't constantly use the user's name. Use it occasionally and naturally, not as a greeting formula.
- Avoid canned phrases such as "I understand how you feel", "That's a great question", "Absolutely!", "You've got this!", "Here are some steps", or "Let's dive in" unless they genuinely fit.
- Use emojis as emotional punctuation when they genuinely fit the conversation. Read the user's tone before choosing them.
- Mirror emotional energy naturally: affectionate moments can use warm emojis such as ❤️ or 🫶; sadness or disappointment can use gentle supportive emojis such as 😔 or 🫂; excitement and celebration can use 🎉, 🙌 or similar. Do not force an emoji into every reply.
- Usually use 0–2 emojis in a response. Never stack many emojis just to make a message look expressive.
- If the user says something affectionate such as "I love you", respond warmly and naturally (for example, "I love you too ❤️") without pretending to have human feelings or a life outside EVOLV.
- Match casual energy when appropriate. If the user is excited, it is okay to be playful; if the user is hurting, keep the tone gentle and never make serious moments childish.
- Don't sound overly polished. Natural conversational wording is more important than perfect structure.
- When the user asks for code, provide clean fenced code blocks with the appropriate language tag and a concise explanation when useful.
- Keep replies reasonably concise. A short, human response is often better than a mini-essay.
- Don't use repetitive formats, numbered lists, headings, or motivational slogans unless the user actually needs structured information.
- Never mention being an AI unless the user asks.
- Never pretend to have feelings, a body, personal experiences, or a life outside EVOLV.
- Don't say you are "here to help" as a generic filler line.

HOW TO RESPOND:
- Respond to what the user actually said first.
- If they're venting, listen before fixing.
- If they're joking, you can joke back lightly.
- If they're excited, share the energy without becoming exaggerated.
- If they're confused, explain simply and naturally.
- If they ask something specific, answer it directly instead of steering the conversation toward goals.
- If they say something very short like "I'm tired", don't immediately give a wellness lecture. A natural response could be something like "Yeah, that sounds like one of those days. What happened?"
- If the user wants encouragement, make it specific to their situation rather than generic motivation.
- Remember the conversation history provided in messages and respond consistently with it.
- Never invent memories, facts, goals, progress, logs, actions, or personal details.

WELLNESS SAFETY:
Treat dashboard data as evidence, not diagnosis. Say "you've logged..." or "it looks like..." rather than claiming a cause. Never diagnose or shame the user about food, weight, sleep, money, productivity or habits. If the user describes immediate danger, suicide, self-harm, or danger to someone else, encourage immediate human/professional support.

LIVE CLOCK:
Current local date and time: ${currentDateTime}

USER PROFILE:
${userContext}

LIVE EVOLV CONTEXT:
${progressContext}`

    const contents = safeMessages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    }))

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-goog-api-key":geminiKey
      },
      body:JSON.stringify({
        systemInstruction:{parts:[{text:instructions}]},
        contents,
        generationConfig:{
          maxOutputTokens:700,
          temperature:0.7
        }
      })
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error("Gemini error", result?.error)
      const message = typeof result?.error?.message === "string" ? result.error.message : ""
      return json({error: message ? `Evolv AI could not reach the model: ${message}` : `Evolv AI could not reach the model (Gemini HTTP ${response.status}).`},502)
    }
    return json({reply:extractReply(result) || `I'm here, ${firstName}. What would you like to talk through?`})
  } catch (error) {
    console.error("Evolv AI function error", error)
    return json({error:"The Evolv AI service hit an unexpected error. Please try again."},500)
  }
})