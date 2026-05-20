// site-charts.jsx — Site view visualizations (v1 chart language)

function SiteSummaryStrip({ siteId }) {
  const data = window.getSiteChartData(siteId);
  if (!data) return null;
  return (
    <div className="site-chart-strip">
      <SiteHealthTimelineCompact data={data} />
      <OpenIssuesAreaChart data={data} />
      <SiteParetoChart pareto={data.pareto} />
      <UpcomingWorkStrip upcoming={data.upcoming} />
    </div>
  );
}

function SiteHealthTimelineCompact({ data }) {
  const hist = data.healthHistory;
  const fc = data.healthForecast;
  const histLen = hist.length;
  const fcLen = fc.mid.length;
  const total = histLen + fcLen;
  const h = 108;
  const w = 400;
  const pad = { l: 32, r: 8, t: 10, b: 22 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const minY = Math.min(...hist, ...fc.low) - 2;
  const maxY = Math.max(...hist, ...fc.high) + 2;
  const xAt = (i) => pad.l + (i / (total - 1)) * plotW;
  const yAt = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
  const todayX = xAt(histLen - 1);

  return (
    <div className="site-chart-cell">
      <div className="site-chart-label">Site health · 90d</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
        <line x1={pad.l} x2={w - pad.r} y1={yAt(minY + (maxY - minY) * 0.5)} y2={yAt(minY + (maxY - minY) * 0.5)} stroke="var(--chart-grid, var(--line))" strokeWidth={1} />
        <path d={window.chartBandPath(fc.low, fc.high, (i) => xAt(histLen + i), yAt)} className="fleet-fc-band" />
        <path d={window.chartSeriesPath(hist, (i) => xAt(i), yAt)} className="fleet-hist-line" />
        <path d={window.chartSeriesPath(fc.mid, (i) => xAt(histLen + i), yAt)} className="fleet-fc-line" />
        <line x1={todayX} x2={todayX} y1={pad.t} y2={h - pad.b} className="fleet-today-line" />
        <text x={todayX + 3} y={pad.t + 8} className="fleet-today-label">Today</text>
      </svg>
      <div className="site-chart-foot">+30d forecast band</div>
    </div>
  );
}

function OpenIssuesAreaChart({ data }) {
  const weeks = data.issuesOverTime;
  const h = 108;
  const w = 400;
  const pad = { l: 28, r: 8, t: 10, b: 22 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const max = Math.max(...weeks.map((wk) => wk.crit + wk.warn), 1);
  const n = weeks.length;
  const barW = plotW / n;

  let warnArea = "";
  let critArea = "";
  weeks.forEach((wk, i) => {
    const x = pad.l + i * barW + barW / 2;
    const warnH = (wk.warn / max) * plotH;
    const critH = (wk.crit / max) * plotH;
    const baseY = h - pad.b;
    warnArea += (i ? "L" : "M") + x.toFixed(1) + "," + (baseY - warnH).toFixed(1) + " ";
    critArea += (i ? "L" : "M") + x.toFixed(1) + "," + (baseY - warnH - critH).toFixed(1) + " ";
  });
  const closeWarn = `L${(pad.l + (n - 1) * barW + barW / 2).toFixed(1)},${(h - pad.b).toFixed(1)} L${(pad.l + barW / 2).toFixed(1)},${(h - pad.b).toFixed(1)} Z`;
  const closeCritBase = weeks.map((wk, i) => {
    const x = pad.l + i * barW + barW / 2;
    const warnH = (wk.warn / max) * plotH;
    return "L" + x.toFixed(1) + "," + (h - pad.b - warnH).toFixed(1);
  }).reverse().join(" ");

  return (
    <div className="site-chart-cell">
      <div className="site-chart-label">Open issues · 90d</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
        <path d={warnArea + closeWarn} fill="color-mix(in srgb, var(--warn) 18%, transparent)" stroke="none" />
        <path d={critArea + " " + closeCritBase + " Z"} fill="color-mix(in srgb, var(--crit) 22%, transparent)" stroke="none" />
        <polyline points={weeks.map((wk, i) => {
          const x = pad.l + i * barW + barW / 2;
          const y = h - pad.b - ((wk.warn + wk.crit) / max) * plotH;
          return x.toFixed(1) + "," + y.toFixed(1);
        }).join(" ")} fill="none" stroke="var(--chart-1)" strokeWidth={1} />
      </svg>
      <div className="site-chart-foot">
        <span className="site-leg"><i style={{ background: "var(--warn)" }} /> Watch</span>
        <span className="site-leg"><i style={{ background: "var(--crit)" }} /> Critical</span>
      </div>
    </div>
  );
}

function SiteParetoChart({ pareto }) {
  const max = Math.max(...pareto.map((p) => p.count), 1);
  return (
    <div className="site-chart-cell">
      <div className="site-chart-label">Issue category · pareto</div>
      <div className="site-pareto-compact">
        {pareto.map((p) => (
          <div key={p.label} className="fleet-pareto-row">
            <div className="fleet-pareto-label">{p.label}</div>
            <div className="fleet-pareto-track">
              <i style={{ width: (p.count / max) * 100 + "%" }} />
            </div>
            <div className="mono tnum fleet-pareto-val">{p.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingWorkStrip({ upcoming }) {
  const labels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const max = Math.max(...upcoming.map((w) => w.planned + w.predictive), 1);
  return (
    <div className="site-chart-cell">
      <div className="site-chart-label">Upcoming work · 30 days</div>
      <div className="site-upcoming-strip">
        {upcoming.map((w, i) => {
          const total = w.planned + w.predictive;
          return (
            <div key={i} className="site-upcoming-col">
              <div className="site-upcoming-stack" style={{ height: Math.max(6, (total / max) * 52) + "px" }}>
                {w.predictive > 0 && <i className="predict" style={{ flex: w.predictive }} />}
                {w.planned > 0 && <i className="planned" style={{ flex: w.planned }} />}
              </div>
              <span className="mono">{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <div className="site-chart-foot">
        <span className="site-leg"><i style={{ background: "var(--chart-4)" }} /> Planned</span>
        <span className="site-leg"><i style={{ background: "var(--forecast)" }} /> Predictive</span>
      </div>
    </div>
  );
}

function WhatChangedThisWeek({ siteId }) {
  const data = window.getSiteChartData(siteId);
  if (!data?.weeklyChanges?.length) return null;
  return (
    <div className="card site-changed-panel">
      <div className="eyebrow" style={{ marginBottom: 10 }}>What changed this week</div>
      <ul className="site-changed-list">
        {data.weeklyChanges.map((item, i) => (
          <li key={i}>
            <span className={"dot " + statusToClass(item.kind === "forecast" ? "unknown" : item.kind === "ok" ? "ok" : item.kind)} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteActivityFeed({ siteId, go }) {
  const data = window.getSiteChartData(siteId);
  if (!data?.activity?.length) return null;
  const typeLabel = { alarm: "Alarm", service: "Service", work: "Maintenance", offline: "Offline" };
  const typeClass = { alarm: "warn", service: "ok", work: "forecast", offline: "unknown" };

  return (
    <div className="card site-activity-feed">
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Site activity · last 30 days</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Alarms, maintenance, service visits, sensor gaps</div>
        </div>
      </div>
      <div className="site-activity-list">
        {data.activity.map((ev, i) => (
          <div key={i} className="site-activity-row" onClick={() => ev.machine && go("machine:" + ev.machine)}>
            <div className="site-activity-date mono tnum">{ev.day}</div>
            <div className="site-activity-track">
              <span className={"site-activity-dot " + (typeClass[ev.type] || "ok")} />
              {i < data.activity.length - 1 && <span className="site-activity-line" />}
            </div>
            <div className="site-activity-body">
              <div style={{ fontSize: 13, color: "var(--ink-1)", lineHeight: 1.4 }}>{ev.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>
                <span className="tag tag-outline" style={{ fontSize: 10, marginRight: 6 }}>{typeLabel[ev.type] || ev.type}</span>
                {ev.machine && <span className="mono">{ev.machine}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloorPlanThumbnail({ machines, go, onOpenTab }) {
  const areas = [...new Set(machines.map((m) => m.area))].slice(0, 4);
  return (
    <div className="card site-floor-thumb" onClick={onOpenTab} role="button" tabIndex={0}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Floor plan</div>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Open tab →</span>
      </div>
      <div className="site-floor-thumb-grid">
        {areas.map((area) => {
          const here = machines.filter((m) => m.area === area);
          return (
            <div key={area} className="site-floor-thumb-bay">
              <div className="site-floor-thumb-label">{area.split(" ")[0]}</div>
              <div className="site-floor-thumb-dots">
                {here.slice(0, 6).map((m) => (
                  <span key={m.id} className={"dot " + statusToClass(m.status)} title={m.name} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  SiteSummaryStrip,
  WhatChangedThisWeek,
  SiteActivityFeed,
  FloorPlanThumbnail,
});
