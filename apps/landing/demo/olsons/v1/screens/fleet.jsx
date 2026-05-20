// fleet.jsx — Fleet overview screen, two directions.
//   "list" = calm list-first (default)
//   "map"  = map + side panel (Leaflet · Carto light)

const { useState: useStateFleet, useRef, useEffect } = React;

const FLEET_MARKER_COLORS = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)" };
const SWEDEN_BOUNDS = [[55.2, 10.8], [69.2, 24.2]];

function siteStatus(site) {
  if (site.critical) return "crit";
  if (site.attention >= 3 || site.health < 75) return "warn";
  return "ok";
}

function siteMapStatus(site) {
  return siteStatus(site);
}

function SwedenMap({ sites, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const didFitRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof L === "undefined") return;

    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 12,
    }).addTo(map);

    map.fitBounds(SWEDEN_BOUNDS, { padding: [16, 16] });
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      didFitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L === "undefined") return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    sites.forEach((site) => {
      const [lon, lat] = site.coord;
      const status = siteMapStatus(site);
      const color = FLEET_MARKER_COLORS[status];
      const selected = site.id === selectedId;

      const icon = L.divIcon({
        className: "fleet-marker-wrap",
        html: `<span class="fleet-marker${selected ? " is-selected" : ""}" style="--marker-color:${color}"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([lat, lon], { icon })
        .addTo(map)
        .bindTooltip(site.city || site.name, {
          direction: "top",
          offset: [0, -10],
          className: "fleet-map-tooltip",
        })
        .on("click", () => onSelect && onSelect(selected ? null : site.id));

      markersRef.current.push(marker);
    });

    if (sites.length && !didFitRef.current) {
      const bounds = L.latLngBounds(sites.map((s) => [s.coord[1], s.coord[0]]));
      map.fitBounds(bounds.pad(0.12));
      didFitRef.current = true;
    }
  }, [sites, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const site = sites.find((s) => s.id === selectedId);
    if (!site) return;
    map.panTo([site.coord[1], site.coord[0]], { animate: true, duration: 0.35 });
  }, [selectedId, sites]);

  return (
    <div className="card fleet-map-card" ref={containerRef} aria-label="Map of Sweden with fleet sites" />
  );
}

function SiteMapPanel({ site, onOpen, onClose }) {
  if (!site) {
    return <FleetPanelAggregates />;
  }

  const status = siteMapStatus(site);
  const openAlerts = window.alertsAt(site.id).filter((a) => a.status === "open" && a.severity !== "info").slice(0, 2);

  return (
    <div className="card fleet-map-panel">
      <div className="fleet-map-panel-head">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{site.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{site.city} · {site.country}</div>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">
          <window.Icons.x size={14} />
        </button>
      </div>

      <HealthBar value={site.health} status={status} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--ink-3)" }}>
        <span><span className="mono tnum" style={{ color: "var(--ink-1)", fontWeight: 500 }}>{site.machineCount}</span> machines</span>
        <span>
          {site.attention > 0 ? (
            <><span className={"mono tnum t-" + status}>{site.attention}</span> need attention</>
          ) : (
            <span className="t-ok">All healthy</span>
          )}
        </span>
      </div>

      {site.areas?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Areas</div>
          <div className="fleet-map-panel-areas">
            {site.areas.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {openAlerts.length > 0 && (
        <div style={{ marginTop: 14, flex: 1, minHeight: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Open issues</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {openAlerts.map((a) => (
              <div key={a.id} style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-2)" }}>
                <span className={"dot " + statusToClass(a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : "unknown")} style={{ marginRight: 6 }} />
                {a.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {(site.contact || site.sparesLocation) && (
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>
          {site.contact && (
            <div><span style={{ color: "var(--ink-4)" }}>Contact · </span>{site.contact}{site.contactRole ? ` · ${site.contactRole}` : ""}</div>
          )}
          {site.sparesLocation && (
            <div style={{ marginTop: 4 }}><span style={{ color: "var(--ink-4)" }}>Spares · </span>{site.sparesLocation}</div>
          )}
        </div>
      )}

      <button type="button" className="btn btn-sm" style={{ marginTop: "auto", alignSelf: "flex-start" }} onClick={() => onOpen(site.id)}>
        Open site
      </button>
    </div>
  );
}

function SiteRankList({ sites, onOpen }) {
  const sorted = [...sites].sort((a, b) => {
    const order = { crit: 0, warn: 1, ok: 2 };
    const sa = siteStatus(a), sb = siteStatus(b);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return b.attention - a.attention || a.name.localeCompare(b.name);
  });

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="rank-head">
        <div>Site</div>
        <div>Health</div>
        <div>Machines</div>
        <div>Attention</div>
        <div></div>
      </div>
      {sorted.map((s) => {
        const status = siteStatus(s);
        return (
          <div key={s.id} className="rank-row row-hover" onClick={() => onOpen(s.id)}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{s.city || s.country}</div>
            </div>
            <div className="mono tnum" style={{ fontSize: 15 }}>{s.health}</div>
            <div className="mono tnum t-3">{s.machineCount}</div>
            <div className={s.attention > 0 ? "mono tnum t-" + status : "t-3"}>
              {s.attention > 0 ? s.attention : "—"}
            </div>
            <div style={{ color: "var(--ink-4)", display: "flex", justifyContent: "flex-end" }}>
              <window.Icons.chevR size={14} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fleetClusterItems(kpi) {
  const charts = window.FLEET_CHARTS;
  return [
    {
      label: "Fleet health",
      value: kpi.health,
      sub: "of 100 · synced 2 min ago",
      chart: <KpiHealthSparkline values={charts.health30d} />,
    },
    {
      label: "Needs attention",
      value: kpi.open,
      sub: `${kpi.critical} critical · ${kpi.open - kpi.critical} watch`,
      emphasis: kpi.critical > 0,
      chart: <KpiAttentionBar critical={kpi.critical} watch={kpi.open - kpi.critical} />,
    },
    {
      label: "Predicted · 30 days",
      value: kpi.forecastNext30,
      sub: "before alarm threshold",
      chart: <KpiInterventionBars weeks={charts.interventions4w} />,
    },
    {
      label: "Avoided downtime",
      value: kpi.avoidedDowntime30,
      sub: kpi.avoidedSavings30 + " estimated saved",
      chart: <KpiCumulativeLine values={charts.avoidedCumulative} />,
    },
  ];
}

// ─── Attention item ────────────────────────────────────────────────────────
function AttentionItem({ alert, onOpen }) {
  const m = window.getMachine(alert.machine);
  const site = window.getSite(alert.site);
  const sev = alert.severity === "crit" ? "crit" : alert.severity === "warn" ? "warn" : alert.severity === "unknown" ? "unknown" : "warn";
  const trend = m?.trendKey || (sev === "crit" ? "spike" : sev === "unknown" ? "offline" : "drift");
  return (
    <div className="insight" onClick={() => onOpen(alert.id)}>
      <div className="insight-bullet">
        <span className={"dot " + statusToClass(sev)}/>
      </div>
      <div className="insight-body">
        <p className="insight-title">{alert.pl}</p>
        <div className="insight-meta">
          <span className="b">{m?.name || alert.machine}</span>
          <span className="mono">{m?.id}</span>
          <span>{site?.name}</span>
          <span>·</span>
          <span>{alert.raised}</span>
          {alert.confidence != null && (
            <>
              <span>·</span>
              <span className="mono">{alert.confidence}%</span>
            </>
          )}
        </div>
      </div>
      <div className={"insight-spark t-" + statusToClass(sev)}>
        <Sparkline shape={trend} w={60} h={18} />
      </div>
      <div className="insight-actions">
        <button className="btn btn-sm btn-ghost">View</button>
      </div>
    </div>
  );
}

// ─── Forecast bar ───────────────────────────────────────────────────────────
function ForecastTimeline({ items, onOpen }) {
  const weeksMax = 8;
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "baseline", justifyContent: "space-between"}}>
        <div>
          <div style={{fontSize: 14, fontWeight: 600}}>Forecast · next 8 weeks</div>
          <div style={{fontSize: 12, color: "var(--ink-3)", marginTop: 2}}>Predicted before alarm threshold</div>
        </div>
        <span className="ai-badge">Predictive</span>
      </div>

      <div style={{padding: "0 16px 12px"}}>
        <div style={{display: "grid", gridTemplateColumns: "minmax(100px, 0.8fr) minmax(0, 1fr) 48px", gap: 16, padding: "8px 0", fontSize: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", borderBottom: "1px solid var(--line)"}}>
          <div>Machine</div>
          <div>Projection</div>
          <div style={{textAlign: "right"}}>Conf.</div>
        </div>

        {items.map((it, i) => {
          const m = window.getMachine(it.machine);
          const x = Math.min(weeksMax - 0.5, Math.max(0.3, it.weeks));
          const pct = (x / weeksMax) * 100;
          return (
            <div key={i}
                 onClick={() => onOpen && onOpen(it.machine)}
                 style={{display: "grid", gridTemplateColumns: "minmax(100px, 0.8fr) minmax(0, 1fr) 48px", gap: 16, alignItems: "center", padding: "10px 0", cursor: "pointer", borderTop: i > 0 ? "1px solid var(--line)" : "none"}}>
              <div style={{fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{m?.name || it.machine}</div>
              <div style={{position: "relative", height: 4, background: "var(--line)"}}>
                <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--forecast)"}} />
                <div style={{position: "absolute", left: `${pct}%`, top: -14, transform: "translateX(-50%)", fontSize: 11, color: "var(--ink-2)", whiteSpace: "nowrap", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis"}}>
                  {it.text}
                </div>
              </div>
              <div className="mono tnum" style={{fontSize: 12, color: "var(--ink-3)", textAlign: "right"}}>
                {Math.round(it.confidence * 100)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Site card (right column or grid) ──────────────────────────────────────
function SiteCard({ site, onOpen, compact }) {
  const status = siteStatus(site);
  return (
    <div className="card row-hover"
         onClick={() => onOpen(site.id)}
         style={{padding: compact ? "10px 12px" : "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8}}>
        <div style={{fontWeight: 500, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{site.name}</div>
        <span style={{fontSize: 12, color: "var(--ink-3)", flexShrink: 0}}>{site.city || site.country}</span>
      </div>
      <HealthBar value={site.health} status={status} />
      <div style={{display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)"}}>
        <span><span className="mono tnum" style={{color: "var(--ink-1)"}}>{site.machineCount}</span> machines</span>
        <span>
          {site.attention > 0 ? (
            <><span className={"mono tnum t-" + status}>{site.attention}</span> need attention</>
          ) : (
            <span className="t-ok">All healthy</span>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Direction A — list-first ──────────────────────────────────────────────
function FleetListFirst({ go }) {
  const { ALERTS, FORECAST, FLEET_KPI, SITES } = window.DATA;
  const [selectedMapSite, setSelectedMapSite] = useStateFleet(null);
  const selectedSite = selectedMapSite ? window.getSite(selectedMapSite) : null;
  const attentionAlerts = ALERTS.filter(a => a.status === "open" && a.severity !== "info")
    .sort((a,b) => {
      const order = {crit: 0, warn: 1, unknown: 2, info: 3};
      return order[a.severity] - order[b.severity];
    });

  return (
    <div className="page-body fade-in">
      <div className="page-h page-h-quiet">
        <div>
          <p className="page-greeting">Good morning, Klaus.</p>
          <p className="page-sub">
            <span className="t-crit">1 critical</span>, <span className="t-warn">4 watch</span>, 1 offline across 6 sites
          </p>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost">Today · 19 May</button>
        </div>
      </div>

      <InstrumentCluster items={fleetClusterItems(FLEET_KPI)} />

      <div className="section" style={{ marginBottom: 24 }}>
        <FleetHealthTimeline />
      </div>

      <div className="section">
        <SectionH
          title="Sites across Sweden"
          sub="Click a marker to view site health and open issues"
        />
        <div className="fleet-map-layout">
          <SwedenMap sites={SITES} selectedId={selectedMapSite} onSelect={setSelectedMapSite} />
          <SiteMapPanel
            site={selectedSite}
            onOpen={(id) => go("site:" + id)}
            onClose={() => setSelectedMapSite(null)}
          />
        </div>
      </div>

      <div className="section">
        <PredictedInterventions90 />
      </div>

      <div className="section">
        <SectionH
          title="Needs your attention today"
          sub="Ordered by urgency"
          right={
            <div style={{display:"flex", gap:8}}>
              <button className="btn btn-sm btn-ghost">All severities</button>
            </div>
          }
        />
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {attentionAlerts.map((a) => (
            <AttentionItem key={a.id} alert={a} onOpen={(id) => go("alert:" + id)} />
          ))}
          {attentionAlerts.length === 0 && (
            <div style={{padding: "32px 16px", textAlign: "center", color: "var(--ink-3)"}}>
              <div style={{fontSize: 14, color: "var(--ink-1)"}}>Nothing demands action right now.</div>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <SectionH title="Sites" sub="Ranked by urgency · Sweden" />
        <SiteRankList sites={SITES} onOpen={(id) => go("site:" + id)} />
      </div>

      <div className="section">
        <SectionH title="What's coming" sub="Models predict, you plan."
          right={<button className="btn btn-sm btn-ghost">View all</button>} />
        <ForecastTimeline items={FORECAST} onOpen={(mid) => go("machine:" + mid)} />
      </div>
    </div>
  );
}

// ─── Direction B — site-rank-first ───────────────────────────────────────────
function FleetMapFirst({ go }) {
  const { ALERTS, SITES, FLEET_KPI, FORECAST } = window.DATA;
  const [selectedMapSite, setSelectedMapSite] = useStateFleet(null);
  const selectedSite = selectedMapSite ? window.getSite(selectedMapSite) : null;
  const attentionAlerts = ALERTS.filter(a => a.status === "open" && a.severity !== "info").slice(0, 6);

  return (
    <div className="page-body fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Fleet</h1>
          <div className="page-sub">6 sites · 230 machines · Sweden</div>
        </div>
      </div>

      <div className="section">
        <SectionH title="Fleet map" sub="Sites across Sweden" />
        <div className="fleet-map-layout">
          <SwedenMap sites={SITES} selectedId={selectedMapSite} onSelect={setSelectedMapSite} />
          <SiteMapPanel site={selectedSite} onOpen={(id) => go("site:" + id)} onClose={() => setSelectedMapSite(null)} />
        </div>
      </div>

      <InstrumentCluster items={fleetClusterItems(FLEET_KPI)} />

      <div className="section" style={{ marginBottom: 24 }}>
        <FleetHealthTimeline />
      </div>

      <div className="section">
        <PredictedInterventions90 />
      </div>

      <div className="section">
        <SectionH title="Needs attention" />
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {attentionAlerts.map((a) => {
            const m = window.getMachine(a.machine);
            const s = window.getSite(a.site);
            const sev = a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : a.severity === "unknown" ? "unknown" : "warn";
            const trend = m?.trendKey || (sev === "crit" ? "spike" : sev === "unknown" ? "offline" : "drift");
            return (
              <div key={a.id}
                onClick={() => go("alert:" + a.id)}
                style={{padding: "12px 16px", borderBottom: "1px solid var(--line)", cursor: "pointer", display:"flex", gap: 12, alignItems: "center"}}>
                <span className={"dot " + statusToClass(sev)} style={{flexShrink: 0}}/>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 14, fontWeight: 500, lineHeight: 1.4}}>{a.title}</div>
                  <div style={{fontSize: 12, color: "var(--ink-3)", marginTop: 4}}>{m?.name} · {s?.name.split(" ")[0]}</div>
                </div>
                <div className={"t-" + statusToClass(sev)} style={{ flexShrink: 0 }}>
                  <Sparkline shape={trend} w={60} h={18} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <SectionH title="Forecast" sub="Next 8 weeks" />
        <ForecastTimeline items={FORECAST} onOpen={(mid) => go("machine:" + mid)} />
      </div>
    </div>
  );
}

function FleetScreen({ direction, go }) {
  return direction === "map" ? <FleetMapFirst go={go}/> : <FleetListFirst go={go}/>;
}

window.FleetScreen = FleetScreen;
