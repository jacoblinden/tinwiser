// machine.jsx — Machine detail: calm, text-led, graphs collapsed by default.

const { useState: useStateMachine, useMemo: useMemoMachine } = React;

function MachineHeader({ m, site }) {
  const Ic = window.Icons;
  return (
    <div className="page-h machine-page-header">
      <div className="machine-page-header-main">
        <div className="machine-page-thumb">
          <MachineFingerprint seed={m.id} status={m.status} bars={14} />
          <MachineIcon type={m.type} size={18} />
        </div>
        <div className="machine-page-meta">
          <h1 className="page-title machine-page-title">
            <span className="machine-page-name">{m.name}</span>
            <span className="machine-page-id mono">{m.id}</span>
          </h1>
          <div className="machine-page-status-row">
            <StatusTag status={m.status} />
          </div>
          <div className="page-sub machine-page-sub">
            <span>{m.model}</span>
            <span className="machine-page-sub-sep" aria-hidden="true">·</span>
            <span>{site.name} / {m.area}</span>
            <span className="machine-page-sub-sep" aria-hidden="true">·</span>
            <span>Criticality <strong>{m.criticality}</strong></span>
            <span className="machine-page-sub-sep" aria-hidden="true">·</span>
            <span>{m.runtime}</span>
          </div>
        </div>
      </div>
      <div className="machine-page-header-actions">
        <button type="button" className="btn btn-sm btn-ghost machine-header-action-secondary" aria-label="Mute alerts">
          <Ic.bell size={13} /> <span className="btn-label">Mute alerts</span>
        </button>
        <button type="button" className="btn btn-sm btn-ghost machine-header-action-secondary" aria-label="Schedule service">
          <Ic.calendar size={13} /> <span className="btn-label">Schedule service</span>
        </button>
      </div>
    </div>
  );
}

// ─── Health card — the centerpiece ────────────────────────────────────────
function machineAssessment(m) {
  if (m.status === "ok") {
    return "All monitored signals sit within established baselines for this machine type. No open alerts. Last service 21 days ago.";
  }
  if (m.status === "unknown") {
    return "Sensor gap since 06:42 — gateway team notified. Prior to offline, all signals were nominal. Physical check recommended.";
  }
  if (m.status === "crit") {
    return "Pattern matches 2 prior bearing-failure cases on KSB Etanorm pumps at this site. Slope crossed critical band overnight. Reviewed by reliability team 18 May. Stop on next shift handover.";
  }
  if (m.model?.includes("Schuler") || m.model?.includes("MSP")) {
    return "Pattern matches 3 prior bearing-wear cases on similar Schuler MSP-class presses. Slope-based projection to alarm threshold in 3–5 weeks. Reviewed by service team 17 May. Confirm with DTI gauge on inspection.";
  }
  return "Trend matches prior cavitation cases on Grundfos NK pumps. Inspect suction strainer first. Reviewed by maint. supervisor 16 May.";
}

