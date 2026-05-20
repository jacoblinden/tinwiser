// chart-data.js — Synthetic time series for investigation (overlay + grid).

const CHART_EVENTS = [
  { day: 14, type: "service", label: "Quarterly inspection", detail: "Re-greased DE bearing · M. Kowalski" },
  { day: 28, type: "service", label: "Service", detail: "Quarterly inspection · re-greased drive-end bearing" },
  { day: 52, type: "recipe", label: "Recipe change", detail: "Die set B → higher stroke rate" },
  { day: 61, type: "alarm", label: "Info alert", detail: "Vibration slope detected — ALR-2401 opened" },
  { day: 68, type: "offline", label: "Sensor gap", detail: "Gateway reconnect · 18 min data loss" },
  { day: 74, type: "maintenance", label: "Lube check", detail: "Operator note — grease visible, no refill" },
];

/** Full press sensor catalog — grid + overlay metadata */
const SIGNAL_CATALOG = [
  { id: "vib-de", label: "Vibration · drive end", short: "Vib DE", unit: "mm/s", category: "vibration", subsystem: "Drivetrain", axis: "left", color: "var(--chart-1)", alarm: 4.5, order: 1,
    gen: { base: 2.55, slope: 0.0135, seed: 42, baselinePct: 0.1 } },
  { id: "vib-nde", label: "Vibration · non-drive end", short: "Vib NDE", unit: "mm/s", category: "vibration", subsystem: "Drivetrain", axis: "left", color: "var(--chart-2)", alarm: 4.5, order: 2,
    gen: { base: 1.95, slope: 0.002, seed: 17 } },
  { id: "vib-frame", label: "Vibration · frame", short: "Frame", unit: "mm/s", category: "vibration", subsystem: "Drivetrain", axis: "left", color: "var(--chart-5)", alarm: 6, order: 3,
    gen: { base: 0.82, slope: 0.001, seed: 88 } },
  { id: "vib-slide", label: "Vibration · slide", short: "Slide", unit: "mm/s", category: "vibration", subsystem: "Drivetrain", axis: "left", color: "var(--chart-2)", alarm: 5, order: 4,
    gen: { base: 1.12, slope: 0.003, seed: 91 } },

  { id: "temp-de", label: "Bearing temp · drive end", short: "Bearing DE", unit: "°C", category: "temperature", subsystem: "Drivetrain", axis: "right", color: "var(--chart-3)", alarm: 85, order: 10,
    gen: { base: 65.5, slope: 0.018, seed: 91 } },
  { id: "temp-nde", label: "Bearing temp · non-drive end", short: "Bearing NDE", unit: "°C", category: "temperature", subsystem: "Drivetrain", axis: "right", color: "var(--chart-3)", alarm: 82, order: 11,
    gen: { base: 63.2, slope: 0.004, seed: 22 } },
  { id: "temp-motor", label: "Motor winding temp", short: "Motor", unit: "°C", category: "temperature", subsystem: "Electrical", axis: "right", color: "var(--chart-3)", alarm: 120, order: 12,
    gen: { base: 71, slope: 0.006, seed: 44 } },
  { id: "temp-oil", label: "Hydraulic oil temp", short: "Oil temp", unit: "°C", category: "temperature", subsystem: "Hydraulics", axis: "right", color: "var(--chart-3)", alarm: 65, order: 13,
    gen: { base: 48, slope: 0.002, seed: 61 } },

  { id: "current", label: "Motor current", short: "Current", unit: "A", category: "electrical", subsystem: "Electrical", axis: "right", color: "var(--chart-4)", alarm: 52, order: 20,
    gen: { base: 41.6, slope: 0.004, seed: 33 } },
  { id: "power-kw", label: "Active power", short: "Power", unit: "kW", category: "electrical", subsystem: "Electrical", axis: "right", color: "var(--chart-4)", alarm: null, order: 21,
    gen: { base: 18.2, slope: 0.01, seed: 71 } },
  { id: "pf", label: "Power factor", short: "PF", unit: "", category: "electrical", subsystem: "Electrical", axis: "right", color: "var(--chart-4)", alarm: null, order: 22,
    gen: { base: 0.91, slope: -0.0002, seed: 12 } },
  { id: "imbalance", label: "Current imbalance", short: "Imbal.", unit: "%", category: "electrical", subsystem: "Electrical", axis: "right", color: "var(--chart-4)", alarm: 3, order: 23,
    gen: { base: 1.2, slope: 0.002, seed: 19 } },

  { id: "oil-pressure", label: "Oil pressure", short: "Pressure", unit: "bar", category: "hydraulics", subsystem: "Hydraulics", axis: "right", color: "var(--chart-2)", alarm: 8, order: 30,
    gen: { base: 5.8, slope: 0.0005, seed: 55 } },
  { id: "oil-level", label: "Oil reservoir level", short: "Level", unit: "%", category: "hydraulics", subsystem: "Hydraulics", axis: "right", color: "var(--chart-2)", alarm: null, order: 31,
    gen: { base: 78, slope: -0.02, seed: 63 } },
  { id: "filter-dp", label: "Filter ΔP", short: "ΔP", unit: "bar", category: "hydraulics", subsystem: "Hydraulics", axis: "right", color: "var(--chart-5)", alarm: 2.5, order: 32,
    gen: { base: 0.42, slope: 0.003, seed: 77 } },
  { id: "pump-flow", label: "Pump flow", short: "Flow", unit: "L/min", category: "hydraulics", subsystem: "Hydraulics", axis: "right", color: "var(--chart-2)", alarm: null, order: 33,
    gen: { base: 24, slope: -0.01, seed: 81 } },

  { id: "cycles", label: "Cycle rate", short: "Cycles", unit: "/h", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 40,
    gen: { base: 418, slope: -0.35, seed: 55 } },
  { id: "stroke-count", label: "Stroke counter", short: "Strokes", unit: "k", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 41,
    gen: { base: 1240, slope: 0.8, seed: 31 } },
  { id: "cushion", label: "Die cushion pressure", short: "Cushion", unit: "bar", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 42,
    gen: { base: 42, slope: 0.01, seed: 48 } },
  { id: "feed-length", label: "Feed length", short: "Feed", unit: "mm", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 43,
    gen: { base: 312, slope: 0, seed: 52 } },
  { id: "tonnage", label: "Press tonnage", short: "Tonnage", unit: "t", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 44,
    gen: { base: 612, slope: 0.02, seed: 66 } },
  { id: "die-gap", label: "Shut height", short: "Shut H", unit: "mm", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: null, order: 45,
    gen: { base: 485.2, slope: 0, seed: 29 } },
  { id: "air-pressure", label: "Clutch air pressure", short: "Clutch", unit: "bar", category: "process", subsystem: "Process", axis: "right", color: "var(--chart-5)", alarm: 6.5, order: 46,
    gen: { base: 5.4, slope: 0, seed: 38 } },
];

