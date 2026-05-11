// Shared landing-page components for /start, /start-family, /start-mind
const BRAND_GRADIENT = 'linear-gradient(135deg, #A8E063 0%, #4CB648 25%, #2DAA6E 50%, #F5C518 75%, #F5A623 100%)';

function PathwayBadge({ accent, children }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8,borderRadius:9999,border:'1px solid #E5E5E5',background:'rgba(255,255,255,.8)',padding:'6px 16px',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.15em',color:'#5A6E50',fontFamily:'DM Sans, sans-serif'}}>
      <span style={{width:8,height:8,borderRadius:9999,background:accent}}/>
      {children}
    </div>
  );
}

function PrimaryCTA({ children, icon='→', accent='#4CB648', full }) {
  return (
    <button style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,borderRadius:9999,padding:'20px 32px',background:BRAND_GRADIENT,color:'#fff',fontFamily:'DM Sans, sans-serif',fontWeight:600,fontSize:16,border:'none',cursor:'pointer',boxShadow:`0 12px 32px -8px ${accent}4D`,width:full?'100%':'auto',transition:'all .2s'}}>
      {children} <span style={{fontSize:18}}>{icon}</span>
    </button>
  );
}

function InlineTextCTA({ children, accent='#4CB648' }) {
  return (
    <a style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:14,fontWeight:600,color:accent,cursor:'pointer',marginTop:40,fontFamily:'DM Sans, sans-serif'}}>
      {children} <span>→</span>
    </a>
  );
}

function ScoreMock({ score, pillars, gradientStops, accent, label='YOUR FOOD SYSTEM SCORE' }) {
  const r=70, circ=2*Math.PI*r, off=circ*(1-score/100);
  const gid = 'sg-'+label.replace(/\s/g,'');
  return (
    <div style={{borderRadius:24,border:'1px solid #E5E5E5',background:'#fff',padding:32,boxShadow:'0 20px 48px -20px rgba(0,0,0,.10)',maxWidth:360,margin:'0 auto'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{position:'relative',width:180,height:180}}>
          <svg width="180" height="180" viewBox="0 0 160 160" style={{transform:'rotate(-90deg)'}}>
            <defs><linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientStops.map((s,i)=><stop key={i} offset={`${(i/(gradientStops.length-1))*100}%`} stopColor={s}/>)}
            </linearGradient></defs>
            <circle cx="80" cy="80" r={r} fill="none" stroke="#F3F3F3" strokeWidth="12"/>
            <circle cx="80" cy="80" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:40,fontWeight:700,color:'#1A2E12',lineHeight:1}}>{score}</div>
            <div style={{fontFamily:'DM Sans, sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.15em',textTransform:'uppercase',color:'#5A6E50',marginTop:4}}>/100</div>
          </div>
        </div>
        <div style={{fontFamily:'DM Sans, sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.15em',textTransform:'uppercase',color:'#5A6E50',marginTop:10}}>{label}</div>
      </div>
      <div style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
        {pillars.map(p => (
          <div key={p.name}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4,fontFamily:'DM Sans, sans-serif'}}>
              <span style={{color:'#5A6E50'}}>{p.name}</span>
              <span style={{fontWeight:700,color:'#1A2E12'}}>{p.value}</span>
            </div>
            <div style={{height:6,borderRadius:9999,background:'#F3F3F3',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${p.value}%`,background:`linear-gradient(90deg, ${p.color}, ${accent})`}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StartHero({ accent, badge, headline, headlineAccent, tension, subhead, cta, score }) {
  return (
    <section style={{padding:'100px 24px 60px',textAlign:'center',background:'#fff',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:600,height:400,background:`radial-gradient(ellipse at center, color-mix(in srgb, ${accent} 8%, transparent), transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{maxWidth:640,margin:'0 auto',position:'relative'}}>
        <PathwayBadge accent={accent}>{badge}</PathwayBadge>
        <h1 style={{fontFamily:'Lora, Georgia, serif',fontSize:52,fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',color:'#1A2E12',margin:'20px 0 18px',textWrap:'balance'}}>
          {headline} <span style={{background:BRAND_GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{headlineAccent}</span>
        </h1>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:15,fontWeight:600,color:accent,margin:'0 0 14px'}}>{tension}</p>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:17,lineHeight:1.6,color:'#5A6E50',margin:'0 0 32px'}}>{subhead}</p>
        <PrimaryCTA accent={accent}>{cta}</PrimaryCTA>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:13,color:'#5A6E50',marginTop:14}}>Free report included · Takes 2 minutes</p>
        <div style={{marginTop:48}}>{score}</div>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:12,color:'#5A6E50',marginTop:18,fontStyle:'italic'}}>Sample score above — check yours in 2 minutes</p>
      </div>
    </section>
  );
}

