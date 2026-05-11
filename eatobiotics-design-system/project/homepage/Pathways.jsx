// Pathways — three routes (You / Family / Mind) with hero PNG imagery
function Pathways() {
  const cards = [
    {
      k: 'you', tag: 'CORE', accent: '#4CB648',
      title: 'The food system inside you.',
      desc: 'Build your personal food system to support energy, recovery, immunity, and daily performance.',
      img: 'assets/hero-gut.png',
      stats: ['5 pillars', '15 questions', '3 minutes']
    },
    {
      k: 'family', tag: 'FAMILY', accent: '#F5C518',
      title: 'The food system inside your family.',
      desc: 'A shared food system for households — kids, parents, the table you build together.',
      img: 'assets/family-hero.png',
      stats: ['Shared plate', 'Kid-mode', 'Weekly rhythm']
    },
    {
      k: 'mind', tag: 'MIND', accent: '#2DAA6E',
      title: 'The food system inside your mind.',
      desc: 'The gut–brain axis — feed clarity, mood, and focus from the inside.',
      img: 'assets/mind-hero.png',
      stats: ['Gut-brain', 'Mood tracker', 'Focus foods']
    }
  ];

  return (
    <section id="pathways" style={{ padding: '120px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <p style={{
          fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#4CB648', margin: 0
        }}>Choose your path</p>
        <h2 style={{
          fontFamily: "'Lora', serif", fontWeight: 600,
          fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: '#1A2E12',
          margin: '14px auto 0', maxWidth: 720, textWrap: 'balance'
        }}>
          Start with yourself. Extend to your family.{' '}
          <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Support your mind.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {cards.map(c => (
          <a key={c.k} href={`#${c.k}`} style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid #E5E5E5', borderRadius: 24,
            background: '#fff', overflow: 'hidden',
            textDecoration: 'none', color: 'inherit',
            transition: 'transform .25s, box-shadow .25s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px -20px rgba(26,46,18,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{
              aspectRatio: '4 / 3',
              background: `linear-gradient(180deg, color-mix(in srgb, ${c.accent} 8%, transparent), #F7F7F7)`,
              position: 'relative', overflow: 'hidden'
            }}>
              <img src={c.img} alt="" style={{
                width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center'
              }} />
              <span style={{
                position: 'absolute', top: 16, left: 16,
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#fff',
                padding: '6px 11px', borderRadius: 9999,
                background: c.accent
              }}>{c.tag}</span>
            </div>
            <div style={{ padding: '24px 26px 26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{
                fontFamily: "'Lora', serif", fontWeight: 600,
                fontSize: 22, lineHeight: 1.2,
                color: '#1A2E12',
                margin: 0, letterSpacing: '-0.01em'
              }}>{c.title}</h3>
              <p style={{
                fontSize: 14.5, color: '#5A6E50',
                margin: '12px 0 0', lineHeight: 1.55
              }}>{c.desc}</p>
              <div style={{
                marginTop: 'auto', paddingTop: 22,
                display: 'flex', gap: 10, flexWrap: 'wrap'
              }}>
                {c.stats.map(s => (
                  <span key={s} style={{
                    fontSize: 11.5, color: c.accent, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 9999,
                    background: `color-mix(in srgb, ${c.accent} 10%, transparent)`,
                    letterSpacing: '0.02em'
                  }}>{s}</span>
                ))}
              </div>
              <div style={{
                marginTop: 18, fontSize: 14, color: c.accent, fontWeight: 600
              }}>Explore →</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { Pathways });
