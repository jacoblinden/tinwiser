// alarms.jsx — Alarm configuration: rules list + rule editor with three modes,
// LLM-assisted creation, and a backtest timeline.

const { useState: useStateAlarm, useMemo: useMemoAlarm } = React;

// Mock alarm rules
const ALARM_RULES = [
  { id: "RL-201", name: "Press bearing vibration — drive end", scope: "All Schuler MSP-630 presses",
    severity: "warn", mode: "Visual", state: "active", triggered: 4, lastTrig: "Yesterday",
    author: "K. Reinhardt", suppression: "Quiet hours 22:00–06:00" },
  { id: "RL-187", name: "Pump cavitation — broadband 6-9 kHz", scope: "Lyon Pumphouse",
    severity: "crit", mode: "Expression", state: "active", triggered: 2, lastTrig: "3 days ago",
    author: "M. Bellamy", suppression: "Maintenance mode aware" },
  { id: "RL-176", name: "Compressor discharge temperature drift", scope: "Atlas Copco GA-90",
    severity: "warn", mode: "Template", state: "active", triggered: 7, lastTrig: "Today, 09:14",
    author: "J. de Vries", suppression: "—" },
  { id: "RL-152", name: "Slow-cycle press anomaly", scope: "All press machines",
    severity: "info", mode: "Visual", state: "active", triggered: 12, lastTrig: "Today, 06:30",
    author: "K. Reinhardt", suppression: "—" },
  { id: "RL-101", name: "Generic ISO 10816 zone D", scope: "Global", severity: "safety",
    mode: "Template", state: "active", triggered: 1, lastTrig: "Mar 2026",
    author: "System", suppression: "Never suppress · safety" },
  { id: "RL-088", name: "Cooling fan offline > 10 min", scope: "All fans", severity: "warn",
    mode: "Visual", state: "active", triggered: 3, lastTrig: "Today, 06:42",
    author: "K. Reinhardt", suppression: "Suppress weekend overnight" },
  { id: "RL-067", name: "Bearing kurtosis step change", scope: "All bearings", severity: "crit",
    mode: "Expression", state: "paused", triggered: 0, lastTrig: "—",
    author: "L. Rosso", suppression: "—" },
];

