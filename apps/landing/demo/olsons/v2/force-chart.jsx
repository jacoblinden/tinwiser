// force-chart.jsx — the press force-curve / cycle-signature chart.
//
// Tonnage (Y) vs crank angle (X, 0–360°). Renders:
//   • A semi-transparent bundle of "ghost" traces — last N cycles
//   • A solid trace for the current/highlighted cycle
//   • An optional baseline / spec band
//   • Calibrated axes with major + minor gridlines
//   • Optional annotations for BDC, peak, drift markers
//
// Style: anti-aliased, square caps, monospace axis text, instrument feel.

function ForceCurveChart({ pressId, height = 280, showGhosts = true, showBaseline = true, status = "ok", compact = false }) {
  const fc = window.getForceCurve(pressId);
  const press = window.getPress(pressId);

  const w = 720, h = height;
  const pad = compact
    ? { l: 38, r: 16, t: 12, b: 28 }
    : { l: 50, r: 24, t: 18, b: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  // Y range — scale to peak with headroom
  const peakAll = Math.max(fc.peak * 1.18, ...fc.current);
  const yMax = niceCeil(peakAll);
  const yMin = 0;

  // Coord helpers
  const xAt = (angle) => pad.l + (angle / 360) * innerW;
  const yAt = (val)   => pad.t + (1 - (val - yMin) / (yMax - yMin)) * innerH;

  // Build path from a series sampled across 0..360°
  const seriesPath = (series) => {
    const n = series.length;
    return series.map((v, i) => {
      const x = pad.l + (i / (n - 1)) * innerW;
      const y = yAt(v);
      return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
  };

  // X ticks every 45°, minors every 15°
  const xMajors = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const xMinors = [];
  for (let a = 0; a <= 360; a += 15) if (a % 45 !== 0) xMinors.push(a);

  // Y ticks — 5 majors
  const yTicks = 5;
  const yMajors = [];
  for (let k = 0; k <= yTicks; k++) yMajors.push((yMax * k) / yTicks);

  const currentClass = status === "warn" ? "current warn" : status === "crit" ? "current crit" : "current";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="force-svg" preserveAspectRatio="none" role="img"
         aria-label={`Force curve for ${press?.name || pressId}`}>
      {/* Plot background */}
      <rect x={pad.l} y={pad.t} width={innerW} height={innerH} fill="var(--surface-2)" stroke="none" />

      {/* Minor X grid */}
      {xMinors.map((a) => (
        <line key={"xm" + a} className="grid-minor"
              x1={xAt(a)} x2={xAt(a)} y1={pad.t} y2={pad.t + innerH} />
      ))}
      {/* Major X grid */}
      {xMajors.map((a) => (
        <line key={"xM" + a} className="grid-major"
              x1={xAt(a)} x2={xAt(a)} y1={pad.t} y2={pad.t + innerH} />
      ))}
      {/* Y grid */}
      {yMajors.map((v, i) => (
        <line key={"y" + i} className={i === 0 ? "axis" : "grid-major"}
              x1={pad.l} x2={pad.l + innerW} y1={yAt(v)} y2={yAt(v)} />
      ))}

      {/* Baseline envelope band (faint forecast color) */}
      {showBaseline && fc.baseline && (() => {
        const baseUp = fc.baseline.map(v => v * 1.06);
        const baseDn = fc.baseline.map(v => v * 0.94);
        const up = seriesPath(baseUp);
        const dn = seriesPath(baseDn).split(" ").reverse().map(p => p.replace(/^M/, "L")).join(" ");
        // Re-render reverse polyline as raw points to keep order
        const n = baseDn.length;
        const dnRev = baseDn.map((v, idx) => {
          const i = n - 1 - idx;
          const x = pad.l + (i / (n - 1)) * innerW;
          const y = yAt(baseDn[i]);
          return "L" + x.toFixed(1) + "," + y.toFixed(1);
        }).join(" ");
        return <path className="envelope" d={`${up} ${dnRev} Z`} />;
      })()}

      {/* Ghost cycles */}
      {showGhosts && fc.ghosts.map((g, i) => (
        <path key={"g" + i}
              className={"ghost" + (!fc.healthy && i > fc.ghosts.length - 6 ? " warn" : "")}
              d={seriesPath(g)} />
      ))}

      {/* Baseline trace (dashed) */}
      {showBaseline && (
        <path className="baseline" d={seriesPath(fc.baseline)} />
      )}

      {/* Current cycle (solid) */}
      <path className={currentClass} d={seriesPath(fc.current)} />

      {/* BDC annotation */}
      {fc.annotations?.bdc != null && (
        <>
          <line className="annotation"
                x1={xAt(fc.annotations.bdc)} x2={xAt(fc.annotations.bdc)}
                y1={pad.t} y2={pad.t + innerH} />
          <text className="annotation-text"
                x={xAt(fc.annotations.bdc) + 4} y={pad.t + 10}>
            BDC {fc.annotations.bdc}°
          </text>
        </>
      )}

      {/* Peak marker */}
      {fc.annotations?.peakAngle != null && (
        <>
          <circle className="peak-mark"
                  cx={xAt(fc.annotations.peakAngle)}
                  cy={yAt(Math.max(...fc.current))}
                  r="2.6" />
          <text className="annotation-text"
                x={xAt(fc.annotations.peakAngle) + 6}
                y={yAt(Math.max(...fc.current)) - 4}>
            {Math.max(...fc.current).toFixed(fc.peak > 100 ? 0 : 1)} ton
          </text>
        </>
      )}

      {/* X axis */}
      <line className="axis" x1={pad.l} x2={pad.l + innerW} y1={pad.t + innerH} y2={pad.t + innerH} />
      {/* X tick labels */}
      {xMajors.map((a) => (
        <text key={"xl" + a} className="axis-text" x={xAt(a)} y={pad.t + innerH + 14}
              textAnchor="middle">{a}°</text>
      ))}
      {/* X axis title */}
      <text className="axis-label" x={pad.l + innerW / 2} y={h - 4} textAnchor="middle">
        crank angle
      </text>

      {/* Y tick labels */}
      {yMajors.map((v, i) => (
        <text key={"yl" + i} className="axis-text"
              x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">
          {v >= 100 ? v.toFixed(0) : v.toFixed(0)}
        </text>
      ))}
      {/* Y axis title */}
      <text className="axis-label"
            x={pad.l - 36} y={pad.t + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 36} ${pad.t + innerH / 2})`}>
        ton
      </text>
    </svg>
  );
}

function niceCeil(v) {
  if (v <= 10) return Math.ceil(v / 2) * 2;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  if (v <= 100) return Math.ceil(v / 20) * 20;
  if (v <= 500) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}

// ─── Time series chart (vibration, parallelism, tonnage trend) ─────────────
function TimeSeriesChart({ seriesKey, height = 220, status = "warn" }) {
  const ts = window.getTimeSeries(seriesKey);
  if (!ts) return null;

  const w = 720, h = height;
  const pad = { l: 50, r: 80, t: 18, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const minV = Math.min(...ts.data, ts.baseline);
  const maxV = Math.max(...ts.data, ts.threshold, ts.baseline);
  const yMin = Math.floor(minV * 0.9 / 5) * 5;
  const yMax = niceCeil(maxV * 1.08);

  const xAt = (i) => pad.l + (i / (ts.data.length - 1 + (ts.projectionWeeks ? ts.projectionWeeks * 7 : 0))) * innerW;
  const yAt = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const path = ts.data.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");

  // Projection: linear extrapolation from last 14 days slope
  const projDays = ts.projectionWeeks ? ts.projectionWeeks * 7 : 0;
  let projection = null, projectionBand = null;
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
      const uncertainty = Math.abs(slope) * d * 0.5 + 0.1 * Math.abs(yMax - yMin) * (d / projDays) * 0.3;
      projPts.push([lastI + d, v]);
      projUp.push([lastI + d, v + uncertainty]);
      projDn.push([lastI + d, v - uncertainty]);
    }
    projection = projPts.map(([i, v], k) => (k ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
    projectionBand = projUp.map(([i, v], k) => (k ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ")
      + " " + projDn.reverse().map(([i, v]) => "L" + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ") + " Z";
  }

  // Y ticks
  const yTicks = 5;
  const yTickVals = [];
  for (let k = 0; k <= yTicks; k++) yTickVals.push(yMin + ((yMax - yMin) * k) / yTicks);

  // X day labels
  const totalDays = ts.data.length - 1 + projDays;
  const xLabels = [];
  // Show -60d, -45d, -30d, -15d, today, +1w, +2w...
  const today = ts.data.length - 1;
  xLabels.push({ i: 0, label: "−" + (ts.days - 0) + "d" });
  xLabels.push({ i: Math.floor(today * 0.5), label: "−" + Math.round(ts.days * 0.5) + "d" });
  xLabels.push({ i: today, label: "today", strong: true });
  if (projDays) {
    xLabels.push({ i: today + Math.floor(projDays * 0.5), label: "+" + Math.round(projDays * 0.5 / 7) + "w", projection: true });
    xLabels.push({ i: today + projDays, label: "+" + ts.projectionWeeks + "w", projection: true });
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg" preserveAspectRatio="none">
      {/* Grid */}
      {yTickVals.map((v, i) => (
        <line key={i} className={i === 0 ? "axis" : "grid"} x1={pad.l} x2={pad.l + innerW}
              y1={yAt(v)} y2={yAt(v)} />
      ))}

      {/* Today divider */}
      <line className="event-line" x1={xAt(ts.data.length - 1)} x2={xAt(ts.data.length - 1)}
            y1={pad.t} y2={pad.t + innerH} stroke="var(--ink-3)" strokeDasharray="3 3" />
      <text x={xAt(ts.data.length - 1) + 4} y={pad.t + 10} className="event-text">today</text>

      {/* Threshold line */}
      {ts.threshold != null && (
        <>
          <line className="threshold"
                x1={pad.l} x2={pad.l + innerW}
                y1={yAt(ts.threshold)} y2={yAt(ts.threshold)} />
          <text x={pad.l + innerW + 4} y={yAt(ts.threshold) + 3}
                className="threshold-text">
            alarm {ts.threshold} {ts.unit}
          </text>
        </>
      )}

      {/* Baseline */}
      {ts.baseline != null && (
        <>
          <line x1={pad.l} x2={pad.l + innerW}
                y1={yAt(ts.baseline)} y2={yAt(ts.baseline)}
                stroke="var(--ok)" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
          <text x={pad.l + innerW + 4} y={yAt(ts.baseline) + 3}
                style={{fontSize: "9.5px", fill: "var(--ok)"}}>
            baseline {ts.baseline}
          </text>
        </>
      )}

      {/* Projection band */}
      {projectionBand && (
        <path d={projectionBand} className="projection-band" />
      )}

      {/* Past data trace */}
      <path d={path} className={"trace " + status} />

      {/* Projection line */}
      {projection && (
        <path d={projection} className="projection" />
      )}

      {/* Events */}
      {ts.events.map((e, i) => (
        <g key={i}>
          <line className="event-line"
                x1={xAt(e.day)} x2={xAt(e.day)}
                y1={pad.t} y2={pad.t + innerH} />
          <text x={xAt(e.day) + 3} y={pad.t + 22} className="event-text">{e.label}</text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} className="axis-text"
              x={xAt(l.i)} y={pad.t + innerH + 14}
              textAnchor="middle"
              style={l.strong ? {fontWeight: 500, fill: "var(--ink-1)"} : l.projection ? {fill: "var(--forecast)"} : null}>
          {l.label}
        </text>
      ))}

      {/* Y labels */}
      {yTickVals.map((v, i) => (
        <text key={i} className="axis-text" x={pad.l - 6} y={yAt(v) + 3} textAnchor="end">
          {v >= 100 ? v.toFixed(0) : v.toFixed(1)}
        </text>
      ))}

      {/* Y axis title */}
      <text className="axis-label"
            x={pad.l - 38} y={pad.t + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${pad.l - 38} ${pad.t + innerH / 2})`}>
        {ts.unit}
      </text>
    </svg>
  );
}