function StartProblem({ accent, h2, opening, gaps, symptoms, ctaLabel }) {
  return (
    <section style={{padding:'80px 24px',background:'rgba(247,247,247,.4)'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.15em',color:accent,margin:'0 0 12px'}}>THE PROBLEM</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:36,fontWeight:600,lineHeight:1.2,color:'#1A2E12',margin:'0 0 18px',textWrap:'balance'}}>{h2}</h2>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:17,lineHeight:1.65,color:'#5A6E50',margin:'0 0 32px'}}>{opening}</p>

        <div style={{borderRadius:24,border:'1px solid #E5E5E5',background:'#fff',overflow:'hidden'}}>
          {gaps.map((g,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:i<gaps.length-1?'1px solid #E5E5E5':'none'}}>
              <span style={{fontFamily:'DM Sans, sans-serif',fontSize:14,color:'#1A2E12',fontWeight:500,lineHeight:1.4,maxWidth:'70%'}}>{g.label}</span>
              <span style={{fontFamily:'DM Sans, sans-serif',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em',color:accent,padding:'4px 10px',borderRadius:9999,background:`color-mix(in srgb, ${accent} 10%, transparent)`}}>{g.tag}</span>
            </div>
          ))}
        </div>

        <div style={{marginTop:32,display:'grid',gridTemplateColumns:'1fr',gap:12}}>
          {symptoms.map((s,i)=>(
            <div key={i} style={{display:'flex',gap:14,alignItems:'flex-start',padding:18,borderRadius:16,border:'1px solid #E5E5E5',background:'#fff'}}>
              <div style={{width:8,height:8,borderRadius:9999,background:accent,marginTop:8,flexShrink:0}}/>
              <p style={{fontFamily:'DM Sans, sans-serif',fontSize:15,lineHeight:1.55,color:'#1A2E12',margin:0}}>{s}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center'}}><InlineTextCTA accent={accent}>{ctaLabel}</InlineTextCTA></div>
      </div>
    </section>
  );
}

function StartSolution({ accent, overline, h2, sub, table, pillars, ctaLabel }) {
  return (
    <section style={{padding:'80px 24px',background:'#fff'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.15em',color:accent,margin:'0 0 12px'}}>{overline}</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:36,fontWeight:600,lineHeight:1.2,color:'#1A2E12',margin:'0 0 18px',textWrap:'balance'}}>{h2}</h2>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:17,lineHeight:1.65,color:'#5A6E50',margin:'0 0 32px'}}>{sub}</p>

        <div style={{borderRadius:24,border:'1px solid #E5E5E5',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#F7F7F7',borderBottom:'1px solid #E5E5E5'}}>
            <div style={{padding:'14px 18px',fontFamily:'DM Sans, sans-serif',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em',color:'#5A6E50',borderRight:'1px solid #E5E5E5'}}>NOT THIS</div>
            <div style={{padding:'14px 18px',fontFamily:'DM Sans, sans-serif',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em',color:accent}}>THIS</div>
          </div>
          {table.map((row,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:i<table.length-1?'1px solid #E5E5E5':'none',background:'#fff'}}>
              <div style={{padding:'16px 18px',fontFamily:'DM Sans, sans-serif',fontSize:14,color:'#5A6E50',textDecoration:'line-through',borderRight:'1px solid #E5E5E5',lineHeight:1.5}}>{row.not}</div>
              <div style={{padding:'16px 18px',fontFamily:'DM Sans, sans-serif',fontSize:14,color:'#1A2E12',fontWeight:500,lineHeight:1.5,display:'flex',gap:8,alignItems:'flex-start'}}><span style={{width:6,height:6,borderRadius:9999,background:accent,marginTop:7,flexShrink:0}}/>{row.is}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginTop:32}}>
          {pillars.map(p=>(
            <div key={p.name} style={{padding:18,borderRadius:16,border:'1px solid #E5E5E5',background:'#fff'}}>
              <div style={{fontFamily:'Lora, Georgia, serif',fontSize:16,fontWeight:600,color:'#1A2E12'}}>{p.name}</div>
              <div style={{fontFamily:'DM Sans, sans-serif',fontSize:13,color:'#5A6E50',marginTop:4,lineHeight:1.5}}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center'}}><InlineTextCTA accent={accent}>{ctaLabel}</InlineTextCTA></div>
      </div>
    </section>
  );
}

function StartPressure({ accent, h2, body, emphasis, cta }) {
  return (
    <section style={{padding:'100px 24px',background:'#1A2E12',textAlign:'center'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,borderRadius:9999,border:'1px solid rgba(255,255,255,.2)',padding:'6px 16px',fontFamily:'DM Sans, sans-serif',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.15em',color:'rgba(255,255,255,.6)'}}>
          <span style={{width:8,height:8,borderRadius:9999,background:accent}}/>THE REALITY
        </div>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:44,fontWeight:700,lineHeight:1.1,color:'#fff',margin:'20px 0 18px',textWrap:'balance'}}>{h2}</h2>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:17,lineHeight:1.65,color:'rgba(255,255,255,.6)',margin:'0 0 24px'}}>{body}</p>
        <p style={{fontFamily:'Lora, Georgia, serif',fontSize:22,fontWeight:600,color:'#fff',margin:'0 0 32px'}}>{emphasis}</p>
        <PrimaryCTA accent={accent}>{cta}</PrimaryCTA>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:12,color:'rgba(255,255,255,.5)',marginTop:14}}>Free · No credit card · 2 minutes</p>
      </div>
    </section>
  );
}

function StartFinal({ accent, h2, sub, cta }) {
  return (
    <section style={{padding:'100px 24px 120px',background:'#fff',textAlign:'center'}}>
      <div style={{maxWidth:560,margin:'0 auto',padding:40,borderRadius:24,border:'1px solid #E5E5E5',background:`linear-gradient(180deg, color-mix(in srgb, ${accent} 4%, transparent), transparent)`}}>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:36,fontWeight:700,lineHeight:1.15,color:'#1A2E12',margin:'0 0 14px',textWrap:'balance'}}>{h2}</h2>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:15,color:'#5A6E50',margin:'0 0 28px'}}>{sub}</p>
        <PrimaryCTA accent={accent} full>{cta}</PrimaryCTA>
        <p style={{fontFamily:'DM Sans, sans-serif',fontSize:12,color:'#5A6E50',marginTop:16}}>No signup required · No spam · No credit card</p>
      </div>
    </section>
  );
}

Object.assign(window, { PathwayBadge, PrimaryCTA, InlineTextCTA, ScoreMock, StartHero, StartProblem, StartSolution, StartPressure, StartFinal, BRAND_GRADIENT });
