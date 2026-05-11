// 3 Biotics Framework — Feed. Add. Produce. — three cards with gradient pair-slices
function BioticTrio() {
  const items = [
    {
      n: '01', tag: 'PREBIOTIC', verb: 'Feed',
      title: 'Prebiotics',
      desc: 'Fibers and plant compounds that nourish the bacteria already living in you. Onions, garlic, oats, asparagus, leeks.',
      grad: 'linear-gradient(135deg, #A8E063, #4CB648)',
      anchor: '#A8E063', anchor2: '#4CB648',
      claim: '30+ plants per week feeds maximum diversity'
    },
    {
      n: '02', tag: 'PROBIOTIC', verb: 'Add',
      title: 'Probiotics',
      desc: 'Living microorganisms from fermented foods that join your community. Yogurt, kefir, kimchi, sauerkraut, miso.',
      grad: 'linear-gradient(135deg, #4CB648, #2DAA6E)',
      anchor: '#4CB648', anchor2: '#2DAA6E',
      claim: 'Live cultures in every meal builds your colony'
    },
    {
      n: '03', tag: 'POSTBIOTIC', verb: 'Produce',
      title: 'Postbiotics',
      desc: 'The beneficial byproducts your gut bacteria create — short-chain fatty acids, vitamins, signaling compounds your body runs on.',
      grad: 'linear-gradient(135deg, #F5C518, #F5A623)',
      anchor: '#F5C518', anchor2: '#F5A623',
      claim: '70% of your immune system depends on these'
    }
  ];

  return (
    <section id="biotics" style={{ padding: '120px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end', marginBottom: 56 }}>
        <div>
          <p style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#4CB648', margin: 0
          }}>The Three Biotics</p>
          <h2 style={{
            fontFamily: "'Lora', Georgia, serif", fontWeight: 600,
            fontSize: 'clamp(36px, 4.2vw, 56px)', lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#1A2E12',
            margin: '14px 0 0', textWrap: 'balance'
          }}>
            Three types of biotics.{' '}
            <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              One food system.
            </span>
          </h2>
        </div>
        <p style={{
          fontSize: 17, lineHeight: 1.6, color: '#5A6E50',
          margin: 0, alignSelf: 'end', paddingBottom: 6
        }}>
          Every plate you build either feeds, adds to, or produces for the trillions of microbes that run your immune system, your mood, and your energy. The framework is simple — the practice changes everything.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {items.map(it => (
          <div key={it.n} style={{
            position: 'relative',
            border: '1px solid #E5E5E5', borderRadius: 24,
            background: '#fff', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ height: 6, background: it.grad }} />
            <div style={{ padding: '32px 28px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                <span style={{
                  fontFamily: "'Lora', serif", fontWeight: 600,
                  fontSize: 56, lineHeight: 1, color: it.anchor2,
                  letterSpacing: '-0.02em'
                }}>{it.n}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: it.anchor2,
                  padding: '4px 10px', borderRadius: 9999,
                  background: `color-mix(in srgb, ${it.anchor2} 12%, transparent)`
                }}>{it.tag}</span>
              </div>

              <h3 style={{
                fontFamily: "'Lora', serif", fontWeight: 600,
                fontSize: 28, margin: 0, color: '#1A2E12',
                letterSpacing: '-0.01em'
              }}>{it.title}.</h3>
              <p style={{
                fontFamily: "'Lora', serif", fontStyle: 'italic',
                fontSize: 18, color: it.anchor2, fontWeight: 500,
                margin: '4px 0 0'
              }}>{it.verb}.</p>

              <p style={{
                fontSize: 14.5, lineHeight: 1.6, color: '#5A6E50',
                margin: '20px 0 0'
              }}>{it.desc}</p>

              <div style={{
                marginTop: 'auto', paddingTop: 24,
                borderTop: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'flex-start', gap: 10
              }}>
                <span style={{
                  display: 'inline-block', flexShrink: 0,
                  width: 6, height: 6, borderRadius: 9999,
                  background: it.anchor2, marginTop: 7
                }} />
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: '#1A2E12', fontWeight: 500 }}>{it.claim}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { BioticTrio });
