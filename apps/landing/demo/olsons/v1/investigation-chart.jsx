// investigation-chart.jsx — Machine investigation chart (chart-first concepts).

const { useState, useMemo, useRef, useCallback, useEffect } = React;

const RANGE_PRESETS = [
  { id: "24h", days: 1 },
  { id: "7d", days: 7 },
  { id: "30d", days: 30 },
  { id: "90d", days: 90 },
  { id: "1y", days: 365 },
];

const EVENT_COLORS = {
  service: "var(--chart-4)",
  recipe: "var(--chart-2)",
  alarm: "var(--warn)",
  offline: "var(--unknown)",
  maintenance: "var(--chart-5)",
};

function formatChartDate(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatChartDateTime(d) {
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function trendLabel(values, lastIdx) {
  const n = Math.min(7, lastIdx);
  if (n < 2) return "flat";
  const a = values[lastIdx - n];
  const b = values[lastIdx];
  const d = b - a;
  if (Math.abs(d) < 0.05) return "flat";
  return d > 0 ? "rising" : "falling";
}

function yTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const nice = Math.ceil(span / count / step) * step;
  const ticks = [];
  let v = Math.floor(min / nice) * nice;
  while (v <= max + nice * 0.01) {
    if (v >= min - nice * 0.01) ticks.push(+v.toFixed(2));
    v += nice;
  }
  return ticks.length ? ticks : [min, max];
}

function InvestigationChart({
  concept = "terminal",
  scenario = "concern",
  dataset: datasetProp,
  height = 280,
  showLegend = true,
  showBrush = true,
  showValuesTable = true,
  compact = false,
  chrome = true,
  view: viewProp,
  onViewChange,
  rangeId: rangeIdProp,
  onRangeIdChange,
  activeSignals: activeSignalsProp,
  onActiveSignalsChange,
  scrubIdx: scrubIdxProp,
  onScrubChange,
}) {
  const dataset = useMemo(
    () => datasetProp || window.getInvestigationDataset(scenario),
    [datasetProp, scenario],
  );

  const [rangeIdInternal, setRangeIdInternal] = useState(dataset.defaultRange || "30d");
  const [viewInternal, setViewInternal] = useState(() => ({
    start: dataset.viewStart,
    end: dataset.viewEnd,
  }));
  const [activeSignalsInternal, setActiveSignalsInternal] = useState(() => new Set(dataset.recommended));
  const [scrubIdxInternal, setScrubIdxInternal] = useState(null);
  const [normalized, setNormalized] = useState(concept === "overlay");
  const plotRef = useRef(null);

  const view = viewProp ?? viewInternal;
  const setView = onViewChange ?? setViewInternal;
  const rangeId = rangeIdProp ?? rangeIdInternal;
  const setRangeId = onRangeIdChange ?? setRangeIdInternal;
  const activeSignals = activeSignalsProp ?? activeSignalsInternal;
  const setActiveSignals = onActiveSignalsChange ?? setActiveSignalsInternal;
  const scrubIdx = scrubIdxProp !== undefined ? scrubIdxProp : scrubIdxInternal;
  const setScrubIdx = onScrubChange ?? setScrubIdxInternal;

  useEffect(() => {
    if (viewProp != null) return;
    setViewInternal({ start: dataset.viewStart, end: dataset.viewEnd });
    setActiveSignalsInternal(new Set(dataset.recommended));
    setRangeIdInternal(dataset.defaultRange || "30d");
    setScrubIdxInternal(null);
    setNormalized(concept === "overlay");
  }, [dataset.scenario, concept, viewProp]);

  const catalog = dataset.signalCatalog || window.CHART_SIGNALS;
  const visibleMeta = [...activeSignals]
    .map((id) => catalog.find((s) => s.id === id))
    .filter(Boolean);
  const legendIds = new Set([
    ...window.CHART_SIGNALS.map((s) => s.id),
    ...activeSignals,
  ]);
  const legendMeta = catalog.filter((s) => legendIds.has(s.id));

  const pad = { l: 44, r: concept === "terminal" ? 44 : 16, t: 16, b: 28 };
  const w = 900;
  const h = height;
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const start = view.start;
  const end = view.end;
  const sliceLen = end - start + 1;

  const sliceData = useMemo(() => {
    const out = {};
    catalog.forEach((sig) => {
      const raw = dataset.signals[sig.id]?.values || [];
      out[sig.id] = raw.slice(start, end + 1);
    });
    return out;
  }, [dataset, start, end, catalog]);

  const leftAxisSigs = visibleMeta.filter((s) => s.axis === "left");
  const rightAxisSigs = visibleMeta.filter((s) => s.axis === "right");

  const leftExtent = useMemo(() => {
    let min = Infinity, max = -Infinity;
    leftAxisSigs.forEach((s) => {
      sliceData[s.id]?.forEach((v) => { min = Math.min(min, v); max = Math.max(max, v); });
      if (s.id === "vib-de" && dataset.signals["vib-de"]?.band) {
        dataset.signals["vib-de"].band.slice(start, end + 1).forEach((b) => {
          min = Math.min(min, b.low);
          max = Math.max(max, b.high);
        });
      }
    });
    if (!isFinite(min)) return [0, 5];
    const padY = (max - min) * 0.08 || 0.5;
    return [Math.max(0, min - padY), max + padY];
  }, [leftAxisSigs, sliceData, dataset, start, end]);

  const rightExtent = useMemo(() => {
    let min = Infinity, max = -Infinity;
    rightAxisSigs.forEach((s) => {
      sliceData[s.id]?.forEach((v) => { min = Math.min(min, v); max = Math.max(max, v); });
    });
    if (!isFinite(min)) return [40, 90];
    const padY = (max - min) * 0.08 || 1;
    return [min - padY, max + padY];
  }, [rightAxisSigs, sliceData]);

  const xAt = (i) => pad.l + (i / Math.max(1, sliceLen - 1)) * plotW;
  const yAtLeft = (v) => pad.t + (1 - (v - leftExtent[0]) / (leftExtent[1] - leftExtent[0])) * plotH;
  const yAtRight = (v) => pad.t + (1 - (v - rightExtent[0]) / (rightExtent[1] - rightExtent[0])) * plotH;
  const yAtNorm = (pct) => pad.t + (1 - pct / 100) * plotH;

  const yAtForSignal = (sig, v) => {
    if (normalized) {
      const arr = sliceData[sig.id];
      const locMin = Math.min(...arr);
      const locMax = Math.max(...arr);
      const pct = locMax === locMin ? 50 : ((v - locMin) / (locMax - locMin)) * 100;
      return yAtNorm(pct);
    }
    return sig.axis === "left" ? yAtLeft(v) : yAtRight(v);
  };

  const pathFor = (sigId) => {
    const arr = sliceData[sigId];
    if (!arr?.length) return "";
    return arr.map((v, i) => {
      const sig = catalog.find((s) => s.id === sigId);
      return (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAtForSignal(sig, v).toFixed(1);
    }).join(" ");
  };

  const idxFromClientX = useCallback((clientX) => {
    const el = plotRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * w;
    const rel = (x - pad.l) / plotW;
    return Math.max(0, Math.min(sliceLen - 1, Math.round(rel * (sliceLen - 1))));
  }, [plotW, sliceLen, w, pad.l]);

  const onPointerMove = (e) => {
    setScrubIdx(idxFromClientX(e.clientX));
  };

  const onPointerLeave = () => {
    if (!compact) setScrubIdx(null);
  };

  const applyRange = (id) => {
    setRangeId(id);
    const preset = RANGE_PRESETS.find((r) => r.id === id);
    if (!preset) return;
    const days = Math.min(preset.days, dataset.days);
    setView({ start: dataset.days - days, end: dataset.days - 1 });
  };

  const toggleSignal = (id) => {
    const updater = (prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    };
    if (onActiveSignalsChange) setActiveSignals(updater(activeSignals));
    else setActiveSignalsInternal(updater);
  };

  const scrubGlobalIdx = scrubIdx != null ? start + scrubIdx : end;
  const scrubDate = dataset.dates[scrubGlobalIdx];
  const leftTicks = normalized ? [0, 25, 50, 75, 100] : yTicks(leftExtent[0], leftExtent[1]);
  const rightTicks = normalized ? null : (concept === "terminal" && rightAxisSigs.length ? yTicks(rightExtent[0], rightExtent[1]) : null);

  const showVibBand = activeSignals.has("vib-de") && dataset.signals["vib-de"]?.band && !normalized;
  const vibBandSlice = showVibBand ? dataset.signals["vib-de"].band.slice(start, end + 1) : [];
  const vibBaselineSlice = showVibBand ? dataset.signals["vib-de"].baseline.slice(start, end + 1) : [];

  const flagStart = dataset.flaggedFromDay != null
    ? Math.max(0, dataset.flaggedFromDay - start)
    : null;

  const visibleEvents = dataset.events.filter((e) => e.day >= start && e.day <= end);

  const recorderClass = concept === "recorder" ? " recorder" : "";

  return (
    <div className={"inv-chart" + recorderClass}>
      {chrome && (
      <div className="inv-chart-head">
        <div>
          <h2 className="inv-chart-title">
            {dataset.concernTitle || "Investigation chart"}
          </h2>
          <div className="inv-chart-sub">
            {dataset.machineLabel}
            <span className="mono" style={{ marginLeft: 6 }}>{dataset.machineId}</span>
            {" · "}
            {formatChartDate(dataset.dates[start])} — {formatChartDate(dataset.dates[end])}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {concept === "overlay" && (
            <button
              type="button"
              className="inv-normalized-badge"
              onClick={() => setNormalized((n) => !n)}
              style={{ cursor: "pointer", background: normalized ? "var(--surface-sunken)" : "transparent" }}
            >
              {normalized ? "Normalized · 0–100%" : "Absolute scales"}
            </button>
          )}
          <div className="inv-range-ctrl">
            {RANGE_PRESETS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={rangeId === r.id ? "active" : ""}
                onClick={() => applyRange(r.id)}
              >
                {r.id}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {showLegend && (
        <div className="inv-signal-legend">
          {legendMeta.map((sig) => {
            const on = activeSignals.has(sig.id);
            const vals = dataset.signals[sig.id]?.values || [];
            const v = vals[scrubGlobalIdx] ?? vals[vals.length - 1];
            const tr = trendLabel(vals, scrubGlobalIdx);
            return (
              <div
                key={sig.id}
                className={"inv-signal-row" + (on ? "" : " off")}
                onClick={() => toggleSignal(sig.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggleSignal(sig.id)}
              >
                <span className="inv-swatch" style={{ background: sig.color }} />
                <span className="inv-signal-name">{sig.label}</span>
                <span className="inv-signal-val">{v != null ? v : "—"}</span>
                <span className="mono inv-signal-val" style={{ fontSize: 10, color: "var(--ink-4)" }}>{sig.unit}</span>
                <span className={"inv-signal-trend t-" + (tr === "rising" ? "warn" : tr === "falling" ? "ok" : "3")}>
                  {tr === "flat" ? "→ flat" : tr === "rising" ? "↑ 24h" : "↓ 24h"}
                </span>
                {!normalized && (
                  <span className="inv-signal-axis">{sig.axis === "left" ? "L" : "R"}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="inv-chart-plot"
        ref={plotRef}
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
        onTouchMove={(e) => {
          if (e.touches[0]) onPointerMove(e.touches[0]);
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Investigation time series chart">
          <g className="chart-grid">
            {leftTicks.map((tick) => {
              const y = normalized ? yAtNorm(tick) : yAtLeft(tick);
              return (
                <g key={"y" + tick}>
                  <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} />
                  <text className="axis-label" x={pad.l - 6} y={y + 3} textAnchor="end">
                    {normalized ? tick : tick.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {rightTicks && rightTicks.map((tick) => {
              const y = yAtRight(tick);
              return (
                <text key={"yr" + tick} className="axis-label" x={w - pad.r + 6} y={y + 3} textAnchor="start">
                  {tick.toFixed(0)}
                </text>
              );
            })}
          </g>

          {/* Alarm threshold — drive-end vibration */}
          {activeSignals.has("vib-de") && !normalized && (
            <g>
              <line
                x1={pad.l} x2={w - pad.r}
                y1={yAtLeft(4.5)} y2={yAtLeft(4.5)}
                stroke="var(--crit)" strokeDasharray="4 3" strokeWidth="1"
              />
              <text x={w - pad.r - 4} y={yAtLeft(4.5) - 4} fontSize="9" fill="var(--crit)" textAnchor="end" className="mono">
                Alarm 4.5
              </text>
            </g>
          )}

          {/* Deviation band + baseline (primary signal) */}
          {showVibBand && vibBandSlice.length > 1 && (
            <path
              className="chart-band"
              d={vibBandSlice.map((b, i) => {
                const x = xAt(i);
                return (i ? "L" : "M") + x.toFixed(1) + "," + yAtLeft(b.high).toFixed(1);
              }).join(" ")
                + vibBandSlice.slice().reverse().map((b, i) => {
                  const xi = sliceLen - 1 - i;
                  return "L" + xAt(xi).toFixed(1) + "," + yAtLeft(b.low).toFixed(1);
                }).join(" ")
                + " Z"}
            />
          )}
          {showVibBand && vibBaselineSlice.length > 1 && (
            <path
              className="chart-baseline"
              d={vibBaselineSlice.map((v, i) =>
                (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAtLeft(v).toFixed(1),
              ).join(" ")}
            />
          )}

          {/* System flagged deviation window */}
          {flagStart != null && flagStart < sliceLen && (
            <rect
              className="chart-flag-band"
              x={xAt(flagStart)}
              y={pad.t}
              width={xAt(sliceLen - 1) - xAt(flagStart)}
              height={plotH}
            />
          )}
          {dataset.alertOnsetDay != null && dataset.alertOnsetDay >= start && dataset.alertOnsetDay <= end && (
            <g>
              <line
                x1={xAt(dataset.alertOnsetDay - start)}
                x2={xAt(dataset.alertOnsetDay - start)}
                y1={pad.t} y2={pad.t + plotH}
                stroke="var(--warn)" strokeDasharray="3 2" strokeWidth="1"
              />
              <text
                x={xAt(dataset.alertOnsetDay - start) + 4}
                y={pad.t + 10}
                fontSize="9"
                fill="var(--warn)"
              >
                Alert opened
              </text>
            </g>
          )}

          {/* Event markers */}
          {visibleEvents.map((ev) => {
            const xi = ev.day - start;
            if (xi < 0 || xi >= sliceLen) return null;
            const x = xAt(xi);
            const col = EVENT_COLORS[ev.type] || "var(--ink-3)";
            return (
              <g key={ev.day + ev.type} className="inv-event-marker">
                <line className="inv-event-tick" x1={x} x2={x} y1={pad.t} y2={pad.t + plotH} />
                <circle className="inv-event-dot" cx={x} cy={pad.t + plotH + 6} r={3} stroke={col} />
                {!compact && (
                  <text x={x + 4} y={pad.t + 22} fontSize="8" fill="var(--ink-3)">
                    {ev.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Signal traces */}
          {visibleMeta.map((sig) => (
            <path
              key={sig.id}
              className="chart-line"
              d={pathFor(sig.id)}
              stroke={sig.color}
              strokeWidth={sig.id === "vib-de" ? 1.5 : 1.25}
            />
          ))}

          {/* Scrub */}
          {scrubIdx != null && (
            <g>
              <line
                className="inv-scrub-line"
                x1={xAt(scrubIdx)} x2={xAt(scrubIdx)}
                y1={pad.t} y2={pad.t + plotH}
              />
              {visibleMeta.map((sig) => {
                const v = sliceData[sig.id][scrubIdx];
                if (v == null) return null;
                return (
                  <circle
                    key={sig.id}
                    className="inv-scrub-dot"
                    cx={xAt(scrubIdx)}
                    cy={yAtForSignal(sig, v)}
                    r={3.5}
                    stroke={sig.color}
                  />
                );
              })}
            </g>
          )}

          {/* X axis */}
          {[0, Math.floor(sliceLen / 2), sliceLen - 1].map((i) => (
            <text
              key={i}
              className="axis-label"
              x={xAt(i)}
              y={h - 6}
              textAnchor={i === 0 ? "start" : i === sliceLen - 1 ? "end" : "middle"}
            >
              {formatChartDate(dataset.dates[start + i])}
            </text>
          ))}
        </svg>
      </div>

      {showValuesTable && scrubIdx != null && (
        <div className="inv-values-table">
          <div className="inv-values-time">
            {formatChartDateTime(scrubDate)}
            {dataset.flaggedFromDay != null && scrubGlobalIdx >= dataset.flaggedFromDay && (
              <span style={{ marginLeft: 10, color: "var(--warn)" }}>· In flagged window</span>
            )}
          </div>
          {visibleMeta.map((sig) => {
            const v = sliceData[sig.id][scrubIdx];
            const base = dataset.signals["vib-de"]?.baseline?.[scrubGlobalIdx];
            const delta = sig.id === "vib-de" && base != null ? (v - base).toFixed(2) : null;
            return (
              <div key={sig.id} className="inv-values-cell">
                <div className="inv-values-label">
                  <span className="inv-swatch" style={{ background: sig.color, width: 8 }} />
                  {sig.short}
                </div>
                <div className="inv-values-num">
                  {v}<span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 400 }}> {sig.unit}</span>
                  {delta != null && (
                    <span style={{ fontSize: 10, color: "var(--warn)", marginLeft: 6 }}>
                      +{delta} vs baseline
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showBrush && chrome && (
        <BrushSelector
          dataset={dataset}
          view={view}
          onViewChange={setView}
          activeSignals={activeSignals}
          pad={pad}
          w={w}
        />
      )}

      {chrome && (
      <div className="inv-chart-foot">
        <div className="legend-inline">
          {showVibBand && (
            <>
              <span><span className="inv-swatch" style={{ background: "var(--ink-4)", opacity: 0.4, height: 6 }} /> Baseline band</span>
              <span><span style={{ width: 12, height: 8, background: "var(--warn)", opacity: 0.15, display: "inline-block" }} /> Flagged by model</span>
            </>
          )}
        </div>
        <span className="mono" style={{ fontSize: 10 }}>
          Scrub chart · click legend to toggle · {visibleMeta.length} signal{visibleMeta.length !== 1 ? "s" : ""}
        </span>
      </div>
      )}
    </div>
  );
}

function BrushSelector({ dataset, view, onViewChange, activeSignals, pad, w }) {
  const bh = 44;
  const bp = { l: pad.l, r: pad.r, t: 6, b: 14 };
  const plotW = w - bp.l - bp.r;
  const days = dataset.days;
  const primary = activeSignals.has("vib-de") ? "vib-de" : [...activeSignals][0] || "vib-de";
  const full = dataset.signals[primary]?.values || [];

  const min = Math.min(...full);
  const max = Math.max(...full);
  const xAt = (i) => bp.l + (i / (days - 1)) * plotW;
  const yAt = (v) => bp.t + (1 - (v - min) / (max - min || 1)) * (bh - bp.t - bp.b);

  const path = full.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");

  const winX1 = xAt(view.start);
  const winX2 = xAt(view.end);

  const dragRef = useRef(null);

  const viewFromBrushX = (clientX, el) => {
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * w;
    const rel = (x - bp.l) / plotW;
    return Math.round(rel * (days - 1));
  };

  const onBrushDown = (e) => {
    const el = e.currentTarget;
    const idx = viewFromBrushX(e.clientX, el);
    dragRef.current = { el, edge: Math.abs(idx - view.start) < Math.abs(idx - view.end) ? "start" : "end", mode: "pan" };
  };

  const onBrushMove = (e) => {
    if (!dragRef.current) return;
    const idx = viewFromBrushX(e.clientX, dragRef.current.el);
    const span = view.end - view.start;
    if (dragRef.current.mode === "pan") {
      let s = idx - Math.floor(span / 2);
      s = Math.max(0, Math.min(days - 1 - span, s));
      onViewChange({ start: s, end: s + span });
    }
  };

  const onBrushUp = () => { dragRef.current = null; };

  useEffect(() => {
    const move = (e) => onBrushMove(e);
    const up = () => onBrushUp();
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
    };
  }, [view, onViewChange]);

  return (
    <div className="inv-brush-wrap">
      <div className="inv-brush-label">Range selector · drag window</div>
      <svg
        viewBox={`0 0 ${w} ${bh}`}
        className="inv-brush"
        onMouseDown={onBrushDown}
        role="slider"
        aria-label="Chart time range selector"
      >
        <path className="brush-context" d={path} />
        <rect
          className="brush-window"
          x={winX1}
          y={bp.t}
          width={Math.max(8, winX2 - winX1)}
          height={bh - bp.t - bp.b}
        />
      </svg>
    </div>
  );
}

window.InvestigationChart = InvestigationChart;
window.BrushSelector = BrushSelector;
window.INV_RANGE_PRESETS = RANGE_PRESETS;
window.invFormatChartDate = formatChartDate;
window.invFormatChartDateTime = formatChartDateTime;
window.invTrendLabel = trendLabel;