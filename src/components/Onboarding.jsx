import { useEffect, useRef, useState } from "react";
import "./Onboarding.css";

const ROLES = ["Student", "Professional", "Creator"];
const PACES = [
  { id: "relaxed", name: "Relaxed", mins: 15, emoji: "🌿" },
  { id: "steady", name: "Steady", mins: 30, emoji: "🎯", rec: true },
  { id: "ambitious", name: "Ambitious", mins: 45, emoji: "🔥" },
];
const SESSIONS = ["Under 25 min", "25–50 min", "50–90 min", "90+ min"];
const DAILY = ["2", "3", "3 + breaks", "4+"];
const TOOLS = ["Timer", "Notes", "Calendar", "Checklist"];
const BUILD = ["Goals & priorities", "Focus hours & rhythm", "Tasks for your time budget", "Weekly planner"];
const PERMS = [
  { k: "calendar", e: "🗓️", bg: "#DCEBD3", t: "Sync your calendar", s: "Fit focus blocks around meetings and deadlines." },
  { k: "reminders", e: "⏰", bg: "#FBEAC2", t: "Turn on reminders", s: "Gentle nudges for tasks, breaks and check-ins." },
];
const PLUS = ["Unlimited AI planning", "A fresh focus plan every week", "Smart reminders & calendar sync", "Shared spaces for up to 6"];
const PRICE = { yearly: 39.99, monthly: 7.99 };
const STEPS = ["about", "target", "time"];
const DRAFT_KEY = "evolv-onboarding-v2-draft";

const Svg = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p} />;
const Chev = () => <Svg width="18" height="18"><path d="M15 5l-7 7 7 7" /></Svg>;
const Tick = () => <Svg width="13" height="13" stroke="#fff" strokeWidth="3.2"><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
const Mail = () => <Svg width="18" height="18" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7.5l8.5 6 8.5-6" /></Svg>;

const readDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); }
  catch { return null; }
};

const Pills = ({ items, value, onPick, className = "" }) => (
  <div className={"ev-pills " + className}>
    {items.map((t) => <button key={t} type="button" aria-pressed={value === t} className={value === t ? "on" : ""} onClick={() => onPick(t)}>{t}</button>)}
  </div>
);

const Chips = ({ items, value, onPick, multi }) => (
  <div className="ev-chips">
    {items.map((t) => {
      const on = multi ? value.includes(t) : value === t;
      return <button key={t} type="button" aria-pressed={on} className={on ? "on" : ""} onClick={() => onPick(t)}>{t}</button>;
    })}
  </div>
);

const Switch = ({ on, onClick, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className="ev-switch" onClick={onClick} />;

function Stepper({ value, onChange, min, max }) {
  const bump = (d) => onChange(Math.min(max, Math.max(min, value + d)));
  return <span className="ev-stepper"><button type="button" aria-label="Decrease" onClick={() => bump(-1)}>−</button><button type="button" aria-label="Increase" onClick={() => bump(1)}>+</button></span>;
}

function Ruler({ value, min, max, step, onChange, label }) {
  const n = Math.round((max - min) / step);
  const idx = Math.round((value - min) / step);
  const [drag, setDrag] = useState(null);
  const pos = drag ? drag.pos : idx;
  const move = (e) => {
    if (!drag) return;
    const p = Math.min(n, Math.max(0, drag.i0 - (e.clientX - drag.x0) / 10));
    setDrag({ ...drag, pos: p });
    onChange(min + Math.round(p) * step);
  };
  const key = (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(min, value + d * step)));
  };
  return <div className="ev-ruler" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} onKeyDown={key} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ x0: e.clientX, i0: idx, pos: idx }); }} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
    <div className={"ev-ruler__track" + (drag ? " is-drag" : "")} style={{ transform: `translateX(${-pos * 10}px)` }}>{Array.from({ length: n + 1 }, (_, i) => <i key={i} className={i % 5 === 0 ? "major" : undefined} />)}</div>
    <b className="ev-ruler__mark" />
  </div>;
}

function FocusCard({ label, mins, unit, onUnit, onChange, tag }) {
  const hrs = unit === "hrs";
  return <div className="ev-card ev-focus">
    <div className="ev-row"><small>{label}</small>{onUnit && <span className="ev-unit">{["hrs", "min"].map((u) => <button key={u} type="button" aria-pressed={unit === u} className={unit === u ? "on" : ""} onClick={() => onUnit(u)}>{u}</button>)}</span>}</div>
    <div className="ev-big">{hrs ? (mins / 60).toFixed(1) : mins}<span>{unit}</span>{tag}</div>
    <Ruler value={mins} min={30} max={720} step={6} onChange={onChange} label={label} />
  </div>;
}

