// fleet-charts.jsx — aggregate fleet-level charts for the overview screen.
// Hero timeline, ROI curve, forward-looking interventions, distribution, pareto.

const { useState: _useFleetChartState } = React;

function _fcFmt(v, digits = 0) {
  if (v == null || isNaN(v)) return "—";
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  return digits === 0 ? Math.round(v).toString() : v.toFixed(digits);
}
function _fcNiceCeil(v) {
  if (v <= 10) return Math.ceil(v);
  if (v <= 100) return Math.ceil(v / 10) * 10;
  return Math.ceil(v / 50) * 50;
}

function ChartCard({ title, sub, badge, right, footer, children, className = "" }) {
  return (
    <div className={"chart-card " + className}>
      <div className="chart-head">
        <div className="chart-head-l">
          <div className="chart-title">{title}</div>
          {sub && <div className="chart-sub">{sub}</div>}
        </div>
        <div className="chart-head-r">
          {badge && <span className="ai-badge">{badge}</span>}
          {right}
        </div>
      </div>
      <div className="chart-canvas">{children}</div>
      {footer && <div className="chart-footer">{footer}</div>}
    </div>
  );
}

// ─── Fleet health horizon — signature hero chart ───────────────────────────
// 90-day history + 30-day forecast band, with horizon ribbons below the line.
function FleetHealthHorizon({ data, height = 260 }) {
  const [hover, setHover] = _useFleetChartState(null);
  if (!data) return null;

  const w = 720, h = height;
  const pad = { l: 44, r: 18, t: 18, b: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const { history, forecast, events, target = 90 } = data;
  const histN = history.length;
  const fcN = forecast.length;
  const total = histN + fcN - 1; // forecast[0] overlaps history last

  const allVals = [...history, ...forecast.slice(1).map(p => p.v), ...forecast.map(p => p.lo), ...forecast.map(p => p.hi)];
  const yMin = Math.floor(Math.min(...allVals, target - 12) / 5) * 5;
  const yMax = _fcNiceCeil(Math.max(...allVals, target + 4));

  const xAt = (i) => pad.l + (i / total) * innerW;
  const yAt = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const todayI = histN - 1;

  const histPath = history.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  const fcPath = forecast.map((p, i) => {
    const idx = todayI + i;
    return (i ? "L" : "M") + xAt(idx).toFixed(1) + "," + yAt(p.v).toFixed(1);
  }).join(" ");
  const fcBand = forecast.map((p, i) => {
    const idx = todayI + i;
    return (i ? "L" : "M") + xAt(idx).toFixed(1) + "," + yAt(p.hi).toFixed(1);
  }).join(" ")
    + " " + [...forecast].reverse().map((p, i) => {
      const idx = todayI + (forecast.length - 1 - i);
      return "L" + xAt(idx).toFixed(1) + "," + yAt(p.lo).toFixed(1);
    }).join(" ") + " Z";

  // Horizon ribbons — deviation from target, mirrored above/below baseline
  const ribbonH = innerH * 0.22;
  const ribbonY = pad.t + innerH - ribbonH - 4;
  const maxDev = 14;
  const ribbons = history.map((v, i) => {
    const dev = v - target;
    const t = Math.min(1, Math.abs(dev) / maxDev);
    const bandH = t * (ribbonH / 2);
    const x = xAt(i);
    const bw = innerW / total * 0.85;
    const color = dev >= 0 ? "var(--ok)" : dev > -6 ? "var(--warn)" : "var(--crit)";
    return { x: x - bw / 2, w: bw, h: bandH, color, up: dev >= 0 };
  });

  const yTicks = 5;
  const yTickVals = [];
  for (let k = 0; k <= yTicks; k++) yTickVals.push(yMin + ((yMax - yMin) * k) / yTicks);

  const xLabels = [
    { i: 0, label: "−90d" },
    { i: Math.floor(todayI * 0.5), label: "−45d" },
    { i: todayI, label: "today", strong: true },
    { i: todayI + Math.floor(fcN / 2), label: "+15d", projection: true },
    { i: todayI + fcN - 1, label: "+30d", projection: true },
  ];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (w / r.width);
    const t = (px - pad.l) / innerW;
    const i = Math.round(Math.max(0, Math.min(1, t)) * total);
    setHover(i);
  };

  const hoverVal = hover != null
    ? (hover <= todayI ? history[hover] : forecast[hover - todayI]?.v)
    : history[todayI];

  return (
    <div className="fleet-horizon-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg fleet-horizon-svg" preserveAspectRatio="none"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>

        {yTickVals.map((v, i) => (
          <line key={i} className={i === 0 ? "axis" : "grid"}
                x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)}/>
        ))}

        {/* Target reference */}
        <line x1={pad.l} x2={pad.l + innerW} y1={yAt(target)} y2={yAt(target)}
              stroke="var(--ok)" strokeDasharray="3 4" strokeWidth="1" opacity="0.45"/>
        <text x={pad.l + innerW + 2} y={yAt(target) + 3} className="axis-text" style={{fontSize: 9, fill: "var(--ok)"}}>
          target {target}
        </text>

        {/* Horizon ribbons */}
        <g opacity="0.55">
          {ribbons.map((rb, i) => (
            <rect key={i}
                  x={rb.x} width={rb.w}
                  y={rb.up ? ribbonY + ribbonH / 2 - rb.h : ribbonY + ribbonH / 2}
                  height={Math.max(0.5, rb.h)}
                  fill={rb.color} opacity="0.35"/>
          ))}
        </g>
        <line x1={pad.l} x2={pad.l + innerW * (todayI / total)}
              y1={ribbonY + ribbonH / 2} y2={ribbonY + ribbonH / 2}
              stroke="var(--ink-4)" strokeWidth="0.5"/>

        {/* Forecast band */}
        <path d={fcBand} className="projection-band"/>

        {/* History trace */}
        <path d={histPath} className="trace" strokeWidth="1.8"/>

        {/* Forecast trace */}
        <path d={fcPath} className="projection"/>

        {/* Today divider */}
        <line className="event-line" x1={xAt(todayI)} x2={xAt(todayI)} y1={pad.t} y2={pad.t + innerH}/>
        <text x={xAt(todayI) + 4} y={pad.t + 11} className="event-text">today</text>

        {/* Event annotations */}
        {events.map((ev, i) => (
          <g key={i}>
            <line className="event-line" x1={xAt(ev.day)} x2={xAt(ev.day)} y1={pad.t} y2={pad.t + innerH}/>
            <text x={xAt(ev.day) + 3} y={pad.t + 24 + i * 11} className="event-text">{ev.label}</text>
          </g>
        ))}

        {hover != null && (
          <>
            <line className="hover-cursor" x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH}/>
            <circle cx={xAt(hover)} cy={yAt(hoverVal || target)} r="3"
                    fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1.4"/>
          </>
        )}

        {xLabels.map((l, i) => (
          <text key={i} className="axis-text" x={xAt(l.i)} y={pad.t + innerH + 14} textAnchor="middle"
                style={l.strong ? {fontWeight: 500, fill: "var(--ink-1)"}
                  : l.projection ? {fill: "var(--forecast)"} : null}>
            {l.label}
          </text>
        ))}

        {yTickVals.map((v, i) => (
          <text key={i} className="axis-text" x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">{v}</text>
        ))}
        <text className="axis-label" x={pad.l - 32} y={pad.t + innerH / 2} textAnchor="middle"
              transform={`rotate(-90 ${pad.l - 32} ${pad.t + innerH / 2})`}>
          health
        </text>
      </svg>
      <div className="fleet-horizon-readout">
        <span className="mono tnum data-hero" style={{fontSize: 28}}>{_fcFmt(hoverVal ?? history[todayI])}</span>
        <span className="t-3" style={{fontSize: 12}}>/ 100 fleet health</span>
        {hover != null && hover > todayI && (
          <span className="ai-badge" style={{marginLeft: 12}}>forecast</span>
        )}
      </div>
    </div>
  );
}

