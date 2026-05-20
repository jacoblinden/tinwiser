// data.js — Mock data for the Olsons predictive maintenance vision demo.
//
// One Olsons customer: NordPlåt AB, a sheet-metal fabricator with 22 presses
// across two sites (Vingåker HQ and Eskilstuna). The Olsons relationship is
// embedded: named technicians, in-house parts inventory, scheduled visits.
//
// The story:
//   • One press (BSTA-50 #3, Vingåker) is showing slide-side guide wear —
//     predicted 3–4 weeks to action. Olsons tech Lasse Bergström scheduled Thu.
//   • One press (MSP-630 #1, Vingåker) is "watch" with rising bearing vibration.
//   • One press (Aida NC1-300 #2, Eskilstuna) has a recipe drift on tonnage.
//   • One sensor offline. The rest are healthy.

// ───────────────────────────────────────────────────────────────────────────
// Customer
// ───────────────────────────────────────────────────────────────────────────
const CUSTOMER = {
  id: "nordplat",
  name: "NordPlåt AB",
  legalName: "NordPlåt Industri AB",
  org: "556842-1907",
  contractStart: "Mar 2019",
  contractTier: "Service + Predictive (pilot)",
  maintenanceManager: { name: "Erik Persson", role: "Production & maintenance manager", initials: "EP" },
  productionManager:  { name: "Anna Lundgren", role: "Production planner", initials: "AL" },
  workshop: "Olsons Vingåker workshop · 14 km",
};