function Frame({ n, back, title, sub, cta, onCta, alt, onAlt, children }) {
  return <>
    <header className="ev-top">{back && <button type="button" className="ev-back" onClick={back} aria-label="Back"><Chev /></button>}{n && <div className="ev-prog" aria-hidden>{STEPS.map((_, i) => <i key={i} className={i < n ? "on" : ""} />)}</div>}</header>
    <div className="ev-body">{n && <div className="ev-step">Step {n} of {STEPS.length}</div>}<h1 className="ev-h">{title}</h1><p className="ev-sub">{sub}</p>{children}</div>
    <footer className="ev-foot"><button type="button" className="ev-btn dark" onClick={onCta}>{cta}</button>{alt && <button type="button" className="ev-ghost" onClick={onAlt}>{alt}</button>}</footer>
  </>;
}

function Building({ onDone }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((v) => Math.min(100, v + 1)), 45); return () => clearInterval(t); }, []);
  useEffect(() => { if (p === 100) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); } }, [p, onDone]);
  const C = 2 * Math.PI * 88;
  const active = BUILD.findIndex((_, i) => p < (i + 1) * 25);
  return <div className="ev-body ev-center">
    <div className="ev-ring"><svg viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="88" strokeDasharray={`${(p / 100) * C} ${C}`} /></svg><span className="ev-core">🧠</span><i className="ev-em f1">📝</i><i className="ev-em f2">💡</i><i className="ev-em f3">✅</i><i className="ev-em f4">⏰</i></div>
    <div className="ev-pct">{Math.round(p)}%</div><h1 className="ev-h">Building your{"\n"}plan…</h1><p className="ev-sub">EVOLV AI is shaping your day around your goals.</p>
    <ul className="ev-card ev-list">{BUILD.map((t, i) => { const st = p >= (i + 1) * 25 ? "done" : i === active ? "live" : "wait"; return <li key={t} className={st}><span className="ev-dot">{st === "done" && <Tick />}</span>{t}{st === "live" && <em>…</em>}</li>; })}</ul>
  </div>;
}

