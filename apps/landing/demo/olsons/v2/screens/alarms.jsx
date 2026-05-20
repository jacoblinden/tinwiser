// alarms.jsx — Alarm configuration.
// Where Olsons' technical authority lives in the product. Templates as
// institutional knowledge, customer-authored rules alongside, backtest as
// the trust feature.

const { useState: useStateAlarm, useMemo: useMemoAlarm } = React;

function AlarmsScreen({ go, persona, sub, subId }) {
  const Ic = window.Icons;
  const { ALARM_TEMPLATES, ALARM_RULES, TECH_SUGGESTIONS } = window.DATA;
  const kind = persona.kind || "customer";
  const defaultTab = kind === "tech" ? "playbook" : kind === "manager" ? "templates" : "rules";
  const initialTab = sub === "templates" ? (kind === "tech" ? "playbook" : "templates")
    : sub === "drafts" ? "drafts" : sub === "suggestions" ? "suggestions" : defaultTab;
  const [tab, setTab]               = useStateAlarm(initialTab);
  const [editing, setEditing]       = useStateAlarm(null); // null | rule | template | "new"
  const [llmText, setLlmText]       = useStateAlarm("");
  const [llmProposed, setLlmProposed] = useStateAlarm(null);

  // Deep-link: alarms:rule:RL-001, alarms:template:TPL-..., alarms:new
  const deepRule = sub === "rule"     ? window.getRule(subId) : null;
  const deepTpl  = sub === "template" ? window.getTemplate(subId) : null;
  const deepNew  = sub === "new";
  const pressPrefill = deepNew && subId && String(subId).startsWith("press-") ? String(subId).slice(6) : null;

  const activeEditing = editing !== null ? editing : deepRule || deepTpl || (deepNew ? "new" : null);
  const readOnly = kind === "tech" && activeEditing !== "new";
  const suggestionMode = kind === "tech" && activeEditing === "new";
  const customerOverride = kind === "customer" && activeEditing && activeEditing !== "new"
    && !activeEditing.pressClass && activeEditing.template;

  if (activeEditing) {
    return <RuleEditor rule={activeEditing === "new" ? null : activeEditing}
                       proposedFromLlm={activeEditing === "new" ? llmProposed : null}
                       persona={persona}
                       readOnly={readOnly}
                       suggestionMode={suggestionMode}
                       customerOverride={customerOverride}
                       pressPrefill={pressPrefill}
                       onBack={() => { setEditing(null); setLlmProposed(null); go("alarms"); }}
                       go={go}/>;
  }

  const ruleCounts = {
    all: ALARM_RULES.length,
    active: ALARM_RULES.filter(r => r.state === "active").length,
    olsons: ALARM_RULES.filter(r => r.author.kind === "olsons").length,
    customer: ALARM_RULES.filter(r => r.author.kind === "customer").length,
    drafts: ALARM_RULES.filter(r => r.state === "draft").length,
  };
  const pendingSuggestions = TECH_SUGGESTIONS.filter(s => s.status === "pending").length;
  const fleetAdoptions = ALARM_TEMPLATES.reduce((s, t) => s + t.adoptedBy, 0);
  const fleetCatches = ALARM_TEMPLATES.reduce((s, t) => s + t.catches, 0);
  const mySuggestions = window.suggestionsForTech("lb");
  const adoptedRules = ALARM_RULES.filter(r => r.template && r.state === "active");
  const openRule = (r) => { setEditing(r); go("alarms:rule:" + r.id); };
  const openTemplate = (t) => { setEditing(t); go("alarms:template:" + t.id); };
  const openNew = () => { setEditing("new"); go(pressPrefill ? "alarms:new:press-" + pressPrefill : "alarms:new"); };

  if (kind === "customer") {
    return (
      <div className="page-body fade-in" style={{maxWidth: 1480}}>
        <div className="page-h page-h-quiet">
          <div>
            <p className="page-greeting">Alarm rules</p>
            <p className="page-title page-title-lg">Your alarm rules.</p>
            <p className="page-sub" style={{marginTop: 6}}>Olsons templates you&apos;ve adopted, plus rules you wrote for your floor.</p>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <button className="btn btn-sm btn-ghost" onClick={() => setTab("templates")}><Ic.workshop size={13}/> Browse Olsons templates</button>
            <button className="btn btn-sm btn-primary" onClick={openNew}><Ic.plus size={13}/> New rule</button>
          </div>
        </div>
        <InstrumentCluster cols={4} items={[
          { label: "Active rules", value: ruleCounts.active, sub: `${ruleCounts.olsons} from Olsons · ${ruleCounts.customer} yours` },
          { label: "Templates adopted", value: adoptedRules.length, sub: `${ALARM_TEMPLATES.length} available` },
          { label: "Your rules", value: ruleCounts.customer, sub: "Local context" },
          { label: "Fired · 30 days", value: ALARM_RULES.reduce((s, r) => s + r.triggered30d, 0), sub: "This fleet" },
        ]}/>
        <LlmPrompt text={llmText} setText={setLlmText} onPropose={(p) => { setLlmProposed(p); openNew(); }}/>
        <div className="tabs" style={{marginBottom: 18}}>
          <div className={"tab " + (tab === "rules" ? "active" : "")} onClick={() => setTab("rules")}><Ic.list size={13}/> Active rules <span className="count">{ruleCounts.active}</span></div>
          <div className={"tab " + (tab === "templates" ? "active" : "")} onClick={() => setTab("templates")}><Ic.workshop size={13}/> Olsons templates <span className="count">{adoptedRules.length} adopted</span></div>
          <div className={"tab " + (tab === "drafts" ? "active" : "")} onClick={() => setTab("drafts")}>Drafts <span className="count">{ruleCounts.drafts}</span></div>
        </div>
        {tab === "rules" && <RulesList rules={ALARM_RULES.filter(r => r.state === "active")} onOpen={openRule} go={go} showProvenance/>}
        {tab === "templates" && <TemplatesShelf templates={ALARM_TEMPLATES} rules={ALARM_RULES} onOpen={openTemplate} adoptMode/>}
        {tab === "drafts" && <RulesList rules={ALARM_RULES.filter(r => r.state === "draft")} onOpen={openRule} go={go} showProvenance/>}
      </div>
    );
  }

  if (kind === "tech") {
    return (
      <div className="page-body fade-in" style={{maxWidth: 1480}}>
        <div className="page-h page-h-quiet">
          <div>
            <p className="page-greeting">Playbooks &amp; rules</p>
            <p className="page-title page-title-lg">What Olsons publishes — and what you see on site.</p>
            <p className="page-sub" style={{marginTop: 6}}>Browse templates. Suggest from the field — Mikael reviews before fleet-wide publish.</p>
          </div>
          <button className="btn btn-sm btn-primary" onClick={openNew}><Ic.plus size={13}/> Suggest a rule</button>
        </div>
        <window.OlsonsStrip><b>Consult mode.</b> Read-only on this customer. Suggestions route to Mikael Krey.</window.OlsonsStrip>
        <div style={{height: 20}}/>
        <div className="tabs" style={{marginBottom: 18}}>
          <div className={"tab " + (tab === "playbook" ? "active" : "")} onClick={() => setTab("playbook")}><Ic.workshop size={13}/> Playbook <span className="count">{ALARM_TEMPLATES.length}</span></div>
          <div className={"tab " + (tab === "active" ? "active" : "")} onClick={() => setTab("active")}><Ic.list size={13}/> Active on NordPlåt <span className="count">{ruleCounts.active}</span></div>
          <div className={"tab " + (tab === "suggestions" ? "active" : "")} onClick={() => setTab("suggestions")}>My suggestions <span className="count">{mySuggestions.length}</span></div>
        </div>
        {tab === "playbook" && <TemplatesShelf templates={ALARM_TEMPLATES} rules={ALARM_RULES} onOpen={openTemplate} consultMode/>}
        {tab === "active" && <RulesList rules={ALARM_RULES.filter(r => r.state === "active")} onOpen={openRule} go={go} showProvenance/>}
        {tab === "suggestions" && <SuggestionsList suggestions={mySuggestions} go={go}/>}
      </div>
    );
  }

  if (kind === "manager") {
    return (
      <div className="page-body fade-in" style={{maxWidth: 1480}}>
        <div className="page-h page-h-quiet">
          <div>
            <p className="page-greeting">Knowledge library</p>
            <p className="page-title page-title-lg">Olsons&apos; institutional asset.</p>
            <p className="page-sub" style={{marginTop: 6}}>Author templates for the fleet. Review technician suggestions before you publish.</p>
          </div>
          <button className="btn btn-sm btn-primary" onClick={openNew}><Ic.plus size={13}/> New template</button>
        </div>
        <InstrumentCluster cols={4} items={[
          { label: "Templates published", value: ALARM_TEMPLATES.length, sub: "Press-class playbooks" },
          { label: "Fleet adoptions", value: fleetAdoptions, sub: "Machines on your rules" },
          { label: "Issues caught", value: fleetCatches, sub: "All customers · all time" },
          { label: "Tech suggestions", value: pendingSuggestions, sub: "Awaiting review", tone: pendingSuggestions ? "warn" : "" },
        ]}/>
        <div className="tabs" style={{marginBottom: 18}}>
          <div className={"tab " + (tab === "templates" ? "active" : "")} onClick={() => setTab("templates")}><Ic.workshop size={13}/> Templates <span className="count">{ALARM_TEMPLATES.length}</span></div>
          <div className={"tab " + (tab === "suggestions" ? "active" : "")} onClick={() => setTab("suggestions")}>Tech suggestions <span className="count">{pendingSuggestions}</span></div>
          <div className={"tab " + (tab === "customer" ? "active" : "")} onClick={() => setTab("customer")}>Customer-authored <span className="count">{ruleCounts.customer}</span></div>
          <div className={"tab " + (tab === "drafts" ? "active" : "")} onClick={() => setTab("drafts")}>Drafts <span className="count">{ruleCounts.drafts}</span></div>
        </div>
        {tab === "templates" && <TemplatesShelf templates={ALARM_TEMPLATES} rules={ALARM_RULES} onOpen={openTemplate} authorMode go={go}/>}
        {tab === "suggestions" && <SuggestionsInbox suggestions={window.suggestionsForManager()} go={go}/>}
        {tab === "customer" && (
          <>
            <window.OlsonsStrip>Customer rules — promote recurring patterns into fleet templates.</window.OlsonsStrip>
            <div style={{height: 16}}/>
            <RulesList rules={ALARM_RULES.filter(r => r.author.kind === "customer")} onOpen={openRule} go={go} showProvenance promoteMode/>
          </>
        )}
        {tab === "drafts" && <RulesList rules={ALARM_RULES.filter(r => r.state === "draft")} onOpen={openRule} go={go}/>}
      </div>
    );
  }

  return null;
}

