import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function parseInsight(reply) {
  const text = String(reply || '').trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    if (parsed.insufficient_data) return { insufficient: true, message: String(parsed.message || '').slice(0, 250) }
    const normalize = item => {
      if (!item?.title || !item?.observation || !item?.suggestion) return null
      return {
        category: String(item.category || 'personal').slice(0, 40),
        title: String(item.title).trim().slice(0, 70),
        observation: String(item.observation).trim().slice(0, 220),
        suggestion: String(item.suggestion).trim().slice(0, 160),
        evidence: Array.isArray(item.evidence) ? item.evidence.slice(0, 2).map(value => String(value).slice(0, 100)) : [],
      }
    }
    if (Array.isArray(parsed.insights)) {
      const insights = parsed.insights.map(normalize).filter(Boolean).slice(0, 3)
      return insights.length ? { insights } : null
    }
    return normalize(parsed)
  } catch { return null }
}

function buildFallbackInsight(reply) {
  const text = String(reply || '').trim().replace(/^#+\s*/gm, '').slice(0, 900)
  if (!text || /not enough (information|data)|no (relevant )?(records|data|conversations)/i.test(text)) return null
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length < 2) return null
  return {
    category: 'personal',
    title: 'A thought for today',
    observation: sentences.slice(0, Math.min(2, sentences.length)).join(' ').slice(0, 700),
    suggestion: sentences.slice(2).join(' ').replace(/^(suggestion|try today|next step):\s*/i, '').slice(0, 350) || 'Take a moment to reflect on whether this feels relevant to you.',
    evidence: [],
  }
}