export default function Onboarding({ initialScreen = "account", showPaywall = false, logo = "evolv", onAuth, onLogin, onPermissions, onComplete }) {
  const saved = readDraft();
  const ORDER = ["welcome", "account", "about", "target", "time", "stay", "building", ...(showPaywall ? ["paywall"] : [])];
  const [screen, setScreen] = useState(saved?.screen && saved.screen !== "building" && ORDER.includes(saved.screen) ? saved.screen : initialScreen);
  const [phase, setPhase] = useState("in");
  const [dir, setDir] = useState(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [d, setD] = useState({ email: "", role: "Professional", tasks: 6, hours: 8, unit: "hrs", now: 120, goal: 240, pace: "steady", budget: 20, session: "25–50 min", daily: "3", tools: ["Timer"], calendar: true, reminders: true, plan: "yearly", ...(saved?.data || {}) });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    // Building is a transient animation, never a resumable onboarding step.
    if (screen !== "building") localStorage.setItem(DRAFT_KEY, JSON.stringify({ screen, data: d }));
  }, [screen, d]);

  const go = (to, dr = 1) => {
    if (busyRef.current || !to) return;
    busyRef.current = true; setDir(dr); setPhase("out");
    setTimeout(() => { setScreen(to); setPhase("in"); busyRef.current = false; }, 240);
  };
  const i = ORDER.indexOf(screen);
  const next = () => (i < ORDER.length - 1 ? go(ORDER[i + 1]) : finish());
  const prev = () => go(ORDER[i - 1], -1);
  const back = i > 0 ? prev : null;
  const finish = async (plan, skipped = false) => {
    try {
      await onComplete?.({ ...d, plan: plan === undefined ? null : plan, skipped });
    } catch (error) {
      setErr(error?.message || "We couldn’t finish setting up your account. Please try again.");
      go("account", -1);
    }
  };
  const skipAll = () => finish(null, true);

  const auth = async (provider) => {
    if (provider === "email" && !/^\S+@\S+\.\S+$/.test(d.email)) return setErr("Enter a valid email address.");
    setErr("");
    setBusy(true);
    try {
      if (provider === "google") {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ screen: "about", data: d }));
      }
      await onAuth?.({ provider, email: d.email });
      if (provider === "email") next();
    } catch (e) {
      setErr(e?.message || "Couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const delta = d.goal - d.now;
  const when = (m) => { const t = new Date(); t.setDate(t.getDate() + Math.ceil(delta / m) * 7); return t.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
  const price = PRICE[d.plan];

  let view = null;
  if (screen === "welcome") view = <>
    <header className="ev-top ev-split">
      <span className="ev-logo">{logo}</span>
      <button type="button" className="ev-signin" onClick={onLogin}>Sign in</button>
    </header>
    <div className="ev-hero2" aria-hidden>
      {["🌱", "🧠", "🎯", "📖", "☀️", "⏳"].map((e, k) => <i key={k} className={"ev-tile2 t" + k}>{e}</i>)}
    </div>
    <div className="ev-body ev-welcome">
      <p className="ev-kicker">A calmer way to grow</p>
      <h1 className="ev-h">Make room for{"\n"}your next step.</h1>
      <p className="ev-sub">Build better routines, stay close to what matters, and make progress one day at a time.</p>
    </div>
    <footer className="ev-foot">
      <button type="button" className="ev-btn dark" onClick={next}>Let’s get started →</button>
      <p className="ev-fine">A little progress goes a long way.</p>
    </footer>
  </>;

  if (screen === "account") view = <>
    <div className="ev-account-hero"><img className="ev-logo-mark" src="/evolv-logo.svg" alt="EVOLV" /><i className="ev-em s1">💡</i><i className="ev-em s2">🎯</i><i className="ev-em s3">📝</i></div>
    <div className="ev-body ev-acct">
      <h1 className="ev-h">Create your{"\n"}account</h1><p className="ev-sub">Save your goals and sync them across devices.</p>
      <button type="button" className="ev-btn dark" onClick={() => auth("google")} disabled={busy}>{busy ? "Connecting…" : "Continue with Google"}</button>
      <div className="ev-or">or</div>
      <label className="ev-field"><Mail /><input type="email" inputMode="email" autoComplete="email" placeholder="Email address" value={d.email} onChange={(e) => set("email", e.target.value)} /></label>
      {err && <p className="ev-err" role="alert">{err}</p>}
      <button type="button" className="ev-btn accent" onClick={() => auth("email")} disabled={busy}>Continue with email</button>
      <p className="ev-fine">By continuing you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
    </div>
    <footer className="ev-foot ev-login">Already have an account? <button type="button" onClick={onLogin}>Log in</button></footer>
  </>;

  if (screen === "about") view = <Frame n={1} back={back} title={"Tell us about\nyou"} sub="We use this to shape your daily focus plan." cta="Continue" onCta={next} alt="Skip for now" onAlt={skipAll}>
    <Pills items={ROLES} value={d.role} onPick={(v) => set("role", v)} className="ev-gap" />
    <div className="ev-grid2">
      <div className="ev-card"><small>Tasks per day</small><div className="ev-row"><strong className="ev-n">{d.tasks}</strong><Stepper value={d.tasks} min={1} max={30} onChange={(v) => set("tasks", v)} /></div></div>
      <div className="ev-card"><small>Work hours</small><div className="ev-row"><input className="ev-n" type="number" inputMode="numeric" min="1" max="16" aria-label="Work hours per day" value={d.hours} onChange={(e) => set("hours", Math.min(16, Math.max(1, +e.target.value || 1)))} /><em>hrs</em></div></div>
    </div>
    <FocusCard label="Current daily focus" mins={d.now} unit={d.unit} onUnit={(u) => set("unit", u)} onChange={(v) => set("now", v)} />
  </Frame>;

  if (screen === "target") view = <Frame n={2} back={back} title="Set your target" sub="Pick a pace that feels doable — you can change it later." cta="Continue" onCta={next} alt="Skip for now" onAlt={skipAll}>
    <FocusCard label="Target daily focus" mins={d.goal} unit={d.unit} onChange={(v) => set("goal", v)} tag={delta !== 0 && <span className="ev-tag">{delta > 0 ? "↑" : "↓"} {d.unit === "hrs" ? (Math.abs(delta) / 60).toFixed(1) : Math.abs(delta)} {d.unit}</span>} />
    {PACES.map((p) => <button key={p.id} type="button" aria-pressed={d.pace === p.id} className={"ev-pace" + (d.pace === p.id ? " on" : "")} onClick={() => set("pace", p.id)}><span><b>{p.name}</b>{p.rec && <span className="ev-tag">Recommended</span>}<small>{delta > 0 ? `+${p.mins} min / week · Reach goal by ${when(p.mins)}` : "Keep your current focus"}</small></span><i className="ev-em">{p.emoji}</i></button>)}
  </Frame>;

  if (screen === "time") view = <Frame n={3} back={back} title="Time & focus" sub="Plans that fit your calendar and your energy." cta="Continue" onCta={next} alt="Skip for now" onAlt={skipAll}>
    <div className="ev-card"><div className="ev-row"><small>Weekly focus budget</small><i className="ev-em">⏳</i></div><div className="ev-big l">{d.budget}<span>hrs / week</span></div><input type="range" className="ev-range" min="5" max="60" value={d.budget} aria-label="Weekly focus budget" style={{ "--p": ((d.budget - 5) / 55) * 100 + "%" }} onChange={(e) => set("budget", +e.target.value)} /><div className="ev-row ev-ends"><span>5 hrs</span><span>60 hrs</span></div></div>
    <h3 className="ev-label">Session length</h3><Chips items={SESSIONS} value={d.session} onPick={(v) => set("session", v)} />
    <h3 className="ev-label">Sessions per day</h3><Pills items={DAILY} value={d.daily} onPick={(v) => set("daily", v)} className="ev-seg" />
    <h3 className="ev-label">Focus tools</h3><Chips multi items={TOOLS} value={d.tools} onPick={(v) => set("tools", d.tools.includes(v) ? d.tools.filter((x) => x !== v) : [...d.tools, v])} />
  </Frame>;

  if (screen === "stay") view = <>
    <header className="ev-top"><button type="button" className="ev-back" onClick={prev} aria-label="Back"><Chev /></button></header>
    <div className="ev-body"><div className="ev-art"><span className="ev-disc">🎯</span><i className="ev-em l">📈</i><i className="ev-em r">⏰</i></div>
      <h1 className="ev-h">Stay on track,{"\n"}effortlessly</h1><p className="ev-sub">EVOLV adjusts your plan when your schedule changes.</p>
      {PERMS.map((r) => <div key={r.k} className="ev-card ev-perm"><span className="ev-tile" style={{ background: r.bg }}>{r.e}</span><span><b>{r.t}</b><small>{r.s}</small></span><Switch on={d[r.k]} label={r.t} onClick={() => set(r.k, !d[r.k])} /></div>)}
    </div>
    <footer className="ev-foot"><button type="button" className="ev-btn dark" onClick={() => { onPermissions?.({ calendar: d.calendar, reminders: d.reminders }); next(); }}>Allow & continue</button><button type="button" className="ev-ghost" onClick={() => { setD((p) => ({ ...p, calendar: false, reminders: false })); onPermissions?.({ calendar: false, reminders: false }); next(); }}>Not now</button></footer>
  </>;

  if (screen === "building") view = <Building onDone={next} />;

  if (screen === "paywall") view = <>
    <header className="ev-top ev-split"><span className="ev-tag big">✨ 7 days free</span><button type="button" className="ev-back" onClick={() => finish(null)} aria-label="Close"><Svg width="18" height="18"><path d="M6 6l12 12M18 6L6 18" /></Svg></button></header>
    <div className="ev-body"><h1 className="ev-h">Unlock{"\n"}EVOLV Plus</h1><ul className="ev-feat">{PLUS.map((t) => <li key={t}><span className="ev-dot done"><Tick /></span>{t}</li>)}</ul>
      <div className="ev-plans">{[["yearly", "Yearly", "$3.33 / month"], ["monthly", "Monthly", "billed monthly"]].map(([k, n, s]) => <button key={k} type="button" aria-pressed={d.plan === k} className={"ev-plan" + (d.plan === k ? " on" : "")} onClick={() => set("plan", k)}>{k === "yearly" && <span className="ev-best">Best value</span>}<small>{n}</small><b>${PRICE[k]}</b><small>{s}</small></button>)}</div>
      <ul className="ev-card ev-time"><li className="on"><i /><span><b>Today</b><small>Full access to everything</small></span></li><li><i /><span><b>Day 5</b><small>We remind you before it ends</small></span></li><li><i /><span><b>Day 7</b><small>Trial ends — cancel anytime</small></span></li></ul>
    </div>
    <footer className="ev-foot"><button type="button" className="ev-btn dark" onClick={() => finish(d.plan)}>Start 7-day free trial</button><p className="ev-fine">Then ${price}/{d.plan === "yearly" ? "year" : "month"}. Cancel anytime in Settings.</p></footer>
  </>;

  return <main className="ev-ob">{["🎯", "💡", "✅", "📝"].map((e, k) => <span key={k} className={"ev-bg b" + k} aria-hidden>{e}</span>)}<div className="ev-device"><div key={screen} className={"ev-stage " + phase} style={{ "--dir": dir }}>{view}</div></div></main>;
}