// ─── Tech suggestions (field → service manager) ─────────────────────────
function SuggestionsInbox({ suggestions, go }) {
  const Ic = window.Icons;
  const pending = suggestions.filter(s => s.status === "pending");
  const inReview = suggestions.filter(s => s.status === "in_review");
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 24}}>
      {pending.length > 0 && (
        <div>
          <window.SectionH title="Awaiting review" sub={`${pending.length} from technicians in the field`}/>
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {pending.map((s) => <SuggestionCard key={s.id} s={s} go={go} manager/>)}
          </div>
        </div>
      )}
      {inReview.length > 0 && (
        <div>
          <window.SectionH title="In review" sub="Being refined into a publishable template"/>
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {inReview.map((s) => <SuggestionCard key={s.id} s={s} go={go} manager inReview/>)}
          </div>
        </div>
      )}
      {suggestions.length === 0 && (
        <div className="card" style={{padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13.5}}>
          No pending suggestions.
        </div>
      )}
    </div>
  );
}

function SuggestionsList({ suggestions, go }) {
  if (!suggestions.length) {
    return (
      <div className="card" style={{padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13.5}}>
        No suggestions yet. Use <b>Suggest a rule</b> from a press detail page or the button above.
      </div>
    );
  }
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 10}}>
      {suggestions.map((s) => <SuggestionCard key={s.id} s={s} go={go}/>)}
    </div>
  );
}

