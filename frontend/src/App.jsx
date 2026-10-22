import { useCallback, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const blankSpeech = { title: "", topic: "", description: "", duration: 5, category: "General" };
const blankPractice = { speech: "none", duration: 10, confidence: 3, notes: "" };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("pspt_token") || "");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("pspt_user") || "null"));
  const [authMode, setAuthMode] = useState("login");
 const [auth, setAuth] = useState({
  name: "Yashwanth",
  email: "yashwanth@gmail.com",
  password: ""
});
  const [page, setPage] = useState("dashboard");
  const [speeches, setSpeeches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState({ totalSessions: 0, totalMinutes: 0, averageConfidence: 0 });
  const [speechForm, setSpeechForm] = useState(blankSpeech);
  const [practiceForm, setPracticeForm] = useState(blankPractice);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [speechData, sessionData, progressData] = await Promise.all([
      api("/speeches"), api("/practices"), api("/practices/progress"),
    ]);
    setSpeeches(speechData.speeches || []);
    setSessions(sessionData.sessions || []);
    setProgress(progressData);
  }, [api, token]);

  useEffect(() => {
    if (!token) return;
    refresh().catch((e) => setMessage(e.message));
  }, [token, refresh]);

  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const data = await api(endpoint, { method: "POST", body: JSON.stringify(auth) });
      localStorage.setItem("pspt_token", data.token);
      localStorage.setItem("pspt_user", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setPage("dashboard");
      setMessage(data.message || "Welcome!");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("pspt_token"); localStorage.removeItem("pspt_user");
    setToken(""); setUser(null); setSpeeches([]); setSessions([]); setPage("dashboard"); setMessage("");
  }

  async function submitSpeech(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const path = editingId ? `/speeches/${editingId}` : "/speeches";
      await api(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(speechForm) });
      setMessage(editingId ? "Speech updated." : "Speech added.");
      setSpeechForm(blankSpeech); setEditingId(""); await refresh(); setPage("speeches");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  function startEdit(speech) {
    setSpeechForm({ title: speech.title, topic: speech.topic, description: speech.description || "", duration: speech.duration || 5, category: speech.category || "General" });
    setEditingId(speech._id); setPage("add-speech");
  }

  async function removeSpeech(id) {
    if (!window.confirm("Delete this speech?")) return;
    try { await api(`/speeches/${id}`, { method: "DELETE" }); await refresh(); setMessage("Speech deleted."); }
    catch (err) { setMessage(err.message); }
  }

  async function submitPractice(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      await api("/practices", { method: "POST", body: JSON.stringify(practiceForm) });
      setPracticeForm(blankPractice); await refresh(); setPage("history"); setMessage("Practice session saved!");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  const filteredSpeeches = useMemo(() => speeches.filter((s) =>
    `${s.title} ${s.topic} ${s.category}`.toLowerCase().includes(search.toLowerCase())), [speeches, search]);

  if (!token) return <AuthScreen mode={authMode} setMode={setAuthMode} auth={auth} setAuth={setAuth} onSubmit={submitAuth} busy={busy} message={message} />;

  const nav = [
    { id: "dashboard", icon: "▦", label: "Overview" },
    { id: "speeches", icon: "▤", label: "My speeches" },
    { id: "add-speech", icon: "＋", label: "Plan a speech" },
    { id: "practice", icon: "◷", label: "Log practice" },
    { id: "history", icon: "↗", label: "Practice history" },
  ];
  const titleMap = { dashboard: "Your speaking space", speeches: "My speeches", "add-speech": editingId ? "Edit speech" : "Plan a speech", practice: "Log a practice session", history: "Practice history" };

  return <div className="layout">
    <aside className="sidebar">
      <a className="logo" href="#" onClick={(e) => { e.preventDefault(); setPage("dashboard"); }}><span className="logo-mark">S</span><span>Speak<span className="logo-accent">Up</span><small>PRACTICE WITH PURPOSE</small></span></a>
      <div className="nav-caption">YOUR WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.id} className={`nav-link ${page === n.id ? "selected" : ""}`} onClick={() => { setPage(n.id); setMessage(""); if (n.id === "add-speech" && !editingId) setSpeechForm(blankSpeech); }}><span className="nav-icon">{n.icon}</span>{n.label}{n.id === "speeches" && <span className="nav-count">{speeches.length}</span>}</button>)}</nav>
      <div className="sidebar-tip"><span>✦</span><strong>Small steps, strong voice.</strong><p>Every practice session is progress. Keep showing up.</p></div>
      <div className="profile-row"><div className="avatar">{user?.name?.[0]?.toUpperCase() || "S"}</div><div className="profile-info"><strong>{user?.name || "Speaker"}</strong><small>{user?.email || ""}</small></div><button className="icon-button" title="Log out" onClick={logout}>↪</button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><div className="breadcrumb">WORKSPACE <span>/</span> {titleMap[page]?.toUpperCase()}</div><h1>{titleMap[page]}</h1></div><div className="top-actions"><span className="status-dot">● <span>Personal workspace</span></span><div className="top-avatar">{user?.name?.[0]?.toUpperCase() || "S"}</div></div></header>
      {message && <div className="notice"><span>✦</span>{message}<button onClick={() => setMessage("")}>×</button></div>}

      {page === "dashboard" && <div className="page-content">
        <section className="welcome-banner"><div className="banner-copy"><div className="banner-kicker"><span>✦</span> YOUR VOICE MATTERS</div><h2>Confidence isn't given.<br /><em>It's practiced.</em></h2><p>Make room for your ideas. Plan your next speech, practice with intention, and see how far you've come.</p><button className="button button-light" onClick={() => { setSpeechForm(blankSpeech); setEditingId(""); setPage("add-speech"); }}>＋ Plan a speech <span>→</span></button></div><div className="banner-art"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-disc"><span>〰</span><div className="mic">🎙</div></div><span className="spark spark-a">✦</span><span className="spark spark-b">✧</span><span className="art-note note-a">SPEAK</span><span className="art-note note-b">GROW</span></div><div className="banner-index">01 — YOUR JOURNEY</div></section>

        <div className="section-title"><div><span className="overline">AT A GLANCE</span><h2>Your progress snapshot</h2></div><span className="updated-label"><span>●</span> Live from your activity</span></div>
        <section className="metric-grid">
          <Metric icon="▤" tone="lavender" label="Speeches planned" value={speeches.length} foot="Topics in your library" />
          <Metric icon="◷" tone="peach" label="Minutes practiced" value={progress.totalMinutes} foot="Total focused practice" />
          <Metric icon="↗" tone="mint" label="Practice sessions" value={progress.totalSessions} foot="Every session counts" />
          <Metric icon="✦" tone="blue" label="Confidence average" value={`${progress.averageConfidence || 0}/5`} foot="Your self-rated confidence" />
        </section>

        <div className="section-title recent-heading"><div><span className="overline">KEEP THE MOMENTUM</span><h2>Recently planned speeches</h2></div><button className="inline-link" onClick={() => setPage("speeches")}>View all speeches <span>→</span></button></div>
        {speeches.length ? <div className="speech-grid">{speeches.slice(0, 3).map(s => <SpeechCard key={s._id} speech={s} onEdit={startEdit} onDelete={removeSpeech} />)}</div> : <Empty icon="✧" title="Your next great speech starts here" text="Add your first topic and turn an idea into a confident delivery." action="Plan your first speech" onClick={() => setPage("add-speech")} />}
        <div className="bottom-quote"><span>“</span><p>Great speakers aren't born in a day. They're built one practice at a time.</p><small>YOUR DAILY REMINDER</small></div>
      </div>}

      {page === "speeches" && <div className="page-content">
        <div className="page-intro-row"><div><span className="overline">YOUR SPEAKING LIBRARY</span><p>Every idea deserves a voice. Keep your speech plans in one place.</p></div><button className="button button-primary" onClick={() => { setSpeechForm(blankSpeech); setEditingId(""); setPage("add-speech"); }}>＋ New speech</button></div>
        <div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, topic or category..." /></div><span className="result-count">{filteredSpeeches.length} {filteredSpeeches.length === 1 ? "speech" : "speeches"}</span></div>
        {filteredSpeeches.length ? <div className="speech-grid">{filteredSpeeches.map(s => <SpeechCard key={s._id} speech={s} onEdit={startEdit} onDelete={removeSpeech} />)}</div> : <Empty icon="⌕" title={search ? "No matching speeches" : "Your library is waiting"} text={search ? "Try a different search term." : "Add a speech topic to start your library."} action={search ? "" : "Create a speech"} onClick={() => setPage("add-speech")} />}
      </div>}

      {page === "add-speech" && <div className="page-content form-page"><div className="form-intro"><div className="form-symbol">✎</div><div><span className="overline">IDEA → OUTLINE → DELIVERY</span><h2>{editingId ? "Refine your speech" : "Give your idea a stage"}</h2><p>Capture the essentials now. You can always polish your message later.</p></div></div><form className="panel form-panel" onSubmit={submitSpeech}>
        <div className="form-section-label"><span>01</span> SPEECH DETAILS</div>
        <div className="field"><label>Speech title <b>*</b></label><input required maxLength="120" value={speechForm.title} onChange={e => setSpeechForm({ ...speechForm, title: e.target.value })} placeholder="e.g. The art of being understood" /></div>
        <div className="field"><label>Speaking topic <b>*</b></label><input required maxLength="180" value={speechForm.topic} onChange={e => setSpeechForm({ ...speechForm, topic: e.target.value })} placeholder="What's the main idea you want to share?" /></div>
        <div className="field-row"><div className="field"><label>Planned duration</label><div className="input-suffix"><input required type="number" min="1" max="240" value={speechForm.duration} onChange={e => setSpeechForm({ ...speechForm, duration: e.target.value })} /><span>minutes</span></div></div><div className="field"><label>Category</label><select value={speechForm.category} onChange={e => setSpeechForm({ ...speechForm, category: e.target.value })}>{["General", "Education", "Technology", "Personal Development", "Career", "Health", "Environment", "Storytelling"].map(c => <option key={c}>{c}</option>)}</select></div></div>
        <div className="field"><label>Notes and key points</label><textarea rows="5" value={speechForm.description} onChange={e => setSpeechForm({ ...speechForm, description: e.target.value })} placeholder="Add your opening idea, key points, examples, or a strong closing..." /></div>
        <div className="form-footer"><span><b>*</b> Required fields</span><div><button type="button" className="button button-quiet" onClick={() => { setEditingId(""); setSpeechForm(blankSpeech); setPage("speeches"); }}>Cancel</button><button disabled={busy} className="button button-primary">{busy ? "Saving..." : editingId ? "Save changes →" : "Save speech →"}</button></div></div>
      </form></div>}

      {page === "practice" && <div className="page-content form-page"><div className="form-intro"><div className="form-symbol mint-symbol">◷</div><div><span className="overline">SHOW UP FOR YOURSELF</span><h2>One session at a time.</h2><p>Record your practice. Progress comes from consistency, not perfection.</p></div></div><form className="panel form-panel" onSubmit={submitPractice}>
        <div className="form-section-label"><span>01</span> PRACTICE SESSION</div>
        <div className="field"><label>Speech practiced</label><select value={practiceForm.speech} onChange={e => setPracticeForm({ ...practiceForm, speech: e.target.value })}><option value="none">General speaking practice</option>{speeches.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}</select></div>
        <div className="field-row"><div className="field"><label>Practice duration <b>*</b></label><div className="input-suffix"><input type="number" min="1" max="600" required value={practiceForm.duration} onChange={e => setPracticeForm({ ...practiceForm, duration: e.target.value })} /><span>minutes</span></div></div><div className="field"><label>How confident did you feel?</label><select value={practiceForm.confidence} onChange={e => setPracticeForm({ ...practiceForm, confidence: e.target.value })}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {["","Not yet","A little","Getting there","Confident","Very confident"][n]}</option>)}</select></div></div>
        <div className="field"><label>Reflection / notes</label><textarea rows="4" value={practiceForm.notes} onChange={e => setPracticeForm({ ...practiceForm, notes: e.target.value })} placeholder="What went well? What would you like to improve next time?" /></div>
        <div className="form-footer"><span>Be honest. Every rating is a starting point.</span><div><button className="button button-primary" disabled={busy}>{busy ? "Saving..." : "Save practice →"}</button></div></div>
      </form></div>}

      {page === "history" && <div className="page-content"><div className="page-intro-row"><div><span className="overline">YOUR CONSISTENCY JOURNAL</span><p>Look back at the work you've put in. Every entry is progress.</p></div><button className="button button-primary" onClick={() => setPage("practice")}>＋ Log practice</button></div><div className="history-summary"><div><span>Total practice</span><strong>{progress.totalMinutes} <small>min</small></strong></div><div><span>Sessions completed</span><strong>{progress.totalSessions}</strong></div><div><span>Average confidence</span><strong>{progress.averageConfidence || 0}<small> / 5</small></strong></div></div>
        {sessions.length ? <div className="panel history-list">{sessions.map(s => <div className="history-item" key={s._id}><div className="history-date"><strong>{new Date(s.practicedAt || s.createdAt).getDate()}</strong><span>{new Date(s.practicedAt || s.createdAt).toLocaleString(undefined, { month: "short" })}</span></div><div className="history-description"><strong>{s.speech?.title || "General speaking practice"}</strong><p>{s.notes || "Practice session recorded. Keep going!"}</p><small>{new Date(s.practicedAt || s.createdAt).toLocaleDateString(undefined, { weekday: "long", year: "numeric" })}</small></div><div className="history-meta"><strong>{s.duration} min</strong><span>Confidence {s.confidence}/5</span></div></div>)}</div> : <Empty icon="◷" title="Your practice story starts today" text="Log a practice session to start tracking your time and confidence." action="Log first session" onClick={() => setPage("practice")} />}
      </div>}
      <footer className="app-footer"><span>SpeakUp <b>·</b> Practice with purpose</span><span>YOUR VOICE. YOUR PROGRESS.</span></footer>
    </main>
  </div>;
}