// Overlay chart uses primary signals (subset with rich metadata)
const CHART_SIGNALS = SIGNAL_CATALOG.filter((s) =>
  ["vib-de", "vib-nde", "temp-de", "current", "cycles"].includes(s.id),
).map((s) => ({ ...s, label: s.id === "temp-de" ? "Bearing temperature" : s.label }));

function chartNoise(seed, i) {
  const h = ((seed ^ (i * 2654435761)) >>> 0) / 4294967296;
  return Math.sin(i * 0.47 + seed) * 0.12 + Math.sin(i * 0.11) * 0.06 + (h - 0.5) * 0.08;
}

function buildSeries(days, base, slope, seed, opts = {}) {
  const { spikeAt = null, spikeAmt = 0, flat = false } = opts;
  return Array.from({ length: days }, (_, i) => {
    let v = base + (flat ? 0 : slope * i) + chartNoise(seed, i);
    if (spikeAt != null && i >= spikeAt) v += spikeAmt * Math.min(1, (i - spikeAt) / 4);
    return +v.toFixed(2);
  });
}

function buildBaseline(values, window = 14) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return +avg.toFixed(2);
  });
}

function buildBand(baseline, pct = 0.12) {
  return baseline.map((b) => ({
    low: +(b * (1 - pct)).toFixed(2),
    high: +(b * (1 + pct)).toFixed(2),
  }));
}

