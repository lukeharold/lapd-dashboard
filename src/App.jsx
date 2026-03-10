import { useState, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SAMPLE_DATA = [
  { id: "C26-03464", filed: "2025-08-14", incident: "2025-05-02", claimant: "Adam Piotr Ledwon", age: 38, sex: "Male", location: "Santa Monica Blvd & Western Ave, Los Angeles, CA 90029", neighborhood: "East Hollywood", type: "Vehicle Collision", narrative: "LAPD vehicle without siren caused an accident and hit a car which then struck claimant.", omission: "LAPD vehicle without siren caused accident", amount: 1000000, amountDisplay: "$1,000,000.00", injuries: "Vehicle total loss; ongoing medical treatment", attorney: "F. Jay Rahimi, Encino", insurance: "National Fire & Marine Insurance Company", officer: null, tags: ["vehicle collision", "no siren", "injury", "personal injury"] },
  { id: "C26-03590", filed: "2025-08-15", incident: "2025-07-20", claimant: "Inter Exchange Auto Club (A/S/O Renee Calderon)", age: null, sex: null, location: "9346 Corbin Ave, Northridge, CA 91324", neighborhood: "Northridge", type: "Stray Bullet", narrative: "Parked vehicle struck by stray bullet during LAPD police shooting. Insured was an innocent bystander.", omission: "Police shooting — stray bullet struck innocent bystander's vehicle", amount: 3592.84, amountDisplay: "$3,592.84", injuries: "Bullet shattered front door window; window divider damaged", attorney: null, insurance: "AAA / IEAC — Claim #017276318", officer: null, tags: ["stray bullet", "police shooting", "property damage", "bystander"] },
  { id: "C26-03592", filed: "2025-08-15", incident: "2024-11-11", claimant: "Carmen Moran", age: null, sex: "Female", location: "108th & Olive St, Los Angeles, CA 90003", neighborhood: "South Los Angeles", type: "Vehicle Collision", narrative: "On-duty LAPD officer Ruben Robles struck claimant's insured vehicle at an intersection.", omission: "Officer Robles struck insured vehicle at intersection", amount: 31680.15, amountDisplay: "$31,680.15", injuries: "Vehicle total loss — $31,680.15 in property damage", attorney: null, insurance: null, officer: "Ruben Robles", tags: ["vehicle collision", "officer named", "total loss", "property damage"] },
  { id: "C26-03598", filed: "2025-08-15", incident: "2025-03-05", claimant: "Dermot Givens", age: 69, sex: "Male", location: "1628 N Formosa Ave, Unit A, Los Angeles, CA 90046", neighborhood: "West Hollywood", type: "Stray Bullet", narrative: "LAPD officers shot out the sliding glass door on claimant's residential balcony; claimant was forced to relocate.", omission: "LAPD shot out sliding glass door on residential balcony", amount: 10000000, amountDisplay: "$10,000,000.00", injuries: "Window shattered; psychological trauma; claimant forced to relocate", attorney: null, insurance: null, officer: null, tags: ["stray bullet", "police shooting", "property damage", "psychological harm", "displacement"] },
  { id: "C26-03634", filed: "2025-07-28", incident: "2025-02-04", claimant: "Thomas Jones", age: null, sex: "Male", location: "5050 Matilija Ave, Sherman Oaks, CA", neighborhood: "Sherman Oaks", type: "Forced Entry / Property Damage", narrative: "LAPD officers broke a stained glass window with an elbow and forcibly kicked in the front door. Both claimant and daughter were taken to hospital.", omission: "Officers intentionally broke stained glass window and forcibly kicked in front door", amount: 5260.89, amountDisplay: "$5,260.89", injuries: "Door and stained glass damage ($5,260.89); bodily injuries covered by insurance", attorney: null, insurance: "California Casualty, policy 201 5600507", officer: null, tags: ["forced entry", "property damage", "bodily injury", "home entry"] }
];

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const API_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

const TYPE_COLORS = {
  "Vehicle Collision": "#1a6bb5",
  "Stray Bullet": "#c0392b",
  "Forced Entry / Property Damage": "#6c3483",
  "Use of Force": "#b7400a",
  "False Arrest": "#0e6655",
  "Other": "#555"
};

const Tag = ({ label }) => (
  <span style={{ display: "inline-block", fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid #ddd", color: "#888", marginRight: 4, marginBottom: 4, fontFamily: "monospace" }}>{label}</span>
);

const TypeBadge = ({ type }) => (
  <span style={{ display: "inline-block", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", background: TYPE_COLORS[type] || "#333", color: "#fff", fontFamily: "monospace", fontWeight: 700 }}>{type}</span>
);

const Field = ({ label, value, highlight }) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}: </span>
    <span style={{ fontFamily: "monospace", fontSize: 12, color: highlight ? "#c0392b" : "#222" }}>{value}</span>
  </div>
);

const ClaimCard = ({ claim, onClick, selected }) => (
  <div onClick={() => onClick(claim)} style={{ background: selected ? "#f5f5f5" : "#fff", border: selected ? "1px solid #111" : "1px solid #e8e8e8", padding: "16px 20px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.15s" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa" }}>{claim.id}</span>
        <span style={{ color: "#ccc", margin: "0 8px" }}>·</span>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa" }}>{claim.filed}</span>
      </div>
      <TypeBadge type={claim.type} />
    </div>
    <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, color: "#111", marginBottom: 6, lineHeight: 1.5 }}>{claim.narrative}</div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa" }}>{claim.neighborhood}</span>
      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#333" }}>{claim.amountDisplay}</span>
    </div>
  </div>
);

const ClaimDetail = ({ claim, onClose }) => (
  <div style={{ background: "#fafafa", border: "1px solid #e0e0e0", padding: 28, position: "relative" }}>
    <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 18 }}>✕</button>
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa", marginRight: 10 }}>CLAIM {claim.id}</span>
      <TypeBadge type={claim.type} />
    </div>
    <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 20, color: "#111", margin: "0 0 4px", fontWeight: 400 }}>{claim.claimant}</h2>
    {claim.age && <p style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa", margin: "0 0 12px" }}>Age {claim.age}{claim.sex ? ` · ${claim.sex}` : ""}</p>}
    <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 8 }}>
      <Field label="Incident Date" value={claim.incident} />
      <Field label="Filed Date" value={claim.filed} />
      <Field label="Location" value={claim.location} />
      {claim.officer && <Field label="Named Officer" value={claim.officer} highlight />}
    </div>
    <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 10 }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Alleged Act / Omission</p>
      <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#222", lineHeight: 1.6, margin: 0 }}>{claim.omission}</p>
    </div>
    <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 14 }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Injuries / Damages</p>
      <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#222", lineHeight: 1.6, margin: 0 }}>{claim.injuries}</p>
    </div>
    <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        {claim.attorney && <Field label="Attorney" value={claim.attorney} />}
        {claim.insurance && <Field label="Insurance" value={claim.insurance} />}
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Amount Claimed</p>
        <p style={{ fontFamily: "monospace", fontSize: 22, color: "#111", margin: 0, fontWeight: 700 }}>{claim.amountDisplay}</p>
      </div>
    </div>
    <div style={{ marginTop: 14 }}>{(claim.tags || []).map(t => <Tag key={t} label={t} />)}</div>
{claim._source_file && (
  <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 14 }}>
    <a href={`/pdfs/${claim._source_file}`} target="_blank" rel="noreferrer" style={{ fontFamily: "monospace", fontSize: 11, color: "#111", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid #111" }}>
      View Source PDF ↗
    </a>
  </div>
)}
  </div>
);

