// design-notes.jsx — A small disclosure that documents the design thinking,
// the IA challenge, and how to read the prototype. Accessible from the topbar.

const { useState: useStateNotes } = React;

function DesignNotes() {
  const [open, setOpen] = useStateNotes(false);
  const Ic = window.Icons;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-sm btn-ghost" title="Design notes">
        <Ic.info size={13}/> Notes
      </button>
    );
  }

  return (
    <>
      <div onClick={() => setOpen(false)} style={{position: "fixed", inset: 0, background: "rgba(20,18,14,0.32)", zIndex: 200, backdropFilter: "blur(2px)"}}/>
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: 480, maxWidth: "100vw",
        background: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        zIndex: 201,
        boxShadow: "var(--shadow-pop)",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{padding: "18px 22px", borderBottom: "1px solid var(--line)",
                       display: "flex", alignItems: "center", justifyContent: "space-between",
                       background: "var(--bg)", position: "sticky", top: 0, zIndex: 2}}>
          <div>
            <div className="eyebrow">Cadence · prototype</div>
            <div style={{fontSize: 16, fontWeight: 500, marginTop: 2}}>How to read this</div>
          </div>
          <button onClick={() => setOpen(false)} className="btn btn-sm btn-ghost"><Ic.x size={13}/></button>
        </div>

        <div style={{padding: "20px 24px", display: "flex", flexDirection: "column", gap: 22,
                       fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-1)"}}>

          <Note title="Visual language">
            <p>Industrial instrument, not SaaS dashboard. Monospace data, condensed display type, square corners, hairline rules. Status colors behave like panel lamps — saturated and precise, not soft tokens.</p>
            <p>The machine fingerprint (bar spectrum) is unique per asset ID — a visual signature woven into rows. Data ribbons wrap sparklines inline. Corner registration marks on panels reference technical drawing convention.</p>
          </Note>

          <Note title="The frame">
            <p>This is a hi-fi clickable prototype of a predictive maintenance platform. The brief asks: how do we make industrial monitoring feel calm, explainable, and useful for the technician on the floor rather than dense and engineer-built?</p>
            <p>Everything below is wired up — click into machines, alerts, alarms. Use the Tweaks panel (bottom right) to switch direction, persona, density, type, and accent.</p>
          </Note>

          <Note title="On the four-level IA — we challenged it">
            <p>The brief proposed <b>Fleet → Site → Machine → Alert</b> as a hierarchy. That's how you'd <em>browse</em>, but it's not how technicians <em>work</em>. They live in alerts: a push notification, a chat ping, an email — and they need to be <em>in</em> the alert in one click, not three.</p>
            <p>So we kept the hierarchy as the second-class browse path, and promoted the <b>Inbox</b> to first-class — sibling to Fleet rather than nested under it. Try the IA tweak in the bottom-right panel to flip between the two:</p>
            <ul style={{margin: "8px 0 0", paddingLeft: 18}}>
              <li><b>Standard</b> — Fleet is the landing. Inbox is one click away.</li>
              <li><b>Inbox-first</b> — Inbox is the landing. Fleet becomes "Browse fleet". Forecast joins as a peer.</li>
            </ul>
            <p>Our bet: technicians live in inbox-first; managers and reliability engineers tend toward standard. The product can default by role.</p>
          </Note>

          <Note title="Calm by default">
            <p>Most days, most machines are fine. The UI reflects that: muted sage for healthy, no flashing reds, fine hairline borders, generous whitespace. The "Needs attention today" list is short on purpose — when it gets long, we've failed at signal vs noise.</p>
            <p>Red is only for things that need action <em>today</em>. Warm amber for "watching." Gray ≠ green: a sensor offline is its own state.</p>
          </Note>

          <Note title="Explain, don't just display">
            <p>Every score and alert sits next to a plain-language sentence. The health "67 / 100" is meaningless on its own — it has to be paired with <em>"drive-side bearing vibration trending up, 3–5 weeks to action needed."</em></p>
            <p>The Alert detail page is where we differentiate hardest: what's happening, why we flagged it, what to do, parts you'll need, similar incidents. We treat the alert like a colleague briefing the technician, not a database record.</p>
          </Note>

          <Note title="Alarm configuration — the trust ladder">
            <p>Customers' experts trust their own rules before they trust our ML. So we built three editors graduating in skill:</p>
            <ul style={{margin: "8px 0", paddingLeft: 18}}>
              <li><b>Template</b> — pick a pattern, fill in numbers.</li>
              <li><b>Visual</b> — AND/OR conditions with drag handles.</li>
              <li><b>Expression</b> — full <span className="mono">cadence-ql</span> for the few experts.</li>
            </ul>
            <p>Every rule shows a <b>backtest</b> on past data before it goes live, plus a plain-language summary on the right. The "Describe an alarm" box uses an LLM to draft a concrete rule from natural language — but it never fires without you reading and approving it.</p>
          </Note>

          <Note title="Investigation chart concepts">
            <p>Open <b>#investigate</b> (or Machine → History) for investigation charts. Toggle <b>Overlay</b> (correlation, 3–5 signals) vs <b>Signal grid</b> (scan ~24 channels as small multiples with synchronized scrub). Time range and selected signals persist across modes.</p>
          </Note>

          <Note title="What's still placeholder">
            <p>The factory floor plan, the AI chat surface ("Ask about this machine"), and the forecast confidence bands are sketched but not wired to real data. FFT spectrogram, scatter correlation, and fleet comparison views are listed in the brief but not built in this round.</p>
          </Note>

          <Note title="Try these flows">
            <ol style={{margin: "8px 0", paddingLeft: 20, lineHeight: 1.7}}>
              <li>Fleet → click any "Needs attention" item → see the Alert detail page.</li>
              <li>Fleet → click a site in the sidebar → see the Site view; flip to <b>Floor plan</b>.</li>
              <li>Site → click any machine → Machine detail; try the tabs.</li>
              <li>Alarms → click any rule → see the editor; switch <b>Template / Visual / Expression</b>.</li>
              <li>Open the <b>Tweaks</b> panel and flip IA, persona, density, accent.</li>
              <li>Navigate to <b>#investigate</b> — chart concepts for machine investigation.</li>
            </ol>
          </Note>
        </div>
      </div>
    </>
  );
}

function Note({ title, children }) {
  return (
    <div style={{paddingBottom: 18, borderBottom: "1px solid var(--line)"}}>
      <div style={{fontSize: 14, fontWeight: 500, marginBottom: 8, color: "var(--ink)"}}>{title}</div>
      <div style={{color: "var(--ink-2)"}}>{children}</div>
    </div>
  );
}

window.DesignNotes = DesignNotes;
