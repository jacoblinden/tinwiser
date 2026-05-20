// site.jsx — Site view: machine list grouped by area + floor plan tab.

const { useState: useStateSite } = React;

function SiteHeader({ site }) {
  const Ic = window.Icons;
  const status = site.critical ? "crit" : site.attention >= 3 || site.health < 75 ? "warn" : "ok";
  return (
    <div className="site-header" style={{marginBottom: 22}}>
      <div className="page-h" style={{marginBottom: 14}}>
        <div>
          <h1 className="page-title" style={{display: "flex", alignItems: "center", gap: 12}}>
            <StatusDot status={status} />
            {site.name}
          </h1>
          <div className="page-sub">
            <span className="mono">{site.country}</span>
            <span> · </span>
            {site.machineCount} machines
            <span> · </span>
            Areas: {site.areas.join(", ")}
          </div>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost" title="Service plan"><Ic.calendar size={13} /> Service plan</button>
          <button className="btn btn-sm" title="Work order"><Ic.plus size={13} /> Work order</button>
        </div>
      </div>

      {/* Practical info strip */}
      <div className="card site-kpi-grid" style={{padding: 0, display: "grid",
                                     gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                     overflow: "hidden"}}>
        <PracticalCell label="Health" value={site.health + " / 100"} sub={
          site.critical ? <span className="t-crit">1 critical now</span> :
          site.attention > 0 ? <span className="t-warn">{site.attention} watch</span> :
          <span className="t-ok">All healthy</span>
        }/>
        <PracticalCell label="Site contact" value={site.contact} sub={site.contactRole} />
        <PracticalCell label="Spares location" value={site.sparesLocation.split(",")[0]} sub={site.sparesLocation.split(",").slice(1).join(",").trim() || "—"} />
        <PracticalCell label="Open work orders" value="4" sub="2 scheduled this week" right />
      </div>
    </div>
  );
}

function PracticalCell({ label, value, sub, right }) {
  return (
    <div style={{padding: "14px 18px", borderLeft: right ? "1px solid var(--line)" : "1px solid var(--line)", borderLeft: "1px solid var(--line)"}}>
      <div className="eyebrow" style={{fontSize: 10.5, marginBottom: 4}}>{label}</div>
      <div style={{fontSize: 14.5, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3}}>{value}</div>
      <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>{sub}</div>
    </div>
  );
}

