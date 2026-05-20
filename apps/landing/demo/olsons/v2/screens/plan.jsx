// plan.jsx — Service plan / forward view.
// Calendar of scheduled (Olsons contract) + predicted (model) work.

const { useState: useStatePlan, useMemo: useMemoPlan } = React;

function PlanScreen({ go, persona }) {
  const Ic = window.Icons;
  const { PLAN, KPI, SITES } = window.DATA;
  const [view, setView] = useStatePlan("8w");
  const [filter, setFilter] = useStatePlan("all");
  const [selected, setSelected] = useStatePlan(null);

  // Today = Mon 18 May 2026. Build 6 weeks of calendar grid (current week + 5 forward).
  const todayISO = "2026-05-18";
  const weeks = useMemoPlan(() => buildWeeks(todayISO, 6), [todayISO]);

  const filteredPlan = PLAN.filter(p => {
    if (filter === "scheduled") return p.kind === "scheduled" || p.kind === "booked";
    if (filter === "predicted") return p.kind === "predicted" || p.kind === "booked";
    return true;
  });

  const upcomingList = filteredPlan.filter(p => p.kind !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="page-body fade-in" style={{maxWidth: 1480}}>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="page-h page-h-quiet">
        <div>
          <p className="page-greeting">Service plan</p>
          <p className="page-title page-title-lg">
            What's confirmed, what's coming.
          </p>
          <p className="page-sub" style={{marginTop: 6}}>
            Olsons visits and predicted work, on one calendar.
            <span className="sep-dot">·</span>
            <span>Next 6 weeks</span>
          </p>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost"><Ic.download size={13}/> Export iCal</button>
          <button className="btn btn-sm btn-ghost"><Ic.share size={13}/> Send to Anna</button>
        </div>
      </div>

      {/* ─── KPIs / instrument cluster for the plan ─────────────── */}
      <InstrumentCluster cols={4} items={[
        { label: "Scheduled visits · 6w",    value: PLAN.filter(p => (p.kind === "scheduled" || p.kind === "booked") && p.date <= "2026-06-30").length, sub: "Confirmed Olsons appointments" },
        { label: "Predicted · 6w",            value: PLAN.filter(p => p.kind === "predicted" && p.date <= "2026-06-30").length, sub: "From the model · not yet booked" },
        { label: "Total tech-hours planned",  value: 22.4, unit: "h",  sub: "Across all NordPlåt sites" },
        { label: "Total downtime planned",    value: 14.5, unit: "h",  sub: "Coordinated with production" },
      ]}/>

      {/* ─── Filter bar ─────────────────────────────────────────── */}
      <div className="filterbar">
        <div className="seg-ctrl">
          <button className={filter === "all"      ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "scheduled"? "active" : ""} onClick={() => setFilter("scheduled")}>Scheduled</button>
          <button className={filter === "predicted"? "active" : ""} onClick={() => setFilter("predicted")}>Predicted</button>
        </div>
        <span className="sep"/>
        <div className="seg-ctrl">
          <button className={view === "4w" ? "active" : ""} onClick={() => setView("4w")}>4 weeks</button>
          <button className={view === "8w" ? "active" : ""} onClick={() => setView("8w")}>6 weeks</button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
        </div>
        <span className="sep"/>
        <div style={{display: "flex", gap: 14, alignItems: "center", fontSize: 11.5, color: "var(--ink-3)"}}>
          <LegendChip color="var(--ok)"       label="Scheduled"/>
          <LegendChip color="var(--ink)"       label="Booked (from prediction)"/>
          <LegendChip color="var(--forecast)" label="Predicted · not booked" dashed/>
          <LegendChip color="var(--ink-4)"    label="Completed"/>
        </div>
        <div style={{marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)"}}>
          Drag any predicted item onto a date to schedule it.
        </div>
      </div>

      {/* ─── Calendar grid ──────────────────────────────────────── */}
      {view !== "list" && (
        <div style={{display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 22, marginBottom: 30}}>
          <div className="card" style={{padding: 0, overflow: "hidden"}}>
            <CalendarGrid weeks={view === "4w" ? weeks.slice(0, 4) : weeks} plan={filteredPlan}
                          onSelect={setSelected} selected={selected}/>
          </div>
          <PlanDetailPanel selectedId={selected} go={go} onClose={() => setSelected(null)}/>
        </div>
      )}

      {/* ─── Upcoming list (always shown) ───────────────────────── */}
      <div className="section">
        <window.SectionH title={view === "list" ? "All upcoming work" : "Upcoming"}
                         sub="Each row links to its press and recommendation."
                         right={<span className="t-3" style={{fontSize: 11.5}}>{upcomingList.length} items</span>}/>
        <UpcomingTable items={upcomingList} go={go} onSelect={setSelected}/>
      </div>

      {/* ─── What-if planner — drag-to-replan implications ──── */}
      <div className="section">
        <window.SectionH title="If we delay…"
                         sub="What happens if a predicted intervention slips."/>
        <DelayPlanner/>
      </div>

      {/* ─── Past visits ────────────────────────────────────────── */}
      <div className="section">
        <window.SectionH title="Recent · last 2 weeks"
                         sub="Completed Olsons visits for context."/>
        <CompletedList items={PLAN.filter(p => p.kind === "completed")} go={go}/>
      </div>
    </div>
  );
}

// ─── Calendar grid ──────────────────────────────────────────────────────────
function buildWeeks(todayISO, count) {
  const start = new Date(todayISO);
  // Snap to Monday of current week
  const dow = start.getDay() || 7;
  start.setDate(start.getDate() - (dow - 1));
  const weeks = [];
  for (let w = 0; w < count; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      days.push({
        iso: dt.toISOString().slice(0, 10),
        day: dt.getDate(),
        month: dt.toLocaleString("en-GB", { month: "short" }),
        weekday: dt.toLocaleString("en-GB", { weekday: "short" }),
        isToday: dt.toISOString().slice(0, 10) === todayISO,
        isPast: dt.toISOString().slice(0, 10) < todayISO,
      });
    }
    // ISO week number
    const tmp = new Date(days[0].iso);
    const dayNr = (tmp.getDay() + 6) % 7;
    tmp.setDate(tmp.getDate() - dayNr + 3);
    const firstThursday = tmp.valueOf();
    tmp.setMonth(0, 1);
    if (tmp.getDay() !== 4) tmp.setMonth(0, 1 + ((4 - tmp.getDay()) + 7) % 7);
    const wkNum = 1 + Math.ceil((firstThursday - tmp) / 604800000);
    weeks.push({ days, weekNum: wkNum });
  }
  return weeks;
}