function HealthCard({ m }) {
  const v = m.health;
  const status = m.status;
  const headline =
    status === "ok" ? "Operating normally." :
    status === "unknown" ? "Sensor offline." :
    status === "crit" ? (m.issue || "Action needed now.") :
    (m.issue || "Watching a slow trend.");

  const detail =
    status === "ok" ? "All vibration, temperature and current readings sit within the established baseline for this machine. The most recent 7 days show no drift." :
    status === "unknown" ? "The gateway last received data at 06:42 today. The machine may be perfectly fine — but until the sensor reports, we treat it as unknown, not healthy." :
    status === "warn" && m.issue?.includes("vibration") ? "Velocity RMS on the drive-end bearing has climbed from 2.8 mm/s to 3.6 mm/s over the past 14 days. Still below alarm threshold (4.5 mm/s), but the slope projects crossing it in roughly 3–5 weeks." :
    status === "crit" ? `${m.issue}. Bearing acceleration crossed the critical band overnight — a pattern that typically precedes failure within 2–5 days.` :
    `${m.issue}. We're tracking the trend; nothing requires action this week.`;

  const kpis = m.type === "press" ? [
    { label: "Velocity RMS", value: m.status !== "ok" ? "3.6" : "2.4", unit: "mm/s", trend: m.trendKey || "flat", status: m.status !== "ok" ? "warn" : "ok" },
    { label: "Temperature", value: "68", unit: "°C", trend: "flat", status: "ok" },
    { label: "Cycles / hour", value: "412", unit: "", trend: "flat", status: "ok" },
    { label: "Peak tonnage", value: m.status !== "ok" ? "612" : "598", unit: "kN", trend: m.status !== "ok" ? "rising" : "flat", status: m.status !== "ok" ? "warn" : "ok" },
    { label: "Oil pressure", value: "5.8", unit: "bar", trend: "flat", status: "ok" },
  ] : [
    { label: "Velocity RMS", value: m.status === "crit" ? "7.1" : "3.6", unit: "mm/s", trend: m.trendKey || "flat", status: m.status !== "ok" ? "warn" : "ok" },
    { label: "Temperature", value: "68", unit: "°C", trend: "flat", status: "ok" },
    { label: "Motor current", value: "42.1", unit: "A", trend: "flat", status: "ok" },
    { label: "Cycle rate", value: "412", unit: "/h", trend: "flat", status: "ok" },
  ];

  return (
    <div className="machine-hero card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="machine-hero-top">
        <div className="machine-hero-summary">
          <div className="machine-hero-health">
            <div className="machine-hero-score">
              <span className="data-hero mono tnum machine-hero-score-num">{v == null ? "—" : v}</span>
              <span className="machine-hero-score-denom">/ 100</span>
            </div>
            <HealthBar value={v} status={status} width={72} />
          </div>
          <div className="machine-hero-copy">
            <div className="eyebrow machine-hero-eyebrow">Health</div>
            <div className="machine-hero-headline">{headline}</div>
            <p className="pl machine-hero-detail">{detail}</p>
            {(status === "warn" || status === "crit") && (
              <div className="machine-hero-assessment">
                <ExpertNote>{machineAssessment(m)}</ExpertNote>
              </div>
            )}
          </div>
        </div>
        <div className="machine-hero-kpis">
          {kpis.map((k) => (
            <QuickMetric key={k.label} {...k} />
          ))}
        </div>
      </div>

      {m.type === "press" && (
        <div className="machine-hero-charts">
          <ForceDisplacementChart machine={m} />
          <MachineSignalGrid machine={m} />
          <MachineHealthTimeline machine={m} />
          <AnomalyBandChart machine={m} />
        </div>
      )}
      {m.type !== "press" && (
        <div className="machine-hero-charts">
          <MachineSignalGrid machine={m} />
          <MachineHealthTimeline machine={m} />
          <AnomalyBandChart machine={m} />
        </div>
      )}
    </div>
  );
}

function QuickMetric({ label, value, unit, trend, status }) {
  return (
    <div className="machine-kpi-tile">
      <div className="eyebrow" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
        <div className="data-hero mono tnum" style={{ fontSize: 18, lineHeight: 1 }}>
          {value}<span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 400 }}> {unit}</span>
        </div>
        <div className={"t-" + statusToClass(status)}>
          <Sparkline shape={trend} w={48} h={16} />
        </div>
      </div>
    </div>
  );
}