function SuggestionCard({ s, go, manager, inReview }) {
  const Ic = window.Icons;
  const press = s.machine ? window.getPress(s.machine) : null;
  return (
    <div className="card" style={{padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start"}}>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 6}}>
          <span style={{fontSize: 14, fontWeight: 500, color: "var(--ink)"}}>{s.title}</span>
          {inReview ? <span className="tag tag-outline">In review</span> : <span className="tag tag-warn">Pending</span>}
        </div>
        <p style={{margin: "0 0 8px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55}}>{s.plain}</p>
        <div style={{fontSize: 11.5, color: "var(--ink-3)", display: "flex", flexWrap: "wrap", gap: 8}}>
          <span>{s.author.name}</span>
          <span className="sep-dot">·</span>
          <span>{s.pressClass}</span>
          {press && <><span className="sep-dot">·</span><span className="mono">{press.name}</span></>}
          <span className="sep-dot">·</span>
          <span>{s.raised}</span>
        </div>
      </div>
      {manager && (
        <div>
          <button className="btn btn-sm btn-primary"><Ic.check size={12}/> Publish template</button>
          <button className="btn btn-sm btn-ghost">Refine in editor</button>
        </div>
      )}
    </div>
  );
}

// ─── LLM prompt (calm — never twee) ──────────────────────────────────────
function LlmPrompt({ text, setText, onPropose }) {
  const Ic = window.Icons;
  const examples = [
    "Tell me when MSP-630 #1 starts running slow on recipe R-201",
    "Warn me if BSTA-50 #3 peak tonnage drifts more than 5%",
    "Critical: any press exceeds ISO 10816 zone D",
  ];
  return (
    <div style={{marginBottom: 24, padding: "18px 20px",
                  background: "var(--surface-2)", border: "1px solid var(--line)",
                  borderTop: "1px solid var(--line-strong)"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
        <Ic.sparkle size={14} style={{color: "var(--forecast)"}}/>
        <div style={{fontSize: 13.5, fontWeight: 600, color: "var(--ink)"}}>Describe an alarm</div>
        <span className="ai-badge">Beta</span>
        <span style={{marginLeft: "auto", fontSize: 11, color: "var(--ink-3)"}}>You approve before it goes live.</span>
      </div>
      <div style={{display: "flex", gap: 10, alignItems: "stretch"}}>
        <input className="input" placeholder={examples[0] + '…'}
               value={text} onChange={(e) => setText(e.target.value)}
               style={{flex: 1, height: 38, fontSize: 13}}/>
        <button className="btn btn-lg btn-primary"
                onClick={() => onPropose(interpretLlm(text || examples[0]))}>
          Propose rule
        </button>
      </div>
      <div style={{marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap"}}>
        <span style={{fontSize: 11, color: "var(--ink-4)"}}>Try:</span>
        {examples.slice(1).map((ex, i) => (
          <button key={i} onClick={() => setText(ex)}
                  className="chip"
                  style={{cursor: "pointer", fontFamily: "inherit", fontSize: 11}}>
            "{ex.slice(0, 60)}{ex.length > 60 ? "…" : ""}"
          </button>
        ))}
      </div>
    </div>
  );
}

// Translate natural-language to an inferred rule scaffold. Just enough to
// pre-fill the visual editor for the demo.
function interpretLlm(text) {
  const t = text.toLowerCase();
  if (t.includes("slow") || t.includes("spm")) {
    return {
      name: "Slow cycle anomaly · auto-drafted",
      severity: "info",
      scope: "MSP-630 #1 · recipe R-201",
      mode: "visual",
      channels: [
        { channel: "press.spm", op: "Below", value: "−8%", duration: "5 min", note: "vs recipe target" },
      ],
      reasoning: "Inferred from \"runs slow on recipe R-201\". Threshold pulled from Olsons template TPL-MSP-SLOWCYCLE.",
    };
  }
  if (t.includes("tonnage") || t.includes("force") || t.includes("peak")) {
    return {
      name: "Peak tonnage drift · auto-drafted",
      severity: "warn",
      scope: "BSTA-50 #3",
      mode: "visual",
      channels: [
        { channel: "press.peak_tonnage", op: "Above baseline by", value: "5 %", duration: "200 cycles", note: "per recipe" },
      ],
      reasoning: "Inferred from \"tonnage drifts\". Per-recipe baseline behaviour from TPL-AIDA-TONNAGE.",
    };
  }
  if (t.includes("iso") || t.includes("critical") || t.includes("safety") || t.includes("10816")) {
    return {
      name: "ISO 10816 zone D · auto-drafted",
      severity: "safety",
      scope: "All presses",
      mode: "template",
      template: "TPL-ISO-10816",
      reasoning: "Matched against existing Olsons safety template (TPL-ISO-10816).",
    };
  }
  return {
    name: "Custom rule · auto-drafted",
    severity: "warn",
    scope: "BSTA-50 #3",
    mode: "visual",
    channels: [],
    reasoning: "Couldn't confidently match. Loaded an empty visual editor.",
  };
}

// ─── Rules list ──────────────────────────────────────────────────────────
function RulesList({ rules, onOpen, go, state, showProvenance, promoteMode }) {
  const Ic = window.Icons;
  const shown = state ? rules.filter(r => r.state === state) : rules;

  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr) 110px 90px 130px 110px 24px",
                    gap: 14, padding: "10px 20px",
                    background: "var(--surface)", borderBottom: "1px solid var(--line)",
                    fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--ink-3)"}}>
        <div>Rule</div>
        <div>Scope</div>
        <div>Severity</div>
        <div>Mode</div>
        <div>Last 30 days</div>
        <div>State</div>
        <div></div>
      </div>
      {shown.map((r) => <RuleRow key={r.id} r={r} onOpen={() => onOpen(r)} showProvenance={showProvenance} promoteMode={promoteMode}/>)}
      {shown.length === 0 && (
        <div style={{padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: 13.5}}>
          No rules in this view.
        </div>
      )}
    </div>
  );
}

// Resolve any author id (Olsons techs/manager OR customer staff) to a display name.
function lookupAuthor(author) {
  if (!author || author.id === "system") return { kind: "system", name: "System" };
  if (author.kind === "customer") {
    const customer = window.DATA.CUSTOMER;
    if (author.id === "ep") return { kind: "customer", name: "Erik Persson", role: customer.staff?.[0]?.role || "Maintenance manager" };
    if (author.id === "al") return { kind: "customer", name: "Anna Lundgren", role: "Production planner" };
    return { kind: "customer", name: customer.name + " staff" };
  }
  const olsons = window.getTech(author.id);
  if (olsons) return { kind: "olsons", name: olsons.name, role: olsons.role };
  return { kind: "system", name: "System" };
}

function RuleRow({ r, onOpen, showProvenance, promoteMode }) {
  const Ic = window.Icons;
  const author = lookupAuthor(r.author);
  const provenanceLabel = showProvenance
    ? (r.template
        ? "Olsons template"
        : author.kind === "customer"
          ? "Authored by you"
          : author.kind === "olsons"
            ? "From Olsons"
            : null)
    : null;
  return (
    <div className="row-hover"
         onClick={onOpen}
         style={{display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr) 110px 90px 130px 110px 24px",
                  gap: 14, padding: "14px 20px",
                  borderBottom: "1px solid var(--line)",
                  alignItems: "center", cursor: "pointer", fontSize: 13}}>
      <div style={{minWidth: 0}}>
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 3}}>
          <span style={{fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{r.name}</span>
          {provenanceLabel && (
            <span style={{fontSize: 10, color: r.template ? "var(--olsons)" : "var(--ink-3)", fontWeight: 500,
                           letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0}}>
              {provenanceLabel}
            </span>
          )}
          {!showProvenance && r.template && (
            <span style={{fontSize: 10, color: "var(--olsons)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase"}}>from template</span>
          )}
        </div>
        <div style={{fontSize: 11.5, color: "var(--ink-3)",
                       display: "flex", alignItems: "center", gap: 8}}>
          <span className="mono">{r.id}</span>
          <span className="sep-dot">·</span>
          {author.kind === "system"
            ? <span>System</span>
            : <span>by {author.name}
                {author.kind === "olsons"   && <span className="t-olsons"> · Olsons</span>}
                {author.kind === "customer" && <span style={{color:"var(--ink-4)"}}> · NordPlåt</span>}
              </span>}
          {r.suppression && r.suppression.length > 0 && (
            <>
              <span className="sep-dot">·</span>
              <span>{r.suppression[0]}{r.suppression.length > 1 ? ` +${r.suppression.length - 1}` : ""}</span>
            </>
          )}
        </div>
      </div>
      <div style={{fontSize: 12, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
        {r.scope}
      </div>
      <div><SeverityTag severity={r.severity}/></div>
      <div><ModeTag mode={r.mode}/></div>
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <span className="mono tnum" style={{fontSize: 13, minWidth: 18}}>{r.triggered30d}</span>
        <FiringStrip n={30} firings={r.triggered30d}/>
      </div>
      <div>
        {r.state === "active"  && <window.StatusTag status="ok">Active</window.StatusTag>}
        {r.state === "draft"   && <span className="tag tag-outline">Draft</span>}
        {r.state === "paused"  && <window.StatusTag status="unknown">Paused</window.StatusTag>}
      </div>
      <div style={{color: "var(--ink-4)", textAlign: "right"}}><Ic.chevR size={13}/></div>
    </div>
  );
}

function SeverityTag({ severity }) {
  const map = {
    info:   { cls: "tag-forecast", label: "Info" },
    warn:   { cls: "tag-warn",     label: "Warning" },
    crit:   { cls: "tag-crit",     label: "Critical" },
    safety: { cls: "tag-crit",     label: "Safety" },
  };
  const m = map[severity] || map.info;
  return <span className={"tag " + m.cls}>{m.label}</span>;
}

function ModeTag({ mode }) {
  return <span className="tag tag-outline" style={{textTransform: "capitalize"}}>{mode}</span>;
}

// Tiny histogram-like firings strip
function FiringStrip({ n = 30, firings = 0 }) {
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
    <div style={{display: "flex", alignItems: "flex-end", gap: 1, height: 16}}>
      {bars.map((c, i) => (
        <div key={i} style={{width: 2, height: c === 0 ? 1 : 4 + c * 4,
                              background: c === 0 ? "var(--line-2)" : "var(--ink-2)"}}/>
      ))}
    </div>
  );
}

// ─── Templates shelf — Olsons' institutional knowledge ───────────────────
function TemplatesShelf({ templates, rules, onOpen, consultMode, authorMode, adoptMode }) {
  // Group by press class
  const grouped = templates.reduce((acc, t) => {
    (acc[t.pressClass] = acc[t.pressClass] || []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <window.OlsonsStrip>
        {consultMode
          ? <>Read-only playbook. Maintained by Mikael&apos;s team — suggest changes from the field, don&apos;t edit here.</>
          : authorMode
          ? <>Author and version templates here. Each publish propagates to every customer fleet that adopts it.</>
          : <><b>Olsons templates</b> encode 50 years of press-floor experience. <span style={{color: "var(--ink-3)"}}> Adopting one is one click.</span></>}
      </window.OlsonsStrip>

      <div style={{height: 22}}/>

      {Object.entries(grouped).map(([cls, ts]) => (
        <div key={cls} className="section" style={{marginBottom: 18}}>
          <window.SectionH title={cls} sub={`${ts.length} template${ts.length !== 1 ? "s" : ""} · published by Olsons`}/>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14}}>
            {ts.map((t) => (
              <TemplateCard key={t.id} t={t} rules={rules} onOpen={() => onOpen(t)}
                            consultMode={consultMode} authorMode={authorMode} adoptMode={adoptMode}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplateCard({ t, rules, onOpen, consultMode, authorMode, adoptMode }) {
  const Ic = window.Icons;
  const adopted = rules.some(r => r.template === t.id);
  const author = window.getTech(t.publishedBy);
  return (
    <div className="card" style={{padding: 16, display: "flex", flexDirection: "column", gap: 10,
                                    cursor: "pointer", height: "100%"}}
         onClick={onOpen}>
      <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10}}>
        <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
          <SeverityTag severity={t.severity}/>
          <ModeTag mode={t.mode}/>
        </div>
        <span className="mono" style={{fontSize: 10.5, color: "var(--ink-4)"}}>v{t.version}</span>
      </div>

      <div style={{fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35}}>{t.name}</div>
      <p style={{margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55}}>
        {t.plain}
      </p>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6,
                     paddingTop: 12, borderTop: "1px solid var(--line)"}}>
        <div>
          <div className="eyebrow-mono" style={{fontSize: 10}}>Adopted</div>
          <div className="mono tnum" style={{fontSize: 14, color: "var(--ink-1)", marginTop: 2}}>
            {t.adoptedBy} <span style={{fontSize: 10, color: "var(--ink-3)"}}>machines</span>
          </div>
        </div>
        <div>
          <div className="eyebrow-mono" style={{fontSize: 10}}>Caught</div>
          <div className="mono tnum" style={{fontSize: 14, color: "var(--ok)", marginTop: 2}}>
            {t.catches} <span style={{fontSize: 10, color: "var(--ink-3)"}}>issues to date</span>
          </div>
        </div>
      </div>

      <div style={{display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                     paddingTop: 10, borderTop: "1px solid var(--line)"}}>
        {author && <window.TechAvatar tech={author} size="sm"/>}
        <span style={{fontSize: 11, color: "var(--ink-3)"}}>
          {author ? author.name : "System"}
          <span style={{color: "var(--ink-4)"}}> · {t.publishedAt}</span>
        </span>
        <div style={{marginLeft: "auto", display: "flex", gap: 6, alignItems: "center"}} onClick={(e) => e.stopPropagation()}>
          {authorMode && (
            <>
              <button className="btn btn-sm btn-ghost" onClick={onOpen}>Edit</button>
              <button className="btn btn-sm btn-ghost">Publish new version</button>
            </>
          )}
          {consultMode && <button className="btn btn-sm btn-ghost" onClick={onOpen}>View</button>}
          {(adoptMode || (!authorMode && !consultMode)) && (
            adopted
              ? <span className="tag tag-ok"><Ic.check size={11}/> Adopted</span>
              : <span style={{fontSize: 11, color: "var(--olsons)", fontWeight: 500}}>Adopt →</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Rule editor — three modes + backtest hero ────────────────────────────
function RuleEditor({ rule, proposedFromLlm, persona, onBack, go, readOnly, suggestionMode, customerOverride, pressPrefill }) {
  const Ic = window.Icons;
  const kind = persona?.kind || "customer";
  const isTemplate = rule && rule.pressClass;
  const isNew = !rule;
  const initialMode = proposedFromLlm?.mode || rule?.mode || "template";
  const [mode, setMode] = useStateAlarm(initialMode);
  const [severity, setSeverity] = useStateAlarm(proposedFromLlm?.severity || rule?.severity || "warn");
  const [name, setName] = useStateAlarm(
    proposedFromLlm?.name || rule?.name || (isTemplate ? rule.name : "New rule")
  );
  const press = pressPrefill ? window.getPress(pressPrefill) : null;
  const [scope, setScope] = useStateAlarm(
    proposedFromLlm?.scope || rule?.scope || (press ? `${press.name} · ${press.model}` : "All presses")
  );

  const backLabel = kind === "manager" ? "Back to knowledge library"
    : kind === "tech" ? "Back to playbooks"
    : "Back to alarm rules";

  // Backtest selection: rule has its own; for templates and new rules, pick the
  // backtest whose data best matches the template's channels.
  let backtest;
  if (rule && !isTemplate) {
    backtest = window.getBacktest(rule.id);
  } else if (isTemplate) {
    if (rule.id === "TPL-BSTA-GUIDE") backtest = window.getBacktest("RL-001");
    else if (rule.id === "TPL-BSTA-BEARING") backtest = window.getBacktest("RL-001");
    else if (rule.id === "TPL-ISO-10816") backtest = { ...window.getBacktest("RL-001"), wouldFire: 0, firings: [], estimatedFalsePositives: 0, noisePerDay: 0.0, metric: "Velocity RMS · all presses (worst-case)" };
    else backtest = window.getBacktest("RL-005");
  } else {
    backtest = window.getBacktest("RL-005");
  }

  return (
    <div className="page-body fade-in" style={{maxWidth: 1480}}>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="page-h" style={{marginBottom: 18, alignItems: "flex-end"}}>
        <div>
          <button onClick={onBack} className="btn btn-sm btn-ghost" style={{marginBottom: 10}}>
            <Ic.chevL size={13}/> {backLabel}
          </button>
          <h1 className="page-title page-title-lg">
            {suggestionMode ? "Suggest a rule from the field"
              : isNew ? (kind === "manager" ? "New template" : "New rule")
              : isTemplate ? rule.name : name}
          </h1>
          <p className="page-sub" style={{marginTop: 6}}>
            {isTemplate
              ? <>Olsons template · <b>{rule.pressClass}</b> · published {rule.publishedAt} · v{rule.version}</>
              : isNew
                ? proposedFromLlm
                  ? <>Drafted from your description · review and refine before saving.</>
                  : <>A new alarm rule. Start from a template, build it visually, or write the expression directly.</>
                : (() => {
                    const author = lookupAuthor(rule.author);
                    return <>Last triggered {rule.lastTrig} · authored by {author.name}
                      {author.kind === "olsons" && <span className="t-olsons"> · Olsons</span>}
                      {author.kind === "customer" && <span style={{color:"var(--ink-4)"}}> · NordPlåt</span>}</>;
                  })()}
          </p>
        </div>
        <div style={{display: "flex", gap: 8}}>
          {readOnly && isTemplate && (
            <button className="btn btn-sm btn-primary"><Ic.sparkle size={13}/> Suggest a revision</button>
          )}
          {readOnly && !isTemplate && rule && rule.author?.kind === "customer" && (
            <button className="btn btn-sm btn-primary"><Ic.sparkle size={13}/> Promote to template</button>
          )}
          {!readOnly && !suggestionMode && rule && !isTemplate && (
            <button className="btn btn-sm btn-ghost">
              {rule.state === "paused" ? "Resume" : "Pause"}
            </button>
          )}
          {!readOnly && <button className="btn btn-sm btn-ghost"><Ic.x size={13}/> Discard</button>}
          {suggestionMode && (
            <button className="btn btn-sm btn-primary" onClick={onBack}><Ic.check size={13}/> Submit suggestion</button>
          )}
          {!readOnly && !suggestionMode && isTemplate && kind === "customer" && (
            <button className="btn btn-sm btn-primary"><Ic.check size={13}/> Adopt with overrides</button>
          )}
          {!readOnly && !suggestionMode && isTemplate && kind === "manager" && (
            <button className="btn btn-sm btn-primary"><Ic.check size={13}/> Publish template</button>
          )}
          {!readOnly && !suggestionMode && isTemplate && kind === "tech" && (
            <button className="btn btn-sm btn-ghost" onClick={onBack}>Close</button>
          )}
          {!readOnly && !suggestionMode && !isTemplate && (
            <button className="btn btn-sm btn-primary"><Ic.check size={13}/> {customerOverride ? "Save overrides" : kind === "manager" ? "Publish template" : "Save & enable"}</button>
          )}
        </div>
      </div>

      {readOnly && (
        <window.OlsonsStrip>
          <b>Consult mode.</b> You can read this rule but not edit it. Use the buttons above to suggest changes to Mikael.
        </window.OlsonsStrip>
      )}

      {suggestionMode && press && (
        <div className="olsons-strip" style={{marginBottom: 22}}>
          <div className="mark">LB</div>
          <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.5}}>
            Suggesting from <b>{press.name}</b> ({press.model}). Routes to service manager — nothing goes live until published.
          </div>
        </div>
      )}

      {proposedFromLlm && (
        <div className="olsons-strip" style={{marginBottom: 22, background: "rgba(53, 90, 120, 0.06)", borderColor: "rgba(53, 90, 120, 0.18)"}}>
          <div className="mark" style={{background: "var(--forecast)"}}>AI</div>
          <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.5}}>
            <b>Draft proposed from your description.</b> {proposedFromLlm.reasoning} You can refine in any mode below.
          </div>
        </div>
      )}

      {/* ─── Olsons template provenance ───────────────────────── */}
      {isTemplate && <TemplateProvenance t={rule}/>}

      <div style={{display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 24}}>

        {/* ─── Left: editor + backtest ─────────────────────────── */}
        <div style={{display: "flex", flexDirection: "column", gap: 24,
                      opacity: readOnly ? 0.72 : 1,
                      pointerEvents: readOnly ? "none" : "auto"}}>

          {/* Mode selector */}
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            <div style={{padding: "14px 20px", display: "flex", justifyContent: "space-between",
                           alignItems: "center", borderBottom: "1px solid var(--line)"}}>
              <div>
                <div style={{fontSize: 13.5, fontWeight: 600}}>How is this rule defined?</div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 3}}>
                  Match the editor to your comfort level. Switch any time — the rule stays the same.
                </div>
              </div>
              <div className="seg-ctrl">
                {[
                  { v: "template", l: "Template" },
                  { v: "visual",   l: "Visual" },
                  { v: "expression", l: "Expression" },
                ].map((o) => (
                  <button key={o.v} className={mode === o.v ? "active" : ""}
                          onClick={() => setMode(o.v)}>{o.l}</button>
                ))}
              </div>
            </div>

            {mode === "template"   && <TemplateMode rule={rule} proposed={proposedFromLlm}/>}
            {mode === "visual"     && <VisualMode rule={rule} proposed={proposedFromLlm}/>}
            {mode === "expression" && <ExpressionMode rule={rule}/>}
          </div>

          {/* Backtest — the trust feature */}
          {backtest && <BacktestPanel backtest={backtest} rule={rule || { id: "draft", name: name }}/>}

          {/* Routing & suppression */}
          <RoutingCard rule={rule}/>
        </div>

        {/* ─── Right rail — summary ──────────────────────────── */}
        <div style={{display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 24, alignSelf: "flex-start"}}>
          <SummaryCard name={name} setName={setName} scope={scope} setScope={setScope}
                       severity={severity} setSeverity={setSeverity} rule={rule}/>
          {kind === "manager" && isTemplate
            ? <FleetImpactCard template={rule}/>
            : <TrustLadder rule={rule} readOnly={readOnly}/>}
        </div>
      </div>
    </div>
  );
}

// ─── Template provenance ──────────────────────────────────────────────────
function TemplateProvenance({ t }) {
  const author = window.getTech(t.publishedBy);
  return (
    <div className="card" style={{padding: "16px 20px", marginBottom: 22,
                                    background: "var(--olsons-soft)",
                                    border: "1px solid rgba(31, 58, 79, 0.22)"}}>
      <div style={{display: "flex", alignItems: "flex-start", gap: 14}}>
        <div style={{width: 26, height: 26, background: "var(--olsons)", color: "#fff",
                       display: "grid", placeItems: "center", flexShrink: 0,
                       fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 500}}>OL</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="eyebrow" style={{marginBottom: 6, color: "var(--olsons)"}}>Why Olsons recommends this rule</div>
          <p style={{margin: 0, fontSize: 13.5, color: "var(--ink-1)", lineHeight: 1.6}}>
            {t.rationale}
          </p>
          <div style={{marginTop: 12, display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--ink-3)"}}>
            {author && (
              <span style={{display: "flex", alignItems: "center", gap: 8}}>
                <window.TechAvatar tech={author} size="sm"/>
                <span>{author.name}<span style={{color: "var(--ink-4)"}}> · {author.role}</span></span>
              </span>
            )}
            <span className="sep-dot">·</span>
            <span><span className="mono">{t.adoptedBy}</span> machines have adopted this template</span>
            <span className="sep-dot">·</span>
            <span><span className="mono t-ok">{t.catches}</span> issues caught across fleet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template mode — pick from Olsons' shelf ─────────────────────────────
function TemplateMode({ rule, proposed }) {
  const Ic = window.Icons;
  const { ALARM_TEMPLATES } = window.DATA;
  const initialSel = proposed?.template
    || rule?.template
    || (rule && rule.pressClass ? rule.id : null)
    || "TPL-BSTA-GUIDE";
  const [selected, setSelected] = useStateAlarm(initialSel);
  const sel = window.getTemplate(selected);

  return (
    <div style={{padding: 20}}>
      <div className="eyebrow" style={{marginBottom: 12}}>Start from an Olsons template</div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 20}}>
        {ALARM_TEMPLATES.map((t) => {
          const isSel = selected === t.id;
          return (
            <div key={t.id} onClick={() => setSelected(t.id)}
                 style={{padding: 12, border: "1px solid " + (isSel ? "var(--ink)" : "var(--line)"),
                          background: isSel ? "var(--surface-2)" : "var(--surface)",
                          cursor: "pointer",
                          display: "flex", gap: 10, alignItems: "flex-start"}}>
              <window.PressIcon type={t.pressType} size={16}/>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, fontWeight: 500, color: "var(--ink)"}}>{t.name}</div>
                <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{t.pressClass}</div>
              </div>
              <SeverityTag severity={t.severity}/>
            </div>
          );
        })}
      </div>

      {/* Configure selected */}
      {sel && (
        <div style={{padding: 18, background: "var(--surface)", border: "1px solid var(--line)"}}>
          <div className="eyebrow" style={{marginBottom: 12}}>Configure {sel.name}</div>
          <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px 16px",
                          alignItems: "center", fontSize: 13, color: "var(--ink-1)"}}>
            <span className="t-3" style={{fontSize: 11.5}}>Apply to</span>
            <select className="input">
              <option>All {sel.pressClass} presses</option>
              <option>Vingåker only</option>
              <option>Eskilstuna only</option>
              <option>Specific machines…</option>
            </select>

            <span className="t-3" style={{fontSize: 11.5}}>Channels</span>
            <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
              {sel.channels.map((ch) => (
                <span key={ch} className="chip chip-mono" style={{fontSize: 10.5}}>{ch}</span>
              ))}
            </div>

            <span className="t-3" style={{fontSize: 11.5}}>Severity</span>
            <SeverityPicker value={sel.severity}/>

            <span className="t-3" style={{fontSize: 11.5}}>Plain-language read</span>
            <div style={{padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line)",
                            fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.55}}>
              {sel.plain}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visual mode — AND/OR rule builder ─────────────────────────────────
function VisualMode({ rule, proposed }) {
  const Ic = window.Icons;

  // Custom rules drive both AND and OR groups
  let andGroup, orGroup, readsAs;
  if (proposed?.channels && proposed.channels.length) {
    andGroup = proposed.channels;
    orGroup  = [];
    readsAs  = (
      <>{proposed.channels.map((c, i) => (
        <span key={i}>{i > 0 ? " AND " : ""}<b>{c.channel}</b> {c.op.toLowerCase()} <b>{c.value}</b>
          {c.duration && c.duration !== "—" ? <> for <b>{c.duration}</b></> : null}</span>
      ))}.</>
    );
  } else if (rule?.id === "RL-101") {
    andGroup = [
      { channel: "press.spm", op: "Below recipe target by", value: "6 %", duration: "5 min" },
      { channel: "press.active_recipe", op: "Equals", value: "R-114", duration: "—" },
    ];
    orGroup = [];
    readsAs = (<>Cycle rate falls more than <b>6%</b> below recipe target for at least <b>5 minutes</b>, but only while recipe <b>R-114</b> is loaded.</>);
  } else {
    andGroup = [
      { channel: "vibration.de.velocity_rms", op: "Above", value: "3.5 mm/s", duration: "15 min", note: "baseline 2.4 mm/s" },
      { channel: "bearing.de.temperature", op: "Above", value: "70 °C", duration: "any" },
    ];
    orGroup = [
      { channel: "vibration.de.kurtosis", op: "Step change", value: "> +50%", duration: "36 h" },
    ];
    readsAs = (
      <>Vibration above <b>3.5 mm/s</b> AND drive-end bearing temperature above <b>70 °C</b> for <b>15 min</b>,
      OR a kurtosis step change of more than <b>50 %</b> in 36 hours.</>
    );
  }

  return (
    <div style={{padding: 20}}>
      <div className="eyebrow" style={{marginBottom: 12}}>All of these must be true (AND)</div>
      <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 16}}>
        {andGroup.map((c, i) => (
          <ConditionRow key={i} c={c}/>
        ))}
        <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start"}}>
          <Ic.plus size={13}/> Add condition
        </button>
      </div>

      {orGroup.length > 0 && <>
        <div className="eyebrow" style={{margin: "20px 0 12px"}}>Or any of these (OR)</div>
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {orGroup.map((c, i) => <ConditionRow key={i} c={c}/>)}
          <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start"}}>
            <Ic.plus size={13}/> Add condition
          </button>
        </div>
      </>}

      <div style={{marginTop: 18, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--line)",
                     display: "flex", gap: 10, alignItems: "flex-start"}}>
        <Ic.sparkle size={14} style={{color: "var(--forecast)"}}/>
        <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.55}}>
          <span className="eyebrow-mono">reads as</span>
          <div style={{marginTop: 3}}>{readsAs}</div>
        </div>
      </div>
    </div>
  );
}

function ConditionRow({ c }) {
  const Ic = window.Icons;
  return (
    <div style={{display: "grid",
                  gridTemplateColumns: "16px 1.6fr 1.1fr 1fr 1fr 28px",
                  gap: 8, padding: "10px 12px", background: "var(--surface-2)",
                  border: "1px solid var(--line)", alignItems: "center"}}>
      <span style={{color: "var(--ink-4)", display: "grid", placeItems: "center"}}><Ic.more size={14}/></span>
      <select className="input" defaultValue={c.channel}>
        <option>{c.channel}</option>
      </select>
      <select className="input" defaultValue={c.op}>
        <option>{c.op}</option>
      </select>
      <input className="input" defaultValue={c.value}/>
      <select className="input" defaultValue={c.duration}>
        <option>{c.duration}</option>
      </select>
      <button className="btn btn-sm btn-ghost" style={{padding: 4, color: "var(--ink-4)"}}><Ic.x size={11}/></button>
    </div>
  );
}

// ─── Expression mode — for the few experts ─────────────────────────────
function ExpressionMode({ rule }) {
  const Ic = window.Icons;
  // Source: template's own expression if present; otherwise contextual fallback
  const tpl = rule?.template ? window.getTemplate(rule.template) : (rule?.pressClass ? rule : null);
  const sample = tpl?.expression || expressionFor(rule);

  return (
    <div>
      <div style={{padding: "12px 20px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--surface)"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "var(--ink-3)"}}>
          <span className="mono">olsons-ql</span>
          <span className="sep-dot">·</span>
          <a style={{color: "var(--ink-2)", cursor: "pointer", borderBottom: "1px dashed var(--line-2)"}}>Language reference</a>
        </div>
        <div style={{display: "flex", gap: 6}}>
          <button className="btn btn-sm btn-ghost">Validate</button>
          <button className="btn btn-sm btn-ghost">Format</button>
          <button className="btn btn-sm btn-ghost"><Ic.sparkle size={11}/> Explain</button>
        </div>
      </div>
      <pre style={{margin: 0, padding: 20, fontFamily: "var(--font-mono)", fontSize: 12.5,
                    lineHeight: 1.65, color: "var(--ink-1)",
                    background: "var(--surface-2)", overflow: "auto"}}>
{sample.split("\n").map((line, i) => (
  <div key={i} style={{display: "flex"}}>
    <span style={{color: "var(--ink-5)", width: 28, textAlign: "right",
                    userSelect: "none", paddingRight: 12, fontVariantNumeric: "tabular-nums"}}>{i + 1}</span>
    <span style={{flex: 1}}>{syntaxHL(line)}</span>
  </div>
))}
      </pre>
    </div>
  );
}

function expressionFor(rule) {
  const id = rule?.id || "";
  if (id === "RL-003") return (
`# MSP-630 drive bearing wear
# Sustained vibration above MSP-frame threshold

let de_v = ewma(channel("vibration.de.velocity_rms"), span="30m")

fire severity="warning"
  when de_v > 3.5
   for at_least "15m"`);
  if (id === "RL-004" || rule?.template === "TPL-AIDA-TONNAGE") return (
`# Aida NC1 · peak tonnage drift, per-recipe baseline
# Each recipe carries its own peak signature

let recipe   = channel("press.active_recipe")
let baseline = ewma(channel("press.peak_tonnage"), span="5000c", group_by=recipe)
let drift    = (channel("press.peak_tonnage") - baseline) / baseline

fire severity="warning"
  when drift > 0.05
   for at_least "200c"`);
  if (id === "RL-005" || rule?.template === "TPL-MSP-SLOWCYCLE") return (
`# MSP-630 · slow cycle anomaly (per recipe target)
# Catches die-lubrication and feed issues, not press problems

let actual = ewma(channel("press.spm"), span="30s")
let target = channel("press.recipe.target_spm")
let drag   = (target - actual) / target

fire severity="info"
  when drag > 0.08
   for at_least "5m"
   suppress_during "olsons.visit"`);
  if (id === "RL-006" || rule?.template === "TPL-FEEDER-SLIP") return (
`# Coil feeder · feed-length slip
# Catches roller slip and pinch-roller wear before scrap rate climbs

let err = abs(channel("feeder.feed_length_error"))

fire severity="warning"
  when err > 0.05
   for at_least "50c"`);
  if (id === "RL-101") return (
`# Hall A · custom slow-cycle on R-114 only
# Authored by Erik Persson · NordPlåt
# Tracks a known quirk on R-114 — not a press problem

let on_r114 = channel("press.active_recipe") == "R-114"
let actual  = ewma(channel("press.spm"), span="30s")
let target  = channel("press.recipe.target_spm")
let drag    = (target - actual) / target

fire severity="info"
  when on_r114 and drag > 0.06
   for at_least "5m"`);
  // Default
  return (
`# New rule
# Start writing your alarm logic here.

fire severity="warning"
  when channel("vibration.de.velocity_rms") > 3.5
   for at_least "15m"`);
}

function syntaxHL(line) {
  if (line.startsWith("#")) return <span style={{color: "var(--ink-4)"}}>{line}</span>;
  const keywords = ["let", "fire", "when", "and", "or", "for", "at_least"];
  const fns = ["ewma", "channel"];
  return (
    <>
      {line.split(/(\s+|".*?"|\d+\.?\d*|[(){}=<>!*\/+])/).filter(Boolean).map((part, i) => {
        if (/^\s+$/.test(part)) return part;
        if (keywords.includes(part))  return <span key={i} style={{color: "var(--ink)", fontWeight: 500}}>{part}</span>;
        if (fns.includes(part))       return <span key={i} style={{color: "var(--forecast)"}}>{part}</span>;
        if (part.startsWith('"'))     return <span key={i} style={{color: "var(--ok)"}}>{part}</span>;
        if (!isNaN(parseFloat(part))) return <span key={i} style={{color: "var(--warn)"}}>{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Backtest panel — the trust feature ──────────────────────────────────
function BacktestPanel({ backtest, rule }) {
  const Ic = window.Icons;
  const [range, setRange] = useStateAlarm(backtest.range);
  const totalDays = parseInt(backtest.range, 10) || 90;

  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{padding: "14px 20px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <div style={{fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 10}}>
            Backtest <span className="ai-badge">Trust check</span>
          </div>
          <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.45, maxWidth: 700}}>
            How often would this rule have fired on the last {range} of real signal data?
            Each mark on the timeline is a moment in history when this rule would have raised an alarm.
            Catch a noisy rule before it fires on you.
          </div>
        </div>
        <div className="seg-ctrl">
          {["30 days", "90 days", "1 year"].map((r) => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{padding: 22}}>
        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 20}}>
          <BTStat label="Would have fired" value={backtest.wouldFire} sub={`Across ${new Set(backtest.firings.map(f => f.machine)).size} machines`}/>
          <BTStat label="Suppressed" value={backtest.suppressed} sub="by your suppression rules"/>
          <BTStat label="Likely false-positive" value={backtest.estimatedFalsePositives} sub="based on outcome heuristics" tone={backtest.estimatedFalsePositives > 3 ? "warn" : ""}/>
          <BTStat label="Noise" value={(backtest.noisePerDay).toFixed(2)} unit="/day" sub={backtest.noisePerDay > 0.3 ? "Higher than typical" : "Low — calm rule"} tone={backtest.noisePerDay > 0.3 ? "warn" : "ok"}/>
        </div>

        {/* Timeline overlay on signal trace */}
        <BacktestTimeline backtest={backtest}/>

        {/* Firing list */}
        <div style={{marginTop: 22}}>
          <div className="eyebrow" style={{marginBottom: 10}}>Each firing · in order</div>
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            <div style={{display: "grid",
                          gridTemplateColumns: "60px 140px 70px 1fr 80px",
                          gap: 14, padding: "9px 20px",
                          background: "var(--surface)", borderBottom: "1px solid var(--line)",
                          fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                          color: "var(--ink-3)"}}>
              <div>Day</div>
              <div>Machine</div>
              <div>Value</div>
              <div>Outcome</div>
              <div>State</div>
            </div>
            {backtest.firings.map((f, i) => (
              <div key={i} style={{display: "grid",
                                      gridTemplateColumns: "60px 140px 70px 1fr 80px",
                                      gap: 14, padding: "12px 20px",
                                      borderBottom: i < backtest.firings.length - 1 ? "1px solid var(--line)" : "none",
                                      alignItems: "center", fontSize: 12.5}}>
                <span className="mono t-3">{f.day === totalDays ? "today" : `−${totalDays - f.day}d`}</span>
                <span className="mono" style={{fontSize: 12}}>{f.machine}</span>
                <span className="mono tnum">{f.value}</span>
                <span style={{color: "var(--ink-1)"}}>{f.outcome}</span>
                <span>
                  {f.suppressed
                    ? <span className="tag tag-outline">Suppressed</span>
                    : <span className="tag tag-warn">Would fire</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop: 16, padding: "12px 14px", background: "var(--olsons-soft)",
                       border: "1px solid rgba(31,58,79,0.18)",
                       display: "flex", gap: 10, alignItems: "flex-start"}}>
          <Ic.workshop size={14} style={{color: "var(--olsons)", flexShrink: 0, marginTop: 1}}/>
          <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.55}}>
            <b>What Olsons would say.</b>{" "}
            {backtest.estimatedFalsePositives > 3
              ? "This rule looks noisy. Try tightening the duration or adding a recipe-aware suppression — feel free to schedule a call."
              : backtest.wouldFire === 0
              ? "Quiet on history. Either the rule is perfectly tuned, or the threshold is too tight — keep an eye on it for a few weeks."
              : "Looks well-tuned. The firings line up with actual events that needed attention."}
          </div>
        </div>
      </div>
    </div>
  );
}

function BacktestTimeline({ backtest }) {
  const w = 880, h = 200;
  const pad = { l: 40, r: 24, t: 18, b: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  // Total days for axis comes from backtest.range
  const totalDays = parseInt(backtest.range, 10) || 90;

  // If we have a paired sensor trace, plot it; otherwise stripchart only.
  const ts = backtest.seriesKey ? window.getTimeSeries(backtest.seriesKey) : null;

  // Build the trace path (if any)
  let path = null;
  if (ts) {
    const xAt = (i) => pad.l + (i / (ts.data.length - 1)) * innerW;
    const minV = Math.min(...ts.data);
    const maxV = Math.max(...ts.data, ts.threshold ?? -Infinity);
    const yAt = (v) => pad.t + (1 - (v - minV * 0.95) / (maxV * 1.05 - minV * 0.95)) * innerH;
    path = ts.data.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  }

  return (
    <div style={{background: "var(--surface-2)", border: "1px solid var(--line)", padding: "10px 16px"}}>
      <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8}}>
        <span className="eyebrow">{backtest.metric}</span>
        <span style={{fontSize: 11, color: "var(--ink-3)"}}>
          <span style={{display: "inline-block", width: 10, height: 1, background: "var(--warn)", marginRight: 4, verticalAlign: "middle"}}/>
          would fire
          <span style={{marginLeft: 14, display: "inline-block", width: 10, height: 1, background: "var(--unknown)", marginRight: 4, verticalAlign: "middle"}}/>
          suppressed
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg" preserveAspectRatio="none" style={{width: "100%"}}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} className={p === 0 ? "axis" : "grid"}
                x1={pad.l} x2={pad.l + innerW}
                y1={pad.t + (1 - p) * innerH} y2={pad.t + (1 - p) * innerH}/>
        ))}

        {/* Sensor trace background */}
        {path && <path d={path} className="trace muted"/>}

        {/* Firings as vertical marks */}
        {backtest.firings.map((f, i) => {
          const x = pad.l + (f.day / totalDays) * innerW;
          const color = f.suppressed ? "var(--unknown)" : "var(--warn)";
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={pad.t} y2={pad.t + innerH}
                    stroke={color} strokeWidth={f.suppressed ? "1" : "1.4"}
                    strokeDasharray={f.suppressed ? "2 3" : null}/>
              <circle cx={x} cy={pad.t} r="3" fill={color}/>
            </g>
          );
        })}

        {/* X axis */}
        <line x1={pad.l} x2={pad.l + innerW} y1={pad.t + innerH} y2={pad.t + innerH} className="axis"/>
        {[0, 0.33, 0.66, 1].map((p) => {
          const d = Math.round(p * totalDays);
          return (
            <text key={p} x={pad.l + p * innerW} y={pad.t + innerH + 14}
                  className="axis-text" textAnchor="middle">
              {d === 0 ? `${totalDays} days ago` : d === totalDays ? "today" : `−${totalDays - d}d`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BTStat({ label, value, unit, sub, tone }) {
  const colorClass = tone === "warn" ? "t-warn" : tone === "crit" ? "t-crit" : tone === "ok" ? "t-ok" : "";
  return (
    <div>
      <div className="eyebrow" style={{marginBottom: 4}}>{label}</div>
      <div className={"data-hero " + colorClass} style={{fontSize: 24}}>
        {value}{unit && <span style={{fontSize: 12, color: "var(--ink-3)", fontWeight: 400, marginLeft: 4}}>{unit}</span>}
      </div>
      <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 4}}>{sub}</div>
    </div>
  );
}

// ─── Routing card — severity tier + channels + suppression ──────────────
function RoutingCard({ rule }) {
  const Ic = window.Icons;
  const suppression = rule?.suppression || ["Maintenance mode aware", "Quiet hours 22:00–06:00"];
  return (
    <div className="card" style={{padding: 20}}>
      <div className="eyebrow" style={{marginBottom: 16}}>When this fires</div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24}}>
        <div>
          <div className="field-label">Notify</div>
          <div style={{display: "flex", flexDirection: "column", gap: 6}}>
            <RouteRow label="Maintenance channel" sub="Erik Persson · NordPlåt" channel="Slack"/>
            <RouteRow label="Olsons service desk" sub="Mikael Krey · for safety + critical" channel="API"/>
            <RouteRow label="Anna Lundgren" sub="Production planner · only when scope warrants" channel="Email" optional/>
            <RouteRow label="Floor SMS" sub="For safety severity only" channel="SMS" optional/>
            <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start", marginTop: 4}}>
              <Ic.plus size={12}/> Add channel
            </button>
          </div>
        </div>

        <div>
          <div className="field-label">Suppress when</div>
          <div style={{display: "flex", flexDirection: "column", gap: 6}}>
            <SuppressRow label="Maintenance mode" on={true} note="Don't fire while Olsons is actively servicing"/>
            <SuppressRow label="Quiet hours 22:00–06:00" on={suppression.some(s => s.includes("Quiet"))} note="Info-level only · Critical still rings"/>
            <SuppressRow label="During planned Olsons visits" on={false} note="Pre-empt expected anomalies"/>
            <SuppressRow label="Recipe-aware" on={false} note="Ignore on selected recipes (e.g. development runs)"/>
            <button className="btn btn-sm btn-ghost" style={{alignSelf: "flex-start", marginTop: 4}}>
              <Ic.plus size={12}/> Add suppression
            </button>
          </div>
        </div>
      </div>

      <div style={{marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
                     fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5}}>
        Alarm fatigue is the most common reason monitoring systems get abandoned. Suppression rules
        protect serious alarms by silencing the ones that aren't.
      </div>
    </div>
  );
}

function RouteRow({ label, sub, channel, optional }) {
  return (
    <div style={{display: "grid", gridTemplateColumns: "16px 1fr auto",
                  gap: 10, padding: "8px 10px", background: "var(--surface)",
                  border: "1px solid var(--line)", alignItems: "center"}}>
      <div style={{width: 14, height: 14, border: "1.5px solid " + (optional ? "var(--line-strong)" : "var(--ok)"),
                     background: optional ? "transparent" : "var(--ok)",
                     display: "grid", placeItems: "center", color: "white"}}>
        {!optional && <window.Icons.check size={9}/>}
      </div>
      <div style={{minWidth: 0}}>
        <div style={{fontSize: 12.5, color: "var(--ink-1)", fontWeight: 500}}>{label}</div>
        <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{sub}</div>
      </div>
      <span className="chip chip-mono" style={{fontSize: 10}}>{channel}</span>
    </div>
  );
}

function SuppressRow({ label, on, note }) {
  return (
    <div style={{display: "grid", gridTemplateColumns: "auto 1fr auto",
                  gap: 10, padding: "8px 10px", background: "var(--surface)",
                  border: "1px solid var(--line)", alignItems: "center"}}>
      <div style={{width: 26, height: 14, background: on ? "var(--ink)" : "var(--surface-3)",
                     position: "relative", border: "1px solid " + (on ? "var(--ink)" : "var(--line-2)")}}>
        <div style={{position: "absolute", top: 0, left: on ? 12 : 0,
                       width: 12, height: 12, background: "var(--surface-2)",
                       border: "1px solid " + (on ? "var(--ink)" : "var(--line-2)")}}/>
      </div>
      <div style={{minWidth: 0}}>
        <div style={{fontSize: 12.5, color: "var(--ink-1)", fontWeight: 500}}>{label}</div>
        <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{note}</div>
      </div>
      <span style={{fontSize: 10.5, color: "var(--ink-4)", letterSpacing: "0.04em", textTransform: "uppercase"}}>
        {on ? "on" : "off"}
      </span>
    </div>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────
function SummaryCard({ name, setName, scope, setScope, severity, setSeverity, rule }) {
  return (
    <div className="card" style={{padding: 18}}>
      <div className="eyebrow" style={{marginBottom: 12}}>Summary</div>
      <div style={{display: "flex", flexDirection: "column", gap: 14}}>
        <div>
          <div className="field-label">Name</div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)}/>
        </div>
        <div>
          <div className="field-label">Scope</div>
          <select className="input" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option>All presses</option>
            <option>All BSTA-50 presses (Hall A)</option>
            <option>All MSP-630 presses (Hall B)</option>
            <option>All Aida NC1-300 (both sites)</option>
            <option>Specific machine · BSTA-50 #3</option>
            <option>Site · Vingåker</option>
            <option>Site · Eskilstuna</option>
          </select>
        </div>
        <div>
          <div className="field-label">Severity</div>
          <SeverityPicker value={severity} onChange={setSeverity}/>
        </div>
        <div>
          <div className="field-label">Plain-language summary</div>
          <div style={{padding: 12, background: "var(--surface)", border: "1px solid var(--line)",
                          fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.55}}>
            {plainLanguageFor(rule, severity)}
          </div>
        </div>
      </div>
    </div>
  );
}

function plainLanguageFor(rule, severity) {
  const sev = window.severityLabel(severity).toLowerCase();
  const prefix = <>Alert as <b>{sev}</b> when </>;
  // Templates and template-derived rules already write the whole sentence
  if (rule?.template) {
    const tpl = window.getTemplate(rule.template);
    if (tpl?.plain) return <span>{tpl.plain}</span>;
  }
  if (rule?.plain) return <span>{rule.plain}</span>;
  if (rule?.id === "RL-101") return <>{prefix}cycle rate falls more than <b>6%</b> below recipe target on <b>BSTA-50 #3 · R-114</b> for over 5 minutes.</>;
  if (rule?.id === "RL-102") return <span>Suppression policy. Silences info-level alarms 22:00–06:00 site-wide. Critical and safety still ring.</span>;
  if (rule?.id === "RL-103") return <><b>(Draft)</b> {prefix}die-lubrication temperature climbs more than <b>6°C</b> over baseline on Aida NC1-300 #2.</>;
  return <>{prefix}drive-end bearing velocity RMS sits above <b>3.5 mm/s</b> for 15 minutes.</>;
}

function SeverityPicker({ value, onChange }) {
  const sevs = [
    { v: "info",   l: "Info",     c: "var(--forecast)" },
    { v: "warn",   l: "Warning",  c: "var(--warn)" },
    { v: "crit",   l: "Critical", c: "var(--crit)" },
    { v: "safety", l: "Safety",   c: "var(--crit)" },
  ];
  return (
    <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6}}>
      {sevs.map((s) => {
        const active = value === s.v;
        return (
          <button key={s.v} onClick={() => onChange && onChange(s.v)}
                  style={{padding: "8px 6px", border: "1px solid " + (active ? s.c : "var(--line)"),
                            background: active ? `color-mix(in srgb, ${s.c} 10%, var(--surface-2))` : "var(--surface)",
                            color: active ? s.c : "var(--ink-2)",
                            fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6}}>
            <span className="dot" style={{background: s.c}}/> {s.l}
          </button>
        );
      })}
    </div>
  );
}

// ─── Fleet impact (service manager · template authoring) ─────────────────
function FleetImpactCard({ template }) {
  const t = template;
  const author = window.getTech(t?.publishedBy);
  return (
    <div className="card" style={{padding: 18}}>
      <div className="eyebrow" style={{marginBottom: 12, color: "var(--olsons)"}}>Fleet impact</div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14}}>
        <div>
          <div className="eyebrow-mono" style={{fontSize: 10}}>Adopted</div>
          <div className="mono tnum" style={{fontSize: 20, color: "var(--ink)"}}>{t?.adoptedBy}</div>
        </div>
        <div>
          <div className="eyebrow-mono" style={{fontSize: 10}}>Issues caught</div>
          <div className="mono tnum" style={{fontSize: 20, color: "var(--ok)"}}>{t?.catches}</div>
        </div>
      </div>
      {author && (
        <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--ink-3)"}}>
          <window.TechAvatar tech={author} size="sm"/>
          <span>Published by {author.name}</span>
        </div>
      )}
      <div style={{marginTop: 12, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55}}>
        Every template you publish compounds across the Nordic fleet. This is Olsons&apos; institutional moat.
      </div>
    </div>
  );
}

