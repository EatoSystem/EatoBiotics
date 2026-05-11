// iOS app UI kit components
const GRADIENT = 'linear-gradient(135deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)';

function Phone({ children }) {
  return (
    <div style={{position:'relative',width:320,height:680,margin:'40px auto',borderRadius:48,border:'8px solid #0A0A0A',background:'#fff',overflow:'hidden',boxShadow:'0 30px 60px -20px rgba(0,0,0,.3)'}}>
      <div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',width:100,height:24,background:'#0A0A0A',borderRadius:9999,zIndex:10}}/>
      <div style={{position:'absolute',top:14,left:28,fontSize:11,fontWeight:700,zIndex:11}}>9:41</div>
      <div style={{position:'absolute',top:14,right:28,fontSize:11,zIndex:11}}>● ● ●</div>
      <div style={{position:'absolute',inset:0,paddingTop:44,overflowY:'auto'}}>{children}</div>
      <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',width:120,height:4,background:'#0A0A0A',borderRadius:9999,opacity:.3}}/>
    </div>
  );
}

function HomeScreen({ onTab }) {
  const r = 58, circ = 2*Math.PI*r, score = 78, prog = (score/100)*circ;
  return (
    <div style={{padding:'16px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:'#737373'}}>Tuesday, April 18</div>
          <div style={{fontFamily:'Lora, Georgia, serif',fontSize:20,fontWeight:600}}>Hi, Sarah.</div>
        </div>
        <img src="../../assets/logos/eatobiotics-icon.webp" style={{width:32,height:32}}/>
      </div>

      <div style={{borderRadius:24,padding:20,background:'#F7FAF5',border:'1px solid #E5E5E5',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <p style={{fontSize:10,fontWeight:700,letterSpacing:'.15em',color:'#737373',margin:0}}>BIOTICS SCORE</p>
        <div style={{position:'relative',width:140,height:140,marginTop:10}}>
          <svg width="140" height="140" viewBox="0 0 128 128" style={{transform:'rotate(-90deg)'}}>
            <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063"/><stop offset="33%" stopColor="#2DAA6E"/><stop offset="66%" stopColor="#F5C518"/><stop offset="100%" stopColor="#F5A623"/></linearGradient></defs>
            <circle cx="64" cy="64" r={r} fill="none" stroke="#E5E5E5" strokeWidth="6"/>
            <circle cx="64" cy="64" r={r} fill="none" stroke="url(#hg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ-prog}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:40,fontWeight:600,lineHeight:1}}>{score}</div>
            <div style={{fontSize:10,color:'#737373'}}>/ 100</div>
          </div>
        </div>
        <p style={{fontSize:12,fontWeight:600,color:'#4CB648',marginTop:10}}>Great progress!</p>
        <div style={{display:'flex',justifyContent:'space-between',width:'100%',marginTop:14,paddingTop:14,borderTop:'1px solid #E5E5E5'}}>
          {[['Pre','6','#A8E063'],['Pro','4','#2DAA6E'],['Post','3','#F5A623']].map(([l,n,c])=>(
            <div key={l} style={{flex:1,textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:700,color:c}}>{n}</div>
              <div style={{fontSize:9,color:'#737373'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>onTab('log')} style={{marginTop:16,width:'100%',padding:'14px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:14,border:'none'}}>＋ Log a Meal</button>

      <div style={{marginTop:24}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373',margin:'0 0 10px'}}>Today's meals</p>
        {[['Breakfast','Oats, berries, kefir',82,'#4CB648'],['Lunch','Kimchi grain bowl',76,'#2DAA6E']].map(([m,d,s,c])=>(
          <div key={m} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px solid #E5E5E5',borderRadius:14,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{m}</div>
              <div style={{fontSize:11,color:'#737373'}}>{d}</div>
            </div>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:22,fontWeight:700,color:c}}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogMealScreen({ onBack, onScore }) {
  const [meal, setMeal] = React.useState('');
  return (
    <div style={{padding:'16px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',padding:0}}>←</button>
        <div style={{fontFamily:'Lora, Georgia, serif',fontSize:20,fontWeight:600}}>Log a meal</div>
      </div>
      <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373'}}>Describe what you ate</p>
      <textarea value={meal} onChange={e=>setMeal(e.target.value)} placeholder="e.g. Kimchi grain bowl with brown rice, avocado, and soft-boiled egg" style={{width:'100%',minHeight:120,padding:14,borderRadius:16,border:'1px solid #E5E5E5',fontFamily:'inherit',fontSize:13,resize:'none',marginTop:8}}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
        <button style={{padding:'14px',borderRadius:14,border:'1px dashed #E5E5E5',background:'#FAFAFA',fontSize:12,color:'#737373'}}>📷 Photo</button>
        <button style={{padding:'14px',borderRadius:14,border:'1px dashed #E5E5E5',background:'#FAFAFA',fontSize:12,color:'#737373'}}>🎤 Voice</button>
      </div>

      <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373',marginTop:20}}>Quick add</p>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
        {['Kefir','Kimchi','Oats','Berries','Lentils','Miso'].map(t=>
          <span key={t} style={{padding:'6px 12px',borderRadius:9999,border:'1px solid #E5E5E5',fontSize:12,color:'#0A0A0A'}}>+ {t}</span>)}
      </div>

      <button onClick={onScore} style={{marginTop:24,width:'100%',padding:'14px',borderRadius:9999,background:GRADIENT,color:'#fff',fontWeight:600,fontSize:14,border:'none'}}>Analyze meal →</button>
    </div>
  );
}

function ScoreScreen({ onBack }) {
  return (
    <div style={{padding:'16px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',padding:0}}>←</button>
        <div style={{fontFamily:'Lora, Georgia, serif',fontSize:20,fontWeight:600}}>Meal scored</div>
      </div>
      <div style={{textAlign:'center',padding:'18px 0 8px'}}>
        <div style={{fontFamily:'Lora, Georgia, serif',fontSize:72,fontWeight:700,background:GRADIENT,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>84</div>
        <div style={{fontSize:12,color:'#737373'}}>Biotics Score</div>
        <p style={{fontSize:13,color:'#0A0A0A',marginTop:12,fontWeight:500}}>Strong pre + pro meal. Great fiber diversity.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:18}}>
        {[['Pre','8','#A8E063'],['Pro','9','#2DAA6E'],['Post','6','#F5A623']].map(([l,n,c])=>(
          <div key={l} style={{border:'1px solid #E5E5E5',borderRadius:14,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontFamily:'Lora, Georgia, serif',fontSize:26,fontWeight:700,color:c}}>{n}</div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <p style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#737373',marginTop:22}}>Ingredients detected</p>
      <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:6}}>
        {[['Kimchi','Pro','#2DAA6E'],['Brown rice','Pre','#A8E063'],['Avocado','Pre','#A8E063'],['Egg','—','#737373']].map(([n,t,c])=>(
          <div key={n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:12,border:'1px solid #E5E5E5'}}>
            <span style={{fontSize:13}}>{n}</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'.1em',color:c}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBar({ tab, onTab }) {
  const tabs = [['home','⌂'],['log','＋'],['food','🍃'],['account','◉']];
  return (
    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #E5E5E5',padding:'10px 20px 22px',display:'flex',justifyContent:'space-around'}}>
      {tabs.map(([k,l])=>
        <button key={k} onClick={()=>onTab(k)} style={{background:'none',border:'none',fontSize:18,color:tab===k?'#4CB648':'#A3A3A3',cursor:'pointer'}}>{l}</button>)}
    </div>
  );
}

Object.assign(window, { Phone, HomeScreen, LogMealScreen, ScoreScreen, TabBar });