// ─── Active issues / recommended actions ──────────────────────────────────
function ActiveIssues({ m, go }) {
  const alerts = window.alertsFor(m.id);
  const Ic = window.Icons;
  if (alerts.length === 0) {
    return (
      <div className="card" style={{padding: 18, textAlign: "center", color: "var(--ink-3)"}}>
        <div style={{fontSize: 13.5, color: "var(--ink-1)"}}>No active issues.</div>
        <div style={{fontSize: 12, marginTop: 4}}>Nothing to do here. Move on.</div>
      </div>
    );
  }
  return (
    <div style={{display:"flex", flexDirection: "column", gap: 12}}>
      {alerts.map((a) => (
        <div key={a.id} className="card" style={{padding: "16px 18px", cursor: "pointer"}}
             onClick={() => go("alert:" + a.id)}>
          <div style={{display: "flex", alignItems: "flex-start", gap: 14}}>
            <span className={"dot " + statusToClass(a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : "unknown")} style={{marginTop: 6}}/>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap"}}>
                <span style={{fontSize: 14.5, fontWeight: 500, color: "var(--ink)"}}>{a.title}</span>
                <span className="mono t-4" style={{fontSize: 11, flexShrink: 0}}>{a.id}</span>
              </div>
              <p className="pl" style={{margin: 0, fontSize: 13.5, color: "var(--ink-2)"}}>{a.pl}</p>
              {a.actions && a.actions[0] && (
                <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                              background: "var(--surface-2)", borderRadius: 7, border: "1px solid var(--line)"}}>
                  <Ic.wrench size={14}/>
                  <div style={{fontSize: 12.5, color: "var(--ink-1)"}}>
                    <b>Recommended: </b>{a.actions[0].text}
                  </div>
                </div>
              )}
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4}}>
              <StatusTag status={a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : "unknown"}>
                {severityLabel(a.severity)}
              </StatusTag>
              <span className="t-3" style={{fontSize: 11}}>{a.raised}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Live data tab ─────────────────────────────────────────────────────────
function LiveData({ m }) {
  const channels = [
    { name: "Vibration · drive end", icon: "vibration", value: "3.6", unit: "mm/s", baseline: "2.4 mm/s", trend: m.trendKey === "rising" ? "rising" : "flat", status: m.trendKey === "rising" ? "warn" : "ok" },
    { name: "Vibration · non-drive end", icon: "vibration", value: "1.9", unit: "mm/s", baseline: "2.1 mm/s", trend: "flat", status: "ok" },
    { name: "Bearing temperature", icon: "temp", value: "68", unit: "°C", baseline: "64 °C", trend: "flat", status: "ok" },
    { name: "Motor current", icon: "current", value: "42.1", unit: "A", baseline: "41.8 A", trend: "flat", status: "ok" },
    { name: "Cycle rate", icon: "cycle", value: "412", unit: "/h", baseline: "418 /h", trend: "flat", status: "ok" },
    { name: "Oil pressure", icon: "info", value: "5.8", unit: "bar", baseline: "5.7 bar", trend: "flat", status: "ok" },
  ];
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{padding: "12px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between"}}>
        <div style={{fontSize: 13, fontWeight: 500}}>Live · last 60s</div>
        <div className="t-3" style={{fontSize: 11.5}}>Updated 4s ago · 6 of 24 channels shown</div>
      </div>
      <div className="live-channels-grid">
        {channels.map((c, i) => {
          const Ic = window.Icons[c.icon] || window.Icons.info;
          return (
            <div key={i} className="live-channel-cell">
              <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--ink-3)"}}>
                <Ic size={13} />
                <span style={{fontSize: 11.5}}>{c.name}</span>
              </div>
              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10}}>
                <div className="metric" style={{fontSize: 22, color: c.status !== "ok" ? "var(--warn)" : "var(--ink)"}}>
                  {c.value}<span style={{fontSize: 12, color: "var(--ink-3)", fontWeight: 400}}> {c.unit}</span>
                </div>
                <div style={{color: c.status === "warn" ? "var(--warn)" : "var(--ok)"}}>
                  <Sparkline shape={c.trend} w={72} h={22} />
                </div>
              </div>
              <div style={{fontSize: 11, color: "var(--ink-4)", marginTop: 4}}>Baseline {c.baseline}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding: "10px 18px", background: "var(--surface-2)", borderTop: "1px solid var(--line)", textAlign: "center"}}>
        <button className="btn btn-sm btn-ghost">Show all 24 channels</button>
      </div>
    </div>
  );
}


