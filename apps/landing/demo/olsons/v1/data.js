// data.js — Mock fleet data for the Olsons demo.
// Sites across Sweden; mixed machine types.
// Health numbers are realistic-feeling (most machines fine, a handful interesting).

const SITES = [
  { id: "wlf", city: "Göteborg", name: "Göteborg Press Hall 3", country: "SE", coord: [11.97, 57.71],
    contact: "K. Reinhardt", contactRole: "Site lead", phone: "+46 31 710 4402",
    address: "Exportgatan 14, 433 32 Göteborg",
    sparesLocation: "Annex B, Bay 4 / Mezzanine rack 12",
    machineCount: 84, areas: ["Press line A", "Press line B", "Stamping", "Coil prep", "Hydraulics"],
    health: 91, attention: 2, forecast: 1 },
  { id: "trn", city: "Malmö", name: "Malmö Forge", country: "SE", coord: [13.00, 55.60],
    contact: "L. Rosso", contactRole: "Maint. supervisor", phone: "+46 40 612 8810",
    address: "Industrigatan 88, 214 42 Malmö",
    sparesLocation: "South cage, racks 1–6",
    machineCount: 42, areas: ["Forge", "Trimming", "Heat treatment", "Tooling"],
    health: 72, attention: 4, forecast: 2 },
  { id: "lyn", city: "Sundsvall", name: "Sundsvall Pumphouse", country: "SE", coord: [17.32, 62.39],
    contact: "M. Bellamy", contactRole: "Reliability eng.", phone: "+46 60 712 4500",
    address: "Pumphusvägen 3, 851 92 Sundsvall",
    sparesLocation: "Mezzanine — door 7",
    machineCount: 28, areas: ["Pump room A", "Pump room B", "Cooling tower"],
    health: 64, attention: 1, forecast: 1, critical: 1 },
  { id: "got", city: "Stockholm", name: "Stockholm CNC Cell", country: "SE", coord: [18.07, 59.33],
    contact: "S. Lindqvist", contactRole: "Shift supervisor", phone: "+46 8 590 12000",
    address: "Kista Science Tower, 164 40 Kista",
    sparesLocation: "Tool crib, NW corner",
    machineCount: 36, areas: ["Cell 1", "Cell 2", "Cell 3", "Finishing"],
    health: 96, attention: 0, forecast: 1 },
  { id: "rot", city: "Luleå", name: "Luleå Compressors", country: "SE", coord: [22.15, 65.58],
    contact: "J. de Vries", contactRole: "Site lead", phone: "+46 920 760 500",
    address: "Industriområdet 12, 971 47 Luleå",
    sparesLocation: "Outdoor cage, gate 2",
    machineCount: 18, areas: ["Compressor row A", "Compressor row B", "Dryer skid"],
    health: 88, attention: 1, forecast: 0 },
  { id: "brn", city: "Jönköping", name: "Jönköping Stamping", country: "SE", coord: [14.16, 57.78],
    contact: "P. Novák", contactRole: "Maintenance lead", phone: "+46 36 123 4500",
    address: "Verkstadsgatan 5, 553 18 Jönköping",
    sparesLocation: "Workshop, rack C",
    machineCount: 22, areas: ["Stamping", "Coil prep", "QA"],
    health: 94, attention: 0, forecast: 1 },
];

