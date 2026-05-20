// investigation-grid.jsx — Small-multiples signal grid for exploration.

const { useMemo, useRef, useCallback } = React;

const CATEGORY_LABELS = {
  vibration: "Vibration",
  temperature: "Temperature",
  electrical: "Electrical",
  hydraulics: "Hydraulics",
  process: "Process",
};

function miniSparkPath(values, w, h, pad = 2) {
  if (!values?.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
}

function baselinePath(baseline, values, w, h, pad = 2) {
  if (!baseline?.length) return "";
  const all = [...values, ...baseline];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  return baseline.map((v, i) => {
    const x = pad + (i / Math.max(1, baseline.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
}

function SignalMiniChart({
  sig,
  values,
  baseline,
  band,
  scrubIdx,
  onScrub,
  onSelect,
  onExpand,
  inOverlay,
  flaggedFromDay,
  viewStart,
  trend,
}) {
  const w = 200;
  const h = 44;
  const pad = 2;
  const ref = useRef(null);

  const idxFromX = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(values.length - 1, Math.round(rel * (values.length - 1))));
  }, [values.length]);

  const handleMove = (e) => {
    onScrub(idxFromX(e.clientX));
  };

  const flagLocal = flaggedFromDay != null
    ? Math.max(0, flaggedFromDay - viewStart)
    : null;

  const xAt = (i) => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yAt = (v) => pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);

  const bandPath = band?.length > 1
    ? band.map((b, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(b.high).toFixed(1)).join(" ")
      + band.slice().reverse().map((b, i) => {
        const xi = values.length - 1 - i;
        return "L" + xAt(xi).toFixed(1) + "," + yAt(b.low).toFixed(1);
      }).join(" ") + " Z"
    : null;

  const statusCls = sig.status === "warn" ? "warn" : sig.status === "crit" ? "crit" : "ok";
  const tr = trend || "flat";

  return (
    <div
      className={"inv-grid-cell" + (inOverlay ? " in-overlay" : "") + (scrubIdx != null ? " scrubbing" : "")}
      onClick={(e) => {
        if (e.detail === 2) onExpand?.();
        else onSelect?.(e.shiftKey);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(e.shiftKey);
      }}
      title="Click to add to overlay · Double-click to expand · Shift+click to add only"
    >
      <div className="inv-grid-cell-head">
        <span className={"inv-grid-status dot " + statusCls} />
        <span className="inv-grid-name">{sig.short || sig.label}</span>
        <span className={"inv-grid-trend t-" + (tr === "rising" ? "warn" : tr === "falling" ? "ok" : "3")}>
          {tr === "rising" ? "↑" : tr === "falling" ? "↓" : "→"}
        </span>
      </div>
      <div className="inv-grid-value-row">
        <span className="inv-grid-value mono tnum">
          {values[scrubIdx ?? values.length - 1]}
        </span>
        <span className="inv-grid-unit">{sig.unit}</span>
        {baseline && (
          <span className="inv-grid-baseline">
            base {baseline[baseline.length - 1]}{sig.unit ? " " + sig.unit : ""}
          </span>
        )}
      </div>
      <div
        className="inv-grid-spark"
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={() => onScrub(null)}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0])}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
          {bandPath && <path d={bandPath} fill="var(--ink-4)" opacity="0.07" />}
          {baseline && (
            <path d={baselinePath(baseline, values, w, h)} fill="none" stroke="var(--ink-4)" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
          )}
          {flagLocal != null && flagLocal < values.length && (
            <rect
              x={xAt(flagLocal)}
              y={0}
              width={xAt(values.length - 1) - xAt(flagLocal)}
              height={h}
              fill="var(--warn)"
              opacity="0.06"
            />
          )}
          <path
            d={miniSparkPath(values, w, h)}
            fill="none"
            stroke={sig.color || "var(--chart-1)"}
            strokeWidth="1.25"
            strokeLinecap="butt"
          />
          {scrubIdx != null && (
            <line
              x1={xAt(scrubIdx)}
              x2={xAt(scrubIdx)}
              y1={0}
              y2={h}
              stroke="var(--ink)"
              strokeWidth="1"
              opacity="0.35"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function InvestigationSignalGrid({
  dataset,
  view,
  scrubIdx,
  onScrubChange,
  activeSignals,
  onSignalClick,
  onExpandSignal,
  sortBy = "anomaly",
  groupBySubsystem = true,
}) {
  const start = view.start;
  const end = view.end;
  const localScrub = scrubIdx != null ? scrubIdx - start : null;

  const catalog = dataset.signalCatalog || window.SIGNAL_CATALOG;

  const sorted = useMemo(() => {
    const list = [...catalog];
    if (sortBy === "anomaly") {
      list.sort((a, b) => b.anomalyScore - a.anomalyScore);
    } else if (sortBy === "category") {
      list.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
    } else {
      list.sort((a, b) => a.order - b.order);
    }
    return list;
  }, [catalog, sortBy]);

  const grouped = useMemo(() => {
    if (!groupBySubsystem) return [{ name: null, items: sorted }];
    const map = new Map();
    sorted.forEach((sig) => {
      const key = sig.subsystem || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(sig);
    });
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }, [sorted, groupBySubsystem]);

  const handleScrub = (localIdx) => {
    if (localIdx == null) {
      onScrubChange?.(null);
      return;
    }
    onScrubChange?.(start + localIdx);
  };

  return (
    <div className="inv-grid">
      {grouped.map((group) => (
        <div key={group.name || "all"} className="inv-grid-section">
          {group.name && (
            <div className="inv-grid-section-head">
              <span>{group.name}</span>
              <span className="inv-grid-section-count">{group.items.length} signals</span>
            </div>
          )}
          <div className="inv-grid-cells">
            {group.items.map((sig) => {
              const raw = dataset.signals[sig.id]?.values || [];
              const values = raw.slice(start, end + 1);
              const baseline = dataset.signals[sig.id]?.baseline?.slice(start, end + 1);
              const band = dataset.signals[sig.id]?.band?.slice(start, end + 1);
              const full = dataset.signals[sig.id]?.values || [];
              const gIdx = scrubIdx ?? end;
              const trendDir = window.invTrendLabel?.(full, gIdx) || "flat";
              return (
                <SignalMiniChart
                  key={sig.id}
                  sig={sig}
                  values={values}
                  baseline={baseline}
                  band={band}
                  scrubIdx={localScrub}
                  viewStart={start}
                  flaggedFromDay={dataset.flaggedFromDay}
                  trend={trendDir}
                  inOverlay={activeSignals?.has(sig.id)}
                  onScrub={handleScrub}
                  onSelect={(shift) => onSignalClick?.(sig.id, shift)}
                  onExpand={() => onExpandSignal?.(sig.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

window.InvestigationSignalGrid = InvestigationSignalGrid;