// ─── Service history tab ───────────────────────────────────────────────────
function ServiceHistory({ m }) {
  const Ic = window.Icons;
  const entries = [
    { date: "28 Apr 2026", by: "M. Kowalski", what: "Quarterly inspection · re-greased drive-end bearing", kind: "service", h: "2.4h" },
    { date: "12 Mar 2026", by: "T. Schmidt", what: "Replaced position sensor on top die", kind: "repair", h: "0.8h" },
    { date: "02 Feb 2026", by: "M. Kowalski", what: "Quarterly inspection", kind: "service", h: "2.0h" },
    { date: "19 Nov 2025", by: "A. Becker", what: "Hydraulic filter change", kind: "service", h: "0.6h" },
    { date: "04 Sep 2025", by: "M. Kowalski", what: "Replaced NDE bearing (SKF 22220) — preventive", kind: "repair", h: "4.2h" },
  ];
  const docs = [
    { name: "Schuler MSP-630 service manual.pdf", size: "12 MB" },
    { name: "Drive bearing spec — SKF 22220 EK.pdf", size: "0.4 MB" },
    { name: "Hydraulic schematic Rev. C.pdf", size: "2.1 MB" },
    { name: "Operator handover notes 2024-09.txt", size: "8 KB" },
  ];

  return (
    <div className="two-col">
      <div>
        <SectionH title="Service history" sub={entries.length + " entries in the last 12 months"} />
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {entries.map((e, i) => (
            <div key={i} className="service-entry-row">
              <div className="mono" style={{fontSize: 11.5, color: "var(--ink-3)"}}>{e.date}</div>
              <div>
                <div style={{fontSize: 13, color: "var(--ink-1)"}}>{e.what}</div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>by {e.by}</div>
              </div>
              <div className="mono tnum" style={{fontSize: 12, color: "var(--ink-3)"}}>{e.h}</div>
              <div>{e.kind === "service" ? <StatusTag status="ok">Service</StatusTag> : <span className="tag tag-outline">Repair</span>}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionH title="Documents & parts" sub="" />
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {docs.map((d, i) => (
            <div key={i} style={{display: "flex", gap: 12, padding: "12px 16px",
                                  borderBottom: i < docs.length - 1 ? "1px solid var(--line)" : "none",
                                  alignItems: "center", cursor: "pointer"}} className="row-hover">
              <Ic.doc size={14}/>
              <div style={{flex: 1, fontSize: 12.5}}>{d.name}</div>
              <div className="mono t-4" style={{fontSize: 11}}>{d.size}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main machine screen ──────────────────────────────────────────────────
function MachineScreen({ machineId, go }) {
  const m = window.getMachine(machineId);
  if (!m) return <div className="page-body">Unknown machine.</div>;
  const site = window.getSite(m.site);
  const [tab, setTab] = useStateMachine("overview");

  return (
    <div className="page-body fade-in">
      <MachineHeader m={m} site={site} />
      <HealthCard m={m} />

      <div className="tabs tabs-scroll" style={{ marginTop: 12, marginBottom: 14 }}>
        <div className={"tab " + (tab === "overview" ? "active" : "")} onClick={() => setTab("overview")}>Overview</div>
        <div className={"tab " + (tab === "live" ? "active" : "")} onClick={() => setTab("live")}>Live data</div>
        <div className={"tab " + (tab === "history" ? "active" : "")} onClick={() => setTab("history")}>History</div>
        <div className={"tab " + (tab === "service" ? "active" : "")} onClick={() => setTab("service")}>Service <span className="count">5</span></div>
      </div>

      {tab === "overview" && (
        <div className="two-col" style={{gap: 22}}>
          <div>
            <SectionH title="Active issues"
                      sub={window.alertsFor(m.id).length === 0 ? "None right now." : null}
                      right={<button className="btn btn-sm btn-ghost">Inbox →</button>} />
            <ActiveIssues m={m} go={go} />

            <div style={{height: 24}} />
            <SectionH title="Recent service" right={<button className="btn btn-sm btn-ghost" onClick={() => setTab("service")}>All history →</button>} />
            <div className="card" style={{padding: 0, overflow:"hidden"}}>
              {[
                { date: "28 Apr 2026", who: "M. Kowalski", what: "Quarterly inspection · re-greased drive-end bearing" },
                { date: "12 Mar 2026", who: "T. Schmidt", what: "Replaced position sensor on top die" },
                { date: "02 Feb 2026", who: "M. Kowalski", what: "Quarterly inspection" },
              ].map((e, i) => (
                <div key={i} className="service-entry-row service-entry-row--compact">
                  <div className="mono" style={{fontSize: 11.5, color: "var(--ink-3)"}}>{e.date}</div>
                  <div style={{fontSize: 12.5}}>{e.what}</div>
                  <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>{e.who}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionH title="Quick facts" />
            <div className="card" style={{padding: 0, overflow: "hidden"}}>
              <FactRow label="Model" value={m.model}/>
              <FactRow label="Criticality" value={m.criticality} sub="High" />
              <FactRow label="Installed" value="14 Jun 2019"/>
              <FactRow label="Runtime since service" value={m.runtime}/>
              <FactRow label="Next planned service" value="Tue 21 May" />
              <FactRow label="Owner" value="K. Reinhardt"/>
              <FactRow label="Sensors" value="6 of 6 online" sub={m.status === "unknown" ? "1 offline" : ""}/>
            </div>

            <div style={{height: 24}} />

            <SectionH title="At a glance · 7d" />
            <div className="card" style={{padding: 0, overflow: "hidden"}}>
              <MiniChannel label="Vibration · DE" trend={m.trendKey} status={m.status === "ok" ? "ok" : "warn"} value="3.6 mm/s" />
              <MiniChannel label="Vibration · NDE" trend="flat" status="ok" value="1.9 mm/s" />
              <MiniChannel label="Temperature" trend="flat" status="ok" value="68 °C" />
              <MiniChannel label="Current" trend="flat" status="ok" value="42.1 A" />
            </div>
          </div>
        </div>
      )}

      {tab === "live" && <LiveData m={m} />}
      {tab === "history" && (
        <>
          <SectionH
            title="Investigation"
            sub="Overlay correlation or signal grid — scan all channels, then drill in"
            right={
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => go("investigate")}>
                All concepts →
              </button>
            }
          />
          <InvestigationWorkspace
            concept="terminal"
            scenario={
              m.trendKey === "rising" || m.trendKey === "spike" || m.trendKey === "stepped"
                ? "concern"
                : "healthy"
            }
            height={300}
          />
        </>
      )}
      {tab === "service" && <ServiceHistory m={m} />}
    </div>
  );
}

function FactRow({ label, value, sub }) {
  return (
    <div className="fact-row">
      <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>{label}</div>
      <div style={{fontSize: 12.5, color: "var(--ink-1)"}}>
        {value}{sub && <span className="t-3"> · {sub}</span>}
      </div>
    </div>
  );
}

function MiniChannel({ label, value, trend, status }) {
  return (
    <div style={{display:"grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", alignItems: "center"}}>
      <div>
        <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>{label}</div>
        <div className="mono tnum" style={{fontSize: 12.5, color: "var(--ink-1)"}}>{value}</div>
      </div>
      <div style={{color: status === "ok" ? "var(--ok)" : "var(--warn)"}}>
        <Sparkline shape={trend} w={56} h={20} />
      </div>
      <StatusDot status={status} />
    </div>
  );
}

window.MachineScreen = MachineScreen;
