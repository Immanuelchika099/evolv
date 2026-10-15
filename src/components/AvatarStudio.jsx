import { Check, X } from 'lucide-react'

export const DEFAULT_AVATAR = {
  presentation: 'androgynous',
  face: 'oval',
  skin: '#B97853',
  hair: 'curls',
  hairColor: '#211812',
  eyes: '#38251D',
  facialHair: 'none',
  accessory: 'none',
  glow: 'lime',
}

export const AVATAR_OPTIONS = {
  presentation: [{ id: 'feminine', label: 'Feminine' }, { id: 'masculine', label: 'Masculine' }, { id: 'androgynous', label: 'Androgynous' }],
  face: [{ id: 'oval', label: 'Oval' }, { id: 'round', label: 'Round' }, { id: 'slim', label: 'Slim' }, { id: 'angular', label: 'Angular' }, { id: 'square', label: 'Square' }, { id: 'heart', label: 'Heart' }],
  hair: [{ id: 'curls', label: 'Curly' }, { id: 'afro', label: 'Afro' }, { id: 'fade', label: 'Fade' }, { id: 'braids', label: 'Box braids' }, { id: 'cornrows', label: 'Cornrows' }, { id: 'locs', label: 'Locs' }, { id: 'bob', label: 'Bob' }, { id: 'long', label: 'Long' }, { id: 'bun', label: 'Bun' }, { id: 'ponytail', label: 'Ponytail' }, { id: 'waves', label: 'Waves' }, { id: 'shaved', label: 'Shaved' }],
  facialHair: [{ id: 'none', label: 'Clean-shaven' }, { id: 'mustache', label: 'Mustache' }, { id: 'beard', label: 'Beard' }, { id: 'goatee', label: 'Goatee' }],
  accessory: [{ id: 'none', label: 'None' }, { id: 'glasses', label: 'Glasses' }, { id: 'earrings', label: 'Earrings' }],
}
const SKINS = ['#F5D4B8', '#E9B995', '#D99A70', '#B97853', '#8D573D', '#603A2B', '#39251F']
const HAIRS = ['#171311', '#38251D', '#69452F', '#A56A3D', '#D2AD72', '#B64B35', '#7A4D8D', '#D7D1C7']
const EYES = ['#38251D', '#2E5945', '#4B7192', '#6B4C32']

