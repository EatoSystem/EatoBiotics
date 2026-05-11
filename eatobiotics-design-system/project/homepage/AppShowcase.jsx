// App showcase — phone mockup beside 4-step "how it works"
function AppShowcase() {
  const steps = [
    { n: '01', t: 'Assess', d: '15 questions across 5 pillars. Three minutes, no card.' },
    { n: '02', t: 'Score', d: 'Your Biotics Score across diversity, feeding, live foods, consistency, feeling.' },
    { n: '03', t: 'Log', d: 'Snap a plate. Get instant feedback on what you fed, added, and produced.' },
    { n: '04', t: 'Improve', d: 'Weekly check-ins. Watch your score climb as your system compounds.' }
  ];

  return (
    <section id="app" style={{
      padding: '120px 32px',
      background: '#1A2E12',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* subtle gradient orb */}
      <div aria-hidden style={{
        position: 'absolute', top: -200, right: -100,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,224,99,0.12), transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '0.85fr 1fr', gap: 80,
        alignItems: 'center', position: 'relative'
      }}>
        {/* LEFT — Phone mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 300, aspectRatio: '9 / 19',
            background: '#0A1A06',
            borderRadius: 42,
            padding: 10,
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)',
            position: 'relative'
          }}>
            {/* notch */}
            <div style={{
              position: 'absolute', top: 14, left: '50%',
              transform: 'translateX(-50%)',
              width: 88, height: 22, borderRadius: 9999,
              background: '#000', zIndex: 2
            }} />
            <div style={{
              width: '100%', height: '100%',
              borderRadius: 34,
              background: '#fff',
              overflow: 'hidden',
              padding: '46px 18px 18px',
              display: 'flex', flexDirection: 'column'
            }}>
              {/* App header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5A6E50', textTransform: 'uppercase' }}>Wednesday</p>
                  <p style={{ margin: '2px 0 0', fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: '#1A2E12' }}>Hey, Jason</p>
                </div>
                <img src="assets/eatobiotics-icon.webp" alt="" style={{ width: 26, height: 26 }} />
              </div>

              {/* Score ring card */}
              <div style={{
                background: '#fff',
                border: '1px solid #E5E5E5',
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                  <svg viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0 }}>
                    <defs>
                      <linearGradient id="scoreG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#A8E063" />
                        <stop offset="50%" stopColor="#4CB648" />
                        <stop offset="100%" stopColor="#2DAA6E" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#F0F0F0" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="url(#scoreG)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${0.78 * 163} 163`} transform="rotate(-90 32 32)" />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18, color: '#1A2E12'
                  }}>78</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#4CB648', textTransform: 'uppercase' }}>Biotics Score</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#1A2E12', fontWeight: 600 }}>+12 this month</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#5A6E50' }}>Diversity is climbing</p>
                </div>
              </div>

              {/* Today's plate */}
              <p style={{ margin: '4px 0 8px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5A6E50', textTransform: 'uppercase' }}>Today's plate</p>
              {[
                { c: '#A8E063', l: 'Prebiotic', f: 'Oats, leeks, asparagus', d: '5 plants' },
                { c: '#2DAA6E', l: 'Probiotic', f: 'Kefir, kimchi', d: 'Live cultures' },
                { c: '#F5C518', l: 'Protein', f: 'Wild salmon', d: '32g' }
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: '#F9FAF7',
                  borderRadius: 12,
                  marginBottom: 6
                }}>
                  <span style={{ width: 6, height: 26, borderRadius: 9999, background: m.c, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: m.c, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.l}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: '#1A2E12', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.f}</p>
                  </div>
                  <span style={{ fontSize: 9.5, color: '#5A6E50' }}>{m.d}</span>
                </div>
              ))}

              {/* CTA */}
              <button style={{
                marginTop: 'auto',
                padding: '11px',
                borderRadius: 9999,
                background: GRADIENT,
                color: '#fff', fontWeight: 600, fontSize: 12,
                border: 'none'
              }}>Log a meal +</button>
            </div>
          </div>
        </div>

        {/* RIGHT — copy + steps */}
        <div>
          <p style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#A8E063', margin: 0
          }}>The platform</p>
          <h2 style={{
            fontFamily: "'Lora', serif", fontWeight: 600,
            fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#fff',
            margin: '14px 0 0'
          }}>
            Assess. Score. Log.{' '}
            <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Improve.
            </span>
          </h2>
          <p style={{
            fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)',
            margin: '22px 0 0', maxWidth: 460
          }}>
            Your microbiome runs on consistency. The app gives you a number to move and a plate to repeat — quietly compounding, week over week.
          </p>

          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {steps.map(s => (
              <div key={s.n} style={{
                padding: '20px 22px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16
              }}>
                <p style={{
                  margin: 0, fontFamily: "'Lora', serif", fontWeight: 600,
                  fontSize: 30, color: '#A8E063', lineHeight: 1
                }}>{s.n}</p>
                <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.t}</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <a href="#" style={{
              padding: '12px 22px', borderRadius: 9999,
              background: GRADIENT, color: '#fff', fontWeight: 600, fontSize: 14,
              textDecoration: 'none'
            }}>Download for iOS</a>
            <a href="#" style={{
              padding: '12px 22px', borderRadius: 9999,
              background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 14,
              border: '1.5px solid rgba(255,255,255,0.25)',
              textDecoration: 'none'
            }}>Get on Android</a>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { AppShowcase });