// ─── Machine row ───────────────────────────────────────────────────────────
function MachineRow({ m, onOpen }) {
  const Ic = window.Icons;
  const status = m.status;
  const meta = window.inferSignalMeta ? window.inferSignalMeta(m) : null;
  return (
    <div onClick={() => onOpen(m.id)}
         style={{display: "grid",
                 gridTemplateColumns: "minmax(140px, 1.4fr) minmax(100px, 1fr) 80px minmax(120px, 0.95fr) 80px 20px",
                 gap: 14, padding: "0 16px",
                 alignItems: "center", height: 44,
                 borderBottom: "1px solid var(--line)",
                 cursor: "pointer",
                 fontSize: 13}}
         className="row-hover machine-row">
      <div style={{display:"flex", flexDirection:"column", gap: 2, minWidth: 0}}>
        <div style={{display: "flex", alignItems: "baseline", gap: 8, minWidth: 0}}>
          <span style={{fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{m.name}</span>
          <span className="mono" style={{fontSize: 11, color: "var(--ink-4)", flexShrink: 0}}>{m.id}</span>
        </div>
        <div style={{fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{m.model} · {m.area}</div>
      </div>
      <div style={{minWidth: 0}}>
        {m.issue ? (
          <div style={{fontSize: 12, color: "var(--ink-1)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{m.issue}</div>
        ) : (
          <span className="t-3" style={{fontSize: 12}}>—</span>
        )}
      </div>
      <div><StatusTag status={status} /></div>
      <div style={{display:"flex", alignItems: "center", gap: 6, minWidth: 0}}>
        <div style={{flex: 1, minWidth: 0}}><HealthBar value={m.health} status={status} /></div>
        <span className="mono tnum" style={{fontSize: 13, minWidth: 20, textAlign: "right", flexShrink: 0}}>{m.health == null ? "—" : m.health}</span>
        <HealthDelta machine={m} />
      </div>
      <div title={meta?.label}>
        <SignalSparkline machine={m} w={64} h={18} />
      </div>
      <div style={{display:"flex", justifyContent:"flex-end", color: "var(--ink-4)"}}>
        <Ic.chevR size={14} />
      </div>
    </div>
  );
}

function MachineRowHead() {
  return (
    <div className="machine-row-head" style={{display: "grid",
                 gridTemplateColumns: "minmax(140px, 1.4fr) minmax(100px, 1fr) 80px minmax(120px, 0.95fr) 80px 20px",
                 gap: 14, padding: "0 16px",
                 alignItems: "center", height: 32,
                 borderBottom: "1px solid var(--line)",
                 background: "var(--surface-sunken)",
                 fontSize: 10, fontWeight: 500,
                 letterSpacing: "0.04em", textTransform: "uppercase",
                 color: "var(--ink-3)"}}>
      <div>Machine</div>
      <div>Signal</div>
      <div>Status</div>
      <div>Health</div>
      <div>Trend</div>
      <div></div>
    </div>
  );
}

function AreaSectionHeader({ name, machines }) {
  const dist = { ok: 0, warn: 0, crit: 0, unknown: 0 };
  machines.forEach((m) => { dist[m.status] = (dist[m.status] || 0) + 1; });
  const withHealth = machines.filter((m) => m.health != null);
  const areaHealth = withHealth.length
    ? Math.round(withHealth.reduce((s, m) => s + m.health, 0) / withHealth.length)
    : null;
  const segments = [
    { key: "ok", count: dist.ok, color: "var(--ok)" },
    { key: "warn", count: dist.warn, color: "var(--warn)" },
    { key: "crit", count: dist.crit, color: "var(--crit)" },
    { key: "unknown", count: dist.unknown, color: "var(--unknown)" },
  ].filter((s) => s.count > 0);
  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;

  return (
    <div className="area-section-head">
      <div className="area-section-title">
        <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
        <span className="t-3" style={{ fontSize: 11.5 }}>{machines.length} machine{machines.length !== 1 && "s"}</span>
      </div>
      <div className="area-section-stats">
        {areaHealth != null && (
          <span className="mono tnum" style={{ fontSize: 12, color: "var(--ink-1)", marginRight: 10 }}>
            {areaHealth}<span style={{ fontSize: 10, color: "var(--ink-4)" }}> health</span>
          </span>
        )}
        <div className="area-dist-bar" aria-hidden="true">
          {segments.map((s) => (
            <div key={s.key} style={{ flex: s.count, background: s.color }} title={s.key + ": " + s.count} />
          ))}
        </div>
        <span className="t-3" style={{ fontSize: 10, marginLeft: 8, whiteSpace: "nowrap" }}>
          {dist.ok} ok · {dist.warn} watch{dist.crit ? ` · ${dist.crit} crit` : ""}{dist.unknown ? ` · ${dist.unknown} off` : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Floor plan ────────────────────────────────────────────────────────────
// Abstract factory floor — areas as soft rectangles, machines as positioned dots.
function FloorPlan({ machines, go }) {
  // Simple deterministic layout: each area = a "bay" along x; machines stack within.
  const areas = [...new Set(machines.map(m => m.area))];
  const aw = 220, gap = 18; // area width / gap

  return (
    <div className="card" style={{padding: 18, overflow: "hidden"}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14}}>
        <div style={{fontSize: 13.5, fontWeight: 500}}>Hall plan</div>
        <div style={{display: "flex", gap: 10, alignItems: "center", fontSize: 11.5, color: "var(--ink-3)"}}>
          <span style={{display:"inline-flex", alignItems:"center", gap: 6}}><span className="dot ok"/> Healthy</span>
          <span style={{display:"inline-flex", alignItems:"center", gap: 6}}><span className="dot warn"/> Watch</span>
          <span style={{display:"inline-flex", alignItems:"center", gap: 6}}><span className="dot crit"/> Critical</span>
          <span style={{display:"inline-flex", alignItems:"center", gap: 6}}><span className="dot unknown"/> Offline</span>
        </div>
      </div>
      <div style={{background: "var(--surface-2)", borderRadius: 8, padding: 22, overflowX: "auto"}}>
        <div style={{display: "flex", gap: gap, minWidth: areas.length * (aw + gap)}}>
          {areas.map((area, i) => {
            const here = machines.filter(m => m.area === area);
            return (
              <div key={area} style={{flexShrink: 0}}>
                <div style={{fontSize: 11.5, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6}}>{area}</div>
                <div style={{width: aw, minHeight: 220, padding: 14,
                             border: "1px dashed var(--line-strong)",
                             borderRadius: 6, background: "var(--surface)",
                             display: "grid",
                             gridTemplateColumns: "repeat(2, 1fr)",
                             gap: 12, alignContent: "start"}}>
                  {here.map((m) => (
                    <div key={m.id}
                      onClick={() => go("machine:" + m.id)}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 6,
                        padding: "10px 8px 8px",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex", flexDirection: "column", gap: 4,
                        boxShadow: m.status === "crit" ? "0 0 0 2px var(--crit-soft)" : "none",
                      }}>
                      <StatusDot status={m.status} />
                      <div style={{fontSize: 11.5, fontWeight: 500, color: "var(--ink)", lineHeight: 1.2}}>{m.name.replace(/^.+? /, '')}</div>
                      <div className="mono" style={{fontSize: 9.5, color: "var(--ink-4)"}}>{m.id}</div>
                    </div>
                  ))}
                  {/* Empty placeholders to keep the bay feeling like a floor */}
                  {Array.from({length: Math.max(0, 4 - here.length)}).map((_, k) => (
                    <div key={"e"+k} style={{height: 56, border: "1px dashed var(--line)", borderRadius: 6, opacity: 0.6}} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Site Screen ───────────────────────────────────────────────────────────
function SiteScreen({ siteId, go }) {
  const Ic = window.Icons;
  const site = window.getSite(siteId);
  const machines = window.machinesAt(siteId);
  const [tab, setTab] = useStateSite("list");
  const [filter, setFilter] = useStateSite("all");
  const [type, setType] = useStateSite("all");

  if (!site) return <div className="page-body">Unknown site.</div>;

  const types = [...new Set(machines.map(m => m.type))];

  const filtered = machines.filter((m) => {
    if (filter === "attention") return m.status !== "ok";
    if (filter === "critical") return m.status === "crit";
    if (filter === "offline") return m.status === "unknown";
    return true;
  }).filter((m) => type === "all" ? true : m.type === type);

  const grouped = site.areas.map((a) => ({
    name: a,
    items: filtered.filter((m) => m.area === a),
  })).filter(g => g.items.length);

  return (
    <div className="page-body fade-in">
      <SiteHeader site={site} />

      {/* Tabs */}
      <div className="tabs" style={{marginBottom: 18}}>
        <div className={"tab " + (tab === "list" ? "active" : "")} onClick={() => setTab("list")}>
          <Ic.list size={13} /> List <span className="count">{machines.length}</span>
        </div>
        <div className={"tab " + (tab === "floor" ? "active" : "")} onClick={() => setTab("floor")}>
          <Ic.map size={13} /> Floor plan
        </div>
        <div className={"tab " + (tab === "service" ? "active" : "")} onClick={() => setTab("service")}>
          <Ic.calendar size={13} /> Service plan
        </div>
      </div>

      {tab === "list" && (
        <>
          <SiteSummaryStrip siteId={siteId} />

          <div className="site-list-meta" style={{ marginBottom: 16 }}>
            <WhatChangedThisWeek siteId={siteId} />
          </div>

          {/* Filter bar */}
          <div className="filterbar">
            <div style={{position: "relative"}}>
              <span style={{position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)"}}>
                <Ic.search size={13} />
              </span>
              <input className="input input-search" placeholder={`Search ${machines.length} machines…`} />
            </div>
            <div className="sep" />
            <ToggleChips value={filter} onChange={setFilter}
                         options={[{v:"all", l:"All"}, {v:"attention", l:"Needs attention"}, {v:"critical", l:"Critical"}, {v:"offline", l:"Offline"}]}/>
            <div className="sep" />
            <select className="input" style={{width: 160, height: 28}}
                    value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All machine types</option>
              {types.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
            <button className="btn btn-sm btn-ghost"><Ic.filter size={13}/> Area</button>
            <button className="btn btn-sm btn-ghost">Criticality</button>

            <div style={{marginLeft: "auto", color: "var(--ink-3)", fontSize: 12}}>{filtered.length} machines</div>
          </div>

          {/* Grouped list */}
          {grouped.map((g) => (
            <div key={g.name} className="card" style={{marginBottom: 14, padding: 0, overflow: "hidden"}}>
              <div style={{padding: "10px 18px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)"}}>
                <AreaSectionHeader name={g.name} machines={g.items} />
              </div>
              <MachineRowHead />
              {g.items.map((m) => (
                <MachineRow key={m.id} m={m} onOpen={(id) => go("machine:" + id)} />
              ))}
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="card" style={{padding: 50, textAlign: "center", color: "var(--ink-3)"}}>
              No machines match these filters.
            </div>
          )}

          <div className="site-list-footer" style={{ marginTop: 20 }}>
            <div className="site-list-footer-grid">
              <SiteActivityFeed siteId={siteId} go={go} />
              <FloorPlanThumbnail machines={machines} go={go} onOpenTab={() => setTab("floor")} />
            </div>
          </div>
        </>
      )}

      {tab === "floor" && (
        <FloorPlan machines={machines} go={go} />
      )}

      {tab === "service" && (
        <>
          <ServiceHeatmapCalendar />
          <div style={{ height: 18 }} />
          <ServicePlan machines={machines} />
        </>
      )}
    </div>
  );
}

function ToggleChips({ value, onChange, options }) {
  return (
    <div style={{display: "inline-flex", padding: 2, background: "var(--surface-3)",
                 borderRadius: 7, gap: 2}}>
      {options.map((o) => (
        <button key={o.v}
                onClick={() => onChange(o.v)}
                style={{
                  fontSize: 12, fontWeight: 500,
                  padding: "4px 10px",
                  border: "none",
                  borderRadius: 5,
                  background: value === o.v ? "var(--surface)" : "transparent",
                  color: value === o.v ? "var(--ink)" : "var(--ink-2)",
                  boxShadow: value === o.v ? "var(--shadow-card)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// Heatmap calendar — service load across 12 weeks
function ServiceHeatmapCalendar() {
  const weeks = window.getServiceHeatmap();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const levelColor = (v) =>
    v === 0 ? "var(--surface-sunken)" :
    v === 1 ? "color-mix(in srgb, var(--chart-4) 25%, var(--surface-sunken))" :
    v === 2 ? "color-mix(in srgb, var(--chart-4) 55%, var(--surface-sunken))" :
    "var(--chart-4)";

  return (
    <div className="card service-heatmap" style={{ padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Service load · 12 weeks</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Planned interventions by day</div>
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-4)" }}>Less · More</div>
      </div>
      <div className="service-heatmap-grid">
        <div className="service-heatmap-days">
          {days.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        {weeks.map((row, wi) => (
          <div key={wi} className="service-heatmap-row">
            {row.map((v, di) => (
              <div key={di} className="service-heatmap-cell" style={{ background: levelColor(v) }} title={`Week ${wi + 1} · ${days[di]} · ${v} job${v !== 1 ? "s" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal placeholder Service Plan tab (we keep this calm and small)
function ServicePlan({ machines }) {
  const Ic = window.Icons;
  const items = [
    { date: "Tue 21 May", machine: "WLF-P04", who: "M. Kowalski", what: "Drive-side bearing inspection", kind: "planned" },
    { date: "Wed 22 May", machine: "WLF-H07", who: "A. Becker", what: "Hydraulic filter change", kind: "planned" },
    { date: "Thu 23 May", machine: "WLF-P02", who: "T. Schmidt", what: "Quarterly vibration check", kind: "planned" },
    { date: "Tue 28 May", machine: "WLF-M14", who: "—", what: "Stator current investigation", kind: "suggested" },
  ];
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{padding: "14px 18px", borderBottom: "1px solid var(--line)", display:"flex", justifyContent: "space-between"}}>
        <div style={{fontSize: 14, fontWeight: 500}}>Next 14 days</div>
        <button className="btn btn-sm"><Ic.plus size={13} /> Schedule</button>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{display: "grid",
                              gridTemplateColumns: "120px 1.5fr 1fr 120px 90px",
                              gap: 16, padding: "14px 18px",
                              borderBottom: "1px solid var(--line)",
                              alignItems: "center", fontSize: 13}}>
          <div style={{fontWeight: 500}}>{it.date}</div>
          <div>{it.what}</div>
          <div className="mono t-3" style={{fontSize: 12}}>{it.machine}</div>
          <div className="t-2">{it.who}</div>
          <div>{it.kind === "planned" ? <StatusTag status="ok">Scheduled</StatusTag> : <StatusTag status="forecast">Suggested</StatusTag>}</div>
        </div>
      ))}
    </div>
  );
}

window.SiteScreen = SiteScreen;
