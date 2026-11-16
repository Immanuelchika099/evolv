import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Moon, PenLine, Sparkles, Sunrise } from 'lucide-react'
import './FaithGrowthPage.css'

const plan = [
  ['Knowing God personally','Psalm 63:1–8','James 4:7–10','A personal hunger for God begins with wanting to know Him, not only what He can give. David sought God even in the wilderness.','What does seeking God look like in my ordinary day? What competes for my attention?','Give God fifteen quiet minutes before opening social media.','Father, grow in me a sincere desire to know You. Help me seek Your presence in every season. Amen.'],
  ['Trusting God with tomorrow','Matthew 6:25–34','Psalm 139:1–18','Jesus points to the Father’s care and invites us to meet today faithfully instead of being consumed by tomorrow.','What worry keeps returning? What would it look like to entrust it to God today?','Name one worry in prayer, then take the next responsible step you can take.','Father, help me trust Your care today. Give me wisdom for what I can do and peace about what I cannot control. Amen.'],
  ['Remaining connected to Jesus','John 15:1–11','Jeremiah 29:11–14','Jesus describes Himself as the vine and His followers as branches. Lasting fruit grows from staying connected to Him.','What helps me remain close to Jesus? Where am I trying to grow through effort alone?','Pause twice today for a short prayer and remember Jesus’ invitation to abide in Him.','Jesus, keep me close to You. Shape my desires and let my life bear good fruit. Amen.'],
  ['Courage in God’s presence','Psalm 27','Hebrews 11:1–6','David speaks honestly about fear while choosing confidence in God. Faith does not mean pretending difficulty is absent.','What am I afraid of? Which words in this Psalm help me face it honestly?','Read Psalm 27 aloud and write one line you want to carry today.','God, be my light and strength. Help me seek You when I feel uncertain. Amen.'],
  ['Renewed strength','Isaiah 40:28–31','Romans 8:26–39','God does not grow weary. Those who wait on Him can find renewed strength, even when the journey feels long.','Where do I feel tired? What might waiting on God look like without giving up?','Take a brief pause instead of pushing through every moment of tiredness.','Lord, renew my strength. Remind me that I do not have to carry everything alone. Amen.'],
  ['Choosing what matters','Luke 10:38–42','Psalm 91','Martha and Mary remind us that service is good, but being present with Jesus matters too.','Am I busy with good things but neglecting what matters most?','Create one distraction-free moment to listen, read and pray.','Jesus, quiet the noise around me and within me. Teach me to make room for Your presence. Amen.'],
  ['Knowing Christ above achievement','Philippians 3:7–14','Psalm 103','Paul values knowing Christ above status and past accomplishments. Spiritual growth is a continuing journey, not a trophy.','What achievement am I tempted to make my identity? What does pressing on mean for me?','Celebrate one area of growth, then choose one humble next step.','Father, let knowing Christ remain more important than recognition or achievement. Help me keep growing. Amen.'],
  ['A sincere prayer life','Matthew 6:5–15','1 Thessalonians 5:16–24','Jesus teaches prayer that is honest, humble and centred on the Father rather than public approval.','Is my prayer life honest? What do I need to bring to God simply and sincerely?','Pray the Lord’s Prayer slowly, reflecting on each line.','Father, teach me to pray with sincerity, trust and forgiveness. Amen.'],
  ['Persistence in prayer','Luke 18:1–8','Ephesians 6:10–18','Jesus encourages His followers not to lose heart. Persistent prayer is an expression of trust, not a way to control God.','Where am I close to giving up? How can I keep praying while acting wisely?','Return to one prayer request and bring it to God again.','God, help me persevere without becoming discouraged. Strengthen my faith and guide my actions. Amen.'],
  ['Strength and courage','Joshua 1:1–9','Psalm 119:9–16','Joshua is called to courage and to keep God’s instruction close. Courage is grounded in God’s presence and faithful obedience.','What step requires courage? Which truth from Scripture can guide that step?','Memorise one phrase from Joshua 1 and act on it in a practical way.','Lord, give me courage to do what is right and help me stay rooted in Your Word. Amen.'],
  ['Being shaped by Scripture','2 Timothy 3:14–17','Hebrews 4:12–16','Scripture teaches, corrects and equips us for good work. Reading is not only about information; it is also about formation.','What has Scripture been teaching me lately? Where do I need correction or encouragement?','Read today’s passage twice and write one practical response.','Father, help me receive Your Word with humility and let it shape how I live. Amen.'],
  ['A renewed mind','Romans 12:1–2','Galatians 5:16–26','Paul calls believers to offer their lives to God and allow their thinking to be renewed rather than simply copying the patterns around them.','Which habit or influence is shaping my thinking? What needs to change?','Replace one unhelpful habit today with a practice that helps you grow.','God, renew my mind and guide my choices. Help my life reflect what is good and pleasing to You. Amen.'],
  ['Making space for prayer','Mark 1:35–39','Colossians 3:1–17','Jesus made time for prayer even when people needed Him. Solitude helped Him stay focused on His mission.','What regularly crowds out quiet time? What can I simplify?','Set aside a specific time and place for prayer tomorrow.','Jesus, teach me to make room for prayer and to live with clear priorities. Amen.'],
  ['Love as the measure','1 Corinthians 13','Matthew 7:24–27','Paul describes love as patient, kind and enduring. Spiritual gifts and knowledge matter, but they must be expressed through love.','How do people experience my words? Where can I practise patience or kindness?','Do one thoughtful act for someone without expecting recognition.','Father, make my love patient, kind and sincere. Let my actions reflect Your love. Amen.'],
  ['Grace and a new identity','Ephesians 2:1–10','Jeremiah 1:4–10','This passage places salvation in God’s grace, not human achievement. Good works are a response to grace, not a way to earn it.','Where do I measure my worth by performance? How can gratitude replace striving?','Do one good thing today from gratitude, not for approval.','Thank You for Your grace. Help me live from the identity You give, with humility and purpose. Amen.'],
  ['Created with dignity','Genesis 1:26–31','Romans 8:14–17','Human beings are made in God’s image and given responsibility to care for creation. Every person has dignity and worth.','How does this shape the way I see myself and other people?','Treat someone whose contribution is often overlooked with respect and attention.','Creator God, help me honour the dignity of every person and care faithfully for what You have made. Amen.'],
  ['Living as light','Matthew 5:13–16','1 Peter 2:9–12','Jesus calls His followers to live visibly good lives that point beyond themselves to God. Influence is a responsibility to serve.','Where can my actions bring light? Does my conduct match the values I speak about?','Choose one practical way to serve or encourage someone.','Lord, let my life reflect Your goodness. Keep me humble as I seek to make a positive difference. Amen.'],
  ['Committing plans to God','Proverbs 16:1–9','Psalm 37:1–7','We can plan carefully while recognising that our understanding is limited. Wisdom includes humility and openness to God’s direction.','Which plan am I holding too tightly? Have I made room for wise counsel?','Review one important plan and identify the next wise, honest step.','God, guide my plans. Give me humility to adjust when needed and courage to follow what is right. Amen.'],
  ['Courage for your moment','Esther 4:10–17','Daniel 1:8–20','Esther faces risk and responsibility. Her story invites reflection on courage, wise timing and using our position for others.','Where might I need to speak up or act with courage? Who could benefit from my action?','Take one responsible step toward a good cause you care about.','Father, give me wisdom and courage to use my opportunities to serve others. Amen.'],
  ['Faithful stewardship','Matthew 25:14–30','Colossians 3:17–24','Jesus’ parable challenges us to use what has been entrusted to us faithfully rather than burying our abilities through fear.','What ability or opportunity am I neglecting? What does faithful progress look like?','Use one skill to help someone or move a meaningful task forward.','Lord, help me steward my time, abilities and opportunities faithfully. Amen.'],
  ['A life of justice and mercy','Micah 6:6–8','Philippians 2:1–11','Micah summarises faithful living through justice, mercy and humble walking with God. Faith should shape how we treat people.','Where can I act more justly? Who needs mercy or practical support from me?','Choose one action that is fair, merciful or humble.','God, teach me to do what is right, love mercy and walk humbly with You. Amen.'],
  ['God near to the hurting','Psalm 34:15–22','John 14:15–27','The Psalm acknowledges suffering while affirming God’s nearness to the brokenhearted. Faith makes room for honest pain and hope.','What pain have I been hiding? Who is a safe person I can speak with?','Reach out to someone trustworthy if you need support, and bring your feelings honestly to God.','Father, meet me in the places that hurt. Give me comfort, courage and supportive people. Amen.'],
  ['The gift of community','Ecclesiastes 4:9–12','Proverbs 13:20','Life is not meant to be carried alone. Healthy companionship offers help, encouragement and strength through difficult seasons.','Which relationships help me become wiser and kinder? How can I be a better friend?','Reach out to one person with a sincere message or invitation to connect.','God, guide me toward healthy friendships and make me a thoughtful, dependable friend. Amen.'],
  ['Guarding your heart','Proverbs 4:20–27','James 1:19–27','Wisdom invites us to pay attention to what shapes our inner life, words and actions. Guarding the heart means choosing influences carefully.','What am I allowing to shape my thoughts? Where do my words need more care?','Take a break from one influence that leaves you unsettled and choose something nourishing.','Lord, help me guard my heart and speak and act with wisdom. Amen.'],
  ['Practising genuine love','Romans 12:9–21','Matthew 18:21–35','Paul describes love through practical actions: sincerity, patience, generosity, peace and refusing revenge.','Which part of this passage challenges me most? Is there someone I need to forgive or treat differently?','Respond to a difficult interaction with honesty and self-control rather than retaliation.','Father, help me love sincerely, seek peace wisely and let go of bitterness. Amen.'],
  ['The value of loyal friendship','1 Samuel 18:1–4','Proverbs 17:17','Jonathan and David’s friendship shows loyalty and generosity. Good friendship is not competition; it makes room for mutual care.','What makes a friendship trustworthy? How can I show loyalty without losing healthy boundaries?','Check in on a friend and listen without rushing to fix everything.','God, help me build friendships marked by honesty, loyalty, generosity and care. Amen.'],
  ['Finding stillness','Psalm 46','Isaiah 41:8–13','Psalm 46 speaks of God as refuge amid upheaval. Stillness is an invitation to remember who God is, not to ignore real problems.','What feels unstable right now? What truth can help me respond calmly?','Spend five quiet minutes breathing, reading Psalm 46 and praying.','God, be my refuge in uncertainty. Help me be still enough to remember Your faithfulness. Amen.'],
  ['Leading through service','John 13:1–17','1 Corinthians 13:4–13','Jesus washes His disciples’ feet, showing that greatness in His kingdom is expressed through humble service.','Where am I seeking recognition? How can I serve without needing attention?','Do an ordinary helpful task for someone without announcing it.','Jesus, shape me into a humble servant. Help me lead with love and put people before pride. Amen.'],
  ['Offering your whole life','Romans 12:1–2','Psalm 51','Paul invites a whole-life response to God. David’s prayer in Psalm 51 reminds us that honest repentance and a renewed heart matter.','What part of my life am I holding back? What do I need to confess or change?','Make one concrete change that aligns your daily habits with your faith.','Father, renew my heart and help me offer my everyday life to You with sincerity. Amen.'],
  ['A fresh beginning with God','Isaiah 43:18–21','Philippians 4:4–9','God speaks hope and new possibility to His people. Remembering the past can teach us, but it need not imprison us.','What do I need to release? What new faithful step can I take?','Write down one lesson from this month and one hopeful next step.','God, lead me into the future with wisdom and hope. Help me recognise the new things You are doing. Amen.'],
]

