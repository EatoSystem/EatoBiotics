// Hero — assessment-led, two-column with biotic capsule cluster + stat trio
function Hero({ tweaks }) {
  const variant = tweaks?.heroVariant || 'assessment';

  return (
    <section id="top" style={{
      position: 'relative',
      padding: '72px 32px 96px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      {/* soft organic background */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(assets/background-graphic.webp)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.18,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'center',
        position: 'relative'
      }}>
        {/* LEFT — copy */}
        <div>
          {/* biotic capsule eyebrow row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {['#A8E063', '#4CB648', '#2DAA6E', '#F5C518', '#F5A623'].map(c => (
                <span key={c} style={{ width: 22, height: 6, borderRadius: 9999, background: c }} />
              ))}
            </span>
            <span style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#4CB648'
            }}>The Food System Inside You</span>
          </div>

          <h1 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 600,
            fontSize: 'clamp(40px, 4.6vw, 64px)',
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            margin: 0,
            color: '#1A2E12',
            textWrap: 'balance'
          }}>
            Build the food system{' '}
            <span style={{
              background: GRADIENT,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              whiteSpace: 'nowrap'
            }}>inside you.</span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18, lineHeight: 1.55,
            color: '#5A6E50',
            marginTop: 28, marginBottom: 0,
            maxWidth: 520
          }}>
            An advanced system to understand your microbiome and improve how you feel every day — digestion, immunity, energy, mood, and recovery.
          </p>

          <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#assessment" style={{
              padding: '15px 26px',
              borderRadius: 9999,
              background: GRADIENT,
              color: '#fff', fontWeight: 600, fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 12px 32px -10px rgba(76,182,72,0.5)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              Start free assessment
              <span style={{ display: 'inline-block', transform: 'translateY(-1px)' }}>→</span>
            </a>
            <a href="#thebook" style={{
              padding: '15px 26px',
              borderRadius: 9999,
              background: '#fff',
              color: '#1A2E12', fontWeight: 600, fontSize: 15,
              border: '1.5px solid #E5E5E5',
              textDecoration: 'none'
            }}>Read the book</a>
          </div>

          <p style={{
            fontSize: 13, color: '#5A6E50',
            marginTop: 18, marginBottom: 0,
            display: 'flex', gap: 18, flexWrap: 'wrap'
          }}>
            <span>Free to start.</span>
            <span>No card needed.</span>
            <span>Takes about 3 minutes.</span>
          </p>
        </div>

        {/* RIGHT — hero image with floating stats */}
        <div style={{ position: 'relative' }}>
          <div style={{
            aspectRatio: '1 / 1',
            background: '#F7F7F7',
            borderRadius: 28,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 30px 80px -30px rgba(26,46,18,0.18)'
          }}>
            <img src="assets/hero-gut.png" alt="" style={{
              width: '100%', height: '100%',
              objectFit: 'cover'
            }} />
          </div>

          {/* Floating stat card — top left */}
          <div style={{
            position: 'absolute', top: 28, left: -22,
            background: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: 18,
            padding: '14px 18px',
            boxShadow: '0 12px 32px -12px rgba(26,46,18,0.18)',
            display: 'flex', alignItems: 'center', gap: 12,
            minWidth: 200
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #A8E063, #4CB648)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 20
            }}>78</div>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#4CB648', textTransform: 'uppercase' }}>Biotics Score</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#1A2E12', fontWeight: 500 }}>+12 this month</p>
            </div>
          </div>

          {/* Floating quote card — bottom right */}
          <div style={{
            position: 'absolute', bottom: 28, right: -22,
            background: '#1A2E12',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: '0 16px 40px -10px rgba(26,46,18,0.35)',
            maxWidth: 260
          }}>
            <p style={{
              margin: 0, fontSize: 13, lineHeight: 1.5,
              color: '#fff', fontFamily: "'Lora', serif", fontStyle: 'italic'
            }}>
              "100 trillion microbes. <span style={{ color: '#A8E063', fontStyle: 'normal', fontWeight: 600 }}>One food system.</span>"
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        maxWidth: 1200, margin: '88px auto 0',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5'
      }}>
        {[
          { n: '100T', l: 'microbes in your gut' },
          { n: '70%', l: 'of immunity lives there' },
          { n: '5', l: 'pillars of your score' },
          { n: '3min', l: 'to your assessment' }
        ].map((s, i) => (
          <div key={i} style={{
            padding: '28px 24px',
            borderLeft: i === 0 ? 'none' : '1px solid #E5E5E5',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              fontFamily: "'Lora', serif", fontWeight: 600,
              fontSize: 38, lineHeight: 1,
              color: '#1A2E12', letterSpacing: '-0.02em'
            }}>{s.n}</p>
            <p style={{
              margin: '8px 0 0', fontSize: 13,
              color: '#5A6E50'
            }}>{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { Hero });
