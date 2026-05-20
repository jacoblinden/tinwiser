// app.jsx — App shell, hash routing, tweak wiring.

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1C1B18",
  "palette": ["#1C1B18", "#F5F4F0", "#6B6860"],
  "fontPair": "inter",
  "density": "regular",
  "persona": "technician",
  "ia": "standard",
  "fleetDirection": "list",
  "dark": false
}/*EDITMODE-END*/;

// Persona-aware greetings & defaults
const PERSONAS = {
  technician:  { who: "Klaus Reinhardt", role: "Technician · Wolfsburg", initials: "KR", color: "slate", greeting: "Good morning, Klaus." },
  manager:     { who: "Mara Bellamy",    role: "Reliability eng.",         initials: "MB", color: "copper", greeting: "Morning, Mara." },
  plant:       { who: "Henrik Voss",     role: "Plant manager",             initials: "HV", color: "green",  greeting: "Welcome back, Henrik." },
};

const FONT_PAIRS = {
  inter:   { sans: '"Inter", ui-sans-serif, system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace', display: '"Inter", ui-sans-serif, system-ui, sans-serif', label: "Inter · JetBrains Mono" },
  geist:   { sans: '"Geist", ui-sans-serif, system-ui, sans-serif', mono: '"Geist Mono", ui-monospace, monospace', display: '"Geist", ui-sans-serif, system-ui, sans-serif', label: "Geist · Geist Mono" },
  ibm:     { sans: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace', display: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif', label: "IBM Plex · Plex Mono" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState(() => location.hash.slice(1) || "fleet");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Listen to hash changes
  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(1) || "fleet");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [route]);

  const go = (r) => {
    location.hash = r;
    setRoute(r);
    document.querySelector(".page")?.scrollTo({ top: 0, behavior: "instant" });
  };

  // Apply tweaks to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-strong", shade(t.accent, -15));
    root.style.setProperty("--accent-soft", shade(t.accent, 60, 0.85));
    root.dataset.density = t.density;
    if (t.dark) root.dataset.theme = "dark";
    else delete root.dataset.theme;
    const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS.inter;
    root.style.setProperty("--font-sans", fp.sans);
    root.style.setProperty("--font-mono", fp.mono);
    root.style.setProperty("--font-display", fp.display);
  }, [t.accent, t.density, t.fontPair, t.dark]);

  const persona = PERSONAS[t.persona] || PERSONAS.technician;

  // Parse route
  const parts = route.split(":");
  const screen = parts[0];
  const id = parts[1];

  // Choose what to render
  let content = null;
  let crumbs = [];

  if (screen === "fleet") {
    crumbs = [{ label: "Fleet" }];
    content = <FleetScreen direction={t.fleetDirection} go={go} persona={persona}/>;
  } else if (screen === "site" && id) {
    const s = window.getSite(id);
    crumbs = [{ label: "Fleet", onClick: () => go("fleet") }, { label: s?.name || "Site" }];
    content = <SiteScreen siteId={id} go={go}/>;
  } else if (screen === "machine" && id) {
    const m = window.getMachine(id);
    const s = m ? window.getSite(m.site) : null;
    crumbs = [
      { label: "Fleet", onClick: () => go("fleet") },
      { label: s?.name || "Site", onClick: () => go("site:" + (s?.id || "")) },
      { label: m?.name || "Machine" },
    ];
    content = <MachineScreen machineId={id} go={go}/>;
  } else if (screen === "alert" && id) {
    const a = window.getAlert(id);
    const m = a ? window.getMachine(a.machine) : null;
    crumbs = [
      { label: "Inbox", onClick: () => go("inbox") },
      { label: m?.name || "Machine", onClick: () => go("machine:" + (m?.id || "")) },
      { label: a?.title || "Alert" },
    ];
    content = <AlertScreen alertId={id} go={go}/>;
  } else if (screen === "inbox") {
    crumbs = [{ label: "Inbox" }];
    content = <InboxScreen go={go}/>;
  } else if (screen === "alarms") {
    crumbs = [{ label: "Alarms" }];
    content = <AlarmsScreen go={go}/>;
  } else if (screen === "reports") {
    crumbs = [{ label: "Reports" }];
    content = <ReportsScreen go={go}/>;
  } else if (screen === "investigate") {
    crumbs = [
      { label: "Fleet", onClick: () => go("fleet") },
      { label: "Investigation chart" },
    ];
    content = <InvestigateScreen go={go} />;
  } else {
    content = <div className="page-body">Not found.</div>;
    crumbs = [{ label: "404" }];
  }

  return (
    <div className="app">
      {mobileNavOpen && (
        <div className="side-backdrop" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}
      <Sidebar
        route={screen + (id ? ":" + id : "")}
        setRoute={go}
        ia={t.ia}
        persona={persona}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="main">
        <Topbar crumbs={crumbs} onMenuOpen={() => setMobileNavOpen(true)} />
        <div className="page scroll-clean">
          {content}
        </div>
      </div>
      <MobileBottomNav
        route={screen + (id ? ":" + id : "")}
        setRoute={go}
        ia={t.ia}
        onOpenMenu={() => setMobileNavOpen(true)}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Information architecture" />
        <TweakRadio
          label="IA"
          value={t.ia}
          options={[{value:"standard", label:"Standard"}, {value:"inbox", label:"Inbox-first"}]}
          onChange={(v) => setTweak("ia", v)}
        />
        <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: -4, lineHeight: 1.45}}>
          {t.ia === "standard"
            ? "Fleet → Site → Machine → Alert hierarchy."
            : "Inbox-first: technicians live in alerts. Fleet is browsing."}
        </div>

        <TweakSection label="Fleet overview" />
        <TweakRadio
          label="Direction"
          value={t.fleetDirection}
          options={[{value:"list", label:"List-first"}, {value:"map", label:"Site rank"}]}
          onChange={(v) => setTweak("fleetDirection", v)}
        />

        <TweakSection label="Persona" />
        <TweakSelect
          label="Default view"
          value={t.persona}
          options={[
            {value:"technician", label:"Technician (default)"},
            {value:"manager", label:"Maintenance manager"},
            {value:"plant", label:"Plant manager"},
          ]}
          onChange={(v) => setTweak("persona", v)}
        />

        <TweakSection label="Visuals" />
        <TweakColor label="Accent" value={t.accent}
          options={["#1C1B18", "#4A6082", "#2F7A4F", "#6B6860"]}
          onChange={(v) => setTweak("accent", v)}/>
        <TweakSelect label="Type pairing" value={t.fontPair}
          options={[
            {value:"inter", label:"Inter · JetBrains Mono"},
            {value:"geist", label:"Geist · Geist Mono"},
            {value:"ibm", label:"IBM Plex · Plex Mono"},
          ]}
          onChange={(v) => setTweak("fontPair", v)}/>
        <TweakRadio label="Density" value={t.density}
          options={[{value:"compact", label:"Compact"}, {value:"regular", label:"Regular"}, {value:"comfy", label:"Comfy"}]}
          onChange={(v) => setTweak("density", v)}/>
        <TweakToggle label="Dark mode" value={t.dark}
          onChange={(v) => setTweak("dark", v)}/>
      </TweaksPanel>
    </div>
  );
}

// Color shade helper — works on hex
function shade(hex, pct, alpha = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  const adjust = (v) => Math.max(0, Math.min(255, Math.round(v + (pct >= 0 ? (255 - v) * pct / 100 : v * pct / 100))));
  if (alpha < 1) {
    return `rgba(${adjust(r)}, ${adjust(g)}, ${adjust(b)}, ${alpha})`;
  }
  return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
