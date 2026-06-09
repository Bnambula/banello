import Head from 'next/head'
import{useState,useEffect,useRef,FormEvent}from'react'

export default function LoginPage(){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[showPwd,setShowPwd]=useState(false)
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState('')
  const[warning,setWarning]=useState('')
  const[retryAfter,setRetryAfter]=useState(0)
  const[remaining,setRemaining]=useState<number|null>(null)
  const[shake,setShake]=useState(false)
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const emailRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{emailRef.current?.focus()},[])

  useEffect(()=>{
    if(retryAfter<=0)return
    timerRef.current=setInterval(()=>{
      setRetryAfter(p=>{
        if(p<=1){if(timerRef.current)clearInterval(timerRef.current);setError('');return 0}
        return p-1
      })
    },1000)
    return()=>{if(timerRef.current)clearInterval(timerRef.current)}
  },[retryAfter])

  async function handleSubmit(e:FormEvent){
    e.preventDefault()
    if(retryAfter>0)return
    setError('');setWarning('');setLoading(true)
    try{
      const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email:email.trim(),password})})
      const data=await res.json()
      setLoading(false)
      if(res.status===429){
        setShake(true);setTimeout(()=>setShake(false),600)
        setRetryAfter(data.retryAfter||900)
        setError(data.message||'Too many attempts. Please wait.')
        return
      }
      if(!res.ok){
        setShake(true);setTimeout(()=>setShake(false),600)
        setError(data.message||'Invalid email or password')
        if(data.remainingAttempts!==undefined&&data.remainingAttempts<=3){setWarning(data.warning||'');setRemaining(data.remainingAttempts)}
        return
      }
      const slug=process.env.NEXT_PUBLIC_ADMIN_SLUG||'admin'
      window.location.href=`/${slug}`
    }catch{
      setLoading(false)
      setError('Network error. Please check your connection.')
    }
  }

  const isLocked=retryAfter>0
  const G={green:'#1C3A28',yellow:'#E8B84B',mist:'#A8C5B0',pale:'#EAF3EE',red:'#B71C1C',redL:'#FFEBEE',gray:'#9E9E9E',g200:'#E0E0E0',g600:'#616161'}

  return(
    <>
      <Head>
        <title>Sign in — Banello</title>
        <meta name="robots" content="noindex,nofollow"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#1C3A28 0%,#2D5A3D 60%,#1C3A28 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus{outline:none;border-color:#4A7A5A!important;box-shadow:0 0 0 3px rgba(74,122,90,0.15)!important}
      `}</style>

      <div style={{position:'fixed',top:-80,right:-80,width:280,height:280,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:-60,left:-60,width:200,height:200,borderRadius:'50%',background:'rgba(168,197,176,0.04)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:400,animation:shake?'shake 0.5s ease':undefined}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28,animation:'fadeUp 0.4s ease'}}>
          <div style={{width:54,height:54,background:G.yellow,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 8px 24px rgba(232,184,75,0.4)'}}>
            <svg width="30" height="18" viewBox="0 0 22 14" fill="none">
              <path d="M2 11 Q11 1 20 6" stroke="#1C3A28" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="2" cy="11" r="1.8" fill="#1C3A28"/>
            </svg>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.yellow,letterSpacing:1}}>banello</div>
          <div style={{fontSize:10,color:'rgba(168,197,176,0.7)',letterSpacing:'0.14em',textTransform:'uppercase',marginTop:3}}>Operations centre</div>
        </div>

        {/* Card */}
        <div style={{background:'#fff',borderRadius:20,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.2)',animation:'fadeUp 0.4s ease 0.05s both'}}>
          <h1 style={{fontSize:18,fontWeight:600,color:G.green,marginBottom:5}}>Sign in</h1>
          <p style={{fontSize:12,color:G.gray,marginBottom:20,lineHeight:1.5}}>Authorised staff only. All attempts are logged and monitored.</p>

          {/* Lockout */}
          {isLocked&&(
            <div style={{background:'#FFF3E0',border:'1px solid #FFB74D',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:18}}>🔒</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#E65100'}}>Account temporarily locked</div>
                  <div style={{fontSize:11,color:'#BF360C',marginTop:2}}>Too many failed attempts. Try again in <strong>{retryAfter}s</strong></div>
                </div>
              </div>
              <div style={{height:4,background:'#FFCC80',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',background:'#E65100',borderRadius:2,width:`${Math.max(0,100-(retryAfter/900)*100)}%`,transition:'width 1s linear'}}/>
              </div>
            </div>
          )}

          {/* Error */}
          {error&&!isLocked&&(
            <div style={{background:G.redL,border:'1px solid #FFCDD2',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',gap:8}}>
              <span style={{fontSize:16,flexShrink:0}}>⚠</span>
              <div>
                <div style={{fontSize:13,color:G.red,fontWeight:500}}>{error}</div>
                {warning&&<div style={{fontSize:11,color:'#E53935',marginTop:3}}>{warning}</div>}
              </div>
            </div>
          )}

          {/* Attempt indicators */}
          {remaining!==null&&remaining>0&&!isLocked&&(
            <div style={{display:'flex',gap:5,marginBottom:12}}>
              {[...Array(5)].map((_,i)=>(
                <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<(5-remaining)?'#EF5350':'#E0E0E0'}}/>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>Email address</label>
              <input ref={emailRef} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@banello.ug" required autoComplete="email" disabled={isLocked||loading}
                style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${error&&!isLocked?'#EF5350':G.g200}`,borderRadius:10,fontSize:14,color:'#212121',background:'#fff',transition:'border-color 0.15s',opacity:isLocked||loading?0.6:1}}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" disabled={isLocked||loading}
                  style={{width:'100%',padding:'12px 44px 12px 14px',border:`1.5px solid ${error&&!isLocked?'#EF5350':G.g200}`,borderRadius:10,fontSize:14,color:'#212121',background:'#fff',opacity:isLocked||loading?0.6:1}}/>
                <button type="button" onClick={()=>setShowPwd(p=>!p)} tabIndex={-1} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',cursor:'pointer',fontSize:16,color:G.gray,padding:4}}>
                  {showPwd?'🙈':'👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading||isLocked||!email||!password}
              style={{width:'100%',padding:13,borderRadius:10,background:isLocked?G.g200:G.green,color:isLocked?G.gray:'#fff',border:'none',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.2s',opacity:!email||!password?0.7:1,cursor:loading||isLocked?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {loading?(<><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/> Signing in…</>):isLocked?`Locked — ${retryAfter}s`:'Sign in to Banello'}
            </button>
          </form>

          <div style={{marginTop:16,padding:'10px 12px',background:'#F5F5F5',borderRadius:8,display:'flex',gap:8,alignItems:'flex-start'}}>
            <span style={{fontSize:14,flexShrink:0}}>🔐</span>
            <div style={{fontSize:11,color:'#757575',lineHeight:1.5}}>Max 5 attempts per 15 minutes. Progressive lockout applies. All login events are recorded.</div>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:'rgba(168,197,176,0.5)'}}>Banello Fresh Produce Ltd · Kampala, Uganda</div>
      </div>
    </>
  )
}
