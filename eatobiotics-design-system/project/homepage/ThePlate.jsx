// The Plate — practical, food-forward, four quadrants
function ThePlate() {
  const quadrants = [
    { tag: 'PREBIOTIC', label: 'Plants & fiber', items: ['Leafy greens', 'Roots & alliums', 'Whole grains', 'Legumes'], color: '#4CB648' },
    { tag: 'PROBIOTIC', label: 'Live & fermented', items: ['Yogurt or kefir', 'Kimchi or kraut', 'Miso or natto', 'Aged cheese'], color: '#2DAA6E' },
    { tag: 'PROTEIN', label: 'Slow protein', items: ['Wild fish', 'Eggs', 'Pasture meat', 'Tempeh or tofu'], color: '#F5C518' },
    { tag: 'POSTBIOTIC', label: 'The output', items: ['SCFAs', 'B-vitamins', 'Serotonin', 'Anti-inflammatories'], color: '#F5A623' }
  ];

  return (
    <section id="plate" style={{
      padding: '120px 32px',
      background: 'linear-gradient(180deg, #F9FAF7 0%, #fff 100%)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 80, alignItems: 'center' }}>
        {/* LEFT — Plate visualization */}
        <div style={{ position: 'relative' }}>
          <div style={{
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 30px 80px -30px rgba(26,46,18,0.2), inset 0 0 0 1px #EAEAEA',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 4 quadrants */}
            {quadrants.map((q, i) => {
              const positions = [
                { top: 0, left: 0, bg: 'linear-gradient(135deg, rgba(168,224,99,0.18), rgba(76,182,72,0.10))', border: '1px solid rgba(76,182,72,0.18)' },
                { top: 0, right: 0, bg: 'linear-gradient(225deg, rgba(45,170,110,0.20), rgba(76,182,72,0.10))', border: '1px solid rgba(45,170,110,0.20)' },
                { bottom: 0, left: 0, bg: 'linear-gradient(45deg, rgba(245,197,24,0.18), rgba(245,166,35,0.10))', border: '1px solid rgba(245,197,24,0.20)' },
                { bottom: 0, right: 0, bg: 'linear-gradient(315deg, rgba(245,166,35,0.22), rgba(245,197,24,0.10))', border: '1px solid rgba(245,166,35,0.22)' }
              ];
              const p = positions[i];
              return (
                <div key={i} style={{
                  position: 'absolute', width: '50%', height: '50%',
                  ...p, padding: '14% 12%',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: q.color
                  }}>{q.tag}</p>
                  <p style={{
                    margin: '6px 0 0',
                    fontFamily: "'Lora', serif", fontWeight: 600,
                    fontSize: 18, lineHeight: 1.2, color: '#1A2E12'
                  }}>{q.label}</p>
                </div>
              );
            })}

            {/* center medallion */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 110, height: 110, borderRadius: '50%',
              background: GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 30px -8px rgba(76,182,72,0.4), 0 0 0 8px #fff'
            }}>
              <span style={{
                fontFamily: "'Lora', serif", fontWeight: 700,
                color: '#fff', fontSize: 13, textAlign: 'center', lineHeight: 1.15,
                letterSpacing: '0.04em'
              }}>THE<br/>PLATE</span>
            </div>
          </div>

          <p style={{
            margin: '24px 0 0', textAlign: 'center',
            fontSize: 13, color: '#5A6E50',
            fontStyle: 'italic'
          }}>One plate. Five days. One decision.</p>
        </div>

        {/* RIGHT — Copy + ingredient lists */}
        <div>
          <p style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#4CB648', margin: 0
          }}>The Plate</p>
          <h2 style={{
            fontFamily: "'Lora', serif", fontWeight: 600,
            fontSize: 'clamp(34px, 3.8vw, 48px)', lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1A2E12',
            margin: '14px 0 0'
          }}>
            Build this plate once.<br />
            <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Eat it five days.
            </span><br />
            Change it next week.
          </h2>
          <p style={{
            fontSize: 17, lineHeight: 1.6, color: '#5A6E50',
            margin: '22px 0 0',
            maxWidth: 480
          }}>
            The simplest food system that works. Four parts to every plate, repeated through the week — your microbiome rewards consistency more than novelty.
          </p>

          <div style={{
            marginTop: 36,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14
          }}>
            {quadrants.map((q) => (
              <div key={q.tag} style={{
                border: '1px solid #E5E5E5',
                borderRadius: 14,
                padding: '14px 16px',
                background: '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: q.color }} />
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: q.color
                  }}>{q.tag}</span>
                </div>
                {q.items.map(item => (
                  <p key={item} style={{
                    margin: '3px 0',
                    fontSize: 13, color: '#1A2E12'
                  }}>{item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { ThePlate });
