// alert.jsx — Alert / recommendation detail.
// Where the predicted issue becomes scheduled Olsons service.

const { useState: useStateAlert } = React;

function AlertScreen({ alertId, go, persona }) {
  const Ic = window.Icons;
  const a = window.getAlert(alertId);
  if (!a) return <div className="page-body">Recommendation not found.</div>;
  const p = window.getPress(a.machine);
  const site = window.getSite(a.site);
  const tech = window.getTech(a.suggestedTech);
  const slot = a.suggestedSlot;
  const sev = a.severity === "crit" ? "crit"
            : a.severity === "unknown" ? "unknown"
            : "warn";

  const [checked, setChecked] = useStateAlert({});

  return (
    <div className="page-body fade-in" style={{maxWidth: 1240}}>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div style={{marginBottom: 20}}>
        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontSize: 12}}>
          <window.StatusTag status={sev}>{window.severityLabel(a.severity)}</window.StatusTag>
          <span className="mono t-4">{a.id}</span>
          <span className="t-3">·</span>
          <span className="t-3">Raised {a.raised}</span>
          {a.confidence != null && (
            <>
              <span className="t-3">·</span>
              <span className="ai-badge">Model · {a.confidence}% conf</span>
            </>
          )}
        </div>
        <div className="page-h" style={{alignItems: "flex-end", marginBottom: 0}}>
          <div style={{minWidth: 0, maxWidth: 760}}>
            <h1 className="page-title page-title-lg">{a.title}</h1>
            <div className="page-sub" style={{marginTop: 8}}>
              <window.PressIcon type={p?.type} size={13}/>
              <a onClick={() => go("press:" + p.id)}>{p?.name}</a>
              <span className="sep-dot">·</span>
              <span>{site?.name}</span>
              <span className="sep-dot">·</span>
              <span>{p?.area}</span>
            </div>
            {a.provenance && (
              <window.CaughtByProvenance provenance={a.provenance} go={go} persona={persona}/>
            )}
          </div>
          <div style={{display: "flex", gap: 8}}>
            <button className="btn btn-sm btn-ghost"><Ic.bell size={13}/> Snooze</button>
            <button className="btn btn-sm btn-ghost"><Ic.x size={13}/> Dismiss</button>
            <button className="btn btn-sm btn-primary"><Ic.calendar size={13}/> Book Olsons visit</button>
          </div>
        </div>
      </div>

      {/* ─── Plain-language summary (the hero block) ──────────────── */}
      <div style={{marginBottom: 24}}>
        <window.PLBlock tone={sev} confidence={a.confidence}>
          {a.pl}
        </window.PLBlock>
      </div>

      <div className="two-col" style={{gap: 24}}>

        {/* ─── Left column ────────────────────────────────────────── */}
        <div style={{display: "flex", flexDirection: "column", gap: 24}}>

          {/* Recommended actions */}
          {a.actions && a.actions.length > 0 && (
            <div>
              <window.SectionH title="Recommended actions"
                               sub="In order. Tap to mark done as you go."/>
              <div className="card" style={{padding: 0, overflow: "hidden"}}>
                {a.actions.map((act, i) => {
                  const sug = act.suggested;
                  const sugTech = sug ? window.getTech(sug.tech) : null;
                  return (
                    <div key={act.id || i}
                         onClick={() => setChecked((c) => ({...c, [i]: !c[i]}))}
                         className="row-hover"
                         style={{display: "grid", gridTemplateColumns: "24px 1fr auto",
                                 gap: 14, padding: "14px 20px",
                                 borderBottom: i < a.actions.length - 1 ? "1px solid var(--line)" : "none",
                                 cursor: "pointer", alignItems: "flex-start"}}>
                      <div style={{width: 18, height: 18,
                                     border: "1.5px solid " + (checked[i] ? "var(--ok)" : "var(--line-strong)"),
                                     background: checked[i] ? "var(--ok)" : "transparent",
                                     display: "grid", placeItems: "center", color: "white",
                                     marginTop: 2}}>
                        {checked[i] && <Ic.check size={11}/>}
                      </div>
                      <div>
                        <div style={{fontSize: 13.5, color: checked[i] ? "var(--ink-3)" : "var(--ink-1)",
                                      fontWeight: act.primary ? 500 : 400,
                                      textDecoration: checked[i] ? "line-through" : "none",
                                      lineHeight: 1.5}}>
                          {act.text}
                        </div>
                        {sug && (
                          <div style={{marginTop: 6, fontSize: 11.5, color: "var(--ink-3)",
                                         display: "flex", alignItems: "center", gap: 8}}>
                            {sugTech && <window.TechAvatar tech={sugTech} size="sm"/>}
                            <span>{sugTech?.name}</span>
                            <span className="sep-dot">·</span>
                            <span>{sug.when}</span>
                            {sug.duration && <><span className="sep-dot">·</span><span>{sug.duration}</span></>}
                          </div>
                        )}
                        {act.primary && !checked[i] && (
                          <div style={{marginTop: 6, fontSize: 11, color: "var(--ink-4)",
                                         letterSpacing: "0.04em", textTransform: "uppercase"}}>
                            Primary action
                          </div>
                        )}
                      </div>
                      <div style={{paddingTop: 2}}>
                        {act.primary && (
                          <button className="btn btn-sm">Schedule</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Why we're flagging this */}
          <div>
            <window.SectionH title="Why we're flagging this"
                             right={<span className="ai-badge">Model · explained</span>}/>
            <div className="card" style={{padding: 20}}>
              <p style={{margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-1)"}}>
                {a.why}
              </p>
              {a.confidenceNote && (
                <div style={{marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)",
                              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap"}}>
                  <span className="eyebrow-mono">model note</span>
                  <span style={{fontSize: 12, color: "var(--ink-2)", flex: 1, minWidth: 240}}>{a.confidenceNote}</span>
                  <span className="mono" style={{fontSize: 12, color: "var(--ink-3)"}}>{a.confidence}% confidence</span>
                </div>
              )}
            </div>
          </div>

          {/* Reference cases — Olsons' historical context */}
          {a.similar && a.similar.length > 0 && (
            <div>
              <window.SectionH title="Similar cases · Olsons history"
                               sub="What happened the last time we saw this pattern."/>
              <div className="card" style={{padding: 0, overflow: "hidden"}}>
                <div style={{display: "grid",
                              gridTemplateColumns: "110px 1.3fr 1fr 80px",
                              gap: 14, padding: "10px 20px",
                              background: "var(--surface)",
                              borderBottom: "1px solid var(--line)",
                              fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                              color: "var(--ink-3)"}}>
                  <div>Work order</div>
                  <div>Customer / press</div>
                  <div>Outcome</div>
                  <div style={{textAlign: "right"}}>Date</div>
                </div>
                {a.similar.map((s, i) => (
                  <div key={i} style={{display: "grid",
                                         gridTemplateColumns: "110px 1.3fr 1fr 80px",
                                         gap: 14, padding: "14px 20px",
                                         borderBottom: i < a.similar.length - 1 ? "1px solid var(--line)" : "none",
                                         alignItems: "center", fontSize: 12.5}}>
                    <span className="mono t-3">{s.ref}</span>
                    <div>
                      <div style={{color: "var(--ink-1)"}}>{s.customer}</div>
                      <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{s.machine}</div>
                    </div>
                    <span style={{color: "var(--ink-2)"}}>{s.outcome}</span>
                    <span className="t-3 mono" style={{textAlign: "right"}}>{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ─── Right column ───────────────────────────────────────── */}
        <div style={{display: "flex", flexDirection: "column", gap: 24}}>

          {/* Schedule with Olsons — the relationship moment */}
          {slot && tech && (
            <ScheduleCard alert={a} tech={tech} slot={slot}/>
          )}

          {/* Parts checklist — Olsons inventory */}
          {a.parts && a.parts.length > 0 && (
            <div>
              <window.SectionH title="Parts checklist"
                               sub="From Olsons workshop inventory."/>
              <div className="card" style={{padding: 0, overflow: "hidden"}}>
                {a.parts.map((part, i) => (
                  <div key={i} style={{display: "grid",
                                         gridTemplateColumns: "1fr auto",
                                         gap: 12, padding: "14px 20px",
                                         borderBottom: i < a.parts.length - 1 ? "1px solid var(--line)" : "none",
                                         alignItems: "center"}}>
                    <div>
                      <div style={{fontSize: 13, color: "var(--ink-1)", fontWeight: part.primary ? 500 : 400}}>{part.name}</div>
                      <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 3,
                                     display: "flex", alignItems: "center", gap: 6}}>
                        <span className="mono">{part.ref}</span>
                        <span>·</span>
                        <span>{part.stock}</span>
                      </div>
                    </div>
                    <span className="tag tag-ok">
                      <Ic.check size={11}/> Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predicted value — what this catch saved */}
          {a.avoidedDowntimeEst && (
            <div className="card" style={{padding: 20, background: "var(--surface)"}}>
              <div className="eyebrow" style={{marginBottom: 8}}>Predicted value</div>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                <div>
                  <div className="data-hero t-ok" style={{fontSize: 24}}>
                    {a.avoidedDowntimeEst.hours} <span style={{fontSize: 12, color: "var(--ink-3)", fontWeight: 400}}>h</span>
                  </div>
                  <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 4}}>downtime avoided</div>
                </div>
                <div>
                  <div className="data-hero t-ok" style={{fontSize: 24}}>
                    ~{(a.avoidedDowntimeEst.savingsSEK/1000).toFixed(0)}<span style={{fontSize: 12, color: "var(--ink-3)", fontWeight: 400}}>k SEK</span>
                  </div>
                  <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 4}}>cost avoided</div>
                </div>
              </div>
              <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)",
                             fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5}}>
                Estimated by comparing to historical unplanned guide failures on this press class. Calibrated against 6 past Olsons cases.
              </div>
            </div>
          )}

          {/* This press */}
          <div>
            <window.SectionH title="This press"/>
            <div className="card" style={{padding: 0, overflow: "hidden"}}>
              <div className="kv"><div className="kv-k">Health</div>
                <div className="kv-v" style={{display: "flex", alignItems: "center", gap: 8}}>
                  <span className="mono" style={{fontWeight: 500}}>{p?.health}<span style={{color: "var(--ink-4)"}}>/100</span></span>
                  <window.StatusTag status={p?.status}/>
                </div>
              </div>
              <div className="kv"><div className="kv-k">Model</div><div className="kv-v">{p?.model}</div></div>
              <div className="kv"><div className="kv-k">Criticality</div><div className="kv-v">{p?.criticality} · line-stopper</div></div>
              <div className="kv"><div className="kv-k">Runtime</div><div className="kv-v">{p?.runtime}</div></div>
              <div className="kv"><div className="kv-k">Last service</div><div className="kv-v">{p?.lastService || "—"}</div></div>
            </div>
            <div style={{marginTop: 10}}>
              <button className="btn btn-sm btn-ghost" onClick={() => go("press:" + p.id)}>
                Open press detail →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── The schedule card — where the predictive layer fuses with Olsons ─────
function ScheduleCard({ alert, tech, slot }) {
  const Ic = window.Icons;
  const [confirmed, setConfirmed] = useStateAlert(false);
  return (
    <div className="card" style={{padding: 0, overflow: "hidden",
                                    border: "1px solid rgba(31,58,79,0.22)",
                                    background: "var(--surface-2)"}}>
      <div style={{padding: "14px 20px", borderBottom: "1px solid var(--line)",
                     background: "var(--olsons-soft)",
                     display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 22, height: 22, background: "var(--olsons)", color: "#fff",
                         display: "grid", placeItems: "center", fontSize: 10,
                         fontFamily: "var(--font-mono)", fontWeight: 500}}>OL</div>
          <div>
            <div style={{fontSize: 13.5, fontWeight: 600, color: "var(--ink)"}}>Schedule with Olsons</div>
            <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 1}}>One tap — parts, tech, slot pre-arranged</div>
          </div>
        </div>
      </div>

      <div style={{padding: 20}}>
        <div style={{display: "flex", alignItems: "center", gap: 14, marginBottom: 18}}>
          <window.TechAvatar tech={tech} size="lg"/>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 14, fontWeight: 500, color: "var(--ink)"}}>{tech.name}</div>
            <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>{tech.role}</div>
            <div style={{fontSize: 11, color: "var(--ink-4)", marginTop: 4}}>{tech.specialty}</div>
          </div>
          <button className="btn btn-sm btn-ghost">Choose another →</button>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px 14px"}}>
          <span className="t-3" style={{fontSize: 11.5}}>Earliest slot</span>
          <span style={{fontSize: 13, fontWeight: 500, color: "var(--ink)"}}>
            {slot.day} · {slot.time}
            <span style={{color: "var(--ink-3)", fontWeight: 400, marginLeft: 6, fontSize: 12}}>· {slot.duration}</span>
          </span>

          {slot.drive && slot.drive !== "—" && (
            <>
              <span className="t-3" style={{fontSize: 11.5}}>Drive time</span>
              <span style={{fontSize: 13, color: "var(--ink-1)"}}>
                <Ic.route size={12} style={{verticalAlign: "middle", color: "var(--ink-3)", marginRight: 4}}/>
                {slot.drive}
              </span>
            </>
          )}

          <span className="t-3" style={{fontSize: 11.5}}>Production impact</span>
          <span style={{fontSize: 13, color: "var(--ink-1)"}}>
            <span className="mono">{slot.duration}</span> press downtime · coordinate with Anna
          </span>
        </div>

        <div style={{marginTop: 18, padding: "12px 14px", background: "var(--surface)",
                       border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10}}>
          <Ic.workshop size={13} style={{color: "var(--olsons)"}}/>
          <div style={{fontSize: 12, color: "var(--ink-1)", flex: 1, lineHeight: 1.45}}>
            Parts pulled from <b>Olsons Vingåker</b>, Bay 4 · 4 items confirmed ready
          </div>
        </div>

        <button
          className={"btn " + (confirmed ? "" : "btn-primary")}
          style={{width: "100%", height: 38, marginTop: 16, fontSize: 13}}
          onClick={() => setConfirmed(true)}>
          {confirmed
            ? <><Ic.check size={13}/> Booked · we'll notify {tech.name}</>
            : <><Ic.calendar size={13}/> Book this slot</>
          }
        </button>
      </div>
    </div>
  );
}

window.AlertScreen = AlertScreen;
