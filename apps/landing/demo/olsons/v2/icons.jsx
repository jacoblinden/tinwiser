// icons.jsx — Inline SVG icons. Crisp at 14–16 px. All currentColor.

const Ic = ({ children, size = 16, sw = 1.5, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    {children}
  </svg>
);

const Icons = {
  // ─── Navigation ─────────────────────────────────────────────
  fleet: (p) => <Ic {...p}><rect x="2" y="2.5" width="5" height="5" rx="0.5" /><rect x="9" y="2.5" width="5" height="5" rx="0.5" /><rect x="2" y="9" width="5" height="4.5" rx="0.5" /><rect x="9" y="9" width="5" height="4.5" rx="0.5" /></Ic>,
  press: (p) => <Ic {...p}>
    <path d="M3 2.5h10"/>
    <path d="M5 2.5v3.5l-1 1.5v2h8V7.5l-1-1.5V2.5"/>
    <path d="M3 12h10"/>
    <path d="M4 13.5l0.6-1.5M11.4 12L12 13.5"/>
  </Ic>,
  alert: (p) => <Ic {...p}><path d="M8 2.5l6 11H2z" /><path d="M8 7v3M8 11.5v0.01" /></Ic>,
  calendar: (p) => <Ic {...p}><rect x="2.5" y="3.5" width="11" height="10" rx="0.5" /><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" /></Ic>,
  technician: (p) => <Ic {...p}><circle cx="8" cy="5" r="2"/><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M11 13l1.5-1.5L11 10"/></Ic>,
  workshop: (p) => <Ic {...p}><path d="M2 13.5h12"/><path d="M3 13.5V7l5-3 5 3v6.5"/><path d="M6 13.5v-3.5h4v3.5"/></Ic>,
  system: (p) => <Ic {...p}><circle cx="8" cy="8" r="1.5"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2"/><circle cx="8" cy="8" r="4" strokeDasharray="2 2"/></Ic>,

  // ─── UI ─────────────────────────────────────────────────────
  search: (p) => <Ic {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></Ic>,
  plus: (p) => <Ic {...p}><path d="M8 3v10M3 8h10" /></Ic>,
  filter: (p) => <Ic {...p}><path d="M2 3.5h12L9.5 9v3.5L6.5 14V9z" /></Ic>,
  more: (p) => <Ic {...p}><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="8" r="1" fill="currentColor" stroke="none" /></Ic>,
  chevR: (p) => <Ic {...p}><path d="M6 3l5 5-5 5" /></Ic>,
  chevL: (p) => <Ic {...p}><path d="M10 3L5 8l5 5" /></Ic>,
  chevD: (p) => <Ic {...p}><path d="M3 6l5 5 5-5" /></Ic>,
  chevU: (p) => <Ic {...p}><path d="M3 10l5-5 5 5" /></Ic>,
  check: (p) => <Ic {...p}><path d="M3 8.5L6.5 12 13 4.5" /></Ic>,
  x: (p) => <Ic {...p}><path d="M4 4l8 8M12 4l-8 8" /></Ic>,
  bell: (p) => <Ic {...p}><path d="M4 11V8a4 4 0 018 0v3l1 1.5H3z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></Ic>,
  doc: (p) => <Ic {...p}><path d="M3 2.5h6L13 6v7.5H3z" /><path d="M9 2.5V6h4" /></Ic>,
  list: (p) => <Ic {...p}><path d="M3 4.5h10M3 8h10M3 11.5h10"/></Ic>,
  grid: (p) => <Ic {...p}><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.3"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="0.3"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="0.3"/><rect x="9" y="9" width="4.5" height="4.5" rx="0.3"/></Ic>,
  map: (p) => <Ic {...p}><path d="M2 4l4-1.5 4 1.5 4-1.5v9L10 13l-4-1.5L2 13z"/><path d="M6 2.5v9M10 4v9"/></Ic>,
  clock: (p) => <Ic {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></Ic>,
  wrench: (p) => <Ic {...p}><path d="M10.5 5a2.5 2.5 0 11-2.5 2.5L3 12.5V14h1.5L9 9.5a2.5 2.5 0 001.5-4.5z" /></Ic>,
  phone: (p) => <Ic {...p}><path d="M3 4c0-0.6 0.4-1.5 1-1.5h1.5c0.4 0 0.7 0.3 0.8 0.6L7 5c0.1 0.4-0.1 0.7-0.4 1L5.5 6.6c0.6 1.6 1.8 2.8 3.4 3.4L9.6 9c0.3-0.3 0.6-0.5 1-0.4l1.9 0.7c0.3 0.1 0.6 0.4 0.6 0.8V11.5C13 12.5 12 13 11.5 13H10C5.8 13 3 10.2 3 6V4z"/></Ic>,
  pin: (p) => <Ic {...p}><path d="M8 14s-5-5.2-5-8.5a5 5 0 0110 0C13 8.8 8 14 8 14z"/><circle cx="8" cy="5.5" r="1.8"/></Ic>,
  route: (p) => <Ic {...p}><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M4 5.5v3c0 1.5 1 2.5 2.5 2.5H8M12 10.5v-3c0-1.5-1-2.5-2.5-2.5H8"/></Ic>,
  sparkle: (p) => <Ic {...p}><path d="M8 2l1.2 3.3L12.5 6.5l-3.3 1.2L8 11l-1.2-3.3L3.5 6.5l3.3-1.2z"/></Ic>,
  arrowR: (p) => <Ic {...p}><path d="M3 8h10M9 4l4 4-4 4"/></Ic>,
  arrowD: (p) => <Ic {...p}><path d="M8 3v10M4 9l4 4 4-4"/></Ic>,
  arrowUp: (p) => <Ic {...p}><path d="M8 3v10M4 7l4-4 4 4"/></Ic>,
  download: (p) => <Ic {...p}><path d="M8 2v8M4 7l4 4 4-4M3 13.5h10"/></Ic>,
  share: (p) => <Ic {...p}><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M5.5 7.2l5-2.5M5.5 8.8l5 2.5"/></Ic>,

  // ─── Press-specific signal pictograms ───────────────────────
  force:    (p) => <Ic {...p}><path d="M2 13h12"/><path d="M2 13c2-1 3-2 4-7s2-2 4 0 1 5 4 6"/></Ic>,
  stroke:   (p) => <Ic {...p}><path d="M5 3v10M11 3v10"/><path d="M5 4.5l3 1 3-1M5 8l3 1 3-1M5 11.5l3 1 3-1"/></Ic>,
  cycle:    (p) => <Ic {...p}><path d="M2.5 8a5.5 5.5 0 019.7-3.5"/><path d="M13.5 8a5.5 5.5 0 01-9.7 3.5"/><path d="M11.5 2v3h-3M4.5 14v-3h3"/></Ic>,
  vib:      (p) => <Ic {...p}><path d="M2 8h1.5L5 5l2 6 2-8 2 8 2-3h1"/></Ic>,
  temp:     (p) => <Ic {...p}><path d="M9 8.5V3a1.5 1.5 0 00-3 0v5.5a3 3 0 103 0z"/></Ic>,
  current:  (p) => <Ic {...p}><path d="M8 2L4 9h3l-1 5 5-8H8z"/></Ic>,
  pressure: (p) => <Ic {...p}><circle cx="8" cy="9" r="5"/><path d="M8 9l3-3M5.5 5L4 3.5M10.5 5L12 3.5M3 9h-0.5M13 9h0.5"/></Ic>,

  // ─── Severity / status ──────────────────────────────────────
  warning:  (p) => <Ic {...p}><path d="M8 2.5l6 11H2z"/><path d="M8 7v3M8 11.5v0.01"/></Ic>,
  info:     (p) => <Ic {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 7v3.5M8 5v0.01"/></Ic>,

  // ─── Mechanical pictograms ──────────────────────────────────
  feeder:   (p) => <Ic {...p}><circle cx="4" cy="8" r="2"/><circle cx="12" cy="8" r="2"/><path d="M6 8h4"/><path d="M3 4h2M11 4h2M3 12h2M11 12h2"/></Ic>,
  servo:    (p) => <Ic {...p}><rect x="3" y="5" width="10" height="6" rx="0.5"/><path d="M5 5V3.5M11 5V3.5M5 11v1.5M11 11v1.5M6 8h4"/></Ic>,
  hydraulic:(p) => <Ic {...p}><rect x="4" y="3" width="8" height="2"/><rect x="6" y="5" width="4" height="4"/><rect x="4" y="9" width="8" height="2"/><path d="M5 11v2.5M11 11v2.5"/></Ic>,
  mech:     (p) => <Ic {...p}><circle cx="8" cy="6" r="2.5"/><path d="M8 6L8 13.5"/><rect x="5" y="11.5" width="6" height="2"/></Ic>,
  fineblank:(p) => <Ic {...p}><rect x="3" y="3" width="10" height="2.5"/><path d="M5 5.5v2l-1 1.5V11h8V9l-1-1.5v-2"/><path d="M3 13h10"/><circle cx="8" cy="13" r="0.5" fill="currentColor"/></Ic>,
};

window.Icons = Icons;
