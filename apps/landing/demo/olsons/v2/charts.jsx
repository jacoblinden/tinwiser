// charts.jsx — additional chart primitives for the press detail page.
//
// Each chart aims for the "instrument software" aesthetic:
//   • precise gridlines, calibrated axes, monospace numerics
//   • restrained palette — ink on warm paper, status colors as indicators
//   • the chart is the artifact; chrome stays out of the way
//
// Included:
//   • MultiSignalOverlay     normalized overlay of 3–4 signals
//   • SmallMultiples         synced-hover grid of mini-charts
//   • Spectrogram            time × frequency heatmap (instrument-grade)
//   • FFTPlot                power spectrum with bearing-fault markers
//   • HeatmapCalendar        90-day grid colored by daily metric
//   • ParetoChart            sorted bars with cumulative ogive
//   • FleetStrip             dot-plot ranking sibling presses
//   • HydraulicState         schematic with live readings on the circuit
//   • AnomalyTimeSeries      time-series w/ baseline ribbon + anomaly bands

const { useState: _useChartState, useMemo: _useChartMemo, useRef: _useChartRef, useEffect: _useChartEffect } = React;

// ─── Shared helpers ────────────────────────────────────────────────────────
function _niceCeil(v) {
  if (v <= 0.1) return Math.ceil(v * 100) / 100;
  if (v <= 1)   return Math.ceil(v * 10) / 10;
  if (v <= 10)  return Math.ceil(v);
  if (v <= 50)  return Math.ceil(v / 5) * 5;
  if (v <= 100) return Math.ceil(v / 10) * 10;
  if (v <= 500) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}
function _fmt(v, digits = 1) {
  if (v == null || isNaN(v)) return "—";
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  if (Math.abs(v) >= 100)  return Math.round(v).toString();
  if (digits === 0)        return Math.round(v).toString();
  return v.toFixed(digits);
}
// Sequential color ramp on warm paper. We bias the curve so mid-values pop
// more than a linear ramp would — this is what makes scientific spectrograms
// feel legible.
function _ramp(t, status = "ink") {
  // Gamma-bias so mid-band values stand out
  const u = Math.pow(Math.max(0, Math.min(1, t)), 0.65);
  if (status === "warn") {
    // warm paper → toast → copper
    const r = Math.round(245 - u * 85);
    const g = Math.round(241 - u * 134);
    const b = Math.round(229 - u * 214);
    return `rgb(${r},${g},${b})`;
  }
  if (status === "crit") {
    const r = Math.round(245 - u * 67);
    const g = Math.round(240 - u * 190);
    const b = Math.round(230 - u * 180);
    return `rgb(${r},${g},${b})`;
  }
  // ink ramp: warm paper → warm grey → charcoal
  const r = Math.round(244 - u * 224);
  const g = Math.round(241 - u * 222);
  const b = Math.round(232 - u * 215);
  return `rgb(${r},${g},${b})`;
}