const AISummary = ({ claims }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    setLoading(true); setSummary("");
    const claimText = claims.map(c => `Claim ${c.id}: ${c.type}. ${c.narrative} Amount: ${c.amountDisplay}. Location: ${c.location}.`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a research assistant summarizing LAPD damage claims. Report only what is stated on the claim forms. Use neutral, factual language — no adjectives that editorialize or characterize the severity of allegations (e.g. avoid words like troubling, alarming, dramatic, egregious, significant). Return 3–5 short bullet points. Each bullet should state a concrete fact drawn directly from the claims: claim type, location, what was alleged, who was named, amounts requested. Do not draw conclusions or suggest what the data means.",
          messages: [{ role: "user", content: `Summarize the key facts across these ${claims.length} LAPD claims:\n\n${claimText}` }]
        })
      });
      const data = await res.json();
console.log("API response:", JSON.stringify(data));
setSummary(data.content?.[0]?.text || "No response.");
    } catch { setSummary("Error contacting AI."); }
    setLoading(false);
  };
  return (
    <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: summary ? 12 : 0 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#aaa", letterSpacing: "0.12em", textTransform: "uppercase" }}>AI Pattern Analysis — {claims.length} claim{claims.length !== 1 ? "s" : ""}</span>
        <button onClick={analyze} disabled={loading} style={{ background: loading ? "#f0f0f0" : "#111", border: "none", color: loading ? "#aaa" : "#fff", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {summary && <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0, borderTop: "1px solid #eee", paddingTop: 12, whiteSpace: "pre-wrap" }}>{summary}</p>}
    </div>
  );
};