// ─── Trust ladder ────────────────────────────────────────────────────────
function TrustLadder({ rule, readOnly }) {
  const Ic = window.Icons;
  return (
    <div className="card" style={{padding: 18}}>
      <div className="eyebrow" style={{marginBottom: 12}}>{readOnly ? "Expertise source" : "Trust ladder"}</div>
      <div style={{fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.6}}>
        {readOnly
          ? <>This is <b>Olsons-published expertise</b>. Suggest a revision if field experience differs.</>
          : <>This rule is <b>yours</b>. The predictive model can <em>suggest</em> related rules,
            but never enables them without your approval. Nothing fires automatically.</>}
      </div>

      <div style={{marginTop: 14, padding: "12px 12px", background: "var(--surface)",
                     border: "1px dashed var(--line-strong)",
                     display: "flex", alignItems: "flex-start", gap: 10}}>
        <Ic.sparkle size={13} style={{color: "var(--forecast)", flexShrink: 0, marginTop: 2}}/>
        <div style={{fontSize: 12, color: "var(--ink-1)", lineHeight: 1.5}}>
          <b>Companion suggestion:</b> add a Critical rule at 5.5 mm/s with no suppression — would have caught the 2023 Köpings event 4 days earlier.
          <div style={{marginTop: 8}}>
            <button className="btn btn-sm">Review →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.AlarmsScreen = AlarmsScreen;
