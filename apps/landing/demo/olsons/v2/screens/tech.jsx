// tech.jsx — Olsons technician's pre-visit briefing.
// Shown as a phone mockup. Designed for Lasse Bergström before he drives out.

function TechScreen({ go, persona }) {
  const Ic = window.Icons;
  const tech = persona.kind === "tech" ? window.getTech("lb") : window.getTech("lb");
  const visits = window.planForTech(tech.id).filter(v => v.kind !== "completed");
  const todays = visits.find(v => v.day === "Thu 21 May") || visits[0];
  const alert = todays?.alertId ? window.getAlert(todays.alertId) : null;
  const press = todays?.machine ? window.getPress(todays.machine) : null;
  const site  = todays ? window.getSite(todays.site) : null;
  const customer = window.getCustomer();

  return (
    <div className="page-body fade-in">

      {/* ─── Context band ───────────────────────────────────────── */}
      <div className="page-h page-h-quiet" style={{marginBottom: 16}}>
        <div>
          <p className="page-greeting">{persona.greeting}</p>
          <p className="page-title page-title-lg">3 visits today, 1 with predictive context.</p>
          <p className="page-sub" style={{marginTop: 6}}>
            <span>Open it on your phone before you leave the workshop.</span>
          </p>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost"><Ic.share size={13}/> Share to phone</button>
          <button className="btn btn-sm"><Ic.route size={13}/> Today's route</button>
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: 32, alignItems: "start"}}>

        {/* ─── Left: schedule + map context ─────────────────────── */}
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>

          {/* My day */}
          <div>
            <window.SectionH title="Today" sub={`${tech.name} · ${tech.base} workshop`}/>
            <div className="card" style={{padding: 0, overflow: "hidden"}}>
              {[
                { time: "08:30", endTime: "09:00", title: "Workshop · load parts", site: "Olsons Vingåker", kind: "prep" },
                { time: "09:00", endTime: "12:00", title: "BSTA-50 #3 · clutch-side guide bushings", site: "NordPlåt · Vingåker", kind: "predicted", active: true, alert: "ALR-2604" },
                { time: "13:00", endTime: "15:00", title: "Quarterly · Hall A presses", site: "Köpings Stamping", kind: "scheduled" },
                { time: "15:30", endTime: "16:30", title: "Workshop · paperwork", site: "Olsons Vingåker", kind: "prep" },
              ].map((v, i) => (
                <div key={i} style={{display: "grid",
                                       gridTemplateColumns: "70px 1fr auto",
                                       gap: 16, padding: "16px 20px",
                                       borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                                       background: v.active ? "var(--accent-soft)" : "transparent",
                                       cursor: v.kind === "predicted" ? "pointer" : "default"}}>
                  <div className="mono tnum" style={{fontSize: 12, color: "var(--ink-2)"}}>
                    <div>{v.time}</div>
                    <div style={{color: "var(--ink-4)"}}>{v.endTime}</div>
                  </div>
                  <div style={{minWidth: 0}}>
                    <div style={{fontSize: 13.5, fontWeight: 500, color: "var(--ink)"}}>{v.title}</div>
                    <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 4,
                                   display: "flex", alignItems: "center", gap: 8}}>
                      <window.Icons.pin size={11}/>
                      <span>{v.site}</span>
                      {v.alert && (
                        <>
                          <span>·</span>
                          <span className="ai-badge">{v.alert}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    {v.kind === "predicted" && <span className="tag tag-forecast">Predicted</span>}
                    {v.kind === "scheduled" && <span className="tag tag-ok">Scheduled</span>}
                    {v.kind === "prep"      && <span className="tag tag-outline">Workshop</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route summary */}
          <div>
            <window.SectionH title="Route" sub="Vingåker → NordPlåt → Köpings → Vingåker · 84 km total"/>
            <div className="card" style={{padding: 20}}>
              <div style={{display: "flex", alignItems: "stretch", gap: 14}}>
                <RouteBeam/>
                <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 18}}>
                  <RouteStop time="08:30" name="Olsons workshop" sub="Vingåker · pick up parts" first/>
                  <RouteStop time="09:00" name="NordPlåt — Vingåker" sub="18 min · 14 km · Industrigatan 14" active/>
                  <RouteStop time="13:00" name="Köpings Stamping" sub="42 min · 38 km · scheduled visit"/>
                  <RouteStop time="15:30" name="Olsons workshop" sub="28 min · 32 km · back to base" last/>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-visit AI briefing — the "you know what you'll find" part */}
          {alert && press && (
            <div>
              <window.SectionH title="Pre-visit briefing · 09:00 NordPlåt"
                               sub="What we expect to find, and why. Read before you drive."
                               right={<span className="ai-badge">Model · {alert.confidence}% conf</span>}/>
              <div className="card" style={{padding: 22}}>
                <window.PLBlock tone="warn">
                  {alert.pl}
                </window.PLBlock>

                <div style={{marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16}}>
                  <BriefingStat label="Trend" value="−24 µm" sub="rear-clutch corner · 8w" status="warn"/>
                  <BriefingStat label="Cycles since last service" value="8.4k" sub="re-greased 28 Apr"/>
                  <BriefingStat label="Closest match" value="WO-1817-02" sub="NordPlåt · Mar 2024" status="ok"/>
                </div>

                <div style={{marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)"}}>
                  <div className="eyebrow" style={{marginBottom: 8}}>Likely sequence on site</div>
                  <ol style={{margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--ink-1)", lineHeight: 1.65}}>
                    <li>Confirm parallelism reading at the press (DTI gauge). Expect ~42 µm on rear-clutch corner.</li>
                    <li>Pull the clutch-side guide bushing assembly. Tools in kit MS-12-04 (in truck).</li>
                    <li>Inspect bushing inner race — check for the wear pattern from WO-1817-02.</li>
                    <li>Fit new bushing kit OLS-BX-2204. Torque to spec (180 Nm).</li>
                    <li>Re-grease (Mobil SHC 220, 400 g). Run 50 cycles and re-measure parallelism.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: device mockup ─────────────────────────────── */}
        <div style={{position: "sticky", top: 24, alignSelf: "flex-start"}}>
          <DeviceMockup tech={tech} visit={todays} alert={alert} press={press} site={site}/>
        </div>
      </div>
    </div>
  );
}

// ─── Route components ────────────────────────────────────────────────────
function RouteBeam() {
  return (
    <div style={{width: 12, position: "relative"}}>
      <div style={{position: "absolute", left: 5, top: 8, bottom: 8, width: 1, background: "var(--line-2)"}}/>
    </div>
  );
}

function RouteStop({ time, name, sub, first, active, last }) {
  return (
    <div style={{display: "flex", gap: 14, alignItems: "flex-start", position: "relative"}}>
      <div style={{
        width: 12, height: 12,
        marginLeft: -19,
        marginTop: 4,
        background: active ? "var(--ink)" : first || last ? "var(--ink-3)" : "var(--surface-2)",
        border: "1px solid " + (active ? "var(--ink)" : "var(--ink-3)"),
        borderRadius: 0,
        flexShrink: 0,
      }}/>
      <div className="mono tnum" style={{fontSize: 11.5, color: "var(--ink-3)", width: 52, paddingTop: 2}}>{time}</div>
      <div style={{minWidth: 0}}>
        <div style={{fontSize: 13.5, fontWeight: active ? 600 : 500, color: "var(--ink)"}}>{name}</div>
        <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 2}}>{sub}</div>
      </div>
    </div>
  );
}