// ─── Tonnage strip — small one-line histogram of last N cycles ─────────────
function TonnageStrip({ pressId, height = 36 }) {
  const fc = window.getForceCurve(pressId);
  const peaks = fc.ghosts.map(g => Math.max(...g));
  const peaks2 = [...peaks, Math.max(...fc.current)];
  const w = 720, h = height;
  const pad = { l: 0, r: 0, t: 4, b: 4 };
  const maxV = Math.max(...peaks2);
  const minV = Math.min(...peaks2);
  const bw = (w - pad.l - pad.r) / peaks2.length;
  const yAt = (v) => pad.t + (1 - (v - minV * 0.94) / (maxV * 1.06 - minV * 0.94)) * (h - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tonn-svg" preserveAspectRatio="none">
      {peaks2.map((v, i) => {
        const cls = i === peaks2.length - 1 ? (fc.healthy ? "bar" : "bar warn") : "bar muted";
        return <rect key={i} className={cls}
                     x={pad.l + i * bw + 0.5}
                     y={yAt(v)}
                     width={Math.max(1.4, bw - 1)}
                     height={h - pad.b - yAt(v)} />;
      })}
    </svg>
  );
}

window.ForceCurveChart = ForceCurveChart;
window.TimeSeriesChart = TimeSeriesChart;
window.TonnageStrip = TonnageStrip;