// A representative slice of machines. Most healthy, a handful interesting.
// type: press | motor | pump | fan | compressor | cnc | conveyor
// status: ok | warn | crit | unknown
// trendKey shapes the sparkline so the visual matches the story.
const MACHINES = [
  // Göteborg
  { id: "WLF-P04", site: "wlf", area: "Press line A", name: "Stamping Press 04", type: "press",
    model: "Schuler MSP-630", criticality: "A", health: 67, status: "warn",
    issue: "Drive-side bearing vibration trending up",
    forecast: "3–5 weeks to action needed",
    runtime: "412 h since service",
    nextAction: "Inspect drive-side bearing housing",
    trendKey: "rising" },
  { id: "WLF-P01", site: "wlf", area: "Press line A", name: "Stamping Press 01", type: "press",
    model: "Schuler MSP-630", criticality: "A", health: 96, status: "ok",
    issue: null, runtime: "118 h since service", trendKey: "flat" },
  { id: "WLF-P02", site: "wlf", area: "Press line A", name: "Stamping Press 02", type: "press",
    model: "Schuler MSP-630", criticality: "A", health: 91, status: "ok",
    issue: null, runtime: "201 h since service", trendKey: "flat" },
  { id: "WLF-P03", site: "wlf", area: "Press line B", name: "Stamping Press 03", type: "press",
    model: "Schuler MSP-630", criticality: "A", health: 88, status: "ok",
    issue: null, runtime: "318 h since service", trendKey: "wobble" },
  { id: "WLF-M14", site: "wlf", area: "Coil prep", name: "Coil feed motor 14", type: "motor",
    model: "ABB IE5 22kW", criticality: "B", health: 82, status: "warn",
    issue: "Stator current imbalance — slight, 2 weeks",
    forecast: "Watch — no action this week",
    runtime: "1,210 h", trendKey: "drift" },
  { id: "WLF-H07", site: "wlf", area: "Hydraulics", name: "Hydraulic pump H-07", type: "pump",
    model: "Bosch Rexroth A10VSO", criticality: "B", health: 94, status: "ok",
    runtime: "742 h", trendKey: "flat" },
  { id: "WLF-F02", site: "wlf", area: "Hydraulics", name: "Cooling fan F-02", type: "fan",
    model: "ebm-papst W3G", criticality: "C", health: null, status: "unknown",
    issue: "Sensor offline since 06:42",
    forecast: null, runtime: "—", trendKey: "offline" },

  // Malmö
  { id: "TRN-FRG01", site: "trn", area: "Forge", name: "Forging hammer 01", type: "press",
    model: "Lasco GHM-3", criticality: "A", health: 58, status: "warn",
    issue: "Hammer foundation vibration spectrum shifted",
    forecast: "Review by Friday",
    runtime: "2,140 h", trendKey: "stepped" },
  { id: "TRN-FRG02", site: "trn", area: "Forge", name: "Forging hammer 02", type: "press",
    model: "Lasco GHM-3", criticality: "A", health: 83, status: "ok",
    runtime: "1,820 h", trendKey: "flat" },
  { id: "TRN-HT3", site: "trn", area: "Heat treatment", name: "Quench tank circulator", type: "pump",
    model: "Grundfos NK 80", criticality: "A", health: 71, status: "warn",
    issue: "Cavitation signature emerging on pump 3",
    forecast: "Inspect within 10 days",
    runtime: "5,610 h", trendKey: "rising" },
  { id: "TRN-TRM2", site: "trn", area: "Trimming", name: "Trim press 02", type: "press",
    model: "Schuler MSP-400", criticality: "B", health: 88, status: "ok",
    runtime: "990 h", trendKey: "flat" },

  // Sundsvall — site with a current critical
  { id: "LYN-PMP04", site: "lyn", area: "Pump room A", name: "Booster pump 04", type: "pump",
    model: "KSB Etanorm 200", criticality: "A", health: 38, status: "crit",
    issue: "Bearing acceleration above critical threshold",
    forecast: "Stop on next shift — failure imminent",
    runtime: "11,420 h", trendKey: "spike", critical: true },
  { id: "LYN-PMP01", site: "lyn", area: "Pump room A", name: "Booster pump 01", type: "pump",
    model: "KSB Etanorm 200", criticality: "A", health: 91, status: "ok",
    runtime: "8,840 h", trendKey: "flat" },
  { id: "LYN-PMP02", site: "lyn", area: "Pump room A", name: "Booster pump 02", type: "pump",
    model: "KSB Etanorm 200", criticality: "A", health: 79, status: "warn",
    issue: "Discharge pressure variance trending up",
    forecast: "Watch — 2 weeks",
    runtime: "9,210 h", trendKey: "drift" },
  { id: "LYN-CT1", site: "lyn", area: "Cooling tower", name: "Cooling tower fan 1", type: "fan",
    model: "ebm-papst HyBlade", criticality: "B", health: 86, status: "ok",
    runtime: "4,120 h", trendKey: "flat" },

  // Stockholm
  { id: "GOT-CNC1", site: "got", area: "Cell 1", name: "CNC mill C1-A", type: "cnc",
    model: "DMG Mori NHX 5500", criticality: "A", health: 95, status: "ok",
    runtime: "612 h since service", trendKey: "flat" },
  { id: "GOT-CNC2", site: "got", area: "Cell 1", name: "CNC mill C1-B", type: "cnc",
    model: "DMG Mori NHX 5500", criticality: "A", health: 97, status: "ok",
    runtime: "420 h since service", trendKey: "flat" },
  { id: "GOT-CNC3", site: "got", area: "Cell 2", name: "CNC lathe C2-A", type: "cnc",
    model: "Mazak Quick Turn 350", criticality: "A", health: 92, status: "ok",
    runtime: "1,210 h since service", trendKey: "flat" },

  // Luleå
  { id: "ROT-CPR1", site: "rot", area: "Compressor row A", name: "Atlas Copco GA-90 #1", type: "compressor",
    model: "Atlas Copco GA-90", criticality: "A", health: 89, status: "ok",
    runtime: "3,210 h", trendKey: "flat" },
  { id: "ROT-CPR2", site: "rot", area: "Compressor row A", name: "Atlas Copco GA-90 #2", type: "compressor",
    model: "Atlas Copco GA-90", criticality: "A", health: 76, status: "warn",
    issue: "Discharge temperature climbing during long cycles",
    forecast: "Plan service in next maintenance window",
    runtime: "4,810 h", trendKey: "stepped" },
];