function AlarmsScreen({ go }) {
  const Ic = window.Icons;
  const [editing, setEditing] = useStateAlarm(null); // null | "new" | rule object
  const [scope, setScope] = useStateAlarm("all");

  if (editing) {
    return <RuleEditor rule={editing === "new" ? null : editing} onBack={() => setEditing(null)} />;
  }

  return (
    <div className="page-body fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Alarms</h1>
          <div className="page-sub">{ALARM_RULES.length} rules · {ALARM_RULES.filter(r=>r.state==="active").length} active · 7 fired in last 24h</div>
        </div>
        <div style={{display:"flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost" title="Browse templates"><Ic.doc size={13}/> Browse templates</button>
          <button className="btn btn-sm btn-primary" title="New alarm" onClick={() => setEditing("new")}><Ic.plus size={13}/> New alarm</button>
        </div>
      </div>

      {/* LLM-assisted creation */}
      <div className="card" style={{padding: "18px 20px", marginBottom: 24,
                                     background: "linear-gradient(180deg, var(--forecast-soft) 0%, var(--surface-2) 60%)",
                                     border: "1px solid var(--line)"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
          <Ic.sparkle size={14}/>
          <div style={{fontSize: 14, fontWeight: 500}}>Describe an alarm</div>
          <span className="ai-badge" style={{fontSize: 10.5}}>Beta</span>
        </div>
        <div className="alarms-describe-row" style={{display: "flex", gap: 10}}>
          <input className="input" placeholder='e.g. "alert me when the press runs slower than usual for more than 5 minutes"'
                 style={{flex: 1, height: 38, background: "var(--surface)", border: "1px solid var(--line-2)"}}/>
          <button className="btn" style={{height: 38}} onClick={() => setEditing("new")}>Propose rule</button>
        </div>
        <div style={{marginTop: 10, fontSize: 11.5, color: "var(--ink-3)"}}>
          We'll draft a concrete rule from your description. You always review and approve before it goes live.
        </div>
      </div>

      {/* Filter / scope */}
      <div className="filterbar">
        <div style={{position: "relative"}}>
          <span style={{position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)"}}>
            <Ic.search size={13} />
          </span>
          <input className="input input-search" placeholder="Search alarms…" />
        </div>
        <div className="sep"/>
        <select className="input" style={{width: 180, height: 28}} value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All scopes</option>
          <option>Global</option>
          <option>Wolfsburg</option>
          <option>Lyon Pumphouse</option>
          <option>By machine type</option>
        </select>
        <select className="input" style={{width: 150, height: 28}}>
          <option>Any severity</option>
          <option>Safety</option>
          <option>Critical</option>
          <option>Warning</option>
          <option>Info</option>
        </select>
        <select className="input" style={{width: 150, height: 28}}>
          <option>Any author</option>
          <option>Me (K. Reinhardt)</option>
          <option>My team</option>
          <option>Cadence (system)</option>
        </select>
        <div style={{marginLeft: "auto", color: "var(--ink-3)", fontSize: 12}}>{ALARM_RULES.length} rules</div>
      </div>

      {/* Rules table */}
      <div className="card" style={{padding: 0, overflow: "hidden"}}>
        <div className="alarms-rule-head" style={{display: "grid",
                      gridTemplateColumns: "minmax(0, 2fr) 1fr 110px 90px 110px 80px 28px",
                      gap: 12, padding: "10px 16px",
                      background: "var(--surface-2)", borderBottom: "1px solid var(--line)",
                      fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em",
                      color: "var(--ink-3)"}}>
          <div>Alarm</div>
          <div>Scope</div>
          <div>Severity</div>
          <div>Mode</div>
          <div>Last 30 d</div>
          <div>State</div>
          <div></div>
        </div>
        {ALARM_RULES.map((r) => (
          <div key={r.id} onClick={() => setEditing(r)}
               className="row-hover alarms-rule-row"
               style={{display: "grid",
                       gridTemplateColumns: "minmax(0, 2fr) 1fr 110px 90px 110px 80px 28px",
                       gap: 12, padding: "12px 16px",
                       borderBottom: "1px solid var(--line)",
                       alignItems: "center", cursor: "pointer", fontSize: 13}}>
            <div style={{minWidth: 0}}>
              <div style={{fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                {r.name}
              </div>
              <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>
                <span className="mono">{r.id}</span>
                <span> · </span>
                <span>{r.author}</span>
                {r.suppression !== "—" && <><span> · </span><span>{r.suppression}</span></>}
              </div>
            </div>
            <div style={{fontSize: 12, color: "var(--ink-2)", whiteSpace: "nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              {r.scope}
            </div>
            <div>
              <StatusTag status={r.severity === "crit" ? "crit" : r.severity === "warn" ? "warn" : r.severity === "safety" ? "crit" : "forecast"}>
                {severityLabel(r.severity)}
              </StatusTag>
            </div>
            <div style={{fontSize: 12}}>
              <span className="tag tag-outline">{r.mode}</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <div className="mono tnum" style={{fontSize: 12.5, color: "var(--ink-1)", minWidth: 16}}>{r.triggered}</div>
              <FireSparkline n={30} firings={r.triggered} />
            </div>
            <div>
              {r.state === "active" ? (
                <span style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ok)"}}>
                  <span className="dot ok"/> Active
                </span>
              ) : (
                <span style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)"}}>
                  <span className="dot unknown"/> Paused
                </span>
              )}
            </div>
            <div style={{color: "var(--ink-4)"}}><Ic.chevR size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tiny histogram-like firings strip
function FireSparkline({ n = 30, firings = 0 }) {
  // Deterministically distribute "firings" among n bars
  const bars = useMemoAlarm(() => {
    const a = Array(n).fill(0);
    let seed = firings * 17 + 3;
    for (let f = 0; f < firings; f++) {
      seed = (seed * 9301 + 49297) % 233280;
      a[Math.floor((seed / 233280) * n)]++;
    }
    return a;
  }, [n, firings]);
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: 1, height: 18}}>
      {bars.map((c, i) => (
        <div key={i} style={{width: 2, height: c === 0 ? 1 : 4 + c * 4,
                              background: c === 0 ? "var(--line-2)" : "var(--ink-2)",
                              borderRadius: 1}}/>
      ))}
    </div>
  );
}

// ─── Rule editor ───────────────────────────────────────────────────────────
function RuleEditor({ rule, onBack }) {
  const Ic = window.Icons;
  const [mode, setMode] = useStateAlarm(rule?.mode || "Template");
  const [showPreview, setShowPreview] = useStateAlarm(true);

  const isNew = !rule;
  const name = rule?.name || "Press bearing vibration — drive end";
  const severity = rule?.severity || "warn";

  return (
    <div className="page-body fade-in" style={{maxWidth: 1280}}>
      <div className="page-h" style={{marginBottom: 18}}>
        <div>
          <button onClick={onBack} className="btn btn-sm btn-ghost" style={{marginBottom: 8}}>
            <Ic.chevL size={13}/> All alarms
          </button>
          <h1 className="page-title" style={{fontSize: 22}}>{isNew ? "New alarm" : name}</h1>
          <div className="page-sub">
            {isNew ? "Drafting a new rule." : <>Last triggered {rule.lastTrig} · Created by {rule.author}</>}
          </div>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost">{rule?.state === "paused" ? "Resume" : "Pause"}</button>
          <button className="btn btn-sm btn-ghost"><Ic.x size={13}/> Discard</button>
          <button className="btn btn-sm btn-primary"><Ic.check size={13}/> Save & enable</button>
        </div>
      </div>

      <div className="alarms-editor-layout" style={{display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24}}>
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>

          {/* Mode selector */}
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            <div style={{padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)"}}>
              <div>
                <div style={{fontSize: 13.5, fontWeight: 500}}>How is this rule defined?</div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>Match the editor to your comfort level. You can switch any time.</div>
              </div>
              <div style={{display: "flex", padding: 2, background: "var(--surface-3)", borderRadius: 7, gap: 2}}>
                {["Template", "Visual", "Expression"].map((mo) => (
                  <button key={mo} onClick={() => setMode(mo)}
                          style={{fontSize: 12, fontWeight: 500, padding: "5px 12px",
                                   border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                                   background: mode === mo ? "var(--surface)" : "transparent",
                                   color: mode === mo ? "var(--ink)" : "var(--ink-2)",
                                   boxShadow: mode === mo ? "var(--shadow-card)" : "none"}}>
                    {mo}
                  </button>
                ))}
              </div>
            </div>

            {mode === "Template" && <TemplateMode />}
            {mode === "Visual" && <VisualMode />}
            {mode === "Expression" && <ExpressionMode />}
          </div>

          {/* Backtest */}
          <Backtest />

          {/* Routing & suppression */}
          <div className="card" style={{padding: 18}}>
            <div className="eyebrow" style={{marginBottom: 12}}>When this fires</div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
              <div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6}}>Notify</div>
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                  <span className="chip"><Ic.check size={10}/> Maintenance team channel</span>
                  <span className="chip"><Ic.check size={10}/> On-call</span>
                  <span className="chip chip-outline"><Ic.plus size={10}/> Add</span>
                </div>
              </div>
              <div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6}}>Suppress when</div>
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                  <span className="chip">Maintenance mode</span>
                  <span className="chip">Quiet hours 22–06</span>
                  <span className="chip chip-outline"><Ic.plus size={10}/> Add</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail — summary */}
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <div className="card" style={{padding: 16}}>
            <div className="eyebrow" style={{marginBottom: 8}}>Summary</div>
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
              <Field label="Name">
                <input className="input" defaultValue={name}/>
              </Field>
              <Field label="Scope">
                <select className="input">
                  <option>All Schuler MSP-630 presses</option>
                  <option>This machine only (WLF-P04)</option>
                  <option>Site: Wolfsburg</option>
                  <option>Global</option>
                </select>
              </Field>
              <Field label="Severity">
                <SeverityPicker value={severity}/>
              </Field>
              <Field label="Plain-language summary">
                <div style={{padding: 10, background: "var(--surface-2)", borderRadius: 6,
                               fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.5,
                               border: "1px solid var(--line)"}}>
                  Alert as a <b>warning</b> when drive-end bearing velocity RMS stays above <b>3.5&nbsp;mm/s</b> for <b>15 minutes</b>, on any Schuler MSP-630 press.
                </div>
              </Field>
            </div>
          </div>

          <div className="card" style={{padding: 16}}>
            <div className="eyebrow" style={{marginBottom: 8}}>Trust ladder</div>
            <div style={{fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55}}>
              This rule is <b>yours</b> — Cadence won't override it. Our ML model can suggest related rules below; nothing fires automatically.
            </div>
            <div style={{marginTop: 12, padding: 10, background: "var(--surface-2)", borderRadius: 6,
                          border: "1px dashed var(--line-2)", display: "flex", alignItems: "center", gap: 10}}>
              <Ic.sparkle size={14}/>
              <div style={{fontSize: 12, flex: 1}}>
                <b>Suggested companion:</b> add a Critical rule at 6.0 mm/s with no suppression.
              </div>
              <button className="btn btn-sm btn-ghost">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityPicker({ value }) {
  const sevs = [
    { v: "info", l: "Info", c: "var(--forecast)" },
    { v: "warn", l: "Warning", c: "var(--warn)" },
    { v: "crit", l: "Critical", c: "var(--crit)" },
    { v: "safety", l: "Safety", c: "var(--crit)" },
  ];
  return (
    <div style={{display: "flex", gap: 6}}>
      {sevs.map((s) => (
        <button key={s.v}
                style={{flex: 1, padding: "6px 8px", border: "1px solid",
                         borderColor: value === s.v ? s.c : "var(--line-2)",
                         background: value === s.v ? s.c + "1A" : "var(--surface)",
                         color: value === s.v ? s.c : "var(--ink-2)",
                         borderRadius: 6, fontSize: 11.5, fontWeight: 500,
                         cursor: "pointer", fontFamily: "inherit",
                         display: "flex", alignItems: "center", justifyContent: "center", gap: 6}}>
          <span className="dot" style={{background: s.c}}/> {s.l}
        </button>
      ))}
    </div>
  );
}

// ─── Template mode ────────────────────────────────────────────────────────
function TemplateMode() {
  const Ic = window.Icons;
  const [selected, setSelected] = useStateAlarm("vibration-trend");
  const templates = [
    { id: "vibration-trend", icon: "vibration", name: "Vibration trend",
      desc: "Alert when vibration rises above a threshold for a sustained period." },
    { id: "temp-rise", icon: "temp", name: "Temperature rise",
      desc: "Alert when temperature exceeds baseline by more than X°C." },
    { id: "current-imbalance", icon: "current", name: "Current imbalance",
      desc: "Alert when phase current imbalance exceeds a percentage." },
    { id: "cycle-slow", icon: "cycle", name: "Slow cycle",
      desc: "Alert when machine runs slower than its baseline." },
    { id: "offline", icon: "info", name: "Sensor offline",
      desc: "Alert when sensor stops reporting for longer than X minutes." },
  ];
  return (
    <div style={{padding: 18}}>
      <div className="eyebrow" style={{marginBottom: 12}}>Start from a template</div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 18}}>
        {templates.map((t) => {
          const I = window.Icons[t.icon];
          const isSelected = selected === t.id;
          return (
            <div key={t.id} onClick={() => setSelected(t.id)}
                 style={{padding: 12, border: "1px solid " + (isSelected ? "var(--ink)" : "var(--line)"),
                          background: isSelected ? "var(--surface-2)" : "var(--surface)",
                          borderRadius: 8, cursor: "pointer",
                          display: "flex", gap: 12, alignItems: "flex-start",
                          boxShadow: isSelected ? "var(--shadow-card)" : "none"}}>
              <div style={{width: 30, height: 30, borderRadius: 7, background: "var(--surface-3)",
                             display: "grid", placeItems: "center", color: "var(--ink-2)", flexShrink: 0}}>
                <I size={14}/>
              </div>
              <div>
                <div style={{fontSize: 13, fontWeight: 500, color: "var(--ink)"}}>{t.name}</div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.45}}>{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure selected */}
      <div style={{padding: 16, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8}}>
        <div className="eyebrow" style={{marginBottom: 12}}>Configure</div>
        <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px 16px", alignItems: "center", fontSize: 13, color: "var(--ink-1)"}}>
          <span>Channel</span>
          <select className="input"><option>Velocity RMS · drive-end bearing</option><option>Velocity RMS · non-drive end</option></select>
          <span>Above</span>
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            <input className="input" defaultValue="3.5" style={{width: 80}}/>
            <span className="t-3">mm/s</span>
            <span className="t-4" style={{fontSize: 11.5}}>(baseline 2.4)</span>
          </div>
          <span>For at least</span>
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            <input className="input" defaultValue="15" style={{width: 80}}/>
            <select className="input" style={{width: 100}}>
              <option>minutes</option><option>hours</option><option>cycles</option>
            </select>
          </div>
          <span>Then</span>
          <SeverityPicker value="warn"/>
        </div>
      </div>
    </div>
  );
}

// ─── Visual mode (rule builder) ───────────────────────────────────────────
function VisualMode() {
  const Ic = window.Icons;
  return (
    <div style={{padding: 18}}>
      <div className="eyebrow" style={{marginBottom: 12}}>Conditions (AND)</div>
      <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 16}}>
        <ConditionRow channel="Velocity RMS · drive-end" op="Above" val="3.5 mm/s" duration="15 min" />
        <ConditionRow channel="Temperature · bearing" op="Above" val="70 °C" duration="any" />
        <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start"}}>
          <Ic.plus size={13}/> Add condition
        </button>
      </div>

      <div className="eyebrow" style={{margin: "20px 0 12px"}}>Or any of these (OR)</div>
      <div style={{display: "flex", flexDirection: "column", gap: 8}}>
        <ConditionRow channel="Bearing kurtosis · drive-end" op="Step change" val="> +50%" duration="36h" />
        <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start"}}>
          <Ic.plus size={13}/> Add condition
        </button>
      </div>

      <div style={{marginTop: 16, padding: 12, background: "var(--surface-2)", borderRadius: 8,
                    border: "1px solid var(--line)", display: "flex", gap: 10, alignItems: "flex-start"}}>
        <Ic.sparkle size={14}/>
        <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.5}}>
          This reads as: <b>vibration above 3.5 mm/s AND temperature above 70 °C for 15 min</b>, <b>OR</b> kurtosis step change of more than 50% in 36 hours.
        </div>
      </div>
    </div>
  );
}

function ConditionRow({ channel, op, val, duration }) {
  return (
    <div style={{display: "grid", gridTemplateColumns: "16px 1.5fr 1fr 1fr 1fr 30px",
                  gap: 8, padding: 10, background: "var(--surface)",
                  border: "1px solid var(--line)", borderRadius: 7, alignItems: "center"}}>
      <span style={{color: "var(--ink-4)"}}><window.Icons.drag size={14}/></span>
      <select className="input" defaultValue={channel}><option>{channel}</option></select>
      <select className="input" defaultValue={op}><option>{op}</option></select>
      <input className="input" defaultValue={val}/>
      <select className="input" defaultValue={duration}><option>{duration}</option></select>
      <button className="btn btn-sm btn-ghost" style={{padding: 4, color: "var(--ink-4)"}}><window.Icons.x size={12}/></button>
    </div>
  );
}

// ─── Expression mode ──────────────────────────────────────────────────────
function ExpressionMode() {
  const sample = `# Bearing kurtosis step change\n# Detects sudden change in vibration spectrum kurtosis,\n# typical 2-5 days before bearing failure\n\nlet de_kurt = ewma(channel("vibration.de.kurtosis"), span="6h")\nlet de_kurt_baseline = ewma(channel("vibration.de.kurtosis"), span="14d", offset="14d")\nlet step = de_kurt / de_kurt_baseline\n\nfire severity="critical"\n  when step > 1.5\n   and channel("vibration.de.velocity_rms") > 5.0\n   for at_least "30m"`;
  return (
    <div>
      <div style={{padding: "12px 18px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--surface-2)"}}>
        <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>
          <span className="mono">cadence-ql</span> · Full language reference →
        </div>
        <div style={{display: "flex", gap: 6}}>
          <button className="btn btn-sm btn-ghost">Validate</button>
          <button className="btn btn-sm btn-ghost">Format</button>
        </div>
      </div>
      <pre style={{margin: 0, padding: 18, fontFamily: "var(--font-mono)", fontSize: 12.5,
                    lineHeight: 1.65, color: "var(--ink-1)",
                    background: "var(--surface)", overflow: "auto",
                    minHeight: 240}}>
{sample.split("\n").map((line, i) => (
  <div key={i} style={{display: "flex"}}>
    <span style={{color: "var(--ink-4)", width: 28, textAlign: "right", userSelect: "none", paddingRight: 12}}>{i+1}</span>
    <span style={{color: line.startsWith("#") ? "var(--ink-4)" : "var(--ink-1)"}}>
      {syntaxHL(line)}
    </span>
  </div>
))}
      </pre>
    </div>
  );
}

function syntaxHL(line) {
  if (line.startsWith("#")) return line;
  const tokens = [];
  const keywords = ["let", "fire", "when", "and", "or", "for"];
  const fns = ["ewma", "channel", "at_least"];
  const re = /(".*?"|\d+\.?\d*|\b\w+\b|[^\w\s])/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const tok = m[0];
    if (keywords.includes(tok)) tokens.push(<span key={m.index} style={{color: "var(--accent)"}}>{tok}</span>);
    else if (fns.includes(tok)) tokens.push(<span key={m.index} style={{color: "var(--forecast)"}}>{tok}</span>);
    else if (tok.startsWith('"')) tokens.push(<span key={m.index} style={{color: "var(--ok)"}}>{tok}</span>);
    else if (!isNaN(parseFloat(tok))) tokens.push(<span key={m.index} style={{color: "var(--accent-strong)"}}>{tok}</span>);
    else tokens.push(<span key={m.index}>{tok}</span>);
  }
  // Reassemble with original spacing
  return (
    <>
      {line.split(/(\s+)/).map((part, i) => {
        if (/^\s+$/.test(part)) return part;
        if (keywords.includes(part)) return <span key={i} style={{color: "var(--accent)", fontWeight: 500}}>{part}</span>;
        if (fns.includes(part)) return <span key={i} style={{color: "var(--forecast)"}}>{part}</span>;
        if (part.startsWith('"')) return <span key={i} style={{color: "var(--ok)"}}>{part}</span>;
        if (!isNaN(parseFloat(part))) return <span key={i} style={{color: "var(--accent-strong)"}}>{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Backtest panel ───────────────────────────────────────────────────────
function Backtest() {
  const [range, setRange] = useStateAlarm("90d");
  const Ic = window.Icons;
  // Generate firings — 4 in 90d for "warn"
  const firings = useMemoAlarm(() => {
    return [
      { day: 8, sev: "warn", machine: "WLF-P04", outcome: "Would have fired" },
      { day: 32, sev: "warn", machine: "WLF-P02", outcome: "Would have fired" },
      { day: 56, sev: "warn", machine: "WLF-P04", outcome: "Would have fired" },
      { day: 80, sev: "warn", machine: "WLF-P03", outcome: "Would have fired (suppressed by quiet hours)" },
    ];
  }, [range]);

  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{padding: "14px 18px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <div style={{fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8}}>
            Backtest <span className="ai-badge" style={{fontSize: 10.5}}>Trust check</span>
          </div>
          <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>
            How often would this rule have fired on past data? Helps catch noisy rules before they fire on you.
          </div>
        </div>
        <div style={{display: "flex", padding: 2, background: "var(--surface-3)", borderRadius: 7, gap: 2}}>
          {["30d", "90d", "1y"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
                    style={{fontSize: 11.5, fontWeight: 500, padding: "4px 10px",
                             border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                             background: range === r ? "var(--surface)" : "transparent",
                             color: range === r ? "var(--ink)" : "var(--ink-2)",
                             boxShadow: range === r ? "var(--shadow-card)" : "none"}}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding: 18}}>
        <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 18}}>
          <BTStat label="Would have fired" value={firings.length + ""} sub="across 3 machines"/>
          <BTStat label="Suppressed" value="1" sub="quiet-hours rule"/>
          <BTStat label="Estimated noise" value="Low" sub="0.04 firings / day" color="var(--ok)"/>
        </div>

        {/* Timeline */}
        <div style={{position: "relative", height: 96, background: "var(--surface-2)",
                      borderRadius: 8, padding: "12px 16px", border: "1px solid var(--line)"}}>
          {/* Axis */}
          <div style={{position: "relative", height: "100%", display: "flex", alignItems: "center"}}>
            <div style={{position: "absolute", inset: 0, top: "50%", height: 1, background: "var(--line-2)"}}/>
            {firings.map((f, i) => {
              const x = (f.day / 90) * 100;
              return (
                <div key={i} style={{position: "absolute", left: `${x}%`, top: 0, bottom: 0,
                                       display: "flex", flexDirection: "column", justifyContent: "center",
                                       alignItems: "center", transform: "translateX(-50%)"}}
                     title={`Day ${f.day}: ${f.outcome}`}>
                  <div style={{width: 2, height: 36, background: f.outcome.includes("suppressed") ? "var(--unknown)" : "var(--warn)"}}/>
                  <div style={{width: 10, height: 10, borderRadius: 50, background: f.outcome.includes("suppressed") ? "var(--unknown)" : "var(--warn)",
                                 border: "2px solid var(--surface-2)"}}/>
                </div>
              );
            })}
          </div>
          {/* X labels */}
          <div style={{position: "absolute", bottom: 0, left: 16, right: 16,
                        display: "flex", justifyContent: "space-between",
                        fontSize: 10, color: "var(--ink-4)", paddingTop: 2}}>
            <span>90 days ago</span>
            <span>60</span><span>30</span><span>Today</span>
          </div>
        </div>

        {/* Firing list */}
        <div style={{marginTop: 14}}>
          {firings.map((f, i) => (
            <div key={i} style={{display: "grid", gridTemplateColumns: "70px 110px 1fr 80px",
                                  gap: 14, padding: "10px 0", fontSize: 12,
                                  borderTop: i === 0 ? "1px solid var(--line)" : "none",
                                  borderBottom: "1px solid var(--line)", alignItems: "center"}}>
              <span className="mono t-3">Day {f.day}</span>
              <span className="mono">{f.machine}</span>
              <span style={{color: "var(--ink-1)"}}>{f.outcome}</span>
              <button className="btn btn-sm btn-ghost">View →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BTStat({ label, value, sub, color }) {
  return (
    <div>
      <div className="eyebrow" style={{fontSize: 10.5, marginBottom: 4}}>{label}</div>
      <div className="metric" style={{fontSize: 22, color: color || "var(--ink)"}}>{value}</div>
      <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>{sub}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="eyebrow" style={{marginBottom: 6, fontSize: 10.5}}>{label}</div>
      {children}
    </div>
  );
}

window.AlarmsScreen = AlarmsScreen;
