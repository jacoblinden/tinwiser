// investigate.jsx — Chart-first investigation concepts (design review screen).

const { useState: useStateInv, useMemo: useMemoInv } = React;

const CONCEPTS = [
  {
    id: "terminal",
    name: "A · Terminal",
    blurb: "Dual-axis instrument layout inspired by financial terminals. Left scale for vibration (mm/s), right for temperature and current. Tabular scrub values below the plot — not tooltips.",
  },
  {
    id: "recorder",
    name: "B · Recorder",
    blurb: "Analog chart-recorder aesthetic: warm paper ground, hairline grid, dashed rolling baseline, shaded deviation band. Multiple pens trace in restrained ink colors.",
  },
  {
    id: "overlay",
    name: "C · Overlay",
    blurb: "Normalized overlay mode for correlation at a glance — every visible signal shares 0–100% of its local range. Toggle back to absolute scales for threshold reading.",
  },
];

const SCENARIOS = [
  {
    id: "healthy",
    label: "Healthy browse",
    desc: "Operator checking a fine machine — single signal, 30-day window, no alert band.",
  },
  {
    id: "concern",
    label: "Active concern",
    desc: "Trending vibration with baseline divergence, three correlated signals, event annotations, model-flagged window.",
  },
  {
    id: "drill-in",
    label: "Onset drill-in",
    desc: "Zoomed to 7 days around when the slope accelerated — scrubbing the moment before alert opened.",
  },
];

function InvestigateScreen({ go }) {
  const [concept, setConcept] = useStateInv("terminal");
  const [scenario, setScenario] = useStateInv("concern");

  const scenarioMeta = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[1];
  const conceptMeta = CONCEPTS.find((c) => c.id === concept) || CONCEPTS[0];

  const dataset = useMemoInv(() => window.getInvestigationDataset(scenario), [scenario]);

  return (
    <div className="page-body fade-in investigate-page">
      <div className="investigate-intro">
        <div className="eyebrow" style={{ marginBottom: 6 }}>Design exploration · data visualization</div>
        <h1>Machine investigation chart</h1>
        <p>
          Chart-first concepts for the investigative workflow: confirm the problem, locate onset,
          find correlated signals, decide action. Toggle <strong>Overlay</strong> (correlation) vs <strong>Signal grid</strong> (scan all channels).
          Three overlay visual treatments × three operator scenarios.
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-sm" onClick={() => go("machine:WLF-P04")}>
            Open WLF-P04 machine →
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => go("machine:WLF-P01")}>
            Healthy press (P01)
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => go("alert:ALR-2401")}>
            Source alert →
          </button>
        </div>
      </div>

      <SectionH title="Concept" sub="Three visual treatments — switch to compare" />
      <div className="concept-picker">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={concept === c.id ? "active" : ""}
            onClick={() => setConcept(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <SectionH title="Scenario" sub="Same machine story at three investigation stages" />
      <div className="scenario-strip">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={scenario === s.id ? "active" : ""}
            onClick={() => setScenario(s.id)}
          >
            {s.label}
          </button>
        ))}
        <span className="scenario-desc">{scenarioMeta.desc}</span>
      </div>

      <InvestigationWorkspace
        key={scenario}
        concept={concept}
        onConceptChange={setConcept}
        showConceptPicker
        scenario={scenario}
        dataset={dataset}
        height={scenario === "drill-in" ? 300 : 280}
      />

      <div className="concept-note">
        <strong>{conceptMeta.name}.</strong> {conceptMeta.blurb}
        {scenario === "concern" && concept === "terminal" && (
          <>
            {" "}
            Switch to <strong>Signal grid</strong> to scan all channels — vibration DE sorts first by anomaly score.
            In overlay, <span className="t-warn">scrub</span> mid-April to see vibration leave the baseline band while temperature stays flat.
          </>
        )}
        {scenario === "drill-in" && (
          <>
            {" "}
            Note the <strong>alert opened</strong> marker vs. the earlier slope — operators verify whether the system flagged at the right moment.
          </>
        )}
      </div>

      <div style={{ height: 32 }} />

      <SectionH
        title="Capabilities in this prototype"
        sub="Interactive — scrub, toggle signals, drag range window, switch presets"
      />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {[
          ["Multi-signal overlay", "Toggle signals in the legend; dual Y-axis (or normalized) handles scale mismatch."],
          ["Baseline + deviation", "Rolling baseline and band on primary vibration — divergence visible without mental math."],
          ["Time range", "24h–1y presets plus draggable brush; drill-in scenario defaults to 7d around onset."],
          ["Event annotations", "Service, recipe change, sensor gap, alert opened — vertical ticks on the timeline."],
          ["Scrub values table", "Hover or drag on chart; all visible signals at that timestamp in tabular figures."],
          ["Model flag band", "Shaded region from when the system marked deviation — verify system reasoning."],
          ["Signal grid", "24 channels as small multiples — synchronized scrub, sort by anomaly or subsystem, click to add to overlay."],
        ].map(([title, body], i) => (
          <div
            key={title}
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 16,
              padding: "12px 18px",
              borderBottom: i < 6 ? "1px solid var(--line)" : "none",
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 500, color: "var(--ink)" }}>{title}</div>
            <div style={{ color: "var(--ink-2)", lineHeight: 1.45 }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: "var(--ink-3)" }}>
        Advanced views from the brief (FFT spectrogram, scatter correlation, fleet comparison, press force curves)
        are out of scope for this round — chart interaction and aesthetic first.
      </div>
    </div>
  );
}

window.InvestigateScreen = InvestigateScreen;