// ───────────────────────────────────────────────────────────────────────────
// Olsons crew (technicians + service manager)
// ───────────────────────────────────────────────────────────────────────────
const OLSONS = {
  manager: { id: "mk", name: "Mikael Krey", role: "Service manager", initials: "MK", region: "Sweden", phone: "+46 70 123 45 67" },
  techs: [
    { id: "lb", name: "Lasse Bergström",  role: "Senior press technician", initials: "LB", base: "Vingåker", specialty: "Mechanical · Bruderer · Schuler", years: 22, phone: "+46 70 222 33 41" },
    { id: "ah", name: "Anders Holm",       role: "Press technician",        initials: "AH", base: "Vingåker", specialty: "Hydraulic · AP&T · servo", years: 11, phone: "+46 70 222 33 42" },
    { id: "po", name: "Petra Olsson",      role: "Press technician",        initials: "PO", base: "Eskilstuna", specialty: "Sensors · electrical · drives", years: 8, phone: "+46 70 222 33 43" },
    { id: "jl", name: "Johan Lindqvist",   role: "Apprentice technician",   initials: "JL", base: "Vingåker", specialty: "General · learning", years: 2, phone: "+46 70 222 33 44" },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// Sites (1–2 sites, gracefully)
// ───────────────────────────────────────────────────────────────────────────
const SITES = [
  {
    id: "vng", name: "Vingåker", fullName: "Vingåker — Stamping Hall",
    coord: [59.0411, 15.8736],
    address: "Industrigatan 14, 643 80 Vingåker",
    pressCount: 16,
    contact: { name: "Erik Persson", role: "Maintenance manager" },
    olsonsDistance: "14 km from Olsons workshop",
    olsonsDistanceKm: 14,
    areas: ["Hall A — fine blanking", "Hall B — heavy stamping", "Hall C — servo cell"],
    health: 92,
    attention: 2,
    forecast30: 3,
    primary: true,
  },
  {
    id: "esk", name: "Eskilstuna", fullName: "Eskilstuna — Servo Cell",
    coord: [59.3713, 16.5074],
    address: "Verkstadsgatan 3, 632 21 Eskilstuna",
    pressCount: 6,
    contact: { name: "Margareta Bjuhr", role: "Site lead" },
    olsonsDistance: "62 km from Olsons workshop",
    olsonsDistanceKm: 62,
    areas: ["Servo cell", "Coil & feeder"],
    health: 88,
    attention: 1,
    forecast30: 1,
    primary: false,
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Presses — 22 total, mostly healthy. A few interesting ones for the story.
// type:      mechanical | servo | hydraulic | fineblank | feeder
// status:    ok | warn | crit | unknown
// criticality: A (line-stopper) | B | C
// trendKey:  flat | rising | drift | wobble | stepped | spike | offline
// ───────────────────────────────────────────────────────────────────────────
const PRESSES = [
  // ─── Vingåker — Hall A — fine blanking ───────────────────────────────────
  { id: "VNG-BSTA-03", site: "vng", area: "Hall A — fine blanking",
    name: "BSTA-50 #3", model: "Bruderer BSTA 50",
    type: "mechanical", tonnage: 50, spm: { min: 80, max: 1100 },
    criticality: "A", commissioned: "2014",
    health: 71, status: "warn",
    issue: "Slide-side guide wear — parallelism drifting",
    forecast: "Predicted intervention in 3–4 weeks",
    runtime: "412 h since service", lastService: "28 Apr 2026",
    nextOlsonsVisit: "Thu 21 May · Lasse Bergström",
    trendKey: "rising",
    activeRecipe: "Contact spring 0.4 mm — recipe R-114",
    summary: "Operating, ~640 spm. Trend on slide parallelism. Action coming, not urgent." },

  { id: "VNG-BSTA-01", site: "vng", area: "Hall A — fine blanking",
    name: "BSTA-50 #1", model: "Bruderer BSTA 50", type: "mechanical",
    tonnage: 50, spm: { min: 80, max: 1100 }, criticality: "A", commissioned: "2012",
    health: 96, status: "ok", runtime: "212 h since service", trendKey: "flat",
    activeRecipe: "Bracket 1.2 mm — recipe R-088" },

  { id: "VNG-BSTA-02", site: "vng", area: "Hall A — fine blanking",
    name: "BSTA-50 #2", model: "Bruderer BSTA 50", type: "mechanical",
    tonnage: 50, spm: { min: 80, max: 1100 }, criticality: "A", commissioned: "2013",
    health: 94, status: "ok", runtime: "318 h since service", trendKey: "flat" },

  { id: "VNG-BSTA-04", site: "vng", area: "Hall A — fine blanking",
    name: "BSTA-50 #4", model: "Bruderer BSTA 50", type: "mechanical",
    tonnage: 50, spm: { min: 80, max: 1100 }, criticality: "A", commissioned: "2017",
    health: 91, status: "ok", runtime: "128 h since service", trendKey: "wobble" },

  { id: "VNG-FB-200", site: "vng", area: "Hall A — fine blanking",
    name: "Feintool HFA 200", model: "Feintool HFA 200", type: "fineblank",
    tonnage: 200, spm: { min: 30, max: 90 }, criticality: "A", commissioned: "2019",
    health: 89, status: "ok", runtime: "642 h since service", trendKey: "flat" },

  // ─── Vingåker — Hall B — heavy stamping ─────────────────────────────────
  { id: "VNG-MSP-01", site: "vng", area: "Hall B — heavy stamping",
    name: "MSP-630 #1", model: "Schuler MSP 630", type: "mechanical",
    tonnage: 630, spm: { min: 20, max: 60 }, criticality: "A", commissioned: "2008",
    health: 78, status: "warn",
    issue: "Drive-side bearing vibration trending up",
    forecast: "Watch — 4–6 weeks to threshold",
    runtime: "1,210 h since service", lastService: "12 Mar 2026",
    nextOlsonsVisit: "Wed 27 May · Quarterly inspection",
    trendKey: "drift",
    activeRecipe: "Door panel reinforcement — R-201",
    summary: "Slow rise on DE bearing RMS. Below alarm. Plan inspection in May." },

  { id: "VNG-MSP-02", site: "vng", area: "Hall B — heavy stamping",
    name: "MSP-630 #2", model: "Schuler MSP 630", type: "mechanical",
    tonnage: 630, spm: { min: 20, max: 60 }, criticality: "A", commissioned: "2009",
    health: 93, status: "ok", runtime: "896 h since service", trendKey: "flat" },

  { id: "VNG-MSP-03", site: "vng", area: "Hall B — heavy stamping",
    name: "MSP-630 #3", model: "Schuler MSP 630", type: "mechanical",
    tonnage: 630, spm: { min: 20, max: 60 }, criticality: "A", commissioned: "2011",
    health: 90, status: "ok", runtime: "1,420 h since service", trendKey: "flat" },

  { id: "VNG-APT-400", site: "vng", area: "Hall B — heavy stamping",
    name: "AP&T LP-400", model: "AP&T LP 400", type: "hydraulic",
    tonnage: 400, spm: { min: 8, max: 22 }, criticality: "B", commissioned: "2016",
    health: 91, status: "ok", runtime: "514 h since service", trendKey: "flat" },

  { id: "VNG-APT-250", site: "vng", area: "Hall B — heavy stamping",
    name: "AP&T LP-250", model: "AP&T LP 250", type: "hydraulic",
    tonnage: 250, spm: { min: 10, max: 28 }, criticality: "B", commissioned: "2018",
    health: 94, status: "ok", runtime: "612 h since service", trendKey: "flat" },

  // ─── Vingåker — Hall C — servo cell ──────────────────────────────────────
  { id: "VNG-NC1-01", site: "vng", area: "Hall C — servo cell",
    name: "Aida NC1-300 #1", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "A", commissioned: "2020",
    health: 95, status: "ok", runtime: "302 h since service", trendKey: "flat" },

  { id: "VNG-NC1-02", site: "vng", area: "Hall C — servo cell",
    name: "Aida NC1-300 #2", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "A", commissioned: "2021",
    health: 92, status: "ok", runtime: "194 h since service", trendKey: "wobble" },

  { id: "VNG-FEED-01", site: "vng", area: "Hall C — servo cell",
    name: "Coil feeder F-01", model: "Bruderer FB-50", type: "feeder",
    tonnage: null, spm: { min: 30, max: 1100 }, criticality: "B", commissioned: "2014",
    health: 87, status: "ok", runtime: "1,820 h since service", trendKey: "flat" },

  { id: "VNG-FEED-02", site: "vng", area: "Hall C — servo cell",
    name: "Coil feeder F-02", model: "Bruderer FB-50", type: "feeder",
    tonnage: null, spm: { min: 30, max: 1100 }, criticality: "B", commissioned: "2017",
    health: null, status: "unknown",
    issue: "Vibration sensor offline since 06:42",
    forecast: "Sensor — gateway dropouts on this channel",
    runtime: "—", trendKey: "offline",
    summary: "Sensor not reporting. Press may be fine — we can't tell." },

  { id: "VNG-MSP-04", site: "vng", area: "Hall B — heavy stamping",
    name: "MSP-630 #4", model: "Schuler MSP 630", type: "mechanical",
    tonnage: 630, spm: { min: 20, max: 60 }, criticality: "A", commissioned: "2010",
    health: 89, status: "ok", runtime: "1,108 h since service", trendKey: "flat" },

  { id: "VNG-APT-160", site: "vng", area: "Hall B — heavy stamping",
    name: "AP&T LP-160", model: "AP&T LP 160", type: "hydraulic",
    tonnage: 160, spm: { min: 12, max: 32 }, criticality: "C", commissioned: "2015",
    health: 93, status: "ok", runtime: "412 h since service", trendKey: "flat" },

  // ─── Eskilstuna — servo cell ─────────────────────────────────────────────
  { id: "ESK-NC1-01", site: "esk", area: "Servo cell",
    name: "Aida NC1-300 #1", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "A", commissioned: "2020",
    health: 93, status: "ok", runtime: "284 h since service", trendKey: "flat" },

  { id: "ESK-NC1-02", site: "esk", area: "Servo cell",
    name: "Aida NC1-300 #2", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "A", commissioned: "2021",
    health: 81, status: "warn",
    issue: "Peak tonnage drifting upward — 6% above baseline",
    forecast: "Likely tool wear — review in 2 weeks",
    runtime: "612 h since service", lastService: "02 Feb 2026",
    nextOlsonsVisit: "—",
    trendKey: "stepped",
    activeRecipe: "Mount bracket — recipe R-302",
    summary: "Peak force per stroke is creeping. Probably die wear, not press wear." },

  { id: "ESK-NC1-03", site: "esk", area: "Servo cell",
    name: "Aida NC1-300 #3", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "A", commissioned: "2022",
    health: 96, status: "ok", runtime: "82 h since service", trendKey: "flat" },

  { id: "ESK-NC1-04", site: "esk", area: "Servo cell",
    name: "Aida NC1-300 #4", model: "Aida NC1-300", type: "servo",
    tonnage: 300, spm: { min: 30, max: 110 }, criticality: "B", commissioned: "2019",
    health: 88, status: "ok", runtime: "918 h since service", trendKey: "wobble" },

  // ─── Eskilstuna — coil & feeder ──────────────────────────────────────────
  { id: "ESK-FEED-01", site: "esk", area: "Coil & feeder",
    name: "Bruderer FB-50", model: "Bruderer FB-50", type: "feeder",
    tonnage: null, spm: { min: 30, max: 1100 }, criticality: "B", commissioned: "2018",
    health: 91, status: "ok", runtime: "514 h since service", trendKey: "flat" },

  { id: "ESK-DCL-01", site: "esk", area: "Coil & feeder",
    name: "Decoiler D-01", model: "AP&T DCL-3T", type: "feeder",
    tonnage: null, spm: { min: 5, max: 80 }, criticality: "C", commissioned: "2018",
    health: 96, status: "ok", runtime: "208 h since service", trendKey: "flat" },
];

// ───────────────────────────────────────────────────────────────────────────
// Alerts / recommendations (the predictive layer's output)
// ───────────────────────────────────────────────────────────────────────────
const ALERTS = [
  {
    id: "ALR-2604",
    machine: "VNG-BSTA-03",
    site: "vng",
    severity: "warn",
    title: "Slide-side guide wear — parallelism drifting",
    pl: "BSTA-50 #3 is showing a slow drift in slide parallelism — corner-to-corner difference has grown from 18 µm to 42 µm over the past 8 weeks. Still well within tolerance (limit 80 µm), but the slope is consistent with guide-bushing wear on the clutch side. We project this reaches action threshold in 3–4 weeks.",
    why: "Continuous parallelism measurement on the four slide corners shows the clutch-side rear corner drifting low by ~3 µm/week. Drive current per stroke has risen 4% in step. Pattern matches 18 historical cases of clutch-side guide bushing wear on BSTA-50 frames.",
    confidence: 81,
    confidenceNote: "Trained on 184 BSTA-frame guide wear cases across Olsons fleet.",
    raised: "Yesterday, 14:22",
    raisedAt: "2026-05-18 14:22",
    actions: [
      { id: "a1", text: "Schedule clutch-side guide bushing replacement", primary: true, suggested: { tech: "lb", when: "Thu 21 May · 09:00", duration: "3 h" } },
      { id: "a2", text: "Verify parts on hand — Olsons workshop confirmed in stock" },
      { id: "a3", text: "Plan production around 3 h downtime · Anna Lundgren notified" },
      { id: "a4", text: "Continue monitoring · re-evaluate weekly" },
    ],
    parts: [
      { ref: "OLS-BX-2204",  name: "Guide bushing kit (clutch-side, BSTA-50)", stock: "Olsons Vingåker · 2 in stock", primary: true },
      { ref: "SKF-6210-2RS", name: "SKF 6210-2RS pillow bearing × 2",          stock: "Olsons Vingåker · 6 in stock" },
      { ref: "MS-12-04",     name: "Bushing puller adapter (rental)",          stock: "Bring from Olsons toolroom" },
      { ref: "LUB-220",      name: "Mobil SHC 220 grease — 400 g",              stock: "Olsons Vingåker · in stock" },
    ],
    similar: [
      { ref: "WO-2018-04",  customer: "Sandviken Plåt",       date: "Jan 2025", machine: "BSTA-50 #2", outcome: "Replaced — 3.2 h downtime, no production loss" },
      { ref: "WO-1922-11",  customer: "Köpings Stamping",     date: "Sep 2024", machine: "BSTA-50 #4", outcome: "Replaced before threshold — 2.8 h" },
      { ref: "WO-1817-02",  customer: "NordPlåt Vingåker",    date: "Mar 2024", machine: "BSTA-50 #1", outcome: "Replaced + alignment — 4.1 h" },
    ],
    suggestedTech: "lb",
    suggestedSlot: { day: "Thu 21 May", time: "09:00", duration: "3 h", drive: "18 min from depot" },
    avoidedDowntimeEst: { hours: 6.5, savingsSEK: 92000, note: "Estimated, based on past unplanned guide failures" },
    status: "open",
    provenance: { tier: "olsons-template", ruleId: "RL-001", templateId: "TPL-BSTA-GUIDE" },
  },

  {
    id: "ALR-2601",
    machine: "VNG-MSP-01",
    site: "vng",
    severity: "warn",
    title: "Drive-side bearing vibration trending up",
    pl: "MSP-630 #1 is showing a slow rise in drive-side bearing vibration. Velocity RMS has climbed from 2.8 mm/s to 3.6 mm/s over 14 days. Nothing urgent — readings are still within normal — but a linear projection crosses our warn threshold of 4.5 mm/s in roughly 4–6 weeks.",
    why: "Velocity RMS on the drive-end bearing trends up at ~0.05 mm/s/day. Acceleration kurtosis is steady, so we're seeing wear, not impending failure. Bearings on this MSP-630 frame typically run 2–3 years between changes — this one is at 19 months.",
    confidence: 73,
    confidenceNote: "Slope-based projection; widens uncertainty as it extrapolates.",
    raised: "3 days ago",
    actions: [
      { id: "a1", text: "Plan bearing inspection at next quarterly visit (Wed 27 May)", primary: true, suggested: { tech: "ah", when: "Wed 27 May · with quarterly" } },
      { id: "a2", text: "Verify spare bearing on site" },
      { id: "a3", text: "Re-greasing — last lubricated 38 days ago" },
    ],
    parts: [
      { ref: "SKF-22220EK", name: "SKF 22220 EK spherical roller bearing", stock: "Olsons Vingåker · 1 in stock · 3 day reorder", primary: true },
      { ref: "LUB-220",     name: "Mobil SHC 220 grease",                   stock: "Olsons Vingåker · in stock" },
    ],
    similar: [
      { ref: "WO-1944-08", customer: "NordPlåt Vingåker", date: "Sep 2024", machine: "MSP-630 #2", outcome: "Re-greased only — no replacement" },
    ],
    suggestedTech: "ah",
    suggestedSlot: { day: "Wed 27 May", time: "08:00", duration: "1 h (during quarterly)", drive: "—" },
    status: "open",
    provenance: { tier: "olsons-template", ruleId: "RL-003", templateId: "TPL-MSP-BEARING" },
  },

  {
    id: "ALR-2598",
    machine: "ESK-NC1-02",
    site: "esk",
    severity: "warn",
    title: "Peak tonnage 6% above baseline on R-302",
    pl: "Aida NC1-300 #2 in Eskilstuna is hitting 318 ton on the mount-bracket recipe (R-302) when it used to hit 300 ton. The press is fine — but the die or material is changing. Likely candidates: punch wear, material thicker than spec, or lubrication.",
    why: "Peak tonnage on R-302 trended up gradually from 298 to 318 ton over 9,400 cycles. The tonnage signature at BDC has broadened — consistent with progressive punch wear rather than a single tooling failure.",
    confidence: 68,
    confidenceNote: "Pattern matches die-wear class; less certain about exact cause.",
    raised: "2 days ago",
    actions: [
      { id: "a1", text: "Inspect die R-302 at next run change", primary: true, suggested: { tech: "po", when: "On site · next changeover" } },
      { id: "a2", text: "Verify incoming material lot — check thickness within spec" },
      { id: "a3", text: "Check lubrication nozzles — last cleaned 6 weeks ago" },
    ],
    parts: [
      { ref: "DIE-R302-P", name: "Punch insert (mount bracket — R-302)", stock: "Customer-owned tooling · check rack 4" },
    ],
    similar: [],
    suggestedTech: "po",
    suggestedSlot: { day: "Next changeover", time: "TBD", duration: "1.5 h", drive: "On site" },
    status: "open",
    provenance: { tier: "olsons-template", ruleId: "RL-004", templateId: "TPL-AIDA-TONNAGE" },
  },

  {
    id: "ALR-2595",
    machine: "VNG-FEED-02",
    site: "vng",
    severity: "unknown",
    title: "Sensor offline since 06:42",
    pl: "Coil feeder F-02's vibration sensor stopped reporting at 06:42 this morning. The feeder may be running perfectly — but we can't see it. This usually means the gateway dropped that channel; happens once every 4–6 weeks on this site's older cabinet.",
    why: "Last sample 06:42:14. Other sensors on the same gateway still reporting. Likely cause: USB-modbus adapter on cabinet 3.",
    confidence: null,
    raised: "Today, 06:42",
    actions: [
      { id: "a1", text: "Power-cycle the gateway in cabinet 3", primary: true },
      { id: "a2", text: "If still offline after 10 min, page Petra Olsson" },
    ],
    parts: [],
    similar: [],
    suggestedTech: "po",
    status: "open",
    provenance: { tier: "anomaly", ruleId: null, templateId: null },
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Tech suggestions — field knowledge routed to service manager for publication
// ───────────────────────────────────────────────────────────────────────────
const TECH_SUGGESTIONS = [
  {
    id: "SUG-014",
    title: "MSP-630 · oil temp when cycle rate > 80%",
    plain: "On Schuler MSP-630, hydraulic oil runs 6–8°C hotter when cycle rate stays above ~80% of max for long runs. Worth a template — we've seen cooler fouling masked until then.",
    pressClass: "Schuler MSP-630",
    pressType: "mechanical",
    machine: "VNG-MSP-01",
    site: "vng",
    channels: ["hydraulic.oil_temp", "press.spm"],
    severity: "warn",
    author: { id: "lb", name: "Lasse Bergström" },
    raised: "Mon 12 May",
    status: "pending",
    relatedTemplate: null,
  },
  {
    id: "SUG-011",
    title: "BSTA-50 · ignore parallelism during R-114 warmup",
    plain: "NordPlåt runs recipe R-114 with a known 200-cycle warmup — parallelism drifts then settles. Suggest recipe-aware suppression on guide-drift template for first 200 cycles.",
    pressClass: "Bruderer BSTA-50",
    pressType: "mechanical",
    machine: "VNG-BSTA-03",
    site: "vng",
    channels: ["slide.parallelism.rear_clutch", "press.active_recipe"],
    severity: "info",
    author: { id: "lb", name: "Lasse Bergström" },
    raised: "Wed 14 May",
    status: "pending",
    relatedTemplate: "TPL-BSTA-GUIDE",
  },
  {
    id: "SUG-009",
    title: "Feeder F-02 · gateway dropout pattern",
    plain: "Cabinet 3 USB-modbus drops this channel every 4–6 weeks. Suggest a short offline rule (10 min) so ops doesn't chase ghosts — not a press fault.",
    pressClass: "Bruderer FB-50 / FB-100",
    pressType: "feeder",
    machine: "VNG-FEED-02",
    site: "vng",
    channels: ["feeder.vibration"],
    severity: "info",
    author: { id: "po", name: "Petra Olsson" },
    raised: "Today, 07:15",
    status: "pending",
    relatedTemplate: null,
  },
  {
    id: "SUG-006",
    title: "AP&T LP-400 · counterbalance drift after die change",
    plain: "Counterbalance pressure steps after heavy die changes — 48h settle window before alarming would cut false positives.",
    pressClass: "AP&T LP series",
    pressType: "hydraulic",
    machine: "VNG-APT-400",
    site: "vng",
    channels: ["press.counterbalance_pressure"],
    severity: "info",
    author: { id: "ah", name: "Anders Holm" },
    raised: "Fri 9 May",
    status: "in_review",
    relatedTemplate: "TPL-APT-OILTEMP",
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Forecast — predicted items not yet "alerts"
// ───────────────────────────────────────────────────────────────────────────
const FORECAST = [
  { id: "F-1",  machine: "VNG-BSTA-03", site: "vng", text: "Clutch-side guide bushing — replacement",      weeks: 3.5, confidence: 0.81, kind: "intervention" },
  { id: "F-2",  machine: "VNG-MSP-01",  site: "vng", text: "Drive-end bearing — inspect, possibly replace", weeks: 5.0, confidence: 0.73, kind: "intervention" },
  { id: "F-3",  machine: "ESK-NC1-02",  site: "esk", text: "R-302 punch — inspect for wear",                weeks: 2.0, confidence: 0.68, kind: "inspection" },
  { id: "F-4",  machine: "VNG-FB-200",  site: "vng", text: "Hydraulic filter — service interval reached",    weeks: 4.5, confidence: 0.92, kind: "service" },
  { id: "F-5",  machine: "VNG-APT-400", site: "vng", text: "Annual safety inspection",                       weeks: 6.0, confidence: 1.0,  kind: "service" },
];

// ───────────────────────────────────────────────────────────────────────────
// Service plan — calendar items, 8 weeks forward
// kind: "scheduled" = contracted Olsons visits
//       "predicted" = AI-flagged work, not yet booked
//       "booked"    = predicted that has been turned into an appointment
// ───────────────────────────────────────────────────────────────────────────
const TODAY = "Mon 18 May 2026";

const PLAN = [
  // This week
  { id: "P-001", date: "2026-05-21", day: "Thu 21 May", time: "09:00", duration: "3 h",
    kind: "booked", title: "Clutch-side guide bushing — BSTA-50 #3",
    machine: "VNG-BSTA-03", site: "vng", tech: "lb",
    alertId: "ALR-2604",
    parts: 4, status: "confirmed",
    note: "Pulled from alert ALR-2604. Press will be offline 09:00–12:00." },

  { id: "P-010", date: "2026-05-22", day: "Fri 22 May", time: "13:00", duration: "1 h",
    kind: "scheduled", title: "Quarterly safety check",
    machine: null, site: "vng", tech: "ah",
    note: "Contract: per-quarter safety inspection (all halls).", parts: 0, status: "confirmed" },

  // Next week
  { id: "P-002", date: "2026-05-27", day: "Wed 27 May", time: "08:00", duration: "5 h",
    kind: "scheduled", title: "Quarterly inspection — Hall B (4 presses)",
    machine: null, site: "vng", tech: "ah",
    note: "Includes inspection of MSP-630 #1 bearing (ALR-2601).", parts: 2, status: "confirmed",
    related: ["ALR-2601"] },

  { id: "P-003", date: "2026-05-28", day: "Thu 28 May", time: "10:00", duration: "1.5 h",
    kind: "predicted", title: "Inspect punch insert R-302",
    machine: "ESK-NC1-02", site: "esk", tech: "po",
    alertId: "ALR-2598",
    parts: 0, status: "proposed",
    note: "At next changeover — coordinate with Anna." },

  // Week of June 1
  { id: "P-004", date: "2026-06-02", day: "Tue 2 Jun", time: "09:00", duration: "1 h",
    kind: "scheduled", title: "Monthly check-in — Vingåker",
    machine: null, site: "vng", tech: "mk",
    note: "Service manager visit · review predictive findings.", parts: 0, status: "confirmed" },

  { id: "P-005", date: "2026-06-04", day: "Thu 4 Jun", time: "13:00", duration: "2.5 h",
    kind: "predicted", title: "Hydraulic filter service — Feintool HFA 200",
    machine: "VNG-FB-200", site: "vng", tech: "ah",
    parts: 2, status: "proposed",
    note: "Filter interval reached. Auto-suggested by service log." },

  // Week of June 8
  { id: "P-006", date: "2026-06-09", day: "Tue 9 Jun", time: "08:00", duration: "4 h",
    kind: "scheduled", title: "Quarterly inspection — Eskilstuna servo cell",
    machine: null, site: "esk", tech: "po",
    note: "All 4 NC1-300 presses + feeder.", parts: 1, status: "confirmed" },

  // Week of June 15
  { id: "P-007", date: "2026-06-17", day: "Wed 17 Jun", time: "09:30", duration: "2 h",
    kind: "predicted", title: "MSP-630 #1 bearing — if trend continues",
    machine: "VNG-MSP-01", site: "vng", tech: "ah",
    parts: 2, status: "watching",
    related: ["ALR-2601"],
    note: "Provisional. May not be needed — re-evaluate weekly." },

  // Week of June 22
  { id: "P-008", date: "2026-06-25", day: "Thu 25 Jun", time: "08:00", duration: "6 h",
    kind: "scheduled", title: "Annual safety inspection — AP&T LP-400",
    machine: "VNG-APT-400", site: "vng", tech: "lb",
    parts: 0, status: "confirmed",
    note: "Regulatory — annual." },

  // Past (for context)
  { id: "P-101", date: "2026-05-14", day: "Wed 14 May", time: "—", duration: "2.4 h",
    kind: "completed", title: "Quarterly — Hall A (5 presses)",
    machine: null, site: "vng", tech: "lb",
    parts: 1, status: "done",
    note: "Re-greased BSTA-50 #3 drive bearings. Flagged guide drift — escalated." },

  { id: "P-102", date: "2026-05-07", day: "Wed 7 May", time: "—", duration: "0.8 h",
    kind: "completed", title: "Sensor calibration — F-01",
    machine: "VNG-FEED-01", site: "vng", tech: "po",
    parts: 0, status: "done" },
];

// ───────────────────────────────────────────────────────────────────────────
// Customer-facing KPIs
// ───────────────────────────────────────────────────────────────────────────
const KPI = {
  fleetHealth: 91,
  presses: PRESSES.length,
  sites: SITES.length,
  open: ALERTS.filter(a => a.status === "open").length,
  critical: ALERTS.filter(a => a.severity === "crit" && a.status === "open").length,
  forecast30: FORECAST.filter(f => f.weeks <= 4.3).length,
  // Cumulative-since-pilot quantified value
  avoidedDowntimeHours: 84,
  avoidedSavingsSEK: 612000,
  pilotStarted: "Jan 2026",
  nextOlsonsVisit: { day: "Thu 21 May", tech: "Lasse Bergström", reason: "Predicted: BSTA-50 #3 guide bushings" },
};

// ───────────────────────────────────────────────────────────────────────────
// Live signal channels per press (for the signal grid)
// ───────────────────────────────────────────────────────────────────────────
// Per-press realistic peak tonnage (matches force-curve data)
const PRESS_PEAK = {
  "VNG-BSTA-03": { current: 39.4, baseline: 38.0 },
  "VNG-BSTA-01": { current: 38.0, baseline: 38.0 },
  "VNG-MSP-01":  { current: 478,  baseline: 480 },
  "ESK-NC1-02":  { current: 318,  baseline: 300 },
};
function tonnageFor(press) {
  if (!press.tonnage) return null;
  const known = PRESS_PEAK[press.id];
  if (known) return known;
  const baseline = Math.round(press.tonnage * 0.78);
  return { current: baseline, baseline };
}
function fmtTon(v) {
  if (v == null) return "—";
  return v >= 100 ? Math.round(v).toString() : v.toFixed(1);
}

function pressChannels(press) {
  const ton = tonnageFor(press);
  // Press-canonical signals
  const channels = [
    { name: "Peak tonnage",        kind: "force",   value: fmtTon(ton?.current), unit: "ton",
      baseline: ton ? (fmtTon(ton.baseline) + " ton") : "—",
      trend: press.issue?.includes("tonnage") ? "stepped" : "flat",
      status: press.issue?.includes("tonnage") ? "warn" : "ok" },
    { name: "BDC variability",     kind: "stroke",  value: press.status === "warn" && press.issue?.includes("guide") ? "±0.08" : "±0.03", unit: "mm",   baseline: "±0.02 mm",  trend: press.issue?.includes("guide") ? "rising" : "flat", status: press.issue?.includes("guide") ? "warn" : "ok" },
    { name: "Slide parallelism",   kind: "stroke",  value: press.issue?.includes("guide") ? "42" : "18", unit: "µm",   baseline: "18 µm · limit 80", trend: press.issue?.includes("guide") ? "rising" : "flat", status: press.issue?.includes("guide") ? "warn" : "ok" },
    { name: "Cycle rate",          kind: "cycle",   value: press.type === "mechanical" ? "640" : press.type === "servo" ? "84" : "18", unit: "/min", baseline: press.type === "mechanical" ? "640 /min" : press.type === "servo" ? "84 /min" : "18 /min", trend: "flat", status: "ok" },
    { name: "Drive current · DE",  kind: "current", value: press.issue?.includes("guide") ? "+4%" : "nominal", unit: "",      baseline: "nominal",   trend: press.issue?.includes("guide") ? "drift" : "flat", status: press.issue?.includes("guide") ? "warn" : "ok" },
    { name: "Bearing temp · DE",   kind: "temp",    value: press.issue?.includes("bearing") ? "72" : "64", unit: "°C",  baseline: "60 °C",      trend: press.issue?.includes("bearing") ? "drift" : "flat", status: press.issue?.includes("bearing") ? "warn" : "ok" },
    { name: "Velocity RMS · DE",   kind: "vib",     value: press.issue?.includes("bearing") ? "3.6" : "2.4", unit: "mm/s", baseline: "2.4 mm/s · alarm 4.5", trend: press.issue?.includes("bearing") ? "rising" : "flat", status: press.issue?.includes("bearing") ? "warn" : "ok" },
    { name: "Velocity RMS · NDE",  kind: "vib",     value: "1.9", unit: "mm/s", baseline: "2.0 mm/s", trend: "flat", status: "ok" },
    { name: "Lube pressure",       kind: "pressure",value: "5.8", unit: "bar",  baseline: "5.6 bar",  trend: "flat", status: "ok" },
    { name: "Clutch engage time",  kind: "stroke",  value: "82",  unit: "ms",   baseline: "82 ms",    trend: "flat", status: "ok" },
    { name: "Counterbalance pressure", kind: "pressure", value: "4.1", unit: "bar", baseline: "4.1 bar", trend: "flat", status: "ok" },
    { name: "Motor torque · RMS",  kind: "current", value: "62",  unit: "%",    baseline: "60 %",     trend: "flat", status: "ok" },
  ];
  if (press.status === "unknown") {
    return channels.map(c => c.kind === "vib" ? { ...c, value: "—", trend: "offline", status: "unknown" } : c);
  }
  return channels;
}

// ───────────────────────────────────────────────────────────────────────────
// Service history per press
// ───────────────────────────────────────────────────────────────────────────
const HISTORY = {
  "VNG-BSTA-03": [
    { date: "28 Apr 2026", who: "lb", what: "Quarterly · re-greased drive bearings · flagged slide parallelism drift", kind: "service", hours: 2.4 },
    { date: "12 Mar 2026", who: "ah", what: "Replaced clutch position sensor",              kind: "repair",  hours: 0.8 },
    { date: "02 Feb 2026", who: "lb", what: "Quarterly inspection",                         kind: "service", hours: 2.0 },
    { date: "19 Nov 2025", who: "ah", what: "Lube system filter change",                    kind: "service", hours: 0.6 },
    { date: "04 Sep 2025", who: "lb", what: "Replaced NDE bearing (SKF 22220) — preventive", kind: "repair",  hours: 4.2 },
    { date: "12 May 2025", who: "lb", what: "Annual safety inspection · ok",                kind: "service", hours: 3.1 },
    { date: "28 Feb 2025", who: "lb", what: "Quarterly inspection",                         kind: "service", hours: 2.1 },
  ],
  "VNG-MSP-01": [
    { date: "08 Apr 2026", who: "ah", what: "Quarterly · re-greased DE bearing",            kind: "service", hours: 2.2 },
    { date: "14 Jan 2026", who: "ah", what: "Quarterly inspection",                         kind: "service", hours: 2.0 },
    { date: "22 Sep 2024", who: "ah", what: "Re-greased DE bearing · no replacement",       kind: "service", hours: 1.0 },
  ],
  "ESK-NC1-02": [
    { date: "02 Feb 2026", who: "po", what: "Quarterly inspection",                         kind: "service", hours: 2.4 },
    { date: "18 Oct 2025", who: "po", what: "Servo drive firmware update",                  kind: "service", hours: 0.5 },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// Alarm templates — published by Olsons. Institutional knowledge as a product.
// Each template encodes a pattern Olsons has seen across the fleet over decades.
// pressClass identifies the model family this template targets.
// ───────────────────────────────────────────────────────────────────────────
const ALARM_TEMPLATES = [
  {
    id: "TPL-BSTA-GUIDE",
    name: "BSTA-50 · clutch-side guide drift",
    pressClass: "Bruderer BSTA-50",
    pressType: "mechanical",
    severity: "warn",
    mode: "expression",
    plain: "Warn when slide parallelism on the rear-clutch corner drifts more than 25 µm over 8 weeks. Catches the guide-bushing wear pattern we see across the BSTA-50 frame family — typically 3–4 weeks before action is needed.",
    rationale: "Olsons has serviced 184 BSTA-frame guide failures. In 92% of them, parallelism drift on the rear-clutch corner was the earliest signal — visible 3–6 weeks before noise on the floor.",
    channels: ["slide.parallelism.rear_clutch"],
    publishedBy: "mk",
    publishedAt: "Mar 2025",
    version: "1.2",
    adoptedBy: 14,
    catches: 22,
    expression:
`# BSTA-50 clutch-side guide drift
# Detects slide-parallelism drift before it noises up

let recent  = ewma(channel("slide.parallelism.rear_clutch"), span="14d")
let prior   = ewma(channel("slide.parallelism.rear_clutch"), span="60d", offset="60d")
let drift   = recent - prior

fire severity="warning"
  when drift < -25
   for at_least "5d"`,
  },
  {
    id: "TPL-BSTA-BEARING",
    name: "BSTA-50 · drive bearing wear",
    pressClass: "Bruderer BSTA-50",
    pressType: "mechanical",
    severity: "warn",
    mode: "expression",
    plain: "Warn when drive-end velocity RMS trends up by more than 30% from baseline AND kurtosis steps up — a pattern that precedes BSTA bearing failure by 2–4 weeks.",
    rationale: "Combines amplitude (the obvious signal) with kurtosis (the early-warning one). We've seen kurtosis step changes catch bearings ~2 weeks earlier than amplitude alone.",
    channels: ["vibration.de.velocity_rms", "vibration.de.kurtosis"],
    publishedBy: "mk", publishedAt: "Jan 2024", version: "1.4",
    adoptedBy: 14, catches: 18,
  },
  {
    id: "TPL-MSP-BEARING",
    name: "MSP-630 · drive bearing wear",
    pressClass: "Schuler MSP-630",
    pressType: "mechanical",
    severity: "warn",
    mode: "template",
    plain: "Warn when drive-end velocity RMS sustains above 3.5 mm/s for 15 minutes on any MSP-630 frame. Threshold tuned to MSP frame mass and natural-frequency profile.",
    rationale: "MSP-630s are heavier and run lower spm than BSTA — the 3.5 mm/s threshold is specific to this frame. Don't use the BSTA threshold here.",
    channels: ["vibration.de.velocity_rms"],
    publishedBy: "mk", publishedAt: "Sep 2023", version: "2.1",
    adoptedBy: 32, catches: 41,
  },
  {
    id: "TPL-MSP-SLOWCYCLE",
    name: "MSP-630 · slow cycle anomaly",
    pressClass: "Schuler MSP-630",
    pressType: "mechanical",
    severity: "info",
    mode: "expression",
    plain: "Inform when actual cycle rate falls more than 8% below recipe target for over 5 minutes. Usually a die-lubrication or material-feed issue — not a press problem, but worth catching.",
    rationale: "Operators chase this manually. Catching it early saves 30 minutes of bad parts.",
    channels: ["press.spm", "press.recipe.target_spm"],
    publishedBy: "lb", publishedAt: "Aug 2024", version: "1.1",
    adoptedBy: 28, catches: 142,
  },
  {
    id: "TPL-AIDA-TONNAGE",
    name: "Aida NC1 · peak tonnage drift by recipe",
    pressClass: "Aida NC1-300",
    pressType: "servo",
    severity: "warn",
    mode: "expression",
    plain: "Warn when peak tonnage on any recipe drifts more than 5% above its trained baseline over 5,000+ cycles. Almost always die wear, occasionally material variance.",
    rationale: "Per-recipe baseline is the trick — a generic threshold would fire constantly across the recipe library.",
    channels: ["press.peak_tonnage", "press.active_recipe"],
    publishedBy: "po", publishedAt: "Nov 2024", version: "1.0",
    adoptedBy: 9, catches: 7,
  },
  {
    id: "TPL-APT-OILTEMP",
    name: "AP&T hydraulic · oil temperature climb",
    pressClass: "AP&T LP series",
    pressType: "hydraulic",
    severity: "warn",
    mode: "template",
    plain: "Warn when hydraulic oil temperature climbs more than 8°C above cycle-rate-normalized baseline. Catches cooler fouling and pump-inefficiency drift.",
    rationale: "Cycle-rate normalization avoids false positives during high-speed runs.",
    channels: ["hydraulic.oil_temp", "press.spm"],
    publishedBy: "ah", publishedAt: "Apr 2024", version: "1.3",
    adoptedBy: 11, catches: 9,
  },
  {
    id: "TPL-FEEDER-SLIP",
    name: "Coil feeder · feed-length slip",
    pressClass: "Bruderer FB-50 / FB-100",
    pressType: "feeder",
    severity: "warn",
    mode: "expression",
    plain: "Warn when feed-length error exceeds ±0.05 mm for more than 50 strokes. Catches roller slip and pinch-roller wear before scrap rate climbs.",
    rationale: "We see feeder slip on ~6% of installations annually. Catching it within 50 strokes saves a typical 200-piece bad batch.",
    channels: ["feeder.feed_length_error"],
    publishedBy: "po", publishedAt: "Jun 2024", version: "1.0",
    adoptedBy: 18, catches: 26,
  },
  {
    id: "TPL-ISO-10816",
    name: "Generic · ISO 10816 zone D",
    pressClass: "All mechanical presses",
    pressType: "any",
    severity: "safety",
    mode: "template",
    plain: "Critical alarm when velocity RMS enters ISO 10816 zone D (unacceptable). Required for safety; never suppress.",
    rationale: "Regulatory backstop. This fires regardless of any predictive model.",
    channels: ["vibration.de.velocity_rms"],
    publishedBy: "system", publishedAt: "—", version: "—",
    adoptedBy: 22, catches: 0,
    nonOptional: true,
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Alarm rules — the customer's catalog: adopted Olsons templates + their own.
// ───────────────────────────────────────────────────────────────────────────
const ALARM_RULES = [
  // ─── Adopted Olsons templates ─────────────────────────────────────────
  { id: "RL-001", template: "TPL-BSTA-GUIDE",
    name: "BSTA-50 · clutch-side guide drift",
    scope: "All BSTA-50 presses (Hall A)", scopeCount: 4,
    severity: "warn", mode: "expression", state: "active",
    triggered30d: 1, lastTrig: "Yesterday 14:22",
    triggeredAlerts: ["ALR-2604"],
    author: { kind: "olsons", id: "mk" },
    suppression: ["Maintenance mode aware"],
    notify: ["Erik Persson", "Olsons service desk"],
    adopted: "08 Apr 2026" },

  { id: "RL-002", template: "TPL-BSTA-BEARING",
    name: "BSTA-50 · drive bearing wear",
    scope: "All BSTA-50 presses", scopeCount: 4,
    severity: "warn", mode: "expression", state: "active",
    triggered30d: 0, lastTrig: "—",
    author: { kind: "olsons", id: "mk" },
    suppression: ["Maintenance mode aware"],
    notify: ["Maintenance channel"],
    adopted: "08 Apr 2026" },

  { id: "RL-003", template: "TPL-MSP-BEARING",
    name: "MSP-630 · drive bearing wear",
    scope: "All MSP-630 presses (Hall B)", scopeCount: 4,
    severity: "warn", mode: "template", state: "active",
    triggered30d: 1, lastTrig: "3 days ago",
    triggeredAlerts: ["ALR-2601"],
    author: { kind: "olsons", id: "mk" },
    suppression: ["Maintenance mode aware", "Quiet hours 22:00–06:00"],
    notify: ["Maintenance channel"],
    adopted: "08 Apr 2026" },

  { id: "RL-004", template: "TPL-AIDA-TONNAGE",
    name: "Aida NC1 · peak tonnage drift by recipe",
    scope: "All Aida NC1-300 (both sites)", scopeCount: 6,
    severity: "warn", mode: "expression", state: "active",
    triggered30d: 1, lastTrig: "2 days ago",
    triggeredAlerts: ["ALR-2598"],
    author: { kind: "olsons", id: "po" },
    suppression: ["Recipe-aware · ignore R-200 (development)"],
    notify: ["Maintenance channel", "Anna Lundgren (production)"],
    adopted: "21 Apr 2026" },

  { id: "RL-005", template: "TPL-MSP-SLOWCYCLE",
    name: "MSP-630 · slow cycle anomaly",
    scope: "All MSP-630 presses", scopeCount: 4,
    severity: "info", mode: "expression", state: "active",
    triggered30d: 4, lastTrig: "Today 09:14",
    author: { kind: "olsons", id: "lb" },
    suppression: ["Suppress during planned Olsons visits"],
    notify: ["Operator panel only"],
    adopted: "12 Mar 2026" },

  { id: "RL-006", template: "TPL-FEEDER-SLIP",
    name: "Coil feeder · feed-length slip",
    scope: "All Bruderer feeders", scopeCount: 3,
    severity: "warn", mode: "expression", state: "active",
    triggered30d: 0, lastTrig: "—",
    author: { kind: "olsons", id: "po" },
    suppression: [],
    notify: ["Maintenance channel"],
    adopted: "06 May 2026" },

  { id: "RL-007", template: "TPL-ISO-10816",
    name: "Generic · ISO 10816 zone D · safety",
    scope: "All presses",  scopeCount: 22,
    severity: "safety", mode: "template", state: "active",
    triggered30d: 0, lastTrig: "—",
    author: { kind: "olsons", id: "system" },
    suppression: ["Never suppress · safety"],
    notify: ["Olsons service desk", "Erik Persson", "Floor manager (SMS)"],
    adopted: "Auto · default" },

  // ─── Customer-authored rules ──────────────────────────────────────────
  { id: "RL-101",
    name: "Hall A · slow cycle on R-114 only",
    scope: "BSTA-50 #3 · recipe R-114", scopeCount: 1,
    severity: "info", mode: "visual", state: "active",
    triggered30d: 12, lastTrig: "Today 11:08",
    author: { kind: "customer", id: "ep" },
    suppression: ["Quiet hours 22:00–06:00"],
    notify: ["Erik Persson (Slack)"],
    sharedWithOlsons: false,
    note: "Tracking a quirk on R-114 — pre-feed slows down occasionally.",
    adopted: "14 May 2026 · authored locally" },

  { id: "RL-102",
    name: "Quiet hours suppression — night shift",
    scope: "Site-wide · Vingåker", scopeCount: null,
    severity: "info", mode: "template", state: "active",
    triggered30d: 0, lastTrig: "—",
    author: { kind: "customer", id: "ep" },
    suppression: [],
    notify: ["—"],
    note: "Suppresses info-level alarms 22:00–06:00. Critical and safety still ring.",
    adopted: "02 Feb 2026" },

  // A paused draft
  { id: "RL-103",
    name: "Eskilstuna · die-lube temperature (draft)",
    scope: "Aida NC1-300 #2 only", scopeCount: 1,
    severity: "info", mode: "visual", state: "draft",
    triggered30d: 0, lastTrig: "—",
    author: { kind: "customer", id: "ep" },
    note: "Testing — backtest looks noisy on R-302. Need to tighten threshold.",
    adopted: "16 May 2026 · not yet active" },
];

// ───────────────────────────────────────────────────────────────────────────
// Backtest data — 90 days of an alarm rule's would-have-fired events,
// plotted on the actual signal history that drives them. Hero of the screen.
// Keyed by rule.id.
// ───────────────────────────────────────────────────────────────────────────
const BACKTESTS = {
  "RL-001": {
    seriesKey: "VNG-BSTA-03_parallelism",
    metric: "Slide parallelism (rear-clutch)",
    unit: "µm",
    range: "90 days",
    wouldFire: 1,
    suppressed: 0,
    noisePerDay: 0.01,
    estimatedFalsePositives: 0,
    firings: [
      { day: 71, machine: "VNG-BSTA-03", value: -38, outcome: "Would have fired · matches alert ALR-2604", note: "5 days before the alert was raised by the model." },
    ],
  },
  "RL-005": {
    seriesKey: null, // Synthetic — info-level slow-cycle rule fires more often
    metric: "Press spm vs recipe target",
    unit: "spm",
    range: "90 days",
    wouldFire: 14,
    suppressed: 6,
    noisePerDay: 0.16,
    estimatedFalsePositives: 2,
    firings: [
      { day: 8,  machine: "VNG-MSP-01", value: "-12%", outcome: "Would have fired · die lube re-greased after" },
      { day: 22, machine: "VNG-MSP-02", value: "-8%",  outcome: "Would have fired · noise (cleared in 4 min)", suppressed: true },
      { day: 35, machine: "VNG-MSP-01", value: "-11%", outcome: "Would have fired · operator changed material lot" },
      { day: 49, machine: "VNG-MSP-04", value: "-9%",  outcome: "Would have fired · paused production" },
      { day: 64, machine: "VNG-MSP-03", value: "-15%", outcome: "Would have fired · followed by retooling" },
      { day: 78, machine: "VNG-MSP-01", value: "-10%", outcome: "Would have fired · die-lube top-up resolved" },
      { day: 85, machine: "VNG-MSP-03", value: "-13%", outcome: "Would have fired · today's event (09:14)" },
    ],
  },
  "RL-101": {
    seriesKey: null,
    metric: "BSTA-50 #3 · cycle rate on R-114",
    unit: "spm",
    range: "30 days",
    wouldFire: 12,
    suppressed: 2,
    noisePerDay: 0.4,
    estimatedFalsePositives: 5,
    firings: [
      { day: 4,  machine: "VNG-BSTA-03", value: "-6%",  outcome: "Would have fired · re-fed coil" },
      { day: 9,  machine: "VNG-BSTA-03", value: "-9%",  outcome: "Would have fired · sensor blip (noise)", suppressed: true },
      { day: 15, machine: "VNG-BSTA-03", value: "-7%",  outcome: "Would have fired · operator adjustment" },
      { day: 22, machine: "VNG-BSTA-03", value: "-12%", outcome: "Would have fired · genuine slow-down" },
      { day: 28, machine: "VNG-BSTA-03", value: "-8%",  outcome: "Would have fired · this morning, 11:08" },
    ],
  },
};

// ───────────────────────────────────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────────────────────────────────
window.DATA = { CUSTOMER, OLSONS, SITES, PRESSES, ALERTS, FORECAST, PLAN, KPI, HISTORY,
                ALARM_TEMPLATES, ALARM_RULES, BACKTESTS, TECH_SUGGESTIONS };

window.getCustomer = () => CUSTOMER;
window.getSite = (id) => SITES.find((s) => s.id === id);
window.getPress = (id) => PRESSES.find((p) => p.id === id);
window.getAlert = (id) => ALERTS.find((a) => a.id === id);
window.getTech = (id) => OLSONS.techs.find((t) => t.id === id) || (id === "mk" ? OLSONS.manager : null);
window.getPlanItem = (id) => PLAN.find((p) => p.id === id);
window.pressesAt = (siteId) => PRESSES.filter((p) => p.site === siteId);
window.alertsAt = (siteId) => ALERTS.filter((a) => a.site === siteId);
window.alertsFor = (pressId) => ALERTS.filter((a) => a.machine === pressId);
window.pressChannels = pressChannels;
window.planForTech = (techId) => PLAN.filter((p) => p.tech === techId && p.kind !== "completed").sort((a,b) => a.date.localeCompare(b.date));
window.planForSite = (siteId) => PLAN.filter((p) => p.site === siteId).sort((a,b) => a.date.localeCompare(b.date));
window.getTemplate = (id) => ALARM_TEMPLATES.find((t) => t.id === id);
window.getRule = (id) => ALARM_RULES.find((r) => r.id === id);
window.getBacktest = (ruleId) => BACKTESTS[ruleId];
window.getSuggestion = (id) => TECH_SUGGESTIONS.find((s) => s.id === id);
window.suggestionsForManager = () => TECH_SUGGESTIONS.filter((s) => s.status === "pending" || s.status === "in_review");
window.suggestionsForTech = (techId) => TECH_SUGGESTIONS.filter((s) => s.author.id === techId);

window.provenanceLabel = (prov) => {
  if (!prov || prov.tier === "anomaly") return { tier: "anomaly", short: "Anomaly detection", long: "Surfaced by anomaly detection · not yet a rule" };
  if (prov.tier === "customer-rule") {
    const rule = window.getRule(prov.ruleId);
    return { tier: "customer-rule", short: rule?.name || "Your rule", long: `Caught by your rule · ${rule?.name || prov.ruleId}`, ruleId: prov.ruleId };
  }
  const tpl = prov.templateId ? window.getTemplate(prov.templateId) : null;
  const rule = prov.ruleId ? window.getRule(prov.ruleId) : null;
  const author = tpl?.publishedBy ? window.getTech(tpl.publishedBy) : null;
  return {
    tier: "olsons-template",
    short: tpl?.name || "Olsons template",
    long: `Caught by Olsons template · ${tpl?.name || rule?.name || "published rule"}`,
    templateId: prov.templateId,
    ruleId: prov.ruleId,
    authorName: author?.name || "Olsons",
  };
};

window.PRESSES_ALL = PRESSES;
