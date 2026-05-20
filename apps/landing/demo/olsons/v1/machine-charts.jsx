// machine-charts.jsx — Machine detail page charts (v1 chart language)

const { useState: useStateMc, useMemo: useMemoMc, useCallback: useCallbackMc } = React;

const MARKER_COLORS = {
  service: "var(--chart-4)",
  recipe: "var(--chart-2)",
  alarm: "var(--warn)",
};

function ForceDisplacementChart({ machine }) {
  const seed = hashSeed(machine.id);
  const anomaly = machine.status !== "ok";
  const data = useMemoMc(
    () => window.getMachineChartData(machine.id),
    [machine.id, machine.status],
  );
  if (!data) return null;

  const { forceCycle: current, forceGhosts, forceAnnotations: ann } = data;
  const w = 720;
  const h = 220;
  const pad = { l: 48, r: 20, t: 16, b: 36 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const minD = 0;
  const maxD = 50;
  const minF = 0;
  const maxF = 630;
  const xAt = (d) => pad.l + ((d - minD) / (maxD - minD)) * plotW;
  const yAt = (f) => pad.t + (1 - (f - minF) / (maxF - minF)) * plotH;
  const cyclePath = (pts) =>
    pts.map((p, i) => (i ? "L" : "M") + xAt(p.disp).toFixed(1) + "," + yAt(p.force).toFixed(1)).join(" ");

  const fTicks = [0, 200, 400, 630];
  const dTicks = [0, 10, 20, 30, 40, 50];

  return (
    <div className="card machine-fd-chart">
      <div className="machine-chart-head">
        <div>
          <div className="machine-chart-title">Force · displacement · current stroke</div>
          <div className="machine-chart-sub">Single-stroke signature · {forceGhosts.length} prior cycles</div>
        </div>
        <div className="machine-chart-legend">
          <span><i className="lg lg-ghost" /> Recent cycles</span>
          <span><i className="lg lg-current" /> Current</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Force displacement cycle with historical ghost traces">
        <g className="chart-grid">
          {fTicks.map((v) => (
            <g key={"f" + v}>
              <line x1={pad.l} x2={w - pad.r} y1={yAt(v)} y2={yAt(v)} />
              <text x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">{v}</text>
            </g>
          ))}
          {dTicks.map((v) => (
            <text key={"d" + v} x={xAt(v)} y={h - 8} textAnchor="middle" className="axis-label">{v}</text>
          ))}
        </g>
        <text x={w / 2} y={h - 2} textAnchor="middle" className="axis-label" style={{ fontSize: 9 }}>Displacement · mm</text>
        <text x={12} y={(pad.t + h - pad.b) / 2} textAnchor="middle" className="axis-label" transform={`rotate(-90 12 ${(pad.t + h - pad.b) / 2})`}>Force · kN</text>

        {forceGhosts.map((ghost, gi) => (
          <path key={gi} d={cyclePath(ghost)} className="fd-ghost" opacity={0.08 + (gi % 5) * 0.015} />
        ))}

        <path d={cyclePath(current)} className={"fd-current" + (anomaly ? " is-warn" : "")} />

        <circle cx={xAt(ann.contact.disp)} cy={yAt(ann.contact.force)} r={3.5} fill="var(--chart-2)" stroke="var(--surface-2)" strokeWidth={1} />
        <text x={xAt(ann.contact.disp) + 6} y={yAt(ann.contact.force) - 6} className="fd-annotation">Contact</text>

        <line x1={xAt(ann.peak.disp)} x2={xAt(ann.peak.disp)} y1={yAt(ann.peak.force)} y2={h - pad.b} stroke="var(--ink-4)" strokeDasharray="2 2" strokeWidth={1} />
        <circle cx={xAt(ann.peak.disp)} cy={yAt(ann.peak.force)} r={4} fill="var(--chart-1)" stroke="var(--surface-2)" strokeWidth={1.5} />
        <text x={xAt(ann.peak.disp) + 8} y={yAt(ann.peak.force) - 8} className="fd-annotation">
          Peak <tspan className="mono tnum">{ann.peak.force}</tspan> kN
        </text>
        <text x={xAt(ann.peak.disp)} y={h - pad.b + 14} textAnchor="middle" className="fd-annotation">BDC · {ann.peak.disp.toFixed(1)} mm</text>
      </svg>
    </div>
  );
}

function MachineSignalGrid({ machine }) {
  const data = useMemoMc(() => window.getMachineChartData(machine.id), [machine.id]);
  const [hoverIdx, setHoverIdx] = useStateMc(null);
  if (!data) return null;
  const channels = data.signalGrid;

  const onMove = useCallbackMc((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (channels[0].values.length - 1));
    setHoverIdx(idx);
  }, [channels]);

  return (
    <div className="card machine-signal-grid" onMouseLeave={() => setHoverIdx(null)}>
      <div className="machine-chart-head" style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="machine-chart-title">Signal grid · 7d</div>
          <div className="machine-chart-sub">Synchronized crosshair · {channels.length} channels</div>
        </div>
      </div>
      <div className="machine-signal-grid-body" onMouseMove={onMove}>
        {channels.map((ch) => (
          <div key={ch.id} className="machine-signal-cell">
            <div className="machine-signal-cell-head">
              <span>{ch.label}</span>
              <span className="mono tnum">{ch.value} <span className="t-3">{ch.unit}</span></span>
            </div>
            <MiniSignalChart values={ch.values} status={ch.status} hoverIdx={hoverIdx} w={320} h={36} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSignalChart({ values, status, hoverIdx, w = 320, h = 36 }) {
  const pad = { l: 0, r: 0, t: 2, b: 2 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const xAt = (i) => pad.l + (i / (values.length - 1)) * (w - pad.l - pad.r);
  const yAt = (v) => pad.t + (1 - (v - min) / Math.max(0.001, max - min)) * (h - pad.t - pad.b);
  const path = values.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  const color = status === "warn" ? "var(--warn)" : status === "crit" ? "var(--crit)" : "var(--chart-1)";
  const scrubX = hoverIdx != null ? xAt(hoverIdx) : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={1} strokeLinecap="square" />
      {scrubX != null && (
        <line x1={scrubX} x2={scrubX} y1={0} y2={h} stroke="var(--ink-4)" strokeWidth={1} strokeOpacity={0.6} />
      )}
    </svg>
  );
}

function MachineHealthTimeline({ machine }) {
  const data = useMemoMc(() => window.getMachineChartData(machine.id), [machine.id]);
  if (!data) return null;
  const hist = data.healthHistory;
  const fc = data.healthForecast;
  const histLen = hist.length;
  const fcLen = fc.mid.length;
  const total = histLen + fcLen;
  const h = 140;
  const w = 900;
  const pad = { l: 40, r: 16, t: 14, b: 30 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const minY = Math.min(...hist, ...fc.low) - 3;
  const maxY = Math.max(...hist, ...fc.high) + 3;
  const xAt = (i) => pad.l + (i / (total - 1)) * plotW;
  const yAt = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
  const todayX = xAt(histLen - 1);

  return (
    <div className="card machine-timeline-chart">
      <div className="machine-chart-head" style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="machine-chart-title">Machine health · 90d</div>
          <div className="machine-chart-sub">Forecast +30d · service, recipe, alert events</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
        <g className="chart-grid">
          {[minY + 5, minY + (maxY - minY) * 0.5, maxY - 3].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={w - pad.r} y1={yAt(v)} y2={yAt(v)} />
              <text x={pad.l - 4} y={yAt(v) + 3} textAnchor="end">{Math.round(v)}</text>
            </g>
          ))}
        </g>
        <line x1={todayX} x2={todayX} y1={pad.t} y2={h - pad.b} className="fleet-today-line" />
        <path d={window.chartBandPath(fc.low, fc.high, (i) => xAt(histLen + i), yAt)} className="fleet-fc-band" />
        <path d={window.chartSeriesPath(hist, (i) => xAt(i), yAt)} className="fleet-hist-line" />
        <path d={window.chartSeriesPath(fc.mid, (i) => xAt(histLen + i), yAt)} className="fleet-fc-line" />
        {data.markers.map((m, i) => {
          const x = xAt(m.day);
          const color = MARKER_COLORS[m.type] || "var(--ink-3)";
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={pad.t} y2={h - pad.b} stroke={color} strokeOpacity={0.25} strokeWidth={1} />
              <circle cx={x} cy={yAt(hist[Math.min(m.day, histLen - 1)])} r={3} fill={color} stroke="var(--surface-2)" strokeWidth={1} />
              <title>{m.label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AnomalyBandChart({ machine }) {
  const data = useMemoMc(() => window.getMachineChartData(machine.id), [machine.id]);
  if (!data) return null;
  const { values, baseline, band, alarm } = data.anomalySeries;
  const h = 132;
  const w = 900;
  const pad = { l: 44, r: 16, t: 14, b: 28 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const minY = 0;
  const maxY = 5.5;
  const n = values.length;
  const xAt = (i) => pad.l + (i / (n - 1)) * plotW;
  const yAt = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
  const valPath = window.chartSeriesPath(values, xAt, yAt);
  const basePath = window.chartSeriesPath(baseline, xAt, yAt);
  const bandPathStr = window.chartBandPath(band.map((b) => b.low), band.map((b) => b.high), xAt, yAt);

  return (
    <div className="card machine-anomaly-chart">
      <div className="machine-chart-head" style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="machine-chart-title">Vibration RMS · drive end</div>
          <div className="machine-chart-sub">Value vs rolling baseline · acceptable band shaded</div>
        </div>
        <div className="machine-chart-legend">
          <span><i className="lg lg-line" /> Actual</span>
          <span><i className="lg lg-dash" /> Baseline</span>
          <span><i className="lg lg-band" /> Band</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
        <g className="chart-grid">
          {[0, 2, 4, alarm].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={w - pad.r} y1={yAt(v)} y2={yAt(v)} stroke={v === alarm ? "var(--warn)" : undefined} strokeDasharray={v === alarm ? "3 3" : undefined} />
              <text x={pad.l - 4} y={yAt(v) + 3} textAnchor="end">{v}{v === alarm ? " alarm" : ""}</text>
            </g>
          ))}
        </g>
        <path d={bandPathStr} className="chart-band" fill="color-mix(in srgb, var(--warn) 10%, transparent)" />
        <path d={basePath} className="chart-baseline" fill="none" stroke="var(--chart-5)" strokeWidth={1} strokeDasharray="4 3" />
        <path d={valPath} className="fleet-hist-line" stroke={machine.status !== "ok" ? "var(--warn)" : "var(--chart-1)"} />
        <circle cx={xAt(n - 1)} cy={yAt(values[n - 1])} r={3.5} fill={machine.status !== "ok" ? "var(--warn)" : "var(--chart-1)"} />
      </svg>
    </div>
  );
}

Object.assign(window, {
  ForceDisplacementChart,
  MachineSignalGrid,
  MachineHealthTimeline,
  AnomalyBandChart,
});
