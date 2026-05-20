// alert.jsx — Alert detail — the "feels like a useful colleague" page.

const { useState: useStateAlert } = React;

function AlertScreen({ alertId, go }) {
  const Ic = window.Icons;
  const a = window.getAlert(alertId);
  if (!a) return <div className="page-body">Unknown alert.</div>;
  const m = window.getMachine(a.machine);
  const site = window.getSite(a.site);

  const [checked, setChecked] = useStateAlert({});

  const sevClass = statusToClass(a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : a.severity === "unknown" ? "unknown" : "warn");
  const mapsUrl = site?.coord
    ? `https://maps.google.com/?q=${site.coord[1]},${site.coord[0]}`
    : site?.address
      ? `https://maps.google.com/?q=${encodeURIComponent(site.address)}`
      : null;
  const parts = a.parts || [];
  const tools = a.tools || [];

  return (
    <div className="page-body fade-in" style={{maxWidth: 1100}}>
      {/* Header strip */}
      <div className="alert-page-header" style={{marginBottom: 14}}>
        <div className="page-h" style={{alignItems: "center", marginBottom: 0}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap: 10, marginBottom: 6}}>
              <StatusTag status={sevClass}>{severityLabel(a.severity)}</StatusTag>
              <span className="mono t-4" style={{fontSize: 11.5}}>{a.id}</span>
              <span className="t-3" style={{fontSize: 11.5}}>· Raised {a.raised}</span>
              {a.confidence != null && (
                <>
                  <span className="t-3" style={{fontSize: 11.5}}>· </span>
                  <span className="ai-badge" style={{fontSize: 10.5}}>Detected by Cadence · {a.confidence}% confidence</span>
                </>
              )}
            </div>
            <h1 className="page-title">{a.title}</h1>
            <div className="page-sub" style={{display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap"}}>
              <MachineIcon type={m?.type} size={13} />
              <span onClick={() => go("machine:" + m.id)} style={{cursor: "pointer", color: "var(--ink-2)", borderBottom: "1px dashed var(--line-2)", whiteSpace: "nowrap"}}>{m?.name}</span>
              <span>·</span>
              <span onClick={() => go("site:" + site.id)} style={{cursor: "pointer", color: "var(--ink-2)", borderBottom: "1px dashed var(--line-2)", whiteSpace: "nowrap"}}>{site?.name}</span>
              <span>·</span>
              <span style={{whiteSpace: "nowrap"}}>Area: {m?.area}</span>
            </div>
          </div>
          <div className="alert-header-actions" style={{display:"flex", gap: 8, alignItems: "center"}}>
            <button className="btn btn-sm btn-ghost" title="Snooze"><Ic.bell size={13}/> Snooze</button>
            <button className="btn btn-sm btn-ghost" title="Dismiss"><Ic.x size={13}/> Dismiss</button>
          </div>
        </div>
      </div>

      {/* The brief — plain-language summary */}
      <div className="card alert-brief" style={{padding: "22px 26px", marginBottom: 22, background: "var(--surface)", borderLeft: `3px solid var(--${sevClass})`}}>
        <div className="eyebrow" style={{marginBottom: 8}}>Pre-visit briefing</div>
        <p style={{margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--ink-1)", letterSpacing: "-0.005em"}}>
          {a.pl}
        </p>
      </div>

      {(site?.phone || site?.address || mapsUrl) && (
        <div className="card alert-contact-card" style={{padding: "4px 16px", marginBottom: 22, overflow: "hidden"}}>
          {site?.phone && (
            <a href={"tel:" + site.phone.replace(/\s/g, "")}>
              <Ic.user size={14} />
              <span>{site.contact} · {site.phone}</span>
            </a>
          )}
          {site?.address && mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Ic.map size={14} />
              <span>{site.address}</span>
            </a>
          )}
        </div>
      )}

      <div className="two-col" style={{gap: 24}}>
        {/* Left column — actions, parts, why */}
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>

          {/* Recommended actions */}
          {a.actions && a.actions.length > 0 && (
            <div>
              <SectionH title="Repair sequence" sub="Tap to mark done as you go." />
              <div className="card alert-actions-list alert-repair-sequence" style={{padding: 0, overflow: "hidden"}}>
                {a.actions.map((action, i) => (
                  <div key={i} onClick={() => setChecked((c) => ({...c, [i]: !c[i]}))}
                       style={{display: "grid", gridTemplateColumns: "22px 1fr auto", gap: 14,
                                padding: "14px 18px",
                                borderBottom: i < a.actions.length - 1 ? "1px solid var(--line)" : "none",
                                cursor: "pointer", alignItems: "center"}}
                       className="row-hover alert-action-row">
                    <div style={{width: 18, height: 18, borderRadius: 4,
                                  border: "1.5px solid " + (checked[i] ? "var(--ok)" : "var(--line-strong)"),
                                  background: checked[i] ? "var(--ok)" : "transparent",
                                  display: "grid", placeItems: "center", color: "white"}}>
                      {checked[i] && <Ic.check size={12} />}
                    </div>
                    <div>
                      <div style={{fontSize: 14, color: checked[i] ? "var(--ink-3)" : "var(--ink-1)",
                                    fontWeight: action.primary ? 500 : 400,
                                    textDecoration: checked[i] ? "line-through" : "none"}}>
                        {action.text}
                      </div>
                      {action.primary && !checked[i] && (
                        <div style={{fontSize: 11.5, color: "var(--accent)", marginTop: 2, fontWeight: 500}}>
                          Primary action
                        </div>
                      )}
                    </div>
                    <div style={{display: "flex", gap: 6}}>
                      <button className="btn btn-sm btn-ghost">Assign</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why we're flagging this */}
          <div>
            <SectionH title="Why we're flagging this" right={<span className="ai-badge">Explained</span>}/>
            <div className="card" style={{padding: 18}}>
              <p style={{margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-1)"}}>{a.why || "Standard model heuristics on the recent sensor stream."}</p>

              {a.severity === "crit" && (
                <MiniChartReason />
              )}

              <div style={{marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
                           display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16}}
                   className="alert-reason-stats">
                <ReasonStat label="Velocity RMS" value={a.severity === "crit" ? "7.1 mm/s" : "3.6 mm/s"} sub={a.severity === "crit" ? "Zone D (alarm)" : "Below 4.5 alarm"} status={a.severity === "crit" ? "crit" : "warn"} />
                <ReasonStat label="Kurtosis · 36h" value={a.severity === "crit" ? "+98%" : "+12%"} sub={a.severity === "crit" ? "Step change" : "Within expected"} status={a.severity === "crit" ? "crit" : "ok"} />
                <ReasonStat label="Model confidence" value={(a.confidence || 78) + "%"} sub="Trained on 124 bearings" status="forecast" />
              </div>
            </div>
          </div>

          {/* Similar past incidents */}
          {a.similar && a.similar.length > 0 && (
            <div>
              <SectionH title="Similar past incidents"
                        sub="From this and other machines." />
              <PriorCaseOverlay severity={a.severity} />
              <div className="card" style={{padding: 0, overflow: "hidden", marginTop: 12}}>
                {a.similar.map((s, i) => (
                  <div key={i} className="alert-similar-row"
                       style={{display: "grid", gridTemplateColumns: "100px 100px 1fr auto",
                                         gap: 14, padding: "12px 18px",
                                         borderBottom: i < a.similar.length - 1 ? "1px solid var(--line)" : "none",
                                         alignItems: "center"}}>
                    <div className="mono" style={{fontSize: 11.5, color: "var(--ink-3)"}}>{s.ref}</div>
                    <div style={{fontSize: 12.5, fontWeight: 500}}>{s.machine}</div>
                    <div style={{fontSize: 12.5, color: "var(--ink-2)"}}>{s.outcome}</div>
                    <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>{s.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — parts, scheduling, context */}
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>

          {/* Parts & tools */}
          {(parts.length > 0 || tools.length > 0) && (
            <div>
              {parts.length > 0 && (
                <>
                  <SectionH title="Parts to bring" />
                  <div className="card" style={{padding: 0, overflow: "hidden", marginBottom: tools.length > 0 ? 18 : 0}}>
                    <ul className="alert-parts-list">
                      {parts.map((p, i) => (
                        <li key={i} style={{display: "flex", gap: 10, alignItems: "center"}}>
                          <div style={{width: 28, height: 28, borderRadius: 6, background: "var(--surface-2)",
                                        border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-3)", flexShrink: 0}}>
                            <Ic.doc size={14}/>
                          </div>
                          <span style={{flex: 1}}>{p}</span>
                          {i === 0 && a.severity === "crit" && (
                            <span className="tag tag-ok">1 in stock</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              {tools.length > 0 && (
                <>
                  <SectionH title="Tools needed" />
                  <div className="card" style={{padding: 0, overflow: "hidden"}}>
                    <ul className="alert-tools-list">
                      {tools.map((tool, i) => (
                        <li key={i} style={{display: "flex", gap: 10, alignItems: "center"}}>
                          <div style={{width: 28, height: 28, borderRadius: 6, background: "var(--surface-2)",
                                        border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-3)", flexShrink: 0}}>
                            <Ic.wrench size={14}/>
                          </div>
                          <span>{tool}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Legacy single list when only parts, no tools split */}
          {parts.length === 0 && tools.length === 0 && a.parts && a.parts.length > 0 && (
            <div>
              <SectionH title="Parts & tools" />
              <div className="card" style={{padding: 0, overflow: "hidden"}}>
                {a.parts.map((p, i) => (
                  <div key={i} style={{display: "flex", gap: 10, padding: "12px 16px",
                                        borderBottom: i < a.parts.length - 1 ? "1px solid var(--line)" : "none",
                                        alignItems: "center"}}>
                    <div style={{width: 28, height: 28, borderRadius: 6, background: "var(--surface-2)",
                                  border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-3)"}}>
                      <Ic.wrench size={14}/>
                    </div>
                    <div style={{flex: 1, fontSize: 12.5}}>{p}</div>
                    {i === 0 && a.severity === "crit" && (
                      <span className="tag tag-ok">1 in stock</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <SectionH title="Plan this work" />
            <div className="card" style={{padding: 16, display: "flex", flexDirection: "column", gap: 10}}>
              <Field label="Assign to">
                <div style={{display: "flex", gap: 8, alignItems: "center"}}>
                  <div className="avatar copper" style={{width: 22, height: 22, fontSize: 10}}>MK</div>
                  <span style={{fontSize: 13}}>M. Kowalski</span>
                  <button className="btn btn-sm btn-ghost" style={{marginLeft: "auto"}}>Change</button>
                </div>
              </Field>
              <Field label="When">
                <select className="input" defaultValue="now">
                  {a.severity === "crit" ? (
                    <>
                      <option>Now (next shift handover)</option>
                      <option>This afternoon</option>
                      <option>Tomorrow morning</option>
                    </>
                  ) : (
                    <>
                      <option>This week</option>
                      <option>Next maintenance window (Tue 21 May)</option>
                      <option>Within 30 days</option>
                    </>
                  )}
                </select>
              </Field>
              <Field label="Priority">
                <ToggleChips
                  value={a.severity === "crit" ? "urgent" : "normal"}
                  onChange={() => {}}
                  options={[{v:"low", l:"Low"}, {v:"normal", l:"Normal"}, {v:"urgent", l:"Urgent"}]}/>
              </Field>
              <Field label="Notify">
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                  <span className="chip"><Ic.check size={10}/> Team channel</span>
                  <span className="chip-outline chip"><Ic.plus size={10}/> Add</span>
                </div>
              </Field>
            </div>
          </div>

          {/* This machine */}
          <div>
            <SectionH title="This machine" />
            <div className="card" style={{padding: 0, overflow: "hidden"}}>
              <FactRow label="Health" value={
                <span style={{display:"flex", alignItems: "center", gap: 8}}>
                  <span style={{fontWeight: 500}}>{m?.health == null ? "—" : m.health}/100</span>
                  <StatusTag status={m?.status} />
                </span>
              } />
              <FactRow label="Criticality" value={m?.criticality + " — high"} />
              <FactRow label="Runtime" value={m?.runtime} />
              <FactRow label="Last service" value="28 Apr 2026 · 21 days ago" />
              <FactRow label="Open alerts" value={window.alertsFor(m?.id || "").length + ""} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="eyebrow" style={{marginBottom: 6, fontSize: 10.5}}>{label}</div>
      {children}
    </div>
  );
}

function ReasonStat({ label, value, sub, status }) {
  const color = status === "crit" ? "var(--crit)" : status === "warn" ? "var(--warn)" : status === "forecast" ? "var(--forecast)" : "var(--ok)";
  return (
    <div>
      <div className="eyebrow" style={{fontSize: 10.5, marginBottom: 4}}>{label}</div>
      <div className="metric" style={{fontSize: 18, color: status === "crit" ? "var(--crit)" : "var(--ink)"}}>{value}</div>
      <div style={{fontSize: 11, color, marginTop: 2}}>{sub}</div>
    </div>
  );
}

// Local helper since alert is in its own module
function FactRow({ label, value, sub }) {
  return (
    <div style={{display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, padding: "10px 16px",
                  borderBottom: "1px solid var(--line)", alignItems: "baseline"}}>
      <div style={{fontSize: 11.5, color: "var(--ink-3)"}}>{label}</div>
      <div style={{fontSize: 12.5, color: "var(--ink-1)"}}>
        {value}{sub && <span className="t-3"> · {sub}</span>}
      </div>
    </div>
  );
}

function ToggleChips({ value, onChange, options }) {
  return (
    <div style={{display: "inline-flex", padding: 2, background: "var(--surface-3)",
                 borderRadius: 7, gap: 2}}>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
                style={{fontSize: 12, fontWeight: 500, padding: "4px 12px", border: "none", borderRadius: 5,
                          background: value === o.v ? "var(--surface)" : "transparent",
                          color: value === o.v ? "var(--ink)" : "var(--ink-2)",
                          boxShadow: value === o.v ? "var(--shadow-card)" : "none",
                          cursor: "pointer", fontFamily: "inherit"}}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// Prior-case comparison overlay — normalized signal trajectories
function PriorCaseOverlay({ severity }) {
  const curves = window.getPriorCaseCurves();
  const w = 520, h = 120, pad = { l: 36, r: 12, t: 14, b: 22 };
  const n = curves.current.length;
  const xAt = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const yAt = (v) => pad.t + (1 - v) * (h - pad.t - pad.b);
  const pathFor = (vals) => vals.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  const alarmY = yAt(0.82);

  return (
    <div className="card prior-case-chart alert-trend-chart" style={{ padding: "12px 14px 8px" }}>
      <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 6 }}>Signal trajectory · normalized</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }} aria-hidden="true">
        <line x1={pad.l} x2={w - pad.r} y1={alarmY} y2={alarmY} stroke="var(--warn)" strokeDasharray="3 3" strokeWidth={1} />
        <text x={pad.l - 4} y={alarmY + 3} fontSize="9" fill="var(--warn)" textAnchor="end">Alarm</text>
        <path d={pathFor(curves.resolvedEarly)} fill="none" stroke="var(--chart-4)" strokeWidth={1} strokeOpacity={0.55} />
        <path d={pathFor(curves.resolvedLate)} fill="none" stroke="var(--chart-5)" strokeWidth={1} strokeOpacity={0.55} strokeDasharray="3 2" />
        <path d={pathFor(curves.current)} fill="none" stroke={severity === "crit" ? "var(--crit)" : "var(--chart-1)"} strokeWidth={1.25} />
        <circle cx={xAt(n - 1)} cy={yAt(curves.current[n - 1])} r={3} fill={severity === "crit" ? "var(--crit)" : "var(--chart-1)"} />
      </svg>
      <div className="prior-case-legend">
        <span><i style={{ background: severity === "crit" ? "var(--crit)" : "var(--chart-1)" }} /> This case</span>
        <span><i style={{ background: "var(--chart-4)" }} /> Resolved early</span>
        <span><i style={{ background: "var(--chart-5)" }} /> Resolved late</span>
      </div>
    </div>
  );
}

// Small chart inside the "why" card — minimal, anchors the reasoning
function MiniChartReason() {
  const w = 480, h = 100, pad = {l: 24, r: 12, t: 8, b: 18};
  const N = 36;
  const data = Array.from({length: N}, (_, i) => 3 + Math.sin(i * 0.3) * 0.2 + (i > 28 ? (i - 28) * 0.7 : 0));
  const minY = 0, maxY = 9;
  const xAt = (i) => pad.l + (i / (N - 1)) * (w - pad.l - pad.r);
  const yAt = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * (h - pad.t - pad.b);
  const path = data.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  return (
    <div style={{marginTop: 14, padding: "12px 8px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--line)"}}>
      <div className="eyebrow" style={{fontSize: 10.5, marginBottom: 4, paddingLeft: 12}}>Bearing acceleration · 36h</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{display: "block"}}>
        <rect x={pad.l} y={yAt(7)} width={w - pad.l - pad.r} height={yAt(0) - yAt(7)} fill="var(--crit-soft)" opacity="0.5" />
        <line x1={pad.l} x2={w - pad.r} y1={yAt(7)} y2={yAt(7)} stroke="var(--crit)" strokeDasharray="3 3" />
        <text x={pad.l - 4} y={yAt(7) + 3} fontSize="9" fill="var(--crit)" textAnchor="end">7.0</text>
        <text x={pad.l - 4} y={yAt(0) + 3} fontSize="9" fill="var(--ink-4)" textAnchor="end">0</text>
        <path d={path} fill="none" stroke="var(--crit)" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx={xAt(N-1)} cy={yAt(data[N-1])} r="3" fill="var(--crit)" />
      </svg>
    </div>
  );
}

window.AlertScreen = AlertScreen;
