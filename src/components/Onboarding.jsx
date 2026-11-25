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
const STEPS = ["about", "target", "time", "paywall"];
const DRAFT_KEY = "evolv-onboarding-v3-draft";

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
    <div className="ev-pct">{Math.round(p)}%</div><h1 className="ev-h">Building your{"\n"}plan…</h1><p className="ev-sub">Evolv AI is shaping your day around your goals.</p>
    <ul className="ev-card ev-list">{BUILD.map((t, i) => { const st = p >= (i + 1) * 25 ? "done" : i === active ? "live" : "wait"; return <li key={t} className={st}><span className="ev-dot">{st === "done" && <Tick />}</span>{t}{st === "live" && <em>…</em>}</li>; })}</ul>
  </div>;
}

export default function Onboarding({ initialScreen = "account", initialAuthMode = "signup", showPaywall = false, logo = "evolv", onAuth, onLogin, onPermissions, onComplete }) {
  const saved = readDraft();
  const ORDER = ["welcome", "about", "target", "time", "stay", "building", ...(showPaywall ? ["paywall"] : []), "account"];
  const [screen, setScreen] = useState(initialAuthMode === "login" ? "account" : (showPaywall && initialScreen === "welcome" && saved?.screen === "account" ? "paywall" : (saved?.screen && saved.screen !== "building" && ORDER.includes(saved.screen) ? saved.screen : initialScreen)));
  const [phase, setPhase] = useState("in");
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [accountMode, setAccountMode] = useState(initialAuthMode);
  const [emailAuth, setEmailAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const busyRef = useRef(false);
  const [d, setD] = useState({ email: "", role: "Professional", tasks: 6, hours: 8, unit: "hrs", now: 120, goal: 240, pace: "steady", budget: 20, session: "25–50 min", daily: "3", tools: ["Timer"], calendar: true, reminders: true, plan: "yearly", ...(saved?.data || {}) });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    // Discard stale drafts from the previous signup-first flow.
    localStorage.removeItem("evolv-onboarding-v2-draft");
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
  const back = screen === "account" ? () => go(showPaywall ? "paywall" : "stay", -1) : (i > 0 && screen !== "building" ? prev : null);
  const finish = async (plan, skipped = false) => {
    try {
      await onComplete?.({ ...d, plan: plan === undefined ? null : plan, skipped });
    } catch (error) {
      setErr(error?.message || "We couldn’t finish setting up your account. Please try again.");
      go("account", -1);
    }
  };
  const auth = async (provider) => {
    if (provider === "email" && !/^\S+@\S+\.\S+$/.test(d.email)) return setErr("Enter a valid email address.");
    if (provider === "email" && password.length < 8) return setErr("Your password must be at least 8 characters.");
    setErr("");
    setAuthMessage("");
    setBusy(true);
    try {
      if (provider === "google") {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ screen: "account", data: d }));
      }
      const result = await onAuth?.({ provider, email: d.email, password, preferences: d, mode: accountMode });
      if (result?.confirmationRequired) {
        setAuthMessage("Check your email for the confirmation link. Once confirmed, Evolv will finish setting up your account.");
      }
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
    <header className="ev-top ev-split ev-welcome-nav">
      <img className="ev-welcome-logo" src="/evolv-logo.svg" alt="Evolv" />
      <button type="button" className="ev-signin" onClick={() => { setAccountMode("login"); setErr(""); setAuthMessage(""); go("account"); }}>Sign in</button>
    </header>
    <div className="ev-welcome-carousel" aria-label="Explore Evolv" onScroll={(e) => setWelcomeSlide(Math.min(2, Math.max(0, Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))))}>
      <div className="ev-welcome-slide">
        <div className="ev-slide-orbit orbit-one" /><div className="ev-slide-orbit orbit-two" />
        <span className="ev-slide-icon">🌱</span><span className="ev-slide-float slide-float-one">✨</span><span className="ev-slide-float slide-float-two">☀️</span>
      </div>
      <div className="ev-welcome-slide">
        <div className="ev-slide-orbit orbit-one" /><div className="ev-slide-orbit orbit-two" />
        <span className="ev-slide-icon">🎯</span><span className="ev-slide-float slide-float-one">✦</span><span className="ev-slide-float slide-float-two">⏳</span>
      </div>
      <div className="ev-welcome-slide">
        <div className="ev-slide-orbit orbit-one" /><div className="ev-slide-orbit orbit-two" />
        <span className="ev-slide-icon">📖</span><span className="ev-slide-float slide-float-one">💡</span><span className="ev-slide-float slide-float-two">✦</span>
      </div>
    </div>
    <div className="ev-welcome-copy">
      <h1 className="ev-h">One day at a time.</h1>
      <div className="ev-carousel-dots" aria-hidden="true">{[0, 1, 2].map((n) => <i key={n} className={welcomeSlide === n ? "on" : ""} />)}</div>
    </div>
    <footer className="ev-foot">
      <button type="button" className="ev-btn dark" onClick={next}>Get started</button>
    </footer>
  </>;

  if (screen === "account") view = <>
    <header className="ev-top ev-account-nav">
      <button type="button" className="ev-back" onClick={() => { if (emailAuth) { setEmailAuth(false); setErr(""); setAuthMessage(""); } else back?.(); }} aria-label={emailAuth ? "Back to sign in options" : "Go back to onboarding"}><Chev /></button>
      <img className="ev-account-logo" src="/evolv-mark.svg" alt="Evolv" />
    </header>
    <div className="ev-body ev-acct">
      {!emailAuth ? <>
        <div className="ev-account-heading"><h1 className="ev-h">{accountMode === "login" ? "Welcome back." : <>Create your<br />Evolv account.</>}</h1><p className="ev-sub">{accountMode === "login" ? "Sign in to pick up where you left off." : "one step at a time…"}</p></div>
        <button type="button" className="ev-btn dark ev-google" onClick={() => auth("google")} disabled={busy}>
          <svg className="ev-google-icon" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/>
            <path fill="#34A853" d="M24 44c5.4 0 9.9-1.8 13.2-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.5 1.9-5 0-9.2-3.4-10.7-8H6.4v5.3A20 20 0 0 0 24 44Z"/>
            <path fill="#FBBC05" d="M13.3 27.9a12 12 0 0 1 0-7.8v-5.3H6.4a20 20 0 0 0 0 18.4l6.9-5.3Z"/>
            <path fill="#EA4335" d="M24 12.1c2.9 0 5.5 1 7.6 3l5.7-5.7C33.9 6.2 29.4 4 24 4A20 20 0 0 0 6.4 14.8l6.9 5.3c1.5-4.6 5.7-8 10.7-8Z"/>
          </svg>
          <span>{busy ? "Connecting…" : "Continue with Google"}</span>
        </button>
        <button type="button" className="ev-btn ev-github" onClick={() => auth("github")} disabled={busy}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.47 3.36 1.77.1-.72.39-1.22.7-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>
          <span>{busy ? "Connecting…" : "Continue with GitHub"}</span>
        </button>
        <div className="ev-or">OR</div>
        <button type="button" className="ev-btn ev-provider ev-email-choice" onClick={() => { setEmailAuth(true); setErr(""); setAuthMessage(""); }} disabled={busy}>
          <Mail /> <span>Continue with email</span>
        </button>
      </> : <>
        <div className="ev-account-heading"><h1 className="ev-h">{accountMode === "login" ? "Sign in with email." : "Your email, your Evolv."}</h1><p className="ev-sub">{accountMode === "login" ? "Enter your details to continue." : "Create your account and take it one day at a time."}</p></div>
        <label className="ev-field"><Mail /><input type="email" inputMode="email" autoComplete="email" placeholder="Email address" value={d.email} onChange={(e) => { set("email", e.target.value); setAuthMessage(""); }} /></label>
        <label className="ev-field ev-password-field"><Svg width="18" height="18"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Svg><input type="password" autoComplete={accountMode === "login" ? "current-password" : "new-password"} placeholder={accountMode === "login" ? "Password" : "Create password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="ev-err" role="alert">{err}</p>}
        {authMessage && <p className="ev-auth-message" role="status">{authMessage}</p>}
        <button type="button" className="ev-btn accent" onClick={() => auth("email")} disabled={busy}>{busy ? (accountMode === "login" ? "Signing in…" : "Creating account…") : (accountMode === "login" ? "Sign in" : "Create account")}</button>
        <p className="ev-fine">By continuing you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
      </>}
    </div>
    <footer className="ev-foot ev-login">{accountMode === "login" ? "New to Evolv?" : "Already have an account?"} <button type="button" onClick={() => { setAccountMode(accountMode === "login" ? "signup" : "login"); setErr(""); setAuthMessage(""); setPassword(""); }}>{accountMode === "login" ? "Create account" : "Log in"}</button></footer>
  </>;

  if (screen === "about") view = <Frame n={1} back={back} title={"Tell us about\nyou"} sub="We use this to shape your daily focus plan." cta="Continue" onCta={next} alt="Skip for now" onAlt={next}>
    <Pills items={ROLES} value={d.role} onPick={(v) => set("role", v)} className="ev-gap" />
    <div className="ev-grid2">
      <div className="ev-card"><small>Tasks per day</small><div className="ev-row"><strong className="ev-n">{d.tasks}</strong><Stepper value={d.tasks} min={1} max={30} onChange={(v) => set("tasks", v)} /></div></div>
      <div className="ev-card"><small>Work hours</small><div className="ev-row"><input className="ev-n" type="number" inputMode="numeric" min="1" max="16" aria-label="Work hours per day" value={d.hours} onChange={(e) => set("hours", Math.min(16, Math.max(1, +e.target.value || 1)))} /><em>hrs</em></div></div>
    </div>
    <FocusCard label="Current daily focus" mins={d.now} unit={d.unit} onUnit={(u) => set("unit", u)} onChange={(v) => set("now", v)} />
  </Frame>;

  if (screen === "target") view = <Frame n={2} back={back} title="Set your target" sub="Pick a pace that feels doable — you can change it later." cta="Continue" onCta={next} alt="Skip for now" onAlt={next}>
    <FocusCard label="Target daily focus" mins={d.goal} unit={d.unit} onChange={(v) => set("goal", v)} tag={delta !== 0 && <span className="ev-tag">{delta > 0 ? "↑" : "↓"} {d.unit === "hrs" ? (Math.abs(delta) / 60).toFixed(1) : Math.abs(delta)} {d.unit}</span>} />
    {PACES.map((p) => <button key={p.id} type="button" aria-pressed={d.pace === p.id} className={"ev-pace" + (d.pace === p.id ? " on" : "")} onClick={() => set("pace", p.id)}><span><b>{p.name}</b>{p.rec && <span className="ev-tag">Recommended</span>}<small>{delta > 0 ? `+${p.mins} min / week · Reach goal by ${when(p.mins)}` : "Keep your current focus"}</small></span><i className="ev-em">{p.emoji}</i></button>)}
  </Frame>;

  if (screen === "time") view = <Frame n={3} back={back} title="Time & focus" sub="Plans that fit your calendar and your energy." cta="Continue" onCta={next} alt="Skip for now" onAlt={next}>
    <div className="ev-card"><div className="ev-row"><small>Weekly focus budget</small><i className="ev-em">⏳</i></div><div className="ev-big l">{d.budget}<span>hrs / week</span></div><input type="range" className="ev-range" min="5" max="60" value={d.budget} aria-label="Weekly focus budget" style={{ "--p": ((d.budget - 5) / 55) * 100 + "%" }} onChange={(e) => set("budget", +e.target.value)} /><div className="ev-row ev-ends"><span>5 hrs</span><span>60 hrs</span></div></div>
    <h3 className="ev-label">Session length</h3><Chips items={SESSIONS} value={d.session} onPick={(v) => set("session", v)} />
    <h3 className="ev-label">Sessions per day</h3><Pills items={DAILY} value={d.daily} onPick={(v) => set("daily", v)} className="ev-seg" />
    <h3 className="ev-label">Focus tools</h3><Chips multi items={TOOLS} value={d.tools} onPick={(v) => set("tools", d.tools.includes(v) ? d.tools.filter((x) => x !== v) : [...d.tools, v])} />
  </Frame>;

  if (screen === "stay") view = <>
    <header className="ev-top"><button type="button" className="ev-back" onClick={prev} aria-label="Back"><Chev /></button></header>
    <div className="ev-body"><div className="ev-art"><span className="ev-disc">🎯</span><i className="ev-em l">📈</i><i className="ev-em r">⏰</i></div>
      <h1 className="ev-h">Stay on track,{"\n"}effortlessly</h1><p className="ev-sub">Evolv adjusts your plan when your schedule changes.</p>
      {PERMS.map((r) => <div key={r.k} className="ev-card ev-perm"><span className="ev-tile" style={{ background: r.bg }}>{r.e}</span><span><b>{r.t}</b><small>{r.s}</small></span><Switch on={d[r.k]} label={r.t} onClick={() => set(r.k, !d[r.k])} /></div>)}
    </div>
    <footer className="ev-foot"><button type="button" className="ev-btn dark" onClick={() => { onPermissions?.({ calendar: d.calendar, reminders: d.reminders }); next(); }}>Allow & continue</button><button type="button" className="ev-ghost" onClick={() => { setD((p) => ({ ...p, calendar: false, reminders: false })); onPermissions?.({ calendar: false, reminders: false }); next(); }}>Skip for now</button></footer>
  </>;

  if (screen === "building") view = <Building onDone={next} />;

  if (screen === "paywall") view = <>
    <header className="ev-top">
      <button type="button" className="ev-back" onClick={() => go("time", -1)} aria-label="Back to focus setup"><Chev /></button>
      <div className="ev-prog" aria-label="Step 4 of 4">{STEPS.map((_, i) => <i key={i} className="on" />)}</div>
    </header>
    <div className="ev-body">
      <div className="ev-step">Step 4 of 4</div>
      <h1 className="ev-h">Choose your{"\n"}Evolv plan</h1>
      <p className="ev-sub">One last step before creating your account. Choose the level of support that works for you.</p>
      <ul className="ev-feat">{PLUS.map((t) => <li key={t}><span className="ev-dot done"><Tick /></span>{t}</li>)}</ul>
      <div className="ev-plans">{[["yearly", "Yearly", "$3.33 / month"], ["monthly", "Monthly", "billed monthly"]].map(([k, n, s]) => <button key={k} type="button" aria-pressed={d.plan === k} className={"ev-plan" + (d.plan === k ? " on" : "")} onClick={() => set("plan", k)}>{k === "yearly" && <span className="ev-best">Best value</span>}<small>{n}</small><b>${PRICE[k]}</b><small>{s}</small></button>)}</div>
      <ul className="ev-card ev-time"><li className="on"><i /><span><b>Today</b><small>Full access to everything</small></span></li><li><i /><span><b>Day 5</b><small>We remind you before it ends</small></span></li><li><i /><span><b>Day 7</b><small>Trial ends — cancel anytime</small></span></li></ul>
    </div>
    <footer className="ev-foot"><button type="button" className="ev-btn dark" onClick={() => go("account")}>Continue</button></footer>
  </>;

  return <main className="ev-ob">{["🎯", "💡", "✅", "📝"].map((e, k) => <span key={k} className={"ev-bg b" + k} aria-hidden>{e}</span>)}<div className="ev-device"><div key={screen} className={"ev-stage " + phase} style={{ "--dir": dir }}>{view}</div></div></main>;
}
