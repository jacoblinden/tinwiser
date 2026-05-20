// chart-data.js — deterministic chart datasets for the press demo.
// All values are mock; they're shaped so the visuals tell the story.

// ───────────────────────────────────────────────────────────────────────────
// Force curve generators — tonnage vs crank angle (0–360°)
// Returns array of N samples in tons. Sharp blanking impulse near BDC (180°).
// ───────────────────────────────────────────────────────────────────────────
function makeForceCurve({ peak = 38, bdcAngle = 182, width = 26, noise = 0, shift = 0, secondary = 0, samples = 180 } = {}) {
  const data = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * 360;
    // primary blanking peak — narrow gaussian
    const a = angle - bdcAngle - shift;
    let val = peak * Math.exp(-(a * a) / (2 * width * width));
    // bottom-dead-center side lobe (return spring / scrap)
    val += secondary * Math.exp(-((angle - bdcAngle - 18) ** 2) / (2 * 8 * 8));
    // gentle baseline (counterbalance)
    val += 0.7 + 0.2 * Math.sin(angle * Math.PI / 180);
    // pseudo-random noise (deterministic via i)
    if (noise) {
      const n = Math.sin(i * 12.9898 + bdcAngle * 0.7) * 43758.5453;
      val += (n - Math.floor(n) - 0.5) * 2 * noise;
    }
    data.push(Math.max(0, val));
  }
  return data;
}

// 200 ghost cycles for the "last 200 cycles" overlay.
// We generate a small set of variant curves; the chart renderer will draw them
// with low opacity. Each variant slightly different so the cloud looks alive.
function makeGhostBundle({ peak, bdcAngle, drift = false, count = 18 }) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const t = k / Math.max(1, count - 1); // 0..1, oldest..newest
    const peakHere = peak + (drift ? t * 1.2 : 0) + (Math.sin(k * 1.3) * 0.4);
    const widthHere = 26 + (drift ? t * 1.5 : 0);
    const shiftHere = drift ? t * 0.7 : 0;
    out.push(makeForceCurve({
      peak: peakHere,
      bdcAngle,
      width: widthHere,
      shift: shiftHere,
      noise: 0.25 + Math.sin(k * 0.7) * 0.1,
      secondary: 1.4 + Math.sin(k * 1.1) * 0.3,
    }));
  }
  return out;
}

// Pre-baked force curves for the demo. The BSTA-50 #3 has the "guide wear"
// story — slightly broadened, slightly shifted peak, with cycles drifting.
const FORCE_CURVES = {
  // Healthy BSTA-50 fine blanking — tight, repeatable
  "VNG-BSTA-01": {
    peak: 38, bdcAngle: 182,
    ghosts: makeGhostBundle({ peak: 38, bdcAngle: 182, drift: false }),
    current: makeForceCurve({ peak: 37.8, bdcAngle: 182, width: 25, noise: 0.2, secondary: 1.6 }),
    baseline: makeForceCurve({ peak: 38.0, bdcAngle: 182, width: 25, secondary: 1.6 }),
    annotations: { bdc: 182, peakAngle: 182 },
    summary: "Last 200 cycles overlapping tightly. Peak ±0.3 ton, BDC ±0.02 mm.",
    healthy: true,
  },
  // BSTA-50 #3 — guide wear story (the hero machine)
  "VNG-BSTA-03": {
    peak: 39.4, bdcAngle: 184,
    ghosts: makeGhostBundle({ peak: 38, bdcAngle: 182, drift: true, count: 22 }),
    current: makeForceCurve({ peak: 39.4, bdcAngle: 184, width: 29, noise: 0.3, secondary: 1.9 }),
    baseline: makeForceCurve({ peak: 38.0, bdcAngle: 182, width: 25, secondary: 1.6 }),
    annotations: { bdc: 182, peakAngle: 184, deviation: "Peak shifted +2° · width +4°" },
    summary: "Last 200 cycles drifting. Peak +1.4 ton, BDC angle shifted +2° over 8 weeks.",
    healthy: false,
  },
  // MSP-630 #1 — large mechanical press, healthy curve
  "VNG-MSP-01": {
    peak: 480, bdcAngle: 180,
    ghosts: makeGhostBundle({ peak: 480, bdcAngle: 180, drift: false, count: 16 }),
    current: makeForceCurve({ peak: 478, bdcAngle: 180, width: 32, noise: 4, secondary: 24 }),
    baseline: makeForceCurve({ peak: 480, bdcAngle: 180, width: 32, secondary: 24 }),
    annotations: { bdc: 180, peakAngle: 180 },
    summary: "Force curve healthy. Bearing trend is the concern, not the stroke.",
    healthy: true,
  },
  // Aida NC1-300 #2 — tonnage drift story
  "ESK-NC1-02": {
    peak: 318, bdcAngle: 180,
    ghosts: makeGhostBundle({ peak: 300, bdcAngle: 180, drift: true, count: 22 }),
    current: makeForceCurve({ peak: 318, bdcAngle: 180, width: 28, noise: 3, secondary: 16 }),
    baseline: makeForceCurve({ peak: 300, bdcAngle: 180, width: 28, secondary: 16 }),
    annotations: { bdc: 180, peakAngle: 180, deviation: "Peak +6% on R-302 over 9.4k cycles" },
    summary: "Peak tonnage rising. Width steady → die wear, not press wear.",
    healthy: false,
  },
};