function computeAnomalyScore(values, baseline, band, alarm) {
  const n = values.length;
  const tail = values.slice(Math.max(0, n - 14));
  const tailBase = baseline.slice(Math.max(0, n - 14));
  let score = 0;
  tail.forEach((v, i) => {
    const b = tailBase[i] || tailBase[tailBase.length - 1];
    const drift = b ? Math.abs((v - b) / b) : 0;
    score += drift;
    if (band) {
      const hi = band[Math.max(0, n - 14) + i]?.high;
      if (hi && v > hi) score += 0.4;
    }
  });
  if (alarm != null) {
    const last = values[n - 1];
    if (last > alarm * 0.85) score += 0.5;
    if (last > alarm) score += 1.2;
  }
  const slope = (values[n - 1] - values[Math.max(0, n - 7)]) / 7;
  score += Math.abs(slope) * (alarm ? 2 : 0.3);
  return +Math.min(10, score * 1.8).toFixed(2);
}

function signalStatus(score, values, lastIdx) {
  if (score >= 6.5) return "crit";
  if (score >= 4) return "warn";
  const n = Math.min(7, lastIdx);
  if (n >= 2) {
    const d = values[lastIdx] - values[lastIdx - n];
    if (Math.abs(d) > 0.15 && score >= 2) return "warn";
  }
  return "ok";
}

function buildSignalsForScenario(catalog, days, isHealthy) {
  const signals = {};
  const meta = catalog.map((def) => {
    const g = def.gen;
    const slope = isHealthy ? (g.slope || 0) * 0.05 : g.slope;
    const base = isHealthy ? g.base * (def.id === "vib-de" ? 0.92 : 1) : g.base;
    const values = buildSeries(days, base, slope, g.seed, { flat: isHealthy && def.id !== "stroke-count" });
    let baseline = null;
    let band = null;
    if (g.baselinePct != null || def.id === "vib-de") {
      baseline = buildBaseline(values, isHealthy ? 21 : 18);
      band = buildBand(baseline, isHealthy ? 0.08 : (g.baselinePct || 0.1));
    }
    signals[def.id] = { values, baseline, band };
    const anomalyScore = isHealthy && def.id !== "vib-de"
      ? computeAnomalyScore(values, baseline || values, band, def.alarm) * 0.15
      : computeAnomalyScore(values, baseline || values, band, def.alarm);
    return { ...def, anomalyScore, status: signalStatus(anomalyScore, values, days - 1) };
  });
  return { signals, catalog: meta };
}

/** Full dataset for press investigation stories. */
function getInvestigationDataset(scenario = "concern") {
  const days = 90;
  const today = new Date(2026, 4, 19);
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return d;
  });

  const isHealthy = scenario === "healthy";
  const isDrill = scenario === "drill-in";

  const { signals, catalog } = buildSignalsForScenario(SIGNAL_CATALOG, days, isHealthy);

  // Legacy keys for overlay chart
  signals.temp = signals["temp-de"];
  if (!signals["vib-de"].baseline) {
    signals["vib-de"].baseline = buildBaseline(signals["vib-de"].values, 18);
    signals["vib-de"].band = buildBand(signals["vib-de"].baseline, 0.1);
  }

  const alertOnsetDay = isHealthy ? null : 61;
  const flaggedFromDay = isHealthy ? null : 76;

  let viewStart = 0;
  let viewEnd = days - 1;
  if (scenario === "concern") {
    viewStart = 0;
    viewEnd = days - 1;
  } else if (scenario === "drill-in") {
    viewStart = 72;
    viewEnd = 89;
  } else {
    viewStart = days - 30;
    viewEnd = days - 1;
  }

  const recommended = isHealthy ? ["vib-de"] : ["vib-de", "temp-de", "current"];

  return {
    days,
    dates,
    scenario,
    signals,
    signalCatalog: catalog,
    events: isHealthy ? CHART_EVENTS.filter((e) => e.day <= 30 && e.type === "service") : CHART_EVENTS,
    alertOnsetDay,
    flaggedFromDay,
    viewStart,
    viewEnd,
    recommended,
    defaultRange: isHealthy ? "30d" : isDrill ? "7d" : "30d",
    machineLabel: isHealthy ? "Stamping Press 01" : "Stamping Press 04",
    machineId: isHealthy ? "WLF-P01" : "WLF-P04",
    concernTitle: isHealthy ? null : "Drive-side bearing vibration trending up",
  };
}

// ─── Fleet-level aggregates (fleet overview charts) ────────────────────────