// ─── Avoided downtime — cumulative ROI step curve ──────────────────────────
function AvoidedDowntimeCurve({ data, height = 200 }) {
  const [hover, setHover] = _useFleetChartState(null);
  if (!data?.steps?.length) return null;

  const w = 340, h = height;
  const pad = { l: 44, r: 14, t: 16, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const { steps, unit = "h", savingsSEK } = data;
  const maxV = _fcNiceCeil(Math.max(...steps.map(s => s.cumulative)) * 1.08);

  const xAt = (i) => pad.l + (i / (steps.length - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - v / maxV) * innerH;

  let stepPath = "M" + xAt(0).toFixed(1) + "," + yAt(0).toFixed(1);
  steps.forEach((s, i) => {
    if (i === 0) return;
    stepPath += " L" + xAt(i).toFixed(1) + "," + yAt(steps[i - 1].cumulative).toFixed(1);
    stepPath += " L" + xAt(i).toFixed(1) + "," + yAt(s.cumulative).toFixed(1);
  });

  const area = stepPath
    + " L" + xAt(steps.length - 1).toFixed(1) + "," + (pad.t + innerH).toFixed(1)
    + " L" + xAt(0).toFixed(1) + "," + (pad.t + innerH).toFixed(1) + " Z";

  const yTicks = 4;
  const yTickVals = [];
  for (let k = 0; k <= yTicks; k++) yTickVals.push((maxV * k) / yTicks);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (w / r.width);
    const t = (px - pad.l) / innerW;
    const i = Math.round(Math.max(0, Math.min(1, t)) * (steps.length - 1));
    setHover(i);
  };

  const hi = hover ?? steps.length - 1;
  const cur = steps[hi];

  return (
    <div className="avoided-downtime-wrap">
      <div className="avoided-downtime-kpi">
        <div className="mono tnum data-hero t-good" style={{fontSize: 32, lineHeight: 1}}>
          {_fcFmt(cur.cumulative)}<span style={{fontSize: 16, fontWeight: 400}}> {unit}</span>
        </div>
        {savingsSEK != null && (
          <div style={{fontSize: 12, color: "var(--ink-3)", marginTop: 6}}>
            ≈ <span className="mono">{_fcFmt(savingsSEK / 1000)}k</span> SEK avoided
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg avoided-svg" preserveAspectRatio="none"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
        {yTickVals.map((v, i) => (
          <line key={i} className={i === 0 ? "axis" : "grid"}
                x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)}/>
        ))}
        <path d={area} fill="var(--ok)" opacity="0.08"/>
        <path d={stepPath} fill="none" stroke="var(--ok)" strokeWidth="1.6"
              strokeLinejoin="miter" strokeLinecap="square"/>
        {steps.map((s, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(s.cumulative)} r={hover === i ? 3.5 : 2.2}
                  fill={hover === i ? "var(--ok)" : "var(--surface-2)"}
                  stroke="var(--ok)" strokeWidth="1.2"/>
        ))}
        {hover != null && (
          <line className="hover-cursor" x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH}/>
        )}
        {yTickVals.map((v, i) => (
          <text key={i} className="axis-text" x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">{_fcFmt(v)}</text>
        ))}
        <text className="axis-label" x={pad.l + innerW / 2} y={h - 4} textAnchor="middle">since pilot</text>
      </svg>
      {hover != null && cur.label && (
        <div className="avoided-step-label">{cur.label} · +{_fcFmt(cur.delta || 0, 1)} {unit}</div>
      )}
    </div>
  );
}