// Fallback for any press not pre-baked
function defaultForceCurve(press) {
  const peak = (press.tonnage || 100) * 0.78;
  const bdc = 180;
  return {
    peak, bdcAngle: bdc,
    ghosts: makeGhostBundle({ peak, bdcAngle: bdc, drift: false, count: 12 }),
    current: makeForceCurve({ peak, bdcAngle: bdc, width: 28, noise: peak * 0.012, secondary: peak * 0.06 }),
    baseline: makeForceCurve({ peak, bdcAngle: bdc, width: 28, secondary: peak * 0.06 }),
    annotations: { bdc, peakAngle: bdc },
    summary: "Last 200 cycles consistent.",
    healthy: true,
  };
}

window.getForceCurve = (pressId) => FORCE_CURVES[pressId] || defaultForceCurve(window.getPress(pressId) || { tonnage: 100 });

// ───────────────────────────────────────────────────────────────────────────
// Time series — last N days of a metric, with optional projection
// ───────────────────────────────────────────────────────────────────────────
function makeTimeSeries({ days = 60, base = 2.5, slope = 0, noise = 0.1, jumpAt = null, jumpDelta = 0 } = {}) {
  const out = [];
  for (let i = 0; i < days; i++) {
    let v = base + slope * i;
    if (jumpAt != null && i >= jumpAt) v += jumpDelta;
    const n = Math.sin(i * 7.21 + base * 0.3) * 43758.5453;
    v += (n - Math.floor(n) - 0.5) * 2 * noise;
    out.push(v);
  }
  return out;
}

const TIMESERIES = {
  // BSTA-50 #3 — slide parallelism, µm, 56 days, gentle linear rise
  "VNG-BSTA-03_parallelism": {
    days: 56, unit: "µm", baseline: 18, threshold: 80, projectionWeeks: 4,
    label: "Slide parallelism (corner-to-corner)",
    data: makeTimeSeries({ days: 56, base: 18, slope: 0.42, noise: 1.2 }),
    events: [
      { day: 0,  label: "Q1 inspection" },
      { day: 28, label: "Re-grease" },
    ],
  },
  // MSP-630 #1 — velocity RMS, 60 days, slow drift
  "VNG-MSP-01_vibration": {
    days: 60, unit: "mm/s", baseline: 2.4, threshold: 4.5, projectionWeeks: 5,
    label: "Velocity RMS · drive-end bearing",
    data: makeTimeSeries({ days: 60, base: 2.4, slope: 0.018, noise: 0.10 }),
    events: [
      { day: 12, label: "Quarterly · re-greased" },
    ],
  },
  // Aida NC1-300 #2 — peak tonnage on R-302, last 30 production days
  "ESK-NC1-02_tonnage": {
    days: 30, unit: "ton", baseline: 300, threshold: 330, projectionWeeks: 2,
    label: "Peak tonnage on R-302",
    data: makeTimeSeries({ days: 30, base: 300, slope: 0.6, noise: 1.4 }),
    events: [],
  },
};

window.getTimeSeries = (key) => TIMESERIES[key];
window.allTimeSeries = TIMESERIES;