function buildFleetHealthHistory(days = 90) {
  const base = buildSeries(days, 91.5, -0.028, 7);
  // Dip when critical event emerged (late stage)
  for (let i = 52; i < 58; i++) base[i] -= (i - 51) * 0.45;
  for (let i = 58; i < 64; i++) base[i] -= 2.8 - (i - 58) * 0.12;
  // Recovery after intervention
  for (let i = 64; i < days; i++) base[i] += 0.06;
  base[days - 1] = 88;
  return base.map((v) => +Math.max(62, Math.min(98, v)).toFixed(1));
}

function buildFleetForecast(history, days = 30) {
  const last = history[history.length - 1];
  const slope = (history[history.length - 1] - history[history.length - 15]) / 14;
  const mid = Array.from({ length: days }, (_, i) => {
    const v = last + slope * (i + 1) * 0.85 + chartNoise(19, i + 100) * 0.4;
    return +Math.max(72, Math.min(94, v)).toFixed(1);
  });
  const low = mid.map((v, i) => +(v - 1.8 - i * 0.04).toFixed(1));
  const high = mid.map((v, i) => +(v + 1.2 + i * 0.06).toFixed(1));
  return { mid, low, high };
}

function buildCumulative(values) {
  let sum = 0;
  return values.map((v) => {
    sum += v;
    return +sum.toFixed(1);
  });
}

const FLEET_HEALTH_HISTORY = buildFleetHealthHistory(90);
const FLEET_HEALTH_FORECAST = buildFleetForecast(FLEET_HEALTH_HISTORY, 30);
const FLEET_HEALTH_30D = FLEET_HEALTH_HISTORY.slice(-30);

const FLEET_TIMELINE_MARKERS = [
  { day: 8, type: "service", label: "Quarterly inspections · 3 sites" },
  { day: 28, type: "service", label: "Göteborg press line service window" },
  { day: 44, type: "alarm", label: "ALR-2391 · Compressor discharge temp" },
  { day: 55, type: "alarm", label: "ALR-2401 · Press bearing trend" },
  { day: 62, type: "alarm", label: "ALR-2406 · Pump bearing critical" },
  { day: 71, type: "added", label: "6 machines onboarded · Stockholm cell" },
  { day: 82, type: "service", label: "Luleå compressor row planned stop" },
];

const INTERVENTIONS_4W = [1, 2, 1, 1];

const INTERVENTIONS_90D = Array.from({ length: 13 }, (_, w) => {
  const planned = [0, 1, 1, 0, 2, 1, 1, 0, 1, 2, 1, 0, 1][w];
  const predictive = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0][w];
  const emergency = w === 8 ? 1 : 0;
  return { week: w + 1, planned, predictive, emergency };
});

const AVOIDED_DOWNTIME_WEEKLY = [14, 11, 18, 9, 16, 12, 10, 8, 7, 6, 5, 4, 2];
const AVOIDED_DOWNTIME_CUMULATIVE = buildCumulative(AVOIDED_DOWNTIME_WEEKLY);

const HEALTH_DISTRIBUTION = { ok: 186, warn: 36, crit: 7, unknown: 1 };

const ISSUE_PARETO = [
  { label: "Bearings", count: 18 },
  { label: "Hydraulics", count: 11 },
  { label: "Electrical", count: 9 },
  { label: "Sensor / comms", count: 6 },
  { label: "Thermal", count: 5 },
];

/** Realistic single-stroke press force–displacement signature (0–50 mm, 0–630 kN). */
function buildPressStrokeCycle(seed, opts = {}) {
  const { anomaly = false, cycleIndex = 0 } = opts;
  const s = seed + cycleIndex * 997;
  const n = 96;
  const peakForce = (584 + (s % 19)) + (anomaly ? 22 : 0) + chartNoise(s, 99) * 2;
  const contactDisp = 21.2 + (s % 11) * 0.07 + (anomaly ? -1.4 : 0);
  const bdcDisp = 29.8 + (s % 9) * 0.05 + (anomaly ? 1.1 : 0);
  const noise = (i) => chartNoise(s, i) * (anomaly ? 5 : 3);

  return Array.from({ length: n }, (_, i) => {
    const disp = (i / (n - 1)) * 50;
    let force = 0;
    if (disp < contactDisp) {
      force = 1.5 + disp * 0.08 + noise(i);
    } else if (disp < bdcDisp) {
      const p = (disp - contactDisp) / Math.max(0.01, bdcDisp - contactDisp);
      const ease = p * p * (3 - 2 * p);
      force = 8 + ease * (peakForce - 8) + noise(i) * 0.3;
    } else if (disp < 37.5) {
      const p = (disp - bdcDisp) / (37.5 - bdcDisp);
      force = peakForce * (1 - p * 0.94) + noise(i) * 0.2;
    } else {
      const p = (disp - 37.5) / 12.5;
      force = peakForce * 0.06 * (1 - p) + noise(i) * 0.15;
    }
    return {
      force: +Math.max(0, Math.min(630, force)).toFixed(1),
      disp: +disp.toFixed(2),
      phase: disp < contactDisp ? "approach" : disp <= bdcDisp ? "form" : "retract",
    };
  });
}

