import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { expenses, sales, farmers, stockBatches, financialSummary, categoryLabels, paymentLabels, products } from '../data/store'
import { fmtUGX, fmtDate, fmtPct, calcBatchMargin, totalExpenses, getStatusColor, downloadCSV } from '../utils/format'

type Page = 'home' | 'costs' | 'sales' | 'financials' | 'reports' | 'ura' | 'settings' | 'farmers' | 'stock'
type FinTab = 'pl' | 'bs' | 'cf'
type SaleTab = 'kampala' | 'border' | 'all'

function clsx(...args: (string | boolean | undefined)[]): string {
  return args.filter(Boolean).join(' ')
}

// ─── SVG ICONS ────────────────────────────────────────────────
const Icon = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  File: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
}

// ─── LOGO SVG ─────────────────────────────────────────────────
function BanelloLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.64)} viewBox="0 0 22 14" fill="none">
      <path d="M2 11 Q11 1 20 6" stroke="#1C3A28" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="2" cy="11" r="1.8" fill="#1C3A28"/>
    </svg>
  )
}

// ─── BAR CHART ────────────────────────────────────────────────
function BarChart() {
  const data = financialSummary.weeklyData
  const maxVal = Math.max(...data.map(d => d.revenue))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90, paddingBottom:20, position:'relative' }}>
      {data.map((d, i) => {
        const rh = Math.max(4, Math.round((d.revenue / maxVal) * 68))
        const ch = Math.max(4, Math.round((d.costs / maxVal) * 68))
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:68, width:'100%' }}>
              <div style={{ flex:1, height:rh, background:'#1C3A28', borderRadius:'3px 3px 0 0', minHeight:4 }}/>
              <div style={{ flex:1, height:ch, background:'#E8B84B', borderRadius:'3px 3px 0 0', minHeight:4 }}/>
            </div>
            <span style={{ fontSize:9, color:'#9E9E9E', fontWeight:500 }}>{d.week}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────
function ProgressBar({ label, value, max, color, display }: { label:string; value:number; max:number; color:string; display:string }) {
  const pct = Math.min(100, (value/max)*100)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <span style={{ fontSize:11, color:'#616161', width:90, flexShrink:0, fontWeight:500 }}>{label}</span>
      <div style={{ flex:1, height:6, background:'#EEEEEE', borderRadius:999, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, transition:'width 0.6s' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, width:70, textAlign:'right', flexShrink:0, color }}>{display}</span>
    </div>
  )
}

// ─── STMT ROW ─────────────────────────────────────────────────
function StmtRow({ label, value, indent=false, indent2=false, subtotal=false, total=false, positive=false, negative=false }: {
  label:string; value:string; indent?:boolean; indent2?:boolean; subtotal?:boolean; total?:boolean; positive?:boolean; negative?:boolean
}) {
  const style: React.CSSProperties = {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding: total ? '10px 16px' : subtotal ? '6px 0' : '5px 0',
    paddingLeft: indent2 ? 24 : indent ? 12 : 0,
    borderTop: total ? '2px solid #4A7A5A' : subtotal ? '1px solid #E0E0E0' : undefined,
    marginTop: subtotal ? 4 : undefined,
    background: total ? '#EAF3EE' : undefined,
    margin: total ? '0 -16px' : undefined,
    fontWeight: total || subtotal ? 700 : 400,
    fontSize: total ? 15 : 13,
    borderRadius: total ? 0 : 4,
  }
  return (
    <div style={style}>
      <span style={{ color: indent2 ? '#757575' : indent ? '#616161' : '#424242', flex:1 }}>{label}</span>
      <span style={{ fontFamily:'DM Mono, monospace', fontSize:13, color: positive ? '#1B5E20' : negative ? '#B71C1C' : '#424242', fontWeight: subtotal||total ? 700 : 500 }}>{value}</span>
    </div>
  )
}