function CalendarGrid({ weeks, plan, onSelect, selected }) {
  return (
    <div>
      {/* Header */}
      <div className="cal-grid">
        <div className="cal-head" style={{textAlign: "center"}}>wk</div>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="cal-head">{d}</div>
        ))}

        {weeks.map((wk) => (
          <React.Fragment key={wk.weekNum}>
            <div className="cal-weeknum">w{wk.weekNum}</div>
            {wk.days.map((d) => {
              const items = plan.filter(p => p.date === d.iso);
              return (
                <div key={d.iso}
                     className={"cal-cell " + (d.isToday ? "today" : d.isPast ? "past" : "")}>
                  <div className={"cal-date " + (d.isToday ? "today" : "")}>
                    <span>{d.day}</span>
                    {d.day === 1 || d.day <= 7 ? <span style={{marginLeft: 4, color: "var(--ink-4)"}}>{d.month}</span> : null}
                  </div>
                  {items.map(it => {
                    const cls = it.kind === "predicted" ? "predicted"
                              : it.kind === "booked"    ? "ok"
                              : it.kind === "scheduled" ? ""
                              : "";
                    return (
                      <div key={it.id}
                           className={"cal-event " + cls + (selected === it.id ? " is-selected" : "")}
                           onClick={(e) => { e.stopPropagation(); onSelect(it.id); }}
                           title={it.title}>
                        <div style={{fontWeight: 500}}>{it.time !== "—" ? it.time : ""}</div>
                        <div style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>{it.title}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Plan detail panel ────────────────────────────────────────────────────
function PlanDetailPanel({ selectedId, go, onClose }) {
  const Ic = window.Icons;
  const item = selectedId && window.getPlanItem(selectedId);
  if (!item) {
    return (
      <div className="card" style={{padding: 28, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, color: "var(--ink-3)"}}>
        <Ic.calendar size={26} style={{color: "var(--ink-4)"}}/>
        <div style={{fontSize: 13.5, color: "var(--ink-2)"}}>Select an event</div>
        <div style={{fontSize: 12, maxWidth: 260, lineHeight: 1.5}}>
          Click any item on the calendar to see what it is, who's coming, and why.
        </div>
      </div>
    );
  }
  const tech = item.tech ? window.getTech(item.tech) : null;
  const press = item.machine ? window.getPress(item.machine) : null;
  const alert = item.alertId ? window.getAlert(item.alertId) : null;
  const site = window.getSite(item.site);

  const kindMeta = {
    scheduled: { label: "Scheduled · contract", color: "var(--ink)" },
    booked:    { label: "Booked · from prediction", color: "var(--ok)" },
    predicted: { label: "Predicted · not yet booked", color: "var(--forecast)" },
    completed: { label: "Completed", color: "var(--ink-4)" },
  }[item.kind] || { label: item.kind, color: "var(--ink-3)" };

  return (
    <div className="card" style={{padding: 0, overflow: "hidden", position: "sticky", top: 24}}>
      <div style={{padding: "14px 18px", borderBottom: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div style={{minWidth: 0}}>
          <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 8}}>
            <span style={{width: 8, height: 8, background: kindMeta.color, flexShrink: 0}}/>
            <span className="eyebrow-mono" style={{color: kindMeta.color}}>{kindMeta.label}</span>
          </div>
          <div style={{fontSize: 14.5, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35}}>{item.title}</div>
          <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 6}}>
            <span>{item.day}</span>
            {item.time && item.time !== "—" && <> · <span className="mono">{item.time}</span></>}
            <> · {item.duration}</>
          </div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={onClose}><Ic.x size={13}/></button>
      </div>

      <div style={{padding: "16px 18px"}}>
        {tech && (
          <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 14}}>
            <window.TechAvatar tech={tech} size="md"/>
            <div>
              <div style={{fontSize: 13, fontWeight: 500, color: "var(--ink)"}}>{tech.name}</div>
              <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{tech.role}</div>
            </div>
          </div>
        )}

        <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "9px 12px"}}>
          {press && (
            <>
              <span className="t-3" style={{fontSize: 11}}>Press</span>
              <a onClick={() => go("press:" + press.id)} style={{fontSize: 12.5, color: "var(--ink-1)", cursor: "pointer", borderBottom: "1px dashed var(--line-2)"}}>{press.name}</a>
            </>
          )}
          <span className="t-3" style={{fontSize: 11}}>Site</span>
          <span style={{fontSize: 12.5, color: "var(--ink-1)"}}>{site?.name}</span>
          {item.parts > 0 && (
            <>
              <span className="t-3" style={{fontSize: 11}}>Parts</span>
              <span style={{fontSize: 12.5, color: "var(--ink-1)"}}>
                <span className="mono">{item.parts}</span> items · pulled from Olsons workshop
              </span>
            </>
          )}
          <span className="t-3" style={{fontSize: 11}}>Status</span>
          <span style={{fontSize: 12.5, color: "var(--ink-1)"}}>{item.status}</span>
        </div>

        {item.note && (
          <div style={{marginTop: 14, padding: 12, background: "var(--surface)", border: "1px solid var(--line)",
                         fontSize: 12, color: "var(--ink-1)", lineHeight: 1.55}}>
            {item.note}
          </div>
        )}

        {alert && (
          <div style={{marginTop: 14}}>
            <button className="btn btn-sm" style={{width: "100%"}} onClick={() => go("alert:" + alert.id)}>
              View triggering recommendation · {alert.id} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming table ───────────────────────────────────────────────────────
function UpcomingTable({ items, go, onSelect }) {
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      <div style={{display: "grid",
                    gridTemplateColumns: "120px 1.5fr 1fr 90px 100px 100px 24px",
                    gap: 14, padding: "10px 20px",
                    background: "var(--surface)", borderBottom: "1px solid var(--line)",
                    fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--ink-3)"}}>
        <div>When</div>
        <div>Work</div>
        <div>Press / site</div>
        <div>Tech</div>
        <div>Parts</div>
        <div>Kind</div>
        <div></div>
      </div>
      {items.map((it, i) => {
        const tech = it.tech ? window.getTech(it.tech) : null;
        const press = it.machine ? window.getPress(it.machine) : null;
        const site = window.getSite(it.site);
        const kindCls = it.kind === "predicted" ? "tag-forecast" : it.kind === "booked" ? "tag-ok" : "tag-outline";
        return (
          <div key={it.id}
               className="row-hover"
               onClick={() => onSelect(it.id)}
               style={{display: "grid",
                       gridTemplateColumns: "120px 1.5fr 1fr 90px 100px 100px 24px",
                       gap: 14, padding: "12px 20px",
                       borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
                       alignItems: "center", cursor: "pointer", fontSize: 13}}>
            <div>
              <div style={{fontWeight: 500, color: "var(--ink-1)"}}>{it.day}</div>
              <div className="mono" style={{fontSize: 11, color: "var(--ink-3)", marginTop: 1}}>{it.time !== "—" ? it.time : ""}</div>
            </div>
            <div style={{minWidth: 0, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
              {it.title}
            </div>
            <div style={{minWidth: 0, fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
              {press?.name || "—"}<span className="sep-dot"> · </span>{site?.name}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 6, minWidth: 0}}>
              {tech ? (
                <>
                  <window.TechAvatar tech={tech} size="sm"/>
                  <span style={{fontSize: 12, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{tech.initials}</span>
                </>
              ) : <span className="t-4" style={{fontSize: 12}}>—</span>}
            </div>
            <div className="mono tnum" style={{fontSize: 12, color: "var(--ink-3)"}}>
              {it.parts > 0 ? it.parts + " items" : "—"}
            </div>
            <div><span className={"tag " + kindCls}>{
              it.kind === "predicted" ? "Predicted" : it.kind === "booked" ? "Booked" : "Scheduled"
            }</span></div>
            <div style={{color: "var(--ink-4)", textAlign: "right"}}><window.Icons.chevR size={13}/></div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedList({ items, go }) {
  return (
    <div className="card" style={{padding: 0, overflow: "hidden"}}>
      {items.map((it, i) => {
        const tech = it.tech ? window.getTech(it.tech) : null;
        const press = it.machine ? window.getPress(it.machine) : null;
        return (
          <div key={it.id} style={{display: "grid",
                                     gridTemplateColumns: "100px 1.5fr 1fr 100px auto",
                                     gap: 14, padding: "12px 20px",
                                     borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
                                     alignItems: "center", fontSize: 12.5}}>
            <div className="mono tnum t-3">{it.day}</div>
            <div style={{color: "var(--ink-1)"}}>{it.title}</div>
            <div style={{fontSize: 12, color: "var(--ink-3)"}}>{press?.name || "—"}</div>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              {tech && <window.TechAvatar tech={tech} size="sm"/>}
              <span style={{fontSize: 11.5, color: "var(--ink-3)"}}>{tech?.initials}</span>
            </div>
            <span className="tag tag-outline">Done</span>
          </div>
        );
      })}
    </div>
  );
}

function LegendChip({ color, label, dashed }) {
  return (
    <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
      <span style={{width: 12, height: 2, background: dashed ? "transparent" : color,
                     borderTop: dashed ? `2px dashed ${color}` : "none"}}/>
      <span>{label}</span>
    </span>
  );
}

// ─── Delay planner — what-if implications ─────────────────────────────────
function DelayPlanner() {
  const [delay, setDelay] = useStatePlan(0);
  return (
    <div className="card" style={{padding: 22}}>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28}}>
        <div>
          <div className="eyebrow" style={{marginBottom: 10}}>Delay scenario</div>
          <div style={{fontSize: 14, color: "var(--ink-1)", lineHeight: 1.55, marginBottom: 14}}>
            If we push <b>BSTA-50 #3 clutch-bushing replacement</b> (Thu 21 May) by…
          </div>
          <div style={{display: "flex", gap: 0, border: "1px solid var(--line)"}}>
            {[0, 7, 14, 21, 28].map((d) => (
              <button key={d} onClick={() => setDelay(d)}
                      style={{flex: 1, padding: "10px 12px", border: "none",
                                borderRight: d < 28 ? "1px solid var(--line)" : "none",
                                background: delay === d ? "var(--ink)" : "var(--surface)",
                                color: delay === d ? "white" : "var(--ink-2)",
                                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"}}>
                {d === 0 ? "On time" : "+" + d + " days"}
              </button>
            ))}
          </div>

          <div style={{marginTop: 18, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)"}}>
            <div className="eyebrow" style={{marginBottom: 6}}>Plain-language read</div>
            <div className="pl" style={{fontSize: 13, color: "var(--ink-1)"}}>
              {delay === 0 && <>Lasse comes Thursday. Parts ready. <em>3 h of planned downtime.</em> Expected outcome: replaced before measurable production impact.</>}
              {delay === 7 && <>Acceptable. The trend is gentle; the model still puts failure probability below 5% in this window. <em>Re-check parallelism before the new date.</em></>}
              {delay === 14 && <>Getting tight. Failure probability rises to 18%. We'd advise: keep the spare in your truck, monitor weekly.</>}
              {delay === 21 && <>Risk crosses the threshold we usually act on (28%). <em>Production planning should expect a 1–2 day unplanned downtime risk.</em></>}
              {delay === 28 && <>Likely unplanned failure. ~52% probability. <em>We strongly recommend not pushing this far.</em></>}
            </div>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{marginBottom: 10}}>Risk curve</div>
          <RiskCurve delay={delay}/>
          <div style={{marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16}}>
            <RiskStat label="Failure prob." value={
              delay === 0 ? "<5%" : delay === 7 ? "~7%" : delay === 14 ? "~18%" :
              delay === 21 ? "~28%" : "~52%"
            } status={delay >= 21 ? "warn" : "ok"}/>
            <RiskStat label="If it fails" value="2–3 days" sub="unplanned downtime"/>
            <RiskStat label="Cost at risk" value={`~${delay === 0 ? 0 : delay === 7 ? 8 : delay === 14 ? 24 : delay === 21 ? 48 : 92}k SEK`} status={delay >= 21 ? "warn" : ""}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskCurve({ delay }) {
  const w = 360, h = 140;
  const pad = { l: 30, r: 16, t: 16, b: 24 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  // Sigmoid-ish risk curve from 0..56 days
  const N = 57;
  const data = Array.from({length: N}, (_, i) => {
    const t = i;
    return 1 / (1 + Math.exp(-(t - 24) * 0.13)) * 0.85 + 0.02;
  });
  const xAt = (i) => pad.l + (i / (N - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - v) * innerH;
  const path = data.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yAt(v).toFixed(1)).join(" ");
  const cursorX = xAt(delay);
  const cursorY = yAt(data[delay]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ts-svg" style={{width: "100%"}}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad.l} x2={pad.l + innerW} y1={yAt(p)} y2={yAt(p)} className={p === 0 ? "axis" : "grid"}/>
      ))}
      {/* Threshold band */}
      <rect x={pad.l} y={yAt(0.28)} width={innerW} height={yAt(0) - yAt(0.28)} fill="var(--warn)" opacity="0.05"/>
      <line x1={pad.l} x2={pad.l + innerW} y1={yAt(0.28)} y2={yAt(0.28)} className="threshold"/>
      <text x={pad.l + innerW + 2} y={yAt(0.28) + 3} className="threshold-text">act zone</text>

      <path d={path} className="trace warn"/>

      {/* Cursor */}
      <line x1={cursorX} x2={cursorX} y1={pad.t} y2={pad.t + innerH} stroke="var(--ink)" strokeWidth="1"/>
      <circle cx={cursorX} cy={cursorY} r="3.5" fill="var(--ink)"/>

      {/* X labels */}
      {[0, 7, 14, 21, 28, 42, 56].map((d) => (
        <text key={d} x={xAt(d)} y={pad.t + innerH + 14} className="axis-text" textAnchor="middle">
          {d === 0 ? "today" : "+" + d + "d"}
        </text>
      ))}
      {/* Y labels */}
      {[0, 0.5, 1].map((p) => (
        <text key={p} x={pad.l - 4} y={yAt(p) + 3} className="axis-text" textAnchor="end">{Math.round(p * 100)}%</text>
      ))}
    </svg>
  );
}

function RiskStat({ label, value, sub, status }) {
  const color = status === "warn" ? "var(--warn)" : status === "crit" ? "var(--crit)" : "var(--ink)";
  return (
    <div>
      <div className="eyebrow" style={{marginBottom: 4}}>{label}</div>
      <div className="data-hero" style={{fontSize: 18, color}}>{value}</div>
      {sub && <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 4}}>{sub}</div>}
    </div>
  );
}

window.PlanScreen = PlanScreen;
