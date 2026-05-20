// reports.jsx — Reports list (mobile-friendly density).

function ReportsScreen({ go }) {
  const Ic = window.Icons;
  const items = [
    { id: "RPT-042", title: "Fleet health summary", sub: "Weekly · all sites", when: "Mon 19 May" },
    { id: "RPT-041", title: "Predicted interventions", sub: "30-day horizon", when: "12 May" },
    { id: "RPT-038", title: "Avoided downtime", sub: "Q2 cumulative", when: "1 May" },
    { id: "RPT-035", title: "Alarm activity", sub: "Rules fired · 24h", when: "28 Apr" },
  ];

  return (
    <div className="page-body fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-sub">{items.length} recent · shared with plant leads</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm btn-ghost" title="Filter"><Ic.filter size={14} /></button>
          <button className="btn btn-sm" title="New report"><Ic.plus size={14} /></button>
        </div>
      </div>

      <div className="card list-card" style={{ padding: 0, overflow: "hidden" }}>
        {items.map((r, i) => (
          <div
            key={r.id}
            className="row-hover report-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
              padding: "11px 14px",
              alignItems: "center",
              borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
              cursor: "pointer",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{r.sub}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{r.id}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{r.when}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ReportsScreen = ReportsScreen;
