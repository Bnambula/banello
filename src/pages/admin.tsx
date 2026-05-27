// ============================================================
// BANELLO — Admin Portal
// Route: /[ADMIN_SLUG] — hidden from public website
// Protected by middleware.ts (JWT + IP allowlist)
// ============================================================

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  expenses, sales, farmers, stockBatches,
  financialSummary, categoryLabels, paymentLabels,
  products, type Expense, type Sale, type Category, type PaymentMethod, type Channel
} from '../data/store'
import { fmtUGX, fmtDate, fmtPct, calcBatchMargin, downloadCSV } from '../utils/format'

// Mock rider pool — in production from users table WHERE role='rider'
const RIDERS = [
  { id:'R001', name:'David Kato',  zone:'Ntinda / Kiwatule',    deliveries:62, rating:4.8, status:'available' },
  { id:'R002', name:'Jane Mukasa', zone:'Kololo / Naguru',      deliveries:108, rating:4.9, status:'on-run' },
  { id:'R003', name:'Moses Ringo', zone:'Muyenga / Bugolobi',   deliveries:44, rating:4.6, status:'available' },
  { id:'R004', name:'Ruth Aber',   zone:'CBD / Nakasero',       deliveries:31, rating:4.7, status:'off-duty' },
]

type AdminPage = 'overview' | 'orders' | 'dispatch' | 'stock' | 'costs' | 'financials' | 'farmers' | 'customers' | 'reports' | 'settings'

function clsx(...args: (string | boolean | undefined)[]) { return args.filter(Boolean).join(' ') }

function formatTime(s: string) { return new Date(s).toLocaleTimeString('en-UG', { hour:'2-digit', minute:'2-digit' }) }

// ─── SVG ICONS ────────────────────────────────────────────────
const Icon = {
  Grid:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Cart:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Bike:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>,
  Box:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Receipt:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Chart:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Users:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Leaf:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M2 2s5 0 12 7c0 0-8 3-10 9 0 0 5-2 9-7"/><path d="M22 2S17 2 10 9c0 0 8 3 10 9 0 0-5-2-9-7"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Cog:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  LogOut:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

const NAV_ITEMS: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id:'overview',   label:'Overview',    icon:<Icon.Grid/> },
  { id:'orders',     label:'Orders',      icon:<Icon.Cart/> },
  { id:'dispatch',   label:'Dispatch',    icon:<Icon.Bike/> },
  { id:'stock',      label:'Stock',       icon:<Icon.Box/> },
  { id:'costs',      label:'Costs',       icon:<Icon.Receipt/> },
  { id:'financials', label:'Financials',  icon:<Icon.Chart/> },
  { id:'customers',  label:'Customers',   icon:<Icon.Users/> },
  { id:'farmers',    label:'Farmers',     icon:<Icon.Leaf/> },
  { id:'reports',    label:'Reports',     icon:<Icon.Download/> },
  { id:'settings',   label:'Settings',    icon:<Icon.Cog/> },
]

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    confirmed:  { bg:'#E8F5E9', color:'#1B5E20' },
    pending:    { bg:'#FFF3E0', color:'#E65100' },
    overdue:    { bg:'#FFEBEE', color:'#B71C1C' },
    dispatched: { bg:'#E3F2FD', color:'#1565C0' },
    delivered:  { bg:'#E8F5E9', color:'#1B5E20' },
    packed:     { bg:'#EDE9FE', color:'#5B21B6' },
    available:  { bg:'#E8F5E9', color:'#1B5E20' },
    'on-run':   { bg:'#E3F2FD', color:'#1565C0' },
    'off-duty': { bg:'#F5F5F5', color:'#757575' },
    'in-stock': { bg:'#E8F5E9', color:'#1B5E20' },
    sold:       { bg:'#F5F5F5', color:'#757575' },
  }
  const c = map[status] || { bg:'#F5F5F5', color:'#757575' }
  return (
    <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-',' ')}
    </span>
  )
}

function StmtRow({ label, value, indent=false, subtotal=false, total=false, positive=false, negative=false }: { label:string;value:string;indent?:boolean;subtotal?:boolean;total?:boolean;positive?:boolean;negative?:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding: total?'10px 16px':subtotal?'6px 0':'5px 0', paddingLeft: indent?12:0, borderTop: total?'2px solid #4A7A5A':subtotal?'1px solid #E0E0E0':undefined, marginTop:subtotal?4:undefined, background:total?'#EAF3EE':undefined, margin:total?'0 -16px':undefined, fontWeight:total||subtotal?700:400, fontSize:total?15:13, borderRadius:total?0:4 }}>
      <span style={{ color:indent?'#616161':'#424242', flex:1 }}>{label}</span>
      <span style={{ fontFamily:'monospace', fontSize:13, color:positive?'#1B5E20':negative?'#B71C1C':'#424242', fontWeight:subtotal||total?700:500 }}>{value}</span>
    </div>
  )
}