// ─── MultiSignalOverlay ───────────────────────────────────────────────────
// Normalized overlay of multiple signals (0..1) on a single canvas.
// Each line carries its own color/dash and renders a stacked legend below.
function MultiSignalOverlay({ signals, height = 220, days = 14, title }) {
  const [hover, setHover] = _useChartState(null);
  if (!signals || !signals.length) return null;

  const w = 720, h = height;
  const pad = { l: 12, r: 12, t: 14, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const N = signals[0].data.length;

  // Normalize each signal to its own min/max so they overlay legibly.
  const normalized = signals.map((s) => {
    const minV = Math.min(...s.data);
    const maxV = Math.max(...s.data, (s.threshold || -Infinity));
    const span = Math.max(1e-6, maxV - minV);
    return s.data.map((v) => (v - minV) / span);
  });

  const xAt = (i) => pad.l + (i / (N - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - v) * innerH;

  const palette = ["var(--ink)", "var(--warn)", "var(--forecast)", "var(--olsons)"];
  const dashes  = [null,         "5 3",         "3 3",             "2 2"];

  // Day ticks every 7 days, label as -Nd
  const xLabels = [];
  for (let d = N - 1; d >= 0; d -= 7) {
    xLabels.push({ i: d, label: d === N - 1 ? "today" : "−" + (N - 1 - d) + "d" });
  }

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (w / r.width);
    const t  = (px - pad.l) / innerW;
    const i  = Math.round(Math.max(0, Math.min(1, t)) * (N - 1));
    setHover(i);
  };

  return (
    <div className="multi-overlay">
      <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" preserveAspectRatio="none"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
        {/* Horizontal guide lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} className={i === 0 || i === 4 ? "grid-major" : "grid-minor"}
                x1={pad.l} x2={pad.l + innerW} y1={yAt(g)} y2={yAt(g)} />
        ))}
        {/* Day grid */}
        {xLabels.map((l, i) => (
          <line key={"vg" + i} className="grid-minor"
                x1={xAt(l.i)} x2={xAt(l.i)} y1={pad.t} y2={pad.t + innerH} />
        ))}
        {/* Each signal */}
        {normalized.map((nd, si) => {
          const d = nd.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
          return (
            <path key={si} d={d} fill="none"
                  stroke={palette[si % palette.length]}
                  strokeDasharray={dashes[si % dashes.length] || null}
                  strokeWidth={si === 0 ? 1.6 : 1.2}
                  strokeLinejoin="miter" strokeLinecap="square"
                  opacity={0.92}/>
          );
        })}
        {/* Hover cursor */}
        {hover != null && (
          <line className="hover-cursor"
                x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH}/>
        )}
        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={"xl" + i} className="axis-text"
                x={xAt(l.i)} y={pad.t + innerH + 14} textAnchor="middle">
            {l.label}
          </text>
        ))}
      </svg>
      <div className="multi-legend">
        {signals.map((s, si) => {
          const v = hover != null ? s.data[hover] : s.data[s.data.length - 1];
          const min = Math.min(...s.data), max = Math.max(...s.data);
          return (
            <div key={si} className="multi-legend-row">
              <span className="legend-swatch"
                    style={{
                      background: palette[si % palette.length],
                      borderTop: dashes[si % dashes.length] ? `1px dashed ${palette[si % palette.length]}` : "none",
                    }}/>
              <span className="legend-name">{s.name}</span>
              <span className="mono legend-value">{_fmt(v, s.digits || 1)}<span className="legend-unit">{s.unit}</span></span>
              <span className="legend-range mono">{_fmt(min, s.digits || 1)} – {_fmt(max, s.digits || 1)}</span>
              {s.status && s.status !== "ok" && <span className={"tag tag-" + s.status} style={{fontSize: 10}}>{s.status === "warn" ? "drift" : s.status}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SmallMultiples — synced-hover grid ────────────────────────────────────
function SmallMultiples({ signals, days = 14, cols = 4, height = 70 }) {
  const [hover, setHover] = _useChartState(null);
  if (!signals || !signals.length) return null;

  const N = signals[0].data.length;

  // Determine col layout
  const colCount = cols;

  return (
    <div className="small-multiples" style={{gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`}}>
      {signals.map((s, idx) => (
        <SmallMultipleCell key={s.key || idx} signal={s} N={N} hover={hover} setHover={setHover} height={height}/>
      ))}
    </div>
  );
}

function SmallMultipleCell({ signal: s, N, hover, setHover, height }) {
  const w = 220, h = height;
  const pad = { l: 6, r: 6, t: 4, b: 4 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const arr = s.data;
  const baseline = s.baseline;
  const threshold = s.threshold;
  const minV = Math.min(...arr, baseline != null ? baseline : Infinity);
  const maxV = Math.max(...arr, threshold != null ? threshold : -Infinity, baseline != null ? baseline : -Infinity);
  const span = Math.max(1e-6, maxV - minV);
  const yPad = span * 0.12;

  const xAt = (i) => pad.l + (i / (N - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - (v - (minV - yPad)) / (span + yPad * 2)) * innerH;

  const d = arr.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  // Area fill
  const area = d + ` L${xAt(N - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${xAt(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (w / r.width);
    const t  = (px - pad.l) / innerW;
    const i  = Math.round(Math.max(0, Math.min(1, t)) * (N - 1));
    setHover(i);
  };

  const idx = hover != null ? hover : N - 1;
  const val = arr[idx];
  const status = s.status || "ok";
  const traceClass = "trace " + (status === "warn" ? "warn" : status === "crit" ? "crit" : "");

  // Display digit count
  const digits = s.digits != null ? s.digits : (Math.abs(s.baseline || 1) >= 100 ? 0 : 1);

  return (
    <div className="sm-cell"
         onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <div className="sm-cell-head">
        <span className="sm-name">{s.name}</span>
        <window.StatusDot status={status}/>
      </div>
      <div className="sm-cell-readout">
        <span className={"sm-value mono " + (status === "warn" ? "t-warn" : status === "crit" ? "t-crit" : "")}>
          {_fmt(val, digits)}<span className="sm-unit">{s.unit}</span>
        </span>
        {baseline != null && (
          <span className="sm-base mono">base {_fmt(baseline, digits)}</span>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="sm-svg" preserveAspectRatio="none">
        <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
        {/* Threshold */}
        {threshold != null && threshold <= maxV * 1.5 && (
          <line className="threshold" x1={pad.l} x2={pad.l + innerW}
                y1={yAt(threshold)} y2={yAt(threshold)}/>
        )}
        {/* Baseline */}
        {baseline != null && (
          <line x1={pad.l} x2={pad.l + innerW} y1={yAt(baseline)} y2={yAt(baseline)}
                stroke="var(--ok)" strokeDasharray="2 3" strokeWidth="1" opacity="0.6"/>
        )}
        {/* Area + trace */}
        <path d={area} fill="var(--ink)" opacity="0.04"/>
        <path d={d} className={traceClass} fill="none"/>
        {/* Hover */}
        {hover != null && (
          <>
            <line className="hover-cursor"
                  x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH}/>
            <circle cx={xAt(hover)} cy={yAt(val)} r="2.4"
                    fill="var(--surface-2)"
                    stroke={status === "warn" ? "var(--warn)" : status === "crit" ? "var(--crit)" : "var(--ink)"}
                    strokeWidth="1.2"/>
          </>
        )}
      </svg>
      <div className="sm-cell-foot">
        <span className="mono">−{N - 1}d</span>
        <span className="mono">today</span>
      </div>
    </div>
  );
}

// ─── Spectrogram ──────────────────────────────────────────────────────────
// Frequency (Y) vs time (X). Heatmap rendered as cells.
function Spectrogram({ matrix, bins, fMax, days, windowsPerDay, height = 180, markers = [] }) {
  if (!matrix) return null;
  const T = matrix.length;
  const F = bins;
  const w = 720, h = height;
  const pad = { l: 50, r: 50, t: 8, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const cellW = innerW / T;
  const cellH = innerH / F;

  // Compute max for normalization
  let maxMag = 0;
  for (let t = 0; t < T; t++) for (let f = 0; f < F; f++) if (matrix[t][f] > maxMag) maxMag = matrix[t][f];

  const xAt = (t) => pad.l + t * cellW;
  const yAt = (f) => pad.t + (F - 1 - f) * cellH;
  const fHz = (f) => (f / (F - 1)) * fMax;

  const yTicks = [0, 100, 200, 300, 400, 500].filter(v => v <= fMax);

  // Day labels
  const dayTicks = [];
  for (let d = 0; d <= days; d++) dayTicks.push(d);

  // Render cells as a single path of <rect>s (could be slow but F~64 × T~168 = 10k)
  const cells = [];
  for (let t = 0; t < T; t++) {
    for (let f = 0; f < F; f++) {
      const m = matrix[t][f] / maxMag;
      const col = _ramp(m, "warn");
      cells.push(
        <rect key={t + "_" + f}
              x={xAt(t)} y={yAt(f)}
              width={cellW + 0.5} height={cellH + 0.5}
              fill={col} stroke="none"/>
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg spec-svg" preserveAspectRatio="none">
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-sunken)"/>
      {cells}
      {/* Marker bands (e.g. BPFO highlights) */}
      {markers.map((m, i) => {
        const f = (m.freq / fMax) * (F - 1);
        const y = pad.t + (F - 1 - f) * cellH;
        return (
          <g key={i}>
            <line className="annotation"
                  x1={pad.l} x2={pad.l + innerW}
                  y1={y} y2={y}
                  stroke={m.critical ? "var(--crit)" : "var(--ink-2)"}
                  strokeDasharray="3 3" strokeWidth="1" opacity="0.7"/>
            <text x={pad.l + innerW + 4} y={y + 3} className="axis-text"
                  fill={m.critical ? "var(--crit)" : "var(--ink-3)"}
                  style={{fontSize: 9.5}}>
              {m.label}
            </text>
          </g>
        );
      })}
      {/* Day vertical lines */}
      {dayTicks.map((d, i) => (
        <line key={"d" + d} className="grid-major"
              x1={pad.l + (d * windowsPerDay) * cellW}
              x2={pad.l + (d * windowsPerDay) * cellW}
              y1={pad.t} y2={pad.t + innerH}
              stroke="var(--ink-4)" strokeOpacity="0.3" strokeWidth="1"/>
      ))}
      {/* X labels */}
      {dayTicks.map((d, i) => (
        <text key={"dl" + d} className="axis-text"
              x={pad.l + (d * windowsPerDay) * cellW}
              y={pad.t + innerH + 14}
              textAnchor="middle">
          {d === days ? "today" : "−" + (days - d) + "d"}
        </text>
      ))}
      {/* Y labels (frequency) */}
      {yTicks.map((v, i) => {
        const f = (v / fMax) * (F - 1);
        const y = pad.t + (F - 1 - f) * cellH;
        return (
          <text key={"yt" + i} className="axis-text"
                x={pad.l - 6} y={y + 3} textAnchor="end">
            {v}
          </text>
        );
      })}
      <text className="axis-label"
            x={pad.l - 36} y={pad.t + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 36} ${pad.t + innerH / 2})`}>
        Hz
      </text>
    </svg>
  );
}

// ─── FFTPlot ─────────────────────────────────────────────────────────────
function FFTPlot({ spectrum, baseline, markers = [], height = 180, fMax = 500 }) {
  if (!spectrum) return null;
  const w = 720, h = height;
  const pad = { l: 48, r: 18, t: 12, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  // Y is magnitude — autoscale from data
  let maxV = 0;
  spectrum.forEach((p) => { if (p.mag > maxV) maxV = p.mag; });
  if (baseline) baseline.forEach((p) => { if (p.mag > maxV) maxV = p.mag; });
  const yMax = _niceCeil(maxV * 1.08);

  const xAt = (f) => pad.l + (f / fMax) * innerW;
  const yAt = (m) => pad.t + (1 - (m / yMax)) * innerH;

  const path = spectrum.map((p, i) => (i ? "L" : "M") + xAt(p.f).toFixed(1) + "," + yAt(p.mag).toFixed(1)).join(" ");
  const basePath = baseline
    ? baseline.map((p, i) => (i ? "L" : "M") + xAt(p.f).toFixed(1) + "," + yAt(p.mag).toFixed(1)).join(" ")
    : null;

  const xMajors = [0, 100, 200, 300, 400, 500].filter(v => v <= fMax);
  const yMajors = 5;
  const yTickVals = [];
  for (let k = 0; k <= yMajors; k++) yTickVals.push((yMax * k) / yMajors);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg fft-svg" preserveAspectRatio="none">
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
      {/* Grid */}
      {yTickVals.map((v, i) => (
        <line key={i} className={i === 0 ? "axis" : "grid-minor"}
              x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)} />
      ))}
      {xMajors.map((v, i) => (
        <line key={i} className="grid-minor"
              x1={xAt(v)} x2={xAt(v)} y1={pad.t} y2={pad.t + innerH}/>
      ))}
      {/* Marker bands */}
      {markers.map((m, i) => (
        <g key={"mk" + i}>
          <line className="fft-marker"
                x1={xAt(m.freq)} x2={xAt(m.freq)}
                y1={pad.t} y2={pad.t + innerH}
                stroke={m.critical ? "var(--crit)" : "var(--ink-4)"}
                strokeDasharray={m.critical ? "4 3" : "2 3"}
                strokeWidth="1" opacity={m.critical ? "0.7" : "0.5"}/>
          <text x={xAt(m.freq)} y={pad.t + 11}
                className="axis-text"
                textAnchor="middle"
                fill={m.critical ? "var(--crit)" : "var(--ink-3)"}
                style={{fontSize: 9.5, fontWeight: m.critical ? 500 : 400}}>
            {m.label}
          </text>
        </g>
      ))}
      {/* Baseline shape behind current */}
      {basePath && (
        <path d={basePath} fill="none"
              stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      )}
      {/* Current spectrum */}
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1.4"
            strokeLinejoin="miter" strokeLinecap="square"/>
      {/* X labels */}
      {xMajors.map((v, i) => (
        <text key={"xl" + i} className="axis-text"
              x={xAt(v)} y={pad.t + innerH + 14} textAnchor="middle">{v}</text>
      ))}
      <text className="axis-label"
            x={pad.l + innerW / 2} y={h - 4}
            textAnchor="middle">Hz</text>
      {/* Y labels */}
      {yTickVals.map((v, i) => (
        <text key={"yl" + i} className="axis-text"
              x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">
          {v >= 1 ? v.toFixed(1) : v.toFixed(2)}
        </text>
      ))}
      <text className="axis-label"
            x={pad.l - 34} y={pad.t + innerH / 2} textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 34} ${pad.t + innerH / 2})`}>
        g rms
      </text>
    </svg>
  );
}

// ─── HeatmapCalendar ─────────────────────────────────────────────────────
// 7 rows (days of week, Mon top) × ~13 columns (weeks). Cell color = metric intensity.
function HeatmapCalendar({ days, metric = "cycles", height = 130, title }) {
  if (!days || !days.length) return null;
  const N = days.length;
  const w = 720, h = height;
  const pad = { l: 28, r: 14, t: 8, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  // Gap between cells
  const gap = 1.5;

  // Pick metric and color status accordingly
  const valueFn = metric === "cycles"   ? (d) => d.cycles
                 : metric === "anomaly" ? (d) => d.anomaly
                 : (d) => d.downtime;
  const colorStatus = metric === "anomaly" ? "warn" : metric === "downtime" ? "crit" : "ink";

  const vals = days.map(valueFn);
  const maxV = Math.max(...vals, 1e-6);

  // Layout: today is the last day (i=N-1) and lives at row=0 (Mon), rightmost col.
  // Each older day is one row down, wrapping to previous column on Sunday.
  // ageFromToday = (N - 1) - i. row = ageFromToday % 7. col = floor(ageFromToday / 7), inverted to put oldest leftmost.
  const grid = days.map((d, i) => {
    const age = N - 1 - i;
    const row = age % 7;
    const colFromRight = Math.floor(age / 7);
    return { age, row, colFromRight, ...d, value: valueFn(d) };
  });
  const cols = Math.max(...grid.map(g => g.colFromRight)) + 1;
  const cw = innerW / cols;
  const ch = innerH / 7;

  const dowLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg cal-svg" preserveAspectRatio="none">
      {/* DoW row labels */}
      {dowLabels.map((d, i) => (
        <text key={"dow" + i} className="axis-text"
              x={pad.l - 8} y={pad.t + i * ch + ch / 2 + 3}
              textAnchor="end" style={{fontSize: 9}}>
          {d}
        </text>
      ))}
      {/* Cells */}
      {grid.map((g, i) => {
        const t = g.value / maxV;
        const col = _ramp(t, colorStatus);
        const cIdx = cols - 1 - g.colFromRight;
        return (
          <rect key={i}
                x={pad.l + cIdx * cw + gap}
                y={pad.t + g.row * ch + gap}
                width={cw - gap * 2}
                height={ch - gap * 2}
                fill={col}
                stroke="var(--line)"
                strokeWidth="0.5"/>
        );
      })}
      {/* Month / week column labels — every 4 weeks */}
      {Array.from({ length: cols }, (_, k) => k).filter(k => k % 4 === 0 || k === cols - 1).map((k) => (
        <text key={"wl" + k} className="axis-text"
              x={pad.l + k * cw + cw / 2}
              y={pad.t + innerH + 14}
              textAnchor="middle">
          {k === cols - 1 ? "this wk" : "wk −" + (cols - 1 - k)}
        </text>
      ))}
    </svg>
  );
}

// ─── ParetoChart ─────────────────────────────────────────────────────────
function ParetoChart({ items, height = 220, valueKey = "hours", valueUnit = "h" }) {
  if (!items || !items.length) return null;
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
  const w = 720, h = height;
  const pad = { l: 50, r: 50, t: 16, b: 60 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const total = sorted.reduce((s, x) => s + x[valueKey], 0);
  const maxV = Math.max(...sorted.map(x => x[valueKey]));
  const yMax = _niceCeil(maxV * 1.1);

  const bw = innerW / sorted.length;
  const xAt = (i) => pad.l + i * bw + bw / 2;
  const yAt = (v) => pad.t + (1 - v / yMax) * innerH;
  const yRightAt = (pct) => pad.t + (1 - pct) * innerH;

  // Cumulative line
  let cum = 0;
  const cumPts = sorted.map((x) => {
    cum += x[valueKey];
    return cum / total;
  });

  // Y axis ticks (left)
  const ticks = 5;
  const yTicks = [];
  for (let k = 0; k <= ticks; k++) yTicks.push((yMax * k) / ticks);
  // Y axis (right) percentage ticks
  const pctTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg pareto-svg" preserveAspectRatio="none">
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
      {/* Grid */}
      {yTicks.map((v, i) => (
        <line key={i} className={i === 0 ? "axis" : "grid-minor"}
              x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)}/>
      ))}
      {/* Bars */}
      {sorted.map((x, i) => {
        const y = yAt(x[valueKey]);
        const cls = x.kind === "mechanical" ? "pareto-bar mech"
                  : x.kind === "hydraulic"  ? "pareto-bar hyd"
                  : x.kind === "electrical" ? "pareto-bar elec"
                  : x.kind === "tooling"    ? "pareto-bar tool"
                  : "pareto-bar svc";
        return (
          <g key={i}>
            <rect x={pad.l + i * bw + bw * 0.18}
                  y={y}
                  width={bw * 0.64}
                  height={pad.t + innerH - y}
                  className={cls}/>
            {/* value label */}
            <text x={xAt(i)} y={y - 4}
                  textAnchor="middle"
                  className="axis-text mono"
                  style={{fontSize: 10, fill: "var(--ink-1)"}}>
              {_fmt(x[valueKey], x[valueKey] >= 10 ? 1 : 1)}{valueUnit}
            </text>
          </g>
        );
      })}
      {/* Cumulative line */}
      <path d={cumPts.map((p, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yRightAt(p).toFixed(1)).join(" ")}
            fill="none" stroke="var(--forecast)" strokeWidth="1.4"
            strokeLinejoin="miter" strokeLinecap="square"/>
      {cumPts.map((p, i) => (
        <circle key={i} cx={xAt(i)} cy={yRightAt(p)} r="2.6"
                fill="var(--surface-2)" stroke="var(--forecast)" strokeWidth="1.2"/>
      ))}
      {/* 80% line */}
      <line x1={pad.l} x2={pad.l + innerW}
            y1={yRightAt(0.8)} y2={yRightAt(0.8)}
            stroke="var(--forecast)" strokeDasharray="3 3" strokeWidth="1" opacity="0.6"/>
      <text x={pad.l + innerW + 4} y={yRightAt(0.8) + 3}
            className="axis-text" fill="var(--forecast)"
            style={{fontSize: 9.5}}>
        80%
      </text>
      {/* X labels */}
      {sorted.map((x, i) => {
        const lines = x.label.split(" / ");
        return (
          <g key={"xl" + i}>
            {lines.map((line, li) => (
              <text key={li} className="axis-text"
                    x={xAt(i)} y={pad.t + innerH + 14 + li * 11}
                    textAnchor="middle">
                {line}
              </text>
            ))}
          </g>
        );
      })}
      {/* Y left labels */}
      {yTicks.map((v, i) => (
        <text key={i} className="axis-text"
              x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">
          {_fmt(v, 0)}
        </text>
      ))}
      <text className="axis-label"
            x={pad.l - 36} y={pad.t + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 36} ${pad.t + innerH / 2})`}>
        hours
      </text>
      {/* Y right labels */}
      {pctTicks.map((p, i) => (
        <text key={i} className="axis-text"
              x={pad.l + innerW + 6} y={yRightAt(p) + 3} textAnchor="start"
              fill="var(--forecast)">
          {Math.round(p * 100)}%
        </text>
      ))}
    </svg>
  );
}

// ─── FleetStrip ──────────────────────────────────────────────────────────
// Horizontal dot-plot: each press is a tick, this press is highlighted.
function FleetStrip({ items, valueLabel = "value", unit = "", title, height = 100 }) {
  if (!items || !items.length) return null;
  const vals = items.map(i => i.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const rawSpan = Math.max(1e-6, rawMax - rawMin);
  // Pad the axis range by 8% on each side so the outlier dot + label aren't clipped
  const minV = rawMin - rawSpan * 0.08;
  const maxV = rawMax + rawSpan * 0.08;
  const span = Math.max(1e-6, maxV - minV);
  const pad = { l: 30, r: 30, t: 36, b: 28 };
  const w = 720, h = height;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const axisY = pad.t + innerH * 0.5;

  const xAt = (v) => pad.l + ((v - minV) / span) * innerW;
  const meanV = vals.reduce((s, v) => s + v, 0) / vals.length;
  const me = items.find(i => i.isThis);

  // 5 axis ticks
  const ticks = 5;
  const tickVals = [];
  for (let k = 0; k <= ticks; k++) tickVals.push(minV + (span * k) / ticks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg fleet-svg" preserveAspectRatio="none">
      {/* Axis line */}
      <line x1={pad.l} x2={pad.l + innerW} y1={axisY} y2={axisY}
            stroke="var(--ink-4)" strokeWidth="1"/>
      {/* Mean line */}
      <line x1={xAt(meanV)} x2={xAt(meanV)}
            y1={axisY - 14} y2={axisY + 14}
            stroke="var(--ink-3)" strokeDasharray="2 2" strokeWidth="1"/>
      <text x={xAt(meanV)} y={axisY - 18}
            textAnchor="middle"
            className="axis-text mono"
            style={{fontSize: 10, fill: "var(--ink-3)"}}>
        mean {_fmt(meanV, 1)}
      </text>
      {/* Press dots */}
      {items.map((it, i) => {
        const x = xAt(it.value);
        const isThis = it.isThis;
        const r = isThis ? 6 : 4;
        const stroke = it.status === "warn" ? "var(--warn)"
                    : it.status === "crit" ? "var(--crit)"
                    : "var(--ink-3)";
        const fill = isThis ? (it.status === "warn" ? "var(--warn)" : it.status === "crit" ? "var(--crit)" : "var(--ink)") : "var(--surface-2)";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={axisY - 6} y2={axisY + 6}
                  stroke={isThis ? stroke : "var(--ink-5)"}
                  strokeWidth={isThis ? 1.4 : 1}/>
            <circle cx={x} cy={axisY} r={r}
                    fill={fill} stroke={stroke}
                    strokeWidth={isThis ? 1.6 : 1.2}/>
            {isThis && (
              <>
                <text x={x} y={axisY - 16}
                      textAnchor="middle"
                      className="mono"
                      style={{fontSize: 10.5, fill: stroke, fontWeight: 600}}>
                  {_fmt(it.value, 1)} {unit}
                </text>
                <text x={x} y={axisY + 22}
                      textAnchor="middle"
                      className=""
                      style={{fontSize: 10, fill: "var(--ink-1)", fontWeight: 500}}>
                  this press
                </text>
              </>
            )}
          </g>
        );
      })}
      {/* Tick labels */}
      {tickVals.map((v, i) => (
        <text key={"tl" + i} className="axis-text mono"
              x={xAt(v)} y={pad.t + innerH + 14} textAnchor="middle"
              style={{fontSize: 9.5}}>
          {_fmt(v, 1)}
        </text>
      ))}
    </svg>
  );
}

// ─── HydraulicState ──────────────────────────────────────────────────────
// Live schematic with named loops (pump → manifold → cylinder → return → cooler).
// Each gauge shows v, baseline tick, and min..max band.
function HydraulicState({ state, height = 280 }) {
  if (!state) return null;
  const w = 720, h = height;
  // Layout: nodes on two horizontal rails — supply (top), return (bottom).
  // Pump and cylinder are structural elements (not gauges) on left/right.
  const G = (x, y, key, label) => ({ x, y, key, label });

  // Five gauges along the supply rail, five along the return.
  const supplyY = 90, returnY = 200;
  const xs = [180, 290, 400, 510];
  const nodes = [
    G(xs[0], supplyY, "filterDelta",    "Filter Δ"),
    G(xs[1], supplyY, "systemPressure", "System P"),
    G(xs[2], supplyY, "accumPressure",  "Accumulator"),
    G(xs[3], supplyY, "counterbalance", "Counter-bal"),
    G(xs[0], returnY, "oilTemp",        "Reservoir T"),
    G(xs[1], returnY, "returnTemp",     "Return T"),
    G(xs[2], returnY, "coolerOut",      "Cooler out"),
    G(xs[3], returnY, "flowRate",       "Flow"),
  ];

  // Connections
  const supplyPath  = "M 100,90 L 600,90";
  const returnPath  = "M 600,200 L 100,200";
  const pumpToRail  = "M 100,90 L 100,90";
  const cylToRet    = "M 600,90 L 600,200";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg hyd-svg" preserveAspectRatio="none">
      {/* Background panel */}
      <rect x={20} y={20} width={w - 40} height={h - 40}
            fill="var(--surface-2)" stroke="var(--line)"/>

      {/* Supply rail (solid, arrow markers) */}
      <path d={supplyPath} fill="none" stroke="var(--ink-2)" strokeWidth="1.6"/>
      {/* Return rail (dashed) */}
      <path d={returnPath} fill="none" stroke="var(--ink-3)" strokeWidth="1.4" strokeDasharray="4 2"/>
      <path d={cylToRet}  fill="none" stroke="var(--ink-3)" strokeWidth="1"/>

      {/* Direction arrows — placed above/below rails between pump and first gauge */}
      <text x={130} y={84} className="axis-text" textAnchor="middle"
            style={{fontSize: 9, letterSpacing: "0.04em"}} fill="var(--ink-4)">supply</text>
      <text x={130} y={213} className="axis-text" textAnchor="middle"
            style={{fontSize: 9, letterSpacing: "0.04em"}} fill="var(--ink-4)">return</text>
      <path d="M 122,90 L 138,90" stroke="var(--ink-3)" strokeWidth="1.4" markerEnd="url(#arr)"/>
      <path d="M 138,200 L 122,200" stroke="var(--ink-3)" strokeWidth="1.4" markerEnd="url(#arr)"/>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,2 L9,5 L0,8 z" fill="var(--ink-3)"/>
        </marker>
      </defs>

      {/* ─── Pump block (left) ───────────────────────────────────── */}
      <g>
        <circle cx={75} cy={145} r={28} fill="var(--surface-sunken)" stroke="var(--ink-2)" strokeWidth="1"/>
        {/* Three rotor blades */}
        <path d="M 75,127 L 75,163 M 60,137 L 90,153 M 60,153 L 90,137"
              stroke="var(--ink-2)" strokeWidth="1.2" fill="none"/>
        <line x1={75} y1={117} x2={75} y2={90} stroke="var(--ink-2)" strokeWidth="1.4"/>
        <line x1={75} y1={173} x2={75} y2={200} stroke="var(--ink-3)" strokeWidth="1.2" strokeDasharray="3 2"/>
        <text x={75} y={193} textAnchor="middle"
              className="axis-text" style={{fontSize: 9.5, fill: "var(--ink-3)"}}>Pump</text>
      </g>

      {/* ─── Cylinder block (right) ─────────────────────────────── */}
      <g>
        <rect x={618} y={70} width={36} height={130} fill="var(--surface-sunken)" stroke="var(--ink-2)" strokeWidth="1"/>
        {/* Piston */}
        <rect x={618} y={132} width={36} height={5} fill="var(--ink-1)"/>
        {/* Piston rod */}
        <line x1={636} y1={137} x2={636} y2={200} stroke="var(--ink-1)" strokeWidth="2"/>
        {/* Cap details */}
        <line x1={618} y1={70} x2={654} y2={70} stroke="var(--ink-2)" strokeWidth="1.4"/>
        <line x1={618} y1={200} x2={654} y2={200} stroke="var(--ink-2)" strokeWidth="1.4"/>
        <text x={636} y={62} textAnchor="middle"
              className="axis-text" style={{fontSize: 9.5, fill: "var(--ink-3)"}}>Cylinder</text>
        {/* Stroke indicator */}
        <text x={665} y={138} className="axis-text mono"
              style={{fontSize: 8.5, fill: "var(--ink-4)"}}>@BDC</text>
      </g>

      {/* Junction dots where gauges tee off the rails */}
      {nodes.map((n, i) => (
        <circle key={"j" + i} cx={n.x} cy={n.y > supplyY + 20 ? returnY : supplyY} r="2"
                fill="var(--ink-2)"/>
      ))}

      {/* Gauges */}
      {nodes.map((n, i) => {
        const s = state[n.key];
        if (!s) return null;
        const t = (s.v - s.min) / Math.max(1e-6, s.max - s.min);
        const tBase = (s.baseline - s.min) / Math.max(1e-6, s.max - s.min);
        const dotColor = s.status === "warn" ? "var(--warn)" : s.status === "crit" ? "var(--crit)" : "var(--ink)";
        const bw = 76, bh = 3;
        const bx = n.x - bw / 2;
        const by = n.y + 26;
        return (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="16" fill="var(--surface-2)" stroke="var(--ink-3)" strokeWidth="1"/>
            <text x={n.x} y={n.y + 2} textAnchor="middle"
                  className="mono"
                  style={{fontSize: 12, fill: "var(--ink)", fontWeight: 500, letterSpacing: "-0.02em"}}>
              {_fmt(s.v, s.v >= 100 ? 0 : 1)}
            </text>
            <text x={n.x} y={n.y + 11} textAnchor="middle"
                  className="axis-text mono" style={{fontSize: 8.5, fill: "var(--ink-4)"}}>
              {s.unit}
            </text>
            <text x={n.x} y={n.y - 22} textAnchor="middle"
                  className="axis-text" style={{fontSize: 10, fill: "var(--ink-3)"}}>
              {n.label}
            </text>
            {/* Range bar with current fill + baseline tick */}
            <rect x={bx} y={by} width={bw} height={bh} fill="var(--line)"/>
            <rect x={bx} y={by} width={t * bw} height={bh} fill={dotColor} opacity="0.75"/>
            <line x1={bx + tBase * bw} x2={bx + tBase * bw}
                  y1={by - 2} y2={by + bh + 2}
                  stroke="var(--ok)" strokeWidth="1"/>
            <text x={bx} y={by + bh + 11} className="axis-text mono"
                  style={{fontSize: 8.5, fill: "var(--ink-4)"}}>
              {_fmt(s.min, s.min >= 100 ? 0 : 1)}
            </text>
            <text x={bx + bw} y={by + bh + 11} className="axis-text mono"
                  textAnchor="end"
                  style={{fontSize: 8.5, fill: "var(--ink-4)"}}>
              {_fmt(s.max, s.max >= 100 ? 0 : 1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── AnomalyTimeSeries ───────────────────────────────────────────────────
// Time-series with a per-day baseline ribbon (±2σ) and called-out anomaly bars.
// Reads from window.getTimeSeries(seriesKey).
function AnomalyTimeSeries({ seriesKey, status = "warn", height = 220 }) {
  const ts = window.getTimeSeries(seriesKey);
  if (!ts) return null;

  const w = 720, h = height;
  const pad = { l: 50, r: 80, t: 14, b: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const N = ts.data.length;
  const projDays = ts.projectionWeeks ? ts.projectionWeeks * 7 : 0;
  const total = N - 1 + projDays;

  // Y range
  const minV = Math.min(...ts.data, ts.baseline);
  const maxV = Math.max(...ts.data, ts.threshold, ts.baseline);
  const yMin = Math.floor(minV * 0.9 / 5) * 5;
  const yMax = _niceCeil(maxV * 1.08);

  const xAt = (i) => pad.l + (i / total) * innerW;
  const yAt = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  // Baseline ribbon: ±2σ band computed on first 30 days
  const calibrationN = Math.min(30, ts.data.length);
  const calib = ts.data.slice(0, calibrationN);
  const mean = calib.reduce((s, v) => s + v, 0) / calib.length;
  const variance = calib.reduce((s, v) => s + (v - mean) ** 2, 0) / calib.length;
  const sigma = Math.sqrt(variance);
  const baseUpper = mean + 2 * sigma;
  const baseLower = Math.max(yMin, mean - 2 * sigma);

  // Anomalies: points outside ±2σ
  const anomalies = ts.data.map((v, i) => (v > baseUpper || v < baseLower) ? i : -1).filter(i => i >= 0);

  // Path
  const path = ts.data.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");

  // Linear projection
  let projection = null, projBand = null;
  if (projDays) {
    const last14 = ts.data.slice(-14);
    const meanX = (last14.length - 1) / 2;
    const meanY = last14.reduce((s, v) => s + v, 0) / last14.length;
    let num = 0, den = 0;
    last14.forEach((v, i) => { num += (i - meanX) * (v - meanY); den += (i - meanX) ** 2; });
    const slope = num / den;
    const lastV = ts.data[ts.data.length - 1];
    const lastI = ts.data.length - 1;

    const projPts = [];
    const projUp = [];
    const projDn = [];
    for (let d = 0; d <= projDays; d++) {
      const v = lastV + slope * d;
      const uncertainty = Math.abs(slope) * d * 0.5 + 0.08 * Math.abs(yMax - yMin) * (d / projDays);
      projPts.push([lastI + d, v]);
      projUp.push([lastI + d, v + uncertainty]);
      projDn.push([lastI + d, v - uncertainty]);
    }
    projection = projPts.map(([i, v], k) => (k ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
    projBand = projUp.map(([i, v], k) => (k ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ")
      + " " + projDn.reverse().map(([i, v]) => "L" + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ") + " Z";
  }

  // Y ticks
  const yTicks = 5;
  const yTickVals = [];
  for (let k = 0; k <= yTicks; k++) yTickVals.push(yMin + ((yMax - yMin) * k) / yTicks);

  // X labels
  const today = ts.data.length - 1;
  const xLabels = [
    { i: 0, label: "−" + ts.days + "d" },
    { i: Math.floor(today * 0.5), label: "−" + Math.round(ts.days * 0.5) + "d" },
    { i: today, label: "today", strong: true },
  ];
  if (projDays) {
    xLabels.push({ i: today + Math.floor(projDays * 0.5), label: "+" + Math.round(projDays * 0.5 / 7) + "w", projection: true });
    xLabels.push({ i: today + projDays, label: "+" + ts.projectionWeeks + "w", projection: true });
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg" preserveAspectRatio="none">
      {/* Plot bg */}
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)"/>
      {/* Grid */}
      {yTickVals.map((v, i) => (
        <line key={i} className={i === 0 ? "axis" : "grid"}
              x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)} />
      ))}

      {/* Baseline ribbon (±2σ on calibration window) */}
      <rect x={pad.l} y={yAt(baseUpper)}
            width={innerW * (today / total)}
            height={yAt(baseLower) - yAt(baseUpper)}
            fill="var(--ok)" opacity="0.07"/>
      <line x1={pad.l} x2={pad.l + innerW * (today / total)}
            y1={yAt(baseUpper)} y2={yAt(baseUpper)}
            stroke="var(--ok)" strokeDasharray="2 3" opacity="0.5"/>
      <line x1={pad.l} x2={pad.l + innerW * (today / total)}
            y1={yAt(baseLower)} y2={yAt(baseLower)}
            stroke="var(--ok)" strokeDasharray="2 3" opacity="0.5"/>

      {/* Threshold */}
      {ts.threshold != null && (
        <>
          <line className="threshold"
                x1={pad.l} x2={pad.l + innerW}
                y1={yAt(ts.threshold)} y2={yAt(ts.threshold)}/>
          <text x={pad.l + innerW + 4} y={yAt(ts.threshold) + 3}
                className="threshold-text">
            alarm {ts.threshold} {ts.unit}
          </text>
        </>
      )}

      {/* Projection band */}
      {projBand && <path d={projBand} className="projection-band"/>}

      {/* Past trace */}
      <path d={path} className={"trace " + status}/>

      {/* Projection line */}
      {projection && <path d={projection} className="projection"/>}

      {/* Anomaly markers */}
      {anomalies.map((i, k) => (
        <line key={k}
              x1={xAt(i)} x2={xAt(i)}
              y1={pad.t + innerH - 4} y2={pad.t + innerH}
              stroke="var(--warn)" strokeWidth="1.6"/>
      ))}

      {/* Today divider */}
      <line className="event-line"
            x1={xAt(today)} x2={xAt(today)}
            y1={pad.t} y2={pad.t + innerH}
            stroke="var(--ink-3)" strokeDasharray="3 3"/>
      <text x={xAt(today) + 4} y={pad.t + 10} className="event-text">today</text>

      {/* Events */}
      {ts.events.map((e, i) => (
        <g key={"ev" + i}>
          <line className="event-line"
                x1={xAt(e.day)} x2={xAt(e.day)}
                y1={pad.t} y2={pad.t + innerH}/>
          <text x={xAt(e.day) + 3} y={pad.t + 22} className="event-text">{e.label}</text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} className="axis-text"
              x={xAt(l.i)} y={pad.t + innerH + 14}
              textAnchor="middle"
              style={l.strong ? {fontWeight: 500, fill: "var(--ink-1)"}
                : l.projection ? {fill: "var(--forecast)"} : null}>
          {l.label}
        </text>
      ))}

      {/* Y labels */}
      {yTickVals.map((v, i) => (
        <text key={i} className="axis-text"
              x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">
          {v >= 100 ? v.toFixed(0) : v.toFixed(1)}
        </text>
      ))}
      <text className="axis-label"
            x={pad.l - 38} y={pad.t + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 38} ${pad.t + innerH / 2})`}>
        {ts.unit}
      </text>
    </svg>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────
Object.assign(window, {
  MultiSignalOverlay,
  SmallMultiples,
  Spectrogram,
  FFTPlot,
  HeatmapCalendar,
  ParetoChart,
  FleetStrip,
  HydraulicState,
  AnomalyTimeSeries,
});
