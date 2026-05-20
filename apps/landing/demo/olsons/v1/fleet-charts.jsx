// fleet-charts.jsx — Fleet overview visualizations (v1 chart language)

const FLEET_MARKER_COLORS = {
  service: "var(--chart-4)",
  alarm: "var(--warn)",
  added: "var(--chart-2)",
};

function seriesPath(values, xAt, yAt) {
  return values.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
}

function bandPath(low, high, xAt, yAt) {
  const top = high.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  const bot = [...low].reverse().map((v, i) => {
    const idx = low.length - 1 - i;
    return "L" + xAt(idx).toFixed(1) + "," + yAt(v).toFixed(1);
  }).join(" ");
  return top + " " + bot + " Z";
}

// ─── KPI embeds ────────────────────────────────────────────────────────────

function KpiHealthSparkline({ values, w = 112, h = 26 }) {
  return <SparklineSeries values={values} w={w} h={h} color="var(--ok)" strokeWidth={1} />;
}

function KpiAttentionBar({ critical, watch, w = 112, h = 6 }) {
  const total = Math.max(1, critical + watch);
  const critPct = (critical / total) * 100;
  return (
    <div className="kpi-bar-stack" style={{ width: w, height: h }} aria-hidden="true">
      <div className="kpi-bar-seg crit" style={{ width: critPct + "%" }} />
      <div className="kpi-bar-seg warn" style={{ width: (100 - critPct) + "%" }} />
    </div>
  );
}

function KpiInterventionBars({ weeks, w = 112, h = 28 }) {
  const max = Math.max(...weeks, 1);
  return (
    <div className="kpi-mini-bars" style={{ width: w, height: h }} aria-hidden="true">
      {weeks.map((v, i) => (
        <div key={i} className="kpi-mini-bar">
          <i style={{ height: (v / max) * 100 + "%" }} />
        </div>
      ))}
    </div>
  );
}

function KpiCumulativeLine({ values, w = 112, h = 28 }) {
  return <SparklineSeries values={values} w={w} h={h} color="var(--chart-4)" fill strokeWidth={1} />;
}

// ─── Hero timeline ───────────────────────────────────────────────────────────