// ───────────────────────────────────────────────────────────────────────────
// Small multiples — short, synced traces per press-canonical signal.
// 14 days, daily samples. Tagged with status, baseline, threshold.
// ───────────────────────────────────────────────────────────────────────────
function _dr(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function makeMini({ days = 14, base = 50, slope = 0, noise = 1, jumpAt = null, jumpDelta = 0, seed = 7 } = {}) {
  const r = _dr(seed);
  const out = [];
  for (let i = 0; i < days; i++) {
    let v = base + slope * i + (r() - 0.5) * 2 * noise;
    if (jumpAt != null && i >= jumpAt) v += jumpDelta;
    out.push(v);
  }
  return out;
}

// Per-press small-multiples deck. Each entry: array of {key, name, unit, data, baseline, threshold, status, range}
function _miniDeck(p) {
  const days = 14;
  const issue = p.issue || "";
  const guide   = issue.includes("guide");
  const bearing = issue.includes("bearing");
  const ton     = issue.includes("tonnage");
  const offline = p.status === "unknown";
  const peakBase = (p.tonnage || 50) * 0.78;

  const peakSeries = ton
    ? makeMini({ days, base: peakBase, slope: peakBase * 0.005, noise: peakBase * 0.008, seed: 11 })
    : makeMini({ days, base: peakBase, noise: peakBase * 0.004, seed: 11 });

  const parallelism = guide
    ? makeMini({ days, base: 26, slope: 1.4, noise: 1.6, seed: 13 })
    : makeMini({ days, base: 18, noise: 1.0, seed: 13 });

  const bearingRMS = bearing
    ? makeMini({ days, base: 2.9, slope: 0.05, noise: 0.10, seed: 17 })
    : makeMini({ days, base: 2.3, noise: 0.08, seed: 17 });

  const bearingTemp = bearing
    ? makeMini({ days, base: 66, slope: 0.45, noise: 0.6, seed: 19 })
    : makeMini({ days, base: 62, noise: 0.6, seed: 19 });

  const driveCurrent = guide
    ? makeMini({ days, base: 60, slope: 0.18, noise: 0.4, seed: 23 })
    : makeMini({ days, base: 60, noise: 0.4, seed: 23 });

  const bdcVar = guide
    ? makeMini({ days, base: 0.04, slope: 0.003, noise: 0.005, seed: 29 })
    : makeMini({ days, base: 0.025, noise: 0.004, seed: 29 });

  const cycleRate = p.type === "mechanical" ? 640 : p.type === "servo" ? 84 : 18;
  const cyc = makeMini({ days, base: cycleRate, noise: cycleRate * 0.01, seed: 31 });

  const lubePressure = makeMini({ days, base: 5.8, noise: 0.06, seed: 37 });

  return [
    { key: "ton",       name: "Peak tonnage",        unit: "ton",  data: peakSeries,  baseline: peakBase,   threshold: ton ? peakBase * 1.10 : null, status: ton ? "warn" : "ok" },
    { key: "par",       name: "Slide parallelism",   unit: "µm",   data: parallelism, baseline: 18,         threshold: 80,                            status: guide ? "warn" : "ok" },
    { key: "bdc",       name: "BDC variability",     unit: "mm",   data: bdcVar,      baseline: 0.025,      threshold: 0.10,                          status: guide ? "warn" : "ok", digits: 3 },
    { key: "vibDE",     name: "Velocity RMS · DE",   unit: "mm/s", data: bearingRMS,  baseline: 2.4,        threshold: 4.5,                           status: bearing ? "warn" : "ok" },
    { key: "tempDE",    name: "Bearing temp · DE",   unit: "°C",   data: bearingTemp, baseline: 60,         threshold: 85,                            status: bearing ? "warn" : "ok" },
    { key: "current",   name: "Drive current",       unit: "%",    data: driveCurrent,baseline: 60,         threshold: 78,                            status: guide ? "warn" : "ok" },
    { key: "spm",       name: "Cycle rate",          unit: "/min", data: cyc,         baseline: cycleRate,  threshold: null,                          status: "ok" },
    { key: "lube",      name: "Lube pressure",       unit: "bar",  data: lubePressure,baseline: 5.6,        threshold: 4.5,                           status: "ok" },
  ];
}

window.getMiniDeck = (pressId) => {
  const p = window.getPress(pressId);
  if (!p) return [];
  return _miniDeck(p);
};

// ───────────────────────────────────────────────────────────────────────────
// FFT spectrum — single-axis power spectrum with bearing-tone markers.
// X: frequency 0..500 Hz, Y: magnitude (relative).
// ───────────────────────────────────────────────────────────────────────────
function _peak(freq, amp, width, f) {
  const dx = f - freq;
  return amp * Math.exp(-(dx * dx) / (2 * width * width));
}

function _makeSpectrum({ baseRPM = 25, harmonics = [1, 2, 3, 4, 6, 8], bearing = null, noise = 0.05, seed = 13 } = {}) {
  const r = _dr(seed);
  const points = [];
  const N = 200;
  const fMax = 500;
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * fMax;
    let mag = 0.04 + (r() - 0.5) * noise;
    // 1× and harmonics of shaft speed
    harmonics.forEach((h, hi) => {
      const amp = (h === 1 ? 1.0 : 0.55 / h);
      mag += _peak(baseRPM * h, amp, 1.2, f);
    });
    // Bearing tones — BPFO, BPFI, BSF, FTF
    if (bearing) {
      mag += _peak(bearing.BPFO,     bearing.ampBPFO || 0.18, 1.6, f);
      mag += _peak(bearing.BPFO * 2, (bearing.ampBPFO || 0.18) * 0.5, 1.6, f);
      mag += _peak(bearing.BPFI,     bearing.ampBPFI || 0.10, 1.6, f);
      mag += _peak(bearing.BSF,      bearing.ampBSF  || 0.06, 1.4, f);
      mag += _peak(bearing.FTF,      bearing.ampFTF  || 0.04, 1.0, f);
    }
    // 1/f^.5 background tilt
    mag += 0.6 / Math.max(2, Math.sqrt(f + 4));
    // floor
    mag = Math.max(0.02, mag);
    points.push({ f, mag });
  }
  return points;
}

// Bearing tones for SKF 22220EK on MSP-630 at ~1500 RPM input (25 Hz).
const _BEARING_HEALTHY = {
  BPFO: 86, BPFI: 116, BSF: 44, FTF: 9.7,
  ampBPFO: 0.06, ampBPFI: 0.04, ampBSF: 0.03, ampFTF: 0.02,
};
const _BEARING_WORN = {
  BPFO: 86, BPFI: 116, BSF: 44, FTF: 9.7,
  ampBPFO: 0.42, ampBPFI: 0.14, ampBSF: 0.10, ampFTF: 0.04,
};

