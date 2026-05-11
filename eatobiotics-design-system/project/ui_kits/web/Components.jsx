// Web UI Kit components for EatoBiotics
const { useState } = React;

const GRADIENT = 'linear-gradient(135deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)';

function Header({ onNav }) {
  return (
    <header style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,.8)',backdropFilter:'blur(12px)',borderBottom:'1px solid #E5E5E5'}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a onClick={()=>onNav('home')} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',textDecoration:'none'}}>
          <img src="../../assets/logos/eatobiotics-icon.webp" style={{width:28,height:28}}/>
          <span style={{fontFamily:'Lora, Georgia, serif',fontWeight:600,fontSize:18,color:'#0A0A0A'}}>EatoBiotics</span>
        </a>
        <nav style={{display:'flex',gap:28,fontSize:13,color:'#737373'}}>
          {['You','Family','Mind','Book','Platform','Membership'].map(l=>
            <a key={l} onClick={()=>onNav(l.toLowerCase())} style={{cursor:'pointer',fontWeight:500}}>{l}</a>)}
        </nav>
        <button onClick={()=>onNav('assessment')} style={{padding:'8px 18px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:13,border:'none',cursor:'pointer'}}>Start Assessment →</button>
      </div>
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section style={{padding:'80px 28px 60px',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>The Food System Inside You</p>
        <h1 style={{fontFamily:'Lora, Georgia, serif',fontSize:72,fontWeight:700,lineHeight:1.03,margin:'18px 0 18px',color:'#0A0A0A',letterSpacing:'-0.02em'}}>
          Build the food system<br/>
          <span style={{background:GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>inside you.</span>
        </h1>
        <p style={{fontSize:18,color:'#737373',maxWidth:620,margin:'0 auto',lineHeight:1.55}}>
          Your personal food system — assess it, score it, feed it, and watch it change everything about how you feel.
        </p>
        <div style={{marginTop:32,display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onStart} style={{padding:'14px 28px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:15,border:'none',cursor:'pointer',boxShadow:'0 10px 30px -8px rgba(76,182,72,.4)'}}>Start Free Assessment →</button>
          <button style={{padding:'14px 28px',borderRadius:9999,background:'#fff',color:'#0A0A0A',fontWeight:600,fontSize:15,border:'1px solid #E5E5E5',cursor:'pointer'}}>Watch the film</button>
        </div>
      </div>
    </section>
  );
}

function SectionDivider() {
  return <div style={{height:4,background:GRADIENT}}/>;
}

function BioticTrio() {
  const items = [
    {n:'01',t:'Prebiotics',s:'FEED',d:'Fibers and compounds that nourish the bacteria already living in you.',c:'#A8E063',c2:'#4CB648'},
    {n:'02',t:'Probiotics',s:'ADD',d:'Living microorganisms from fermented foods that join your community.',c:'#4CB648',c2:'#2DAA6E'},
    {n:'03',t:'Postbiotics',s:'PRODUCE',d:'The beneficial byproducts your gut bacteria create for your body.',c:'#F5C518',c2:'#F5A623'},
  ];
  return (
    <section style={{padding:'80px 28px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:48}}>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>The Three Biotics</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:44,fontWeight:600,margin:'10px 0 0',color:'#0A0A0A'}}>Feed. Add. Produce.</h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {items.map(it=>(
          <div key={it.n} style={{position:'relative',border:'1px solid #E5E5E5',borderRadius:24,padding:'28px 24px',background:'#fff',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:6,background:`linear-gradient(90deg,${it.c},${it.c2})`}}/>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:72,fontWeight:600,lineHeight:1,color:it.c2}}>{it.n}</div>
            <h3 style={{fontFamily:'Lora, Georgia, serif',fontSize:22,fontWeight:600,margin:'16px 0 2px'}}>{it.t}</h3>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',color:it.c2}}>{it.s}</p>
            <p style={{fontSize:14,color:'#737373',marginTop:10,lineHeight:1.55}}>{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pathways({ onNav }) {
  const cards = [
    {k:'you',eb:'CORE',t:'The Food System Inside You',d:'Build your personal food system to support health, energy, and daily performance.',img:'../../assets/images/hero-gut.png',c:'#4CB648'},
    {k:'family',eb:'FAMILY',t:'Your Family\'s Food System',d:'Build your family\'s food system together — from shared meals to shared health.',img:'../../assets/images/family-hero.png',c:'#2DAA6E'},
    {k:'mind',eb:'MIND',t:'The Food System Inside Your Mind',d:'Understand the gut-brain connection and feed your mental clarity, mood, and focus.',img:'../../assets/images/mind-hero.png',c:'#F5A623'},
  ];
  return (
    <section style={{padding:'80px 28px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>Choose Your Path</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:44,fontWeight:600,margin:'10px 0 0'}}>Three ways to begin.</h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {cards.map(c=>(
          <a key={c.k} onClick={()=>onNav(c.k)} style={{cursor:'pointer',textDecoration:'none',color:'inherit',border:'1px solid #E5E5E5',borderRadius:24,background:'#fff',overflow:'hidden',transition:'all .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 12px 24px -12px rgba(0,0,0,.12)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
            <div style={{height:180,background:`#F7F7F7 url(${c.img}) center/contain no-repeat`}}/>
            <div style={{padding:'20px 22px'}}>
              <p style={{fontSize:11,fontWeight:700,letterSpacing:'.15em',color:c.c,margin:0}}>{c.eb}</p>
              <h3 style={{fontFamily:'Lora, Georgia, serif',fontSize:20,fontWeight:600,margin:'6px 0 8px'}}>{c.t}</h3>
              <p style={{fontSize:14,color:'#737373',margin:0,lineHeight:1.5}}>{c.d}</p>
              <div style={{marginTop:14,fontSize:13,fontWeight:600,color:c.c}}>Explore →</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section style={{padding:'100px 28px',background:'#1A2E12',textAlign:'center'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#A8E063'}}>The Mission</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:56,fontWeight:700,lineHeight:1.1,color:'#fff',margin:'18px 0 0',letterSpacing:'-0.02em'}}>
          <span style={{background:GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Build the food system inside you —</span><br/>
          and help build the food system around you.
        </h2>
        <p style={{color:'rgba(255,255,255,.55)',fontSize:16,maxWidth:560,margin:'20px auto 0',lineHeight:1.55}}>
          From plate to planet. EatoBiotics is the inside layer of the EatoSystem — food as the operating system for human and planetary health.
        </p>
      </div>
    </section>
  );
}

function Tiers() {
  const tiers = [
    {l:'FREE',p:'Free',f:'Biotics Score + assessment',c:'#A8E063',g:'linear-gradient(135deg,#A8E063,#4CB648)',cta:'Start Free'},
    {l:'GROW',p:'€9.99/mo',f:'Daily meal logging + streak tracking',c:'#4CB648',g:'linear-gradient(135deg,#A8E063,#4CB648)',cta:'See Plan',hl:true},
    {l:'TRANSFORM',p:'€99/mo',f:'Unlimited EatoBiotic consultations',c:'#F5A623',g:'linear-gradient(135deg,#2DAA6E,#F5A623)',cta:'See Plan'},
  ];
  return (
    <section style={{padding:'80px 28px',maxWidth:860,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>Membership</p>
        <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:44,fontWeight:600,margin:'10px 0 0',letterSpacing:'-0.01em'}}>Start free.<br/><span style={{background:GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Grow with your system.</span></h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {tiers.map(t=>(
          <div key={t.l} style={{border:t.hl?'2px solid #4CB648':'1px solid #E5E5E5',borderRadius:24,padding:24,background:'#fff'}}>
            <div style={{height:4,borderRadius:9999,background:t.g,marginBottom:18}}/>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'.15em',color:t.c,margin:0}}>{t.l}</p>
            <p style={{fontFamily:'Lora, Georgia, serif',fontSize:24,fontWeight:700,margin:'6px 0 14px'}}>{t.p}</p>
            <p style={{fontSize:13,color:'#737373',margin:'0 0 18px',lineHeight:1.5,minHeight:40}}>✓ {t.f}</p>
            <button style={{width:'100%',padding:'10px',borderRadius:9999,background:t.g,color:'#fff',fontWeight:600,fontSize:13,border:'none',cursor:'pointer'}}>{t.cta} →</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{padding:'60px 28px 40px',borderTop:'1px solid #E5E5E5',background:'#fff'}}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:24}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <img src="../../assets/logos/eatobiotics-icon.webp" style={{width:28,height:28}}/>
            <span style={{fontFamily:'Lora, Georgia, serif',fontWeight:600,fontSize:18}}>EatoBiotics</span>
          </div>
          <p style={{fontSize:13,color:'#737373',marginTop:12,maxWidth:280,lineHeight:1.5}}>The food system inside you. Part of the EatoSystem.</p>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            {['#A8E063','#4CB648','#2DAA6E','#F5C518','#F5A623'].map(c=><span key={c} style={{width:48,height:6,borderRadius:9999,background:c}}/>)}
          </div>
        </div>
        <div style={{display:'flex',gap:48}}>
          {[['Explore',['You','Family','Mind','Book']],['Platform',['Assess','Food Library','Account','EatoBiotic AI']],['Company',['About','Membership','Contact']]].map(([h,ls])=>(
            <div key={h}>
              <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#0A0A0A',margin:'0 0 12px'}}>{h}</p>
              {ls.map(l=><a key={l} style={{display:'block',fontSize:13,color:'#737373',marginBottom:8,cursor:'pointer'}}>{l}</a>)}
            </div>
          ))}
        </div>
      </div>
      <p style={{maxWidth:1200,margin:'40px auto 0',fontSize:12,color:'#A3A3A3'}}>© 2026 EatoBiotics · Part of EatoSystem</p>
    </footer>
  );
}

Object.assign(window, { Header, Hero, SectionDivider, BioticTrio, Pathways, Manifesto, Tiers, Footer, GRADIENT });