const STORAGE_KEY = 'evolv:faith-growth:v1'
const readProgress = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

export default function FaithGrowthPage() {
  const [day, setDay] = useState(1)
  const [session, setSession] = useState('morning')
  const [progress, setProgress] = useState(readProgress)
  const [journal, setJournal] = useState(() => readProgress().journal || '')
  const study = plan[day - 1]
  const completed = progress.completed || []
  const isComplete = completed.includes(day + ':' + session)
  const completedCount = completed.filter(item => item.endsWith(':morning')).length
  const sessionPassage = session === 'morning' ? study[1] : study[2]
  const title = study[0]

  const updateProgress = (next) => {
    setProgress(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const toggleComplete = () => {
    const key = day + ':' + session
    const nextCompleted = isComplete ? completed.filter(item => item !== key) : [...completed, key]
    updateProgress({ ...progress, completed: nextCompleted, journal })
  }

  const saveJournal = (value) => {
    setJournal(value)
    updateProgress({ ...progress, journal: value })
  }

  const previousDay = () => setDay(value => Math.max(1, value - 1))
  const nextDay = () => setDay(value => Math.min(30, value + 1))
  const progressPercent = Math.round((completedCount / 30) * 100)

  return (
    <div className="faith-page">
      <button className="faith-back" type="button" onClick={() => window.dispatchEvent(new CustomEvent('evolv-open-dashboard-navigation'))}><ArrowLeft size={16}/> Back to EVOLV</button>
      <header className="faith-hero">
        <span className="faith-eyebrow"><Sparkles size={13}/> OPTIONAL PERSONAL GROWTH</span>
        <div className="faith-hero-mark"><BookOpen size={23}/></div>
        <h1>Faith</h1>
        <p>A quiet space to grow in your relationship with God, one day at a time.</p>
        <div className="faith-progress">
          <div><span>30-DAY JOURNEY</span><strong>{completedCount} of 30 mornings completed</strong></div>
          <div className="faith-progress-track"><span style={{ width: progressPercent + '%' }}/></div>
        </div>
      </header>

      <section className="faith-day-picker" aria-label="Choose a study day">
        <div className="faith-day-picker-head"><div><span className="faith-kicker">YOUR JOURNEY</span><h2>Day {day}<small> / 30</small></h2></div><div className="faith-day-arrows"><button type="button" onClick={previousDay} disabled={day === 1} aria-label="Previous day"><ChevronLeft size={18}/></button><button type="button" onClick={nextDay} disabled={day === 30} aria-label="Next day"><ChevronRight size={18}/></button></div></div>
        <div className="faith-day-grid">{plan.map((item,index)=>{const n=index+1;const done=completed.includes(n+':morning');return <button type="button" key={n} onClick={()=>setDay(n)} className={(day===n?'is-selected ':'')+(done?'is-done':'')} aria-label={'Day '+n+(done?', morning completed':'')}>{done?<Check size={13}/>:n}</button>})}</div>
      </section>

      <section className="faith-study-card">
        <div className="faith-study-top"><span className="faith-kicker">DAY {day} · {session === 'morning' ? 'MORNING DEVOTION' : 'EVENING REFLECTION'}</span><span className="faith-study-icon">{session === 'morning' ? <Sunrise size={18}/> : <Moon size={18}/>}</span></div>
        <h2>{title}</h2>
        <div className="faith-session-tabs"><button type="button" className={session==='morning'?'active':''} onClick={()=>setSession('morning')}><Sunrise size={16}/> Morning</button><button type="button" className={session==='night'?'active':''} onClick={()=>setSession('night')}><Moon size={16}/> Night</button></div>
        <div className="faith-passage"><BookOpen size={18}/><div><span>READ DIRECTLY FROM YOUR BIBLE</span><strong>{sessionPassage}</strong></div></div>
        <p className="faith-reading-note">Take your time with the passage. Read it slowly, preferably twice, and notice what stands out to you.</p>
        <div className="faith-insight"><span className="faith-kicker">TODAY'S THOUGHT</span><p>{study[3]}</p></div>
        <div className="faith-reflection"><span className="faith-kicker">REFLECT</span><p>{study[4]}</p></div>
        <div className="faith-action"><span className="faith-kicker">PUT IT INTO PRACTICE</span><p>{study[5]}</p></div>
        <div className="faith-prayer"><span className="faith-kicker">A SHORT PRAYER</span><p>{study[6]}</p></div>
        <button type="button" className={'faith-complete'+(isComplete?' is-complete':'')} onClick={toggleComplete}>{isComplete?<CheckCircle2 size={18}/>:<Check size={18}/ >}{isComplete?'Completed':'Mark this session complete'}</button>
      </section>

      <section className="faith-journal-card">
        <div><span className="faith-kicker">YOUR PRIVATE NOTES</span><h2><PenLine size={18}/> Spiritual journal</h2><p>Write what stood out, what you are praying about, or what you want to practise. Notes stay on this device.</p></div>
        <textarea value={journal} onChange={event=>saveJournal(event.target.value)} placeholder="What stood out to me today…"/>
      </section>
      <p className="faith-disclaimer">This is a personal reading companion, not a substitute for reading Scripture itself or for guidance from a trusted pastor or faith community.</p>
    </div>
  )
}
