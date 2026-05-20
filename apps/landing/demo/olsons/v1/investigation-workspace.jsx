// investigation-workspace.jsx — Overlay + grid modes with shared investigation state.

const { useState, useEffect, useMemo, useCallback } = React;

const GRID_SORT_OPTIONS = [
  { id: "anomaly", label: "Anomaly score" },
  { id: "category", label: "Category" },
  { id: "custom", label: "Sensor order" },
];

function InvestigationWorkspace({
  scenario = "concern",
  dataset: datasetProp,
  concept = "terminal",
  onConceptChange,
  showConceptPicker = false,
  height = 280,
}) {
  const dataset = useMemo(
    () => datasetProp || window.getInvestigationDataset(scenario),
    [datasetProp, scenario],
  );

  const [viewMode, setViewMode] = useState("overlay");
  const [view, setView] = useState(() => ({ start: dataset.viewStart, end: dataset.viewEnd }));
  const [rangeId, setRangeId] = useState(dataset.defaultRange || "30d");
  const [activeSignals, setActiveSignals] = useState(() => new Set(dataset.recommended));
  const [scrubIdx, setScrubIdx] = useState(null);
  const [gridSort, setGridSort] = useState("anomaly");
  const [expandedSignal, setExpandedSignal] = useState(null);

  useEffect(() => {
    setView({ start: dataset.viewStart, end: dataset.viewEnd });
    setActiveSignals(new Set(dataset.recommended));
    setRangeId(dataset.defaultRange || "30d");
    setScrubIdx(null);
    setExpandedSignal(null);
  }, [dataset.scenario]);

  const applyRange = (id) => {
    setRangeId(id);
    const preset = window.INV_RANGE_PRESETS?.find((r) => r.id === id);
    if (!preset) return;
    const days = Math.min(preset.days, dataset.days);
    setView({ start: dataset.days - days, end: dataset.days - 1 });
  };

  const handleGridSelect = (sigId, shiftKey) => {
    setActiveSignals((prev) => {
      const next = new Set(prev);
      if (shiftKey) {
        if (next.has(sigId) && next.size > 1) next.delete(sigId);
        else next.add(sigId);
        return next;
      }
      if (!next.has(sigId)) next.add(sigId);
      return next;
    });
    if (!shiftKey) setViewMode("overlay");
  };

  const handleExpand = (sigId) => {
    setExpandedSignal(sigId);
    setActiveSignals(new Set([sigId]));
    setViewMode("overlay");
  };

  const scrubGlobal = scrubIdx;
  const start = view.start;
  const end = view.end;

  const recorderClass = concept === "recorder" && viewMode === "overlay" ? " recorder" : "";

  return (
    <div className="inv-workspace">
      <div className="inv-workspace-toolbar">
        <div className="inv-mode-toggle">
          <button
            type="button"
            className={viewMode === "overlay" ? "active" : ""}
            onClick={() => setViewMode("overlay")}
          >
            Overlay
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            Signal grid
          </button>
        </div>

        {viewMode === "grid" && (
          <div className="inv-grid-sort">
            <span className="inv-grid-sort-label">Sort</span>
            <select
              className="input"
              style={{ width: "auto", height: 26, fontSize: 11 }}
              value={gridSort}
              onChange={(e) => setGridSort(e.target.value)}
            >
              {GRID_SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {showConceptPicker && viewMode === "overlay" && onConceptChange && (
          <div className="inv-concept-inline">
            {["terminal", "recorder", "overlay"].map((c) => (
              <button
                key={c}
                type="button"
                className={concept === c ? "active" : ""}
                onClick={() => onConceptChange(c)}
              >
                {c === "terminal" ? "Terminal" : c === "recorder" ? "Recorder" : "Normalized"}
              </button>
            ))}
          </div>
        )}

        <div className="inv-range-ctrl" style={{ marginLeft: "auto" }}>
          {(window.INV_RANGE_PRESETS || []).map((r) => (
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

      <div className="inv-workspace-meta">
        <div>
          <h2 className="inv-chart-title">
            {dataset.concernTitle || "Machine signals"}
          </h2>
          <div className="inv-chart-sub">
            {dataset.machineLabel}
            <span className="mono" style={{ marginLeft: 6 }}>{dataset.machineId}</span>
            {" · "}
            {window.invFormatChartDate?.(dataset.dates[start])} — {window.invFormatChartDate?.(dataset.dates[end])}
            {viewMode === "grid" && (
              <span> · {(dataset.signalCatalog || []).length} channels</span>
            )}
          </div>
        </div>
        {viewMode === "grid" && (
          <div className="inv-grid-hint t-3" style={{ fontSize: 11, maxWidth: 280, textAlign: "right" }}>
            Scrub any sparkline for a synchronized crosshair. Click to add to overlay; double-click to expand.
          </div>
        )}
      </div>

      {expandedSignal && viewMode === "overlay" && (
        <div className="inv-expanded-banner">
          <span>
            Expanded: <strong>{dataset.signalCatalog?.find((s) => s.id === expandedSignal)?.label || expandedSignal}</strong>
          </span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setExpandedSignal(null)}>
            Show all overlay signals
          </button>
        </div>
      )}

      <div className={"inv-chart" + recorderClass}>
        {viewMode === "overlay" ? (
          <InvestigationChart
            concept={concept}
            scenario={scenario}
            dataset={dataset}
            height={height}
            chrome={false}
            view={view}
            onViewChange={setView}
            rangeId={rangeId}
            onRangeIdChange={setRangeId}
            activeSignals={expandedSignal ? new Set([expandedSignal]) : activeSignals}
            onActiveSignalsChange={setActiveSignals}
            scrubIdx={scrubIdx != null ? scrubIdx - start : null}
            onScrubChange={(local) => setScrubIdx(local != null ? start + local : null)}
            showBrush={false}
          />
        ) : (
          <InvestigationSignalGrid
            dataset={dataset}
            view={view}
            scrubIdx={scrubGlobal}
            onScrubChange={setScrubIdx}
            activeSignals={activeSignals}
            onSignalClick={handleGridSelect}
            onExpandSignal={handleExpand}
            sortBy={gridSort}
          />
        )}

        {scrubGlobal != null && viewMode === "grid" && (
          <div className="inv-grid-scrub-bar mono tnum">
            {window.invFormatChartDateTime?.(dataset.dates[scrubGlobal])}
            {" · "}
            {dataset.signalCatalog
              ?.filter((s) => (s.anomalyScore || 0) >= 2.5)
              .slice(0, 5)
              .map((s) => {
                const v = dataset.signals[s.id]?.values[scrubGlobal];
                return `${s.short} ${v}${s.unit ? " " + s.unit : ""}`;
              })
              .join(" · ")}
          </div>
        )}

        <window.BrushSelector
          dataset={dataset}
          view={view}
          onViewChange={setView}
          activeSignals={activeSignals}
          pad={{ l: 44, r: 44, t: 16, b: 28 }}
          w={900}
        />

        <div className="inv-chart-foot">
          <span className="mono" style={{ fontSize: 10 }}>
            {viewMode === "overlay"
              ? `${activeSignals.size} signal${activeSignals.size !== 1 ? "s" : ""} in overlay · legend toggles traces`
              : `Grid scan · ${activeSignals.size} selected for overlay`}
          </span>
          {viewMode === "grid" && activeSignals.size > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setViewMode("overlay")}>
              Open overlay ({activeSignals.size}) →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

window.InvestigationWorkspace = InvestigationWorkspace;
