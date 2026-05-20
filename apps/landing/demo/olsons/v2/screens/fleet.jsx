// fleet.jsx — Fleet overview. Customer's daily landing.

const { useState: useStateFleet } = React;

function FleetScreen({ go, persona, siteFilter }) {
  const Ic = window.Icons;
  const { ALERTS, KPI, SITES, PRESSES, CUSTOMER } = window.DATA;
  const [activeSite, setActiveSite] = useStateFleet(siteFilter || "all");

  React.useEffect(() => { setActiveSite(siteFilter || "all"); }, [siteFilter]);

  const presses = activeSite === "all"
    ? PRESSES
    : PRESSES.filter(p => p.site === activeSite);

  const openAlerts = ALERTS.filter(a => a.status === "open" && (activeSite === "all" || a.site === activeSite))
    .sort((a, b) => {
      const ord = { crit: 0, warn: 1, unknown: 2, info: 3 };
      return ord[a.severity] - ord[b.severity];
    });

  const forecast = activeSite === "all"
    ? window.DATA.FORECAST
    : window.DATA.FORECAST.filter(f => f.site === activeSite);

  const healthTimeline = window.getFleetHealthTimeline(activeSite);
  const avoidedDowntime = window.getAvoidedDowntime();
  const interventions = window.getPredictedInterventions(activeSite);
  const healthDist = window.getHealthDistribution(activeSite);
  const fleetPareto = window.getFleetPareto(activeSite);
  const alarmCalendar = window.getFleetAlarmCalendar(activeSite);
  const siteSparks = window.getSiteSparklines();

  const firstWarn = openAlerts[0];
  const siteLabel = activeSite === "all" ? "all sites" : (window.getSite(activeSite)?.name || activeSite);

  return (
    <div className="page-body fade-in">
      {/* ─── Greeting ──────────────────────────────────────────── */}
      <div className="page-h page-h-quiet">
        <div>
          <p className="page-greeting">{persona.greeting}</p>
          <p className="page-title page-title-lg" style={{maxWidth: 720}}>
            {firstWarn
              ? <>One press needs your attention this week, and we have a plan.</>
              : <>Everything's running. Three predictions to look at.</>}
          </p>
          <p className="page-sub" style={{marginTop: 8}}>
            <span><b className="t-2">{CUSTOMER.name}</b></span>
            <span className="sep-dot">·</span>
            <span>{KPI.presses} presses, {KPI.sites} sites</span>
            <span className="sep-dot">·</span>
            <span>Synced 2 min ago</span>
          </p>
        </div>
        <div style={{display: "flex", gap: 8, alignItems: "center"}}>
          <button className="btn btn-sm btn-ghost"><Ic.calendar size={13}/> This week</button>
          <button className="btn btn-sm"><Ic.share size={13}/> Share view</button>
        </div>
      </div>

      <SitePicker sites={SITES} active={activeSite} setActive={(id) => { setActiveSite(id); }}/>

      {/* ─── Hero: fleet health horizon + ROI ──────────────────── */}
      <div className="section fleet-hero-section">
        <div className="fleet-hero-grid">
          <window.ChartCard
            className="fleet-hero-chart"
            title="Fleet health"
            sub={`Aggregate score · ${siteLabel} · 90 days + 30-day forecast`}
            badge="Model · forecast"
            footer={
              <>
                <span>Target <span className="mono">90</span></span>
                <span className="sep-dot">·</span>
                <span>Horizon bands show deviation from target</span>
              </>
            }>
            <window.FleetHealthHorizon data={healthTimeline} height={260}/>
          </window.ChartCard>

          <div className="fleet-hero-side">
            <window.ChartCard
              title="Avoided downtime"
              sub={`Since pilot · ${KPI.pilotStarted}`}
              badge="ROI">
              <window.AvoidedDowntimeCurve data={avoidedDowntime} height={168}/>
            </window.ChartCard>
            <window.FleetHeroKpis items={[
              { label: "Needs attention", value: openAlerts.length, tone: KPI.critical > 0 ? "t-warn" : "",
                sub: `${KPI.critical} critical · ${openAlerts.length - KPI.critical} watch` },
              { label: "Predicted · 30 d", value: KPI.forecast30, sub: "before alarm threshold" },
              { label: "Open alerts", value: KPI.open, sub: "across fleet" },
            ]}/>
          </div>
        </div>
      </div>

      {/* ─── Forward-looking: predicted interventions ─────────── */}
      <div className="section">
        <window.ChartCard
          title="Predicted interventions · next 90 days"
          sub="What's coming — ranked by severity and timing. None firing today."
          badge="Model · forecast"
          footer={<window.InterventionsLegend/>}>
          <window.PredictedInterventionsChart data={interventions} height={180}/>
        </window.ChartCard>
      </div>

      {/* ─── Distribution + pareto ─────────────────────────────── */}
      <div className="section">
        <div className="two-col-even">
          <window.ChartCard
            title="Health distribution"
            sub="How many presses in each bucket — ghost overlay is 30 days ago">
            <window.HealthDistributionChart data={healthDist} height={200}/>
          </window.ChartCard>
          <window.ChartCard
            title="Top failure modes · Q1"
            sub="Downtime drivers across the fleet — maintenance review view">
            <window.ParetoChart items={fleetPareto} height={200} valueKey="hours" valueUnit="h"/>
          </window.ChartCard>
        </div>
      </div>

      {/* ─── Sites + next visit ────────────────────────────────── */}
      <div className="section">
        <div className="two-col-even" style={{gap: 22}}>
          <div>
            <SectionH title="Sites" sub="Health trend by location"/>
            <window.SiteSparklineStrip sites={
              activeSite === "all" ? siteSparks : siteSparks.filter(s => s.id === activeSite)
            }/>
          </div>
          <NextVisitCard go={go}/>
        </div>
      </div>

      {/* ─── Needs attention (with inline sparklines) ──────────── */}
      <div className="section">
        <SectionH
          title="Needs attention"
          sub="Ordered by urgency — every item has a recommended action"
          right={<button className="btn btn-sm btn-ghost">All recommendations →</button>}
        />
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {openAlerts.map((a) => <AttentionRow key={a.id} alert={a} go={go}/>)}
          {openAlerts.length === 0 && (
            <div style={{padding: "32px 20px", textAlign: "center", color: "var(--ink-3)"}}>
              <div style={{fontSize: 14, color: "var(--ink-1)"}}>Nothing demands action right now.</div>
              <div style={{fontSize: 12, marginTop: 6}}>The next predicted intervention is {forecast[0]?.weeks.toFixed(1)} weeks out.</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Press list (compact) ────────────────────────────────── */}
      <div className="section section-quiet">
        <SectionH
          title={`All presses (${presses.length})`}
          sub={activeSite === "all" ? "Across all sites" : (window.getSite(activeSite)?.fullName)}
        />
        <PressList presses={presses.slice(0, 8)} go={go}/>
        {presses.length > 8 && (
          <div style={{marginTop: 10, textAlign: "center"}}>
            <button className="btn btn-sm btn-ghost">Show all {presses.length} presses →</button>
          </div>
        )}
      </div>

      {/* ─── Alarm heatmap (analytical footer) ─────────────────── */}
      <div className="section section-quiet">
        <window.ChartCard
          title="Alarm density · last 90 days"
          sub="Fleet-wide pattern — shift and weekday effects visible at a glance"
          footer={
            <div className="cal-legend warn">
              <span>Low</span>
              <span className="ramp"/>
              <span>High</span>
              <span style={{marginLeft: 12}}>Weekends muted · day-shift weighted</span>
            </div>
          }>
          <window.HeatmapCalendar days={alarmCalendar} metric="anomaly" height={120}/>
        </window.ChartCard>
      </div>
    </div>
  );
}

// ─── Site picker ───────────────────────────────────────────────────────────
function SitePicker({ sites, active, setActive }) {
  const { PRESSES, ALERTS } = window.DATA;
  if (sites.length === 1) return null;

  const allPresses = PRESSES.length;
  const allAttention = ALERTS.filter(a => a.status === "open").length;

  return (
    <div className="site-tabs">
      <div className={"site-tab all " + (active === "all" ? "active" : "dim")}
           onClick={() => setActive("all")}>
        <span className={"site-stamp " + (allAttention > 0 ? "warn" : "")}></span>
        <div>
          <div className="site-name">All sites</div>
          <div className="site-meta">
            <span className="mono">{allPresses}</span> presses · <span className="mono">{allAttention}</span> attention
          </div>
        </div>
      </div>
      {sites.map((s) => {
        const att = ALERTS.filter(a => a.status === "open" && a.site === s.id).length;
        const stamp = att >= 2 ? "warn" : att >= 1 ? "warn" : "";
        return (
          <div key={s.id}
               className={"site-tab " + (active === s.id ? "active" : "dim")}
               onClick={() => setActive(s.id)}>
            <span className={"site-stamp " + stamp}></span>
            <div>
              <div className="site-name">{s.name}</div>
              <div className="site-meta">
                <span className="mono">{s.pressCount}</span> presses · health <span className="mono">{s.health}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Next Olsons visit ─────────────────────────────────────────────────────
function NextVisitCard({ go }) {
  const { PLAN } = window.DATA;
  const Ic = window.Icons;
  const nextBooked = PLAN.find(p => p.kind === "booked" || p.kind === "scheduled");
  const tech = nextBooked ? window.getTech(nextBooked.tech) : null;
  const relatedAlert = nextBooked?.alertId ? window.getAlert(nextBooked.alertId) : null;
  const press = nextBooked?.machine ? window.getPress(nextBooked.machine) : null;
  const site = nextBooked ? window.getSite(nextBooked.site) : null;

  return (
    <div className="card" style={{padding: 0, overflow: "hidden", display: "flex", flexDirection: "column"}}>
      <div style={{padding: "14px 20px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
        <div>
          <div style={{fontSize: 13.5, fontWeight: 600}}>Next Olsons visit</div>
          <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 3}}>Confirmed for this week</div>
        </div>
        <span className="ai-badge t-olsons" style={{color: "var(--olsons)"}}>Olsons</span>
      </div>

      <div style={{padding: "16px 20px", flex: 1}}>
        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 14}}>
          <window.TechAvatar tech={tech} size="lg"/>
          <div>
            <div style={{fontSize: 14, fontWeight: 500, color: "var(--ink)"}}>{tech?.name}</div>
            <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>{tech?.role} · {tech?.years} years with Olsons</div>
          </div>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 14px",
                       fontSize: 13, color: "var(--ink-1)"}}>
          <span className="t-3" style={{fontSize: 11.5}}>When</span>
          <span style={{fontWeight: 500}}>{nextBooked?.day} · {nextBooked?.time}</span>
          <span className="t-3" style={{fontSize: 11.5}}>Reason</span>
          <span>{nextBooked?.title}</span>
          <span className="t-3" style={{fontSize: 11.5}}>Press</span>
          <span>
            {press ? (
              <a onClick={() => go("press:" + press.id)} style={{cursor: "pointer", borderBottom: "1px dashed var(--line-2)"}}>
                {press.name}
              </a>
            ) : "—"}
            <span className="t-3" style={{marginLeft: 8, fontSize: 11.5}}>{site?.name}</span>
          </span>
        </div>
      </div>

      <div style={{padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--surface)",
                     display: "flex", gap: 8, alignItems: "center"}}>
        {relatedAlert && (
          <button className="btn btn-sm btn-ghost" onClick={() => go("alert:" + relatedAlert.id)}>
            Triggered by {relatedAlert.id} →
          </button>
        )}
        <button className="btn btn-sm" style={{marginLeft: "auto"}} onClick={() => go("plan")}>
          See full plan
        </button>
      </div>
    </div>
  );
}

// ─── Attention row with inline sparkline ───────────────────────────────────
function AttentionRow({ alert, go }) {
  const m = window.getPress(alert.machine);
  const site = window.getSite(alert.site);
  const tech = window.getTech(alert.suggestedTech);
  const sev = alert.severity === "crit" ? "crit"
            : alert.severity === "unknown" ? "unknown"
            : "warn";
  return (
    <div className="insight insight-with-spark" onClick={() => go("alert:" + alert.id)}>
      <div className="insight-bullet"><span className={"dot " + sev}/></div>
      <div className="insight-body">
        <p className="insight-title">{alert.pl}</p>
        <div className="insight-meta">
          <span className="b">{m?.name}</span>
          <span className="mono">{m?.id}</span>
          <span className="sep-dot">·</span>
          <span>{site?.name}</span>
          {tech && alert.suggestedSlot && (
            <>
              <span className="sep-dot">·</span>
              <span>Suggested: <b className="b">{tech.name}</b> · {alert.suggestedSlot.day} {alert.suggestedSlot.time}</span>
            </>
          )}
        </div>
      </div>
      <div className="insight-spark">
        {m?.health != null && (
          <span className="mono tnum" style={{fontSize: 12, color: "var(--ink-2)", minWidth: 22, textAlign: "right"}}>
            {m.health}
          </span>
        )}
        <window.MiniSpark shape={m?.trendKey || "flat"} status={sev === "unknown" ? "unknown" : sev} w={72} h={20}/>
      </div>
      <div className="insight-actions" style={{display: "flex", alignItems: "center", gap: 6, paddingTop: 2}}>
        <window.StatusTag status={sev}>{window.severityLabel(alert.severity)}</window.StatusTag>
        <window.Icons.chevR size={14} style={{color: "var(--ink-4)"}}/>
      </div>
    </div>
  );
}

// ─── Press list ────────────────────────────────────────────────────────────
function PressList({ presses, go }) {
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{display: "grid",
                    gridTemplateColumns: "minmax(180px, 1.4fr) minmax(100px, 0.9fr) 90px minmax(120px, 1fr) 80px 64px 24px",
                    gap: 14, padding: "10px 20px",
                    background: "var(--surface)", borderBottom: "1px solid var(--line)",
                    fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--ink-3)"}}>
        <div>Press</div>
        <div>Model</div>
        <div>Status</div>
        <div>Signal</div>
        <div>Health</div>
        <div>Trend</div>
        <div></div>
      </div>
      {presses.map((p) => <PressRow key={p.id} p={p} go={go}/>)}
    </div>
  );
}

function PressRow({ p, go }) {
  const Ic = window.Icons;
  return (
    <div onClick={() => go("press:" + p.id)}
         className="row-hover"
         style={{display: "grid",
                   gridTemplateColumns: "minmax(180px, 1.4fr) minmax(100px, 0.9fr) 90px minmax(120px, 1fr) 80px 64px 24px",
                   gap: 14, padding: "0 20px", alignItems: "center",
                   height: 48, borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 13}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, minWidth: 0}}>
        <window.PressIcon type={p.type} size={15}/>
        <div style={{minWidth: 0}}>
          <div style={{fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{p.name}</div>
          <div className="mono" style={{fontSize: 11, color: "var(--ink-4)"}}>{p.id}</div>
        </div>
      </div>
      <div style={{fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{p.model}</div>
      <div><window.StatusTag status={p.status}/></div>
      <div style={{fontSize: 12, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
        {p.issue || <span className="t-4">—</span>}
      </div>
      <div style={{display: "flex", alignItems: "center", gap: 8}}>
        <div style={{flex: 1}}><window.HealthBar value={p.health} status={p.status}/></div>
        <span className="mono tnum" style={{fontSize: 13, minWidth: 22, textAlign: "right"}}>
          {p.health == null ? "—" : p.health}
        </span>
      </div>
      <window.MiniSpark shape={p.trendKey} status={p.status}/>
      <div style={{color: "var(--ink-4)", textAlign: "right"}}><Ic.chevR size={14}/></div>
    </div>
  );
}

window.FleetScreen = FleetScreen;