const FFT_DATA = {
  "VNG-MSP-01": {
    spectrum: _makeSpectrum({ baseRPM: 25, bearing: _BEARING_WORN, seed: 31 }),
    baseline: _makeSpectrum({ baseRPM: 25, bearing: _BEARING_HEALTHY, seed: 33 }),
    markers: [
      { freq: 25,  label: "1×",    note: "shaft" },
      { freq: 50,  label: "2×" },
      { freq: 86,  label: "BPFO",  note: "outer-race fault", critical: true },
      { freq: 116, label: "BPFI",  note: "inner-race fault" },
      { freq: 172, label: "2×BPFO", note: "2nd harmonic" },
    ],
    rpm: 1500,
    bearingRef: "SKF 22220 EK",
    note: "BPFO band is up 7× from baseline. Pattern matches outer-race spalling — typical 2–4 weeks before audible noise.",
  },
  "VNG-BSTA-03": {
    spectrum: _makeSpectrum({ baseRPM: 42, harmonics: [1, 2, 3, 4, 6, 8, 12], bearing: { BPFO: 162, BPFI: 218, BSF: 78, FTF: 18, ampBPFO: 0.04, ampBPFI: 0.04, ampBSF: 0.03, ampFTF: 0.02 }, seed: 41 }),
    baseline: _makeSpectrum({ baseRPM: 42, harmonics: [1, 2, 3, 4, 6, 8, 12], bearing: { BPFO: 162, BPFI: 218, BSF: 78, FTF: 18, ampBPFO: 0.03, ampBPFI: 0.03, ampBSF: 0.025, ampFTF: 0.018 }, seed: 43 }),
    markers: [
      { freq: 42,  label: "1×",   note: "main shaft" },
      { freq: 84,  label: "2×" },
      { freq: 126, label: "3×" },
      { freq: 162, label: "BPFO" },
    ],
    rpm: 2520,
    bearingRef: "SKF 6210-2RS",
    note: "Spectrum within normal envelope. Bearing tones flat — the issue is mechanical (guides), not bearings.",
  },
};

window.getFFT = (pressId) => FFT_DATA[pressId];

// ───────────────────────────────────────────────────────────────────────────
// Spectrogram — frequency vs time matrix for bearing analysis (worn case).
// 7 days × 24 hourly windows = 168 time slots, 64 frequency bins (0..500 Hz).
// ───────────────────────────────────────────────────────────────────────────
function _makeSpectrogram({ days = 7, windowsPerDay = 24, bins = 64, fMax = 500, bearing, baseRPM = 25, ampScale = 1, seed = 5 } = {}) {
  const r = _dr(seed);
  const t = days * windowsPerDay;
  const M = []; // M[time][freq]
  // Peak width in *Hz*, sized to span ~2 frequency bins so bands are readable
  const binHz = fMax / (bins - 1);
  const peakW = binHz * 1.4; // ≈ 11 Hz at default settings
  for (let ti = 0; ti < t; ti++) {
    const day = ti / windowsPerDay;
    const dayProgress = day / days; // 0..1
    // BPFO amplitude grows non-linearly across week (the classic ramp-up signature)
    const dpExp = Math.pow(dayProgress, 1.4);
    const bpfo = bearing ? bearing.ampBPFO + dpExp * (bearing.maxBPFO - bearing.ampBPFO) : 0;
    // Hourly modulation — small diurnal cycle of load (production busier 06–18)
    const hourOfDay = ((ti % windowsPerDay) / windowsPerDay) * 24;
    const loadMod = 0.82 + 0.18 * Math.sin((hourOfDay - 6) * Math.PI / 12);
    const row = [];
    for (let fi = 0; fi < bins; fi++) {
      const f = (fi / (bins - 1)) * fMax;
      let mag = 0.02 + (r() - 0.5) * 0.02;
      // Shaft tones — constant amplitude (no growth)
      mag += _peak(baseRPM,     0.55 * ampScale * loadMod, peakW, f);
      mag += _peak(baseRPM * 2, 0.32 * ampScale * loadMod, peakW, f);
      mag += _peak(baseRPM * 3, 0.18 * ampScale * loadMod, peakW, f);
      if (bearing) {
        // The fault tones — these GROW
        mag += _peak(bearing.BPFO,     bpfo * loadMod,         peakW, f);
        mag += _peak(bearing.BPFO * 2, bpfo * 0.7 * loadMod,   peakW, f);
        mag += _peak(bearing.BPFI,     (0.04 + dpExp * 0.10) * loadMod, peakW, f);
        // Sidebands around BPFO at ±FTF (dead-giveaway of outer-race spalling)
        if (bearing.FTF) {
          mag += _peak(bearing.BPFO + bearing.FTF, bpfo * 0.5 * loadMod, peakW * 0.8, f);
          mag += _peak(bearing.BPFO - bearing.FTF, bpfo * 0.5 * loadMod, peakW * 0.8, f);
        }
      }
      // 1/f background (faint)
      mag += 0.2 / Math.max(2, Math.sqrt(f + 4));
      row.push(Math.max(0, mag));
    }
    M.push(row);
  }
  return { matrix: M, bins, fMax, days, windowsPerDay };
}

const SPECTROGRAMS = {
  "VNG-MSP-01": {
    ..._makeSpectrogram({ days: 7, bearing: { BPFO: 86, BPFI: 116, FTF: 9.7, ampBPFO: 0.10, maxBPFO: 0.85 }, baseRPM: 25, seed: 7 }),
    label: "DE accelerometer · Z-axis",
    note: "BPFO band intensifying across the week. Day 1 within baseline; day 7 at +7×.",
  },
};
window.getSpectrogram = (pressId) => SPECTROGRAMS[pressId];

