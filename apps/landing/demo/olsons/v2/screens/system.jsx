// system.jsx — A short systems-level moment.
// Typography, color, key components — enough to show the system.

function SystemScreen({ go }) {
  return (
    <div className="page-body fade-in" style={{maxWidth: 1100}}>

      <div className="page-h page-h-quiet">
        <div>
          <p className="page-greeting">Design system</p>
          <p className="page-title page-title-lg">The instrument language behind every screen.</p>
          <p className="page-sub" style={{marginTop: 6}}>
            Five surfaces, one system. Quiet by default. Status colors used like instrument lights, not UI tokens.
          </p>
        </div>
      </div>

      {/* ─── Type ─────────────────────────────────────────────── */}
      <section className="section">
        <window.SectionH title="Typography" sub="Two faces. One for prose, one for measurement."/>
        <div className="card" style={{padding: 24}}>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28}}>
            <div>
              <div className="eyebrow" style={{marginBottom: 12}}>Sans — Geist</div>
              <div style={{fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)"}}>Aa</div>
              <div style={{marginTop: 18, display: "flex", flexDirection: "column", gap: 10}}>
                <TypeRow size={28} weight={600} ls="-0.025em" label="Title — 28 · 600">Operating normally.</TypeRow>
                <TypeRow size={18} weight={600} ls="-0.02em" label="Section title — 18 · 600">Press signature</TypeRow>
                <TypeRow size={14} weight={500} ls="-0.005em" label="Body lead — 14 · 500">Predicted intervention in 3–4 weeks.</TypeRow>
                <TypeRow size={13} weight={400} label="Body — 13 · 400">
                  Velocity RMS on the drive-end bearing has climbed from 2.8 to 3.6 mm/s over 14 days.
                </TypeRow>
                <TypeRow size={11} weight={500} label="Eyebrow — 11 · 500 · 0.06em" ls="0.06em" upper>Recommended actions</TypeRow>
              </div>
            </div>

            <div>
              <div className="eyebrow" style={{marginBottom: 12}}>Mono — Geist Mono</div>
              <div className="mono" style={{fontSize: 36, fontWeight: 450, letterSpacing: "-0.03em", color: "var(--ink)"}}>Aa</div>
              <div style={{marginTop: 18, display: "flex", flexDirection: "column", gap: 10}}>
                <TypeRow mono size={40} weight={450} ls="-0.03em" label="Mega metric — 40 · 450">71<span style={{fontSize: 14, color: "var(--ink-4)", marginLeft: 4}}>/100</span></TypeRow>
                <TypeRow mono size={28} weight={450} ls="-0.025em" label="Cluster value — 28 · 450">3.6 mm/s</TypeRow>
                <TypeRow mono size={13} weight={500} label="Tabular ID — 13 · 500">VNG-BSTA-03</TypeRow>
                <TypeRow mono size={11} weight={500} label="Eyebrow mono — 11">live · 2s</TypeRow>
                <div style={{padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line)",
                              fontSize: 11, color: "var(--ink-3)", lineHeight: 1.6}}>
                  Used only for: numbers (tabular), IDs, timestamps, instrument labels.
                  Never as body text — never as headlines.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Color ────────────────────────────────────────────── */}
      <section className="section">
        <window.SectionH title="Color" sub="Warm paper, charcoal ink. Status colors used sparingly — instrument indicators."/>

        <div className="card" style={{padding: 24}}>
          <div className="eyebrow" style={{marginBottom: 12}}>Surfaces & ink</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28}}>
            <Swatch name="paper" varName="--bg" sample/>
            <Swatch name="surface" varName="--surface" sample/>
            <Swatch name="surface-2" varName="--surface-2" sample/>
            <Swatch name="line" varName="--line" sample/>
            <Swatch name="line-strong" varName="--line-strong" sample/>
          </div>

          <div className="eyebrow" style={{marginBottom: 12}}>Ink ladder</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28}}>
            {["--ink", "--ink-1", "--ink-2", "--ink-3", "--ink-4", "--ink-5"].map((v) => (
              <Swatch key={v} name={v.replace("--", "")} varName={v} on="dark"/>
            ))}
          </div>

          <div className="eyebrow" style={{marginBottom: 12}}>Status — instrument indicators</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12}}>
            <Swatch name="ok"        varName="--ok" labelExtra="Healthy"/>
            <Swatch name="warn"      varName="--warn" labelExtra="Watch"/>
            <Swatch name="crit"      varName="--crit" labelExtra="Critical"/>
            <Swatch name="forecast"  varName="--forecast" labelExtra="Predicted"/>
            <Swatch name="olsons"    varName="--olsons" labelExtra="Olsons accent"/>
          </div>

          <div className="olsons-strip" style={{marginTop: 22}}>
            <div className="mark">OL</div>
            <div style={{fontSize: 13, color: "var(--ink-1)", lineHeight: 1.5}}>
              <b className="t-olsons">Olsons accent</b> appears only at relationship moments — the next visit card, the technician schedule, the "Schedule with Olsons" button. Never as a primary UI color.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Key components ───────────────────────────────────── */}
      <section className="section">
        <window.SectionH title="Key components" sub="The pieces every screen is built from."/>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
          {/* Health score */}
          <CompCard title="Health score">
            <div style={{display: "flex", alignItems: "center", gap: 22}}>
              <div>
                <div className="data-mega" style={{color: "var(--warn)"}}>71<span style={{fontSize: 14, color: "var(--ink-4)"}}>/100</span></div>
                <div style={{marginTop: 8, width: 110}}><window.HealthBar value={71} status="warn"/></div>
              </div>
              <div style={{minWidth: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5}}>
                Numeric score paired with status. Always paired with plain-language reasoning — never alone.
              </div>
            </div>
          </CompCard>

          {/* Status tag */}
          <CompCard title="Status tags">
            <div style={{display: "flex", gap: 18, flexWrap: "wrap"}}>
              <window.StatusTag status="ok"/>
              <window.StatusTag status="warn"/>
              <window.StatusTag status="crit"/>
              <window.StatusTag status="unknown"/>
              <span className="tag tag-forecast">Predicted</span>
            </div>
            <div style={{marginTop: 14, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5}}>
              A dot, a word. Never a full background fill.
            </div>
          </CompCard>

          {/* Sparkline */}
          <CompCard title="Sparkline">
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12}}>
              {[
                { shape: "flat",    status: "ok",   label: "flat" },
                { shape: "drift",   status: "warn", label: "drift" },
                { shape: "rising",  status: "warn", label: "rising" },
                { shape: "stepped", status: "warn", label: "step" },
                { shape: "spike",   status: "crit", label: "spike" },
                { shape: "offline", status: "unknown", label: "offline" },
              ].map((s, i) => (
                <div key={i} style={{padding: 10, border: "1px solid var(--line)"}}>
                  <div className="eyebrow-mono" style={{marginBottom: 6}}>{s.label}</div>
                  <window.MiniSpark shape={s.shape} status={s.status} w={120} h={28}/>
                </div>
              ))}
            </div>
          </CompCard>

          {/* Press row */}
          <CompCard title="Press row">
            <div style={{border: "1px solid var(--line)"}}>
              {window.DATA.PRESSES.slice(0, 3).map((p) => (
                <div key={p.id} style={{display: "grid",
                                           gridTemplateColumns: "1fr auto auto",
                                           gap: 12, padding: "10px 14px",
                                           alignItems: "center", borderBottom: "1px solid var(--line)", fontSize: 12.5}}>
                  <div style={{display: "flex", alignItems: "center", gap: 10, minWidth: 0}}>
                    <window.PressIcon type={p.type} size={14}/>
                    <div style={{minWidth: 0}}>
                      <div style={{fontWeight: 500}}>{p.name}</div>
                      <div className="mono" style={{fontSize: 10.5, color: "var(--ink-4)"}}>{p.id}</div>
                    </div>
                  </div>
                  <window.StatusTag status={p.status}/>
                  <window.MiniSpark shape={p.trendKey} status={p.status} w={56} h={16}/>
                </div>
              ))}
            </div>
          </CompCard>

          {/* Alert card */}
          <CompCard title="Recommendation card">
            <div className="insight" style={{cursor: "default", padding: "12px 14px"}}>
              <div className="insight-bullet"><span className="dot warn"/></div>
              <div className="insight-body">
                <p className="insight-title" style={{fontSize: 13}}>
                  BSTA-50 #3 is showing slow drift in slide parallelism — <em>3–4 weeks to action</em>.
                </p>
                <div className="insight-meta">
                  <span className="b">BSTA-50 #3</span>
                  <span className="mono">VNG-BSTA-03</span>
                  <span className="sep-dot">·</span>
                  <span>81% conf</span>
                </div>
              </div>
            </div>
          </CompCard>

          {/* Olsons strip */}
          <CompCard title="Olsons relationship strip">
            <window.OlsonsStrip>
              <b>Schedule with Olsons</b> — used at every moment where the predictive layer fuses with the service relationship: alerts, plan, technician dispatch.
            </window.OlsonsStrip>
          </CompCard>

          {/* Force curve mini */}
          <CompCard title="Force curve · canonical press visualization" wide>
            <div style={{padding: 0, margin: "0 -14px -8px"}}>
              <window.ForceCurveChart pressId="VNG-BSTA-03" status="warn" height={220} compact/>
            </div>
            <div style={{fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5, marginTop: 12}}>
              Tonnage × crank angle. Ghost cycles in faint ink, current cycle solid, baseline dashed, annotations for BDC and peak. Anti-aliased lines, calibrated axes, monospace numbers.
            </div>
          </CompCard>
        </div>
      </section>

      {/* ─── Voice ────────────────────────────────────────────── */}
      <section className="section">
        <window.SectionH title="Voice" sub="How the product writes."/>
        <div className="card" style={{padding: 22}}>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28}}>
            <div>
              <div className="eyebrow t-ok" style={{marginBottom: 10}}>Do</div>
              <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-1)", lineHeight: 1.7}}>
                <li>"Slide parallelism drifting — <em>3 µm/week for 8 weeks.</em>"</li>
                <li>"Predicted intervention in <em>3–4 weeks</em>."</li>
                <li>"81% confidence. Pattern matches 18 prior cases."</li>
                <li>"We can't tell — sensor offline since 06:42."</li>
              </ul>
            </div>
            <div>
              <div className="eyebrow t-crit" style={{marginBottom: 10}}>Don't</div>
              <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7}}>
                <li>"Health: 71." (Numbers without reasoning.)</li>
                <li>"Issue detected." (Vague urgency.)</li>
                <li>"AI says…" (We say. The model is a tool.)</li>
                <li>"Looks great today!" (No tonal warmth.)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TypeRow({ size, weight, ls, label, children, mono, upper }) {
  return (
    <div style={{display: "grid", gridTemplateColumns: "1fr 130px", gap: 14, alignItems: "baseline",
                  paddingBottom: 8, borderBottom: "1px solid var(--line)"}}>
      <div style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: size, fontWeight: weight,
        letterSpacing: ls,
        textTransform: upper ? "uppercase" : "none",
        color: "var(--ink)",
        minWidth: 0,
      }}>{children}</div>
      <div className="eyebrow-mono" style={{textAlign: "right"}}>{label}</div>
    </div>
  );
}

function Swatch({ name, varName, sample, on, labelExtra }) {
  return (
    <div>
      <div style={{
        height: 50,
        background: `var(${varName})`,
        border: "1px solid var(--line)",
        marginBottom: 6,
      }}/>
      <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6}}>
        <span className="mono" style={{fontSize: 11, color: "var(--ink-2)"}}>{name}</span>
      </div>
      {labelExtra && <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 2}}>{labelExtra}</div>}
    </div>
  );
}

function CompCard({ title, children, wide }) {
  return (
    <div className="card" style={{padding: 18, gridColumn: wide ? "span 2" : "auto"}}>
      <div className="eyebrow" style={{marginBottom: 14}}>{title}</div>
      {children}
    </div>
  );
}

window.SystemScreen = SystemScreen;