function getForceDisplacementCycle(seed = 42, anomaly = false) {
  return buildPressStrokeCycle(seed, { anomaly, cycleIndex: 0 });
}

function getForceDisplacementGhosts(seed = 42, count = 75) {
  return Array.from({ length: count }, (_, i) =>
    buildPressStrokeCycle(seed, { anomaly: false, cycleIndex: i + 1 }),
  );
}

function getCycleAnnotations(cycle) {
  let peak = cycle[0];
  let contact = cycle[0];
  let bdc = cycle[0];
  cycle.forEach((p) => {
    if (p.force > peak.force) peak = p;
    if (p.disp > bdc.disp) bdc = p;
  });
  for (let i = 1; i < cycle.length; i++) {
    const slope = (cycle[i].force - cycle[i - 1].force) / Math.max(0.001, cycle[i].disp - cycle[i - 1].disp);
    if (cycle[i].disp > 18 && slope > 40 && cycle[i].force > 15) {
      contact = cycle[i];
      break;
    }
  }
  if (contact.force < 10) {
    contact = cycle.find((p) => p.disp > 20 && p.force > 12) || cycle[Math.floor(cycle.length * 0.42)];
  }
  return { peak, contact, bdc: peak };
}

/** Machine-level chart data for detail page. */
function getMachineChartData(machineId) {
  const m = typeof window !== "undefined" && window.getMachine ? window.getMachine(machineId) : null;
  if (!m) return null;
  const seed = dataHashSeed(machineId);
  const anomaly = m.status !== "ok";
  const healthHistory = buildSiteHealthHistory(m.health ?? 75, seed);
  const healthForecast = buildFleetForecast(healthHistory, 30);

  const markers = [
    { day: 12, type: "service", label: "Quarterly inspection · re-greased DE bearing" },
    { day: 38, type: "recipe", label: "Die set B · higher stroke rate" },
    { day: 58, type: "alarm", label: "ALR-2401 opened · bearing trend" },
  ];
  if (m.status === "crit") {
    markers.push({ day: 72, type: "alarm", label: "Critical threshold crossed" });
  }

  const signalGrid = [
    { id: "vib-de", label: "Vib · drive end", unit: "mm/s", value: anomaly && m.issue?.includes("vibration") ? 3.6 : 2.4, status: anomaly && m.issue?.includes("vibration") ? "warn" : "ok",
      values: buildSeries(30, anomaly ? 2.8 : 2.2, anomaly ? 0.028 : 0.002, seed + 1) },
    { id: "vib-nde", label: "Vib · NDE", unit: "mm/s", value: 1.9, status: "ok", values: buildSeries(30, 1.95, 0.001, seed + 2, { flat: true }) },
    { id: "temp-de", label: "Bearing temp", unit: "°C", value: 68, status: "ok", values: buildSeries(30, 65.5, 0.008, seed + 3) },
    { id: "current", label: "Motor current", unit: "A", value: 42.1, status: "ok", values: buildSeries(30, 41.6, 0.003, seed + 4, { flat: true }) },
    { id: "temp-oil", label: "Oil temp", unit: "°C", value: 48, status: "ok", values: buildSeries(30, 47.5, 0.002, seed + 5, { flat: true }) },
    { id: "oil-p", label: "Oil pressure", unit: "bar", value: 5.8, status: "ok", values: buildSeries(30, 5.75, 0.0005, seed + 6, { flat: true }) },
    { id: "cycles", label: "Cycle rate", unit: "/h", value: 412, status: "ok", values: buildSeries(30, 415, -0.08, seed + 7) },
    { id: "stroke", label: "Stroke length", unit: "mm", value: 48.2, status: "ok", values: buildSeries(30, 48.2, 0, seed + 8, { flat: true }) },
    { id: "tonnage", label: "Peak tonnage", unit: "kN", value: anomaly ? 612 : 598, status: anomaly ? "warn" : "ok",
      values: buildSeries(30, anomaly ? 585 : 592, anomaly ? 0.5 : 0.05, seed + 9) },
    { id: "cushion", label: "Cushion pressure", unit: "bar", value: 42, status: "ok", values: buildSeries(30, 41.8, 0.01, seed + 10, { flat: true }) },
  ];

  const vibValues = signalGrid[0].values;
  const baseline = buildBaseline(vibValues, 10);
  const band = buildBand(baseline, 0.1);
  const anomalySeries = { values: vibValues, baseline, band, alarm: 4.5 };

  return {
    healthHistory,
    healthForecast,
    markers,
    signalGrid,
    anomalySeries,
    forceCycle: getForceDisplacementCycle(seed, anomaly),
    forceGhosts: getForceDisplacementGhosts(seed, 75),
    forceAnnotations: getCycleAnnotations(getForceDisplacementCycle(seed, anomaly)),
  };
}