export default function DailyAIInsight({ dataLoading = false, name, defs = [], logs = [], meals = [], goals = [], valueText, goTo }) {
  const [insight, setInsight] = useState(null)
  const [insights, setInsights] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState('')
  const loadedOnce = useRef(false)

  async function generateInsight(options = {}) {
    const force = Boolean(options.force)
    setRefreshing(true)
    setStatus('')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const session = sessionData && sessionData.session
      const userId = session && session.user && session.user.id
      if (sessionError || !session || !userId) {
        setStatus('Sign in again to build a personal insight.')
        return
      }

      const today = localDateKey()
      const cacheKey = 'evolv-ai-insight-stack:' + userId + ':' + today
      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null')
          if (Array.isArray(cached) && cached.length) {
            setInsights(cached)
            setActiveIndex(0)
            setInsight(cached[0])
            return
          }
        } catch {}
      }

      // Keep the insight genuinely empty until the user has logged something.
      // Conversations can add context, but must not manufacture an insight on their own.
      if (!(logs || []).length && !(meals || []).length) {
        setInsight(null)
        setStatus('')
        return
      }

      if (!force) {
        const { data: saved, error: savedError } = await supabase
          .from('ai_daily_insights')
          .select('id,insight_date,category,title,observation,suggestion,evidence,generated_at')
          .eq('user_id', userId)
          .eq('insight_date', today)
          .maybeSingle()
        if (!savedError && saved) setInsight(saved)
      }

      const since = new Date()
      since.setDate(since.getDate() - 30)
      const previousSince = new Date()
      previousSince.setDate(previousSince.getDate() - 7)
      const [{ data: conversationRows, error: conversationError }, { data: previousRows }] = await Promise.all([
        supabase.from('ai_messages')
          .select('role,content,created_at')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(36),
        supabase.from('ai_daily_insights')
          .select('insight_date,title,observation,suggestion')
          .eq('user_id', userId)
          .gte('insight_date', localDateKey(previousSince))
          .lt('insight_date', today)
          .order('insight_date', { ascending: false })
          .limit(1),
      ])
      if (conversationError) console.warn('Daily insight conversation context unavailable:', conversationError)

      const conversations = (conversationRows || [])
        .filter(row => ['user', 'assistant'].includes(row.role) && typeof row.content === 'string' && row.content.trim())
        .slice(0, 4)
        .reverse()
        .map(row => ({ role: row.role, content: row.content.replace(/\s+/g, ' ').trim().slice(0, 180) }))

      const recentLogs = (logs || []).slice(0, 5).map(entry => {
        const definition = defs.find(item => String(item.id) === String(entry.metric_id))
        return {
          date: entry.logged_for || entry.logged_at || entry.created_at || null,
          category: (definition && (definition.name || definition.slug)) || 'check-in',
          value: definition && typeof valueText === 'function' ? valueText(entry, definition) : String(entry.value_numeric ?? entry.value ?? ''),
          note: String(entry.note || '').slice(0, 90),
        }
      })
      const recentMeals = (meals || []).slice(0, 3).map(meal => ({
        date: meal.logged_at || meal.created_at || null,
        type: meal.meal_type || 'meal',
        description: String(meal.description || '').slice(0, 90),
      }))
      const activeGoals = (goals || []).filter(goal => goal.status === 'active').slice(0, 3).map(goal => ({
        title: goal.title,
        progress: Number(goal.progress || 0),
        description: String(goal.description || '').slice(0, 90),
      }))

      if (!recentLogs.length && !recentMeals.length) {
        setInsight(null)
        setStatus('Your insight will appear here after your first check-in.')
        return
      }

      const promptParts = [
        'Create THREE distinct, short, evidence-based EVOLV insight cards for this user from the data below. They will rotate in a small dashboard carousel.',
        'Use only supplied context or real data returned by get_user_insights; call that tool when enough context exists. Never invent details, infer missing habits, or claim a trend from one entry.',
        'Make each insight meaningfully different, grounded in available records or conversation, and avoid generic encouragement. Reflect feelings carefully; never diagnose mental health or quote sensitive details unsolicited. State uncertainty when needed.',
        'Each title should be 2–5 words. Each observation must be one concise sentence (ideally under 16 words). Each suggestion must be one short action (ideally under 10 words). Keep evidence optional and very short.',
        'Return ONLY JSON: {"insights":[{"category":"sleep|mood|nutrition|money|career|routine|personal","title":"short title","observation":"one grounded sentence","suggestion":"one small action","evidence":["short factual signal"]}, ... exactly 3 distinct items]}. If evidence is insufficient return {"insufficient_data":true,"message":"one kind sentence inviting more check-ins"}.',
        'First name: ' + (String(name || '').trim().split(/\s+/)[0] || 'there'),
        'Local date: ' + today,
        'Recent conversations: ' + (conversations.length ? conversations.map(item => item.role + ': ' + item.content).join('\n') : 'No recent AI conversations.'),
        'Recent check-ins: ' + JSON.stringify(recentLogs),
        'Recent meals: ' + JSON.stringify(recentMeals),
        'Active goals: ' + JSON.stringify(activeGoals),
        'Previous insight: ' + (previousRows && previousRows[0] ? JSON.stringify({ title: previousRows[0].title, observation: String(previousRows[0].observation || '').slice(0, 180), suggestion: String(previousRows[0].suggestion || '').slice(0, 100) }) : 'None recently.'),
      ]
      const userPrompt = promptParts.join('\n')

      const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/evolv-ai', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + session.access_token,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userPrompt }],
          profile: { first_name: String(name || '').trim().split(/\s+/)[0] || 'there', timezone: 'Africa/Lagos' },
          progress: { totalGoals: activeGoals.length, activeGoals, recentLogs, recentMeals },
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.reply) throw new Error(result.error || 'Could not generate today’s insight.')

      const parsed = parseInsight(result.reply)
      if (parsed && parsed.insufficient) {
        setInsight(null)
        setInsights([])
        setStatus(parsed.message || 'Keep checking in, and I’ll look for a useful pattern when there is enough to go on.')
        return
      }
      const generatedInsights = parsed?.insights || (parsed && parsed.title ? [parsed] : [buildFallbackInsight(result.reply)].filter(Boolean))
      if (!generatedInsights.length) {
        setInsight(null)
        setInsights([])
        setStatus('I need a little more to go on. Keep checking in or chatting, and I’ll look for a useful pattern.')
        return
      }
      const generated = generatedInsights[0]
      const row = {
        user_id: userId,
        insight_date: today,
        category: generated.category,
        title: generated.title,
        observation: generated.observation,
        suggestion: generated.suggestion,
        evidence: generated.evidence,
        source_hash: null,
        generated_at: new Date().toISOString(),
      }
      const { data: saved, error: saveError } = await supabase
        .from('ai_daily_insights')
        .upsert(row, { onConflict: 'user_id,insight_date' })
        .select('id,insight_date,category,title,observation,suggestion,evidence,generated_at')
        .single()
      if (saveError) throw saveError
      const stack = [saved, ...generatedInsights.slice(1)]
      try { localStorage.setItem(cacheKey, JSON.stringify(stack)) } catch {}
      setInsights(stack)
      setActiveIndex(0)
      setInsight(saved)
    } catch (error) {
      console.error('Daily AI insight failed:', error)
      setStatus('Your insight couldn’t refresh just now. Try again in a moment.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateInsightRef = useRef(generateInsight)
  generateInsightRef.current = generateInsight

  useEffect(() => {
    if (dataLoading || loadedOnce.current) return
    loadedOnce.current = true
    generateInsightRef.current()
  }, [dataLoading])

  useEffect(() => {
    if (loading || insights.length < 2) return
    const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % insights.length), 10000)
    return () => window.clearInterval(timer)
  }, [loading, insights.length])

  useEffect(() => {
    if (insights.length) setInsight(insights[activeIndex] || insights[0])
  }, [activeIndex, insights])

  function openConversation() {
    try {
      localStorage.setItem('evolv-ai-pending-prompt',
        "Help me explore today's personal insight: " + (insight?.title || 'a pattern in my life') + '. ' + (insight?.observation || '') + ' Suggested step: ' + (insight?.suggestion || '') + ' Use my actual EVOLV records and conversations, explain uncertainty, and help me decide whether this suggestion fits.')
    } catch {}
    goTo?.('ai')
  }

  return (
    <section className="calm-insights-section" aria-labelledby="calm-insights-title">
      <div className="calm-focus-heading">
        <div>
          <span className="calm-insights-eyebrow"><Sparkles size={13} /> PERSONALIZED REFLECTIONS</span>
          <h2 id="calm-insights-title">AI insights</h2>
        </div>
        {insight && <button type="button" onClick={openConversation} aria-label="Talk through today's insight"><ArrowRight size={18} /></button>}
      </div>
      <div className={`daily-ai-insight-stack${insights.length > 1 ? ' has-stack' : ''}`}>
      {insights.length > 1 && <><span className="daily-ai-insight-back daily-ai-insight-back-two" aria-hidden="true" /><span className="daily-ai-insight-back daily-ai-insight-back-one" aria-hidden="true" /></>}
      <article key={insight?.title || insight?.id || insight?.insight_date || (status ? "empty-status" : "empty")} className="daily-ai-insight-card" aria-live="polite">
        {loading ? (
          <div className="daily-ai-insight-state"><span className="daily-ai-insight-shimmer" /><span className="daily-ai-insight-shimmer short" /><small>Finding a useful pattern from your recent days…</small></div>
        ) : insight ? (
          <>
            <div className="daily-ai-insight-topline">
              <span className="daily-ai-insight-category">{insight.category || 'personal'} <span aria-hidden="true">/</span> REFLECTION</span>
              <span className="daily-ai-insight-index">{String(activeIndex + 1).padStart(2, '0')} <span>/</span> {String(insights.length || 1).padStart(2, '0')}</span>
            </div>
            <h3>{insight.title}</h3>
            <p className="daily-ai-insight-observation">{insight.observation}</p>
            <div className="daily-ai-insight-suggestion"><span>A SMALL NEXT STEP</span><p>{insight.suggestion}</p></div>
            <div className="daily-ai-insight-footer">
              <button type="button" className="daily-ai-insight-action" onClick={openConversation}>Explore insight <ArrowUpRight size={15} /></button>
              {insights.length > 1 && <div className="daily-ai-insight-dots" aria-label={`Insight ${activeIndex + 1} of ${insights.length}`}>{insights.map((item, index) => <span key={item.title + index} className={index === activeIndex ? 'is-active' : ''} />)}</div>}
            </div>
          </>
        ) : (
          <div className="daily-ai-insight-state">
            <Sparkles size={20} />
            <p>{status || 'Your insight will appear when there is something useful to notice.'}</p>
            <div className="daily-ai-insight-state-actions">
              <button type="button" className="daily-ai-insight-action" onClick={() => generateInsight({ force: true })} disabled={refreshing}>
                <RefreshCw size={14} className={refreshing ? 'daily-ai-spin' : ''} /> Try again
              </button>
              <button type="button" className="daily-ai-insight-text-action" onClick={openConversation}>Chat with Evolv <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </article>
      </div>
    </section>
  )
}