// ─── BADGE ────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const colorMap: Record<string, { bg:string; color:string }> = {
    confirmed: { bg:'#E8F5E9', color:'#1B5E20' },
    pending:   { bg:'#FFF3E0', color:'#E65100' },
    overdue:   { bg:'#FFEBEE', color:'#B71C1C' },
    partial:   { bg:'#FDF4DC', color:'#7A5500' },
    'in-stock': { bg:'#E8F5E9', color:'#1B5E20' },
    sold:      { bg:'#EEEEEE', color:'#616161' },
    wasted:    { bg:'#FFEBEE', color:'#B71C1C' },
    active:    { bg:'#E8F5E9', color:'#1B5E20' },
    review:    { bg:'#FFF3E0', color:'#E65100' },
  }
  const c = colorMap[status] || { bg:'#EEEEEE', color:'#616161' }
  return (
    <span style={{ display:'inline-block', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:999, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  )
}

// ─── TOAST ────────────────────────────────────────────────────
function Toast({ msg, show }: { msg:string; show:boolean }) {
  return (
    <div style={{
      position:'fixed', bottom:80, left:'50%',
      transform:`translateX(-50%) translateY(${show?0:16}px)`,
      opacity: show ? 1 : 0,
      background:'#212121', color:'#fff',
      padding:'10px 20px', borderRadius:999,
      fontSize:13, fontWeight:500, zIndex:9999,
      transition:'all 0.2s', pointerEvents:'none', whiteSpace:'nowrap'
    }}>{msg}</div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function BanelloPlatform() {
  const [page, setPage] = useState<Page>('home')
  const [finTab, setFinTab] = useState<FinTab>('pl')
  const [saleTab, setSaleTab] = useState<SaleTab>('kampala')
  const [toastMsg, setToastMsg] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const [newExpense, setNewExpense] = useState({ category:'stock-banana', amount:'', date: new Date().toISOString().split('T')[0], description:'', method:'mtn-momo', attach:'', ref:'', supplier:'' })
  const [newSale, setNewSale] = useState({ customer:'', product:'P001', qty:'', price:'17000', method:'mtn-momo', batch:'B061', deliveryFee:'5000' })
  const [localExpenses, setLocalExpenses] = useState(expenses)
  const [localSales, setLocalSales] = useState(sales)
  const [toggle2fa, setToggle2fa] = useState(true)
  const [toggleBackup, setToggleBackup] = useState(true)
  const [toggleAudit, setToggleAudit] = useState(true)
  const [toggleExpiry, setToggleExpiry] = useState(true)
  const [toggleLowStock, setToggleLowStock] = useState(true)
  const [toggleWeeklyPL, setToggleWeeklyPL] = useState(true)

  const toast = useCallback((msg: string) => {
    setToastMsg(msg); setToastShow(true)
    setTimeout(() => setToastShow(false), 2800)
  }, [])

  const navTo = (p: Page) => { setPage(p); window.scrollTo(0,0) }

  const totalExp = totalExpenses(localExpenses)
  const totalRev = localSales.reduce((s,x) => s + x.totalAmount, 0)

  function handleLogExpense() {
    if (!newExpense.amount || !newExpense.description) { toast('Please fill amount and description'); return }
    const e = { ...newExpense, id:`E${Date.now()}`, amount: parseFloat(newExpense.amount), isRecurring:false, createdAt: new Date().toISOString(), attachedToBatch: newExpense.attach||undefined, paymentRef: newExpense.ref||undefined, supplier: newExpense.supplier||undefined } as typeof expenses[0]
    setLocalExpenses(prev => [e, ...prev])
    setNewExpense(p => ({ ...p, amount:'', description:'', ref:'', supplier:'' }))
    toast(`Cost of UGX ${fmtUGX(parseFloat(newExpense.amount))} saved${newExpense.attach ? ` → attached to ${newExpense.attach}` : ''}`)
  }

  function handleLogSale() {
    if (!newSale.customer || !newSale.qty) { toast('Please fill customer and quantity'); return }
    const prod = products.find(p => p.id === newSale.product)!
    const qty = parseFloat(newSale.qty)
    const price = parseFloat(newSale.price)
    const fee = parseFloat(newSale.deliveryFee||'0')
    const s = { id:`S${Date.now()}`, orderNumber:`BNL-${Math.floor(Math.random()*9000)+1000}`, date: new Date().toISOString().split('T')[0], channel:'kampala-premium' as const, customerName: newSale.customer, customerType:'office' as const, items:[{ productId:prod.id, productName:prod.name, grade:'A' as const, qty, unitPrice:price, lineTotal:qty*price }], subtotal:qty*price, deliveryFee:fee, totalAmount:qty*price+fee, paymentMethod: newSale.method as typeof localSales[0]['paymentMethod'], status:'confirmed' as const, linkedBatchId: newSale.batch||undefined, invoiceNumber:`INV-${Math.floor(Math.random()*9000)+1000}` }
    setLocalSales(prev => [s, ...prev])
    setNewSale(p => ({ ...p, customer:'', qty:'' }))
    toast(`Sale of UGX ${fmtUGX(qty*price+fee)} recorded`)
  }

  // ─── NAV ──────────────────────────────────────────────────
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id:'home', label:'Home', icon:<Icon.Home/> },
    { id:'costs', label:'Costs', icon:<Icon.Plus/> },
    { id:'sales', label:'Sales', icon:<Icon.TrendUp/> },
    { id:'financials', label:'Statements', icon:<Icon.Monitor/> },
    { id:'reports', label:'Reports', icon:<Icon.Download/> },
  ]

  return (
    <>
      <Head>
        <title>Banello Business Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
      </Head>

      {/* TOP NAV */}
      <nav className="top-nav sticky-top">
        <div className="brand" onClick={() => navTo('home')}>
          <div className="brand-mark"><BanelloLogo size={22}/></div>
          <div>
            <div className="brand-name">banello</div>
            <div className="brand-tagline">Business platform</div>
          </div>
        </div>
        <div className="nav-actions">
          <button className="icon-btn notif-dot" onClick={() => navTo('reports')} aria-label="Reports">
            <Icon.Bell/>
            <span className="badge"/>
          </button>
          <button className="icon-btn" onClick={() => navTo('settings')} aria-label="Settings">
            <Icon.Settings/>
          </button>
        </div>
      </nav>

      {/* ═══ HOME ═══════════════════════════════════════════ */}
      {page === 'home' && (
        <div className="page">
          <div className="page-inner animate-fadeInUp">
            <div className="hero-card">
              <div className="hero-greeting">May 2026 · Business overview</div>
              <div className="hero-title">Good morning, Banello HQ</div>
              <div className="hero-stats">
                <div><div className="hero-stat-label">Total revenue</div><div className="hero-stat-value">{fmtUGX(financialSummary.revenue.total, true)}</div><div className="hero-stat-sub">UGX · +29% vs April</div></div>
                <div><div className="hero-stat-label">Net profit</div><div className="hero-stat-value">{fmtUGX(financialSummary.netProfit, true)}</div><div className="hero-stat-sub">Margin: {fmtPct(financialSummary.netMargin)}</div></div>
                <div><div className="hero-stat-label">Cash balance</div><div className="hero-stat-value">{fmtUGX(financialSummary.cashBalance, true)}</div><div className="hero-stat-sub">Reserve: 300K minimum</div></div>
                <div><div className="hero-stat-label">Waste rate</div><div className="hero-stat-value">4.7%</div><div className="hero-stat-sub">Target &lt;5% — on track</div></div>
              </div>
            </div>

            <div className="section-label">Quick actions</div>
            <div className="quick-actions stagger">
              {[
                { label:'Log cost', icon:'💸', bg:'#E8F5E9', p:'costs' },
                { label:'Record sale', icon:'📦', bg:'#FDF4DC', p:'sales' },
                { label:'Download', icon:'📥', bg:'#E3F2FD', p:'reports' },
                { label:'URA filing', icon:'🏛', bg:'#E8EAF6', p:'ura' },
                { label:'Farmers', icon:'🌿', bg:'#C8E6C9', p:'farmers' },
                { label:'Stock', icon:'📊', bg:'#FDF4DC', p:'stock' },
                { label:'Statements', icon:'📋', bg:'#EDE9FE', p:'financials' },
                { label:'Settings', icon:'⚙️', bg:'#F5F5F5', p:'settings' },
              ].map(({ label, icon, bg, p }) => (
                <div key={label} className="qa-btn" onClick={() => navTo(p as Page)}>
                  <div className="qa-icon" style={{ background:bg }}>{icon}</div>
                  <div className="qa-label">{label}</div>
                </div>
              ))}
            </div>

            <div className="section-label">Revenue vs costs — 8 weeks</div>
            <div className="chart-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div><div className="card-title">Weekly performance</div><div className="card-subtitle">UGX thousands</div></div>
                <div className="chart-legend">
                  <div className="legend-item"><div className="legend-dot" style={{background:'#1C3A28'}}/> Revenue</div>
                  <div className="legend-item"><div className="legend-dot" style={{background:'#E8B84B'}}/> Costs</div>
                </div>
              </div>
              <BarChart/>
            </div>

            <div className="section-label">Alerts requiring action</div>
            <div className="alert alert-amber"><span className="alert-icon">⚠</span><div className="alert-content"><strong>12 bunches expiring within 24hrs</strong>Batch #049 — reassign to Grade C / juice bar buyers immediately.</div></div>
            <div className="alert alert-blue"><span className="alert-icon">🏛</span><div className="alert-content"><strong>Q1 VAT return due in 8 days</strong>Pre-filled form ready — go to URA Filing section.</div></div>
            <div className="alert alert-red"><span className="alert-icon">🧾</span><div className="alert-content"><strong>INV-0095 overdue 3 days</strong>Stanbic Bank · UGX 120,000 — send reminder now.</div></div>

            <div className="section-label">Recent transactions</div>
            <div className="list-card stagger">
              {[...localSales.slice(0,4)].map(s => (
                <div key={s.id} className="list-item">
                  <div className="list-icon" style={{background:'#E8F5E9', fontSize:15}}>📈</div>
                  <div className="list-info">
                    <div className="list-title">{s.customerName}</div>
                    <div className="list-sub">{fmtDate(s.date)} · {s.channel.replace('-',' ')}</div>
                  </div>
                  <div className="list-right">
                    <div className="list-value income">+{fmtUGX(s.totalAmount)}</div>
                    <Badge status={s.status}/>
                  </div>
                </div>
              ))}
              {localExpenses.slice(0,2).map(e => (
                <div key={e.id} className="list-item">
                  <div className="list-icon" style={{background:'#FFEBEE', fontSize:15}}>📉</div>
                  <div className="list-info">
                    <div className="list-title">{e.description}</div>
                    <div className="list-sub">{fmtDate(e.date)} · {categoryLabels[e.category as keyof typeof categoryLabels]}</div>
                  </div>
                  <div className="list-right">
                    <div className="list-value expense">−{fmtUGX(e.amount)}</div>
                    <Badge status="confirmed"/>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-label">Expense breakdown — May 2026</div>
            <div className="chart-card">
              {[
                { label:'Stock purchase', amount:2290000, color:'#1C3A28', pct:61 },
                { label:'Transport', amount:850000, color:'#4A7A5A', pct:23 },
                { label:'Rider commissions', amount:390000, color:'#A8C5B0', pct:10 },
                { label:'Packaging + other', amount:180000, color:'#E8B84B', pct:6 },
              ].map(({ label, amount, color, pct }) => (
                <ProgressBar key={label} label={label} value={pct} max={100} color={color} display={`${fmtUGX(amount,true)} · ${pct}%`}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ COSTS ══════════════════════════════════════════ */}
      {page === 'costs' && (
        <div className="page">
          <div className="page-inner">
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="metric-card accent-green">
                <div className="metric-value" style={{color:'#B71C1C'}}>{fmtUGX(totalExpenses(localExpenses), true)}</div>
                <div className="metric-label">Total costs — May</div>
              </div>
              <div className="metric-card accent">
                <div className="metric-value">{localExpenses.length}</div>
                <div className="metric-label">Expense entries</div>
              </div>
            </div>

            <div className="section-label">Log a cost</div>
            <div className="form-card">
              <div className="field">
                <label>Cost category</label>
                <select value={newExpense.category} onChange={e => setNewExpense(p=>({...p, category:e.target.value}))}>
                  {Object.entries(categoryLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Amount (UGX)</label>
                  <input type="number" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense(p=>({...p, amount:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={newExpense.date} onChange={e => setNewExpense(p=>({...p, date:e.target.value}))}/>
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <input type="text" placeholder="e.g. Truck Mbale→Kampala, 62 bunches" value={newExpense.description} onChange={e => setNewExpense(p=>({...p, description:e.target.value}))}/>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Payment method</label>
                  <select value={newExpense.method} onChange={e => setNewExpense(p=>({...p, method:e.target.value}))}>
                    {Object.entries(paymentLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Supplier / payee</label>
                  <input type="text" placeholder="Name or company" value={newExpense.supplier} onChange={e => setNewExpense(p=>({...p, supplier:e.target.value}))}/>
                </div>
              </div>
              <div className="field">
                <label>Attach to batch / transaction</label>
                <select value={newExpense.attach} onChange={e => setNewExpense(p=>({...p, attach:e.target.value}))}>
                  <option value="">— No attachment —</option>
                  {stockBatches.map(b => <option key={b.id} value={b.id}>Batch {b.batchNumber} — {b.farmerName} · {fmtUGX(b.totalPurchaseCost)}</option>)}
                  {localSales.slice(0,5).map(s => <option key={s.id} value={s.id}>{s.orderNumber} — {s.customerName}</option>)}
                </select>
                <div className="field-hint">Attaching enables per-batch margin calculation and GAAP cost allocation</div>
              </div>
              <div className="field">
                <label>Receipt / MoMo reference</label>
                <input type="text" placeholder="e.g. MTN-XK7291" value={newExpense.ref} onChange={e => setNewExpense(p=>({...p, ref:e.target.value}))}/>
              </div>
            </div>

            {newExpense.attach && (
              <div className="attach-card animate-scaleIn">
                <div className="attach-title">📌 Costs attached to {newExpense.attach}</div>
                <div>
                  {localExpenses.filter(e => e.attachedToBatch === newExpense.attach).map(e => (
                    <span key={e.id} className="cost-pill">{categoryLabels[e.category as keyof typeof categoryLabels].split('—')[0]}: {fmtUGX(e.amount)}</span>
                  ))}
                  {newExpense.amount && <span className="cost-pill" style={{background:'#FDF4DC', borderColor:'#E8B84B'}}>New: {fmtUGX(parseFloat(newExpense.amount)||0)} ✦</span>}
                </div>
                {(() => {
                  const b = stockBatches.find(x => x.id === newExpense.attach)
                  if (!b) return null
                  const { totalCost, estimatedRevenue, margin } = calcBatchMargin(b)
                  return (
                    <div className="attach-summary">
                      <div><span className="attach-summary-label">Total cost</span><span className="attach-summary-value" style={{color:'#B71C1C'}}>{fmtUGX(totalCost, true)}</span></div>
                      <div><span className="attach-summary-label">Est. revenue</span><span className="attach-summary-value" style={{color:'#1B5E20'}}>{fmtUGX(estimatedRevenue, true)}</span></div>
                      <div><span className="attach-summary-label">Margin</span><span className="attach-summary-value" style={{color:'#7A5500'}}>{fmtPct(margin)}</span></div>
                    </div>
                  )
                })()}
              </div>
            )}

            <button className="btn btn-primary btn-block" onClick={handleLogExpense}>Save cost entry</button>
            <div style={{height:10}}/>
            <button className="btn btn-ghost btn-block" onClick={() => downloadCSV(localExpenses.map(e => ({ date:e.date, category:categoryLabels[e.category as keyof typeof categoryLabels], description:e.description, amount:e.amount, method:paymentLabels[e.paymentMethod], ref:e.paymentRef||'', batch:e.attachedToBatch||'' })), 'banello-expenses-may2026.csv')}>
              Export all expenses (CSV)
            </button>

            <div className="section-label">All expenses — May 2026</div>
            <div className="list-card">
              {localExpenses.map(e => (
                <div key={e.id} className="list-item">
                  <div className="list-icon" style={{background:'#FFEBEE', fontSize:13}}>💸</div>
                  <div className="list-info">
                    <div className="list-title">{e.description}</div>
                    <div className="list-sub">{fmtDate(e.date)} · {paymentLabels[e.paymentMethod]}{e.attachedToBatch ? ` · 📎 ${e.attachedToBatch}` : ''}</div>
                  </div>
                  <div className="list-right">
                    <div className="list-value expense">{fmtUGX(e.amount)}</div>
                    <div className="list-sub" style={{textAlign:'right'}}>{categoryLabels[e.category as keyof typeof categoryLabels].split('—')[0].trim()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SALES ══════════════════════════════════════════ */}
      {page === 'sales' && (
        <div className="page">
          <div className="page-inner">
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="metric-card accent-green">
                <div className="metric-value" style={{color:'#1B5E20'}}>{fmtUGX(localSales.reduce((s,x)=>s+x.totalAmount,0), true)}</div>
                <div className="metric-label">Total revenue</div>
              </div>
              <div className="metric-card accent">
                <div className="metric-value">{localSales.length}</div>
                <div className="metric-label">Sales recorded</div>
              </div>
            </div>

            <div className="tab-strip">
              {(['kampala','border','all'] as SaleTab[]).map(t => (
                <button key={t} className={clsx('tab-item', saleTab===t && 'active')} onClick={() => setSaleTab(t)}>
                  {t === 'kampala' ? 'Kampala' : t === 'border' ? 'Border' : 'All sales'}
                </button>
              ))}
            </div>

            {saleTab === 'kampala' && (
              <>
                <div className="section-label">Record Kampala sale</div>
                <div className="form-card">
                  <div className="field">
                    <label>Customer / account</label>
                    <input type="text" placeholder="e.g. UNICEF Kampala, Grace M." value={newSale.customer} onChange={e => setNewSale(p=>({...p,customer:e.target.value}))}/>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Product</label>
                      <select value={newSale.product} onChange={e => setNewSale(p=>({...p,product:e.target.value}))}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Quantity</label>
                      <input type="number" placeholder="0" value={newSale.qty} onChange={e => setNewSale(p=>({...p,qty:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Unit price (UGX)</label>
                      <input type="number" value={newSale.price} onChange={e => setNewSale(p=>({...p,price:e.target.value}))}/>
                    </div>
                    <div className="field">
                      <label>Delivery fee</label>
                      <input type="number" value={newSale.deliveryFee} onChange={e => setNewSale(p=>({...p,deliveryFee:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Payment method</label>
                      <select value={newSale.method} onChange={e => setNewSale(p=>({...p,method:e.target.value}))}>
                        {Object.entries(paymentLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Linked batch</label>
                      <select value={newSale.batch} onChange={e => setNewSale(p=>({...p,batch:e.target.value}))}>
                        {stockBatches.map(b => <option key={b.id} value={b.id}>Batch {b.batchNumber}</option>)}
                      </select>
                    </div>
                  </div>
                  {newSale.qty && newSale.price && (
                    <div style={{background:'#EAF3EE', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#1B5E20', fontWeight:600}}>
                      Total: UGX {fmtUGX((parseFloat(newSale.qty)||0)*(parseFloat(newSale.price)||0) + (parseFloat(newSale.deliveryFee)||0))}
                    </div>
                  )}
                </div>
                <button className="btn btn-yellow btn-block" onClick={handleLogSale}>Record Kampala sale</button>
              </>
            )}

            {saleTab === 'border' && (
              <>
                <div className="section-label">Record border sale</div>
                <div className="form-card">
                  <div className="field">
                    <label>Border market</label>
                    <select><option>Malaba border market</option><option>Busia border market</option></select>
                  </div>
                  <div className="field">
                    <label>Buyer name / code</label>
                    <input type="text" placeholder="e.g. Trader Kamau — Kenya"/>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Bunches sold</label>
                      <input type="number" placeholder="0"/>
                    </div>
                    <div className="field">
                      <label>Price / bunch (UGX)</label>
                      <input type="number" placeholder="12000"/>
                    </div>
                  </div>
                  <div className="field">
                    <label>Truck registration</label>
                    <input type="text" placeholder="e.g. UBJ 420X"/>
                  </div>
                </div>
                <button className="btn btn-yellow btn-block" onClick={() => toast('Border sale recorded')}>Record border sale</button>
              </>
            )}

            {saleTab === 'all' && (
              <>
                <div style={{display:'flex', justifyContent:'flex-end', marginBottom:10}}>
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(localSales.map(s => ({ date:s.date, order:s.orderNumber, customer:s.customerName, channel:s.channel, amount:s.totalAmount, status:s.status, invoice:s.invoiceNumber||'' })), 'banello-sales-may2026.csv')}>
                    Export CSV
                  </button>
                </div>
                <div className="list-card">
                  {localSales.map(s => (
                    <div key={s.id} className="list-item">
                      <div className="list-icon" style={{background:'#E8F5E9', fontSize:13}}>
                        {s.channel.includes('border') ? '🌍' : s.customerType==='home' ? '🏠' : '🏢'}
                      </div>
                      <div className="list-info">
                        <div className="list-title">{s.customerName}</div>
                        <div className="list-sub">{fmtDate(s.date, 'short')} · {s.orderNumber}{s.invoiceNumber ? ` · ${s.invoiceNumber}` : ''}</div>
                      </div>
                      <div className="list-right">
                        <div className="list-value income">{fmtUGX(s.totalAmount)}</div>
                        <Badge status={s.status}/>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ FINANCIALS ══════════════════════════════════════ */}
      {page === 'financials' && (
        <div className="page">
          <div className="page-inner">
            <div className="tab-strip">
              {([['pl','P&L'],['bs','Balance sheet'],['cf','Cash flow']] as [FinTab,string][]).map(([t,l]) => (
                <button key={t} className={clsx('tab-item', finTab===t && 'active')} onClick={() => setFinTab(t)}>{l}</button>
              ))}
            </div>

            {finTab === 'pl' && (
              <>
                <div className="stmt-card animate-fadeInUp">
                  <div className="stmt-header">
                    <div className="stmt-title">Statement of Profit or Loss</div>
                    <div className="stmt-period">For the month ended 31 May 2026</div>
                    <div className="stmt-standard">Prepared in accordance with IFRS / IAS 1 · Banello Fresh Produce Ltd · TIN: 1234567890</div>
                  </div>
                  <div style={{padding:'0 16px'}}>
                    <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Revenue</div></div>
                    <StmtRow label="Kampala premium delivery" value={fmtUGX(financialSummary.revenue.kampalaDelivery)} indent positive/>
                    <StmtRow label="Border trade — Malaba / Busia" value={fmtUGX(financialSummary.revenue.borderTrade)} indent positive/>
                    <StmtRow label="Delivery fees" value={fmtUGX(financialSummary.revenue.deliveryFees)} indent positive/>
                    <StmtRow label="Total revenue" value={fmtUGX(financialSummary.revenue.total)} subtotal positive/>
                    <div className="stmt-spacer"/>
                    <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Cost of goods sold</div></div>
                    <StmtRow label="Stock purchases — banana" value={`(${fmtUGX(financialSummary.cogs.stockBanana)})`} indent negative/>
                    <StmtRow label="Stock purchases — other produce" value={`(${fmtUGX(financialSummary.cogs.stockOther)})`} indent negative/>
                    <StmtRow label="Total COGS" value={`(${fmtUGX(financialSummary.cogs.total)})`} subtotal negative/>
                    <StmtRow label="Gross profit" value={fmtUGX(financialSummary.grossProfit)} subtotal positive/>
                    <div className="stmt-spacer"/>
                    <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Operating expenses</div></div>
                    <StmtRow label="Transport — long haul" value={`(${fmtUGX(financialSummary.operatingExpenses.transportLongHaul)})`} indent negative/>
                    <StmtRow label="Rider commissions" value={`(${fmtUGX(financialSummary.operatingExpenses.riderCommissions)})`} indent negative/>
                    <StmtRow label="Tricycle hire" value={`(${fmtUGX(financialSummary.operatingExpenses.tricycleHire)})`} indent negative/>
                    <StmtRow label="Packaging materials" value={`(${fmtUGX(financialSummary.operatingExpenses.packaging)})`} indent negative/>
                    <StmtRow label="Mobile money fees" value={`(${fmtUGX(financialSummary.operatingExpenses.momoFees)})`} indent negative/>
                    <StmtRow label="Airtime and data" value={`(${fmtUGX(financialSummary.operatingExpenses.airtime)})`} indent negative/>
                    <StmtRow label="Produce waste write-off" value={`(${fmtUGX(financialSummary.operatingExpenses.wasteWriteOff)})`} indent negative/>
                    <StmtRow label="Other operating costs" value={`(${fmtUGX(financialSummary.operatingExpenses.other)})`} indent negative/>
                    <StmtRow label="Total operating expenses" value={`(${fmtUGX(financialSummary.operatingExpenses.total)})`} subtotal negative/>
                    <div className="stmt-spacer"/>
                  </div>
                  <StmtRow label="Profit before income tax" value={fmtUGX(financialSummary.profitBeforeTax)} total positive/>
                  <div style={{padding:'0 16px'}}>
                    <StmtRow label="Income tax expense — 30% CIT (Uganda ITA Cap 340)" value={`(${fmtUGX(financialSummary.corporateIncomeTax)})`} indent negative/>
                  </div>
                  <StmtRow label="Net profit for the period" value={fmtUGX(financialSummary.netProfit)} total positive/>
                  <div className="stmt-watermark">Prepared in accordance with International Financial Reporting Standards (IFRS) · IAS 1 Presentation of Financial Statements · Banello Fresh Produce Ltd · TIN: 1234567890 · Reg: BF-2026-001</div>
                </div>
                <div className="grid-2">
                  <div className="metric-card accent-green"><div className="metric-value" style={{color:'#1B5E20'}}>{fmtPct(financialSummary.grossMargin)}</div><div className="metric-label">Gross margin</div></div>
                  <div className="metric-card accent-green"><div className="metric-value" style={{color:'#1B5E20'}}>{fmtPct(financialSummary.netMargin)}</div><div className="metric-label">Net margin</div></div>
                </div>
              </>
            )}

            {finTab === 'bs' && (
              <div className="stmt-card animate-fadeInUp">
                <div className="stmt-header">
                  <div className="stmt-title">Statement of Financial Position</div>
                  <div className="stmt-period">As at 31 May 2026</div>
                  <div className="stmt-standard">IFRS / IAS 1 · Banello Fresh Produce Ltd</div>
                </div>
                <div style={{padding:'0 16px'}}>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Current assets</div></div>
                  <StmtRow label="Cash and cash equivalents" value={fmtUGX(financialSummary.cashBalance)} indent positive/>
                  <StmtRow label="Trade receivables (net)" value={fmtUGX(financialSummary.tradeReceivables)} indent positive/>
                  <StmtRow label="Inventory — produce at hub" value={fmtUGX(financialSummary.inventory)} indent positive/>
                  <StmtRow label="Prepaid expenses" value={fmtUGX(45000)} indent positive/>
                  <StmtRow label="Total current assets" value={fmtUGX(financialSummary.cashBalance+financialSummary.tradeReceivables+financialSummary.inventory+45000)} subtotal positive/>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Non-current assets</div></div>
                  <StmtRow label="Equipment (scales, branded materials)" value={fmtUGX(180000)} indent positive/>
                  <StmtRow label="Less: accumulated depreciation" value={`(${fmtUGX(30000)})`} indent negative/>
                  <StmtRow label="Total non-current assets" value={fmtUGX(150000)} subtotal positive/>
                </div>
                <StmtRow label="TOTAL ASSETS" value={fmtUGX(financialSummary.cashBalance+financialSummary.tradeReceivables+financialSummary.inventory+45000+150000)} total positive/>
                <div style={{padding:'0 16px'}}>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Current liabilities</div></div>
                  <StmtRow label="Trade payables — farmers" value="0" indent/>
                  <StmtRow label="Income tax payable — URA" value={`(${fmtUGX(financialSummary.taxPayable)})`} indent negative/>
                  <StmtRow label="Accrued expenses" value={`(${fmtUGX(62000)})`} indent negative/>
                  <StmtRow label="Total current liabilities" value={`(${fmtUGX(financialSummary.taxPayable+62000)})`} subtotal negative/>
                </div>
                <StmtRow label="NET ASSETS" value={fmtUGX(financialSummary.cashBalance+financialSummary.tradeReceivables+financialSummary.inventory+45000+150000-financialSummary.taxPayable-62000)} total positive/>
                <div style={{padding:'0 16px'}}>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Equity</div></div>
                  <StmtRow label="Founder capital contribution" value={fmtUGX(1500000)} indent positive/>
                  <StmtRow label="Retained earnings" value={fmtUGX(407000)} indent positive/>
                  <StmtRow label="Total equity" value={fmtUGX(1907000)} subtotal positive/>
                </div>
                <div className="stmt-watermark">IAS 1 Presentation of Financial Statements · Assets = Liabilities + Equity · Banello Fresh Produce Ltd</div>
              </div>
            )}

            {finTab === 'cf' && (
              <div className="stmt-card animate-fadeInUp">
                <div className="stmt-header">
                  <div className="stmt-title">Statement of Cash Flows</div>
                  <div className="stmt-period">Month ended 31 May 2026 — Indirect method</div>
                  <div className="stmt-standard">IAS 7 Statement of Cash Flows · Banello Fresh Produce Ltd</div>
                </div>
                <div style={{padding:'0 16px'}}>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Operating activities</div></div>
                  <StmtRow label="Profit before income tax" value={fmtUGX(financialSummary.profitBeforeTax)} indent positive/>
                  <StmtRow label="Adjustments for depreciation" value={fmtUGX(5000)} indent positive/>
                  <StmtRow label="Increase in trade receivables" value={`(${fmtUGX(financialSummary.tradeReceivables)})`} indent negative/>
                  <StmtRow label="Decrease in inventory" value={fmtUGX(85000)} indent positive/>
                  <StmtRow label="Increase in trade payables" value="0" indent/>
                  <StmtRow label="Net cash from operating activities" value={fmtUGX(financialSummary.profitBeforeTax+5000-financialSummary.tradeReceivables+85000)} subtotal positive/>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Investing activities</div></div>
                  <StmtRow label="Purchase of equipment" value={`(${fmtUGX(180000)})`} indent negative/>
                  <StmtRow label="Net cash from investing activities" value={`(${fmtUGX(180000)})`} subtotal negative/>
                  <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Financing activities</div></div>
                  <StmtRow label="Founder capital injection" value={fmtUGX(1500000)} indent positive/>
                  <StmtRow label="Net cash from financing activities" value={fmtUGX(1500000)} subtotal positive/>
                </div>
                <StmtRow label="Net increase in cash and equivalents" value={fmtUGX(financialSummary.cashBalance)} total positive/>
                <div style={{padding:'0 16px'}}>
                  <StmtRow label="Cash at beginning of period" value="0" indent/>
                </div>
                <StmtRow label="Cash at end of period" value={fmtUGX(financialSummary.cashBalance)} total positive/>
                <div className="stmt-watermark">IAS 7 Statement of Cash Flows · Indirect method · All amounts in Uganda Shillings (UGX)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ REPORTS ══════════════════════════════════════════ */}
      {page === 'reports' && (
        <div className="page">
          <div className="page-inner">
            <div className="section-label">Performance KPIs</div>
            <div className="chart-card">
              <ProgressBar label="Net margin" value={30} max={100} color="#1C3A28" display="30% / 25% ✓"/>
              <ProgressBar label="Waste rate" value={4.7} max={20} color="#E65100" display="4.7% / 5%"/>
              <ProgressBar label="Clients" value={52} max={75} color="#1565C0" display="52 / 75"/>
              <ProgressBar label="Grade A yield" value={76} max={100} color="#1C3A28" display="76% / 70% ✓"/>
              <ProgressBar label="Same-day pay" value={94} max={100} color="#1C3A28" display="94% / 100%"/>
              <ProgressBar label="Gross margin" value={56.6} max={100} color="#4A7A5A" display="56.6%"/>
            </div>

            <div className="section-label">Download reports</div>
            {[
              { icon:'📊', title:'P&L statement — May 2026', meta:'IFRS / IAS 1 · Updated today', action:'PDF', color:'#E8F5E9', onClick:() => { navTo('financials'); toast('Opening P&L statement…') } },
              { icon:'⚖️', title:'Balance sheet — May 2026', meta:'IFRS / IAS 1 · Updated today', action:'PDF', color:'#E3F2FD', onClick:() => { navTo('financials'); setFinTab('bs'); toast('Opening balance sheet…') } },
              { icon:'💧', title:'Cash flow statement — May 2026', meta:'IAS 7 indirect method · Updated today', action:'PDF', color:'#E8F5E9', onClick:() => { navTo('financials'); setFinTab('cf'); toast('Opening cash flow…') } },
              { icon:'🌿', title:'Farmer payment ledger', meta:'All 8 farmers · May 2026', action:'CSV', color:'#FDF4DC', onClick:() => downloadCSV(farmers.map(f => ({ name:f.name, district:f.district, phone:f.phone, momo:f.momoNumber, totalPaid:f.totalLifetimePaid, bunches:f.totalLifetimeBunches })), 'banello-farmer-payments.csv') },
              { icon:'📦', title:'Stock batch analysis', meta:'All 8 batches · May 2026', action:'CSV', color:'#FDF4DC', onClick:() => downloadCSV(stockBatches.map(b => ({ batch:b.batchNumber, farmer:b.farmerName, qty:b.purchasedQty, gradeA:b.gradeAQty, gradeB:b.gradeBQty, gradeC:b.gradeCQty, waste:b.wasteQty, cost:b.totalPurchaseCost })), 'banello-stock-batches.csv') },
              { icon:'💸', title:'Full expense ledger', meta:'All 29 entries · May 2026', action:'CSV', color:'#FFEBEE', onClick:() => downloadCSV(localExpenses.map(e => ({ date:e.date, category:categoryLabels[e.category as keyof typeof categoryLabels], description:e.description, amount:e.amount, method:paymentLabels[e.paymentMethod], ref:e.paymentRef||'', batch:e.attachedToBatch||'' })), 'banello-expenses.csv') },
              { icon:'🏛', title:'URA VAT return — Q1 2026', meta:'Pre-filled · Due in 8 days', action:'File now', color:'#E8EAF6', onClick:() => navTo('ura') },
              { icon:'🏛', title:'URA income tax return FY2026', meta:'Annual CIT 30% · Prepare now', action:'Prepare', color:'#E8EAF6', onClick:() => navTo('ura') },
              { icon:'🌍', title:'Impact report — farmer payments', meta:'30+ farmers supported · Shareable', action:'PDF', color:'#EDE9FE', onClick:() => toast('Impact report downloading…') },
            ].map(({ icon, title, meta, action, color, onClick }) => (
              <div key={title} className="report-item" onClick={onClick}>
                <div className="report-icon" style={{background:color}}>{icon}</div>
                <div className="report-info">
                  <div className="report-title">{title}</div>
                  <div className="report-meta">{meta}</div>
                </div>
                <div className="report-action">{action} <Icon.ArrowRight/></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ URA FILING ══════════════════════════════════════ */}
      {page === 'ura' && (
        <div className="page">
          <div className="page-inner">
            <div className="ura-card">
              <div className="ura-title">🏛 Uganda Revenue Authority — Tax Filing</div>
              <div className="ura-sub">Banello Fresh Produce Ltd · TIN: 1234567890 · Reg: BF-2026-001</div>
              <div className="grid-2">
                <div className="metric-card" style={{background:'rgba(255,255,255,0.7)'}}>
                  <div className="metric-value" style={{fontSize:15, color:'#E65100'}}>8 days</div>
                  <div className="metric-label">VAT return due</div>
                </div>
                <div className="metric-card" style={{background:'rgba(255,255,255,0.7)'}}>
                  <div className="metric-value" style={{fontSize:15}}>{fmtUGX(financialSummary.corporateIncomeTax)}</div>
                  <div className="metric-label">CIT payable (UGX)</div>
                </div>
              </div>
            </div>

            <div className="alert alert-amber"><span className="alert-icon">⚠</span><div className="alert-content"><strong>VAT threshold note</strong>Annual turnover below UGX 150M threshold. VAT form shown for planning. Register when threshold is crossed.</div></div>

            <div className="section-label">VAT return — Q1 2026 (Jan–Mar)</div>
            <div className="stmt-card">
              <div className="stmt-header">
                <div className="stmt-title">VAT Return — Form VAT 1</div>
                <div className="stmt-period">Quarter ended 31 March 2026</div>
                <div className="stmt-standard">Uganda VAT Act Cap 349 · URA Form VAT 1</div>
              </div>
              <div style={{padding:'0 16px'}}>
                <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Output VAT (sales)</div></div>
                <StmtRow label="Standard rated supplies @ 18%" value={fmtUGX(8640000)} indent positive/>
                <StmtRow label="Exempt supplies (fresh produce)" value={fmtUGX(6480000)} indent/>
                <StmtRow label="Output VAT collected" value={fmtUGX(1555200)} subtotal positive/>
                <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Input VAT (purchases)</div></div>
                <StmtRow label="Input VAT on transport services" value={`(${fmtUGX(229500)})`} indent negative/>
                <StmtRow label="Input VAT on packaging" value={`(${fmtUGX(32400)})`} indent negative/>
                <StmtRow label="Total input VAT" value={`(${fmtUGX(261900)})`} subtotal negative/>
              </div>
              <StmtRow label="VAT payable to URA" value={fmtUGX(1293300)} total positive/>
              <div className="stmt-watermark">Uganda VAT Act Cap 349 · URA Form VAT 1 · Quarterly filing</div>
            </div>

            <div className="section-label">Income tax — FY2026 computation</div>
            <div className="stmt-card">
              <div className="stmt-header">
                <div className="stmt-title">Corporate Income Tax Computation</div>
                <div className="stmt-period">Year ended 30 June 2026</div>
                <div className="stmt-standard">Uganda Income Tax Act Cap 340 · CIT @ 30%</div>
              </div>
              <div style={{padding:'0 16px'}}>
                <div style={{padding:'10px 0 4px'}}><div className="stmt-section-title">Tax computation</div></div>
                <StmtRow label="Gross income" value={fmtUGX(financialSummary.revenue.total)} indent positive/>
                <StmtRow label="Allowable deductions — COGS" value={`(${fmtUGX(financialSummary.cogs.total)})`} indent negative/>
                <StmtRow label="Allowable deductions — Opex" value={`(${fmtUGX(financialSummary.operatingExpenses.total)})`} indent negative/>
                <StmtRow label="Capital allowances" value={`(${fmtUGX(5000)})`} indent negative/>
                <StmtRow label="Chargeable income" value={fmtUGX(financialSummary.profitBeforeTax)} subtotal positive/>
                <StmtRow label="CIT rate" value="30%" indent/>
              </div>
              <StmtRow label="Tax payable to URA" value={fmtUGX(financialSummary.corporateIncomeTax)} total positive/>
              <div className="stmt-watermark">Uganda Income Tax Act Cap 340 · Standard 30% CIT rate · Due 31 December 2026</div>
            </div>

            <div className="section-label">Filing calendar</div>
            <div className="list-card">
              {[
                { icon:'📅', title:'VAT return Q1 2026', sub:'Due: 25 May 2026', badge:'pending', badgeColor:'amber' },
                { icon:'📅', title:'VAT return Q2 2026', sub:'Due: 25 August 2026', badge:'upcoming', badgeColor:'blue' },
                { icon:'📅', title:'Annual income tax return', sub:'Due: 31 December 2026 (FY2026)', badge:'upcoming', badgeColor:'blue' },
                { icon:'📅', title:'PAYE — monthly (when staff hired)', sub:'15th of each month', badge:'not active', badgeColor:'gray' },
                { icon:'📅', title:'Withholding tax on contracts', sub:'On payments above UGX 1M', badge:'monitor', badgeColor:'gray' },
              ].map(({ icon, title, sub, badge }) => (
                <div key={title} className="list-item">
                  <div className="list-icon" style={{background:'#E3F2FD', fontSize:15}}>{icon}</div>
                  <div className="list-info"><div className="list-title">{title}</div><div className="list-sub">{sub}</div></div>
                  <div className="list-right"><Badge status={badge}/></div>
                </div>
              ))}
            </div>

            <div className="section-label">Filing actions</div>
            <button className="btn btn-primary btn-block" style={{marginBottom:10}} onClick={() => toast('Redirecting to URA eTax portal… ura.go.ug')}>Submit VAT return to URA portal</button>
            <button className="btn btn-outline btn-block" style={{marginBottom:10}} onClick={() => toast('Pre-filled VAT Form 1 downloading…')}>Download pre-filled VAT Form 1 (PDF)</button>
            <button className="btn btn-ghost btn-block" style={{marginBottom:10}} onClick={() => toast('Income tax return (ITF1) being prepared…')}>Prepare income tax return (ITF1)</button>
            <button className="btn btn-ghost btn-block" onClick={() => downloadCSV([{ tin:'1234567890', period:'FY2026', grossIncome:financialSummary.revenue.total, totalDeductions:financialSummary.cogs.total+financialSummary.operatingExpenses.total, chargeableIncome:financialSummary.profitBeforeTax, taxPayable:financialSummary.corporateIncomeTax }], 'banello-tax-computation.csv')}>Export tax computation to accountant (CSV)</button>
          </div>
        </div>
      )}

      {/* ═══ FARMERS ═════════════════════════════════════════ */}
      {page === 'farmers' && (
        <div className="page">
          <div className="page-inner">
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="metric-card accent-green"><div className="metric-value" style={{color:'#1B5E20'}}>{farmers.filter(f=>f.isActive).length}</div><div className="metric-label">Active farmers</div></div>
              <div className="metric-card accent"><div className="metric-value">{fmtUGX(farmers.reduce((s,f)=>s+f.totalLifetimePaid,0),true)}</div><div className="metric-label">Total paid (lifetime)</div></div>
            </div>
            <div className="list-card stagger">
              {farmers.map(f => (
                <div key={f.id} className="list-item">
                  <div className="list-icon" style={{background:'#C8E6C9', fontSize:16, fontWeight:600, color:'#1B5E20'}}>{f.name.split(' ').map(n=>n[0]).join('')}</div>
                  <div className="list-info">
                    <div className="list-title">{f.name}</div>
                    <div className="list-sub">{f.district} · {f.momoNetwork} · Grade A: {f.gradeAYield}%</div>
                  </div>
                  <div className="list-right">
                    <div className="list-value" style={{color:'#1B5E20'}}>{fmtUGX(f.totalLifetimePaid,true)}</div>
                    <Badge status={f.isActive ? 'active' : (f.reliabilityScore < 75 ? 'review' : 'active')}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STOCK ════════════════════════════════════════════ */}
      {page === 'stock' && (
        <div className="page">
          <div className="page-inner">
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="metric-card accent-green"><div className="metric-value">{stockBatches.reduce((s,b)=>s+b.remainingQty,0)}</div><div className="metric-label">Bunches in stock</div></div>
              <div className="metric-card accent-red"><div className="metric-value" style={{color:'#B71C1C'}}>{stockBatches.filter(b=>b.wasteQty>0).reduce((s,b)=>s+b.wasteQty,0)}</div><div className="metric-label">Total waste (bunches)</div></div>
            </div>
            <div className="list-card stagger">
              {stockBatches.map(b => {
                const { margin } = calcBatchMargin(b)
                return (
                  <div key={b.id} className="list-item">
                    <div className="list-icon" style={{background:'#FDF4DC', fontSize:14, fontWeight:700, color:'#7A5500'}}>{b.batchNumber}</div>
                    <div className="list-info">
                      <div className="list-title">{b.farmerName} · {b.purchasedQty} bunches</div>
                      <div className="list-sub">{fmtDate(b.purchaseDate,'short')} · A:{b.gradeAQty} B:{b.gradeBQty} C:{b.gradeCQty} · margin {fmtPct(margin)}</div>
                    </div>
                    <div className="list-right">
                      <div className="list-value">{b.remainingQty} left</div>
                      <Badge status={b.status}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SETTINGS ════════════════════════════════════════ */}
      {page === 'settings' && (
        <div className="page">
          <div className="page-inner">
            <div className="section-label">Business profile</div>
            <div className="form-card">
              <div className="field"><label>Business name</label><input defaultValue="Banello Fresh Produce Ltd"/></div>
              <div className="field-row">
                <div className="field"><label>TIN (URA)</label><input defaultValue="1234567890"/></div>
                <div className="field"><label>Reg. number</label><input defaultValue="BF-2026-001"/></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Accounting standard</label><select><option>IFRS (full)</option><option>IFRS for SMEs</option><option>Uganda GAAP</option></select></div>
                <div className="field"><label>Financial year end</label><select><option>30 June</option><option>31 December</option></select></div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => toast('Profile saved')}>Save profile</button>
            </div>

            <div className="section-label">Notifications</div>
            <div className="form-card">
              {[
                { label:'Stock expiry alerts', sub:'Alert when batch within 24hrs of expiry', value:toggleExpiry, set:setToggleExpiry },
                { label:'Low stock alerts', sub:'Alert when below reorder threshold', value:toggleLowStock, set:setToggleLowStock },
                { label:'Weekly P&L summary', sub:'Auto-generated every Sunday', value:toggleWeeklyPL, set:setToggleWeeklyPL },
              ].map(({ label, sub, value, set }) => (
                <div key={label} className="toggle-row">
                  <div><div className="toggle-label">{label}</div><div className="toggle-sub">{sub}</div></div>
                  <button className={clsx('toggle', value && 'on')} onClick={() => set(!value)} aria-label={label}/>
                </div>
              ))}
            </div>

            <div className="section-label">Security</div>
            <div className="form-card">
              {[
                { label:'Two-factor authentication (TOTP)', sub:'Google Authenticator — recommended', value:toggle2fa, set:setToggle2fa },
                { label:'Daily database backup', sub:'Auto-backup to cloud at midnight', value:toggleBackup, set:setToggleBackup },
                { label:'Audit log', sub:'Record all data changes with user + timestamp', value:toggleAudit, set:setToggleAudit },
              ].map(({ label, sub, value, set }) => (
                <div key={label} className="toggle-row">
                  <div><div className="toggle-label">{label}</div><div className="toggle-sub">{sub}</div></div>
                  <button className={clsx('toggle', value && 'on')} onClick={() => set(!value)} aria-label={label}/>
                </div>
              ))}
            </div>

            <div className="section-label">Data</div>
            <div className="list-card">
              <div className="list-item" onClick={() => downloadCSV(localExpenses.map(e => ({ date:e.date, desc:e.description, amount:e.amount })), 'banello-all-data.csv')}>
                <div className="list-icon" style={{background:'#E8F5E9', fontSize:15}}>📤</div>
                <div className="list-info"><div className="list-title">Export all data</div><div className="list-sub">Full transaction history — CSV</div></div>
                <Icon.ArrowRight/>
              </div>
              <div className="list-item" onClick={() => toast('Password change OTP sent via SMS')}>
                <div className="list-icon" style={{background:'#E3F2FD', fontSize:15}}>🔒</div>
                <div className="list-info"><div className="list-title">Change PIN / password</div><div className="list-sub">OTP via SMS to registered number</div></div>
                <Icon.ArrowRight/>
              </div>
            </div>
            <div className="watermark">Banello Business Platform v1.0 · © 2026 Banello Fresh Produce Ltd<br/>From the slopes of Elgon. To your table.</div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM NAV ══════════════════════════════════════ */}
      <nav className="bottom-nav">
        {navItems.map(({ id, label, icon }) => (
          <button key={id} className={clsx('nav-item', page===id && 'active')} onClick={() => navTo(id)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>

      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )
}
