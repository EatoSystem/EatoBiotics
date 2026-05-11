// Assessment flow components
const GRADIENT = 'linear-gradient(135deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)';

function AssessmentIntro({ onStart }) {
  return (
    <div style={{maxWidth:640,margin:'80px auto',padding:'0 28px',textAlign:'center'}}>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>Biotics Assessment</p>
      <h1 style={{fontFamily:'Lora, Georgia, serif',fontSize:52,fontWeight:700,margin:'14px 0 12px',letterSpacing:'-0.02em'}}>Your food system, in 3 minutes.</h1>
      <p style={{fontSize:16,color:'#737373',lineHeight:1.55}}>Answer 15 questions about what you eat, how you feel, and how you live. Get your Biotics Score and a personalized path.</p>
      <button onClick={onStart} style={{marginTop:28,padding:'14px 32px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:15,border:'none',cursor:'pointer'}}>Begin assessment →</button>
      <div style={{marginTop:36,display:'flex',justifyContent:'center',gap:24,fontSize:12,color:'#A3A3A3'}}>
        <span>15 questions</span><span>·</span><span>~3 minutes</span><span>·</span><span>Free</span>
      </div>
    </div>
  );
}

function AssessmentQuestion({ qIndex, total, question, options, onAnswer }) {
  const pct = (qIndex/total)*100;
  return (
    <div style={{maxWidth:640,margin:'60px auto',padding:'0 28px'}}>
      <div style={{height:4,borderRadius:9999,background:'#F5F5F5',overflow:'hidden',marginBottom:32}}>
        <div style={{height:'100%',width:`${pct}%`,background:GRADIENT,transition:'width .4s'}}/>
      </div>
      <p style={{fontSize:11,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'#737373'}}>Question {qIndex+1} of {total}</p>
      <h2 style={{fontFamily:'Lora, Georgia, serif',fontSize:32,fontWeight:600,margin:'10px 0 28px',lineHeight:1.2}}>{question}</h2>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {options.map((o,i)=>(
          <button key={i} onClick={()=>onAnswer(i)} style={{textAlign:'left',padding:'16px 20px',borderRadius:16,border:'1px solid #E5E5E5',background:'#fff',fontSize:15,color:'#0A0A0A',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#4CB648';e.currentTarget.style.background='#F7FAF5'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E5E5';e.currentTarget.style.background='#fff'}}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function AssessmentResult({ score, onRestart }) {
  const r = 88, circ = 2*Math.PI*r, prog = (score/100)*circ;
  return (
    <div style={{maxWidth:640,margin:'60px auto',padding:'0 28px',textAlign:'center'}}>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#4CB648'}}>Your Biotics Score</p>
      <div style={{position:'relative',width:260,height:260,margin:'28px auto'}}>
        <svg width="260" height="260" viewBox="0 0 200 200" style={{transform:'rotate(-90deg)'}}>
          <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063"/><stop offset="25%" stopColor="#4CB648"/><stop offset="60%" stopColor="#2DAA6E"/><stop offset="80%" stopColor="#F5C518"/><stop offset="100%" stopColor="#F5A623"/></linearGradient></defs>
          <circle cx="100" cy="100" r={r} fill="none" stroke="#E5E5E5" strokeWidth="11"/>
          <circle cx="100" cy="100" r={r} fill="none" stroke="url(#rg)" strokeWidth="11" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ-prog}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontFamily:'Lora, Georgia, serif',fontSize:80,fontWeight:700,lineHeight:1}}>{score}</div>
          <div style={{fontSize:13,color:'#737373'}}>/100</div>
          <div style={{marginTop:6,fontSize:11,fontWeight:700,letterSpacing:'.12em',color:'#4CB648'}}>GREAT PROGRESS</div>
        </div>
      </div>
      <h1 style={{fontFamily:'Lora, Georgia, serif',fontSize:36,fontWeight:700,margin:'4px 0 10px'}}>You're a <span style={{background:GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Gut-Aware Grower</span></h1>
      <p style={{fontSize:15,color:'#737373',lineHeight:1.55,maxWidth:480,margin:'0 auto'}}>Your food system is solid. Keep building by adding fermented foods to 3 meals a week and tracking your streak.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:32}}>
        {[['Pre','6','#A8E063'],['Pro','4','#2DAA6E'],['Post','3','#F5A623']].map(([l,n,c])=>(
          <div key={l} style={{border:'1px solid #E5E5E5',borderRadius:16,padding:'16px 12px'}}>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:32,fontWeight:700,color:c}}>{n}</div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373',marginTop:2}}>{l}biotics</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:28,display:'flex',gap:10,justifyContent:'center'}}>
        <button style={{padding:'12px 24px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:14,border:'none',cursor:'pointer'}}>Get my path →</button>
        <button onClick={onRestart} style={{padding:'12px 24px',borderRadius:9999,background:'#fff',color:'#0A0A0A',fontWeight:600,fontSize:14,border:'1px solid #E5E5E5',cursor:'pointer'}}>Restart</button>
      </div>
    </div>
  );
}

Object.assign(window, { AssessmentIntro, AssessmentQuestion, AssessmentResult });