function FleetHealthTimeline() {
  const data = window.FLEET_CHARTS;
  const hist = data.healthHistory;
  const fc = data.healthForecast;
  const histLen = hist.length;
  const fcLen = fc.mid.length;
  const total = histLen + fcLen;
  const h = 228;
  const pad = { l: 44, r: 18, t: 18, b: 36 };
  const plotW = 900 - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const minY = 72;
  const maxY = 98;

  const xAt = (i) => pad.l + (i / (total - 1)) * plotW;
  const yAt = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;

  const histPath = seriesPath(hist, (i) => xAt(i), yAt);
  const fcMidPath = seriesPath(fc.mid, (i) => xAt(histLen + i), yAt);
  const fcBand = bandPath(fc.low, fc.high, (i) => xAt(histLen + i), yAt);
  const yTicks = [75, 82, 88, 94];
  const todayX = xAt(histLen - 1);

  const monthLabels = [
    { x: xAt(0), label: "Feb" },
    { x: xAt(Math.floor(histLen * 0.33)), label: "Mar" },
    { x: xAt(Math.floor(histLen * 0.66)), label: "Apr" },
    { x: todayX, label: "Today" },
    { x: xAt(histLen + Math.floor(fcLen * 0.5)), label: "Jun fcst" },
  ];

  return (
    <div className="card fleet-hero-chart">
      <div className="fleet-hero-chart-head">
        <div>
          <div className="fleet-hero-chart-title">Fleet health timeline</div>
          <div className="fleet-hero-chart-sub">90 days · forecast +30 days</div>
        </div>
        <div className="fleet-hero-legend">
          <span><i className="lg lg-line" /> Actual</span>
          <span><i className="lg lg-band" /> Forecast band</span>
          <span><i className="lg lg-service" /> Service</span>
          <span><i className="lg lg-alarm" /> Alarm</span>
          <span><i className="lg lg-added" /> Machines added</span>
        </div>
      </div>
      <svg viewBox={`0 0 900 ${h}`} width="100%" height={h} role="img" aria-label="Fleet health over 90 days with 30 day forecast">
        <g className="chart-grid">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={900 - pad.r} y1={yAt(v)} y2={yAt(v)} />
              <text x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">{v}</text>
            </g>
          ))}
        </g>
        <line x1={todayX} x2={todayX} y1={pad.t} y2={h - pad.b} className="fleet-today-line" />
        <text x={todayX + 4} y={pad.t + 10} className="fleet-today-label">Today</text>
        <path d={fcBand} className="fleet-fc-band" />
        <path d={histPath} className="fleet-hist-line" />
        <path d={fcMidPath} className="fleet-fc-line" />
        {data.markers.map((m, i) => {
          const x = xAt(m.day);
          const yLine = yAt(hist[Math.min(m.day, histLen - 1)]);
          const color = FLEET_MARKER_COLORS[m.type] || "var(--ink-3)";
          const axisY = h - pad.b + 2;
          const label = m.type === "service" ? "Svc" : m.type === "alarm" ? "Alrm" : "Add";
          return (
            <g key={i} className="fleet-marker-g">
              <line x1={x} x2={x} y1={pad.t} y2={axisY - 10} stroke={color} strokeOpacity={0.2} strokeWidth={1} />
              <line x1={x} x2={x} y1={yLine} y2={axisY - 10} stroke={color} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="2 2" />
              <circle cx={x} cy={yLine} r={4} fill={color} stroke="var(--surface-2)" strokeWidth={1.5} />
              <polygon
                points={`${x},${axisY - 6} ${x - 5},${axisY + 2} ${x + 5},${axisY + 2}`}
                fill={color}
                stroke="var(--surface-2)"
                strokeWidth={1}
                className={"fleet-axis-marker fleet-axis-marker-" + m.type}
              />
              <text x={x} y={h - 4} textAnchor="middle" className="fleet-marker-label">{label}</text>
              <title>{m.label}</title>
            </g>
          );
        })}
        {monthLabels.map((m, i) => (
          <text key={i} x={m.x} y={h - 10} textAnchor="middle" className="axis-label">{m.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Predicted interventions (90d horizon) ─────────────────────────────────

function PredictedInterventions90() {
  const weeks = window.FLEET_CHARTS.interventions90d;
  const labels = ["May w1", "w2", "w3", "w4", "Jun w1", "w2", "w3", "w4", "Jul w1", "w2", "w3", "w4", "Aug w1"];
  const max = Math.max(...weeks.map((w) => w.planned + w.predictive + w.emergency), 1);

  return (
    <div className="card fleet-interventions-chart">
      <div className="fleet-hero-chart-head" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="fleet-hero-chart-title">Predicted interventions · next 90 days</div>
          <div className="fleet-hero-chart-sub">Planned service vs model-predicted vs emergency</div>
        </div>
        <div className="fleet-hero-legend">
          <span><i className="lg lg-planned" /> Planned</span>
          <span><i className="lg lg-predict" /> Predictive</span>
          <span><i className="lg lg-emerg" /> Emergency</span>
        </div>
      </div>
      <div className="fleet-interventions-body">
        <div className="chart-scroll-wrap">
          <div className="fleet-interventions-grid">
          {weeks.map((w, i) => {
            const total = w.planned + w.predictive + w.emergency;
            const scale = total / max;
            return (
              <div key={i} className="fleet-intervention-col" title={`Week ${w.week}: ${total} intervention${total !== 1 ? "s" : ""}`}>
                <div className="fleet-intervention-stack" style={{ height: Math.max(4, scale * 72) + "px" }}>
                  {w.emergency > 0 && <i className="seg emerg" style={{ flex: w.emergency }} />}
                  {w.predictive > 0 && <i className="seg predict" style={{ flex: w.predictive }} />}
                  {w.planned > 0 && <i className="seg planned" style={{ flex: w.planned }} />}
                </div>
                <div className="fleet-intervention-label">{labels[i] || "w" + w.week}</div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Side panel aggregates (empty state) ─────────────────────────────────────

function FleetPanelAggregates() {
  const dist = window.FLEET_CHARTS.healthDistribution;
  const pareto = window.FLEET_CHARTS.issuePareto;
  const total = dist.ok + dist.warn + dist.crit + dist.offline;
  const segments = [
    { key: "ok", label: "Healthy", count: dist.ok, color: "var(--ok)" },
    { key: "warn", label: "Watch", count: dist.warn, color: "var(--warn)" },
    { key: "crit", label: "Critical", count: dist.crit, color: "var(--crit)" },
    { key: "unknown", label: "Offline", count: dist.offline, color: "var(--unknown)" },
  ];
  const maxPareto = Math.max(...pareto.map((p) => p.count));

  return (
    <div className="card fleet-map-panel fleet-panel-charts">
      <div className="fleet-panel-chart-block">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Fleet health distribution</div>
        <div className="fleet-dist-bar" aria-hidden="true">
          {segments.map((s) => (
            <div key={s.key} className="fleet-dist-seg" style={{ flex: s.count, background: s.color }} title={s.label + ": " + s.count} />
          ))}
        </div>
        <div className="fleet-dist-legend">
          {segments.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
              <span className="mono tnum">{s.count}</span>
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>{total} machines across 6 sites</div>
      </div>

      <div className="fleet-panel-chart-block" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Issue category · pareto</div>
        {pareto.map((p) => (
          <div key={p.label} className="fleet-pareto-row">
            <div className="fleet-pareto-label">{p.label}</div>
            <div className="fleet-pareto-track">
              <i style={{ width: (p.count / maxPareto) * 100 + "%" }} />
            </div>
            <div className="mono tnum fleet-pareto-val">{p.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  KpiHealthSparkline,
  KpiAttentionBar,
  KpiInterventionBars,
  KpiCumulativeLine,
  FleetHealthTimeline,
  PredictedInterventions90,
  FleetPanelAggregates,
  chartSeriesPath: seriesPath,
  chartBandPath: bandPath,
});
