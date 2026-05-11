// Manifesto, Book, Tiers, Footer
function Manifesto() {
  return (
    <section id="manifesto" style={{
      padding: '140px 32px',
      background: '#0F1F08',
      textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168,224,99,0.10), transparent 50%), radial-gradient(circle at 80% 80%, rgba(245,166,35,0.08), transparent 50%)',
        pointerEvents: 'none'
      }} />
      <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative' }}>
        <p style={{
          fontSize: 11.5, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#A8E063', margin: 0
        }}>The Mission</p>
        <h2 style={{
          fontFamily: "'Lora', serif", fontWeight: 600,
          fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#fff',
          margin: '24px 0 0'
        }}>
          <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Build the food system inside you
          </span>
          {' '}— and help build the food system around you.
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 18, lineHeight: 1.6,
          maxWidth: 600, margin: '32px auto 0'
        }}>
          From plate to planet. EatoBiotics is the inside layer of the EatoSystem — food as the operating system for human and planetary health.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 }}>
          {['#A8E063', '#4CB648', '#2DAA6E', '#F5C518', '#F5A623'].map(c => (
            <span key={c} style={{ width: 64, height: 8, borderRadius: 9999, background: c }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BookFeature() {
  return (
    <section id="thebook" style={{ padding: '120px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <p style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#4CB648', margin: 0
          }}>The Book</p>
          <h2 style={{
            fontFamily: "'Lora', serif", fontWeight: 600,
            fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#1A2E12',
            margin: '14px 0 0'
          }}>
            The Food System Inside You.<br/>
            <span style={{ fontStyle: 'italic', color: '#5A6E50', fontWeight: 500 }}>A practical guide.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#5A6E50', margin: '22px 0 0', maxWidth: 480 }}>
            Twenty-five chapters on the microbiome, the three biotics, and the daily practice of building a food system that compounds. Practical, optimistic, no doctorate required.
          </p>
          <div style={{
            marginTop: 28,
            display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 28,
            paddingTop: 24, borderTop: '1px solid #E5E5E5',
            justifyContent: 'start'
          }}>
            {[
              { n: '25', l: 'Chapters' },
              { n: '7×10"', l: 'Trim size' },
              { n: '320', l: 'Pages' }
            ].map(s => (
              <div key={s.l}>
                <p style={{ margin: 0, fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 28, color: '#1A2E12', letterSpacing: '-0.01em' }}>{s.n}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5A6E50', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{s.l}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#" style={{
              padding: '14px 24px', borderRadius: 9999, background: GRADIENT,
              color: '#fff', fontWeight: 600, fontSize: 14.5, textDecoration: 'none',
              boxShadow: '0 12px 32px -10px rgba(76,182,72,0.5)'
            }}>Pre-order the book</a>
            <a href="#" style={{
              padding: '14px 24px', borderRadius: 9999, background: '#fff',
              color: '#1A2E12', fontWeight: 600, fontSize: 14.5, textDecoration: 'none',
              border: '1.5px solid #E5E5E5'
            }}>Read chapter one</a>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '78%',
            aspectRatio: '7 / 10',
            background: '#F7F7F7',
            borderRadius: '4px 18px 18px 4px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px -20px rgba(26,46,18,0.28), -2px 0 0 rgba(26,46,18,0.08)',
            position: 'relative',
            transform: 'rotate(-1.5deg)'
          }}>
            <img src="assets/book-cover.png" alt="The Food System Inside You — book cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* small biotic pills floating */}
          <div style={{
            position: 'absolute', bottom: 30, right: 20,
            background: '#fff', borderRadius: 14, padding: '10px 14px',
            border: '1px solid #E5E5E5',
            boxShadow: '0 12px 28px -10px rgba(26,46,18,0.18)',
            transform: 'rotate(2deg)'
          }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: '#4CB648', textTransform: 'uppercase' }}>Chapter 03</p>
            <p style={{ margin: '4px 0 0', fontFamily: "'Lora', serif", fontSize: 14, color: '#1A2E12', fontStyle: 'italic' }}>Feed. Add. Produce.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tiers() {
  const tiers = [
    { l: 'FREE', p: 'Free', desc: 'Get your Biotics Score',
      f: ['Biotics Score assessment', 'Basic plate guide', 'Food library access'],
      grad: 'linear-gradient(135deg, #A8E063, #4CB648)', cta: 'Start free', accent: '#4CB648' },
    { l: 'GROW', p: '€9.99', sub: 'per month', desc: 'Build your daily practice',
      f: ['Daily plate logging', 'Streak tracking & insights', 'Weekly check-ins', 'Full food library'],
      grad: 'linear-gradient(135deg, #4CB648, #2DAA6E)', cta: 'Try Grow', accent: '#2DAA6E', highlight: true },
    { l: 'TRANSFORM', p: '€99', sub: 'per month', desc: 'Personal protocol & coaching',
      f: ['Everything in Grow', 'Unlimited EatoBiotic AI', 'Deep assessment + PDF report', 'Quarterly protocol'],
      grad: 'linear-gradient(135deg, #F5C518, #F5A623)', cta: 'Go transform', accent: '#F5A623' }
  ];
  return (
    <section id="membership" style={{ padding: '120px 32px', background: '#F9FAF7' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4CB648', margin: 0 }}>Membership</p>
          <h2 style={{
            fontFamily: "'Lora', serif", fontWeight: 600,
            fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#1A2E12',
            margin: '14px 0 0'
          }}>
            Start free.{' '}
            <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Grow with your system.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {tiers.map(t => (
            <div key={t.l} style={{
              border: t.highlight ? '2px solid #4CB648' : '1px solid #E5E5E5',
              borderRadius: 24,
              padding: 28,
              background: '#fff',
              position: 'relative',
              boxShadow: t.highlight ? '0 20px 50px -20px rgba(76,182,72,0.25)' : 'none'
            }}>
              {t.highlight && (
                <span style={{
                  position: 'absolute', top: -12, left: 24,
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#fff',
                  padding: '5px 12px', borderRadius: 9999,
                  background: '#4CB648'
                }}>Most popular</span>
              )}
              <div style={{ height: 5, borderRadius: 9999, background: t.grad, marginBottom: 22 }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>{t.l}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                <p style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 36, color: '#1A2E12', margin: 0, letterSpacing: '-0.02em' }}>{t.p}</p>
                {t.sub && <span style={{ fontSize: 13, color: '#5A6E50' }}>{t.sub}</span>}
              </div>
              <p style={{ fontSize: 14, color: '#5A6E50', margin: '6px 0 22px' }}>{t.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.f.map(item => (
                  <li key={item} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: '#1A2E12', lineHeight: 1.5 }}>
                    <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#" style={{
                display: 'block', textAlign: 'center',
                padding: '12px', borderRadius: 9999,
                background: t.grad, color: '#fff',
                fontWeight: 600, fontSize: 14,
                textDecoration: 'none'
              }}>{t.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Explore', ['You', 'Family', 'Mind', 'The Plate', 'The Book']],
    ['Platform', ['Assessment', 'Food Library', 'EatoBiotic AI', 'Account']],
    ['EatoSystem', ['About EatoSystem', 'EatoSports', 'EatoFund', 'EatoAI']],
    ['Company', ['Manifesto', 'Press', 'Contact', 'Careers']]
  ];
  return (
    <footer style={{ borderTop: '1px solid #E5E5E5', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="assets/eatobiotics-icon.webp" alt="" style={{ width: 32, height: 32 }} />
              <span style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 19, color: '#1A2E12' }}>EatoBiotics</span>
            </div>
            <p style={{ fontSize: 14, color: '#5A6E50', margin: '14px 0 0', maxWidth: 280, lineHeight: 1.55 }}>
              The food system inside you. Part of the EatoSystem — food as the operating system for human and planetary health.
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 22 }}>
              {['#A8E063', '#4CB648', '#2DAA6E', '#F5C518', '#F5A623'].map(c => (
                <span key={c} style={{ width: 44, height: 6, borderRadius: 9999, background: c }} />
              ))}
            </div>
          </div>
          {cols.map(([h, ls]) => (
            <div key={h}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1A2E12', margin: '0 0 16px' }}>{h}</p>
              {ls.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, color: '#5A6E50', marginBottom: 9, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 56, paddingTop: 24,
          borderTop: '1px solid #E5E5E5',
          flexWrap: 'wrap', gap: 16
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#5A6E50' }}>© 2026 EatoBiotics — Part of EatoSystem.</p>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#5A6E50' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Manifesto, BookFeature, Tiers, Footer });
