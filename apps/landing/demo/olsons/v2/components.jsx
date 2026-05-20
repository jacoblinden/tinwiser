// components.jsx — shared chrome and primitives.

const { useState, useEffect, useMemo, useRef } = React;

// ─── Status helpers ─────────────────────────────────────────────────────────
const statusToClass = (s) => ({ ok: "ok", warn: "warn", crit: "crit", unknown: "unknown" }[s] || "ok");
const statusLabel   = (s) => ({ ok: "Healthy", warn: "Watch", crit: "Critical", unknown: "Offline" }[s] || s);
const severityLabel = (s) => ({ crit: "Critical", warn: "Warning", info: "Info", unknown: "Unknown", safety: "Safety" }[s] || s);
const statusForHealth = (h) => h == null ? "unknown" : h < 50 ? "crit" : h < 80 ? "warn" : "ok";

function StatusDot({ status }) { return <span className={"dot " + statusToClass(status)} />; }

function StatusTag({ status, children }) {
  const cls = "tag-" + statusToClass(status);
  return <span className={"tag " + cls}>{children || statusLabel(status)}</span>;
}

// ─── Sparkline ─────────────────────────────────────────────────────────────
const SPARK_DATA = {
  flat:    [50,52,49,51,50,51,53,50,49,51,52,50,51,49,50],
  wobble:  [50,55,46,52,57,48,53,55,50,56,49,54,52,50,53],
  rising:  [38,38,40,41,42,44,45,47,49,52,55,58,62,66,70],
  drift:   [44,45,45,47,48,49,50,52,53,53,55,56,57,58,59],
  stepped: [40,40,40,40,42,42,55,56,55,57,56,57,58,58,57],
  spike:   [40,42,41,43,44,45,46,47,50,55,68,78,82,86,90],
  offline: null,
};
function Sparkline({ shape = "flat", color = "currentColor", w = 88, h = 22, fill = false }) {
  if (shape === "offline" || !SPARK_DATA[shape]) {
    return (
      <svg width={w} height={h} className="spark" aria-hidden="true">
        <line x1="0" y1={h/2} x2={w} y2={h/2}
          stroke="currentColor" strokeWidth="1" strokeDasharray="1 2" opacity="0.45" />
      </svg>
    );
  }
  const d = SPARK_DATA[shape];
  const max = Math.max(...d), min = Math.min(...d);
  const pad = 1;
  const pts = d.map((v, i) => {
    const x = pad + (i / (d.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1)).join(" ");
  const area = path + ` L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;
  return (
    <svg width={w} height={h} className="spark" aria-hidden="true" style={{color}}>
      {fill && <path d={area} fill="currentColor" opacity="0.08" />}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

// ─── HealthBar ─────────────────────────────────────────────────────────────
function HealthBar({ value, status, width = "100%" }) {
  if (value == null) {
    return (
      <div className="healthbar unknown" style={{width}}>
        <i style={{width: "100%", opacity: 0.4}} />
      </div>
    );
  }
  const cls = status || statusForHealth(value);
  return (
    <div className={"healthbar " + cls} style={{width}}>
      <i style={{width: Math.max(2, value) + "%"}} />
    </div>
  );
}

// ─── Machine fingerprint ───────────────────────────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "x");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function MachineFingerprint({ seed, bars = 16, status = "ok" }) {
  const heights = useMemo(() => {
    let h = hashSeed(seed);
    return Array.from({ length: bars }, () => {
      h = Math.imul(h ^ (h >>> 13), 2654435761);
      return 15 + (h % 85);
    });
  }, [seed, bars]);
  return (
    <div className={"fingerprint " + statusToClass(status)} aria-hidden="true">
      {heights.map((pct, i) => <i key={i} style={{ height: pct + "%" }} />)}
    </div>
  );
}

// ─── Press type pictogram ──────────────────────────────────────────────────
function PressIcon({ type, size = 16 }) {
  const Ic = window.Icons;
  switch (type) {
    case "mechanical": return <Ic.mech size={size}/>;
    case "servo":      return <Ic.servo size={size}/>;
    case "hydraulic":  return <Ic.hydraulic size={size}/>;
    case "fineblank":  return <Ic.fineblank size={size}/>;
    case "feeder":     return <Ic.feeder size={size}/>;
    default:           return <Ic.press size={size}/>;
  }
}

// ─── Sidebar (Olsons-branded) ──────────────────────────────────────────────
function Sidebar({ route, setRoute, persona, setPersona }) {
  const Ic = window.Icons;
  const { ALERTS, SITES, CUSTOMER, OLSONS } = window.DATA;
  const counts = {
    alerts: ALERTS.filter(a => a.status === "open").length,
    crit:   ALERTS.filter(a => a.severity === "crit" && a.status === "open").length,
  };
  const isOlsons = persona.kind === "tech" || persona.kind === "manager";
  const suggestionCount = (window.DATA.TECH_SUGGESTIONS || []).filter(s => s.status === "pending").length;

  const customerNav = [
    { id: "fleet", label: "Fleet",         icon: Ic.fleet,     route: "fleet",       match: ["fleet"] },
    { id: "alerts",label: "Recommendations",icon: Ic.alert,    route: "fleet",       match: ["alert"],  badge: counts.alerts, badgeKind: counts.crit ? "crit" : null },
    { id: "plan",  label: "Service plan",  icon: Ic.calendar,  route: "plan",        match: ["plan"] },
    { id: "alarms",label: "Alarm rules",   icon: Ic.bell,      route: "alarms",      match: ["alarms"] },
  ];
  const techNav = [
    { id: "tech",  label: "My visits today", icon: Ic.technician, route: "tech",     match: ["tech"] },
    { id: "plan",  label: "Service plan",    icon: Ic.calendar,   route: "plan",     match: ["plan"] },
    { id: "fleet", label: "Customer fleet",  icon: Ic.fleet,      route: "fleet",    match: ["fleet", "press"] },
    { id: "alarms",label: "Playbooks & rules", icon: Ic.bell,    route: "alarms",   match: ["alarms"] },
  ];
  const managerNav = [
    { id: "plan",  label: "Service plan",    icon: Ic.calendar,   route: "plan",     match: ["plan"] },
    { id: "alarms",label: "Knowledge library", icon: Ic.bell,     route: "alarms",   match: ["alarms"],
      badge: suggestionCount > 0 ? suggestionCount : null, badgeKind: suggestionCount > 0 ? "warn" : null },
    { id: "fleet", label: "Customer fleet",  icon: Ic.fleet,      route: "fleet",    match: ["fleet", "press"] },
    { id: "tech",  label: "Field visits",    icon: Ic.technician, route: "tech",     match: ["tech"] },
  ];

  const items = persona.kind === "manager" ? managerNav
    : persona.kind === "tech" ? techNav
    : customerNav;
  const currentTop = (route || "").split(":")[0];

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="brand-mark">OL</div>
        <div className="brand-text">
          <div className="brand-name">Olsons</div>
          <div className="brand-sub">Predictive · pilot</div>
        </div>
      </div>

      <div className="side-search">
        <span className="ic"><Ic.search size={13} /></span>
        <input className="input" placeholder="Search presses, alerts…" />
        <span className="kbd">⌘K</span>
      </div>

      {/* Persona switch — small, calm */}
      <div style={{padding: "6px 12px 8px"}}>
        <div className="seg-ctrl" style={{width: "100%", display: "flex"}}>
          {[
            { v: "manager-cust", l: "Customer" },
            { v: "tech",         l: "Tech" },
            { v: "manager",      l: "Service mgr" },
          ].map((o) => (
            <button key={o.v}
              className={persona.id === o.v ? "active" : ""}
              onClick={() => setPersona(o.v)}
              style={{flex: 1, justifyContent: "center"}}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <nav className="nav">
        {items.map((it) => {
          const isActive = it.match && it.match.includes(currentTop);
          return (
            <div key={it.id}
                 className={"nav-item " + (isActive ? "active" : "")}
                 onClick={() => setRoute(it.route)}>
              <span className="ic"><it.icon size={15} /></span>
              <span>{it.label}</span>
              {it.badge != null && it.badge > 0 && (
                <span className={"nav-badge " + (it.badgeKind || "")}>{it.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {!isOlsons && (
        <div className="side-section">
          <div className="side-section-label">Sites</div>
          <div className="nav">
            {SITES.map((s) => {
              const statusCls = s.attention >= 2 || s.health < 80 ? "site-warn" : "";
              const badgeCls = s.attention > 0 ? "warn" : "";
              return (
                <div key={s.id}
                     className={"nav-item " + statusCls}
                     onClick={() => setRoute("fleet:" + s.id)}>
                  <span style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flex:1, minWidth: 0}}>{s.name}</span>
                  <span className={"nav-badge " + badgeCls}>{s.attention > 0 ? s.attention : s.pressCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="side-spacer" />

      <div className="side-foot">
        <div className={"avatar " + (isOlsons ? "olsons" : "")}>{persona.initials}</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 12.5, fontWeight: 500, color: "var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{persona.name}</div>
          <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{persona.role}</div>
        </div>
        {isOlsons && <span className="persona-pill olsons">Olsons</span>}
      </div>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────
function Topbar({ crumbs = [], right }) {
  const Ic = window.Icons;
  return (
    <header className="topbar">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep"><Ic.chevR size={11}/></span>}
            {c.onClick
              ? <a onClick={c.onClick}>{c.label}</a>
              : (i === crumbs.length - 1 ? <b>{c.label}</b> : <span>{c.label}</span>)
            }
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-actions">
        {right || (
          <>
            <button className="btn btn-sm btn-ghost" title="Notifications"><Ic.bell size={13}/></button>
            <button className="btn btn-sm">Today · Mon 18 May</button>
          </>
        )}
      </div>
    </header>
  );
}

// ─── Section header ────────────────────────────────────────────────────────
function SectionH({ title, sub, right }) {
  return (
    <div className="section-h">
      <div>
        <h3 className="section-title">{title}</h3>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Instrument cluster ────────────────────────────────────────────────────
function InstrumentCluster({ items, cols }) {
  return (
    <div className="cluster-strip" style={{"--cols": cols || items.length}}>
      {items.map((item, i) => (
        <div key={i} className="cluster-cell">
          <div className="cluster-label">{item.label}</div>
          <div className={"cluster-value " + (item.tone || "")}>
            {item.value}
            {item.unit && <span className="unit">{" " + item.unit}</span>}
          </div>
          {item.sub && <div className="cluster-sub">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Plain-language explainer block ────────────────────────────────────────
function PLBlock({ children, tone, confidence }) {
  const borderColor = tone === "warn" ? "var(--warn)" : tone === "crit" ? "var(--crit)" : "var(--ink)";
  return (
    <div className="card" style={{
      padding: "16px 18px",
      borderLeft: `3px solid ${borderColor}`,
      background: "var(--surface)",
    }}>
      <div className="pl pl-lg">{children}</div>
      {confidence != null && (
        <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)",
                     display: "flex", alignItems: "center", gap: 10}}>
          <span className="ai-badge">Predicted by model</span>
          <span style={{fontSize: 11.5, color: "var(--ink-3)"}}>
            <span className="mono">{confidence}%</span> confidence
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Olsons strip — used to surface the Olsons relationship in context ────
function OlsonsStrip({ children, mark = "OL" }) {
  return (
    <div className="olsons-strip">
      <div className="mark">{mark}</div>
      <div style={{fontSize: 13, color: "var(--ink-1)", lineHeight: 1.5}}>{children}</div>
    </div>
  );
}

// ─── Avatar (with role) ────────────────────────────────────────────────────
function TechAvatar({ tech, size = "md" }) {
  if (!tech) return null;
  const dim = size === "sm" ? 22 : size === "lg" ? 38 : 28;
  return (
    <div className="avatar olsons" style={{width: dim, height: dim, fontSize: dim < 28 ? 10 : dim > 30 ? 13 : 11}}>
      {tech.initials}
    </div>
  );
}

// ─── Spark mini for press rows ────────────────────────────────────────────
function MiniSpark({ shape, status, w = 64, h = 18 }) {
  return (
    <div className={"t-" + statusToClass(status)}>
      <Sparkline shape={shape} w={w} h={h}/>
    </div>
  );
}

// ─── Alert / rule provenance ("Caught by") ───────────────────────────────
function CaughtByProvenance({ provenance, go, persona }) {
  if (!provenance) return null;
  const prov = window.provenanceLabel(provenance);
  const kind = persona?.kind || "customer";
  const makeRule = () => {
    if (kind === "tech") go("alarms:new");
    else if (kind === "manager") go("alarms:new");
    else go("alarms:new");
  };

  return (
    <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
                  fontSize: 12.5, color: "var(--ink-2)", marginTop: 10}}>
      <span className="eyebrow-mono" style={{fontSize: 10, color: "var(--ink-4)"}}>Caught by</span>
      {prov.tier === "anomaly" ? (
        <>
          <span>{prov.long}</span>
          <button type="button" className="btn btn-sm" onClick={makeRule}>Make this a rule</button>
        </>
      ) : prov.tier === "customer-rule" ? (
        <a className="link" onClick={() => go("alarms:rule:" + provenance.ruleId)}>
          {prov.long}
        </a>
      ) : (
        <>
          <a className="link" onClick={() => go("alarms:template:" + provenance.templateId)}>
            Olsons template {prov.short}
          </a>
          {prov.authorName && (
            <span style={{color: "var(--ink-3)"}}>· authored by {prov.authorName}</span>
          )}
        </>
      )}
    </div>
  );
}

// ─── Global re-exports ────────────────────────────────────────────────────
Object.assign(window, {
  Sparkline, HealthBar, MachineFingerprint, StatusDot, StatusTag, PressIcon,
  Sidebar, Topbar, SectionH, InstrumentCluster, PLBlock, OlsonsStrip, TechAvatar, MiniSpark,
  CaughtByProvenance,
  statusToClass, statusLabel, severityLabel, statusForHealth, hashSeed,
});
