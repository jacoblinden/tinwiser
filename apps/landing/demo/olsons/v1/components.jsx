// components.jsx — Shared chrome and primitives used across all screens.

const { useState, useEffect, useMemo, useRef } = React;

// ─── Deterministic hash for visual seeds ───────────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "x");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ─── Machine fingerprint — signature bar spectrum per asset ────────────────
function MachineFingerprint({ seed, bars = 14, status = "ok", className = "" }) {
  const heights = useMemo(() => {
    let h = hashSeed(seed);
    return Array.from({ length: bars }, () => {
      h = Math.imul(h ^ (h >>> 13), 2654435761);
      return 15 + (h % 85);
    });
  }, [seed, bars]);
  const cls = statusToClass(status);
  return (
    <div className={"fingerprint " + cls + (className ? " " + className : "")} aria-hidden="true" title="Signal fingerprint">
      {heights.map((pct, i) => (
        <i key={i} style={{ height: pct + "%" }} />
      ))}
    </div>
  );
}

// ─── Sparkline ──────────────────────────────────────────────────────────────
// Sharp-stroke technical traces — no round caps, instrument style.
const SPARK_DATA = {
  flat:    [50,52,49,51,50,51,53,50,49,51,52,50,51,49,50],
  wobble:  [50,55,46,52,57,48,53,55,50,56,49,54,52,50,53],
  rising:  [30,32,31,34,36,35,38,42,46,49,53,57,60,64,68],
  drift:   [45,46,46,48,49,49,50,52,53,54,54,56,57,58,59],
  stepped: [40,40,41,40,42,42,55,56,55,57,56,56,57,58,57],
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
      {fill && <path d={area} fill="currentColor" opacity="0.06" />}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

// Numeric sparkline — same stroke language as shape sparklines
function SparklineSeries({ values, w = 88, h = 22, color = "currentColor", fill = false, strokeWidth = 1, fillOpacity = 0.07 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const pad = 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / Math.max(0.001, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1)).join(" ");
  const area = path + ` L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;
  return (
    <svg width={w} height={h} className="spark" aria-hidden="true" style={{ color }}>
      {fill && <path d={area} fill="currentColor" opacity={fillOpacity} />}
      <path d={path} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

// Signal-specific sparkline with status-colored fill
function SignalSparkline({ machine, w = 64, h = 18 }) {
  const meta = window.inferSignalMeta ? window.inferSignalMeta(machine) : { shape: machine.trendKey || "flat", values: null };
  const cls = statusToClass(machine.status);
  const colorVar = machine.status === "crit" ? "var(--crit)" :
    machine.status === "warn" ? "var(--warn)" :
    machine.status === "unknown" ? "var(--unknown)" : "var(--ok)";

  if (meta.shape === "offline" || !meta.values) {
    return (
      <div className={"t-" + cls} title={meta.label}>
        <Sparkline shape="offline" w={w} h={h} color={colorVar} />
      </div>
    );
  }
  return (
    <div className={"signal-spark t-" + cls} title={meta.label} style={{ color: colorVar }}>
      <SparklineSeries values={meta.values} w={w} h={h} fill fillOpacity={0.12} strokeWidth={1} />
    </div>
  );
}

function HealthDelta({ machine }) {
  const delta = window.getHealthDelta7d ? window.getHealthDelta7d(machine) : null;
  if (delta == null || machine.health == null) return null;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const cls = delta > 0 ? "t-ok" : delta < 0 ? (delta <= -3 ? "t-crit" : "t-warn") : "t-3";
  return (
    <span className={"mono tnum health-delta " + cls} style={{ fontSize: 10 }}>
      {arrow}{Math.abs(delta)} / 7d
    </span>
  );
}

// Data ribbon — sparkline in instrument container
function DataRibbon({ shape, status, w = 64, h = 18, value }) {
  const cls = statusToClass(status || "ok");
  return (
    <div className="data-ribbon">
      {value != null && <span className="mono tnum" style={{fontSize: 10, color: "var(--ink-2)", minWidth: 28}}>{value}</span>}
      <div className={"t-" + cls}>
        <Sparkline shape={shape} w={w} h={h} />
      </div>
    </div>
  );
}

// ─── Status helpers ────────────────────────────────────────────────────────
const statusToClass = (s) => ({ ok: "ok", warn: "warn", crit: "crit", unknown: "unknown" }[s] || "ok");
const statusLabel = (s) => ({ ok: "Healthy", warn: "Watch", crit: "Critical", unknown: "Offline" }[s] || s);
const severityLabel = (s) => ({ crit: "Critical", warn: "Warning", info: "Info", unknown: "Unknown", safety: "Safety" }[s] || s);

function StatusDot({ status }) { return <span className={"dot " + statusToClass(status)} />; }

function StatusTag({ status, children }) {
  const cls = "tag-" + statusToClass(status);
  return <span className={"tag " + cls}>{children || statusLabel(status)}</span>;
}

// ─── Health bar ────────────────────────────────────────────────────────────
function HealthBar({ value, status, width = "100%" }) {
  if (value == null) {
    return (
      <div className="healthbar unknown" style={{width}}>
        <i style={{width: "100%", opacity: 0.5}} />
      </div>
    );
  }
  const cls = status || (value < 50 ? "crit" : value < 80 ? "warn" : "ok");
  return (
    <div className={"healthbar " + cls} style={{width}}>
      <i style={{width: Math.max(2, value) + "%"}} />
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ route, setRoute, ia = "standard", mobileOpen = false, onClose }) {
  const Ic = window.Icons;
  const counts = {
    inbox: window.DATA.ALERTS.filter(a => a.status === "open").length,
    crit: window.DATA.ALERTS.filter(a => a.severity === "crit" && a.status === "open").length,
    forecast: window.DATA.FORECAST.length,
  };

  // Standard IA: Fleet -> Site -> Machine -> Alert (hierarchical)
  // Inbox-first IA: Inbox first; Fleet for browsing; Forecast as a peer
  const items = ia === "inbox"
    ? [
        { id: "inbox", label: "Inbox", icon: Ic.inbox, badge: counts.inbox, badgeKind: counts.crit ? "crit" : null,
          route: "inbox", match: ["inbox", "alert"] },
        { id: "forecast", label: "Forecast", icon: Ic.forecast, route: "fleet", match: [] },
        { id: "fleet", label: "Browse fleet", icon: Ic.fleet, route: "fleet", match: ["fleet", "site", "machine"] },
        { id: "alarms", label: "Alarms", icon: Ic.alarms, route: "alarms", match: ["alarms"] },
        { id: "reports", label: "Reports", icon: Ic.reports, route: "reports", match: ["reports"] },
      ]
    : [
        { id: "fleet", label: "Fleet", icon: Ic.fleet, route: "fleet", match: ["fleet", "site", "machine"] },
        { id: "inbox", label: "Inbox", icon: Ic.inbox, badge: counts.inbox, badgeKind: counts.crit ? "crit" : null, route: "inbox", match: ["inbox", "alert"] },
        { id: "alarms", label: "Alarms", icon: Ic.alarms, route: "alarms", match: ["alarms"] },
        { id: "reports", label: "Reports", icon: Ic.reports, route: "reports", match: ["reports"] },
      ];

  const currentTop = (route || "").split(":")[0];
  const sites = window.DATA.SITES;

  return (
    <aside className={"side" + (mobileOpen ? " is-open" : "")}>
      <div className="side-brand">
        <div className="brand-mark">C</div>
        <div className="brand-text">
          <div className="brand-name">Cadence</div>
          <div className="brand-sub">Predictive</div>
        </div>
        <button type="button" className="side-close" onClick={onClose} aria-label="Close menu">
          <Ic.x size={18} />
        </button>
      </div>

      <div className="side-search">
        <span className="ic"><Ic.search size={13} /></span>
        <input className="input" placeholder="Search machines, sites…" />
        <span className="kbd">⌘K</span>
      </div>

      <nav className="nav">
        {items.map((it) => {
          const isActive = it.match && it.match.includes(currentTop);
          return (
          <div key={it.id}
               className={"nav-item " + (isActive ? "active" : "")}
               onClick={() => { setRoute(it.route); onClose && onClose(); }}>
            <span className="ic"><it.icon size={15} /></span>
            <span>{it.label}</span>
            {it.badge != null && it.badge > 0 && (
              <span className={"nav-badge " + (it.badgeKind || "")}>{it.badge}</span>
            )}
          </div>
        );})}
      </nav>

      <div className="side-section">
        <div className="side-section-label">Sites</div>
        <div className="nav">
          {sites.map((s) => {
            const statusCls =
              s.critical ? "site-crit" :
              s.attention >= 3 || s.health < 75 ? "site-warn" :
              "";
            const badgeVal = s.attention > 0 ? s.attention : s.machineCount;
            const badgeCls = s.attention > 0 ? (s.critical ? "crit" : "warn") : "";
            return (
              <div key={s.id}
                   className={"nav-item " + statusCls + (route === "site:" + s.id ? " active" : "")}
                   onClick={() => { setRoute("site:" + s.id); onClose && onClose(); }}>
                <span style={{whiteSpace: "nowrap", overflow:"hidden", textOverflow:"ellipsis", flex: 1, minWidth: 0}}>{s.name}</span>
                <span className={"nav-badge " + badgeCls}>{badgeVal}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="side-spacer" />

      <div className="side-foot">
        <div className="avatar slate">KR</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 12, fontWeight: 500, color: "var(--ink)"}}>Klaus Reinhardt</div>
          <div style={{fontSize: 11, color: "var(--ink-3)"}}>Technician · Wolfsburg</div>
        </div>
        <button className="btn btn-ghost btn-sm" title="Settings"><Ic.cog size={14}/></button>
      </div>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────
function Topbar({ crumbs, actions, sub, onMenuOpen, primaryAction }) {
  const Ic = window.Icons;
  return (
    <header className="topbar">
      {onMenuOpen && (
        <button type="button" className="topbar-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
          <Ic.menu size={18} />
        </button>
      )}
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep"><Ic.chevR size={12} /></span>}
            {c.onClick ? (
              <span onClick={c.onClick} style={{cursor:"pointer"}} className={i === crumbs.length - 1 ? "" : "t-2"}>
                {i === crumbs.length - 1 ? <b>{c.label}</b> : c.label}
              </span>
            ) : (
              i === crumbs.length - 1 ? <b>{c.label}</b> : <span>{c.label}</span>
            )}
          </React.Fragment>
        ))}
        {sub && <span className="t-4" style={{marginLeft: 12, fontSize: 12}}>·  {sub}</span>}
      </div>
      <div className="topbar-actions">
        {actions || (
          <div className="topbar-actions-extra">
            <span className="topbar-desktop-only"><window.DesignNotes /></span>
            <button className="btn btn-ghost btn-sm topbar-desktop-only" title="Investigation chart concepts"
                    onClick={() => { location.hash = "investigate"; }}>
              Charts
            </button>
            <button className="btn btn-ghost btn-sm topbar-desktop-only" title="Notifications"><Ic.bell size={14}/></button>
            <button className="btn btn-sm topbar-primary-action" title="New work order" aria-label="New work order"><Ic.plus size={15}/> New work order</button>
          </div>
        )}
        {primaryAction}
      </div>
    </header>
  );
}

function MobileBottomNav({ route, setRoute, ia = "standard", onOpenMenu }) {
  const Ic = window.Icons;
  const top = (route || "").split(":")[0];
  const items = ia === "inbox"
    ? [
        { id: "inbox", label: "Inbox", icon: Ic.inbox, route: "inbox", match: ["inbox", "alert"] },
        { id: "fleet", label: "Fleet", icon: Ic.fleet, route: "fleet", match: ["fleet", "site", "machine"] },
        { id: "alarms", label: "Alarms", icon: Ic.alarms, route: "alarms", match: ["alarms"] },
      ]
    : [
        { id: "fleet", label: "Fleet", icon: Ic.fleet, route: "fleet", match: ["fleet", "site", "machine"] },
        { id: "inbox", label: "Inbox", icon: Ic.inbox, route: "inbox", match: ["inbox", "alert"] },
        { id: "alarms", label: "Alarms", icon: Ic.alarms, route: "alarms", match: ["alarms"] },
      ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((it) => {
        const active = it.match.includes(top);
        return (
          <button
            key={it.id}
            type="button"
            className={"bottom-nav-item" + (active ? " is-active" : "")}
            onClick={() => setRoute(it.route)}
          >
            <span className="ic"><it.icon size={18} /></span>
            <span>{it.label}</span>
          </button>
        );
      })}
      <button type="button" className="bottom-nav-item" onClick={onOpenMenu}>
        <span className="ic"><Ic.cog size={18} /></span>
        <span>More</span>
      </button>
    </nav>
  );
}

// ─── Generic helpers ───────────────────────────────────────────────────────
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

// Instrument cluster — hairline-divided KPI strip
function InstrumentCluster({ items }) {
  return (
    <div className="cluster-strip">
      {items.map((item, i) => (
        <div key={i} className="cluster-cell">
          <div className="cluster-label">{item.label}</div>
          <div className={"cluster-value" + (item.emphasis ? " emphasis" : "")}>{item.value}</div>
          {item.sub && <div className="cluster-sub">{item.sub}</div>}
          {item.chart && <div className="cluster-chart">{item.chart}</div>}
        </div>
      ))}
    </div>
  );
}

// Small gauge arc for fleet KPI
function MiniDonut({ value, color = "var(--ok)", size = 56, track = "var(--surface-sunken)" }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth="2" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
              strokeWidth="2" strokeLinecap="butt"
              strokeDasharray={`${dash} ${c}`}
              transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

// Time ago helper for fake timestamps
function timeAgo(s) { return s; }

// Aggregate counts for status colors
function statusForHealth(h) {
  if (h == null) return "unknown";
  if (h < 50) return "crit";
  if (h < 80) return "warn";
  return "ok";
}

// Machine type icon helper
function MachineIcon({ type, size = 14 }) {
  // Tiny pictograms — abstract, industrial
  const sw = 1.4;
  const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none",
                   stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "press":
      return (<svg {...common}><rect x="3" y="2.5" width="10" height="2" rx="0.5"/><path d="M5 4.5v3l-1 2v2.5h8V9.5l-1-2v-3"/><path d="M3 13.5h10"/></svg>);
    case "motor":
      return (<svg {...common}><rect x="2" y="5" width="9" height="6" rx="0.8"/><path d="M11 6.5h2v3h-2"/><path d="M4 5V3.5M9 5V3.5"/></svg>);
    case "pump":
      return (<svg {...common}><circle cx="7" cy="8" r="3.5"/><circle cx="7" cy="8" r="1"/><path d="M10.5 8H13M7 4.5V2.5h2.5"/></svg>);
    case "fan":
      return (<svg {...common}><circle cx="8" cy="8" r="1.4"/><path d="M8 6.6a3.5 3.5 0 00-3.4-2.6M9.4 8a3.5 3.5 0 002.6-3.4M8 9.4a3.5 3.5 0 003.4 2.6M6.6 8a3.5 3.5 0 00-2.6 3.4"/></svg>);
    case "compressor":
      return (<svg {...common}><rect x="2.5" y="5" width="6" height="6" rx="0.8"/><circle cx="11.5" cy="8" r="2.5"/><path d="M5.5 5V3M9 11h2.5"/></svg>);
    case "cnc":
      return (<svg {...common}><rect x="2.5" y="3" width="11" height="9" rx="1"/><path d="M5 12V14M11 12V14M6 6.5h4M8 6.5v3"/></svg>);
    case "conveyor":
      return (<svg {...common}><path d="M2 8a2 2 0 010-3l11-1.5a2 2 0 110 4L2 8z" /><path d="M3 12l10-1"/></svg>);
    default:
      return (<svg {...common}><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>);
  }
}

// Plain-language formatter — wrap "needles" in <em> for emphasis
function PL({ text, kind }) {
  // No special parsing — caller writes the text. Used for the calm body copy.
  return <p className="pl" style={{margin: 0}}>{text}</p>;
}

// Expert assessment footnote — prior cases + human review, not model weights
function ExpertNote({ children }) {
  return (
    <div className="expert-note">
      <div className="expert-note-label">Assessment</div>
      <div className="expert-note-body">{children}</div>
    </div>
  );
}

// AI explainer footnote — technical callout block
function AiNote({ children, confidence }) {
  return (
    <div style={{display:"flex", gap:10, alignItems:"flex-start",
                 background:"var(--surface-sunken)", border:"1px solid var(--line)",
                 padding: "10px 12px"}}>
      <div className="ai-badge" style={{flexShrink:0}}>Model</div>
      <div style={{fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.45}}>
        {children}
        {confidence != null && (
          <span style={{color:"var(--ink-3)"}}> · <span className="mono">{confidence}%</span> confidence</span>
        )}
      </div>
    </div>
  );
}

// Globally available
Object.assign(window, {
  Sparkline, SparklineSeries, SignalSparkline, HealthDelta, DataRibbon, MachineFingerprint, StatusDot, StatusTag, HealthBar, Sidebar, Topbar, MobileBottomNav,
  SectionH, InstrumentCluster, MiniDonut, MachineIcon, PL, AiNote, ExpertNote,
  statusToClass, statusLabel, severityLabel, statusForHealth, hashSeed,
});
