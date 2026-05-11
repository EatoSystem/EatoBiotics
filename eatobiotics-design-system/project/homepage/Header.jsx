// Sticky header — blur background, brand mark, primary CTA
const GRADIENT = 'linear-gradient(135deg, #A8E063 0%, #4CB648 25%, #2DAA6E 50%, #F5C518 75%, #F5A623 100%)';
const GRADIENT_H = 'linear-gradient(90deg, #A8E063 0%, #4CB648 25%, #2DAA6E 50%, #F5C518 75%, #F5A623 100%)';

function Header({ tweaks }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid #E5E5E5' : '1px solid transparent',
      transition: 'border-color .2s'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="assets/eatobiotics-icon.webp" alt="" style={{ width: 32, height: 32 }} />
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 600, fontSize: 19, color: '#1A2E12', letterSpacing: '-0.01em' }}>EatoBiotics</span>
        </a>

        <nav style={{ display: 'flex', gap: 30, fontSize: 14 }}>
          {['You', 'Family', 'Mind', 'The Book', 'Membership'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '')}`} style={{
              color: '#5A6E50', fontWeight: 500, textDecoration: 'none', transition: 'color .15s'
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#1A2E12'}
              onMouseLeave={e => e.currentTarget.style.color = '#5A6E50'}>{l}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#" style={{ fontSize: 14, color: '#1A2E12', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
          <a href="#assessment" style={{
            padding: '10px 20px',
            borderRadius: 9999,
            background: GRADIENT,
            color: '#fff',
            fontWeight: 600, fontSize: 13.5,
            textDecoration: 'none',
            boxShadow: '0 6px 20px -8px rgba(76,182,72,0.45)',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>Start free assessment</a>
        </div>
      </div>
    </header>
  );
}

function SectionDivider() {
  return <div style={{ height: 4, background: GRADIENT_H }} />;
}

Object.assign(window, { Header, SectionDivider, GRADIENT, GRADIENT_H });