// ─── Predicted interventions — forward-looking stacked area ────────────────
function PredictedInterventionsChart({ data, height = 180 }) {
  if (!data?.weeks?.length) return null;

  const w = 720, h = height;
  const pad = { l: 44, r: 14, t: 12, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const { weeks, series } = data;
  const N = weeks.length;
  const keys = ["critical", "watch", "planned"];
  const colors = { critical: "var(--crit)", watch: "var(--warn)", planned: "var(--forecast)" };
  const labels = { critical: "Critical path", watch: "Watch", planned: "Planned service" };

  const maxTotal = Math.max(...weeks.map((_, i) => keys.reduce((s, k) => s + (series[k][i] || 0), 0)), 1);
  const yMax = _fcNiceCeil(maxTotal * 1.15);

  const xAt = (i) => pad.l + (i / (N - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - v / yMax) * innerH;

  // Stacked areas bottom-up
  const areas = keys.map((key) => {
    const pts = weeks.map((_, i) => {
      let base = 0;
      keys.slice(0, keys.indexOf(key)).forEach(k => { base += series[k][i] || 0; });
      const top = base + (series[key][i] || 0);
      return { base, top };
    });
    const topPath = pts.map((p, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(p.top).toFixed(1)).join(" ");
    const botPath = [...pts].reverse().map((p, i) => {
      const idx = N - 1 - i;
      return "L" + xAt(idx).toFixed(1) + "," + yAt(pts[idx].base).toFixed(1);
    }).join(" ");
    return { key, d: topPath + " " + botPath + " Z" };
  });

  const yTicks = 4;
  const yTickVals = [];
  for (let k = 0; k <= yTicks; k++) yTickVals.push((yMax * k) / yTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg interventions-svg" preserveAspectRatio="none">
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
      {yTickVals.map((v, i) => (
        <line key={i} className={i === 0 ? "axis" : "grid"}
              x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)}/>
      ))}
      {areas.map((a) => (
        <path key={a.key} d={a.d} fill={colors[a.key]} fillOpacity="0.28"
              stroke={colors[a.key]} strokeWidth="0.6" strokeOpacity="0.5"/>
      ))}
      {/* Today line at week 0 */}
      <line className="event-line" x1={xAt(0)} x2={xAt(0)} y1={pad.t} y2={pad.t + innerH}/>
      <text x={xAt(0) + 4} y={pad.t + 10} className="event-text">today</text>
      {weeks.filter((_, i) => i % 3 === 0 || i === N - 1).map((wkl, i) => {
        const idx = weeks.indexOf(wkl);
        return (
          <text key={i} className="axis-text" x={xAt(idx)} y={pad.t + innerH + 14} textAnchor="middle"
                style={idx === 0 ? {fontWeight: 500} : null}>
            {wkl}
          </text>
        );
      })}
      {yTickVals.map((v, i) => (
        <text key={i} className="axis-text" x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">{_fcFmt(v)}</text>
      ))}
      <text className="axis-label" x={pad.l - 32} y={pad.t + innerH / 2} textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 32} ${pad.t + innerH / 2})`}>
        interventions
      </text>
    </svg>
  );
}

function InterventionsLegend() {
  const items = [
    { key: "critical", label: "Critical path", color: "var(--crit)" },
    { key: "watch", label: "Watch", color: "var(--warn)" },
    { key: "planned", label: "Planned service", color: "var(--forecast)" },
  ];
  return (
    <div className="interventions-legend">
      {items.map(it => (
        <span key={it.key} className="item">
          <span className="swatch" style={{background: it.color}}/>{it.label}
        </span>
      ))}
    </div>
  );
}

// ─── Health distribution — current vs 30 days ago ghost ────────────────────
function HealthDistributionChart({ data, height = 200 }) {
  if (!data?.buckets?.length) return null;

  const w = 340, h = height;
  const pad = { l: 88, r: 24, t: 16, b: 24 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const { buckets, ghost } = data;
  const maxV = Math.max(...buckets.map(b => b.count), ...ghost.map(b => b.count), 1);
  const barH = innerH / buckets.length - 6;

  const xAt = (v) => pad.l + (v / maxV) * innerW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg health-dist-svg" preserveAspectRatio="none">
      {buckets.map((b, i) => {
        const y = pad.t + i * (barH + 6);
        const ghostB = ghost[i];
        const colors = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)", unknown: "var(--ink-4)" };
        return (
          <g key={b.key}>
            <text className="axis-text" x={pad.l - 8} y={y + barH / 2 + 4} textAnchor="end">{b.label}</text>
            {/* Ghost (30d ago) */}
            <rect x={pad.l} y={y + 2} width={xAt(ghostB.count) - pad.l} height={barH - 4}
                  fill="var(--ink-5)" opacity="0.35" rx="0"/>
            {/* Current */}
            <rect x={pad.l} y={y} width={xAt(b.count) - pad.l} height={barH}
                  fill={colors[b.key] || "var(--ink-3)"} opacity="0.75"/>
            <text className="mono axis-text" x={xAt(b.count) + 6} y={y + barH / 2 + 4}
                  style={{fontSize: 11, fill: "var(--ink-1)", fontWeight: 500}}>
              {b.count}
            </text>
          </g>
        );
      })}
      <text className="axis-text" x={pad.l} y={h - 4} style={{fontSize: 9.5}}>
        <tspan fill="var(--ink-4)">▬</tspan> 30 days ago
      </text>
    </svg>
  );
}

// ─── Site sparkline strip ───────────────────────────────────────────────────
function SiteSparklineStrip({ sites }) {
  if (!sites?.length) return null;
  return (
    <div className="site-spark-strip">
      {sites.map(s => (
        <div key={s.id} className="site-spark-cell">
          <div className="site-spark-head">
            <span className="site-spark-name">{s.name}</span>
            <span className="mono tnum" style={{fontSize: 12, color: "var(--ink-2)"}}>{s.health}</span>
          </div>
          <window.Sparkline shape={s.trendKey} color={
            s.status === "warn" ? "var(--warn)" : s.status === "crit" ? "var(--crit)" : "var(--ink-3)"
          } w={120} h={24} fill={true}/>
          <div className="site-spark-foot">
            <span className="t-3" style={{fontSize: 10.5}}>{s.pressCount} presses</span>
            {s.attention > 0 && (
              <span className="t-warn" style={{fontSize: 10.5}}>{s.attention} attention</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Compact KPI cluster for hero sidebar ──────────────────────────────────
function FleetHeroKpis({ items }) {
  return (
    <div className="fleet-hero-kpis">
      {items.map((item, i) => (
        <div key={i} className="fleet-hero-kpi">
          <div className="fleet-hero-kpi-label">{item.label}</div>
          <div className={"fleet-hero-kpi-value mono tnum " + (item.tone || "")}>
            {item.value}{item.unit && <span className="unit">{item.unit}</span>}
          </div>
          {item.sub && <div className="fleet-hero-kpi-sub">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  ChartCard,
  FleetHealthHorizon,
  AvoidedDowntimeCurve,
  PredictedInterventionsChart,
  InterventionsLegend,
  HealthDistributionChart,
  SiteSparklineStrip,
  FleetHeroKpis,
});
