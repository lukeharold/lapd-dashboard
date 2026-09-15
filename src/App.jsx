import { useState, useMemo, useRef, useEffect } from "react";

const SAMPLE_DATA = [
  { id: "C26-03464", filed: "2025-08-14", incident: "2025-05-02", claimant: "Adam Piotr Ledwon", age: 38, sex: "Male", location: "Santa Monica Blvd & Western Ave, Los Angeles, CA 90029", neighborhood: "East Hollywood", type: "Vehicle Collision", narrative: "LAPD vehicle without siren caused an accident and hit a car which then struck claimant.", omission: "LAPD vehicle without siren caused accident", amount: 1000000, amountDisplay: "$1,000,000.00", injuries: "Vehicle total loss; ongoing medical treatment", attorney: "F. Jay Rahimi, Encino", insurance: "National Fire & Marine Insurance Company", officer: null, agency: "LAPD", tags: ["vehicle collision", "no siren", "injury", "personal injury"] },
  { id: "C26-03590", filed: "2025-08-15", incident: "2025-07-20", claimant: "Inter Exchange Auto Club (A/S/O Renee Calderon)", age: null, sex: null, location: "9346 Corbin Ave, Northridge, CA 91324", neighborhood: "Northridge", type: "Stray Bullet", narrative: "Parked vehicle struck by stray bullet during LAPD police shooting. Insured was an innocent bystander.", omission: "Police shooting — stray bullet struck innocent bystander's vehicle", amount: 3592.84, amountDisplay: "$3,592.84", injuries: "Bullet shattered front door window; window divider damaged", attorney: null, insurance: "AAA / IEAC — Claim #017276318", officer: null, agency: "LAPD", tags: ["stray bullet", "police shooting", "property damage", "bystander"] },
  { id: "25-3552", filed: "2025-06-30", incident: "2025-04-04", claimant: "Jose Gonzalez", age: null, sex: "Male", location: "47th St E and E Ave R, Palmdale, CA 93552", neighborhood: "Palmdale", type: "Vehicle Collision", narrative: "LA County Sheriff vehicle failed to activate sirens before entering an intersection against a red light, causing a collision.", omission: "Sheriff vehicle failed to activate sirens before entering intersection", amount: 17457.54, amountDisplay: "$17,457.54", injuries: "Vehicle damage", attorney: null, insurance: "Allstate", officer: null, agency: "LASD", tags: ["vehicle collision", "no siren", "intersection", "property damage"] }
];

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

// Police tape X logo
const SirenMark = () => (
  <svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <defs>
      <clipPath id="bounds"><rect x="0" y="0" width="72" height="80"/></clipPath>
      <clipPath id="t1c"><rect x="-100" y="26" width="300" height="14" transform="rotate(38,36,40)"/></clipPath>
      <clipPath id="t2c"><rect x="-100" y="26" width="300" height="14" transform="rotate(-38,36,40)"/></clipPath>
    </defs>

    {/* Background */}
    <rect width="72" height="80" fill="#f5f2ec"/>

    {/* Tape strip 1: \ */}
    <g clipPath="url(#t1c)">
      <g transform="rotate(38,36,40)">
        <rect x="-100" y="26" width="300" height="14" fill="#FFD700"/>
        <rect x="-100" y="26" width="300" height="2" fill="#c8a800"/>
        <rect x="-100" y="38" width="300" height="2" fill="#c8a800"/>
        <text x="-95" y="36" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="900" fill="#111" letterSpacing="1.5">POLICE LINE  DO NOT CROSS  POLICE LINE  DO NOT CROSS  POLICE LINE  DO NOT CROSS</text>
      </g>
    </g>

    {/* Tape strip 2: / */}
    <g clipPath="url(#t2c)">
      <g transform="rotate(-38,36,40)">
        <rect x="-100" y="26" width="300" height="14" fill="#FFD700"/>
        <rect x="-100" y="26" width="300" height="2" fill="#c8a800"/>
        <rect x="-100" y="38" width="300" height="2" fill="#c8a800"/>
        <text x="-95" y="36" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="900" fill="#111" letterSpacing="1.5">POLICE LINE  DO NOT CROSS  POLICE LINE  DO NOT CROSS  POLICE LINE  DO NOT CROSS</text>
      </g>
    </g>
  </svg>
);

const TYPE_COLORS = {
  "Vehicle Collision":              "#1a5fa8",
  "Stray Bullet":                   "#b00020",
  "Forced Entry / Property Damage": "#5b2d8e",
  "Use of Force":                   "#b04000",
  "False Arrest":                   "#005e3e",
  "Other":                          "#555",
};