// ───────────────────────────────────────────────────────────────────────────
// Heatmap calendar — 90 days of a daily-aggregated metric per press.
// Returns array of { date, value, status, cycles } sized by daily cycles count.
// ───────────────────────────────────────────────────────────────────────────
function _makeCalendar({ days = 91, seed = 11, press }) {
  const r = _dr(seed);
  const out = [];
  // End on today (Mon 18 May 2026). Build backwards 90 days.
  const issue = press?.issue || "";
  const guide = issue.includes("guide");
  const bearing = issue.includes("bearing");
  const ton = issue.includes("tonnage");
  for (let i = 0; i < days; i++) {
    const ago = days - 1 - i;
    const dayOfWeek = (i % 7); // 0..6 for color modulation
    // Cycles per day depends on press type
    const baseCycles = press?.type === "mechanical" ? 320000 : press?.type === "servo" ? 36000 : press?.type === "hydraulic" ? 7000 : press?.type === "fineblank" ? 32000 : 5000;
    // Weekend dip
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    let cycles = baseCycles * (isWeekend ? 0.15 : 1) * (0.85 + r() * 0.3);
    if (press?.status === "unknown" && ago < 1) cycles = 0;
    // Anomaly density rises towards present for issue-presses
    let anomaly = (r() * 0.1);
    if (guide && ago < 56) anomaly += (1 - ago / 56) * 0.5;
    if (bearing && ago < 60) anomaly += (1 - ago / 60) * 0.4;
    if (ton && ago < 30) anomaly += (1 - ago / 30) * 0.6;
    // Random downtime events
    let downtime = 0;
    if (r() < 0.04) downtime = r() * 2; // hours
    out.push({ ago, dayOfWeek, cycles: Math.round(cycles), anomaly, downtime });
  }
  return out;
}

const CALENDARS = {};
window.getCalendar = (pressId) => {
  if (CALENDARS[pressId]) return CALENDARS[pressId];
  const press = window.getPress(pressId);
  if (!press) return null;
  const data = _makeCalendar({ press, seed: 11 + pressId.length });
  CALENDARS[pressId] = data;
  return data;
};

// ───────────────────────────────────────────────────────────────────────────
// Pareto — failure modes / downtime drivers from the press history.
// Returns array of { label, hours, kind } sorted descending.
// ───────────────────────────────────────────────────────────────────────────
const PARETO = {
  "VNG-BSTA-03": [
    { label: "Guide & alignment",     hours: 14.2, count: 4, kind: "mechanical" },
    { label: "Lube / re-grease",      hours: 6.8,  count: 7, kind: "service"    },
    { label: "Bearings (preventive)", hours: 4.2,  count: 1, kind: "mechanical" },
    { label: "Sensors / electrical",  hours: 2.6,  count: 3, kind: "electrical" },
    { label: "Clutch / brake",        hours: 1.4,  count: 2, kind: "mechanical" },
    { label: "Other planned",         hours: 1.0,  count: 2, kind: "service"    },
  ],
  "VNG-MSP-01": [
    { label: "Bearings (DE)",         hours: 12.4, count: 2, kind: "mechanical" },
    { label: "Hydraulic / cooler",    hours: 8.6,  count: 3, kind: "hydraulic"  },
    { label: "Lube / re-grease",      hours: 5.2,  count: 6, kind: "service"    },
    { label: "Clutch / brake",        hours: 3.4,  count: 2, kind: "mechanical" },
    { label: "Sensors / electrical",  hours: 1.6,  count: 2, kind: "electrical" },
    { label: "Other planned",         hours: 1.2,  count: 2, kind: "service"    },
  ],
  "ESK-NC1-02": [
    { label: "Die wear / tooling",    hours: 9.6,  count: 5, kind: "tooling"    },
    { label: "Servo drive / firmware",hours: 4.4,  count: 3, kind: "electrical" },
    { label: "Lube / re-grease",      hours: 2.8,  count: 4, kind: "service"    },
    { label: "Sensors / electrical",  hours: 1.6,  count: 2, kind: "electrical" },
    { label: "Other planned",         hours: 0.8,  count: 2, kind: "service"    },
  ],
};
function _defaultPareto(press) {
  const t = press?.type || "mechanical";
  if (t === "hydraulic") return [
    { label: "Seals / cylinders",     hours: 8.2,  count: 3, kind: "hydraulic"  },
    { label: "Oil change / filter",   hours: 5.6,  count: 4, kind: "service"    },
    { label: "Cooler / fouling",      hours: 3.8,  count: 2, kind: "hydraulic"  },
    { label: "Sensors / electrical",  hours: 1.6,  count: 2, kind: "electrical" },
    { label: "Other planned",         hours: 1.2,  count: 2, kind: "service"    },
  ];
  if (t === "feeder") return [
    { label: "Rollers / pinch wear",  hours: 4.2,  count: 4, kind: "mechanical" },
    { label: "Servo & encoder",       hours: 2.6,  count: 3, kind: "electrical" },
    { label: "Lube",                  hours: 1.4,  count: 5, kind: "service"    },
    { label: "Sensors / cabling",     hours: 1.2,  count: 3, kind: "electrical" },
    { label: "Other",                 hours: 0.6,  count: 2, kind: "service"    },
  ];
  return [
    { label: "Lube / re-grease",      hours: 4.8,  count: 5, kind: "service"    },
    { label: "Bearings",              hours: 3.6,  count: 2, kind: "mechanical" },
    { label: "Sensors / electrical",  hours: 1.6,  count: 2, kind: "electrical" },
    { label: "Clutch / brake",        hours: 1.2,  count: 1, kind: "mechanical" },
    { label: "Other planned",         hours: 0.8,  count: 2, kind: "service"    },
  ];
}
window.getPareto = (pressId) => PARETO[pressId] || _defaultPareto(window.getPress(pressId));

