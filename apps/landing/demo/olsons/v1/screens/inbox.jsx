// inbox.jsx — Notifications / Inbox screen.

const { useState: useStateInbox } = React;

function InboxScreen({ go }) {
  const Ic = window.Icons;
  const [filter, setFilter] = useStateInbox("open");
  const [selected, setSelected] = useStateInbox(null);

  const items = window.DATA.ALERTS.filter((a) => {
    if (filter === "open") return a.status === "open";
    if (filter === "critical") return a.severity === "crit";
    if (filter === "mine") return false;
    return true;
  });

  return (
    <div className="page-body fade-in" style={{maxWidth: 1400}}>
      <div className="page-h">
        <div>
          <h1 className="page-title">Inbox</h1>
          <div className="page-sub">{items.length} open · 1 critical needs attention now</div>
        </div>
        <div style={{display:"flex", gap: 8}}>
          <button className="btn btn-sm btn-ghost" title="Mark all read"><Ic.check size={13}/> Mark all read</button>
          <button className="btn btn-sm btn-ghost" title="Snooze rules"><Ic.bell size={13}/> Snooze rules</button>
        </div>
      </div>

      <div className="filterbar">
        <div style={{display: "inline-flex", padding: 0, border: "1px solid var(--line)", background: "var(--surface)"}} className="seg-ctrl">
          {[{v:"open", l:"Open"}, {v:"critical", l:"Critical"}, {v:"mine", l:"Assigned to me"}, {v:"all", l:"All"}].map((o) => (
            <button key={o.v} onClick={() => setFilter(o.v)} className={filter === o.v ? "active" : ""}>
              {o.l}
            </button>
          ))}
        </div>
        <div className="sep"/>
        <button className="btn btn-sm btn-ghost"><Ic.filter size={13}/> Site</button>
        <button className="btn btn-sm btn-ghost">Severity</button>
        <button className="btn btn-sm btn-ghost">Source</button>
        <div style={{marginLeft: "auto", color: "var(--ink-3)", fontSize: 12}}>Ordered by urgency</div>
      </div>

      <div className="inbox-layout" style={{display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 18}}>
        {/* Left — list */}
        <div className="card" style={{padding: 0, overflow: "hidden"}}>
          {items.map((a, i) => {
            const m = window.getMachine(a.machine);
            const s = window.getSite(a.site);
            const sev = statusToClass(a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : a.severity === "unknown" ? "unknown" : "warn");
            const isSelected = selected === a.id;
            return (
              <div key={a.id}
                   onClick={() => setSelected(a.id)}
                   className="row-hover inbox-row"
                   style={{display: "grid",
                             gridTemplateColumns: "10px 1fr auto auto",
                             gap: 14, padding: "14px 18px",
                             borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
                             cursor: "pointer", alignItems: "flex-start",
                             background: isSelected ? "var(--surface-2)" : "transparent"}}>
                <span className={"dot " + sev} style={{marginTop: 6, flexShrink: 0}}/>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display:"flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap"}}>
                    <span style={{fontSize: 14, fontWeight: 500, color: "var(--ink)"}}>{a.title}</span>
                    <span className="mono" style={{fontSize: 11, color: "var(--ink-4)", flexShrink: 0}}>{a.id}</span>
                  </div>
                  <div style={{fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5,
                                  overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical"}}>
                    {a.pl}
                  </div>
                  <div style={{fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, display: "flex", alignItems: "center", gap: 8}}>
                    <MachineIcon type={m?.type} size={11} />
                    <span>{m?.name}</span>
                    <span>·</span>
                    <span>{s?.name}</span>
                  </div>
                </div>
                <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6}}>
                  <StatusTag status={sev}>{severityLabel(a.severity)}</StatusTag>
                  <span style={{fontSize: 11, color: "var(--ink-3)"}}>{a.raised}</span>
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end"}}>
                  <button className="btn btn-sm btn-ghost"><Ic.chevR size={12}/></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right — preview */}
        <InboxPreview alertId={selected || items[0]?.id} go={go}/>
      </div>
    </div>
  );
}

function InboxPreview({ alertId, go }) {
  const Ic = window.Icons;
  const a = alertId && window.getAlert(alertId);
  if (!a) {
    return (
      <div className="card" style={{padding: 24, textAlign: "center", color: "var(--ink-3)"}}>
        Select an alert to preview.
      </div>
    );
  }
  const m = window.getMachine(a.machine);
  const s = window.getSite(a.site);
  const sev = statusToClass(a.severity === "crit" ? "crit" : a.severity === "warn" ? "warn" : "unknown");

  return (
    <div className="card inbox-preview-panel" style={{padding: 0, overflow: "hidden", position: "sticky", top: 0, alignSelf: "flex-start"}}>
      <div style={{padding: "16px 18px", borderBottom: "1px solid var(--line)"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 8}}>
          <StatusTag status={sev}>{severityLabel(a.severity)}</StatusTag>
          <span className="mono t-4" style={{fontSize: 11}}>{a.id}</span>
          <span className="t-4" style={{marginLeft: "auto", fontSize: 11.5}}>{a.raised}</span>
        </div>
        <div style={{fontSize: 16, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em"}}>{a.title}</div>
        <div style={{display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12, color: "var(--ink-3)"}}>
          <MachineIcon type={m?.type} size={12}/>
          <span>{m?.name}</span>
          <span>·</span>
          <span>{s?.name}</span>
        </div>
      </div>

      <div style={{padding: "16px 18px"}}>
        <div className="eyebrow" style={{marginBottom: 8}}>What's happening</div>
        <p style={{margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-1)"}}>{a.pl}</p>
      </div>

      {a.actions && (
        <div style={{padding: "16px 18px", borderTop: "1px solid var(--line)"}}>
          <div className="eyebrow" style={{marginBottom: 8}}>Recommended</div>
          <div style={{display: "flex", flexDirection: "column", gap: 8}}>
            {a.actions.slice(0, 2).map((ac, i) => (
              <div key={i} style={{display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-1)", lineHeight: 1.5}}>
                <span style={{width: 14, height: 14, borderRadius: 3, border: "1.5px solid var(--line-strong)", marginTop: 2, flexShrink: 0}}/>
                <span style={{minWidth: 0}}>{ac.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{padding: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 6}}>
        <button className="btn btn-sm btn-ghost" style={{flex: 1}}>Snooze</button>
        <button className="btn btn-sm" style={{flex: 1}} onClick={() => go("alert:" + a.id)}>Open full →</button>
      </div>
    </div>
  );
}

window.InboxScreen = InboxScreen;