const QAPanel = ({ allClaims }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const SUGGESTED = [
    "Which claims have the highest amounts?",
    "Are there any named officers?",
    "Find claims involving stray bullets",
    "What neighborhoods appear most often?",
    "Show me claims filed in 2025",
  ];

  const buildContext = () => {
    const lines = allClaims.map(c =>
      `[${c.id}] ${c.claimant} | ${c.type} | ${c.incident} | ${c.location} | ${c.amountDisplay} | ${c.narrative}${c.officer ? ` | Officer: ${c.officer}` : ""}`
    ).join("\n");
    return `You are a research assistant helping a journalist analyze ${allClaims.length} LAPD damage claims. Here is the full dataset:\n\n${lines}\n\nAnswer questions concisely and accurately. When referencing specific claims, cite their claim ID (e.g. C26-03464). If asked to find or locate a specific claim, return the claim ID and key details. Do not make up data not present in the dataset.`;
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildContext(),
          messages: newMessages
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "No response." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error reaching AI. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", marginBottom: 24 }}>
      <div style={{ borderBottom: "1px solid #eee", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#aaa", letterSpacing: "0.12em", textTransform: "uppercase" }}>Ask the Data — {allClaims.length} claims loaded</span>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{ background: "none", border: "none", color: "#bbb", fontFamily: "monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>Clear</button>
        )}
      </div>

      {messages.length === 0 && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>Try asking:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => send(q)} style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555", fontFamily: "monospace", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ maxHeight: 320, overflowY: "auto", padding: "16px 20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{m.role === "user" ? "You" : "AI"}</div>
              <div style={{
                maxWidth: "85%",
                background: m.role === "user" ? "#111" : "#fff",
                border: "1px solid #e8e8e8",
                padding: "10px 14px",
                fontFamily: m.role === "user" ? "monospace" : "'Georgia', serif",
                fontSize: m.role === "user" ? 12 : 14,
                color: m.role === "user" ? "#fff" : "#222",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>AI</div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#bbb" }}>Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ borderTop: "1px solid #eee", padding: "12px 20px", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask anything about the claims… (Enter to send)"
          disabled={loading}
          style={{ flex: 1, background: "#fff", border: "1px solid #e0e0e0", color: "#111", fontFamily: "monospace", fontSize: 12, padding: "8px 12px", outline: "none" }}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{ background: input.trim() && !loading ? "#111" : "#f0f0f0", border: "none", color: input.trim() && !loading ? "#fff" : "#bbb", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px", cursor: input.trim() && !loading ? "pointer" : "not-allowed" }}>
          Send
        </button>
      </div>
    </div>
  );
};

const JsonLoader = ({ onLoad, isLive }) => {
  const [dragging, setDragging] = useState(false);
  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const p = JSON.parse(e.target.result);
        const claims = p.claims || p;
        if (Array.isArray(claims)) onLoad(claims);
        else alert("Expected { claims: [...] } or an array.");
      } catch { alert("Could not parse JSON."); }
    };
    reader.readAsText(file);
  };
  return (
    <div
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      style={{ border: `1px dashed ${dragging ? "#111" : "#ddd"}`, padding: "10px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", background: dragging ? "#f5f5f5" : "transparent" }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.08em" }}>
        {isLive ? "✓ Live data loaded — drop a new claims.json to reload" : "Drop claims.json here to load your data, or →"}
      </span>
      <label style={{ fontFamily: "monospace", fontSize: 10, color: "#111", cursor: "pointer", border: "1px solid #111", padding: "4px 10px", letterSpacing: "0.08em" }}>
        Load JSON <input type="file" accept=".json" onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f); }} style={{ display: "none" }} />
      </label>
    </div>
  );
};