const AGENCY_BG   = { LAPD: "#111", LASD: "#b00020" };

// ── small reusable bits ──────────────────────────────────────────────

const AgencyPill = ({ agency }) => (
  <span style={{
    display: "inline-block",
    fontFamily: "monospace", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.14em", textTransform: "uppercase",
    padding: "1px 6px",
    background: AGENCY_BG[agency] || "#111",
    color: "#fff",
  }}>{agency}</span>
);

const TypeLabel = ({ type }) => (
  <span style={{
    fontFamily: "monospace", fontSize: 10,
    color: TYPE_COLORS[type] || "#555",
  }}>{type}</span>
);

// ── expanded row detail ──────────────────────────────────────────────

const RowDetail = ({ claim, onClose }) => (
  <tr>
    <td colSpan={6} style={{ padding: 0, borderBottom: "2px solid #111" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderLeft: "4px solid #111" }}>

        {/* col 1 — identifiers */}
        <div style={{ padding: "20px 24px", borderRight: "1px solid #ddd" }}>
          <p style={{ fontFamily: "monospace", fontSize: 9, color: "#999", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px" }}>Record Detail</p>
          <DetailRow label="Claim ID"       value={claim.id} />
          <DetailRow label="Incident date"  value={claim.incident} />
          <DetailRow label="Filed date"     value={claim.filed} />
          <DetailRow label="Location"       value={claim.location} />
          {claim.age  && <DetailRow label="Claimant age" value={claim.age} />}
          {claim.sex  && <DetailRow label="Sex"          value={claim.sex} />}
          {claim.officer && <DetailRow label="Named officer" value={claim.officer} red />}
          {claim.attorney  && <DetailRow label="Attorney"  value={claim.attorney} />}
          {claim.insurance && <DetailRow label="Insurance" value={claim.insurance} />}
        </div>

        {/* col 2 — narrative */}
        <div style={{ padding: "20px 24px", borderRight: "1px solid #ddd" }}>
          <p style={{ fontFamily: "monospace", fontSize: 9, color: "#999", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>Narrative</p>
          <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#111", lineHeight: 1.7, margin: "0 0 16px" }}>{claim.narrative}</p>
          <p style={{ fontFamily: "monospace", fontSize: 9, color: "#999", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>Injuries / Damages</p>
          <p style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#444", lineHeight: 1.65, margin: 0 }}>{claim.injuries}</p>
        </div>

        {/* col 3 — amount + tags + pdf */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "#999", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>Amount Claimed</p>
            <p style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 20px", lineHeight: 1 }}>{claim.amountDisplay}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(claim.tags || []).map(t => (
                <span key={t} style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", border: "1px solid #ddd", color: "#888" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
            {claim.pdf_url
              ? <a href={claim.pdf_url} target="_blank" rel="noreferrer" style={{ fontFamily: "monospace", fontSize: 10, color: "#111", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid #111" }}>View PDF ↗</a>
              : <span />
            }
            <button onClick={onClose} style={{ background: "none", border: "1px solid #ddd", fontFamily: "monospace", fontSize: 10, color: "#999", cursor: "pointer", padding: "4px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Close</button>
          </div>
        </div>
      </div>
    </td>
  </tr>
);

const DetailRow = ({ label, value, red }) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>{label}</span>
    <span style={{ fontFamily: "monospace", fontSize: 12, color: red ? "#b00020" : "#111" }}>{value}</span>
  </div>
);

// ── AI panels ────────────────────────────────────────────────────────

const AISummary = ({ claims }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    setLoading(true); setSummary("");
    const claimText = claims.map(c => `Claim ${c.id} (${c.agency}): ${c.type}. ${c.narrative} Amount: ${c.amountDisplay}. Location: ${c.location}.`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          system: "You are a research assistant summarizing damage claims filed against LAPD and LASD. Report only what is stated on the claim forms. Use neutral, factual language — no adjectives that editorialize (avoid: troubling, alarming, dramatic, egregious, significant). Return 3–5 short bullet points stating concrete facts: claim type, location, what was alleged, who was named, amounts. Do not draw conclusions.",
          messages: [{ role: "user", content: `Summarize the key facts across these ${claims.length} claims:\n\n${claimText}` }]
        })
      });
      const data = await res.json();
      setSummary(data.content?.[0]?.text || "No response.");
    } catch { setSummary("Error contacting AI."); }
    setLoading(false);
  };
  return (
    <div style={{ borderTop: "1px solid #ddd", padding: "14px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: summary ? 10 : 0 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Pattern Analysis — {claims.length} record{claims.length !== 1 ? "s" : ""}</span>
        <button onClick={analyze} disabled={loading} style={{ background: loading ? "transparent" : "#111", border: "1px solid #111", color: loading ? "#999" : "#fff", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 12px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {summary && <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#333", lineHeight: 1.7, margin: "10px 0 0", whiteSpace: "pre-wrap", borderTop: "1px solid #eee", paddingTop: 10 }}>{summary}</p>}
    </div>
  );
};

const ThinkingDots = () => {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => d === 3 ? 1 : d + 1), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#aaa" }}>
      Thinking{".".repeat(dots)}
    </span>
  );
};

// Renders AI response text, turning "CLAIM C26-XXXXX" / "CLAIM 25-XXXX" into PDF links
const LinkedResponse = ({ text, claimById }) => {
  const claimIdPattern = /CLAIM\s+([A-Za-z0-9-]+)/g;
  const parts = [];
  let last = 0;
  let match;
  while ((match = claimIdPattern.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    const id = match[1];
    const claim = claimById[id];
    parts.push({ type: "claim", id, url: claim?.pdf_url || null, claimant: claim?.claimant || null });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return (
    <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#111", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
      {parts.map((p, i) =>
        p.type === "text" ? p.value :
        p.url
          ? <a key={i} href={p.url} target="_blank" rel="noreferrer" style={{ fontFamily: "monospace", fontSize: 11, color: "#1452a3", textDecoration: "none", borderBottom: "1px solid #1452a3", fontWeight: 600 }}>CLAIM {p.id} ↗</a>
          : <span key={i} style={{ fontFamily: "monospace", fontSize: 11, color: "#555", fontWeight: 600 }}>CLAIM {p.id}</span>
      )}
    </span>
  );
};

const QAPanel = ({ allClaims }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const SUGGESTED = [
    "How many claims were filed against police after the No Kings Day protests?",
    "Did anyone accuse officers of injuring their pet?",
    "Which Los Angeles neighborhoods are mentioned most often?",
    "Do any of them mention abuse in Los Angeles jails and prisons?",
    "Do any of them allege Fourth Amendment violations?",
  ];

  const claimById = useMemo(() => Object.fromEntries(allClaims.map(c => [c.id, c])), [allClaims]);

  const buildContext = () => {
    const lines = allClaims.map(c =>
      `[${c.id}] ${c.agency} | ${c.claimant} | ${c.type} | ${c.incident} | ${c.location} | ${c.amountDisplay} | ${c.narrative}${c.officer ? ` | Officer: ${c.officer}` : ""}${c.pdf_url ? ` | PDF: ${c.pdf_url}` : ""}`
    ).join("\n");
    return `You are a sharp, knowledgeable research colleague helping a journalist dig through ${allClaims.length} damage claims filed against LAPD and LASD. You know this dataset cold. Be conversational and direct — talk like a person, not a press release. Lead with the actual answer. You can flag something interesting if it genuinely stands out, but don't editorialize or inject opinions about the police. Be specific: names, dates, dollar amounts, locations. If something is ambiguous or not in the data, say so plainly. When you reference specific claims, cite them as CLAIM [ID] — e.g. CLAIM C26-03464 — so they can be linked. If there are none, just say so. Do not use any markdown formatting — no asterisks, no bold, no italics, no bullet dashes, no headers. Plain text only.\n\n${lines}`;
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: API_HEADERS,
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: buildContext(), messages: newMessages })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "No response." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error reaching AI." }]);
    }
    setLoading(false);
  };

  return (
    <div>
      {messages.length === 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Try asking:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => send(q)} style={{ background: "#fff", border: "1px solid #ddd", color: "#333", fontFamily: "monospace", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ maxHeight: 340, overflowY: "auto", borderTop: "1px solid #eee", marginBottom: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "80px 1fr", gap: 16 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", paddingTop: 2 }}>{m.role === "user" ? "You" : "AI"}</span>
              {m.role === "user"
                ? <span style={{ fontFamily: "monospace", fontSize: 12, color: "#111", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.content}</span>
                : <LinkedResponse text={m.content} claimById={claimById} />
              }
            </div>
          ))}
          {loading && (
            <div style={{ padding: "12px 0", display: "grid", gridTemplateColumns: "80px 1fr", gap: 16 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", paddingTop: 2 }}>AI</span>
              <ThinkingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, borderTop: messages.length > 0 ? "none" : "1px solid #eee", paddingTop: messages.length > 0 ? 0 : 14 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask anything about the claims… (Enter to send)"
          disabled={loading}
          style={{ flex: 1, background: "#fff", border: "1px solid #ddd", color: "#111", fontFamily: "monospace", fontSize: 12, padding: "8px 12px", outline: "none" }}
        />
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{ background: "none", border: "1px solid #ddd", color: "#aaa", fontFamily: "monospace", fontSize: 10, cursor: "pointer", padding: "8px 12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Clear</button>
        )}
        <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{ background: input.trim() && !loading ? "#111" : "#f5f5f5", border: "none", color: input.trim() && !loading ? "#fff" : "#ccc", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px", cursor: input.trim() && !loading ? "pointer" : "not-allowed" }}>
          Send
        </button>
      </div>
    </div>
  );
};

// ── main app ─────────────────────────────────────────────────────────

export default function App() {
  const [allClaims, setAllClaims]     = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedType, setSelectedType]     = useState("All");
  const [selectedAgency, setSelectedAgency] = useState("All");
  const [expandedId, setExpandedId]   = useState(null);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState("blotter");

  useEffect(() => {
    fetch("/claims.json")
      .then(r => r.json())
      .then(data => {
        const claims = data.claims || data;
        if (Array.isArray(claims) && claims.length > 0) {
          setAllClaims(claims);
          if (data.generated_at) {
            const d = new Date(data.generated_at);
            setLastUpdated(d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
          }
        } else { setAllClaims(SAMPLE_DATA); }
      })
      .catch(() => setAllClaims(SAMPLE_DATA));
  }, []);

  const types = useMemo(() => ["All", ...Array.from(new Set(allClaims.map(c => c.type)))], [allClaims]);
  const lapdCount = useMemo(() => allClaims.filter(c => c.agency === "LAPD").length, [allClaims]);
  const lasdCount = useMemo(() => allClaims.filter(c => c.agency === "LASD").length, [allClaims]);

  const filtered = useMemo(() => {
    let r = allClaims;
    if (selectedAgency !== "All") r = r.filter(c => c.agency === selectedAgency);
    if (selectedType !== "All")   r = r.filter(c => c.type === selectedType);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(c => [c.narrative, c.omission, c.location, c.claimant, c.neighborhood, c.officer, c.agency, ...(c.tags || [])].filter(Boolean).some(v => v.toLowerCase().includes(q)));
    }
    return r;
  }, [allClaims, selectedType, selectedAgency, search]);

  const toggleRow = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#111", fontFamily: "monospace" }}>

      {/* Masthead */}
      <div style={{ borderBottom: "3px solid #111", padding: "18px 36px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Dateline row */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "#666", letterSpacing: "0.05em", margin: 0, lineHeight: 1.6 }}>
              Source: Obtained via California Public Records Act requests · Edited by Luke Harold · Coding and entries written by Claude · The documents contain allegations; some claims may not yet have been adjudicated or otherwise settled. Dollar amounts shown reflect only what each claimant has requested. Actual amounts paid out, if any, may differ significantly.
            </p>
          </div>
          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 4 }}>
            <SirenMark />
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(13px, 1.6vw, 20px)", fontWeight: 400, color: "#777", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1, marginBottom: 5 }}>
                Claims for Damages
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(16px, 2.4vw, 30px)", fontWeight: 700, color: "#111", letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1.1 }}>
                <span style={{ color: "#1452a3" }}>Los Angeles Police Department</span>
                <span style={{ color: "#bbb", fontWeight: 300, margin: "0 10px", fontSize: "0.7em" }}>&amp;</span>
                <span style={{ color: "#c1001f" }}>Los Angeles Sheriff's Department</span>
              </div>
            </div>
          </div>
          {/* Stat strip */}
          <div style={{ display: "flex", gap: 0, marginTop: 14, borderTop: "1px solid #111", borderBottom: "1px solid #ddd" }}>
            {[
              { label: "Total claims", value: allClaims.length },
              { label: "LAPD",         value: lapdCount },
              { label: "LASD",         value: lasdCount },
              { label: "Officers named", value: allClaims.filter(c => c.officer).length },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: "8px 20px 8px 0", marginRight: 20, borderRight: i < 3 ? "1px solid #ddd" : "none", paddingRight: i < 3 ? 20 : 0 }}>
                <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#111" }}>{s.value}</span>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#555", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 7 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 36px" }}>

        {/* Tab nav */}
        <div style={{ display: "flex", borderBottom: "1px solid #ddd", marginBottom: 0 }}>
          {[["blotter", "Blotter"], ["ask", "Ask the Data"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none",
              borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent",
              color: activeTab === tab ? "#111" : "#aaa",
              fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "12px 20px 10px", cursor: "pointer", marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {/* Ask the Data */}
        {activeTab === "ask" && (
          <div style={{ padding: "24px 0" }}>
            <QAPanel allClaims={allClaims} />
          </div>
        )}

        {/* Blotter */}
        {activeTab === "blotter" && (
          <div style={{ paddingTop: 18 }}>

            {/* Filter row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "nowrap" }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
                placeholder="Search names, locations, keywords…"
                style={{ background: "#fff", border: "1px solid #ccc", color: "#111", fontFamily: "monospace", fontSize: 12, padding: "6px 11px", outline: "none", width: 220, flexShrink: 0 }}
              />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#ccc", flexShrink: 0 }}>|</span>
              {["All", "LAPD", "LASD"].map(a => (
                <button key={a} onClick={() => { setSelectedAgency(a); setSelectedType("All"); setExpandedId(null); }} style={{ background: selectedAgency === a ? "#111" : "transparent", border: `1px solid ${selectedAgency === a ? "#111" : "#ddd"}`, color: selectedAgency === a ? "#fff" : "#555", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", cursor: "pointer", flexShrink: 0, fontWeight: 500 }}>
                  {a === "All" ? `All (${allClaims.length})` : `${a} (${a === "LAPD" ? lapdCount : lasdCount})`}
                </button>
              ))}
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#ccc", flexShrink: 0 }}>|</span>
              <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setExpandedId(null); }} style={{ background: "#fff", border: "1px solid #ddd", color: "#444", fontFamily: "monospace", fontSize: 10, padding: "5px 8px", cursor: "pointer", outline: "none", fontWeight: 500, flexShrink: 1, minWidth: 0 }}>
                {types.map(t => <option key={t} value={t}>{t === "All" ? "All types" : t}</option>)}
              </select>
            </div>

            {/* Record count + hint */}
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "flex", gap: 16 }}>
              <span>Showing {filtered.length} of {allClaims.length} records</span>
              <span style={{ color: "#999", fontWeight: 400 }}>· Click any row to expand</span>
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "2px solid #111", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 100 }} />
                <col style={{ width: 72 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 150 }} />
                <col />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "1px solid #111" }}>
                  {["Filed", "Agency", "Type", "Neighborhood", "Narrative"].map(h => (
                    <th key={h} style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", fontWeight: 600, textAlign: "left", padding: "6px 12px 6px 0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ fontFamily: "monospace", fontSize: 12, color: "#999", padding: "20px 0" }}>No records match your filters.</td></tr>
                )}
                {filtered.map((c, i) => {
                  const expanded = expandedId === c.id;
                  return [
                    <tr
                      key={c.id}
                      onClick={() => toggleRow(c.id)}
                      style={{
                        borderBottom: expanded ? "none" : "1px solid #e8e8e8",
                        background: expanded ? "#f5f5f5" : i % 2 === 0 ? "#fff" : "#fafafa",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#444", fontWeight: 500, padding: "10px 12px 10px 0", whiteSpace: "nowrap", verticalAlign: "middle" }}>{c.filed}</td>
                      <td style={{ padding: "10px 12px 10px 0", whiteSpace: "nowrap", verticalAlign: "middle" }}><AgencyPill agency={c.agency} /></td>
                      <td style={{ padding: "10px 12px 10px 0", verticalAlign: "middle", overflow: "hidden" }}><TypeLabel type={c.type} /></td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#444", fontWeight: 500, padding: "10px 12px 10px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle" }}>{c.neighborhood}</td>
                      <td style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#222", padding: "10px 0", verticalAlign: "middle", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.narrative}</td>
                    </tr>,
                    expanded && <RowDetail key={`${c.id}-detail`} claim={c} onClose={() => setExpandedId(null)} />
                  ];
                })}
              </tbody>
            </table>

            {/* AI summary below table */}
            <AISummary claims={filtered} />
          </div>
        )}

        <div style={{ marginBottom: 32 }} />
      </div>
    </div>
  );
}
