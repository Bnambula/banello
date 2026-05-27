import Head from 'next/head'
import { useState, useEffect, useRef, FormEvent } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { login, authenticated } = useAuth()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [warning, setWarning]       = useState('')
  const [retryAfter, setRetryAfter] = useState(0)
  const [remaining, setRemaining]   = useState<number | null>(null)
  const [shake, setShake]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (authenticated) {
      const slug = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ops-centre-bg2026'
      window.location.href = `/${slug}`
    }
  }, [authenticated])

  // Countdown timer for rate-limited lockout
  useEffect(() => {
    if (retryAfter <= 0) return
    timerRef.current = setInterval(() => {
      setRetryAfter(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [retryAfter])

  useEffect(() => { emailRef.current?.focus() }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (retryAfter > 0) return

    setError('')
    setWarning('')
    setLoading(true)

    const result = await login(email.trim(), password)
    setLoading(false)

    if (!result.success) {
      // Trigger shake animation
      setShake(true)
      setTimeout(() => setShake(false), 600)

      if (result.retryAfter && result.retryAfter > 0) {
        setRetryAfter(result.retryAfter)
        setError(`Too many login attempts. Locked for ${result.retryAfter} seconds.`)
      } else {
        setError(result.error || 'Invalid credentials')
        if (result.remainingAttempts !== undefined && result.remainingAttempts <= 3) {
          setWarning(`${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`)
          setRemaining(result.remainingAttempts)
        }
      }
    }
  }

  const isLocked = retryAfter > 0
  const lockPct  = isLocked ? Math.min(100, (retryAfter / 900) * 100) : 0

  return (
    <>
      <Head>
        <title>Sign in — Banello</title>
        <meta name="robots" content="noindex,nofollow"/>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1C3A28 0%, #2D5A3D 50%, #1C3A28 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Decorative background circles */}
        <div style={{ position:'fixed', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(232,184,75,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'fixed', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(168,197,176,0.04)', pointerEvents:'none' }}/>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          animation: shake ? 'shake 0.5s ease' : undefined,
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
            @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
            @keyframes spin { to{transform:rotate(360deg)} }
            @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
            * { box-sizing:border-box; margin:0; padding:0; }
            input:-webkit-autofill { -webkit-box-shadow:0 0 0 30px white inset !important; }
          `}</style>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:28, animation:'fadeInUp 0.4s ease' }}>
            <div style={{ width:52, height:52, background:'#E8B84B', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 8px 24px rgba(232,184,75,0.4)' }}>
              <svg width="30" height="18" viewBox="0 0 22 14" fill="none">
                <path d="M2 11 Q11 1 20 6" stroke="#1C3A28" strokeWidth="3.5" strokeLinecap="round"/>
                <circle cx="2" cy="11" r="1.8" fill="#1C3A28"/>
              </svg>
            </div>
            <div style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:22, color:'#E8B84B', letterSpacing:1 }}>banello</div>
            <div style={{ fontSize:11, color:'rgba(168,197,176,0.7)', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:3 }}>Operations centre</div>
          </div>

          {/* Form card */}
          <div style={{ background:'#fff', borderRadius:20, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'fadeInUp 0.4s ease 0.05s both' }}>

            <h1 style={{ fontSize:18, fontWeight:600, color:'#1C3A28', marginBottom:6 }}>Sign in to your account</h1>
            <p style={{ fontSize:12, color:'#9E9E9E', marginBottom:22, lineHeight:1.5 }}>
              Authorised personnel only. All login attempts are logged.
            </p>

            {/* Lockout banner */}
            {isLocked && (
              <div style={{ background:'#FFF3E0', border:'1px solid #FFB74D', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>🔒</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#E65100' }}>Account temporarily locked</div>
                    <div style={{ fontSize:11, color:'#BF360C', marginTop:2 }}>Too many failed attempts. Try again in <strong>{retryAfter}s</strong></div>
                  </div>
                </div>
                {/* Countdown progress bar */}
                <div style={{ height:4, background:'#FFCC80', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'#E65100', borderRadius:2, width:`${100 - lockPct}%`, transition:'width 1s linear' }}/>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && !isLocked && (
              <div style={{ background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'flex-start' }}>
                <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>⚠</span>
                <div>
                  <div style={{ fontSize:13, color:'#C62828', fontWeight:500 }}>{error}</div>
                  {warning && <div style={{ fontSize:11, color:'#E53935', marginTop:3 }}>{warning}</div>}
                </div>
              </div>
            )}

            {/* Remaining attempts indicator */}
            {remaining !== null && remaining > 0 && !isLocked && (
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < (5 - remaining) ? '#EF5350' : '#E0E0E0' }}/>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#616161', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>
                  Email address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@banello.ug"
                  required
                  autoComplete="email"
                  disabled={isLocked || loading}
                  style={{
                    width:'100%', padding:'12px 14px',
                    border: `1.5px solid ${error && !isLocked ? '#EF5350' : '#E0E0E0'}`,
                    borderRadius:10, fontSize:14,
                    fontFamily:"'DM Sans', sans-serif",
                    color:'#212121', background:'#fff',
                    outline:'none', transition:'border-color 0.15s',
                    opacity: isLocked || loading ? 0.6 : 1,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1C3A28' }}
                  onBlur={e => { e.target.style.borderColor = error && !isLocked ? '#EF5350' : '#E0E0E0' }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#616161', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={isLocked || loading}
                    style={{
                      width:'100%', padding:'12px 44px 12px 14px',
                      border: `1.5px solid ${error && !isLocked ? '#EF5350' : '#E0E0E0'}`,
                      borderRadius:10, fontSize:14,
                      fontFamily:"'DM Sans', sans-serif",
                      color:'#212121', background:'#fff',
                      outline:'none', transition:'border-color 0.15s',
                      opacity: isLocked || loading ? 0.6 : 1,
                    }}
                    onFocus={e => { e.target.style.borderColor = '#1C3A28' }}
                    onBlur={e => { e.target.style.borderColor = error && !isLocked ? '#EF5350' : '#E0E0E0' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'#9E9E9E', padding:4 }}
                    tabIndex={-1}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || isLocked || !email || !password}
                style={{
                  width:'100%', padding:'13px', borderRadius:10,
                  background: isLocked ? '#E0E0E0' : '#1C3A28',
                  color: isLocked ? '#9E9E9E' : '#fff',
                  border:'none', fontSize:14, fontWeight:600,
                  fontFamily:"'DM Sans', sans-serif",
                  cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all 0.2s',
                  opacity: !email || !password ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                    Signing in…
                  </>
                ) : isLocked ? (
                  `Locked — ${retryAfter}s`
                ) : (
                  'Sign in to Banello'
                )}
              </button>
            </form>

            {/* Security notice */}
            <div style={{ marginTop:18, padding:'10px 12px', background:'#F5F5F5', borderRadius:8, display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>🔐</span>
              <div style={{ fontSize:11, color:'#757575', lineHeight:1.5 }}>
                This portal is for authorised Banello staff only. Unauthorised access attempts are logged and reported. Max 5 attempts per 15 minutes.
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'rgba(168,197,176,0.5)', letterSpacing:'0.04em' }}>
            Banello Fresh Produce Ltd · Kampala, Uganda
          </div>
        </div>
      </div>
    </>
  )
}