export default function App() {
  const [allClaims, setAllClaims] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse");

  // Load claims.json from public folder on startup
  useEffect(() => {
    fetch("/claims.json")
      .then(r => r.json())
      .then(data => {
      const claims = data.claims || data;
if (Array.isArray(claims) && claims.length > 0) {
  setAllClaims(claims);
          setIsLive(true);
        } else {
          setAllClaims(SAMPLE_DATA);
        }
      })
      .catch(() => setAllClaims(SAMPLE_DATA));
  }, []);

  const handleLoad = (claims) => { setAllClaims(claims); setIsLive(true); setSelectedType("All"); setSelectedClaim(null); setSearch(""); };
  const types = useMemo(() => ["All", ...Array.from(new Set(allClaims.map(c => c.type)))], [allClaims]);
  const filtered = useMemo(() => {
    let r = selectedType === "All" ? allClaims : allClaims.filter(c => c.type === selectedType);
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(c => [c.narrative, c.omission, c.location, c.claimant, c.neighborhood, c.officer, ...(c.tags || [])].filter(Boolean).some(v => v.toLowerCase().includes(q))); }
    return r;
  }, [allClaims, selectedType, search]);

  const chartData = useMemo(() =>
    Array.from(allClaims.reduce((m, c) => { m.set(c.type, (m.get(c.type) || 0) + 1); return m; }, new Map()))
      .map(([type, count]) => ({ type, count, fullType: type })),
    [allClaims]
  );

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#111", fontFamily: "monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #eee", padding: "20px 32px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#bbb", textTransform: "uppercase", marginBottom: 4 }}>
          Public Records
          {isLive
            ? <span style={{ marginLeft: 10, color: "#2a7", border: "1px solid #2a7", padding: "1px 6px", fontSize: 9 }}>LIVE DATA</span>
            : <span style={{ marginLeft: 10, color: "#bbb", border: "1px solid #ddd", padding: "1px 6px", fontSize: 9 }}>SAMPLE</span>}
        </div>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 400, color: "#111", margin: "0 0 4px", letterSpacing: "-0.02em" }}>LAPD Claims Dashboard</h1>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb" }}>City of Los Angeles · Damage Claims Against LAPD</div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Claims", value: allClaims.length },
            { label: "Claim Types", value: new Set(allClaims.map(c => c.type)).size },
            { label: "Officers Named", value: allClaims.filter(c => c.officer).length }
          ].map(s => (
            <div key={s.label} style={{ background: "#fafafa", border: "1px solid #eee", padding: "14px 18px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 26, color: "#111", fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: "#fafafa", border: "1px solid #eee", padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Claims by Type</div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="type" tick={{ fill: "#aaa", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #eee", fontFamily: "monospace", fontSize: 11, color: "#111" }} labelFormatter={(_, p) => p?.[0]?.payload?.fullType || ""} formatter={v => [v, "Claims"]} />
              <Bar dataKey="count" radius={0}>
                {chartData.map(e => <Cell key={e.type} fill={TYPE_COLORS[e.fullType] || "#ccc"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: 0 }}>
          {[["browse", "Browse & Filter"], ["ask", "Ask the Data"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent", color: activeTab === tab ? "#111" : "#bbb", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ paddingTop: 24 }}>
          {activeTab === "ask" ? (
            <QAPanel allClaims={allClaims} />
          ) : (
            <>
              <AISummary claims={filtered} />

              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedClaim(null); }}
                  placeholder="Search narratives, locations, officers…"
                  style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#111", fontFamily: "monospace", fontSize: 12, padding: "6px 12px", flex: 1, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {types.map(t => (
                  <button key={t} onClick={() => { setSelectedType(t); setSelectedClaim(null); }} style={{ background: selectedType === t ? "#111" : "transparent", border: `1px solid ${selectedType === t ? "#111" : "#ddd"}`, color: selectedType === t ? "#fff" : "#999", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", cursor: "pointer" }}>
                    {t === "All" ? `All (${allClaims.length})` : t}
                  </button>
                ))}
              </div>

              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#bbb", marginBottom: 12 }}>
                Showing {filtered.length} of {allClaims.length} claims
              </div>

              <div style={{ display: "grid", gridTemplateColumns: selectedClaim ? "1fr 1fr" : "1fr", gap: 16 }}>
                <div>
                  {filtered.length === 0 && <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ccc", padding: "20px 0" }}>No claims match your filters.</div>}
                  {filtered.map((c, i) => <ClaimCard key={`${c.id}-${i}`} claim={c} onClick={claim => setSelectedClaim(claim.id === selectedClaim?.id ? null : claim)} selected={selectedClaim?.id === c.id} />)}
                </div>
                {selectedClaim && <ClaimDetail claim={selectedClaim} onClose={() => setSelectedClaim(null)} />}
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: "1px solid #eee", marginTop: 32, paddingTop: 12 }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#ccc", letterSpacing: "0.06em", marginBottom: 6 }}>
            Source: City of Los Angeles Damage Claims · Obtained via CPRA · Data compiled manually by Luke Harold · Coding by Claude · These are allegations; claims have not been adjudicated.
          </p>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#ccc", letterSpacing: "0.06em", margin: 0 }}>
            Dollar amounts shown reflect only what each claimant has requested. Actual amounts paid out, if a claim is resolved in the claimant's favor, are determined through negotiation or the legal process and may differ significantly.
          </p>
        </div>
      </div>
    </div>
  );
}