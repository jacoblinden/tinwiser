// icons.jsx — Lightweight inline SVG icons. Crisp at 16px.
// All return a <svg> with currentColor; pass size via parent or style.

const Ic = ({ children, size = 16, sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Icons = {
  // Navigation
  inbox: (p) => <Ic {...p}><path d="M2 4h12v8H2z" /><path d="M2 9h3l1 1.5h4L11 9h3" /></Ic>,
  fleet: (p) => <Ic {...p}><rect x="2" y="2.5" width="5" height="5" rx="0.8" /><rect x="9" y="2.5" width="5" height="5" rx="0.8" /><rect x="2" y="9" width="5" height="4.5" rx="0.8" /><rect x="9" y="9" width="5" height="4.5" rx="0.8" /></Ic>,
  site: (p) => <Ic {...p}><path d="M2 13.5h12" /><path d="M3 13.5V7l5-3 5 3v6.5" /><path d="M6.5 13.5v-3h3v3" /></Ic>,
  machine: (p) => <Ic {...p}><rect x="2" y="5" width="12" height="7" rx="1" /><path d="M5 5V3.5M11 5V3.5M4.5 8.5h2M9.5 8.5h2" /></Ic>,
  alert: (p) => <Ic {...p}><path d="M8 2.5l6 11H2z" /><path d="M8 7v3M8 11.5v0.01" /></Ic>,
  forecast: (p) => <Ic {...p}><path d="M2 11.5l3.5-3.5L8 10.5l5-5" /><path d="M9.5 5.5h3.5v3.5" /></Ic>,
  alarms: (p) => <Ic {...p}><path d="M4 11.5h8" /><path d="M5 11.5V8a3 3 0 016 0v3.5" /><path d="M7 13h2" /><path d="M2.5 5l2-1.5M13.5 5l-2-1.5" /></Ic>,
  reports: (p) => <Ic {...p}><rect x="3" y="2.5" width="10" height="11" rx="1" /><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" /></Ic>,
  cog: (p) => <Ic {...p}><circle cx="8" cy="8" r="2" /><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" /></Ic>,
  users: (p) => <Ic {...p}><circle cx="6" cy="6" r="2.2" /><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" /><path d="M10 6.5a2 2 0 011 3.8" /><path d="M14 13c0-2-1.4-3.5-3.2-3.9" /></Ic>,

  // Common UI
  search: (p) => <Ic {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></Ic>,
  plus: (p) => <Ic {...p}><path d="M8 3v10M3 8h10" /></Ic>,
  filter: (p) => <Ic {...p}><path d="M2 3.5h12L9.5 9v3.5L6.5 14V9z" /></Ic>,
  more: (p) => <Ic {...p}><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="8" r="1" fill="currentColor" stroke="none" /></Ic>,
  chevR: (p) => <Ic {...p}><path d="M6 3l5 5-5 5" /></Ic>,
  chevD: (p) => <Ic {...p}><path d="M3 6l5 5 5-5" /></Ic>,
  chevL: (p) => <Ic {...p}><path d="M10 3L5 8l5 5" /></Ic>,
  chevU: (p) => <Ic {...p}><path d="M3 10l5-5 5 5" /></Ic>,
  ext: (p) => <Ic {...p}><path d="M6 3H3v10h10v-3" /><path d="M9 3h4v4M13 3l-6 6" /></Ic>,
  check: (p) => <Ic {...p}><path d="M3 8.5L6.5 12 13 4.5" /></Ic>,
  x: (p) => <Ic {...p}><path d="M4 4l8 8M12 4l-8 8" /></Ic>,
  bell: (p) => <Ic {...p}><path d="M4 11V8a4 4 0 018 0v3l1 1.5H3z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></Ic>,
  map: (p) => <Ic {...p}><path d="M2 4l4-1.5 4 1.5 4-1.5v9L10 13l-4-1.5L2 13z" /><path d="M6 2.5v9M10 4v9" /></Ic>,
  list: (p) => <Ic {...p}><path d="M3 4.5h10M3 8h10M3 11.5h10" /></Ic>,
  menu: (p) => <Ic {...p}><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></Ic>,
  grid: (p) => <Ic {...p}><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5" /><rect x="9" y="2.5" width="4.5" height="4.5" rx="0.5" /><rect x="2.5" y="9" width="4.5" height="4.5" rx="0.5" /><rect x="9" y="9" width="4.5" height="4.5" rx="0.5" /></Ic>,
  clock: (p) => <Ic {...p}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></Ic>,
  trend: (p) => <Ic {...p}><path d="M2 11l3.5-3.5L8 10l5-5" /><path d="M9.5 5h3.5v3.5" /></Ic>,
  trendDown: (p) => <Ic {...p}><path d="M2 5l3.5 3.5L8 6l5 5" /><path d="M9.5 11h3.5V7.5" /></Ic>,
  wrench: (p) => <Ic {...p}><path d="M10.5 5a2.5 2.5 0 11-2.5 2.5L3 12.5V14h1.5L9 9.5a2.5 2.5 0 001.5-4.5z" /></Ic>,
  doc: (p) => <Ic {...p}><path d="M3 2.5h6L13 6v7.5H3z" /><path d="M9 2.5V6h4" /></Ic>,
  user: (p) => <Ic {...p}><circle cx="8" cy="6" r="2.5" /><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" /></Ic>,
  sparkle: (p) => <Ic {...p}><path d="M8 2l1.2 3.3L12.5 6.5l-3.3 1.2L8 11l-1.2-3.3L3.5 6.5l3.3-1.2z" /></Ic>,
  brain: (p) => <Ic {...p}><path d="M6 13.5a2 2 0 01-2-2v-1a2 2 0 01-1-1.7v-1a2 2 0 011-1.7v-1a2 2 0 012-2h.5v10.4z" /><path d="M10 13.5a2 2 0 002-2v-1a2 2 0 001-1.7v-1a2 2 0 00-1-1.7v-1a2 2 0 00-2-2H9.5v10.4z" /></Ic>,
  vibration: (p) => <Ic {...p}><path d="M2 8h1.5L5 5l2 6 2-8 2 8 2-3h1" /></Ic>,
  temp: (p) => <Ic {...p}><path d="M9 8.5V3a1.5 1.5 0 00-3 0v5.5a3 3 0 103 0z" /></Ic>,
  current: (p) => <Ic {...p}><path d="M8 2L4 9h3l-1 5 5-8H8z" /></Ic>,
  cycle: (p) => <Ic {...p}><path d="M2.5 8a5.5 5.5 0 019.7-3.5" /><path d="M13.5 8a5.5 5.5 0 01-9.7 3.5" /><path d="M11.5 2v3h-3M4.5 14v-3h3" /></Ic>,
  pause: (p) => <Ic {...p}><rect x="4.5" y="3" width="2" height="10" rx="0.4" fill="currentColor" stroke="none" /><rect x="9.5" y="3" width="2" height="10" rx="0.4" fill="currentColor" stroke="none" /></Ic>,
  play: (p) => <Ic {...p}><path d="M4 3l9 5-9 5z" fill="currentColor" /></Ic>,
  drag: (p) => <Ic {...p}><circle cx="6" cy="4" r="0.8" fill="currentColor" stroke="none" /><circle cx="10" cy="4" r="0.8" fill="currentColor" stroke="none" /><circle cx="6" cy="8" r="0.8" fill="currentColor" stroke="none" /><circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none" /><circle cx="6" cy="12" r="0.8" fill="currentColor" stroke="none" /><circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" /></Ic>,
  calendar: (p) => <Ic {...p}><rect x="2.5" y="3.5" width="11" height="10" rx="1" /><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" /></Ic>,
  info: (p) => <Ic {...p}><circle cx="8" cy="8" r="5.5" /><path d="M8 7v3.5M8 5v0.01" /></Ic>,
};

window.Icons = Icons;