// --- Alerts / work items ---
const ALERTS = [
  { id: "ALR-2406", machine: "LYN-PMP04", site: "lyn", severity: "crit",
    title: "Bearing acceleration above critical threshold",
    pl: "Booster pump 04 in Pump room A is showing bearing acceleration above its critical threshold. The trend stepped up overnight; this is consistent with late-stage bearing wear.",
    why: "Velocity RMS on the drive-end bearing has crossed 7.1 mm/s (ISO 10816 zone D). Acceleration kurtosis has doubled in the last 36 hours — a pattern we see ~2–5 days before bearing failure.",
    actions: [
      { text: "Stop pump on next shift handover", primary: true },
      { text: "Switch to redundant pump 02 (already warm)" },
      { text: "Order DE bearing (SKF 6313-2RS) — site stock 1 unit" },
    ],
    parts: ["SKF 6313-2RS bearing"],
    tools: ["Bearing puller kit", "Mobil SHC 220 grease"],
    similar: [
      { ref: "ALR-1188", machine: "TRN-HT3", date: "Mar 2026", outcome: "Resolved — bearing replacement, 4h downtime" },
      { ref: "ALR-0921", machine: "LYN-PMP02", date: "Nov 2025", outcome: "Resolved — replaced before failure" },
    ],
    raised: "2 h ago", confidence: 92, status: "open" },

  { id: "ALR-2401", machine: "WLF-P04", site: "wlf", severity: "warn",
    title: "Drive-side bearing vibration trending up",
    pl: "Stamping press 04 is showing a slow rise in drive-side bearing vibration. Nothing urgent — current readings are within normal — but the slope suggests action will be needed in 3–5 weeks.",
    why: "Velocity RMS on the drive bearing has climbed from 2.8 → 3.6 mm/s over 14 days. A regression on the trend crosses our alert threshold of 4.5 mm/s in roughly 24–34 days.",
    actions: [
      { text: "Plan inspection of drive-side bearing housing in next 2 weeks", primary: true },
      { text: "Verify spare bearing on site" },
      { text: "Check lubrication log — last greased 38 days ago" },
    ],
    parts: ["SKF 22220 EK spherical roller bearing"],
    tools: ["Grease gun", "Torque wrench set"],
    similar: [
      { ref: "ALR-2018", machine: "WLF-P02", date: "Sep 2025", outcome: "Resolved — re-greased, no replacement needed" },
    ],
    raised: "Yesterday, 14:22", confidence: 78, status: "open" },

  { id: "ALR-2398", machine: "TRN-FRG01", site: "trn", severity: "warn",
    title: "Foundation vibration spectrum shifted",
    pl: "Forging hammer 01 has a new peak appearing around 18 Hz in its foundation vibration. It hasn't changed amplitude, but the new peak wasn't there last month and is worth a look.",
    why: "New spectral peak detected at 18.2 Hz, magnitude 1.4 mm/s. Likely related to anvil or foundation bolt looseness — usually catches earlier than running issues.",
    actions: [
      { text: "Visual check of anvil retaining bolts" },
      { text: "Re-torque anvil bolts to spec if loose" },
    ],
    raised: "Yesterday", confidence: 64, status: "open" },

  { id: "ALR-2395", machine: "TRN-HT3", site: "trn", severity: "warn",
    title: "Cavitation signature emerging on pump 3",
    pl: "Quench tank circulator pump 3 is showing the early acoustic signature of cavitation. Inlet pressure looks fine — check the suction strainer first.",
    why: "Broadband noise 6–9 kHz risen 4 dB over 10 days. Discharge pressure stable.",
    raised: "2 days ago", confidence: 71, status: "open" },

  { id: "ALR-2391", machine: "ROT-CPR2", site: "rot", severity: "warn",
    title: "Discharge temperature climbing during long cycles",
    pl: "Compressor GA-90 #2 runs hotter than #1 during cycles longer than 20 minutes. Differential is 6–8°C and growing.",
    raised: "3 days ago", confidence: 69, status: "open" },

  { id: "ALR-2389", machine: "WLF-M14", site: "wlf", severity: "info",
    title: "Stator current imbalance — slight",
    pl: "Coil feed motor 14 has a slight (1.8%) current imbalance between phases. Below alarm but worth tracking.",
    raised: "4 days ago", confidence: 55, status: "open" },

  { id: "ALR-2386", machine: "WLF-F02", site: "wlf", severity: "unknown",
    title: "Sensor offline since 06:42",
    pl: "Cooling fan F-02 sensor stopped reporting at 06:42. The fan may be fine — but we can't tell. Check the gateway and the sensor's mounting.",
    raised: "Today, 06:42", confidence: null, status: "open" },
];