// ───────────────────────────────────────────────────────────────────────────
// Fleet comparison — this press vs siblings of same class.
// Returns array of { id, name, value, isThis, status }
// ───────────────────────────────────────────────────────────────────────────
window.getFleetComparison = (pressId, metric = "peak") => {
  const press = window.getPress(pressId);
  if (!press) return null;
  const siblings = (window.PRESSES_ALL || []).filter(p => p.model === press.model);
  if (siblings.length < 2) {
    // Fall back to same press-type
    const sameType = (window.PRESSES_ALL || []).filter(p => p.type === press.type);
    return _buildFleetCmp(sameType, press, metric);
  }
  return _buildFleetCmp(siblings, press, metric);
};

function _buildFleetCmp(siblings, press, metric) {
  const issue = press.issue || "";
  // Map each press to a metric value
  const items = siblings.map(p => {
    let value, unit;
    if (metric === "peak") {
      const base = (p.tonnage || 50) * 0.78;
      let bump = 0;
      if (p.id === press.id && issue.includes("tonnage")) bump = base * 0.06;
      // Some siblings naturally vary
      const r = _dr(hashStr(p.id))();
      value = base + (r - 0.5) * base * 0.03 + bump;
      unit = "ton";
    } else if (metric === "vibration") {
      let base = 2.4;
      let bump = 0;
      if (p.id === press.id && issue.includes("bearing")) bump = 1.2;
      const r = _dr(hashStr(p.id) + 1)();
      value = base + (r - 0.5) * 0.6 + bump;
      unit = "mm/s";
    } else if (metric === "parallelism") {
      let base = 18;
      let bump = 0;
      if (p.id === press.id && issue.includes("guide")) bump = 24;
      const r = _dr(hashStr(p.id) + 2)();
      value = base + (r - 0.5) * 6 + bump;
      unit = "µm";
    } else {
      value = p.health || 90;
      unit = "/100";
    }
    return {
      id: p.id,
      name: p.name,
      value,
      unit,
      isThis: p.id === press.id,
      status: p.status,
      site: p.site,
    };
  });
  // Sort ascending by value for parallelism (lower=better), descending for tonnage diff
  items.sort((a, b) => a.value - b.value);
  return items;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h) % 9999;
}

// ───────────────────────────────────────────────────────────────────────────
// Hydraulic state — pressure, temperature, flow, with thresholds.
// For hydraulic-type presses; gives the "live schematic" view.
// ───────────────────────────────────────────────────────────────────────────
const HYDRAULIC_STATE = {
  "VNG-APT-400": {
    systemPressure:  { v: 248, unit: "bar", min: 200, max: 270, baseline: 245, status: "ok" },
    counterbalance:  { v: 4.1, unit: "bar", min: 3.5, max: 5.0, baseline: 4.1, status: "ok" },
    oilTemp:         { v: 52,  unit: "°C",  min: 35,  max: 65,  baseline: 50,  status: "ok" },
    returnTemp:      { v: 46,  unit: "°C",  min: 30,  max: 60,  baseline: 44,  status: "ok" },
    flowRate:        { v: 184, unit: "L/min", min: 150, max: 220, baseline: 180, status: "ok" },
    filterDelta:     { v: 0.6, unit: "bar", min: 0.0, max: 1.2, baseline: 0.4, status: "ok" },
    accumPressure:   { v: 156, unit: "bar", min: 130, max: 180, baseline: 155, status: "ok" },
    coolerOut:       { v: 38,  unit: "°C",  min: 25,  max: 50,  baseline: 36,  status: "ok" },
  },
  "VNG-APT-250": {
    systemPressure:  { v: 196, unit: "bar", min: 170, max: 220, baseline: 195, status: "ok" },
    counterbalance:  { v: 3.4, unit: "bar", min: 3.0, max: 4.0, baseline: 3.4, status: "ok" },
    oilTemp:         { v: 49,  unit: "°C",  min: 35,  max: 65,  baseline: 48,  status: "ok" },
    returnTemp:      { v: 43,  unit: "°C",  min: 30,  max: 60,  baseline: 42,  status: "ok" },
    flowRate:        { v: 152, unit: "L/min", min: 130, max: 180, baseline: 150, status: "ok" },
    filterDelta:     { v: 0.5, unit: "bar", min: 0.0, max: 1.2, baseline: 0.4, status: "ok" },
    accumPressure:   { v: 124, unit: "bar", min: 110, max: 150, baseline: 122, status: "ok" },
    coolerOut:       { v: 36,  unit: "°C",  min: 25,  max: 50,  baseline: 35,  status: "ok" },
  },
};
window.getHydraulicState = (pressId) => HYDRAULIC_STATE[pressId];