/** Prior-case overlay curves for alert detail (normalized 0–1). */
function getPriorCaseCurves() {
  const n = 40;
  const current = Array.from({ length: n }, (_, i) => {
    const base = 0.22 + (i / n) * 0.68;
    return +(base + (i > 28 ? (i - 28) * 0.035 : 0)).toFixed(3);
  });
  const resolvedEarly = Array.from({ length: n }, (_, i) => +(0.18 + (i / n) * 0.52 + chartNoise(3, i) * 0.02).toFixed(3));
  const resolvedLate = Array.from({ length: n }, (_, i) => {
    const base = 0.2 + (i / n) * 0.45;
    return +(base + (i > 32 ? (i - 32) * 0.09 : 0)).toFixed(3);
  });
  return { current, resolvedEarly, resolvedLate };
}

/** 12-week service load heatmap (0–3 intensity). */
function getServiceHeatmap() {
  return Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const seed = w * 7 + d + 11;
      const h = ((seed * 9301 + 49297) % 233280) / 233280;
      return h > 0.72 ? 3 : h > 0.48 ? 2 : h > 0.28 ? 1 : 0;
    }),
  );
}

const FLEET_CHARTS = {
  healthHistory: FLEET_HEALTH_HISTORY,
  healthForecast: FLEET_HEALTH_FORECAST,
  health30d: FLEET_HEALTH_30D,
  markers: FLEET_TIMELINE_MARKERS,
  interventions4w: INTERVENTIONS_4W,
  interventions90d: INTERVENTIONS_90D,
  avoidedWeekly: AVOIDED_DOWNTIME_WEEKLY,
  avoidedCumulative: AVOIDED_DOWNTIME_CUMULATIVE,
  healthDistribution: HEALTH_DISTRIBUTION,
  issuePareto: ISSUE_PARETO,
};

window.SIGNAL_CATALOG = SIGNAL_CATALOG;
window.CHART_SIGNALS = CHART_SIGNALS;
window.CHART_EVENTS = CHART_EVENTS;
window.getInvestigationDataset = getInvestigationDataset;
window.FLEET_CHARTS = FLEET_CHARTS;
window.getForceDisplacementCycle = getForceDisplacementCycle;
window.getForceDisplacementGhosts = getForceDisplacementGhosts;
window.getCycleAnnotations = getCycleAnnotations;
window.getMachineChartData = getMachineChartData;
window.getPriorCaseCurves = getPriorCaseCurves;
window.getServiceHeatmap = getServiceHeatmap;

// ─── Site-scoped chart data ──────────────────────────────────────────────────

