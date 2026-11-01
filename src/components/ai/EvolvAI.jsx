import React, { useEffect, useRef, useState } from 'react'

function renderInlineMarkdown(text, keyPrefix = 'inline') {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*|\*[^*]+\*|\`[^\`]+\`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+)/g)
  return parts.map((part, index) => {
    if (!part) return null
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      const boldLink = inner.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
      if (boldLink) return <strong key={key}><a href={boldLink[2]} target="_blank" rel="noreferrer noopener">{boldLink[1]}</a></strong>
      return <strong key={key}>{inner}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer noopener">{link[1]}</a>
    if (/^https?:\/\//i.test(part)) {
      const cleanUrl = part.replace(/[),.!?]+$/, '')
      const trailing = part.slice(cleanUrl.length)
      return <React.Fragment key={key}><a href={cleanUrl} target="_blank" rel="noreferrer noopener">{cleanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>{trailing}</React.Fragment>
    }
    return part
  })
}

function AssistantMessageContent({ content, typing = false }) {
  const [openedImage, setOpenedImage] = useState(null)
  useEffect(() => {
    if (!openedImage) return
    const onKeyDown = event => { if (event.key === 'Escape') setOpenedImage(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openedImage])
  const rawContent = String(content || '').replace(/\r\n?/g, '\n')
  // Some model replies contain single newlines rather than real paragraph breaks.
  // Normalize plain prose and reflow long sections into readable paragraphs, while
  // leaving intentional Markdown headings, lists, quotes, and code untouched.
  const looksStructured = /^\s*(#{1,4}\s|[-*+]\s|\d+[.)]\s|>\s|\x60\x60\x60)/m.test(rawContent)
  const formattedContent = !looksStructured
    ? rawContent
        .trim()
        .split(/\n\s*\n/)
        .map(section => {
          const prose = section.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim()
          if (prose.length <= 180) return prose
          const sentences = prose.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'(])/)
          if (sentences.length < 3) return prose
          const paragraphs = []
          let current = []
          let currentLength = 0
          for (const sentence of sentences) {
            const nextLength = currentLength + sentence.length + (current.length ? 1 : 0)
            if (current.length >= 2 || (current.length && nextLength > 360)) {
              paragraphs.push(current.join(' '))
              current = []
              currentLength = 0
            }
            current.push(sentence)
            currentLength += sentence.length + (current.length > 1 ? 1 : 0)
          }
          if (current.length) paragraphs.push(current.join(' '))
          return paragraphs.join('\n\n')
        })
        .join('\n\n')
    : rawContent
  const lines = formattedContent.split('\n')
  const blocks = []
  let paragraph = []
  let list = []
  let listType = ''
  let quote = []
  let code = []
  let inCode = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(<p key={`p-${blocks.length}`}>{paragraph.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{renderInlineMarkdown(line, `p-${blocks.length}-${index}`)}</React.Fragment>)}</p>)
    paragraph = []
  }
  const flushList = () => {
    if (!list.length) return
    const Tag = listType === 'ol' ? 'ol' : 'ul'
    blocks.push(<Tag key={`list-${blocks.length}`}>{list.map((item, index) => <li key={index}>{renderInlineMarkdown(item, `li-${blocks.length}-${index}`)}</li>)}</Tag>)
    list = []
    listType = ''
  }
  const flushQuote = () => {
    if (!quote.length) return
    blocks.push(<blockquote key={`quote-${blocks.length}`}>{quote.map((line, index) => <p key={index}>{renderInlineMarkdown(line, `quote-${blocks.length}-${index}`)}</p>)}</blockquote>)
    quote = []
  }
  const flushCode = () => {
    blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join('\n')}</code></pre>)
    code = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      flushParagraph(); flushList(); flushQuote()
      if (inCode) flushCode()
      inCode = !inCode
      return
    }
    if (inCode) { code.push(line); return }
    if (trimmed.startsWith('[[EVOLV_IMAGE|')) {
      flushParagraph(); flushList(); flushQuote()
      const parts = trimmed.slice(2, -2).split('|')
      if (parts.length >= 5 && parts[0] === 'EVOLV_IMAGE') {
        try {
          const image = { title: decodeURIComponent(parts[1]), url: parts[2], sourceUrl: parts[3], license: decodeURIComponent(parts[4] || '') }
          if (/^https:\/\//i.test(image.url) && /^https:\/\//i.test(image.sourceUrl)) {
            blocks.push(
              <button type="button" className="ai-image-card" key={`image-${blocks.length}`}
                aria-label={`Open image preview: ${image.title}`} onClick={() => setOpenedImage(image)}>
                <img src={image.url} alt={image.title} loading="lazy"
                  onError={event => { const card = event.currentTarget.closest('button'); if (card) card.style.display = 'none' }} />
              </button>
            )
          }
        } catch { /* Ignore malformed image markers. */ }
      }
      return
    }
    if (trimmed.startsWith('![')) return
    if (!trimmed) { flushParagraph(); flushList(); flushQuote(); return }
    if (/^#{1,4}\s+/.test(trimmed)) {
      flushParagraph(); flushList(); flushQuote()
      const match = trimmed.match(/^(#{1,4})\s+(.*)$/)
      const Tag = match[1].length <= 2 ? 'h2' : 'h3'
      blocks.push(<Tag key={`heading-${index}`}>{renderInlineMarkdown(match[2], `heading-${index}`)}</Tag>)
      return
    }
    if (/^([-*_])\1\1+\s*$/.test(trimmed)) {
      flushParagraph(); flushList(); flushQuote()
      blocks.push(<hr key={`hr-${index}`} />)
      return
    }
    if (/^>\s?/.test(trimmed)) {
      flushParagraph(); flushList()
      quote.push(trimmed.replace(/^>\s?/, ''))
      return
    }
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/)
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (unordered || ordered) {
      flushParagraph(); flushQuote()
      const nextType = ordered ? 'ol' : 'ul'
      if (list.length && listType !== nextType) flushList()
      listType = nextType
      list.push((unordered || ordered)[1])
      return
    }
    flushList(); flushQuote()
    paragraph.push(line)
  })
  flushParagraph(); flushList(); flushQuote()
  if (inCode) flushCode()

  return (
    <>
      <div className="ai-response-content">
        {blocks}
        {typing ? <span className="ai-cursor" aria-hidden="true">▍</span> : null}
      </div>
      {openedImage ? (
        <div className="ai-image-lightbox" role="dialog" aria-modal="true"
          aria-label={`Image preview: ${openedImage.title}`}
          onMouseDown={event => { if (event.target === event.currentTarget) setOpenedImage(null) }}
          onClick={event => { if (event.target === event.currentTarget) setOpenedImage(null) }}>
          <button type="button" className="ai-image-lightbox-close" aria-label="Close image preview"
            onClick={() => setOpenedImage(null)}><X size={22} /></button>
          <div className="ai-image-lightbox-panel">
            <img src={openedImage.url} alt={openedImage.title} />
            <div className="ai-image-source">
              <span>{openedImage.title}{openedImage.license ? ` · ${openedImage.license}` : ''}</span>
              <a href={openedImage.sourceUrl} target="_blank" rel="noreferrer noopener">Open source ↗</a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

import {
  History, Plus, MoreHorizontal, X, Copy, Volume2, VolumeX, Share2, ArrowDown, Pencil, PanelLeftOpen,
  Check, Search, Files, Dumbbell, ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PromptBar from './PromptBar'
import './EvolvAIFixes.css'
import { Attachment01Icon, Globe02Icon } from '@hugeicons/core-free-icons'

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

function WorkoutLoggedCard({ workout }) {
  const exercises = Array.isArray(workout?.exercises) ? workout.exercises : []
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0)
  if (!workout || !exercises.length) return null

  return (
    <section className="ai-workout-logged-card" aria-label="Workout saved">
      <div className="ai-workout-card-eyebrow"><span><Dumbbell size={15} /></span> WORKOUT LOGGED</div>
      <h3>{workout.name || 'Workout'}</h3>
      <p className="ai-workout-card-summary">{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} · {totalSets} {totalSets === 1 ? 'set' : 'sets'}</p>
      <div className="ai-workout-card-exercises">
        {exercises.slice(0, 4).map((exercise, index) => {
          const sets = Array.isArray(exercise.sets) ? exercise.sets : []
          const details = sets.map(set => {
            const weight = set.weight == null ? '' : String(set.weight) + ' ' + (set.weight_unit || 'kg') + ' × '
            return weight + set.reps + ' reps'
          }).join(' · ')
          return <div className="ai-workout-card-exercise" key={exercise.id || exercise.name + index}>
            <strong>{exercise.name}</strong>
            <small>{details || (sets.length + ' sets')}</small>
          </div>
        })}
        {exercises.length > 4 && <p className="ai-workout-card-more">+{exercises.length - 4} more exercises</p>}
      </div>
      <button type="button" className="ai-workout-card-open" onClick={() => window.dispatchEvent(new CustomEvent('evolv-open-workout-tracker'))}>
        View workout <ArrowRight size={15} />
      </button>
    </section>
  )
}

function EvolvAI({ profile, goals = [], checkins = [], reflections = [], momentum = 0, logs = [], meals = [], definitions = [] }) {
  // Match the app canvas to the *visible* viewport. On phones, the visual viewport
  // shrinks when the keyboard opens. Keep one source of truth for that height and
  // position the composer inside this canvas instead of adding a second keyboard offset.
  useEffect(() => {
    const root = document.documentElement
    const updateViewport = () => {
      const viewport = window.visualViewport
      const height = viewport?.height || window.innerHeight || document.documentElement.clientHeight
      const top = viewport?.offsetTop || 0
      if (height > 0) root.style.setProperty('--evolv-ai-viewport-height', `${Math.round(height)}px`)
      root.style.setProperty('--evolv-ai-viewport-top', `${Math.round(top)}px`)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
      root.style.removeProperty('--evolv-ai-viewport-height')
      root.style.removeProperty('--evolv-ai-viewport-top')
    }
  }, [])

  const firstName = String(profile?.first_name || profile?.full_name || profile?.name || '').trim().split(/\s+/)[0] || 'there'
  const [chatId, setChatId] = useState(() => {
    try {
      const startNewChat = localStorage.getItem('evolv-ai-start-new-chat') === 'true'
      if (startNewChat) {
        localStorage.removeItem('evolv-ai-start-new-chat')
        const freshChatId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        localStorage.setItem('evolv-ai-chat-id', freshChatId)
        return freshChatId
      }
      return localStorage.getItem('evolv-ai-chat-id') || (
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      )
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
  })
  const [messages, setMessages] = useState([])
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const autoPromptStartedRef = useRef(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [findInChat, setFindInChat] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [uploadedFilesOpen, setUploadedFilesOpen] = useState(false)
  const [pinnedChat, setPinnedChat] = useState(() => { try { return JSON.parse(localStorage.getItem('evolv-ai-pinned-chats') || '[]') } catch { return [] } })
  const [promptMenu, setPromptMenu] = useState(null)
  const promptHoldTimerRef = useRef(null)
  const promptHoldStartRef = useRef(null)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [typing, setTyping] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState('')
  const [speakingMessage, setSpeakingMessage] = useState('')
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [pressedChatId, setPressedChatId] = useState('')
  const historyPressTimerRef = useRef(null)
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const shouldAutoScrollRef = useRef(false)
  const controller = useRef(null)
  const chatOptionsSelectRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('evolv-ai-chat-id', chatId)
    setMessagesLoaded(false)
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
        shouldAutoScrollRef.current = true
        setMessages(data?.length ? data.map(message => {
          const hiddenPrefix = '[[EVOLV_HIDDEN_PROMPT]]'
          const rawContent = String(message.content || '')
          const hasStoredHiddenMarker = rawContent.startsWith(hiddenPrefix)
          const content = hasStoredHiddenMarker ? rawContent.slice(hiddenPrefix.length) : rawContent

          // Older deployments saved mood check-in prompts as ordinary user messages.
          // Recognize those legacy rows too, so they never appear as chat bubbles.
          const isLegacyAutomaticMoodPrompt =
            message.role === 'user' &&
            /^I checked in on EVOLV and I'm feeling (good|okay|low|stressed) today\./i.test(content)

          return hasStoredHiddenMarker || isLegacyAutomaticMoodPrompt
            ? { ...message, content, hidden: true }
            : message
        }) : [])
        setMessagesLoaded(true)
        setHasStartedTyping(false)
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
      const isHiddenPrompt = String(message.content || '').startsWith('[[EVOLV_HIDDEN_PROMPT]]')
      if (!current) {
        grouped.set(message.chat_id, {
          chatId: message.chat_id,
          updatedAt: message.created_at,
          preview: message.role === 'user' && !isHiddenPrompt ? message.content : '',
          title: titleMap.get(message.chat_id) || '',
        })
      } else if (!current.preview && message.role === 'user' && !isHiddenPrompt) {
        current.preview = message.content
      }
    })

    let archivedIds = []
    try { archivedIds = JSON.parse(localStorage.getItem('evolv-ai-archived-chats') || '[]') } catch {}
    setChatHistory(
      Array.from(grouped.values())
        .filter(chat => !archivedIds.includes(chat.chatId))
        .sort((a, b) => {
          const pinOrder = Number(pinnedChat.includes(b.chatId)) - Number(pinnedChat.includes(a.chatId))
          return pinOrder || new Date(b.updatedAt) - new Date(a.updatedAt)
        }),
    )
  }

  async function ensureChatTitle(conversation) {
    if (!chatId || !Array.isArray(conversation) || !conversation.length) return

    // Internal handoff prompts guide the assistant, but should never become chat titles.
    const visibleConversation = conversation.filter(message =>
      !message.hidden &&
      !String(message.content || '').startsWith('[[EVOLV_HIDDEN_PROMPT]]')
    )
    if (!visibleConversation.length) return

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
          messages: visibleConversation,
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

  function togglePinCurrentChat() {
    const next = pinnedChat.includes(chatId)
      ? pinnedChat.filter(id => id !== chatId)
      : [...pinnedChat, chatId]
    setPinnedChat(next)
    localStorage.setItem('evolv-ai-pinned-chats', JSON.stringify(next))
  }

  async function shareCurrentChat() {
    // Keep silent logging instructions out of anything the user shares.
    const transcript = messages
      .filter(message => !message.hidden && !String(message.content || '').startsWith('[[EVOLV_HIDDEN_PROMPT]]'))
      .map(message => `${message.role === 'user' ? 'You' : 'Evolv'}: ${message.content || ''}`)
      .join('\n\n')
      .trim()
    if (!transcript) {
      setError('Send a message before sharing this chat.')
      return
    }
    try {
      if (navigator.share) await navigator.share({ title: 'Evolv AI chat', text: transcript })
      else {
        await navigator.clipboard.writeText(transcript)
        setCopiedMessage('chat-share')
        window.setTimeout(() => setCopiedMessage(current => current === 'chat-share' ? '' : current), 1400)
      }
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError('Could not share this chat. Please try again.')
    }
    
  }

  function addCurrentChatToProject() {
    const projectName = window.prompt('Add this conversation to which project?')
    if (projectName?.trim()) {
      try {
        const projects = JSON.parse(localStorage.getItem('evolv-ai-projects') || '{}')
        projects[chatId] = [...new Set([...(projects[chatId] || []), projectName.trim()])]
        localStorage.setItem('evolv-ai-projects', JSON.stringify(projects))
        setError('')
      } catch {
        setError('Could not save this project association.')
      }
    }
    
  }

  function archiveCurrentChat() {
    try {
      const archived = JSON.parse(localStorage.getItem('evolv-ai-archived-chats') || '[]')
      if (!archived.includes(chatId)) localStorage.setItem('evolv-ai-archived-chats', JSON.stringify([...archived, chatId]))
    } catch {}
    
    startNewChat()
  }

  async function deleteCurrentChat() {
    const confirmed = window.confirm('Permanently delete this conversation? This cannot be undone.')
    
    if (!confirmed) return
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      setError('Please sign in again to delete this chat.')
      return
    }
    const [{ error: messagesError }, { error: titleError }] = await Promise.all([
      supabase.from('ai_messages').delete().eq('user_id', userId).eq('chat_id', chatId),
      supabase.from('ai_chat_titles').delete().eq('user_id', userId).eq('chat_id', chatId),
    ])
    if (messagesError || titleError) {
      setError('Could not delete this chat. Please try again.')
      return
    }
    setChatHistory(current => current.filter(chat => chat.chatId !== chatId))
    startNewChat()
  }

  function findMatchingMessage() {
    const query = chatSearch.trim().toLowerCase()
    if (!query) return
    const nodes = Array.from(messagesRef.current?.querySelectorAll('.ai-message') || [])
    const match = nodes.find(node => node.textContent?.toLowerCase().includes(query))
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
    } else {
      setError('No matching message found in this chat.')
    }
  }

  function openChatHistory() {
    if (historyOpen) {
      setHistoryOpen(false)
      window.setTimeout(() => messagesRef.current?.focus?.(), 0)
      return
    }

    // Open the drawer immediately; fetch the conversations in the background.
    setError('')
    setHistoryLoading(true)
    setHistoryOpen(true)
    loadChatHistory().finally(() => setHistoryLoading(false))
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
    const nextPinned = pinnedChat.filter(chatIdValue => chatIdValue !== id)
    setPinnedChat(nextPinned)
    localStorage.setItem('evolv-ai-pinned-chats', JSON.stringify(nextPinned))
    setPressedChatId('')
    if (chatId === id) startNewChat()
  }

  useEffect(() => {
    const node = messagesRef.current
    if (!node) return

    function handleScroll() {
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
      shouldAutoScrollRef.current = distanceFromBottom < 120
      setShowScrollToBottom(distanceFromBottom > 140)
    }

    handleScroll()
    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => node.removeEventListener('scroll', handleScroll)
  }, [])

  // Keep the latest response in view while the user is already at the bottom,
  // without pulling them back down if they intentionally scroll up.
  useEffect(() => {
    const node = messagesRef.current
    if (!node || !shouldAutoScrollRef.current) return

    const frame = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages.length, typing, sending])

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent || '')
    if (!isAndroid) return

    const state = { ...(window.history.state || {}), evolvAiPage: true }
    window.history.pushState(state, '', window.location.href)

    function handleAndroidBack() {
      window.location.assign('/')
    }

    window.addEventListener('popstate', handleAndroidBack)

    const app = window.Capacitor?.Plugins?.App
    let nativeListener
    if (app?.addListener) {
      app.addListener('backButton', handleAndroidBack).then(listener => {
        nativeListener = listener
      }).catch(() => {})
    }

    return () => {
      window.removeEventListener('popstate', handleAndroidBack)
      nativeListener?.remove?.()
    }
  }, [])


  function startNewChat() {
    setHistoryOpen(false)
    controller.current?.abort()
    controller.current = null
    shouldAutoScrollRef.current = true
    setShowScrollToBottom(false)
    window.dispatchEvent(new CustomEvent('evolv:clear-prompt'))
    window.speechSynthesis?.cancel()
    setSpeakingMessage('')
    setCopiedMessage('')
    setTyping(false)
    setSending(false)
    setError('')
    setPendingCalendarEvent(null)
    try {
      setChatId(crypto.randomUUID())
    } catch {
      setChatId(`${Date.now()}-${Math.random().toString(36).slice(2)}`)
    }
    setMessages([])
    setHasStartedTyping(false)
  }

  // Logging and check-in actions can request a fresh AI conversation while this
  // component is already mounted. Consume the same handoff flag used on mount.
  useEffect(() => {
    function handleFreshLoggingChat() {
      localStorage.removeItem('evolv-ai-start-new-chat')
      startNewChat()
    }
    window.addEventListener('evolv:start-new-chat', handleFreshLoggingChat)
    return () => window.removeEventListener('evolv:start-new-chat', handleFreshLoggingChat)
  }, [])

  function openPromptMenu(event, message, index) {
    event.preventDefault()
    const trigger = event.currentTarget?.getBoundingClientRect
      ? event.currentTarget
      : event.target?.closest?.('button')
    const rect = trigger?.getBoundingClientRect?.()
    const menuWidth = 196
    const menuHeight = 142
    const gap = 8

    // Anchor the menu to the three-dot button, not the tap/click coordinates.
    // Prefer opening above it so the fixed prompt bar cannot cover it near the
    // bottom of the conversation (especially on Android).
    const anchorX = rect ? rect.right : (event.clientX ?? window.innerWidth / 2)
    const anchorY = rect ? rect.top : (event.clientY ?? window.innerHeight / 2)
    const top = Math.max(12, anchorY - menuHeight - gap)
    const left = Math.max(12, Math.min(anchorX - menuWidth, window.innerWidth - menuWidth - 12))

    setPromptMenu({ content: message.content || '', index, x: left, y: top })
  }

  function closePromptMenu() {
    window.clearTimeout(promptHoldTimerRef.current)
    setPromptMenu(null)
  }

  function startPromptHold(event, message, index) {
    if (event.pointerType === 'mouse') return
    const touch = event.touches?.[0] || event
    promptHoldStartRef.current = { x: touch.clientX, y: touch.clientY }
    window.clearTimeout(promptHoldTimerRef.current)
    promptHoldTimerRef.current = window.setTimeout(() => {
      openPromptMenu(event, message, index)
    }, 520)
  }

  function movePromptHold(event) {
    if (!promptHoldStartRef.current) return
    const touch = event.touches?.[0] || event
    if (Math.abs(touch.clientX - promptHoldStartRef.current.x) > 10 ||
        Math.abs(touch.clientY - promptHoldStartRef.current.y) > 10) {
      window.clearTimeout(promptHoldTimerRef.current)
      promptHoldStartRef.current = null
    }
  }

  async function runPromptAction(action) {
    const item = promptMenu
    if (!item) return
    closePromptMenu()

    if (action === 'copy') {
      await copyMessage(item.content, `prompt-${item.index}`)
      return
    }

    if (action === 'edit') {
      window.dispatchEvent(new CustomEvent('evolv:edit-prompt', { detail: { text: item.content } }))
      setHasStartedTyping(true)
      return
    }

    if (action === 'select') {
      const messageNode = messagesRef.current?.querySelectorAll('.ai-message.user p')?.[item.index]
      if (messageNode) {
        const range = document.createRange()
        range.selectNodeContents(messageNode)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      return
    }

    if (action === 'share') {
      await shareMessage(item.content, `prompt-${item.index}`)
    }
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

  async function sendMessage(text, { attachments = [], model, effort, hiddenPrompt = false } = {}) {
    const cleanText = String(text || '').trim()
    const safeAttachments = Array.isArray(attachments) ? attachments : []
    if (!cleanText && safeAttachments.length === 0 || sending) return

    // Keep attachment filenames out of the visible chat bubble. Images are
    // rendered from the attachment data and sent separately to the AI service.
    const visibleUserContent = cleanText
    const storedUserContent = hiddenPrompt ? `[[EVOLV_HIDDEN_PROMPT]]${visibleUserContent}` : visibleUserContent
    shouldAutoScrollRef.current = true
    const nextMessages = [...messages, { role: 'user', content: visibleUserContent, attachments: safeAttachments, ...(hiddenPrompt ? { hidden: true } : {}) }]
    setMessages(nextMessages)
    setSending(true)
    setTyping(false)
    setError('')
    controller.current = new AbortController()

    const { data: authData } = await supabase.auth.getSession()
    const token = authData?.session?.access_token
    const userId = authData?.session?.user?.id

    if (!token || !userId) {
      setSending(false)
      controller.current = null
      setError('Your session has expired. Please sign in again.')
      return
    }

    await supabase.from('ai_messages').insert({ user_id: userId, chat_id: chatId, role: 'user', content: storedUserContent })

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
      recentCheckins: checkins.slice(0, 14).map(item => ({ date: item.checkin_date, note: item.note || null })),
      recentReflections: reflections.slice(0, 10).map(item => ({ date: item.reflection_date, mood: item.mood, feeling: item.day_feeling || null, note: item.note || null })),
      activeDaysLast7: new Set([...logs.map(item => String(item.logged_at || item.created_at || '').slice(0, 10)), ...meals.map(item => String(item.logged_at || item.created_at || '').slice(0, 10)), ...checkins.map(item => item.checkin_date)].filter(date => date && date >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10))).size,
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
        signal: controller.current.signal,
        body: JSON.stringify({
          messages: nextMessages.map((message,index)=>(
            index===nextMessages.length-1 && message.role==='user'
              ? {...message,content:message.content+"\n\n[EVOLV response-style preference: Use 2–4 fitting emojis naturally in most friendly, personal, reflective, encouraging, or celebratory replies. Let them add warmth and expression rather than decoration. Avoid emoji spam, do not force emojis into technical explanations or serious safety conversations, and do not use star or flower emojis.]"}
              : message
          )),
          profile: profile ? { ...profile, first_name: firstName } : profile,
          progress: progressContext,
          model: model?.key || null,
          effort: effort || null,
          attachments: attachments || [],
        }),
      })

      result = await response.json().catch(() => ({}))
    } catch (requestError) {
      if (requestError?.name === 'AbortError') {
        setSending(false)
        setTyping(false)
        controller.current = null
        return
      }

      console.error('EVOLV AI request failed:', requestError)
      setSending(false)
      controller.current = null
      setError('EVOLV could not reach the AI service. Check your connection and try again.')
      return
    }

    if (!response.ok) {
      setSending(false)
      controller.current = null
      setError(result.error || 'The AI assistant could not respond right now.')
      return
    }

    if (result.calendarEvent) setPendingCalendarEvent(result.calendarEvent)
    if (result.logged) window.dispatchEvent(new Event('evolv-tracking-updated'))
    const workoutAction = Array.isArray(result.actions) ? result.actions.find(action => action.action === 'workout_logged')?.workout : null

    const reply = result.reply || `I’m here, ${firstName}. We can take it one step at a time.`
    setTyping(true)
    setMessages(current => [...current, { role: 'assistant', content: '', ...(workoutAction ? { workout: workoutAction } : {}) }])

    for (let index = 0; index < reply.length; index += 2) {
      if (controller.current?.signal.aborted) {
        setTyping(false)
        setSending(false)
        controller.current = null
        return
      }

      await new Promise(resolve => window.setTimeout(resolve, index < 10 ? 28 : 14))
      if (controller.current?.signal.aborted) {
        setTyping(false)
        setSending(false)
        controller.current = null
        return
      }

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
    controller.current = null
    await supabase.from('ai_messages').insert({ user_id: userId, chat_id: chatId, role: 'assistant', content: reply })
    void ensureChatTitle([...nextMessages, { role: 'assistant', content: reply }])
  }

  useEffect(() => {
    if (!messagesLoaded || autoPromptStartedRef.current) return

    // Routine actions should guide Evolv silently, not paste internal instructions
    // into the user's composer. The assistant's natural reply is what the user sees.
    const pendingAutoPrompt = localStorage.getItem('evolv-ai-auto-prompt')
    const pendingRoutinePrompt = localStorage.getItem('evolv-ai-pending-prompt')
    const pending = pendingAutoPrompt || pendingRoutinePrompt
    if (!pending) return

    if (pendingAutoPrompt) localStorage.removeItem('evolv-ai-auto-prompt')
    if (pendingRoutinePrompt) localStorage.removeItem('evolv-ai-pending-prompt')
    autoPromptStartedRef.current = true

    const timer = window.setTimeout(() => {
      void sendMessage(pending, { hiddenPrompt: true })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [messagesLoaded, chatId])

  async function pickFiles() {
    if (typeof document === 'undefined') return []

    return new Promise(resolve => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/*'
      input.onchange = async () => {
        const selected = Array.from(input.files || [])
        const images = selected.filter(file => file.type.startsWith('image/'))

        if (images.length !== selected.length) {
          setError('For now, Evolv can analyze images. Please choose an image file.')
        }

        const maxBytes = 6 * 1024 * 1024
        const attachments = []

        for (const file of images) {
          if (file.size > maxBytes) {
            setError(`“${file.name}” is too large. Please choose an image under 6 MB.`)
            continue
          }

          try {
            const data = await new Promise((resolveFile, rejectFile) => {
              const reader = new FileReader()
              reader.onload = () => resolveFile(reader.result)
              reader.onerror = () => rejectFile(reader.error)
              reader.readAsDataURL(file)
            })

            attachments.push({
              name: file.name,
              mimeType: file.type,
              data,
            })
          } catch (fileError) {
            console.error('EVOLV image read failed:', fileError)
            setError(`Could not read “${file.name}”. Please try another image.`)
          }
        }

        resolve(attachments)
      }
      input.click()
    })
  }

  const recognitionRef = useRef(null)

  async function transcribe({ stop = false, onTranscript } = {}) {
    if (stop) {
      const recognition = recognitionRef.current
      if (!recognition) return ''
      return new Promise(resolve => {
        recognition.__resolveStop = resolve
        try {
          recognition.stop?.()
        } catch {
          resolve(recognition.__transcript || '')
        }
      })
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice dictation is not supported on this device/browser. Try opening EVOLV in Safari or Chrome.')
      throw new Error('Speech recognition unavailable')
    }

    setError('')
    return new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = navigator.language || 'en-US'
      recognition.interimResults = true
      recognition.continuous = true
      recognition.maxAlternatives = 1
      recognition.__transcript = ''
      recognition.__onTranscript = onTranscript

      recognition.onresult = event => {
        const transcript = Array.from(event.results || [])
          .map(result => result?.[0]?.transcript || '')
          .join('')
          .trim()
        recognition.__transcript = transcript
        recognition.__onTranscript?.(transcript)
      }

      recognition.onerror = event => {
        const message = event?.error === 'not-allowed' || event?.error === 'service-not-allowed'
          ? 'Allow microphone access in your browser settings to use voice dictation.'
          : event?.error === 'no-speech'
            ? ''
            : 'Voice dictation stopped unexpectedly. Please try again.'
        if (message) setError(message)
        if (recognitionRef.current === recognition) recognitionRef.current = null
        const transcript = recognition.__transcript || ''
        resolve(transcript)
        recognition.__resolveStop?.(transcript)
      }

      recognition.onend = () => {
        if (recognitionRef.current === recognition) recognitionRef.current = null
        const transcript = recognition.__transcript || ''
        resolve(transcript)
        recognition.__resolveStop?.(transcript)
      }

      try {
        recognition.start()
      } catch (recognitionError) {
        if (recognitionRef.current === recognition) recognitionRef.current = null
        setError('Could not start voice dictation. Please try the microphone again.')
        reject(recognitionError)
      }
    })
  }

  function stopSending() {
    controller.current?.abort()
    setSending(false)
    setTyping(false)
  }

  return (
    <section className="panel-page ai-page">
      <div className="ai-topbar">
        <button
          className="ai-mobile-navigation-button"
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('evolv-open-dashboard-navigation'))}
          aria-label="Open dashboard navigation"
          title="Dashboard navigation"
        >
          <PanelLeftOpen size={20} />
        </button>
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
          <div className="ai-more-native-wrap">
            <button
              className="ai-more-button"
              type="button"
              aria-label="More chat options"
              onClick={() => {
                const select = chatOptionsSelectRef.current
                if (!select) return
                try {
                  if (typeof select.showPicker === 'function') select.showPicker()
                  else { select.focus(); select.click() }
                } catch {
                  select.focus()
                  select.click()
                }
              }}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            <select
              ref={chatOptionsSelectRef}
              className="ai-more-native-select"
              aria-label="Chat options"
              value=""
              onChange={event => {
                const action = event.target.value
                if (action === 'share') void shareCurrentChat()
                if (action === 'pin') togglePinCurrentChat()
                if (action === 'project') addCurrentChatToProject()
                if (action === 'files') setUploadedFilesOpen(true)
                if (action === 'find') { setFindInChat(true); setChatSearch('') }
                if (action === 'archive') archiveCurrentChat()
                if (action === 'delete') void deleteCurrentChat()
                event.target.value = ''
              }}
            >
              <option value="" disabled>More options</option>
              <option value="share">Share chat</option>
              <option value="pin">{pinnedChat.includes(chatId) ? 'Unpin chat' : 'Pin chat'}</option>
              <option value="project">Add to project</option>
              <option value="files">Uploaded files</option>
              <option value="find">Find in chat</option>
              <option value="archive">Archive chat</option>
              <option value="delete">Delete chat</option>
            </select>
          </div>        </div>
      </div>
      <div className="ai-top-progressive-blur" aria-hidden="true">
        <span className="ai-top-blur-layer ai-top-blur-layer-1" />
        <span className="ai-top-blur-layer ai-top-blur-layer-2" />
        <span className="ai-top-blur-layer ai-top-blur-layer-3" />
        <span className="ai-top-blur-layer ai-top-blur-layer-4" />
      </div>
      {findInChat && (<form className="ai-chat-find-panel" onSubmit={event => { event.preventDefault(); findMatchingMessage(); }}><input autoFocus value={chatSearch} onChange={event => setChatSearch(event.target.value)} placeholder="Find in this chat…" aria-label="Find in this chat" /><button type="submit" aria-label="Find next"><Search size={15} /></button><button type="button" aria-label="Close find in chat" onClick={() => { setFindInChat(false); setChatSearch(""); }}><X size={15} /></button></form>)}
      {uploadedFilesOpen && (
        <div className="ai-uploaded-files-overlay" role="dialog" aria-modal="true" aria-label="Uploaded files" onMouseDown={event => { if (event.target === event.currentTarget) setUploadedFilesOpen(false) }}>
          <section className="ai-uploaded-files-sheet">
            <div className="ai-history-head">
              <div><span className="section-label">THIS CONVERSATION</span><h3>Uploaded files.</h3></div>
              <button type="button" className="ai-history-close" onClick={() => setUploadedFilesOpen(false)} aria-label="Close uploaded files"><X size={18} /></button>
            </div>
            <div className="ai-uploaded-files-list">
              {messages.flatMap((message, messageIndex) => (message.attachments || []).map((attachment, attachmentIndex) => ({ ...attachment, messageIndex, attachmentIndex }))).length ? (
                messages.flatMap((message, messageIndex) => (message.attachments || []).map((attachment, attachmentIndex) => ({ ...attachment, messageIndex, attachmentIndex }))).map(file => (
                  <div className="ai-uploaded-file-row" key={`${file.messageIndex}-${file.attachmentIndex}-${file.name || 'file'}`}>
                    {file.data ? <img src={file.data} alt="" /> : <Files size={18} />}
                    <span>{file.name || 'Uploaded image'}</span>
                  </div>
                ))
              ) : <p className="ai-uploaded-files-empty">No files have been uploaded in this conversation.</p>}
            </div>
          </section>
        </div>
      )}
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
              <div><h3>Previous chats.</h3></div>
              <button type="button" className="ai-history-close" onClick={() => setHistoryOpen(false)} aria-label="Close chat history"><X size={18}/></button>
            </div>
            <div className="ai-history-list">
              {historyLoading ? (
                <div className="ai-history-loading" role="status" aria-label="Loading chat history">
                  <span className="ai-history-spinner" aria-hidden="true" />
                  <span className="ai-history-loading-label">Loading chats</span>
                </div>
              ) : chatHistory.length ? chatHistory.map(chat => (
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
        {!messages.length && !hasStartedTyping && (
          <div className="ai-empty ai-welcome" aria-label={`Welcome, ${firstName}`}>
            <h3>
              <span>Welcome</span><strong>{firstName}</strong>
            </h3>
          </div>
        )}
        <div className="ai-messages" ref={messagesRef} tabIndex="-1">
          {messages.filter(message => !message.hidden).map((message, index, visibleMessages) => {
            const messageKey = String(message.id || index)
            const isTypingMessage = message.role === 'assistant' && typing && index === visibleMessages.length - 1
            return (
              <div
                className={`ai-message ${message.role}`}
                key={messageKey}
              >
                <span className="ai-message-role">{message.role === 'assistant' ? 'EVOLV' : 'YOU'}</span>
                {message.role === 'user' && message.attachments?.length ? (
                  <div className="ai-message-attachments">
                    {message.attachments.map((attachment, attachmentIndex) => (
                      <div className="ai-message-image" key={`${attachment.name || 'image'}-${attachmentIndex}`}>
                        <img src={attachment.data} alt={attachment.name || 'Attached image'} />
                      </div>
                    ))}
                  </div>
                ) : null}
                {message.content ? (message.role === 'assistant' ? <AssistantMessageContent content={message.content} typing={isTypingMessage} /> : <p>{message.content}</p>) : null}
                {message.role === 'assistant' && message.workout && <WorkoutLoggedCard workout={message.workout} />}
                {message.role === 'user' && message.content && (
                  <button
                    type="button"
                    className="ai-user-message-menu-trigger"
                    aria-label="More options for your message"
                    title="More options"
                    onClick={event => openPromptMenu(event, message, index)}
                  >
                    <MoreHorizontal size={19} aria-hidden="true" />
                  </button>
                )}
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
          {promptMenu && (
            <div
              className="ai-prompt-menu-backdrop"
              onMouseDown={event => {
                if (event.target === event.currentTarget) closePromptMenu()
              }}
              onTouchStart={event => {
                if (event.target === event.currentTarget) closePromptMenu()
              }}
            >
              <div
                className="ai-prompt-menu"
                role="menu"
                aria-label="Prompt options"
                style={{
                  top: promptMenu.y,
                  left: promptMenu.x,
                }}
              >
                <button type="button" role="menuitem" onClick={() => runPromptAction('copy')}>
                  <Copy size={16} aria-hidden="true" /><span>Copy</span>
                </button>
                <button type="button" role="menuitem" onClick={() => runPromptAction('edit')}>
                  <Pencil size={16} aria-hidden="true" /><span>Edit prompt</span>
                </button>
                <button type="button" role="menuitem" onClick={() => runPromptAction('share')}>
                  <Share2 size={16} aria-hidden="true" /><span>Share prompt</span>
                </button>
              </div>
            </div>
          )}
          {sending && !typing && (
            <div className="ai-message assistant">
              <span className="ai-message-role">EVOLV</span>
              <span className="ai-thinking" aria-label="EVOLV AI is thinking" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {showScrollToBottom && messages.length > 0 && (
          <button
            type="button"
            className="ai-scroll-to-bottom"
            aria-label="Scroll to latest messages"
            title="Latest messages"
            onClick={() => {
              const node = messagesRef.current
              if (!node) return
              shouldAutoScrollRef.current = true
              node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
            }}
          >
            <ArrowDown size={19} strokeWidth={2.2} />
          </button>
        )}
      </div>
      {pendingCalendarEvent && (
        <EvolvCalendarBridge
          event={pendingCalendarEvent}
          onCancel={() => setPendingCalendarEvent(null)}
          onAdded={() => setPendingCalendarEvent(null)}
        />
      )}
      <div className="ai-promptbar-shell">
        <PromptBar
          placeholder="Ask anything"
          sources={[
            { key: 'files', name: 'Photos & files', description: 'Upload from this device', icon: Attachment01Icon, attach: true },
            { key: 'web', name: 'Web search', description: 'Live results', icon: Globe02Icon }
          ]}
          commands={[{ key: 'summarize', name: '/summarize', description: 'Digest the thread so far' }]}
          models={[
            { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
            { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' }
          ]}
          efforts={['Low', 'Medium', 'High']}
          busy={sending}
          onSend={sendMessage}
          onStop={stopSending}
          onAttach={pickFiles}
          onInputChange={value => setHasStartedTyping(Boolean(String(value || '').length))}
          onDictate={transcribe}
          background="#27272a"
          color="#f5f5f5"
          menuBackground="#323236"
          sparkColor="var(--color-accent-blue)"
          sparkBoost={1}
          width={400}
          radius={16}
          maxRows={5}
          morphDuration={240}
          squash={0.12}
          tilt={8}
          pressScale={0.96}
        />
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </section>
  )
}

export default EvolvAI