// ───────────────────────────────────────────────────────────────────────────
// Multi-signal overlay — normalized traces across last 14 days for the
// "everything-at-once" investigation overlay.
// ───────────────────────────────────────────────────────────────────────────
window.getMultiSignal = (pressId) => {
  const deck = window.getMiniDeck(pressId);
  if (!deck.length) return null;
  // Use 4 signals — the "money four"
  const picks = ["ton", "par", "vibDE", "current"];
  return deck.filter(d => picks.includes(d.key));
};

// ───────────────────────────────────────────────────────────────────────────
// Fleet-level aggregates — for the fleet overview screen.
// All respect siteFilter: "all" | "vng" | "esk"
// ───────────────────────────────────────────────────────────────────────────

function _filterPresses(siteFilter) {
  const all = window.DATA?.PRESSES || window.PRESSES_ALL || [];
  return siteFilter === "all" ? all : all.filter(p => p.site === siteFilter);
}

// 90-day fleet health history + 30-day forecast with uncertainty band
window.getFleetHealthTimeline = (siteFilter = "all") => {
  const presses = _filterPresses(siteFilter);
  const current = presses.length
    ? Math.round(presses.reduce((s, p) => s + (p.health ?? 0), 0) / presses.filter(p => p.health != null).length)
    : 91;

  const histDays = 90;
  const fcDays = 30;
  const history = [];
  const r = _dr(siteFilter === "esk" ? 42 : 17);

  // Story: stable ~93 early Q1, guide wear emerges mid-period, slight dip, recovering
  for (let i = 0; i < histDays; i++) {
    const ago = histDays - 1 - i;
    let v = siteFilter === "esk" ? 90 : 93;
    if (ago < 70 && ago > 40) v -= (70 - ago) * 0.04; // gradual decline
    if (ago < 56 && siteFilter !== "esk") v -= (56 - ago) * 0.06; // BSTA guide story
    if (ago < 28) v += (28 - ago) * 0.05; // partial recovery after re-grease
    v += (r() - 0.5) * 1.2;
    // Converge to current in last 7 days
    if (ago < 7) v = v * (ago / 7) + current * (1 - ago / 7);
    history.push(Math.round(Math.max(72, Math.min(98, v))));
  }
  history[histDays - 1] = current;

  const forecast = [];
  for (let d = 0; d <= fcDays; d++) {
    const drift = siteFilter === "esk" ? -0.04 : -0.06;
    const v = current + drift * d + (d > 14 ? -0.3 : 0);
    const spread = 1.5 + d * 0.12;
    forecast.push({ v: Math.round(v), lo: Math.round(v - spread), hi: Math.round(v + spread * 0.8) });
  }

  const events = siteFilter === "esk"
    ? [{ day: 12, label: "Recipe drift flagged" }, { day: 74, label: "Quarterly svc" }]
    : [
        { day: 0,  label: "Q1 inspection" },
        { day: 34, label: "Pilot start" },
        { day: 62, label: "Re-grease · BSTA #3" },
        { day: 82, label: "ALR-2604" },
      ];

  return { history, forecast, events, target: 90, current };
};

// Cumulative avoided downtime since pilot (step curve)
window.getAvoidedDowntime = () => {
  const { KPI } = window.DATA || {};
  const total = KPI?.avoidedDowntimeHours || 84;
  const steps = [
    { label: "Pilot start · Jan", cumulative: 0, delta: 0 },
    { label: "Bearing catch · MSP #2", cumulative: 18, delta: 18 },
    { label: "Hydraulic seal · APT-250", cumulative: 31, delta: 13 },
    { label: "Guide bushing · BSTA #3", cumulative: 52, delta: 21 },
    { label: "Die wear · NC1 #1", cumulative: 68, delta: 16 },
    { label: "Sensor drift · Feeder F-01", cumulative: total, delta: total - 68 },
  ];
  return { steps, unit: "h", savingsSEK: KPI?.avoidedSavingsSEK || 612000 };
};

// Predicted interventions stacked by severity, weekly buckets over 13 weeks
window.getPredictedInterventions = (siteFilter = "all") => {
  const forecast = (window.DATA?.FORECAST || []).filter(f => siteFilter === "all" || f.site === siteFilter);
  const weeks = [];
  for (let w = 0; w <= 12; w++) weeks.push(w === 0 ? "now" : "+" + w + "w");

  const series = { critical: [], watch: [], planned: [] };
  weeks.forEach((_, wi) => {
    let crit = 0, watch = 0, planned = 0;
    forecast.forEach(f => {
      const fw = Math.round(f.weeks);
      if (Math.abs(fw - wi) > 1 && !(wi === 0 && fw <= 1)) return;
      if (f.kind === "intervention" && f.confidence >= 0.8) crit++;
      else if (f.kind === "intervention") watch++;
      else planned++;
    });
    // Demo density — tells a forward-looking story even when filtered
    if (wi === 2) watch += siteFilter !== "esk" ? 1 : 0;
    if (wi === 3) crit += siteFilter !== "esk" ? 1 : 0;
    if (wi === 4 || wi === 5) planned += 1;
    if (wi === 6 || wi === 7) watch += 1;
    if (wi === 9) crit += siteFilter === "all" ? 1 : 0;
    if (wi === 10 || wi === 11) planned += siteFilter === "vng" || siteFilter === "all" ? 1 : 0;
    series.critical.push(crit);
    series.watch.push(watch);
    series.planned.push(planned);
  });

  return { weeks, series };
};