function HairShape({ style, color }) {
  const common = { fill: color, stroke: color, strokeWidth: 2, strokeLinejoin: 'round' }
  if (style === 'shaved') return <path d="M38 55 Q34 18 64 17 Q94 18 90 55 Q83 31 64 31 Q45 31 38 55Z" {...common} />
  if (style === 'fade') return <path d="M37 52 Q33 20 64 19 Q95 20 91 52 L84 40 Q64 31 44 41Z" {...common} />
  if (style === 'afro') return <path d="M27 55 C16 43 24 23 39 21 C41 7 59 8 65 15 C79 4 94 19 92 29 C106 39 99 53 91 58 L85 42 Q64 25 43 42 L38 59Z" {...common} />
  if (style === 'braids') return <g {...common}><path d="M34 55 Q27 22 64 18 Q101 22 94 55 L90 87 L81 87 L82 47 Q64 32 46 47 L47 87 L38 87Z"/>{[0,1,2,3,4,5].map((n)=><path key={n} d={`M${43+n*7} 30 Q${39+n*7} 49 ${43+n*7} 70 L${42+n*7} 91`} fill="none" stroke="#000" strokeOpacity=".18" strokeWidth="2.4"/>)}</g>
  if (style === 'cornrows') return <g {...common}><path d="M34 56 Q28 22 64 18 Q100 22 94 56 L86 45 Q64 29 42 45Z"/>{[0,1,2,3,4].map(n=><path key={n} d={`M${42+n*9} 27 Q${48+n*6} 34 ${45+n*8} 43`} fill="none" stroke="#9A785D" strokeWidth="1.8" strokeLinecap="round"/>)}</g>
  if (style === 'locs') return <g {...common}><path d="M35 54 Q28 22 64 18 Q100 22 93 54 L87 76 L80 75 L82 45 Q64 30 45 45 L46 76 L39 76Z"/>{[0,1,2,3,4,5].map(n=><path key={n} d={`M${40+n*8} 31 Q${35+n*8} 47 ${41+n*8} 64 L${39+n*8} 79`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>)}</g>
  if (style === 'bob') return <path d="M29 57 Q24 18 64 18 Q104 18 99 58 L96 78 Q85 87 83 65 L83 45 Q64 32 45 45 L45 65 Q42 87 32 78Z" {...common} />
  if (style === 'long') return <path d="M30 57 Q24 18 64 18 Q104 18 98 57 L97 97 L85 99 L83 45 Q64 32 45 45 L43 99 L31 97Z" {...common} />
  if (style === 'bun') return <g {...common}><circle cx="64" cy="15" r="12"/><path d="M36 56 Q30 20 64 22 Q98 20 92 56 L84 44 Q64 31 44 44Z"/></g>
  if (style === 'ponytail') return <g {...common}><path d="M84 30 Q109 32 101 56 Q98 66 88 69 L84 60Z"/><path d="M36 56 Q30 20 64 20 Q95 20 92 55 L84 44 Q64 31 44 44Z"/></g>
  if (style === 'waves') return <path d="M34 57 Q27 21 47 22 Q55 11 66 21 Q78 10 86 26 Q99 27 92 57 L84 43 Q64 31 44 43Z" {...common} />
  return <path d="M35 56 Q29 21 64 19 Q99 21 93 56 L84 43 Q64 29 44 43Z" {...common} />
}

export function AvatarPortrait({ preferences = DEFAULT_AVATAR, className = '' }) {
  const a = { ...DEFAULT_AVATAR, ...preferences }
  const facePaths = {
    oval: 'M64 34 C45 34 39 49 41 67 C43 86 52 99 64 99 C76 99 85 86 87 67 C89 49 83 34 64 34Z',
    round: 'M64 34 C43 34 35 49 38 68 C40 87 51 98 64 98 C77 98 88 87 90 68 C93 49 85 34 64 34Z',
    slim: 'M64 34 C49 34 45 50 47 69 C49 87 56 100 64 100 C72 100 79 87 81 69 C83 50 79 34 64 34Z',
    angular: 'M64 34 L45 41 L40 63 L48 84 L64 99 L80 84 L88 63 L83 41Z',
    square: 'M45 39 Q64 31 83 39 L88 68 Q84 91 64 98 Q44 91 40 68Z',
    heart: 'M64 35 Q49 29 41 44 Q36 65 49 82 L64 99 L79 82 Q92 65 87 44 Q79 29 64 35Z',
  }
  const face = facePaths[a.face] || facePaths.oval
  const shortHair = ['fade', 'shaved', 'waves'].includes(a.hair)
  return <svg className={className} viewBox="0 0 128 142" role="img" aria-label="Customizable illustrated avatar">
    <ellipse cx="64" cy="133" rx="37" ry="5" fill="#000" opacity=".25" />
    <path d="M35 137 Q35 107 48 101 L80 101 Q94 109 94 137Z" fill={a.presentation === 'feminine' ? '#B8F34A' : '#8FBC42'} />
    <path d="M52 96 L52 108 Q64 120 76 108 L76 96Z" fill={a.skin} />
    <path d={face} fill={a.skin} />
    <ellipse cx="41" cy="68" rx="4" ry="7" fill={a.skin} /><ellipse cx="87" cy="68" rx="4" ry="7" fill={a.skin} />
    <HairShape style={a.hair} color={a.hairColor} />
    <path d="M49 61 Q54 58 58 61" fill="none" stroke="#422D24" strokeWidth="2" strokeLinecap="round" />
    <path d="M70 61 Q74 58 79 61" fill="none" stroke="#422D24" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="54" cy="67" rx="2.4" ry="3" fill={a.eyes} /><ellipse cx="74" cy="67" rx="2.4" ry="3" fill={a.eyes} />
    <path d="M64 68 L61 77 Q64 80 67 77" fill="none" stroke="#875943" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M56 85 Q64 91 72 85" fill="none" stroke="#884E46" strokeWidth="2" strokeLinecap="round" />
    {a.facialHair === 'mustache' && <path d="M54 81 Q59 77 64 82 Q69 77 74 81 Q72 87 64 85 Q56 87 54 81Z" fill={a.hairColor} />}
    {a.facialHair === 'beard' && <path d="M43 74 Q45 96 64 101 Q83 96 85 74 L79 86 Q64 94 49 86Z" fill={a.hairColor} />}
    {a.facialHair === 'goatee' && <path d="M58 84 Q64 89 70 84 L68 94 L64 97 L60 94Z" fill={a.hairColor} />}
    {a.accessory === 'glasses' && <g fill="none" stroke="#242522" strokeWidth="2.4"><rect x="43" y="60" width="17" height="14" rx="5"/><rect x="68" y="60" width="17" height="14" rx="5"/><path d="M60 65 L68 65 M43 64 L38 62 M85 64 L90 62"/></g>}
    {a.accessory === 'earrings' && <g fill="#D6BD82" stroke="#D6BD82"><circle cx="40" cy="79" r="2.5"/><circle cx="88" cy="79" r="2.5"/></g>}
    {!shortHair && <path d="M44 44 Q64 28 84 44" fill="none" stroke={a.hairColor} strokeWidth="3" strokeLinecap="round" />}
  </svg>
}

function OptionGrid({ label, value, options, onChange, colors = false }) {
  return <div className="avatar-studio-field">
    <span className="avatar-studio-label">{label}</span>
    <div className={`avatar-studio-options ${colors ? 'is-colors' : ''}`}>
      {options.map(option => <button type="button" key={option.id} title={option.label} aria-label={option.label} aria-pressed={value === option.id} className={value === option.id ? 'is-selected' : ''} onClick={() => onChange(option.id)}>
        {colors ? <span className="avatar-color-dot" style={{ background: option.id }} /> : <span>{option.label}</span>}
        {value === option.id && <Check size={14} />}
      </button>)}
    </div>
  </div>
}

export function AvatarStudio({ preferences, onChange, onClose }) {
  const a = { ...DEFAULT_AVATAR, ...preferences }
  const set = (key, value) => onChange({ ...a, [key]: value })
  const colorOptions = (items) => items.map(color => ({ id: color, label: color }))
  return <div className="evolv-avatar-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="evolv-avatar-editor avatar-studio" role="dialog" aria-modal="true" aria-labelledby="evolv-avatar-title">
      <button type="button" className="evolv-avatar-close" onClick={onClose} aria-label="Close avatar editor"><X size={19} /></button>
      <span className="calm-section-kicker">MAKE IT YOURS</span><h2 id="evolv-avatar-title">Your avatar</h2>
      <p>Build a look that feels like you. Every choice updates your preview.</p>
      <div className={`avatar-studio-preview glow-${a.glow}`}><span /><AvatarPortrait preferences={a} /></div>
      <OptionGrid label="Presentation" value={a.presentation} options={AVATAR_OPTIONS.presentation} onChange={v => set('presentation', v)} />
      <OptionGrid label="Face shape" value={a.face} options={AVATAR_OPTIONS.face} onChange={v => set('face', v)} />
      <OptionGrid label="Hair style" value={a.hair} options={AVATAR_OPTIONS.hair} onChange={v => set('hair', v)} />
      <OptionGrid label="Skin tone" value={a.skin} options={colorOptions(SKINS)} colors onChange={v => set('skin', v)} />
      <OptionGrid label="Hair color" value={a.hairColor} options={colorOptions(HAIRS)} colors onChange={v => set('hairColor', v)} />
      <OptionGrid label="Eye color" value={a.eyes} options={colorOptions(EYES)} colors onChange={v => set('eyes', v)} />
      <OptionGrid label="Facial hair" value={a.facialHair} options={AVATAR_OPTIONS.facialHair} onChange={v => set('facialHair', v)} />
      <OptionGrid label="Accessories" value={a.accessory} options={AVATAR_OPTIONS.accessory} onChange={v => set('accessory', v)} />
      <OptionGrid label="Ambient glow" value={a.glow} options={[{id:'lime',label:'Lime'},{id:'violet',label:'Violet'},{id:'none',label:'Off'}]} onChange={v => set('glow', v)} />
      <button type="button" className="evolv-avatar-done" onClick={onClose}>Save look</button>
      <small className="evolv-avatar-note">Your look is saved on this device.</small>
    </section>
  </div>
}