function ProgressBar({ label, value, max, color, display }: { label:string;value:number;max:number;color:string;display:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
      <span style={{ fontSize:11, color:'#616161', width:110, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:5, background:'#EEEEEE', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min(100,(value/max)*100)}%`, background:color, borderRadius:3 }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, width:70, textAlign:'right' }}>{display}</span>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [page, setPage]             = useState<AdminPage>('overview')
  const [sideOpen, setSideOpen]     = useState(true)
  const [toast, setToast]           = useState('')
  const [toastShow, setToastShow]   = useState(false)
  const [riderAssign, setRiderAssign] = useState<Record<string, string>>({})
  const [localExpenses, setLocalExpenses] = useState(expenses)
  const [newExp, setNewExp]         = useState({ category:'stock-banana', amount:'', date: new Date().toISOString().split('T')[0], description:'', method:'mtn-momo', attach:'', ref:'', supplier:'' })
  const [finTab, setFinTab]         = useState<'pl'|'bs'|'cf'>('pl')
  const [orderFilter, setOrderFilter] = useState('all')

  function showToast(msg: string) {
    setToast(msg); setToastShow(true)
    setTimeout(() => setToastShow(false), 2800)
  }

  function assignRider(orderId: string, riderId: string) {
    setRiderAssign(p => ({ ...p, [orderId]: riderId }))
    const rider = RIDERS.find(r => r.id === riderId)
    if (rider) showToast(`✓ ${rider.name} assigned — WhatsApp sent with delivery list`)
  }

  function logExpense() {
    if (!newExp.amount || !newExp.description) { showToast('Please fill amount and description'); return }
    const e: Expense = {
      id: `E${Date.now()}`,
      date: newExp.date,
      category: newExp.category as Category,
      description: newExp.description,
      amount: parseFloat(newExp.amount),
      paymentMethod: newExp.method as PaymentMethod,
      paymentRef: newExp.ref || undefined,
      attachedToBatch: newExp.attach || undefined,
      supplier: newExp.supplier || undefined,
      isRecurring: false,
      createdAt: new Date().toISOString(),
    }
    setLocalExpenses(p => [e, ...p])
    setNewExp(p => ({ ...p, amount:'', description:'', ref:'', supplier:'' }))
    showToast(`Cost of UGX ${fmtUGX(parseFloat(newExp.amount))} saved`)
  }

  const filteredSales = orderFilter === 'all' ? sales : sales.filter(s => s.status === orderFilter)
  const totalExp = localExpenses.reduce((s,e) => s+e.amount, 0)

  // Styles
  const S = {
    app:     { display:'flex', height:'100vh', fontFamily:"'DM Sans',-apple-system,sans-serif", fontSize:13, color:'#212121', background:'#F5F5F5' } as React.CSSProperties,
    sidebar: { width: sideOpen ? 220 : 60, background:'#1C3A28', flexShrink:0, display:'flex', flexDirection:'column' as const, transition:'width 0.2s', overflow:'hidden' },
    logo:    { padding:'16px 14px', borderBottom:'0.5px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10, flexShrink:0 } as React.CSSProperties,
    nav:     { flex:1, padding:'8px 0', overflowY:'auto' as const },
    navItem: (active:boolean): React.CSSProperties => ({ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', cursor:'pointer', background:active?'rgba(232,184,75,0.12)':'transparent', borderLeft:`3px solid ${active?'#E8B84B':'transparent'}`, color:active?'#E8B84B':'rgba(255,255,255,0.65)', fontSize:13, fontWeight:active?600:400, transition:'all 0.15s', whiteSpace:'nowrap', overflow:'hidden', textDecoration:'none' }),
    main:    { flex:1, display:'flex', flexDirection:'column' as const, overflow:'hidden' },
    topbar:  { background:'#fff', padding:'0 20px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #EEEEEE', flexShrink:0 } as React.CSSProperties,
    content: { flex:1, overflowY:'auto' as const, padding:20 },
    card:    { background:'#fff', borderRadius:12, border:'1px solid #EEEEEE', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:14 } as React.CSSProperties,
    cardP:   { padding:16 } as React.CSSProperties,
    grid2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } as React.CSSProperties,
    grid4:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 } as React.CSSProperties,
    metric:  { background:'#fff', borderRadius:10, border:'1px solid #EEEEEE', padding:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
    mVal:    { fontSize:22, fontWeight:600, letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:3 } as React.CSSProperties,
    mLbl:    { fontSize:11, color:'#9E9E9E' } as React.CSSProperties,
    field:   { marginBottom:12 } as React.CSSProperties,
    label:   { display:'block', fontSize:10, fontWeight:700, color:'#757575', letterSpacing:'0.07em', textTransform:'uppercase' as const, marginBottom:5 } as React.CSSProperties,
    input:   { width:'100%', padding:'10px 12px', border:'1.5px solid #E0E0E0', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#212121', background:'#fff', outline:'none' } as React.CSSProperties,
    listItem: { display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F5F5F5', cursor:'pointer' } as React.CSSProperties,
    tblH:    { background:'#FAFAFA', padding:'7px 12px', textAlign:'left' as const, fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:'#9E9E9E', textTransform:'uppercase' as const, borderBottom:'1px solid #EEEEEE', whiteSpace:'nowrap' as const },
    tblD:    { padding:'9px 12px', borderBottom:'1px solid #F5F5F5', verticalAlign:'middle' as const, fontSize:12 },
    sLabel:  { fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'#9E9E9E', marginBottom:8, marginTop:16 } as React.CSSProperties,
  }

  return (
    <>
      <Head>
        <title>Banello Operations Centre</title>
        <meta name="robots" content="noindex,nofollow"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </Head>
      <div style={S.app}>

        {/* SIDEBAR */}
        <div style={S.sidebar}>
          <div style={S.logo}>
            <div style={{ width:30, height:30, background:'#E8B84B', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="11" viewBox="0 0 22 14" fill="none"><path d="M2 11 Q11 1 20 6" stroke="#1C3A28" strokeWidth="3.5" strokeLinecap="round"/><circle cx="2" cy="11" r="1.8" fill="#1C3A28"/></svg>
            </div>
            {sideOpen && <div><div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'#E8B84B', lineHeight:1 }}>banello</div><div style={{ fontSize:9, color:'rgba(168,197,176,0.6)', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:2 }}>Admin</div></div>}
          </div>

          <nav style={S.nav}>
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <div key={id} style={S.navItem(page===id)} onClick={() => setPage(id)}>
                <span style={{ flexShrink:0 }}>{icon}</span>
                {sideOpen && <span>{label}</span>}
              </div>
            ))}
          </nav>

          <div style={{ padding:'12px 14px', borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => logout()}
              style={{ display:'flex', alignItems:'center', gap:10, color:'rgba(255,255,255,0.5)', background:'transparent', border:'none', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}
            >
              <Icon.LogOut/>
              {sideOpen && 'Sign out'}
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={S.main}>

          {/* TOP BAR */}
          <div style={S.topbar}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => setSideOpen(p=>!p)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'#757575', fontSize:18 }}>☰</button>
              <div style={{ fontSize:14, fontWeight:600, color:'#212121' }}>
                {NAV_ITEMS.find(n=>n.id===page)?.label}
              </div>
              <div style={{ fontSize:11, color:'#BDBDBD' }}>· {new Date().toLocaleDateString('en-UG', { weekday:'long', day:'numeric', month:'long' })}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:12, color:'#757575' }}>{user?.email}</div>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'#E8B84B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#1C3A28' }}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={S.content}>

            {/* ── OVERVIEW ── */}
            {page === 'overview' && (
              <>
                <div style={S.grid4}>
                  {[
                    { n:fmtUGX(financialSummary.revenue.total,true), l:'Revenue (May)', c:'#1C3A28', sub:'+29% vs April' },
                    { n:fmtUGX(financialSummary.netProfit,true), l:'Net profit', c:'#2E7D32', sub:'30% margin' },
                    { n:String(sales.length), l:'Total orders', c:'#1565C0', sub:'15 this period' },
                    { n:'4.7%', l:'Waste rate', c:'#E65100', sub:'Target <5%' },
                  ].map(({ n, l, c, sub }) => (
                    <div key={l} style={{ ...S.metric, borderLeft:`3px solid ${c}` }}>
                      <div style={{ ...S.mVal, color:c }}>{n}</div>
                      <div style={S.mLbl}>{l}</div>
                      <div style={{ fontSize:10, color:c, marginTop:4, fontWeight:500 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>Recent orders</div>
                      <button onClick={() => setPage('orders')} style={{ fontSize:11, color:'#1C3A28', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>View all →</button>
                    </div>
                    {sales.slice(0,5).map(s => (
                      <div key={s.id} style={S.listItem}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:500 }}>{s.customerName}</div>
                          <div style={{ fontSize:10, color:'#9E9E9E' }}>{s.orderNumber} · {fmtDate(s.date,'short')}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#1B5E20' }}>{fmtUGX(s.totalAmount)}</div>
                          <Badge status={s.status}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={S.card}>
                    <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>Rider status</div>
                      <button onClick={() => setPage('dispatch')} style={{ fontSize:11, color:'#1C3A28', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>Dispatch →</button>
                    </div>
                    {RIDERS.map(r => (
                      <div key={r.id} style={S.listItem}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'#C8E6C9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#1C3A28', flexShrink:0 }}>
                          {r.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:500 }}>{r.name}</div>
                          <div style={{ fontSize:10, color:'#9E9E9E' }}>{r.zone}</div>
                        </div>
                        <Badge status={r.status}/>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5' }}><div style={{ fontSize:14, fontWeight:600 }}>KPI performance</div></div>
                  <div style={S.cardP}>
                    <ProgressBar label="Net margin" value={30} max={100} color="#1C3A28" display="30% / 25% ✓"/>
                    <ProgressBar label="Waste rate" value={4.7} max={10} color="#E65100" display="4.7% / 5%"/>
                    <ProgressBar label="Grade A yield" value={76} max={100} color="#1C3A28" display="76% / 70% ✓"/>
                    <ProgressBar label="Same-day pay" value={94} max={100} color="#1C3A28" display="94% / 100%"/>
                    <ProgressBar label="Delivery rating" value={4.6} max={5} color="#1565C0" display="4.6 / 5.0"/>
                  </div>
                </div>
              </>
            )}

            {/* ── ORDERS ── */}
            {page === 'orders' && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                  {['all','confirmed','pending','overdue','dispatched','delivered'].map(f => (
                    <button key={f} onClick={() => setOrderFilter(f)} style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${orderFilter===f?'#1C3A28':'#E0E0E0'}`, background:orderFilter===f?'#1C3A28':'transparent', color:orderFilter===f?'#fff':'#757575', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>
                      {f}
                    </button>
                  ))}
                  <button onClick={() => downloadCSV(sales.map(s=>({ order:s.orderNumber, date:s.date, customer:s.customerName, amount:s.totalAmount, status:s.status })), 'banello-orders.csv')} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:20, border:'1.5px solid #E0E0E0', background:'transparent', color:'#757575', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Export CSV</button>
                </div>
                <div style={S.card}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                      <thead><tr>
                        {['Order','Customer','Date','Channel','Total','Status','Invoice','Action'].map(h => <th key={h} style={S.tblH}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {filteredSales.map(s => (
                          <tr key={s.id} style={{ cursor:'pointer' }}>
                            <td style={{ ...S.tblD, fontFamily:'monospace', color:'#1565C0' }}>{s.orderNumber}</td>
                            <td style={{ ...S.tblD, fontWeight:500 }}>{s.customerName}</td>
                            <td style={{ ...S.tblD, color:'#757575' }}>{fmtDate(s.date,'short')}</td>
                            <td style={S.tblD}><span style={{ fontSize:10, background:'#F5F5F5', borderRadius:4, padding:'2px 6px' }}>{s.channel.replace('-',' ')}</span></td>
                            <td style={{ ...S.tblD, fontWeight:600, color:'#1B5E20' }}>{fmtUGX(s.totalAmount)}</td>
                            <td style={S.tblD}><Badge status={s.status}/></td>
                            <td style={{ ...S.tblD, color:'#9E9E9E', fontSize:11 }}>{s.invoiceNumber || '—'}</td>
                            <td style={S.tblD}><button onClick={() => showToast(`Invoice ${s.invoiceNumber||'generated'} — PDF downloading`)} style={{ fontSize:10, padding:'4px 8px', borderRadius:6, border:'none', background:'#E8F5E9', color:'#1B5E20', cursor:'pointer', fontWeight:600 }}>Invoice</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── DISPATCH ── */}
            {page === 'dispatch' && (
              <>
                <div style={S.grid2}>
                  {RIDERS.map(r => (
                    <div key={r.id} style={{ ...S.card, borderLeft:`3px solid ${r.status==='available'?'#1C3A28':r.status==='on-run'?'#1565C0':'#9E9E9E'}` }}>
                      <div style={S.cardP}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{ width:40, height:40, borderRadius:'50%', background:'#C8E6C9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#1C3A28' }}>
                            {r.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600 }}>{r.name}</div>
                            <div style={{ fontSize:11, color:'#9E9E9E' }}>{r.zone}</div>
                          </div>
                          <Badge status={r.status}/>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:11, color:'#757575' }}>
                          <span>⭐ {r.rating} rating</span>
                          <span>📦 {r.deliveries} deliveries</span>
                        </div>
                        {r.status === 'available' && (
                          <button onClick={() => showToast(`WhatsApp sent to ${r.name} with today's delivery list`)} style={{ marginTop:10, width:'100%', padding:'8px', borderRadius:8, background:'#1C3A28', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                            📱 Send delivery list via WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5' }}><div style={{ fontSize:14, fontWeight:600 }}>Assign riders to orders</div></div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                      <thead><tr>
                        {['Order','Customer','Zone','Status','Assign rider','Action'].map(h => <th key={h} style={S.tblH}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {sales.filter(s => ['pending','confirmed','packed'].includes(s.status)).slice(0,8).map(s => (
                          <tr key={s.id}>
                            <td style={{ ...S.tblD, fontFamily:'monospace', color:'#1565C0', fontSize:11 }}>{s.orderNumber}</td>
                            <td style={{ ...S.tblD, fontWeight:500 }}>{s.customerName}</td>
                            <td style={{ ...S.tblD, color:'#757575', fontSize:11 }}>{(s as Sale & { deliveryAddress?: string }).deliveryAddress?.split(',')[0] || 'Kampala'}</td>
                            <td style={S.tblD}><Badge status={riderAssign[s.id] ? 'dispatched' : s.status}/></td>
                            <td style={S.tblD}>
                              <select
                                value={riderAssign[s.id] || ''}
                                onChange={e => assignRider(s.id, e.target.value)}
                                style={{ fontSize:11, padding:'5px 8px', borderRadius:6, border:'1px solid #E0E0E0', fontFamily:"'DM Sans',sans-serif", background:'#fff' }}
                              >
                                <option value="">Select rider…</option>
                                {RIDERS.filter(r=>r.status==='available').map(r => <option key={r.id} value={r.id}>{r.name} — {r.zone}</option>)}
                              </select>
                            </td>
                            <td style={S.tblD}>
                              {riderAssign[s.id] && (
                                <button onClick={() => showToast(`Delivery confirmation sent to customer for ${s.orderNumber}`)} style={{ fontSize:10, padding:'4px 8px', borderRadius:6, border:'none', background:'#E3F2FD', color:'#1565C0', cursor:'pointer', fontWeight:600 }}>Notify customer</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── STOCK ── */}
            {page === 'stock' && (
              <>
                <div style={S.grid4}>
                  <div style={{ ...S.metric, borderLeft:'3px solid #1C3A28' }}><div style={{ ...S.mVal, color:'#1C3A28' }}>{stockBatches.reduce((s,b)=>s+b.remainingQty,0)}</div><div style={S.mLbl}>Bunches in stock</div></div>
                  <div style={{ ...S.metric, borderLeft:'3px solid #E65100' }}><div style={{ ...S.mVal, color:'#E65100' }}>{stockBatches.filter(b=>b.wasteQty>0).reduce((s,b)=>s+b.wasteQty,0)}</div><div style={S.mLbl}>Total waste</div></div>
                  <div style={{ ...S.metric, borderLeft:'3px solid #1C3A28' }}><div style={{ ...S.mVal, color:'#1C3A28' }}>76%</div><div style={S.mLbl}>Avg Grade A yield</div></div>
                  <div style={{ ...S.metric, borderLeft:'3px solid #1565C0' }}><div style={{ ...S.mVal, color:'#1565C0' }}>{stockBatches.length}</div><div style={S.mLbl}>Total batches</div></div>
                </div>
                <div style={S.card}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                      <thead><tr>
                        {['Batch','Farmer','District','Purchased','Grade A','Grade B','Grade C','Waste','Remaining','Status','Margin'].map(h=><th key={h} style={S.tblH}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {stockBatches.map(b => {
                          const { margin } = calcBatchMargin(b)
                          return (
                            <tr key={b.id}>
                              <td style={{ ...S.tblD, fontFamily:'monospace', color:'#1565C0', fontSize:11 }}>{b.batchNumber}</td>
                              <td style={{ ...S.tblD, fontWeight:500 }}>{b.farmerName}</td>
                              <td style={{ ...S.tblD, color:'#757575', fontSize:11 }}>{b.farmerId==='F001'?'Bududa':b.farmerId==='F002'?'Manafwa':b.farmerId==='F003'?'Sironko':'Mbale'}</td>
                              <td style={S.tblD}>{b.purchasedQty}</td>
                              <td style={{ ...S.tblD, color:'#1B5E20', fontWeight:600 }}>{b.gradeAQty}</td>
                              <td style={{ ...S.tblD, color:'#1565C0' }}>{b.gradeBQty}</td>
                              <td style={{ ...S.tblD, color:'#9E9E9E' }}>{b.gradeCQty}</td>
                              <td style={{ ...S.tblD, color:'#C62828' }}>{b.wasteQty}</td>
                              <td style={{ ...S.tblD, fontWeight:600 }}>{b.remainingQty}</td>
                              <td style={S.tblD}><Badge status={b.status}/></td>
                              <td style={{ ...S.tblD, color:margin>40?'#1B5E20':'#E65100', fontWeight:600 }}>{fmtPct(margin)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── COSTS ── */}
            {page === 'costs' && (
              <div style={S.grid2}>
                <div>
                  <div style={S.card}>
                    <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5', fontSize:14, fontWeight:600 }}>Log a cost</div>
                    <div style={S.cardP}>
                      <div style={S.field}><label style={S.label}>Category</label><select style={S.input} value={newExp.category} onChange={e=>setNewExp(p=>({...p,category:e.target.value}))}>{Object.entries(categoryLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                        <div><label style={S.label}>Amount (UGX)</label><input type="number" style={S.input} value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} placeholder="0"/></div>
                        <div><label style={S.label}>Date</label><input type="date" style={S.input} value={newExp.date} onChange={e=>setNewExp(p=>({...p,date:e.target.value}))}/></div>
                      </div>
                      <div style={S.field}><label style={S.label}>Description</label><input style={S.input} value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))} placeholder="e.g. Truck Mbale→Kampala, 62 bunches"/></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                        <div><label style={S.label}>Payment method</label><select style={S.input} value={newExp.method} onChange={e=>setNewExp(p=>({...p,method:e.target.value}))}>{Object.entries(paymentLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                        <div><label style={S.label}>Attach to batch</label><select style={S.input} value={newExp.attach} onChange={e=>setNewExp(p=>({...p,attach:e.target.value}))}><option value="">— None —</option>{stockBatches.map(b=><option key={b.id} value={b.id}>Batch {b.batchNumber} — {b.farmerName}</option>)}</select></div>
                      </div>
                      <div style={S.field}><label style={S.label}>Receipt / MoMo ref</label><input style={S.input} value={newExp.ref} onChange={e=>setNewExp(p=>({...p,ref:e.target.value}))} placeholder="e.g. MTN-XK7291"/></div>
                      <button onClick={logExpense} style={{ width:'100%', padding:'11px', borderRadius:8, background:'#1C3A28', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Save cost entry</button>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ ...S.metric, marginBottom:12, borderLeft:'3px solid #C62828' }}><div style={{ ...S.mVal, color:'#C62828' }}>{fmtUGX(totalExp,true)}</div><div style={S.mLbl}>Total costs — {localExpenses.length} entries</div></div>
                  <div style={S.card}>
                    <div style={{ overflowY:'auto', maxHeight:500 }}>
                      {localExpenses.slice(0,20).map(e => (
                        <div key={e.id} style={S.listItem}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:500 }}>{e.description}</div>
                            <div style={{ fontSize:10, color:'#9E9E9E' }}>{fmtDate(e.date,'short')} · {paymentLabels[e.paymentMethod]}{e.attachedToBatch?` · 📎 ${e.attachedToBatch}`:''}</div>
                          </div>
                          <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#C62828' }}>{fmtUGX(e.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FINANCIALS ── */}
            {page === 'financials' && (
              <>
                <div style={{ display:'flex', background:'#F0F0F0', borderRadius:10, padding:3, marginBottom:14, width:'fit-content' }}>
                  {(['pl','bs','cf'] as const).map(t => (
                    <button key={t} onClick={()=>setFinTab(t)} style={{ padding:'8px 20px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background:finTab===t?'#fff':'transparent', color:finTab===t?'#1C3A28':'#9E9E9E', boxShadow:finTab===t?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>
                      {t==='pl'?'P&L':t==='bs'?'Balance sheet':'Cash flow'}
                    </button>
                  ))}
                </div>
                <div style={{ ...S.card, maxWidth:600 }}>
                  <div style={{ background:'#1C3A28', padding:'14px 16px' }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'#E8B84B' }}>
                      {finTab==='pl'?'Statement of Profit or Loss':finTab==='bs'?'Statement of Financial Position':'Statement of Cash Flows'}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(168,197,176,0.8)', marginTop:3 }}>
                      {finTab==='pl'?'Month ended 31 May 2026 · IFRS / IAS 1':finTab==='bs'?'As at 31 May 2026 · IFRS / IAS 1':'Month ended 31 May 2026 · IAS 7 indirect method'}
                    </div>
                    <div style={{ height:2, background:'linear-gradient(90deg,#E8B84B,#D4A830)', marginTop:10, borderRadius:1 }}/>
                  </div>
                  <div style={S.cardP}>
                    {finTab==='pl' && (<>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', color:'#9E9E9E', textTransform:'uppercase', borderBottom:'1px solid #F0F0F0', paddingBottom:4, marginBottom:6 }}>Revenue</div>
                      <StmtRow label="Kampala premium delivery" value={fmtUGX(financialSummary.revenue.kampalaDelivery)} indent positive/>
                      <StmtRow label="Border trade — Malaba / Busia" value={fmtUGX(financialSummary.revenue.borderTrade)} indent positive/>
                      <StmtRow label="Delivery fees" value={fmtUGX(financialSummary.revenue.deliveryFees)} indent positive/>
                      <StmtRow label="Total revenue" value={fmtUGX(financialSummary.revenue.total)} subtotal positive/>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', color:'#9E9E9E', textTransform:'uppercase', borderBottom:'1px solid #F0F0F0', paddingBottom:4, marginBottom:6, marginTop:12 }}>Cost of goods sold</div>
                      <StmtRow label="Stock purchases — banana" value={`(${fmtUGX(financialSummary.cogs.stockBanana)})`} indent negative/>
                      <StmtRow label="Stock purchases — other" value={`(${fmtUGX(financialSummary.cogs.stockOther)})`} indent negative/>
                      <StmtRow label="Gross profit" value={fmtUGX(financialSummary.grossProfit)} subtotal positive/>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', color:'#9E9E9E', textTransform:'uppercase', borderBottom:'1px solid #F0F0F0', paddingBottom:4, marginBottom:6, marginTop:12 }}>Operating expenses</div>
                      <StmtRow label="Transport" value={`(${fmtUGX(financialSummary.operatingExpenses.transportLongHaul)})`} indent negative/>
                      <StmtRow label="Rider commissions" value={`(${fmtUGX(financialSummary.operatingExpenses.riderCommissions)})`} indent negative/>
                      <StmtRow label="Tricycle hire" value={`(${fmtUGX(financialSummary.operatingExpenses.tricycleHire)})`} indent negative/>
                      <StmtRow label="Packaging + other" value={`(${fmtUGX(financialSummary.operatingExpenses.packaging + financialSummary.operatingExpenses.other)})`} indent negative/>
                      <StmtRow label="Waste write-off" value={`(${fmtUGX(financialSummary.operatingExpenses.wasteWriteOff)})`} indent negative/>
                    </>)}
                  </div>
                  <StmtRow label="Profit before tax" value={fmtUGX(financialSummary.profitBeforeTax)} total positive/>
                  <div style={S.cardP}><StmtRow label="Income tax — 30% CIT" value={`(${fmtUGX(financialSummary.corporateIncomeTax)})`} indent negative/></div>
                  <StmtRow label="Net profit for period" value={fmtUGX(financialSummary.netProfit)} total positive/>
                  <div style={{ textAlign:'center', fontSize:10, color:'#BDBDBD', padding:'10px 16px', borderTop:'1px solid #F5F5F5', fontStyle:'italic' }}>
                    Prepared in accordance with IFRS (IAS 1) · Banello Fresh Produce Ltd · TIN: 1234567890
                  </div>
                </div>
              </>
            )}

            {/* ── FARMERS ── */}
            {page === 'farmers' && (
              <div style={S.card}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['Farmer','District','Phone','MoMo','Varieties','Grade A%','Reliability','Lifetime paid','Status'].map(h=><th key={h} style={S.tblH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {farmers.map(f=>(
                        <tr key={f.id}>
                          <td style={{ ...S.tblD, fontWeight:600 }}>{f.name}</td>
                          <td style={{ ...S.tblD, color:'#757575' }}>{f.district}</td>
                          <td style={{ ...S.tblD, fontFamily:'monospace', fontSize:11 }}>{f.phone}</td>
                          <td style={{ ...S.tblD, fontFamily:'monospace', fontSize:11, color:'#E65100' }}>{f.momoNumber}</td>
                          <td style={{ ...S.tblD, fontSize:11 }}>{f.varieties.join(', ')}</td>
                          <td style={{ ...S.tblD, color:'#1B5E20', fontWeight:600 }}>{f.gradeAYield}%</td>
                          <td style={S.tblD}>{f.reliabilityScore}/100</td>
                          <td style={{ ...S.tblD, color:'#1B5E20', fontWeight:600 }}>{fmtUGX(f.totalLifetimePaid,true)}</td>
                          <td style={S.tblD}><Badge status={f.isActive?'active':'review'}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CUSTOMERS ── */}
            {page === 'customers' && (
              <div style={S.card}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['Customer','Type','Orders','Total spend','Last order','Status','Action'].map(h=><th key={h} style={S.tblH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {Array.from(new Map(sales.map(s=>[s.customerName,s])).values()).map(s=>(
                        <tr key={s.customerName}>
                          <td style={{ ...S.tblD, fontWeight:600 }}>{s.customerName}</td>
                          <td style={{ ...S.tblD, textTransform:'capitalize', fontSize:11, color:'#757575' }}>{s.customerType.replace('-',' ')}</td>
                          <td style={S.tblD}>{sales.filter(x=>x.customerName===s.customerName).length}</td>
                          <td style={{ ...S.tblD, fontWeight:600, color:'#1B5E20' }}>{fmtUGX(sales.filter(x=>x.customerName===s.customerName).reduce((t,x)=>t+x.totalAmount,0),true)}</td>
                          <td style={{ ...S.tblD, color:'#757575', fontSize:11 }}>{fmtDate(s.date,'short')}</td>
                          <td style={S.tblD}><Badge status={s.status}/></td>
                          <td style={S.tblD}><button onClick={()=>showToast(`WhatsApp opened for ${s.customerName}`)} style={{ fontSize:10, padding:'4px 8px', borderRadius:6, border:'none', background:'#E8F5E9', color:'#1B5E20', cursor:'pointer', fontWeight:600 }}>WhatsApp</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── REPORTS ── */}
            {page === 'reports' && (
              <div style={S.grid2}>
                {[
                  { icon:'📊', title:'P&L statement — May 2026', meta:'IFRS / IAS 1 · PDF', action:'Download', color:'#E8F5E9' },
                  { icon:'⚖️', title:'Balance sheet — May 2026', meta:'IFRS / IAS 1 · PDF', action:'Download', color:'#E3F2FD' },
                  { icon:'💧', title:'Cash flow — May 2026', meta:'IAS 7 · PDF', action:'Download', color:'#E8F5E9' },
                  { icon:'🌿', title:'Farmer payment ledger', meta:'All 8 farmers · CSV', action:'Export CSV', color:'#FDF4DC' },
                  { icon:'💸', title:'Full expense ledger', meta:'All entries · CSV', action:'Export CSV', color:'#FFEBEE' },
                  { icon:'🏛', title:'URA VAT return Q1 2026', meta:'Pre-filled · Due in 8 days', action:'File now', color:'#E8EAF6' },
                  { icon:'📦', title:'Stock batch analysis', meta:'All batches · CSV', action:'Export CSV', color:'#FDF4DC' },
                  { icon:'🌍', title:'Impact report', meta:'Farmer payments · PDF', action:'Download', color:'#EDE9FE' },
                ].map(({ icon, title, meta, action, color })=>(
                  <div key={title} onClick={()=>showToast(`${title} — downloading`)} style={{ ...S.card, display:'flex', alignItems:'center', gap:12, padding:14, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{title}</div>
                      <div style={{ fontSize:11, color:'#9E9E9E' }}>{meta}</div>
                    </div>
                    <div style={{ fontSize:11, color:'#1C3A28', fontWeight:600, display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>{action} →</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SETTINGS ── */}
            {page === 'settings' && (
              <div style={{ maxWidth:500 }}>
                <div style={S.card}>
                  <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5', fontSize:14, fontWeight:600 }}>Business profile</div>
                  <div style={S.cardP}>
                    <div style={S.field}><label style={S.label}>Business name</label><input style={S.input} defaultValue="Banello Fresh Produce Ltd"/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <div><label style={S.label}>TIN</label><input style={S.input} defaultValue="1234567890"/></div>
                      <div><label style={S.label}>Reg. number</label><input style={S.input} defaultValue="BF-2026-001"/></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div><label style={S.label}>Accounting standard</label><select style={S.input}><option>IFRS (full)</option><option>IFRS for SMEs</option></select></div>
                      <div><label style={S.label}>Financial year end</label><select style={S.input}><option>30 June</option><option>31 December</option></select></div>
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ ...S.cardP, borderBottom:'1px solid #F5F5F5', fontSize:14, fontWeight:600 }}>Admin portal security</div>
                  <div style={S.cardP}>
                    <div style={{ padding:'10px 12px', background:'#E8F5E9', borderRadius:8, fontSize:12, color:'#1B5E20', marginBottom:10, display:'flex', gap:8, alignItems:'flex-start' }}>
                      <span>🔐</span>
                      <div>Admin URL slug: <strong style={{ fontFamily:'monospace' }}>{process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ops-centre-bg2026'}</strong> — set ADMIN_PATH_SLUG in Vercel env vars to change.</div>
                    </div>
                    <div style={{ padding:'10px 12px', background:'#FFF3E0', borderRadius:8, fontSize:12, color:'#E65100' }}>
                      🌐 IP allowlist: Add ADMIN_ALLOWED_IPS to Vercel env vars (comma-separated). Leave empty to disable IP restriction.
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* TOAST */}
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:`translateX(-50%) translateY(${toastShow?0:16}px)`, opacity:toastShow?1:0, background:'#212121', color:'#fff', padding:'10px 20px', borderRadius:99, fontSize:12, fontWeight:500, zIndex:9999, transition:'all 0.2s', pointerEvents:'none', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      </div>
    </>
  )
}