// Health bucket distribution — current vs 30 days ago ghost
window.getHealthDistribution = (siteFilter = "all") => {
  const presses = _filterPresses(siteFilter);
  const bucket = (list) => ({
    ok:      list.filter(p => p.status === "ok").length,
    warn:    list.filter(p => p.status === "warn").length,
    crit:    list.filter(p => p.status === "crit").length,
    unknown: list.filter(p => p.status === "unknown").length,
  });

  const now = bucket(presses);
  // Ghost: one fewer watch, one more healthy (story: fleet slightly worse)
  const ghostCounts = {
    ok: Math.min(presses.length, now.ok + (now.warn > 0 ? 1 : 0)),
    warn: Math.max(0, now.warn - (now.warn > 0 ? 1 : 0)),
    crit: now.crit,
    unknown: now.unknown,
  };

  const labels = { ok: "Healthy", warn: "Watch", crit: "Critical", unknown: "Offline" };
  const keys = ["ok", "warn", "crit", "unknown"];
  return {
    buckets: keys.map(k => ({ key: k, label: labels[k], count: now[k] })),
    ghost: keys.map(k => ({ key: k, label: labels[k], count: ghostCounts[k] })),
  };
};

// Fleet-wide issue category pareto (Q1 downtime drivers)
window.getFleetPareto = (siteFilter = "all") => {
  const items = siteFilter === "esk"
    ? [
        { label: "Die wear / tooling",     hours: 14.2, kind: "tooling" },
        { label: "Servo drive",            hours: 8.4,  kind: "electrical" },
        { label: "Guide & alignment",      hours: 6.2,  kind: "mechanical" },
        { label: "Lube / re-grease",       hours: 4.8,  kind: "service" },
        { label: "Sensors / electrical",   hours: 2.4,  kind: "electrical" },
      ]
    : siteFilter === "vng"
    ? [
        { label: "Guide & alignment",      hours: 22.6, kind: "mechanical" },
        { label: "Bearings",               hours: 16.8, kind: "mechanical" },
        { label: "Hydraulic / cooler",     hours: 11.2, kind: "hydraulic" },
        { label: "Lube / re-grease",       hours: 8.4,  kind: "service" },
        { label: "Clutch / brake",         hours: 4.6,  kind: "mechanical" },
        { label: "Sensors / electrical",   hours: 3.2,  kind: "electrical" },
      ]
    : [
        { label: "Guide & alignment",      hours: 28.8, kind: "mechanical" },
        { label: "Bearings",               hours: 21.4, kind: "mechanical" },
        { label: "Die wear / tooling",     hours: 14.2, kind: "tooling" },
        { label: "Hydraulic / cooler",     hours: 11.2, kind: "hydraulic" },
        { label: "Lube / re-grease",       hours: 9.6,  kind: "service" },
        { label: "Sensors / electrical",   hours: 5.8,  kind: "electrical" },
      ];
  return items;
};

// Fleet alarm density calendar — aggregate anomaly across all presses
window.getFleetAlarmCalendar = (siteFilter = "all") => {
  const presses = _filterPresses(siteFilter);
  const days = 91;
  const r = _dr(siteFilter === "esk" ? 88 : 55);
  const out = [];

  for (let i = 0; i < days; i++) {
    const ago = days - 1 - i;
    const dayOfWeek = i % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Base alarm density — higher on weekdays, shift patterns visible
    let anomaly = 0.08 + (r() * 0.12);
    if (isWeekend) anomaly *= 0.35;
    // Day shift heavier (hours 6–14 simulated via day position)
    if (dayOfWeek >= 0 && dayOfWeek <= 4) anomaly *= 1.15;

    // Recent uptick for demo story
    if (ago < 60 && siteFilter !== "esk") anomaly += (1 - ago / 60) * 0.35;
    if (ago < 30 && siteFilter === "esk") anomaly += (1 - ago / 30) * 0.28;

    // Spike events
    if (ago === 8 || ago === 34 || ago === 52) anomaly += 0.45;

    const cycles = Math.round(presses.length * (isWeekend ? 8000 : 42000) * (0.85 + r() * 0.3));
    const downtime = anomaly > 0.5 && r() < 0.08 ? r() * 1.8 : 0;

    out.push({ ago, dayOfWeek, cycles, anomaly: Math.min(1, anomaly), downtime });
  }
  return out;
};

// Site-level sparkline data for comparison strip
window.getSiteSparklines = () => {
  const { SITES, ALERTS } = window.DATA || {};
  if (!SITES) return [];
  return SITES.map(s => {
    const att = ALERTS.filter(a => a.status === "open" && a.site === s.id).length;
    const status = att >= 2 ? "warn" : att >= 1 ? "warn" : "ok";
    const trendKey = s.health >= 92 ? "flat" : s.health >= 88 ? "drift" : "rising";
    return { ...s, attention: att, status, trendKey };
  });
};
