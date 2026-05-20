// press.jsx — Press detail. The most-used screen. Where depth shows.
//
// Visual brief: this page is the tour-de-force of well-rendered industrial
// data. Generous spacing, one money chart per band, dense supporting context.

const { useState: useStatePress } = React;

function PressScreen({ pressId, go, persona }) {
  const Ic = window.Icons;
  const p = window.getPress(pressId);
  if (!p) return <div className="page-body">Unknown press.</div>;
  const site = window.getSite(p.site);
  const alerts = window.alertsFor(p.id);
  const channels = window.pressChannels(p);
  const [tab, setTab] = useStatePress("overview");

  return (
    <div className="page-body fade-in">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <PressHeader p={p} site={site} go={go} persona={persona}/>

      {/* ─── Health card — the centerpiece ──────────────────────── */}
      <HealthCard p={p} alerts={alerts} go={go} persona={persona}/>

      {/* ─── Tabs ──────────────────────────────────────────────── */}
      <div className="tabs" style={{marginTop: 26, marginBottom: 22}}>
        <div className={"tab " + (tab === "overview" ? "active" : "")} onClick={() => setTab("overview")}>
          <Ic.force size={13}/> Overview
        </div>
        <div className={"tab " + (tab === "signals" ? "active" : "")} onClick={() => setTab("signals")}>
          <Ic.grid size={13}/> Signals <span className="count">{channels.length}</span>
        </div>
        <div className={"tab " + (tab === "history" ? "active" : "")} onClick={() => setTab("history")}>
          <Ic.clock size={13}/> History
        </div>
        <div className={"tab " + (tab === "service" ? "active" : "")} onClick={() => setTab("service")}>
          <Ic.workshop size={13}/> Service & parts
        </div>
      </div>

      {tab === "overview"   && <OverviewTab p={p} alerts={alerts} go={go}/>}
      {tab === "signals"    && <SignalsTab p={p} channels={channels}/>}
      {tab === "history"    && <HistoryTab p={p}/>}
      {tab === "service"    && <ServiceTab p={p}/>}
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────
function PressHeader({ p, site, go, persona }) {
  const Ic = window.Icons;
  const isTech = persona?.kind === "tech";
  return (
    <div className="page-h" style={{alignItems: "center", marginBottom: 22}}>
      <div style={{display: "flex", gap: 16, alignItems: "center"}}>
        <div style={{padding: "12px 14px", background: "var(--surface-2)",
                       border: "1px solid var(--line)",
                       display: "flex", flexDirection: "column", gap: 8, alignItems: "center", minWidth: 60}}>
          <window.MachineFingerprint seed={p.id} status={p.status} bars={14}/>
          <window.PressIcon type={p.type} size={22}/>
        </div>
        <div style={{minWidth: 0, flex: 1}}>
          <h1 className="page-title page-title-lg" style={{display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap"}}>
            <span>{p.name}</span>
            <span className="mono" style={{fontSize: 13, color: "var(--ink-4)", fontWeight: 400}}>{p.id}</span>
            <window.StatusTag status={p.status}/>
          </h1>
          <div className="page-sub" style={{marginTop: 6}}>
            <span>{p.model}</span>
            <span className="sep-dot">·</span>
            <span>{site.fullName} / {p.area}</span>
            <span className="sep-dot">·</span>
            <span>Criticality <b className="t-2">{p.criticality}</b></span>
            <span className="sep-dot">·</span>
            <span>Commissioned {p.commissioned}</span>
            {p.tonnage && (
              <>
                <span className="sep-dot">·</span>
                <span><span className="mono">{p.tonnage}</span> ton · <span className="mono">{p.spm.max}</span> spm max</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{display: "flex", gap: 8, alignItems: "center"}}>
        <button className="btn btn-sm btn-ghost"><Ic.share size={13}/> Share</button>
        <button className="btn btn-sm btn-ghost"><Ic.download size={13}/> Export</button>
        {isTech && (
          <button className="btn btn-sm btn-ghost" onClick={() => go("alarms:new:press-" + p.id)}>
            <Ic.bell size={13}/> Suggest an alarm rule
          </button>
        )}
        <button className="btn btn-sm"><Ic.calendar size={13}/> Plan service</button>
      </div>
    </div>
  );
}

// ─── Health card — score + plain language + key metrics ──────────────────
function HealthCard({ p, alerts, go, persona }) {
  const primaryAlert = alerts?.find((a) => a.provenance) || alerts?.[0];
  const status = p.status;
  const isWarn = status === "warn";
  const isCrit = status === "crit";
  const isOff  = status === "unknown";

  const headline = isOff ? "Sensor offline."
                : isCrit ? p.issue
                : isWarn ? p.issue
                : "Operating normally.";

  const body = isOff ? <span>The vibration channel last reported at 06:42. The press itself may be running fine — we just can't see it.</span>
              : isWarn ? <>
                  <em>{p.summary || p.forecast}</em>{" "}
                  We're tracking this in the background. Nothing requires action today.
                </>
              : <>All monitored signals sit within the trained baseline for this press. The last 14 days show no drift, and the last 200 cycles overlap tightly.</>;

  return (
    <div className="two-col" style={{gap: 22, alignItems: "stretch"}}>
      {/* Left: health score + plain language */}
      <div className="card" style={{padding: 22, display: "grid",
                                      gridTemplateColumns: "112px 1fr",
                                      gap: 24, alignItems: "start"}}>
        <div>
          <div className="eyebrow" style={{marginBottom: 8}}>Health</div>
          <div className="data-mega" style={{
            color: isOff ? "var(--ink-3)" : isCrit ? "var(--crit)" : "var(--ink)"
          }}>
            {p.health == null ? "—" : p.health}
            <span style={{fontSize: 14, color: "var(--ink-4)", marginLeft: 4}}>/100</span>
          </div>
          <div style={{marginTop: 8}}><window.HealthBar value={p.health} status={status}/></div>
          {p.forecast && (
            <div style={{marginTop: 14, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5}}>
              <span className="eyebrow-mono">forecast</span>
              <div style={{marginTop: 4, color: "var(--ink-1)", fontSize: 12}}>{p.forecast}</div>
            </div>
          )}
        </div>

        <div style={{minWidth: 0}}>
          <div style={{fontSize: 19, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35, letterSpacing: "-0.012em", marginBottom: 10}}>
            {headline}
          </div>
          <div className="pl" style={{color: "var(--ink-2)", fontSize: 14}}>{body}</div>

          {primaryAlert?.provenance && (
            <window.CaughtByProvenance provenance={primaryAlert.provenance} go={go} persona={persona}/>
          )}
          {(isWarn || isCrit) && !primaryAlert?.provenance && (
            <div style={{marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
                           display: "flex", alignItems: "center", gap: 10}}>
              <span className="ai-badge">Detected by model</span>
              <span style={{fontSize: 11.5, color: "var(--ink-3)"}}>
                Trained on <span className="mono">184</span> similar BSTA-frame cases across Olsons fleet
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: at-a-glance press signals (small live readout) */}
      <PressMetricsPanel p={p}/>
    </div>
  );
}

// ─── Press metrics panel ──────────────────────────────────────────────────
function PressMetricsPanel({ p }) {
  const channels = window.pressChannels(p);
  // Surface the most-relevant 4 signals (press-canonical)
  const featured = channels.filter(c => ["Peak tonnage", "BDC variability", "Slide parallelism", "Velocity RMS · DE"].includes(c.name));

  return (
    <div className="card" style={{padding: 0, overflow: "hidden", display: "flex", flexDirection: "column"}}>
      <div style={{padding: "14px 20px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
        <div>
          <div style={{fontSize: 13.5, fontWeight: 600}}>Live readout</div>
          <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 3}}>
            Press-canonical signals · sampled every 2 s
          </div>
        </div>
        <span className="eyebrow-mono">live · 2s</span>
      </div>
      <div style={{padding: 0, flex: 1}}>
        {featured.map((c, i) => {
          const status = c.status || "ok";
          return (
            <div key={i} style={{display: "grid",
                                   gridTemplateColumns: "1fr auto 90px",
                                   gap: 12, padding: "14px 20px",
                                   alignItems: "center",
                                   borderBottom: i < featured.length - 1 ? "1px solid var(--line)" : "none"}}>
              <div>
                <div style={{fontSize: 11.5, color: "var(--ink-3)", marginBottom: 3}}>{c.name}</div>
                <div className="mono tnum" style={{fontSize: 11, color: "var(--ink-4)"}}>
                  baseline {c.baseline}
                </div>
              </div>
              <div className={"mono " + (status === "warn" ? "t-warn" : status === "crit" ? "t-crit" : "")}
                   style={{fontSize: 18, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em"}}>
                {c.value}{c.unit && <span style={{fontSize: 11, color: "var(--ink-4)", marginLeft: 3}}>{c.unit}</span>}
              </div>
              <window.MiniSpark shape={c.trend} status={status} w={78} h={20}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Overview tab — the visual showcase ──────────────────────────────────
function OverviewTab({ p, alerts, go }) {
  const Ic = window.Icons;
  const fc = p.tonnage != null ? window.getForceCurve(p.id) : null;
  const fft = window.getFFT(p.id);
  const spec = window.getSpectrogram(p.id);
  const cal = window.getCalendar(p.id);
  const pareto = window.getPareto(p.id);
  const miniDeck = window.getMiniDeck(p.id);
  const hyd = window.getHydraulicState(p.id);

  // Pick the fleet metric most relevant to this press's story
  const fleetMetric = p.issue?.includes("bearing") ? "vibration"
                    : p.issue?.includes("guide")   ? "parallelism"
                    : p.issue?.includes("tonnage") ? "peak"
                    : "peak";
  const fleet = window.getFleetComparison(p.id, fleetMetric);
  const fleetLabel = fleetMetric === "vibration" ? "Velocity RMS · drive end"
                   : fleetMetric === "parallelism" ? "Slide parallelism — corner-to-corner"
                   : "Peak tonnage per cycle";
  const fleetUnit = fleetMetric === "vibration" ? "mm/s"
                   : fleetMetric === "parallelism" ? "µm"
                   : "ton";

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 28}}>

      {/* ━━━ MONEY CHART 1: Force curve / cycle signature ━━━━━━━━━━━━━━━━━━ */}
      {fc && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>cycle signature</span>
                <span className="sep">·</span>
                <span>tonnage vs crank angle</span>
                <span className="sep">·</span>
                <span>200-cycle ensemble</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
                Force curve · last 200 cycles
              </h3>
              <p className="chart-sub">
                Each faint trace is a recent cycle; the solid line is the most recent. The baseline (dashed)
                is the trained envelope for this recipe.
                {p.activeRecipe && <> Current recipe: <b style={{color: "var(--ink-1)"}}>{p.activeRecipe}</b>.</>}
              </p>
            </div>
            <div className="chart-head-r">
              <div className="seg-ctrl">
                <button className="active">200 cycles</button>
                <button>2,000</button>
                <button>By recipe</button>
              </div>
            </div>
          </div>
          <div className="chart-canvas">
            <window.ForceCurveChart pressId={p.id} status={p.status} height={320}/>
          </div>
          <div className="chart-summary">
            <span className="ai-badge">Plain-language read</span>
            <span className="lead">{fc.summary}</span>
            {fc.annotations?.deviation && (
              <span style={{color: "var(--warn)", fontSize: 11.5, fontFamily: "var(--font-mono)", marginLeft: "auto"}}>
                {fc.annotations.deviation}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ━━━ SMALL MULTIPLES: synchronized signal grid ━━━━━━━━━━━━━━━━━━━━━ */}
      {miniDeck.length > 0 && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>small multiples</span>
                <span className="sep">·</span>
                <span>last 14 days</span>
                <span className="sep">·</span>
                <span>synchronized cursor</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>Press signature</h3>
              <p className="chart-sub">
                Eight canonical signals scaled to their own range. Hover anywhere to lock the cursor across every panel.
              </p>
            </div>
            <div className="chart-head-r">
              <div className="seg-ctrl">
                <button>7d</button>
                <button className="active">14d</button>
                <button>30d</button>
              </div>
            </div>
          </div>
          <window.SmallMultiples signals={miniDeck} cols={4} height={68}/>
        </div>
      )}

      {/* ━━━ ISSUE-SPECIFIC PANEL: the right diagnostic for the right story ━━ */}
      <IssueDiagnosticPanel p={p} fft={fft} spec={spec}/>

      {/* ━━━ HYDRAULIC STATE — only for hydraulic presses ━━━━━━━━━━━━━━━━━━ */}
      {hyd && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>hydraulic state</span>
                <span className="sep">·</span>
                <span>live · 1 Hz</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>Hydraulic circuit</h3>
              <p className="chart-sub">
                Pressure, temperature, and flow at each loop node. Green ticks mark the trained baseline;
                bars show position within the trained range.
              </p>
            </div>
            <div className="chart-head-r">
              <div className="seg-ctrl">
                <button className="active">Schematic</button>
                <button>Trends</button>
              </div>
            </div>
          </div>
          <div className="chart-canvas">
            <window.HydraulicState state={hyd} height={280}/>
          </div>
          <div className="chart-summary">
            <span className="ai-badge">Plain-language read</span>
            <span className="lead">
              All loop nodes within ±5% of trained baseline. Filter Δ trending up gently — replace by next quarterly service.
            </span>
          </div>
        </div>
      )}

      {/* ━━━ TWO-UP: cycle-count calendar + downtime pareto ━━━━━━━━━━━━━━━━ */}
      <div className="chart-grid-2">
        {cal && <CycleCalendarCard p={p} cal={cal}/>}
        {pareto && <DowntimeParetoCard p={p} pareto={pareto}/>}
      </div>

      {/* ━━━ FLEET COMPARISON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {fleet && fleet.length > 1 && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>fleet comparison</span>
                <span className="sep">·</span>
                <span>{fleet.length} sibling presses</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
                {fleetLabel} — this press vs siblings
              </h3>
              <p className="chart-sub">
                Each tick is one press of the same model across both sites. The mean line is dashed.
                This press is the filled marker.
              </p>
            </div>
            <div className="chart-head-r">
              <div className="seg-ctrl">
                <button>Same model</button>
                <button className="active">All NordPlåt</button>
                <button>All Olsons fleet</button>
              </div>
            </div>
          </div>
          <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 14}}>
            <window.FleetStrip items={fleet} unit={fleetUnit} height={120}/>
          </div>
          <div className="chart-summary">
            {(() => {
              const me = fleet.find(i => i.isThis);
              const meanV = fleet.reduce((s, x) => s + x.value, 0) / fleet.length;
              const delta = me ? me.value - meanV : 0;
              const sign = delta > 0 ? "+" : "";
              return (
                <>
                  <span className="ai-badge">vs cohort</span>
                  <span className="lead">
                    This press reads {me ? <span className="mono">{(me.value).toFixed(1)}</span> : "—"} {fleetUnit} —
                    {" "}{sign}{Math.abs(delta).toFixed(1)} {fleetUnit} from the cohort mean.
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ━━━ TWO-UP: open recs + at-a-glance ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="two-col" style={{gap: 22}}>
        <div>
          <window.SectionH title="Open recommendations"
                    sub={alerts.length === 0 ? "Nothing flagged on this press." : "Tap to open the full recommendation."}
                    right={alerts.length > 0 ? <span className="t-3" style={{fontSize: 11.5}}>{alerts.length} open</span> : null}/>
          {alerts.length === 0
            ? <div className="card" style={{padding: 24, textAlign: "center", color: "var(--ink-3)"}}>
                <div style={{fontSize: 13.5, color: "var(--ink-1)"}}>No open recommendations.</div>
                <div style={{fontSize: 12, marginTop: 4}}>Press is operating within baseline.</div>
              </div>
            : <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                {alerts.map((a) => <AlertCard key={a.id} a={a} go={go}/>)}
              </div>
          }
        </div>

        <div>
          <window.SectionH title="Press at a glance"/>
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            <div className="kv"><div className="kv-k">Model</div><div className="kv-v">{p.model}</div></div>
            <div className="kv"><div className="kv-k">Commissioned</div><div className="kv-v">{p.commissioned} · {2026 - parseInt(p.commissioned)} years</div></div>
            <div className="kv"><div className="kv-k">Tonnage rating</div><div className="kv-v">{p.tonnage ? <span><span className="mono">{p.tonnage}</span> ton</span> : "—"}</div></div>
            <div className="kv"><div className="kv-k">Max speed</div><div className="kv-v"><span className="mono">{p.spm.max}</span> spm</div></div>
            <div className="kv"><div className="kv-k">Criticality</div><div className="kv-v">{p.criticality} · line-stopper</div></div>
            <div className="kv"><div className="kv-k">Runtime</div><div className="kv-v">{p.runtime}</div></div>
            <div className="kv"><div className="kv-k">Last Olsons service</div><div className="kv-v">{p.lastService || "—"}</div></div>
            <div className="kv"><div className="kv-k">Next Olsons visit</div><div className="kv-v" style={{color: "var(--olsons)", fontWeight: 500}}>{p.nextOlsonsVisit || "—"}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Issue-specific diagnostic panel ─────────────────────────────────────
// Picks the strongest visualization for the actual story.
function IssueDiagnosticPanel({ p, fft, spec }) {
  const guide   = p.issue?.includes("guide");
  const bearing = p.issue?.includes("bearing");
  const tonnage = p.issue?.includes("tonnage");

  if (bearing && spec && fft) {
    return <BearingSpectralPanel p={p} fft={fft} spec={spec}/>;
  }
  if (guide) {
    return <GuideWearPanel p={p}/>;
  }
  if (tonnage) {
    return <TonnageTrendPanel p={p}/>;
  }
  // Healthy press: show the trained baseline ribbon
  return <HealthyBaselinePanel p={p}/>;
}

// ─── Bearing spectral panel: spectrogram + FFT ───────────────────────────
function BearingSpectralPanel({ p, fft, spec }) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>bearing diagnostic</span>
            <span className="sep">·</span>
            <span>{fft.bearingRef}</span>
            <span className="sep">·</span>
            <span>{fft.rpm} rpm</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
            Drive-end accelerometer · spectrogram & power spectrum
          </h3>
          <p className="chart-sub">
            7-day spectrogram (top) shows the BPFO band intensifying day-over-day.
            Current FFT (bottom, solid) vs the trained baseline (dashed) makes the
            same story visible in a single snapshot.
          </p>
        </div>
        <div className="chart-head-r">
          <div className="seg-ctrl">
            <button>1 day</button>
            <button className="active">7 days</button>
            <button>30 days</button>
          </div>
        </div>
      </div>
      <div className="chart-canvas">
        <div style={{marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span className="eyebrow-mono">spectrogram</span>
          <div className="spec-legend">
            <span>low</span>
            <span className="ramp"/>
            <span>high</span>
          </div>
        </div>
        <window.Spectrogram
          matrix={spec.matrix}
          bins={spec.bins}
          fMax={spec.fMax}
          days={spec.days}
          windowsPerDay={spec.windowsPerDay}
          markers={fft.markers}
          height={170}/>
        <div style={{marginTop: 18, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span className="eyebrow-mono">power spectrum · current vs baseline</span>
          <div style={{display: "flex", gap: 16, fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)"}}>
            <span><span style={{display: "inline-block", width: 14, borderTop: "1.4px solid var(--ink)", verticalAlign: "middle", marginRight: 4}}/>current</span>
            <span><span style={{display: "inline-block", width: 14, borderTop: "1px dashed var(--ink-4)", verticalAlign: "middle", marginRight: 4}}/>baseline</span>
            <span><span style={{display: "inline-block", width: 14, borderTop: "1px dashed var(--crit)", verticalAlign: "middle", marginRight: 4}}/>fault tone</span>
          </div>
        </div>
        <window.FFTPlot
          spectrum={fft.spectrum}
          baseline={fft.baseline}
          markers={fft.markers}
          height={180}/>
      </div>
      <div className="chart-summary">
        <span className="ai-badge">Plain-language read</span>
        <span className="lead">{fft.note}</span>
      </div>
    </div>
  );
}

// ─── Guide-wear panel: parallelism trend + corners ───────────────────────
function GuideWearPanel({ p }) {
  const seriesKey = p.id + "_parallelism";
  const ts = window.getTimeSeries(seriesKey);
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>guide-wear diagnostic</span>
            <span className="sep">·</span>
            <span>slide parallelism</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
            Slide parallelism — 8-week trend with predicted band
          </h3>
          <p className="chart-sub">
            Corner-to-corner micrometers at BDC. The clutch-side rear corner drives the trend;
            green ribbon shows the trained baseline (±2σ); blue band is the 4-week projection.
          </p>
        </div>
      </div>
      {ts && (
        <div className="chart-canvas">
          <window.AnomalyTimeSeries seriesKey={seriesKey} status={p.status} height={240}/>
        </div>
      )}
      <div style={{padding: "12px 20px", borderTop: "1px solid var(--line)"}}>
        <div style={{display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8}}>
          <span className="eyebrow-mono">corner readout at BDC · live</span>
          <span style={{fontSize: 11, color: "var(--ink-3)"}}>µm from datum · alarm at ±80 µm</span>
        </div>
        <div className="slide-corners" style={{borderTop: "none", borderBottom: "none"}}>
          <div className="slide-corner">
            <div className="lbl">Front · operator</div>
            <div className="val">+12 <span style={{fontSize: 10, color: "var(--ink-4)"}}>µm</span></div>
            <div className="delta">Δ +1 over 8w</div>
          </div>
          <div className="slide-corner">
            <div className="lbl">Front · clutch</div>
            <div className="val">−14 <span style={{fontSize: 10, color: "var(--ink-4)"}}>µm</span></div>
            <div className="delta">Δ −1 over 8w</div>
          </div>
          <div className="slide-corner">
            <div className="lbl">Rear · operator</div>
            <div className="val">+8 <span style={{fontSize: 10, color: "var(--ink-4)"}}>µm</span></div>
            <div className="delta">Δ ±0 over 8w</div>
          </div>
          <div className="slide-corner warn">
            <div className="lbl">Rear · clutch</div>
            <div className="val">−42 <span style={{fontSize: 10, color: "var(--ink-4)"}}>µm</span></div>
            <div className="delta" style={{color: "var(--warn)"}}>Δ −24 over 8w</div>
          </div>
        </div>
      </div>
      <div className="chart-summary">
        <span className="ai-badge">Plain-language read</span>
        <span className="lead">
          Three corners flat. Rear-clutch corner drifting at ~3 µm/week. Linear projection crosses
          action threshold in 3–4 weeks.
        </span>
      </div>
    </div>
  );
}

// ─── Tonnage trend panel ─────────────────────────────────────────────────
function TonnageTrendPanel({ p }) {
  const seriesKey = p.id + "_tonnage";
  const ts = window.getTimeSeries(seriesKey);
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>tonnage drift</span>
            <span className="sep">·</span>
            <span>recipe R-302</span>
            <span className="sep">·</span>
            <span>9,400 cycles</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
            Peak tonnage on R-302 — 30 days with projected band
          </h3>
          <p className="chart-sub">
            Per-recipe baseline isolates the trend from natural recipe-to-recipe variation.
            Peak has crept up 6% over 9,400 cycles — pattern consistent with progressive punch wear.
          </p>
        </div>
      </div>
      {ts && (
        <div className="chart-canvas">
          <window.AnomalyTimeSeries seriesKey={seriesKey} status={p.status} height={240}/>
        </div>
      )}
      <div className="chart-summary">
        <span className="ai-badge">Plain-language read</span>
        <span className="lead">
          Press is healthy. Die wear (or a material lot off-spec) is the likely root cause.
          Inspect punch insert R-302 at next changeover.
        </span>
      </div>
    </div>
  );
}

// ─── Healthy press baseline panel ────────────────────────────────────────
function HealthyBaselinePanel({ p }) {
  const channels = window.pressChannels(p);
  const counts = {
    ok: channels.filter(c => (c.status || "ok") === "ok").length,
    warn: channels.filter(c => c.status === "warn").length,
    crit: channels.filter(c => c.status === "crit").length,
    unknown: channels.filter(c => c.status === "unknown").length,
  };
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>baseline integrity</span>
            <span className="sep">·</span>
            <span>{channels.length} signals</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 16, marginTop: 4}}>
            All channels within trained envelope
          </h3>
          <p className="chart-sub">
            No active diagnostic story. This is the "everything is boring" view that buyers
            want to see most days.
          </p>
        </div>
      </div>
      <div style={{padding: "18px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
                    borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)"}}>
        <div style={{borderRight: "1px solid var(--line)", padding: "0 14px"}}>
          <div className="eyebrow" style={{marginBottom: 6}}>Healthy</div>
          <div className="mono" style={{fontSize: 22, color: "var(--ok)", letterSpacing: "-0.02em"}}>{counts.ok}</div>
          <div style={{fontSize: 10.5, color: "var(--ink-4)", marginTop: 2}}>within ±2σ baseline</div>
        </div>
        <div style={{borderRight: "1px solid var(--line)", padding: "0 14px"}}>
          <div className="eyebrow" style={{marginBottom: 6}}>Watch</div>
          <div className="mono" style={{fontSize: 22, color: counts.warn ? "var(--warn)" : "var(--ink-4)", letterSpacing: "-0.02em"}}>{counts.warn}</div>
          <div style={{fontSize: 10.5, color: "var(--ink-4)", marginTop: 2}}>drifting in trained range</div>
        </div>
        <div style={{borderRight: "1px solid var(--line)", padding: "0 14px"}}>
          <div className="eyebrow" style={{marginBottom: 6}}>Critical</div>
          <div className="mono" style={{fontSize: 22, color: counts.crit ? "var(--crit)" : "var(--ink-4)", letterSpacing: "-0.02em"}}>{counts.crit}</div>
          <div style={{fontSize: 10.5, color: "var(--ink-4)", marginTop: 2}}>outside trained envelope</div>
        </div>
        <div style={{padding: "0 14px"}}>
          <div className="eyebrow" style={{marginBottom: 6}}>Offline</div>
          <div className="mono" style={{fontSize: 22, color: counts.unknown ? "var(--unknown)" : "var(--ink-4)", letterSpacing: "-0.02em"}}>{counts.unknown}</div>
          <div style={{fontSize: 10.5, color: "var(--ink-4)", marginTop: 2}}>sensor not reporting</div>
        </div>
      </div>
      <div className="chart-summary">
        <span className="ai-badge">Plain-language read</span>
        <span className="lead">
          Last 14 days: zero anomalies. Last 200 cycles: peak tonnage ±0.3 ton, BDC ±0.02 mm. Nothing to do.
        </span>
      </div>
    </div>
  );
}

// ─── Cycle-count calendar card ───────────────────────────────────────────
function CycleCalendarCard({ p, cal }) {
  const totalCycles = cal.reduce((s, d) => s + d.cycles, 0);
  const maxDay = Math.max(...cal.map(d => d.cycles));
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>utilization calendar</span>
            <span className="sep">·</span>
            <span>last 90 days</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
            Cycles per day
          </h3>
          <p className="chart-sub">
            One cell per day. Darker = more cycles. The weekly cadence is the load profile;
            white cells are downtime.
          </p>
        </div>
      </div>
      <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 14}}>
        <window.HeatmapCalendar days={cal} metric="cycles" height={130}/>
      </div>
      <div style={{padding: "12px 20px", borderTop: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12}}>
        <div style={{display: "flex", gap: 22, fontSize: 11.5, color: "var(--ink-3)"}}>
          <div>
            <div className="mono" style={{fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em"}}>
              {(totalCycles / 1e6).toFixed(2)}<span style={{fontSize: 11, color: "var(--ink-4)", marginLeft: 2}}>M</span>
            </div>
            <div style={{fontSize: 10.5, marginTop: 2}}>cycles · 90 days</div>
          </div>
          <div>
            <div className="mono" style={{fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em"}}>
              {maxDay.toLocaleString()}
            </div>
            <div style={{fontSize: 10.5, marginTop: 2}}>peak day</div>
          </div>
        </div>
        <div className="cal-legend">
          <span>0</span>
          <span className="ramp"/>
          <span>{maxDay.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Downtime pareto card ────────────────────────────────────────────────
function DowntimeParetoCard({ p, pareto }) {
  const totalH = pareto.reduce((s, x) => s + x.hours, 0);
  const totalCount = pareto.reduce((s, x) => s + x.count, 0);
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-eyebrow">
            <span>downtime pareto</span>
            <span className="sep">·</span>
            <span>last 18 months</span>
          </div>
          <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
            What stops this press
          </h3>
          <p className="chart-sub">
            Service hours by cause, sorted. Blue ogive shows cumulative %.
          </p>
        </div>
      </div>
      <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 6}}>
        <window.ParetoChart items={pareto} height={220}/>
      </div>
      <div style={{padding: "10px 20px", borderTop: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12}}>
        <div style={{display: "flex", gap: 22, fontSize: 11.5, color: "var(--ink-3)"}}>
          <div>
            <div className="mono" style={{fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em"}}>
              {totalH.toFixed(1)}<span style={{fontSize: 11, color: "var(--ink-4)", marginLeft: 3}}>h</span>
            </div>
            <div style={{fontSize: 10.5, marginTop: 2}}>service hours · 18m</div>
          </div>
          <div>
            <div className="mono" style={{fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em"}}>
              {totalCount}
            </div>
            <div style={{fontSize: 10.5, marginTop: 2}}>events</div>
          </div>
        </div>
        <div className="pareto-legend">
          <span className="item"><span className="swatch" style={{background: "var(--ink)"}}/> mechanical</span>
          <span className="item"><span className="swatch" style={{background: "var(--olsons)"}}/> hydraulic</span>
          <span className="item"><span className="swatch" style={{background: "var(--forecast)"}}/> electrical</span>
          <span className="item"><span className="swatch" style={{background: "var(--warn)"}}/> tooling</span>
          <span className="item"><span className="swatch" style={{background: "var(--ink-4)"}}/> service</span>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ a, go }) {
  const Ic = window.Icons;
  const sev = a.severity === "crit" ? "crit" : a.severity === "unknown" ? "unknown" : "warn";
  return (
    <div className="card" onClick={() => go("alert:" + a.id)}
         style={{padding: "16px 20px", cursor: "pointer"}}>
      <div style={{display: "flex", alignItems: "flex-start", gap: 14}}>
        <span className={"dot " + sev} style={{marginTop: 7, flexShrink: 0}}/>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap"}}>
            <span style={{fontSize: 14.5, fontWeight: 500, color: "var(--ink)"}}>{a.title}</span>
            <span className="mono t-4" style={{fontSize: 11}}>{a.id}</span>
          </div>
          <p className="pl" style={{fontSize: 13.5, color: "var(--ink-2)", margin: 0}}>
            {a.pl.length > 220 ? a.pl.slice(0, 220) + "…" : a.pl}
          </p>
          {a.actions?.[0]?.suggested?.tech && (
            <div style={{marginTop: 12, padding: "10px 12px", background: "var(--olsons-soft)",
                           border: "1px solid rgba(31,58,79,0.18)",
                           display: "flex", alignItems: "center", gap: 10, fontSize: 12}}>
              <Ic.technician size={13} style={{color: "var(--olsons)"}}/>
              <span>
                Olsons suggests <b style={{color: "var(--olsons)"}}>{window.getTech(a.actions[0].suggested.tech)?.name}</b> for {a.actions[0].suggested.when}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Signals tab ──────────────────────────────────────────────────────────
function SignalsTab({ p, channels }) {
  const Ic = window.Icons;
  const multi = window.getMultiSignal(p.id);
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 28}}>
      {/* Multi-signal overlay — every signal normalized on one canvas */}
      {multi && multi.length > 0 && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>multi-signal overlay</span>
                <span className="sep">·</span>
                <span>{multi.length} signals</span>
                <span className="sep">·</span>
                <span>normalized</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
                Investigation overlay
              </h3>
              <p className="chart-sub">
                The four most-diagnostic signals scaled to their own range and overlaid.
                Hover to read all four at the same timestamp.
              </p>
            </div>
          </div>
          <window.MultiSignalOverlay signals={multi} height={220}/>
        </div>
      )}

      <div>
        <window.SectionH title={`All signals · ${channels.length}`}
                  sub={`Live · 2s sample · grouped by signal family`}/>
        <div className="signal-grid">
          {channels.map((c, i) => (
            <SignalCell key={i} c={c}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalCell({ c }) {
  const status = c.status || "ok";
  return (
    <div className="signal-cell">
      <div className="sc-head">
        <span className="sc-name">{c.name}</span>
        <window.StatusDot status={status}/>
      </div>
      <div className={"sc-value " + (status === "warn" ? "warn" : status === "crit" ? "crit" : "")}>
        {c.value}
        {c.unit && <span className="sc-unit"> {c.unit}</span>}
      </div>
      <div className="sc-meta">
        <span style={{fontSize: 10.5, color: "var(--ink-4)"}}>base {c.baseline}</span>
      </div>
      <div className="sc-spark">
        <window.MiniSpark shape={c.trend} status={status} w={64} h={22}/>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────
function HistoryTab({ p }) {
  const seriesKey = p.issue?.includes("guide")    ? p.id + "_parallelism"
                  : p.issue?.includes("bearing")  ? p.id + "_vibration"
                  : p.issue?.includes("tonnage")  ? p.id + "_tonnage"
                  : null;
  const cal = window.getCalendar(p.id);
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 28}}>
      <div>
        <window.SectionH title="Investigation"
                  sub="Multi-channel overlay. Drag a time window to inspect."/>
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <h3 className="chart-title">Force curve · stack by recipe</h3>
              <p className="chart-sub">
                Current cycle (solid) compared to the last 200 cycles (faint) and the recipe baseline (dashed).
              </p>
            </div>
            <div className="chart-head-r">
              <div className="seg-ctrl">
                <button className="active">Last 200</button>
                <button>All today</button>
                <button>Compare days</button>
              </div>
            </div>
          </div>
          <div className="chart-canvas">
            <window.ForceCurveChart pressId={p.id} status={p.status} height={340} showGhosts={true}/>
          </div>
        </div>
      </div>

      {seriesKey && window.getTimeSeries(seriesKey) && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <h3 className="chart-title">{getTrendLabel(p)}</h3>
              <p className="chart-sub">{getTrendSub(p)}</p>
            </div>
          </div>
          <div className="chart-canvas">
            <window.AnomalyTimeSeries seriesKey={seriesKey} status={p.status} height={260}/>
          </div>
        </div>
      )}

      {cal && (
        <div className="chart-grid-2">
          <div className="chart-card">
            <div className="chart-head">
              <div className="chart-head-l">
                <div className="chart-eyebrow">
                  <span>anomaly density</span>
                  <span className="sep">·</span>
                  <span>last 90 days</span>
                </div>
                <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
                  Days with anomalies
                </h3>
                <p className="chart-sub">
                  Darker cell = more channel-wide drift events that day.
                </p>
              </div>
            </div>
            <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 14}}>
              <window.HeatmapCalendar days={cal} metric="anomaly" height={130}/>
            </div>
            <div style={{padding: "10px 20px", borderTop: "1px solid var(--line)"}}>
              <div className="cal-legend warn">
                <span>none</span>
                <span className="ramp"/>
                <span>many</span>
              </div>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-head">
              <div className="chart-head-l">
                <div className="chart-eyebrow">
                  <span>downtime calendar</span>
                  <span className="sep">·</span>
                  <span>last 90 days</span>
                </div>
                <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
                  Stops & service
                </h3>
                <p className="chart-sub">
                  Logged downtime (planned and unplanned) over the same window.
                </p>
              </div>
            </div>
            <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 14}}>
              <window.HeatmapCalendar days={cal} metric="downtime" height={130}/>
            </div>
            <div style={{padding: "10px 20px", borderTop: "1px solid var(--line)"}}>
              <div className="cal-legend warn">
                <span>none</span>
                <span className="ramp"/>
                <span>2 h+</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTrendLabel(p) {
  if (p.issue?.includes("guide"))    return "Slide parallelism · last 8 weeks";
  if (p.issue?.includes("bearing"))  return "Drive-end bearing vibration · 60 days";
  if (p.issue?.includes("tonnage"))  return "Peak tonnage on R-302 · last 30 days";
  return "Trend";
}
function getTrendSub(p) {
  if (p.issue?.includes("guide"))    return "Corner-to-corner difference on the slide. The clutch-side rear corner is drifting ~3 µm/week.";
  if (p.issue?.includes("bearing"))  return "Velocity RMS on the drive-end bearing. Rising at ~0.05 mm/s/day.";
  if (p.issue?.includes("tonnage"))  return "Peak force on the mount-bracket recipe. Up 6% over 9,400 cycles.";
  return "";
}

// ─── Service tab ──────────────────────────────────────────────────────────
function ServiceTab({ p }) {
  const Ic = window.Icons;
  const history = window.DATA.HISTORY[p.id] || [];
  const pareto = window.getPareto(p.id);
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 28}}>
      {pareto && (
        <div className="chart-card">
          <div className="chart-head">
            <div className="chart-head-l">
              <div className="chart-eyebrow">
                <span>service mix</span>
                <span className="sep">·</span>
                <span>last 18 months</span>
              </div>
              <h3 className="chart-title" style={{fontSize: 15, marginTop: 4}}>
                Hours by cause
              </h3>
              <p className="chart-sub">
                Where Olsons hours have gone on this press. Use the pattern to plan the next year.
              </p>
            </div>
          </div>
          <div className="chart-canvas" style={{paddingTop: 0, paddingBottom: 6}}>
            <window.ParetoChart items={pareto} height={220}/>
          </div>
        </div>
      )}
      <div className="two-col" style={{gap: 24}}>
        <div>
          <window.SectionH title="Service history · with Olsons"
                    sub={`${history.length} visits on this press, all logged by Olsons.`}/>
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            {history.map((e, i) => {
              const tech = window.getTech(e.who);
              return (
                <div key={i} style={{display: "grid",
                                       gridTemplateColumns: "108px 1fr auto",
                                       gap: 14, padding: "14px 20px",
                                       borderBottom: i < history.length - 1 ? "1px solid var(--line)" : "none",
                                       alignItems: "flex-start"}}>
                  <div className="mono" style={{fontSize: 11.5, color: "var(--ink-3)"}}>{e.date}</div>
                  <div style={{minWidth: 0}}>
                    <div style={{fontSize: 13, color: "var(--ink-1)", lineHeight: 1.45}}>{e.what}</div>
                    <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 8}}>
                      <window.TechAvatar tech={tech} size="sm"/>
                      <span>{tech?.name} · {tech?.role}</span>
                      <span>·</span>
                      <span className="mono">{e.hours}h</span>
                    </div>
                  </div>
                  <div>{e.kind === "repair"
                    ? <span className="tag tag-outline">Repair</span>
                    : <window.StatusTag status="ok">Service</window.StatusTag>}
                  </div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div style={{padding: 32, textAlign: "center", color: "var(--ink-3)"}}>No recorded service yet.</div>
            )}
          </div>
        </div>

        <div>
          <window.SectionH title="Spares · Olsons workshop" sub="Parts kept ready for this press model."/>
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            {[
              { ref: "OLS-BX-2204", name: "Guide bushing kit (clutch-side)", stock: 2, loc: "Bay 4, rack C" },
              { ref: "SKF-6210-2RS", name: "SKF 6210-2RS bearing × 2",      stock: 6, loc: "Bay 4, rack A" },
              { ref: "SKF-22220EK", name: "SKF 22220 EK bearing (DE main)", stock: 1, loc: "Bay 4, rack A" },
              { ref: "LUB-220",      name: "Mobil SHC 220 grease",           stock: 12, loc: "Bay 2, fluids" },
              { ref: "SEN-CLU-22",   name: "Clutch position sensor",         stock: 3, loc: "Bay 4, rack D" },
            ].map((s, i) => (
              <div key={i} style={{display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 20px",
                                    borderBottom: i < 4 ? "1px solid var(--line)" : "none", alignItems: "center"}}>
                <div>
                  <div style={{fontSize: 13, color: "var(--ink-1)"}}>{s.name}</div>
                  <div style={{fontSize: 11, color: "var(--ink-4)", marginTop: 2}}>
                    <span className="mono">{s.ref}</span> · {s.loc}
                  </div>
                </div>
                <span className="chip chip-strong"><span className="mono">{s.stock}</span> in stock</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.PressScreen = PressScreen;