function AuthScreen({ mode, setMode, auth, setAuth, onSubmit, busy, message }) {
  return <main className="auth-layout"><section className="auth-visual"><a className="logo light-logo" href="#"><span className="logo-mark">S</span><span>Speak<span className="logo-accent">Up</span><small>PRACTICE WITH PURPOSE</small></span></a><div className="auth-visual-copy"><span className="banner-kicker">✦ FIND YOUR VOICE</span><h1>Your ideas deserve<br />to be <em>heard.</em></h1><p>A thoughtful space to prepare your words, practice with purpose, and grow into the speaker you want to be.</p><div className="auth-quote"><span>“</span><div><p>It always seems impossible until it's done.</p><small>A REMINDER TO KEEP GOING</small></div></div></div><div className="visual-footer">A LITTLE PRACTICE. A LOT MORE CONFIDENCE.</div></section><section className="auth-form-side"><form className="auth-form" onSubmit={onSubmit}><span className="overline">{mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}</span><h2>{mode === "login" ? "Good to have you here." : "Let's get you started."}</h2><p>{mode === "login" ? "Pick up where your speaking journey left off." : "Create your account and make space for your voice."}</p>{mode === "register" && <div className="field"><label>Your name <b>*</b></label><input required autoComplete="name" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="What should we call you?" /></div>}<div className="field"><label>Email address <b>*</b></label><input required type="email" autoComplete="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></div><div className="field"><label>Password <b>*</b></label><input required minLength="6" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 6 characters" /></div>{message && <div className="auth-message">{message}</div>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in to SpeakUp →" : "Create my account →"}</button><div className="auth-switch">{mode === "login" ? "New to SpeakUp?" : "Already have an account?"} <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></div><div className="auth-security">♢ &nbsp; Your account and practice history are private to you.</div></form></section></main>;
}

function Metric({ icon, tone, label, value, foot }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-foot">{foot}</span><div className={`metric-line ${tone}`}></div></article>;
}
function SpeechCard({ speech, onEdit, onDelete }) {
  return <article className="speech-card"><div className="speech-card-head"><span className="category-tag">{speech.category || "General"}</span><span className="duration-tag">◷ {speech.duration || 5} min</span></div><h3>{speech.title}</h3><p className="speech-topic">{speech.topic}</p>{speech.description && <p className="speech-notes">{speech.description}</p>}<div className="speech-card-bottom"><span>ADDED {new Date(speech.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><div><button onClick={() => onEdit(speech)} aria-label="Edit speech">Edit</button><button className="delete-action" onClick={() => onDelete(speech._id)} aria-label="Delete speech">Delete</button></div></div></article>;
}
function Empty({ icon, title, text, action, onClick }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action && <button className="button button-primary" onClick={onClick}>{action} →</button>}</div>;
}