function dataHashSeed(str) {
  let h = 2166136261;
  const s = String(str || "x");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildSiteHealthHistory(baseHealth, seed, days = 90) {
  const slope = baseHealth > 85 ? -0.012 : baseHealth > 75 ? -0.022 : -0.035;
  const hist = buildSeries(days, baseHealth + 2, slope, seed);
  if (baseHealth < 70) {
    for (let i = 50; i < 58; i++) hist[i] -= (i - 49) * 0.35;
    for (let i = 58; i < days; i++) hist[i] += 0.04;
  }
  hist[days - 1] = baseHealth;
  return hist.map((v) => +Math.max(48, Math.min(99, v)).toFixed(1));
}

function categorizeIssue(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("bearing") || t.includes("vibration") || t.includes("spectrum")) return "Bearings";
  if (t.includes("hydraulic") || t.includes("cavitation") || t.includes("pressure") || t.includes("pump")) return "Hydraulics";
  if (t.includes("current") || t.includes("electrical") || t.includes("stator")) return "Electrical";
  if (t.includes("sensor") || t.includes("offline") || t.includes("gateway")) return "Sensor / comms";
  if (t.includes("temperature") || t.includes("thermal") || t.includes("discharge temp")) return "Thermal";
  return "Process";
}

function buildSitePareto(machines, alerts) {
  const counts = {};
  machines.forEach((m) => {
    if (!m.issue) return;
    const cat = categorizeIssue(m.issue);
    counts[cat] = (counts[cat] || 0) + 1;
  });
  alerts.forEach((a) => {
    const cat = categorizeIssue(a.title);
    counts[cat] = (counts[cat] || 0) + 0.5;
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count: Math.round(count) || 1 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getHealthDelta7d(machine) {
  if (machine.health == null) return null;
  const seed = dataHashSeed(machine.id + ":delta7");
  if (machine.status === "crit") return -(3 + (seed % 5));
  if (machine.status === "warn") {
    if (machine.trendKey === "rising" || machine.trendKey === "spike") return -(2 + (seed % 4));
    if (machine.trendKey === "stepped") return -(1 + (seed % 3));
    return -(1 + (seed % 2));
  }
  if (machine.status === "unknown") return null;
  return (seed % 5) - 2;
}

function inferSignalMeta(machine) {
  if (machine.status === "unknown") {
    return { label: "Sensor", shape: "offline", values: null };
  }
  if (!machine.issue) {
    return { label: "Vibration", shape: "flat", values: buildSeries(15, 50, 0, dataHashSeed(machine.id), { flat: true }) };
  }
  const issue = machine.issue.toLowerCase();
  const seed = dataHashSeed(machine.id + ":sig");
  if (issue.includes("vibration") || issue.includes("spectrum") || issue.includes("bearing")) {
    const shape = machine.trendKey || "rising";
    const base = issue.includes("critical") || machine.status === "crit" ? 55 : 38;
    const slope = shape === "flat" ? 0 : shape === "spike" ? 0.08 : 0.04;
    return { label: "Vibration", shape, values: buildSeries(15, base, slope, seed, { spikeAt: shape === "spike" ? 9 : null, spikeAmt: shape === "spike" ? 18 : 0 }) };
  }
  if (issue.includes("current") || issue.includes("imbalance")) {
    return { label: "Current", shape: "drift", values: buildSeries(15, 42, 0.08, seed) };
  }
  if (issue.includes("temperature") || issue.includes("thermal") || issue.includes("discharge temp")) {
    return { label: "Temperature", shape: "stepped", values: buildSeries(15, 48, 0.02, seed, { spikeAt: 10, spikeAmt: 12 }) };
  }
  if (issue.includes("cavitation") || issue.includes("pressure")) {
    return { label: "Pressure", shape: "rising", values: buildSeries(15, 36, 0.06, seed) };
  }
  if (issue.includes("sensor") || issue.includes("offline")) {
    return { label: "Sensor", shape: "offline", values: null };
  }
  return { label: "Signal", shape: machine.trendKey || "drift", values: buildSeries(15, 45, 0.03, seed) };
}

function getSignalSeries(machine) {
  return inferSignalMeta(machine).values;
}

function getSiteChartData(siteId) {
  const site = typeof window !== "undefined" && window.getSite ? window.getSite(siteId) : null;
  if (!site) return null;
  const machines = window.machinesAt(siteId);
  const alerts = window.alertsAt(siteId).filter((a) => a.status === "open" && a.severity !== "info");
  const seed = dataHashSeed(siteId);

  const healthHistory = buildSiteHealthHistory(site.health, seed);
  const healthForecast = buildFleetForecast(healthHistory, 30);

  const issuesOverTime = Array.from({ length: 13 }, (_, w) => {
    const h = ((seed + w * 131) % 100) / 100;
    const baseWarn = site.attention > 0 ? 1 + (w > 8 ? 1 : 0) : 0;
    const baseCrit = site.critical ? (w > 7 ? 1 : 0) : 0;
    return {
      crit: baseCrit + (h > 0.92 ? 1 : 0),
      warn: baseWarn + Math.floor(h * 2),
    };
  });

  const pareto = buildSitePareto(machines, alerts);
  const fallbackPareto = pareto.length ? pareto : [{ label: "Bearings", count: 1 }];

  const upcoming = [
    { week: 1, planned: 1, predictive: site.forecast > 0 ? 1 : 0 },
    { week: 2, planned: 1, predictive: 0 },
    { week: 3, planned: 0, predictive: site.forecast > 1 ? 1 : 0 },
    { week: 4, planned: site.attention > 2 ? 1 : 0, predictive: 1 },
  ];

  const siteActivity =
    siteId === "trn" ? [
      { day: "Yesterday", type: "alarm", label: "ALR-2398 opened · foundation vibration shifted", machine: "TRN-FRG01" },
      { day: "17 May", type: "alarm", label: "ALR-2395 · cavitation signature on pump 3", machine: "TRN-HT3" },
      { day: "14 May", type: "service", label: "Trim press quarterly vibration check", machine: "TRN-TRM2" },
      { day: "9 May", type: "work", label: "Forge hammer walkdown completed", machine: "TRN-FRG02" },
    ] : siteId === "lyn" ? [
    { day: "Today", type: "alarm", label: "ALR-2406 · bearing acceleration critical", machine: "LYN-PMP04" },
    { day: "17 May", type: "alarm", label: "Discharge pressure variance trending up", machine: "LYN-PMP02" },
    { day: "12 May", type: "service", label: "Cooling tower fan bearing inspection", machine: "LYN-CT1" },
    { day: "9 May", type: "work", label: "Work order · pump room A walkdown", machine: "LYN-PMP01" },
  ] : siteId === "wlf" ? [
    { day: "Today", type: "offline", label: "Sensor offline · cooling fan F-02", machine: "WLF-F02" },
    { day: "Yesterday", type: "alarm", label: "ALR-2401 · drive-side bearing trend", machine: "WLF-P04" },
    { day: "15 May", type: "service", label: "Quarterly vibration check · press 02", machine: "WLF-P02" },
    { day: "10 May", type: "work", label: "Hydraulic filter change completed", machine: "WLF-H07" },
  ] : siteId === "rot" ? [
    { day: "16 May", type: "alarm", label: "ALR-2391 · discharge temperature drift", machine: "ROT-CPR2" },
    { day: "8 May", type: "service", label: "Compressor row A planned stop", machine: "ROT-CPR1" },
  ] : [
    { day: "14 May", type: "service", label: "Cell 1 planned maintenance window", machine: "GOT-CNC1" },
    { day: "6 May", type: "work", label: "Tool crib inventory check", machine: "GOT-CNC2" },
  ];

  const weeklyChanges = [
    site.attention > 0 && { text: `${site.attention} machine${site.attention !== 1 ? "s" : ""} moved to watch status`, kind: "warn" },
    site.critical && { text: "1 critical alert opened · bearing acceleration", kind: "crit" },
    alerts.find((a) => a.raised.includes("Yesterday")) && { text: "New alert · " + (alerts.find((a) => a.raised.includes("Yesterday"))?.title || "sensor trend"), kind: "warn" },
    { text: "Site health " + (site.health >= 90 ? "stable" : "down 2 pts") + " vs last week", kind: site.health >= 90 ? "ok" : "warn" },
    site.forecast > 0 && { text: `${site.forecast} predicted intervention${site.forecast !== 1 ? "s" : ""} in next 30 days`, kind: "forecast" },
    machines.some((m) => m.status === "unknown") && { text: "1 sensor offline · gateway check pending", kind: "unknown" },
  ].filter(Boolean).slice(0, 5);

  return {
    healthHistory,
    healthForecast,
    issuesOverTime,
    pareto: fallbackPareto,
    upcoming,
    activity: siteActivity,
    weeklyChanges,
  };
}

window.getSiteChartData = getSiteChartData;
window.getHealthDelta7d = getHealthDelta7d;
window.getSignalSeries = getSignalSeries;
window.inferSignalMeta = inferSignalMeta;