// Forecast — predictive items not yet "alerts"
const FORECAST = [
  { machine: "WLF-P04", site: "wlf", text: "Drive-side bearing — action likely in 3–5 weeks", weeks: 4, confidence: 0.78 },
  { machine: "TRN-HT3", site: "trn", text: "Pump 3 strainer service within 10 days", weeks: 1.5, confidence: 0.71 },
  { machine: "LYN-PMP02", site: "lyn", text: "Discharge pressure variance — possible mech. seal in ~6 weeks", weeks: 6, confidence: 0.58 },
  { machine: "ROT-CPR2", site: "rot", text: "Aftercooler clean overdue — efficiency loss within month", weeks: 4, confidence: 0.62 },
  { machine: "BRN-S01", site: "brn", text: "Tool wear curve suggests sharpen in ~12 days", weeks: 1.7, confidence: 0.65 },
];

// KPIs for the fleet
const FLEET_KPI = {
  health: 88,
  machines: 230,
  sites: 6,
  open: 7,
  critical: 1,
  forecastNext30: 5,
  avoidedDowntime30: "112 h",
  avoidedSavings30: "€84,200",
};

window.DATA = { SITES, MACHINES, ALERTS, FORECAST, FLEET_KPI };
window.getSite = (id) => SITES.find((s) => s.id === id);
window.getMachine = (id) => MACHINES.find((m) => m.id === id);
window.getAlert = (id) => ALERTS.find((a) => a.id === id);
window.machinesAt = (siteId) => MACHINES.filter((m) => m.site === siteId);
window.alertsAt = (siteId) => ALERTS.filter((a) => a.site === siteId);
window.alertsFor = (machineId) => ALERTS.filter((a) => a.machine === machineId);