function BriefingStat({ label, value, sub, status }) {
  const colorClass = status === "warn" ? "t-warn" : status === "crit" ? "t-crit" : status === "ok" ? "t-2" : "";
  return (
    <div>
      <div className="eyebrow" style={{marginBottom: 4}}>{label}</div>
      <div className={"data-hero " + colorClass} style={{fontSize: 22}}>{value}</div>
      <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 4}}>{sub}</div>
    </div>
  );
}

// ─── Device mockup — the phone-shaped briefing ──────────────────────────
function DeviceMockup({ tech, visit, alert, press, site }) {
  const Ic = window.Icons;
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 16}}>
      <div style={{display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", background: "var(--surface)",
                    border: "1px solid var(--line)",
                    fontSize: 11, color: "var(--ink-3)"}}>
        <Ic.phone size={12}/>
        <span>On Lasse's phone · 08:18 today</span>
      </div>

      <div className="device-frame">
        <div className="device-screen">
          {/* Status bar */}
          <div className="device-statusbar">
            <span className="time">08:18</span>
            <span className="right">
              <span>Vingåker</span>
              <span>·</span>
              <span>5G</span>
              <span>·</span>
              <span>94%</span>
            </span>
          </div>

          <div className="device-body scroll-clean">
            {/* App header */}
            <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 18}}>
              <div className="brand-mark" style={{width: 22, height: 22, fontSize: 10}}>OL</div>
              <div>
                <div style={{fontSize: 12, fontWeight: 600, color: "var(--ink)"}}>Olsons</div>
                <div style={{fontSize: 10, color: "var(--ink-3)"}}>My visits</div>
              </div>
              <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 6}}>
                <window.TechAvatar tech={tech} size="sm"/>
              </div>
            </div>

            {/* Eyebrow */}
            <div className="eyebrow-mono" style={{marginBottom: 6}}>Next visit · in 42 min</div>

            {/* Hero — site name */}
            <div style={{fontSize: 19, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", lineHeight: 1.25}}>
              {site?.name}
              <span style={{fontWeight: 400, color: "var(--ink-3)", marginLeft: 6, fontSize: 14}}>{visit?.day}</span>
            </div>

            {/* Press identity */}
            <div style={{marginTop: 14, padding: "12px 14px", background: "var(--surface-2)",
                           border: "1px solid var(--line)",
                           display: "flex", alignItems: "center", gap: 12}}>
              <window.PressIcon type={press?.type} size={20}/>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 13, fontWeight: 500, color: "var(--ink)"}}>{press?.name}</div>
                <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{press?.model} · {press?.area}</div>
              </div>
              <window.StatusTag status="warn"/>
            </div>

            {/* What we expect — plain language */}
            <div style={{marginTop: 16}}>
              <div className="eyebrow" style={{marginBottom: 6, fontSize: 10}}>What we expect</div>
              <p style={{margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-1)"}}>
                Clutch-side guide bushing wear on the BSTA-50 frame. Parallelism on the rear-clutch corner is at <b>−42 µm</b>, drifting <b>3 µm/week</b> for 8 weeks. The pattern matches <b>18 prior cases</b> — most resolved in under 4 h.
              </p>
              <div style={{marginTop: 8, fontSize: 11, color: "var(--ink-3)"}}>
                <span className="ai-badge">Model · 81%</span>
                <span style={{marginLeft: 6}}>· Slope-based projection, validated against historical guide failures.</span>
              </div>
            </div>

            {/* Parts */}
            <div style={{marginTop: 18}}>
              <div className="eyebrow" style={{marginBottom: 8, fontSize: 10}}>Parts loaded in truck</div>
              <div style={{display: "flex", flexDirection: "column", gap: 6}}>
                {[
                  { name: "Guide bushing kit · OLS-BX-2204", from: "Bay 4 · rack C", checked: true },
                  { name: "SKF 6210-2RS bearing × 2",        from: "Bay 4 · rack A", checked: true },
                  { name: "Bushing puller adapter MS-12-04", from: "Toolroom",       checked: true },
                  { name: "Mobil SHC 220 grease · 400 g",    from: "Bay 2",          checked: true },
                ].map((p, i) => (
                  <div key={i} style={{display: "flex", alignItems: "center", gap: 10,
                                          padding: "8px 10px", border: "1px solid var(--line)",
                                          background: "var(--surface-2)"}}>
                    <div style={{width: 16, height: 16, background: "var(--ok)", display: "grid", placeItems: "center"}}>
                      <Ic.check size={11} style={{color: "white"}}/>
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontSize: 12, color: "var(--ink-1)", fontWeight: 500}}>{p.name}</div>
                      <div style={{fontSize: 10.5, color: "var(--ink-3)", marginTop: 1}}>{p.from}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Site contact */}
            <div style={{marginTop: 18}}>
              <div className="eyebrow" style={{marginBottom: 8, fontSize: 10}}>Site contact on arrival</div>
              <div style={{display: "flex", alignItems: "center", gap: 12,
                             padding: "12px 14px",
                             background: "var(--surface-2)",
                             border: "1px solid var(--line)"}}>
                <div className="avatar" style={{background: "var(--surface-3)"}}>EP</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 500, color: "var(--ink)"}}>Erik Persson</div>
                  <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>Maintenance manager</div>
                </div>
                <a style={{padding: 6, color: "var(--ink-1)", border: "1px solid var(--line-2)"}}>
                  <Ic.phone size={14}/>
                </a>
              </div>
            </div>

            {/* Drive button */}
            <div style={{marginTop: 18, padding: "14px 16px", background: "var(--ink)", color: "#fff"}}>
              <div style={{fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase"}}>
                Depart by 08:42
              </div>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6}}>
                <div>
                  <div style={{fontSize: 16, fontWeight: 500}}>Industrigatan 14, Vingåker</div>
                  <div style={{fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 2}}>18 min · 14 km</div>
                </div>
                <Ic.route size={20}/>
              </div>
            </div>

            {/* Last service on this press */}
            <div style={{marginTop: 18}}>
              <div className="eyebrow" style={{marginBottom: 6, fontSize: 10}}>Your last visit · this press</div>
              <div style={{fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.5, padding: "10px 12px",
                             background: "var(--surface-2)", border: "1px solid var(--line)"}}>
                <div className="mono" style={{color: "var(--ink-3)", marginBottom: 4}}>28 Apr 2026 · 2.4 h</div>
                <div>Quarterly inspection — re-greased drive bearings, flagged slide parallelism drift, escalated to predictive review.</div>
              </div>
            </div>

            <div style={{height: 16}}/>
          </div>
        </div>
      </div>

      <div style={{fontSize: 11, color: "var(--ink-4)", textAlign: "center", maxWidth: 360, lineHeight: 1.5}}>
        Same surface in the workshop tablet. Pre-cached for offline use on site.
      </div>
    </div>
  );
}

window.TechScreen = TechScreen;
