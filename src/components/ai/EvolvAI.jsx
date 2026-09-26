import { useEffect, useRef, useState } from 'react'
import {
  History, Plus, MoreHorizontal, X, Copy, Volume2, VolumeX, Share2,
  Check, ArrowUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function EvolvCalendarBridge({ event, onCancel, onAdded }) {
  if (!event) return null

  async function addEvent() {
    try {
      const payload = {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        notes: event.notes || '',
        location: event.location || '',
      }

      const plugin = window.Capacitor?.Plugins?.EvolvCalendar
      if (plugin?.createEvent) {
        await plugin.createEvent(payload)
        onAdded?.()
        return
      }

      if (window.webkit?.messageHandlers?.evolvCalendar?.postMessage) {
        window.webkit.messageHandlers.evolvCalendar.postMessage(payload)
        onAdded?.()
        return
      }

      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('The event time is invalid.')

      const pad = value => String(value).padStart(2, '0')
      const toIcsDate = date => (
        date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' +
        pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + 'Z'
      )
      const escapeIcs = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EVOLV//Calendar//EN','BEGIN:VEVENT',
        `UID:evolv-${Date.now()}@${window.location.hostname}`,
        `DTSTAMP:${toIcsDate(new Date())}`,`DTSTART:${toIcsDate(start)}`,`DTEND:${toIcsDate(end)}`,
        `SUMMARY:${escapeIcs(event.title)}`,
        ...(event.notes ? [`DESCRIPTION:${escapeIcs(event.notes)}`] : []),
        ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
        'END:VEVENT','END:VCALENDAR',
      ].join('\\r\\n')

      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${String(event.title || 'evolv-event').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'evolv-event'}.ics`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      onAdded?.()
    } catch (error) {
      console.error('EVOLV calendar event failed:', error)
    }
  }

  return (
    <div className="ai-calendar-confirm" role="dialog" aria-label="Confirm calendar event">
      <div className="ai-calendar-confirm-copy">
        <span className="ai-calendar-label">ADD TO CALENDAR</span>
        <strong>{event.title}</strong>
        <span>{event.displayTime}</span>
        {event.notes ? <small>{event.notes}</small> : null}
      </div>
      <div className="ai-calendar-confirm-actions">
        <button type="button" onClick={onCancel}>Not now</button>
        <button type="button" className="ai-calendar-add" onClick={addEvent}>Add to Calendar</button>
      </div>
    </div>
  )
}

function EvolvAI({ profile, goals = [], checkins = [], momentum = 0, logs = [], meals = [], definitions = [] }) {
  const firstName = profile?.first_name || 'there'
  const [chatId, setChatId] = useState(() => {
    try {
      return localStorage.getItem('evolv-ai-chat-id') || crypto.randomUUID()
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
  })
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${firstName}. What’s on your mind? We can take it one thing at a time.` },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [typing, setTyping] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState('')
  const [speakingMessage, setSpeakingMessage] = useState('')
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pressedChatId, setPressedChatId] = useState('')
  const historyPressTimerRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('evolv-ai-chat-id', chatId)
    let mounted = true
    async function loadMessages() {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return
      const { data } = await supabase
        .from('ai_messages')
        .select('id,role,content')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (mounted) {
        setMessages(data?.length ? data : [{ role: 'assistant', content: `Hey ${firstName}. What’s on your mind? We can take it one thing at a time.` }])
      }
    }
    loadMessages()
    return () => { mounted = false }
  }, [chatId, firstName])

  async function loadChatHistory() {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return

    const [{ data, error }, { data: titles, error: titleError }] = await Promise.all([
      supabase
        .from('ai_messages')
        .select('id,chat_id,role,content,created_at')
        .eq('user_id', userId)
        .not('chat_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('ai_chat_titles')
        .select('chat_id,title,updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(500),
    ])

    if (error) {
      console.error('EVOLV AI history load failed:', error)
      setError('Could not load your chat history. Please try again.')
      return
    }

    if (titleError) console.error('EVOLV AI chat titles load failed:', titleError)

    const titleMap = new Map((titles || []).map(item => [item.chat_id, item.title]))
    const grouped = new Map()

    ;(data || []).forEach(message => {
      if (!message.chat_id) return
      const current = grouped.get(message.chat_id)
      if (!current) {
        grouped.set(message.chat_id, {
          chatId: message.chat_id,
          updatedAt: message.created_at,
          preview: message.role === 'user' ? message.content : '',
          title: titleMap.get(message.chat_id) || '',
        })
      } else if (!current.preview && message.role === 'user') {
        current.preview = message.content
      }
    })

    setChatHistory(
      Array.from(grouped.values()).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      ),
    )
  }

  async function ensureChatTitle(conversation) {
    if (!chatId || !Array.isArray(conversation) || !conversation.length) return

    const { data: existing, error: existingError } = await supabase
      .from('ai_chat_titles')
      .select('chat_id,title')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .eq('chat_id', chatId)
      .maybeSingle()

    if (existingError) {
      console.error('EVOLV AI chat title lookup failed:', existingError)
      return
    }

    if (existing?.title) return

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolv-ai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_chat_title',
          messages: conversation,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.title) {
        console.error('EVOLV AI chat title generation failed:', result.error || response.status)
        return
      }

      const userId = sessionData?.session?.user?.id
      if (!userId) return

      const { error } = await supabase.from('ai_chat_titles').upsert({
        chat_id: chatId,
        user_id: userId,
        title: String(result.title).trim().slice(0, 80),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'chat_id' })

      if (error) {
        console.error('EVOLV AI chat title save failed:', error)
        return
      }

      setChatHistory(current => {
        const found = current.some(item => item.chatId === chatId)
        if (!found) return current
        return current.map(item => item.chatId === chatId ? { ...item, title: String(result.title).trim().slice(0, 80) } : item)
      })
    } catch (titleError) {
      console.error('EVOLV AI chat title request failed:', titleError)
    }
  }

  async function openChatHistory() {
    setError('')
    await loadChatHistory()
    setHistoryOpen(true)
  }

  function selectChatFromHistory(id) {
    if (pressedChatId === id) {
      setPressedChatId('')
      return
    }
    setHistoryOpen(false)
    setPressedChatId('')
    setError('')
    setChatId(id)
  }

  function beginHistoryPress(id) {
    window.clearTimeout(historyPressTimerRef.current)
    historyPressTimerRef.current = window.setTimeout(() => {
      setPressedChatId(id)
    }, 520)
  }

  function endHistoryPress() {
    window.clearTimeout(historyPressTimerRef.current)
  }

  async function deleteChatFromHistory(id) {
    if (!id) return
    const confirmed = window.confirm('Delete this chat?')
    if (!confirmed) {
      setPressedChatId('')
      return
    }

    setError('')
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return

    const [{ error: messagesError }, { error: titleError }] = await Promise.all([
      supabase.from('ai_messages').delete().eq('user_id', userId).eq('chat_id', id),
      supabase.from('ai_chat_titles').delete().eq('user_id', userId).eq('chat_id', id),
    ])

    if (messagesError || titleError) {
      console.error('EVOLV AI chat deletion failed:', messagesError || titleError)
      setError('Could not delete that chat. Please try again.')
      return
    }

    setChatHistory(current => current.filter(chat => chat.chatId !== id))
    setPressedChatId('')
    if (chatId === id) startNewChat()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, typing])

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
  }, [])

  function startNewChat() {
    setHistoryOpen(false)
    window.speechSynthesis?.cancel()
    setSpeakingMessage('')
    setCopiedMessage('')
    setTyping(false)
    setSending(false)
    setError('')
    setPendingCalendarEvent(null)
    setInput('')
    try {
      setChatId(crypto.randomUUID())
    } catch {
      setChatId(`${Date.now()}-${Math.random().toString(36).slice(2)}`)
    }
    setMessages([
      { role: 'assistant', content: `Hey ${firstName}. What’s on your mind? We can take it one thing at a time.` },
    ])
    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 80)
  }

  async function copyMessage(content, key) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessage(key)
      window.setTimeout(() => setCopiedMessage(current => current === key ? '' : current), 1400)
    } catch {
      setError('Could not copy that message. Please try again.')
    }
  }

  function speakMessage(content, key) {
    if (!('speechSynthesis' in window)) {
      setError('Voice playback is not supported on this device/browser.')
      return
    }

    if (speakingMessage === key) {
      window.speechSynthesis.cancel()
      setSpeakingMessage('')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeakingMessage(key)
    utterance.onend = () => setSpeakingMessage(current => current === key ? '' : current)
    utterance.onerror = () => setSpeakingMessage(current => current === key ? '' : current)
    window.speechSynthesis.speak(utterance)
  }

  async function shareMessage(content, key) {
    try {
      if (navigator.share) {
        await navigator.share({ text: content })
        return
      }
      await navigator.clipboard.writeText(content)
      setCopiedMessage(key)
      window.setTimeout(() => setCopiedMessage(current => current === key ? '' : current), 1400)
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError('Could not share that message. Please try again.')
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    setTyping(false)
    setError('')

    const { data: authData } = await supabase.auth.getSession()
    const token = authData?.session?.access_token
    const userId = authData?.session?.user?.id

    if (!token || !userId) {
      setSending(false)
      setError('Your session has expired. Please sign in again.')
      return
    }

    await supabase.from('ai_messages').insert({ user_id: userId, chat_id: chatId, role: 'user', content: text })

    const metricById = Object.fromEntries(definitions.map(definition => [definition.id, definition]))
    const recentLogs = logs.slice(0, 40).map(log => {
      const definition = metricById[log.metric_id]
      return {
        metric: definition?.name || 'Metric',
        slug: definition?.slug || null,
        value: Number(log.value),
        unit: log.unit || definition?.unit || null,
        note: log.note || null,
        loggedAt: log.logged_at,
      }
    })
    const recentMeals = meals.slice(0, 20).map(meal => ({
      type: meal.meal_type,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein_g,
      waterMl: meal.water_ml,
      loggedAt: meal.logged_at,
    }))

    const progressContext = {
      momentum,
      totalGoals: goals.length,
      activeGoals: goals.filter(goal => goal.status === 'active').map(goal => ({
        title: goal.title,
        progress: Number(goal.progress || 0),
        dueDate: goal.due_date || null,
      })),
      completedGoals: goals.filter(goal => goal.status === 'completed').map(goal => ({
        title: goal.title,
        progress: Number(goal.progress || 0),
      })),
      totalCheckins: checkins.length,
      recentCheckins: checkins.slice(0, 7).map(item => item.checkin_date),
      recentLogs,
      recentMeals,
    }

    let response
    let result = {}

    try {
      response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolv-ai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: nextMessages, profile, progress: progressContext }),
      })

      result = await response.json().catch(() => ({}))
    } catch (requestError) {
      console.error('EVOLV AI request failed:', requestError)
      setSending(false)
      setError('EVOLV could not reach the AI service. Check your connection and try again.')
      return
    }

    if (!response.ok) {
      setSending(false)
      setError(result.error || 'The AI assistant could not respond right now.')
      return
    }

    if (result.calendarEvent) setPendingCalendarEvent(result.calendarEvent)

    const reply = result.reply || `I’m here, ${firstName}. We can take it one step at a time.`
    setTyping(true)
    setMessages(current => [...current, { role: 'assistant', content: '' }])

    for (let index = 0; index < reply.length; index += 2) {
      await new Promise(resolve => window.setTimeout(resolve, index < 10 ? 28 : 14))
      const visible = reply.slice(0, Math.min(index + 2, reply.length))
      setMessages(current => {
        const updated = [...current]
        const last = updated.length - 1
        if (updated[last]?.role === 'assistant') updated[last] = { ...updated[last], content: visible }
        return updated
      })
    }

    setTyping(false)
    setSending(false)
    await supabase.from('ai_messages').insert({ user_id: userId, chat_id: chatId, role: 'assistant', content: reply })
    void ensureChatTitle([...nextMessages, { role: 'assistant', content: reply }])
  }

  return (
    <section className="panel-page ai-page">
      <div className="ai-topbar">
        <button
          className="ai-history-button"
          type="button"
          onClick={openChatHistory}
          aria-label={historyOpen ? "Close chat history" : "Open chat history"}
          title="Chat history"
        >
          <History size={20} />
        </button>

        <div className="ai-topbar-actions">
          <button className="ai-new-chat" type="button" onClick={startNewChat} aria-label="Start a new chat">
            <Plus size={17} />
            <span>New chat</span>
          </button>
          <button className="ai-more-button" type="button" aria-label="More options" title="More options">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
      {historyOpen && (
        <div
          className="ai-history-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Previous AI chats"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setHistoryOpen(false)
          }}
        >
          <section className="ai-history-sheet">
            <div className="ai-history-head">
              <div><span className="section-label">YOUR AI HISTORY</span><h3>Previous chats.</h3></div>
              <button type="button" className="ai-history-close" onClick={() => setHistoryOpen(false)} aria-label="Close chat history"><X size={18}/></button>
            </div>
            <div className="ai-history-list">
              {chatHistory.length ? chatHistory.map(chat => (
                <div
                  className={chat.chatId === chatId ? 'ai-history-row active' : 'ai-history-row'}
                  key={chat.chatId}
                  onPointerDown={() => beginHistoryPress(chat.chatId)}
                  onPointerUp={endHistoryPress}
                  onPointerCancel={endHistoryPress}
                  onPointerLeave={endHistoryPress}
                  onContextMenu={e => {
                    e.preventDefault()
                    setPressedChatId(chat.chatId)
                  }}
                >
                  <button type="button" className="ai-history-row-select" onClick={() => selectChatFromHistory(chat.chatId)}>
                    <span className="ai-history-row-copy">
                      <strong>{chat.title || chat.preview || 'Untitled chat'}</strong>
                      <small>{new Date(chat.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {new Date(chat.updatedAt).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={pressedChatId === chat.chatId ? 'ai-history-delete visible' : 'ai-history-delete'}
                    aria-label="Delete chat"
                    title="Delete chat"
                    onClick={e => {
                      e.stopPropagation()
                      deleteChatFromHistory(chat.chatId)
                    }}
                  >
                    <MoreHorizontal size={17}/>
                  </button>
                </div>
              )) : (
                <div className="ai-history-empty"><History size={22}/><strong>No previous chats yet.</strong><p>Your AI conversations will appear here after you send a message.</p></div>
              )}
            </div>
          </section>
        </div>
      )}
      <div className={`ai-chat ${messages.length ? 'has-messages' : 'is-empty'}`}>
        {!messages.length && (
          <div className="ai-empty">
            <div className="ai-empty-copy">
              <h3>What’s on your mind?</h3>
            </div>
            <div className="ai-starters">
              {['Help me understand my week', 'I feel stuck', 'Why have I been so tired?', 'Help me plan tomorrow'].map(starter => (
                <button key={starter} type="button" onClick={() => setInput(starter)}>{starter}</button>
              ))}
            </div>
          </div>
        )}
        <div className="ai-messages">
          {messages.map((message, index) => {
            const messageKey = String(message.id || index)
            const isTypingMessage = message.role === 'assistant' && typing && index === messages.length - 1
            return (
              <div className={`ai-message ${message.role}`} key={messageKey}>
                <span className="ai-message-role">{message.role === 'assistant' ? 'EVOLV' : 'YOU'}</span>
                <p>{message.content}{isTypingMessage ? <><span className="ai-cursor" aria-hidden="true">▍</span><span className="ai-typing-dot" aria-hidden="true" /></> : null}</p>
                {message.role === 'assistant' && !isTypingMessage && message.content && (
                  <div className="ai-message-actions" aria-label="Message actions">
                    <button type="button" onClick={() => copyMessage(message.content, messageKey)} aria-label={copiedMessage === messageKey ? 'Copied' : 'Copy message'} title={copiedMessage === messageKey ? 'Copied' : 'Copy'}>
                      {copiedMessage === messageKey ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button type="button" onClick={() => speakMessage(message.content, messageKey)} aria-label={speakingMessage === messageKey ? 'Stop speaking' : 'Read aloud'} title={speakingMessage === messageKey ? 'Stop' : 'Listen'}>
                      {speakingMessage === messageKey ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <button type="button" onClick={() => shareMessage(message.content, messageKey)} aria-label="Share message" title="Share">
                      <Share2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {sending && !typing && (
            <div className="ai-message assistant">
              <span className="ai-message-role">EVOLV</span>
              <span className="ai-thinking" aria-label="EVOLV AI is thinking" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      {pendingCalendarEvent && (
        <EvolvCalendarBridge
          event={pendingCalendarEvent}
          onCancel={() => setPendingCalendarEvent(null)}
          onAdded={() => setPendingCalendarEvent(null)}
        />
      )}
      <form className="ai-input" onSubmit={sendMessage}>
        <div className="ai-composer">
          <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.stopPropagation()
              // Enter is always a new line in the Evolv composer.
              // Messages are sent only with the button.
            }
          }}
          placeholder="What’s on your mind?"
          maxLength={2000}
          rows={1}
          aria-label="Message"
        />
          <button type="submit" className="ai-send" disabled={sending || !input.trim()} aria-label="Send message"><ArrowUp size={18}/></button>
        </div>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </section>
  )
}

export default EvolvAI
