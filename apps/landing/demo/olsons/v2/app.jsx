// app.jsx — shell, hash routing, persona state.

const PERSONAS = {
  "manager-cust": {
    id: "manager-cust",
    kind: "customer",
    name: "Erik Persson",
    role: "Production & maintenance manager · NordPlåt",
    initials: "EP",
    greeting: "Good morning, Erik.",
  },
  "tech": {
    id: "tech",
    kind: "tech",
    name: "Lasse Bergström",
    role: "Senior press technician · Olsons",
    initials: "LB",
    greeting: "Good morning, Lasse.",
  },
  "manager": {
    id: "manager",
    kind: "manager",
    name: "Mikael Krey",
    role: "Service manager · Olsons",
    initials: "MK",
    greeting: "Good morning, Mikael.",
  },
};

function App() {
  const [route, setRoute] = React.useState(() => location.hash.slice(1) || "fleet");
  const [personaId, setPersonaId] = React.useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("p") || "manager-cust";
  });

  React.useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(1) || "fleet");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r) => {
    location.hash = r;
    setRoute(r);
    document.querySelector(".page")?.scrollTo({ top: 0, behavior: "instant" });
  };
  const setPersona = (id) => {
    setPersonaId(id);
    // Switching to a tech persona on a non-tech screen lands them on their work.
    if (id === "tech" && !route.startsWith("tech") && !route.startsWith("plan")) {
      go("tech");
    } else if (id === "manager" && !route.startsWith("plan") && !route.startsWith("fleet")) {
      go("plan");
    } else if (id === "manager-cust" && route.startsWith("tech")) {
      go("fleet");
    }
  };

  const persona = PERSONAS[personaId] || PERSONAS["manager-cust"];
  const parts = route.split(":");
  const screen = parts[0];
  const id = parts[1];

  let content = null;
  let crumbs = [];

  if (screen === "fleet" && !id) {
    crumbs = [{ label: "Fleet" }];
    content = <window.FleetScreen go={go} persona={persona}/>;
  } else if (screen === "fleet" && id) {
    const s = window.getSite(id);
    crumbs = [
      { label: "Fleet", onClick: () => go("fleet") },
      { label: s ? s.name : "Site" },
    ];
    content = <window.FleetScreen go={go} persona={persona} siteFilter={id}/>;
  } else if (screen === "press") {
    const p = window.getPress(id);
    const s = p ? window.getSite(p.site) : null;
    crumbs = [
      { label: "Fleet", onClick: () => go("fleet") },
      { label: s?.name || "Site", onClick: () => go("fleet:" + (s?.id || "")) },
      { label: p?.name || "Press" },
    ];
    content = <window.PressScreen pressId={id} go={go} persona={persona}/>;
  } else if (screen === "alert") {
    const a = window.getAlert(id);
    const p = a ? window.getPress(a.machine) : null;
    crumbs = [
      { label: "Fleet", onClick: () => go("fleet") },
      { label: p?.name || "Press", onClick: () => go("press:" + (p?.id || "")) },
      { label: "Recommendation" },
    ];
    content = <window.AlertScreen alertId={id} go={go} persona={persona}/>;
  } else if (screen === "tech") {
    crumbs = [{ label: "My visits" }];
    content = <window.TechScreen go={go} persona={persona}/>;
  } else if (screen === "plan") {
    crumbs = [{ label: "Service plan" }];
    content = <window.PlanScreen go={go} persona={persona}/>;
  } else if (screen === "alarms") {
    // alarms · alarms:templates · alarms:rule:RL-001 · alarms:new · alarms:template:TPL-BSTA-GUIDE
    const sub = parts[1];
    const subId = parts[2];
    const alarmsCrumb = persona.kind === "manager" ? "Knowledge library"
      : persona.kind === "tech" ? "Playbooks & rules"
      : "Alarm rules";
    crumbs = [{ label: alarmsCrumb, onClick: sub ? () => go("alarms") : null }];
    if (sub === "rule")        crumbs.push({ label: window.getRule(subId)?.name || "Rule" });
    if (sub === "template")    crumbs.push({ label: window.getTemplate(subId)?.name || "Template" });
    if (sub === "new")         crumbs.push({ label: persona.kind === "tech" ? "Suggest rule" : persona.kind === "manager" ? "New template" : "New rule" });
    if (sub === "templates")   crumbs.push({ label: "Templates" });
    content = <window.AlarmsScreen go={go} persona={persona} sub={sub} subId={subId}/>;
  } else if (screen === "system") {
    crumbs = [{ label: "Design system" }];
    content = <window.SystemScreen go={go}/>;
  } else {
    crumbs = [{ label: "Not found" }];
    content = <div className="page-body">Not found.</div>;
  }

  return (
    <div className="app">
      <window.Sidebar route={route} setRoute={go} persona={persona} setPersona={setPersona}/>
      <div className="main">
        <window.Topbar crumbs={crumbs}/>
        <div className="page scroll-clean">
          {content}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
