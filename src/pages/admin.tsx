import Head from 'next/head'
import{useState,useEffect}from'react'
import{expenses,sales,farmers,stockBatches,financialSummary,categoryLabels,paymentLabels,type Expense,type Category,type PaymentMethod}from'../data/store'
import{fmtUGX,fmtDate,fmtPct,calcBatchMargin,downloadCSV}from'../utils/format'

const RIDERS=[
  {id:'R001',name:'David Kato',zone:'CBD / Nakasero',rating:4.8,deliveries:62,status:'available'},
  {id:'R002',name:'Jane Mukasa',zone:'Kololo / Naguru',rating:4.9,deliveries:108,status:'on-run'},
  {id:'R003',name:'Moses Ringo',zone:'Ntinda / Kiwatule',rating:4.6,deliveries:44,status:'available'},
  {id:'R004',name:'Ruth Aber',zone:'Muyenga / Bugolobi',rating:4.7,deliveries:31,status:'available'},
  {id:'R005',name:'Peter Okello',zone:'Nakawa / Banda',rating:4.5,deliveries:27,status:'available'},
]

type AdminTab='overview'|'orders'|'dispatch'|'stock'|'costs'|'financials'|'farmers'|'customers'|'reports'|'ura'

const G={green:'#1C3A28',mid:'#2D5A3D',leaf:'#4A7A5A',mist:'#A8C5B0',pale:'#EAF3EE',yellow:'#E8B84B',yd:'#D4A830',yl:'#FDF4DC',cream:'#F8F4EE',white:'#fff',g50:'#F9F9F9',g100:'#EEEEEE',g200:'#E0E0E0',g400:'#9E9E9E',g600:'#616161',g900:'#121212',red:'#B71C1C',redL:'#FFEBEE',blue:'#1565C0',blueL:'#E3F2FD'}

function Badge({status}:{status:string}){
  const m:Record<string,{bg:string;c:string}>={confirmed:{bg:'#E8F5E9',c:'#1B5E20'},pending:{bg:'#FFF3E0',c:'#E65100'},overdue:{bg:'#FFEBEE',c:'#B71C1C'},dispatched:{bg:'#E3F2FD',c:'#1565C0'},delivered:{bg:'#E8F5E9',c:'#1B5E20'},packed:{bg:'#EDE9FE',c:'#5B21B6'},'in-stock':{bg:'#E8F5E9',c:'#1B5E20'},sold:{bg:'#F5F5F5',c:'#757575'},available:{bg:'#E8F5E9',c:'#1B5E20'},'on-run':{bg:'#E3F2FD',c:'#1565C0'},'off-duty':{bg:'#F5F5F5',c:'#757575'},active:{bg:'#E8F5E9',c:'#1B5E20'},review:{bg:'#FFF3E0',c:'#E65100'}}
  const c=m[status]||{bg:'#F5F5F5',c:'#757575'}
  return<span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:c.bg,color:c.c,whiteSpace:'nowrap'}}>{status.charAt(0).toUpperCase()+status.slice(1).replace(/-/g,' ')}</span>
}

function StmtRow({label,value,indent=false,subtotal=false,total=false,positive=false,negative=false}:{label:string;value:string;indent?:boolean;subtotal?:boolean;total?:boolean;positive?:boolean;negative?:boolean}){
  return<div style={{display:'flex',justifyContent:'space-between',padding:total?'10px 16px':subtotal?'6px 0':'5px 0',paddingLeft:indent?12:0,borderTop:total?'2px solid #4A7A5A':subtotal?'1px solid #E0E0E0':undefined,marginTop:subtotal?4:undefined,background:total?G.pale:undefined,margin:total?'0 -16px':undefined,fontWeight:total||subtotal?700:400,fontSize:total?15:13,borderRadius:total?0:4}}>
    <span style={{color:indent?G.g600:'#424242',flex:1}}>{label}</span>
    <span style={{fontFamily:'monospace',fontSize:13,color:positive?'#1B5E20':negative?G.red:'#424242',fontWeight:subtotal||total?700:500}}>{value}</span>
  </div>
}

function ProgressBar({label,value,max,color,display}:{label:string;value:number;max:number;color:string;display:string}){
  return<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
    <span style={{fontSize:11,color:G.g600,width:110,flexShrink:0}}>{label}</span>
    <div style={{flex:1,height:5,background:G.g100,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,(value/max)*100)}%`,background:color,borderRadius:3}}/></div>
    <span style={{fontSize:11,fontWeight:700,color,width:70,textAlign:'right'}}>{display}</span>
  </div>
}

export default function AdminDashboard(){
  const[tab,setTab]=useState<AdminTab>('overview')
  const[sideOpen,setSideOpen]=useState(true)
  const[toast,setToast]=useState('')
  const[toastShow,setToastShow]=useState(false)
  const[riderAssign,setRiderAssign]=useState<Record<string,string>>({})
  const[localExpenses,setLocalExpenses]=useState(expenses)
  const[newExp,setNewExp]=useState({category:'stock-banana',amount:'',date:new Date().toISOString().split('T')[0],description:'',method:'mtn-momo',attach:'',ref:'',supplier:''})
  const[finTab,setFinTab]=useState<'pl'|'bs'|'cf'>('pl')
  const[orderFilter,setOrderFilter]=useState('all')
  const[authChecked,setAuthChecked]=useState(false)
  const[authed,setAuthed]=useState(false)

  useEffect(()=>{
    fetch('/api/auth/session',{credentials:'include'}).then(r=>r.json()).then(d=>{
      if(d.authenticated&&d.user?.isAdmin){setAuthed(true)}
      else{window.location.href='/login?from=/admin'}
      setAuthChecked(true)
    }).catch(()=>{window.location.href='/login?from=/admin'})
  },[])

  function showToast(msg:string){setToast(msg);setToastShow(true);setTimeout(()=>setToastShow(false),2800)}
  function assignRider(orderId:string,riderId:string){
    setRiderAssign(p=>({...p,[orderId]:riderId}))
    const rider=RIDERS.find(r=>r.id===riderId)
    if(rider)showToast(`✓ ${rider.name} assigned — WhatsApp sent with delivery list`)
  }
  function logExpense(){
    if(!newExp.amount||!newExp.description){showToast('Please fill amount and description');return}
    const e:Expense={id:`E${Date.now()}`,date:newExp.date,category:newExp.category as Category,description:newExp.description,amount:parseFloat(newExp.amount),paymentMethod:newExp.method as PaymentMethod,paymentRef:newExp.ref||undefined,attachedToBatch:newExp.attach||undefined,supplier:newExp.supplier||undefined,isRecurring:false,createdAt:new Date().toISOString()}
    setLocalExpenses(p=>[e,...p])
    setNewExp(p=>({...p,amount:'',description:'',ref:'',supplier:''}))
    showToast(`Cost of UGX ${fmtUGX(parseFloat(newExp.amount))} saved`)
  }
  async function handleLogout(){await fetch('/api/auth/logout',{method:'POST',credentials:'include'});window.location.href='/'}

  const filteredSales=orderFilter==='all'?sales:sales.filter(s=>s.status===orderFilter)
  const totalExp=localExpenses.reduce((s,e)=>s+e.amount,0)

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;overflow:hidden}
    body{font-family:'DM Sans',-apple-system,sans-serif;font-size:13px;color:#212121;background:#F5F5F5}
    button{cursor:pointer;font-family:inherit}
    input,select,textarea{font-family:inherit}
    input:focus,select:focus,textarea:focus{outline:none;border-color:#4A7A5A!important;box-shadow:0 0 0 3px rgba(74,122,90,0.12)!important}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:#E0E0E0;border-radius:4px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .fade{animation:fadeUp .2s ease both}
    .lirow{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #F5F5F5;cursor:pointer}
    .lirow:hover{background:#FAFAFA}
    .lirow:last-child{border-bottom:none}
    .btn{padding:11px 16px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
    .btn-primary{background:#1C3A28;color:#fff}
    .btn-primary:hover{background:#2D5A3D}
    .btn-yellow{background:#E8B84B;color:#1C3A28}
    .btn-ghost{background:#EEEEEE;color:#212121}
    .btn-ghost:hover{background:#E0E0E0}
    .btn-sm{padding:6px 12px;font-size:11px;border-radius:6px}
    th{background:#FAFAFA;padding:7px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.06em;color:#9E9E9E;text-transform:uppercase;border-bottom:1px solid #EEEEEE;white-space:nowrap}
    td{padding:9px 12px;border-bottom:1px solid #F5F5F5;vertical-align:middle;font-size:12px}
    tr:hover td{background:#FAFAFA}
    .field-lbl{display:block;font-size:10px;font-weight:700;color:#757575;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px}
    .field-inp{width:100%;padding:10px 12px;border:1.5px solid #E0E0E0;border-radius:8px;font-size:13px;color:#212121;background:#fff}
  `

  if(!authChecked)return<><style>{css}</style><div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:G.green}}><div style={{textAlign:'center'}}><div style={{width:40,height:40,border:'3px solid rgba(232,184,75,.3)',borderTopColor:G.yellow,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div style={{fontFamily:"'Playfair Display',serif",color:G.yellow,fontSize:18}}>banello</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div></>
  if(!authed)return null

  const navItems:[AdminTab,string,string][]=[['overview','🏠','Overview'],['orders','📋','Orders'],['dispatch','🏍','Dispatch'],['stock','📦','Stock'],['costs','💸','Costs'],['financials','📊','Financials'],['farmers','🌿','Farmers'],['customers','👥','Customers'],['reports','⬇','Reports'],['ura','🏛','URA Filing']]

  const card=(content:React.ReactNode,mb=14)=><div style={{background:G.white,borderRadius:12,border:`1px solid ${G.g100}`,boxShadow:'0 1px 4px rgba(0,0,0,.05)',marginBottom:mb,overflow:'hidden'}}>{content}</div>
  const cardH=(title:string,action?:React.ReactNode)=><div style={{padding:'12px 16px',borderBottom:`1px solid ${G.g100}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:14,fontWeight:600}}>{title}</div>{action}</div>
  const metric=(val:string,label:string,color=G.green,accent?:string)=>(
    <div style={{background:G.white,borderRadius:10,border:`1px solid ${G.g100}`,padding:14,borderLeft:`3px solid ${color}`,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:500,color,letterSpacing:'-.03em',lineHeight:1.1,marginBottom:3}}>{val}</div>
      <div style={{fontSize:11,color:G.g400}}>{label}</div>
      {accent&&<div style={{fontSize:10,color,marginTop:3,fontWeight:500}}>{accent}</div>}
    </div>
  )
  const inpField=(label:string,props:React.InputHTMLAttributes<HTMLInputElement>)=><div style={{marginBottom:12}}><label className="field-lbl">{label}</label><input className="field-inp" {...props}/></div>
  const selField=(label:string,props:React.SelectHTMLAttributes<HTMLSelectElement>,children:React.ReactNode)=><div style={{marginBottom:12}}><label className="field-lbl">{label}</label><select className="field-inp" {...props}>{children}</select></div>

  return(
    <>
      <Head><title>Banello Admin</title><meta name="robots" content="noindex,nofollow"/></Head>
      <style>{css}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:sideOpen?220:60,background:G.green,display:'flex',flexDirection:'column',transition:'width .2s',flexShrink:0,overflow:'hidden'}}>
          <div style={{padding:'14px',borderBottom:'.5px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <div style={{width:30,height:30,background:G.yellow,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="18" height="11" viewBox="0 0 22 14" fill="none"><path d="M2 11 Q11 1 20 6" stroke="#1C3A28" strokeWidth="3.5" strokeLinecap="round"/><circle cx="2" cy="11" r="1.8" fill="#1C3A28"/></svg>
            </div>
            {sideOpen&&<div><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:G.yellow,lineHeight:1}}>banello</div><div style={{fontSize:9,color:'rgba(168,197,176,.6)',letterSpacing:'.12em',textTransform:'uppercase',marginTop:2}}>Admin</div></div>}
          </div>
          <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
            {navItems.map(([id,ic,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',width:'100%',background:tab===id?'rgba(232,184,75,.12)':'transparent',border:'none',borderLeft:`3px solid ${tab===id?G.yellow:'transparent'}`,color:tab===id?G.yellow:'rgba(255,255,255,.65)',fontSize:13,fontWeight:tab===id?600:400,transition:'all .15s',whiteSpace:'nowrap',overflow:'hidden',textAlign:'left'}}>
                <span style={{flexShrink:0,fontSize:16}}>{ic}</span>
                {sideOpen&&<span>{label}</span>}
              </button>
            ))}
          </nav>
          <div style={{padding:'12px 14px',borderTop:'.5px solid rgba(255,255,255,.08)'}}>
            <button onClick={handleLogout} style={{display:'flex',alignItems:'center',gap:10,color:'rgba(255,255,255,.5)',background:'transparent',border:'none',fontSize:12,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',cursor:'pointer'}}>
              <span style={{fontSize:16}}>⎋</span>{sideOpen&&'Sign out'}
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* TOPBAR */}
          <div style={{background:G.white,padding:'0 20px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${G.g100}`,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button onClick={()=>setSideOpen(p=>!p)} style={{background:'transparent',border:'none',fontSize:18,color:G.g400,padding:4}}>☰</button>
              <div style={{fontSize:14,fontWeight:600}}>{navItems.find(n=>n[0]===tab)?.[2]}</div>
              <div style={{fontSize:11,color:G.g400}}>· {new Date().toLocaleDateString('en-UG',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:12,color:G.g400}}>admin@banello.ug</div>
              <div style={{width:30,height:30,borderRadius:'50%',background:G.yellow,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:G.green}}>A</div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{flex:1,overflowY:'auto',padding:20}} className="fade">

            {/* OVERVIEW */}
            {tab==='overview'&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                  {metric(fmtUGX(financialSummary.revenue.total,true),'Revenue (May)',G.green,'+29% vs April')}
                  {metric(fmtUGX(financialSummary.netProfit,true),'Net profit',G.mid,'30% margin')}
                  {metric(String(sales.length),'Total orders',G.blue)}
                  {metric('4.7%','Waste rate','#E65100','Target <5%')}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {card(<>
                    {cardH('Recent orders',<button onClick={()=>setTab('orders')} className="btn btn-ghost btn-sm">View all →</button>)}
                    {sales.slice(0,5).map(s=>(
                      <div key={s.id} className="lirow">
                        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{s.customerName}</div><div style={{fontSize:10,color:G.g400}}>{s.orderNumber} · {fmtDate(s.date,'short')}</div></div>
                        <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:600,color:'#1B5E20'}}>{fmtUGX(s.totalAmount)}</div><Badge status={s.status}/></div>
                      </div>
                    ))}
                  </>)}
                  {card(<>
                    {cardH('Rider status',<button onClick={()=>setTab('dispatch')} className="btn btn-ghost btn-sm">Dispatch →</button>)}
                    {RIDERS.map(r=>(
                      <div key={r.id} className="lirow">
                        <div style={{width:32,height:32,borderRadius:'50%',background:G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:G.green,flexShrink:0}}>{r.name.split(' ').map(n=>n[0]).join('')}</div>
                        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{r.name}</div><div style={{fontSize:10,color:G.g400}}>{r.zone}</div></div>
                        <Badge status={r.status}/>
                      </div>
                    ))}
                  </>)}
                </div>
                {card(<>
                  {cardH('KPI performance')}
                  <div style={{padding:16}}>
                    <ProgressBar label="Net margin" value={30} max={100} color={G.green} display="30% ✓"/>
                    <ProgressBar label="Waste rate" value={4.7} max={10} color="#E65100" display="4.7%"/>
                    <ProgressBar label="Grade A yield" value={76} max={100} color={G.green} display="76% ✓"/>
                    <ProgressBar label="Same-day pay" value={94} max={100} color={G.green} display="94%"/>
                    <ProgressBar label="Delivery rating" value={4.6} max={5} color={G.blue} display="4.6/5"/>
                  </div>
                </>)}
              </>
            )}

            {/* ORDERS */}
            {tab==='orders'&&(
              <>
                <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  {['all','confirmed','pending','overdue','dispatched','delivered'].map(f=>(
                    <button key={f} onClick={()=>setOrderFilter(f)} className="btn btn-sm" style={{background:orderFilter===f?G.green:'transparent',color:orderFilter===f?'#fff':G.g600,border:`1.5px solid ${orderFilter===f?G.green:G.g200}`,textTransform:'capitalize'}}>{f}</button>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}} onClick={()=>downloadCSV(sales.map(s=>({order:s.orderNumber,date:s.date,customer:s.customerName,amount:s.totalAmount,status:s.status})),'banello-orders.csv')}>Export CSV</button>
                </div>
                {card(<div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
                    <thead><tr>{['Order','Customer','Date','Channel','Total','Status','Invoice','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredSales.map(s=>(
                        <tr key={s.id}>
                          <td style={{fontFamily:'monospace',color:G.blue,fontSize:11}}>{s.orderNumber}</td>
                          <td style={{fontWeight:500}}>{s.customerName}</td>
                          <td style={{color:G.g400}}>{fmtDate(s.date,'short')}</td>
                          <td><span style={{fontSize:10,background:G.g50,borderRadius:4,padding:'2px 6px'}}>{s.channel.replace(/-/g,' ')}</span></td>
                          <td style={{fontWeight:600,color:'#1B5E20'}}>{fmtUGX(s.totalAmount)}</td>
                          <td><Badge status={s.status}/></td>
                          <td style={{color:G.g400,fontSize:11}}>{s.invoiceNumber||'—'}</td>
                          <td><button onClick={()=>showToast(`Invoice ${s.invoiceNumber||'generated'} — downloading`)} className="btn btn-sm" style={{background:G.pale,color:G.green,border:'none',fontSize:10}}>Invoice</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>)}
              </>
            )}

            {/* DISPATCH */}
            {tab==='dispatch'&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                  {RIDERS.map(r=>(
                    <div key={r.id} style={{background:G.white,borderRadius:12,border:`1px solid ${G.g100}`,borderLeft:`3px solid ${r.status==='available'?G.green:r.status==='on-run'?G.blue:G.g200}`,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <div style={{width:38,height:38,borderRadius:'50%',background:G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:G.green}}>{r.name.split(' ').map(n=>n[0]).join('')}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{r.name}</div><div style={{fontSize:11,color:G.g400}}>{r.zone}</div></div>
                        <Badge status={r.status}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11,color:G.g600,marginBottom:r.status==='available'?10:0}}>
                        <span>⭐ {r.rating}</span><span>📦 {r.deliveries} delivered</span>
                      </div>
                      {r.status==='available'&&<button onClick={()=>showToast(`WhatsApp sent to ${r.name} with today's delivery list`)} className="btn btn-primary" style={{width:'100%',padding:'8px',fontSize:12}}>📱 Send delivery list via WhatsApp</button>}
                    </div>
                  ))}
                </div>
                {card(<>
                  {cardH('Assign riders to orders')}
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
                      <thead><tr>{['Order','Customer','Zone','Status','Assign rider','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {sales.filter(s=>['pending','confirmed','packed'].includes(s.status)).slice(0,8).map(s=>(
                          <tr key={s.id}>
                            <td style={{fontFamily:'monospace',color:G.blue,fontSize:11}}>{s.orderNumber}</td>
                            <td style={{fontWeight:500}}>{s.customerName}</td>
                            <td style={{color:G.g400,fontSize:11}}>Kampala</td>
                            <td><Badge status={riderAssign[s.id]?'dispatched':s.status}/></td>
                            <td>
                              <select value={riderAssign[s.id]||''} onChange={e=>assignRider(s.id,e.target.value)} style={{fontSize:11,padding:'5px 8px',borderRadius:6,border:`1px solid ${G.g200}`,fontFamily:"'DM Sans',sans-serif",background:G.white}}>
                                <option value="">Select rider…</option>
                                {RIDERS.filter(r=>r.status==='available').map(r=><option key={r.id} value={r.id}>{r.name} — {r.zone}</option>)}
                              </select>
                            </td>
                            <td>{riderAssign[s.id]&&<button onClick={()=>showToast(`Customer notified for ${s.orderNumber}`)} className="btn btn-sm" style={{background:G.blueL,color:G.blue,border:'none',fontSize:10}}>Notify customer</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>)}
              </>
            )}

            {/* STOCK */}
            {tab==='stock'&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                  {metric(String(stockBatches.reduce((s,b)=>s+b.remainingQty,0)),'Bunches in stock',G.green)}
                  {metric(String(stockBatches.filter(b=>b.wasteQty>0).reduce((s,b)=>s+b.wasteQty,0)),'Total waste',G.red)}
                  {metric('76%','Avg Grade A yield',G.green)}
                  {metric(String(stockBatches.length),'Total batches',G.blue)}
                </div>
                {card(<div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
                    <thead><tr>{['Batch','Farmer','Qty','Grade A','Grade B','Grade C','Waste','Remaining','Status','Margin'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {stockBatches.map(b=>{const{margin}=calcBatchMargin(b);return(
                        <tr key={b.id}>
                          <td style={{fontFamily:'monospace',color:G.blue,fontSize:11}}>{b.batchNumber}</td>
                          <td style={{fontWeight:500}}>{b.farmerName}</td>
                          <td>{b.purchasedQty}</td>
                          <td style={{color:'#1B5E20',fontWeight:600}}>{b.gradeAQty}</td>
                          <td style={{color:G.blue}}>{b.gradeBQty}</td>
                          <td style={{color:G.g400}}>{b.gradeCQty}</td>
                          <td style={{color:G.red}}>{b.wasteQty}</td>
                          <td style={{fontWeight:600}}>{b.remainingQty}</td>
                          <td><Badge status={b.status}/></td>
                          <td style={{color:margin>40?'#1B5E20':'#E65100',fontWeight:600}}>{fmtPct(margin)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>)}
              </>
            )}

            {/* COSTS */}
            {tab==='costs'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  {card(<>
                    {cardH('Log a cost')}
                    <div style={{padding:16}}>
                      {selField('Category',{value:newExp.category,onChange:e=>setNewExp(p=>({...p,category:e.target.value}))},Object.entries(categoryLabels).map(([k,v])=><option key={k} value={k}>{v}</option>))}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                        <div><label className="field-lbl">Amount (UGX)</label><input type="number" className="field-inp" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} placeholder="0"/></div>
                        <div><label className="field-lbl">Date</label><input type="date" className="field-inp" value={newExp.date} onChange={e=>setNewExp(p=>({...p,date:e.target.value}))}/></div>
                      </div>
                      {inpField('Description',{value:newExp.description,onChange:e=>setNewExp(p=>({...p,description:e.target.value})),placeholder:'e.g. Truck Mbale→Kampala 62 bunches'})}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                        {selField('Payment method',{value:newExp.method,onChange:e=>setNewExp(p=>({...p,method:e.target.value}))},Object.entries(paymentLabels).map(([k,v])=><option key={k} value={k}>{v}</option>))}
                        {selField('Attach to batch',{value:newExp.attach,onChange:e=>setNewExp(p=>({...p,attach:e.target.value}))},<><option value="">— None —</option>{stockBatches.map(b=><option key={b.id} value={b.id}>Batch {b.batchNumber} — {b.farmerName}</option>)}</>)}
                      </div>
                      {inpField('Receipt / MoMo ref',{value:newExp.ref,onChange:e=>setNewExp(p=>({...p,ref:e.target.value})),placeholder:'e.g. MTN-XK7291'})}
                      <button onClick={logExpense} className="btn btn-primary" style={{width:'100%'}}>Save cost entry</button>
                    </div>
                  </>)}
                </div>
                <div>
                  <div style={{background:G.white,borderRadius:10,border:`1px solid ${G.g100}`,padding:14,borderLeft:`3px solid ${G.red}`,boxShadow:'0 1px 4px rgba(0,0,0,.04)',marginBottom:12}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.red}}>{fmtUGX(totalExp,true)}</div>
                    <div style={{fontSize:11,color:G.g400}}>Total costs — {localExpenses.length} entries</div>
                  </div>
                  {card(<div style={{maxHeight:460,overflowY:'auto'}}>
                    {localExpenses.map(e=>(
                      <div key={e.id} className="lirow">
                        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{e.description}</div><div style={{fontSize:10,color:G.g400}}>{fmtDate(e.date,'short')} · {paymentLabels[e.paymentMethod]}{e.attachedToBatch?` · 📎 ${e.attachedToBatch}`:''}</div></div>
                        <div style={{fontFamily:'monospace',fontSize:12,fontWeight:600,color:G.red,flexShrink:0}}>{fmtUGX(e.amount)}</div>
                      </div>
                    ))}
                  </div>)}
                </div>
              </div>
            )}

            {/* FINANCIALS */}
            {tab==='financials'&&(
              <>
                <div style={{display:'flex',background:G.g100,borderRadius:10,padding:3,marginBottom:14,width:'fit-content'}}>
                  {(['pl','bs','cf'] as const).map(t=>(
                    <button key={t} onClick={()=>setFinTab(t)} style={{padding:'8px 20px',borderRadius:8,border:'none',fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:finTab===t?G.white:'transparent',color:finTab===t?G.green:G.g400,boxShadow:finTab===t?'0 1px 4px rgba(0,0,0,.08)':'none',cursor:'pointer'}}>
                      {t==='pl'?'P&L':t==='bs'?'Balance sheet':'Cash flow'}
                    </button>
                  ))}
                </div>
                <div style={{maxWidth:600}}>
                  <div style={{background:G.white,borderRadius:12,border:`1px solid ${G.g100}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
                    <div style={{background:G.green,padding:14,position:'relative'}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:G.yellow}}>{finTab==='pl'?'Statement of Profit or Loss':finTab==='bs'?'Statement of Financial Position':'Statement of Cash Flows'}</div>
                      <div style={{fontSize:11,color:'rgba(168,197,176,.8)',marginTop:3}}>{finTab==='pl'?'Month ended 31 May 2026 · IFRS / IAS 1':finTab==='bs'?'As at 31 May 2026 · IFRS / IAS 1':'Month ended 31 May 2026 · IAS 7 indirect'}</div>
                      <div style={{height:2,background:'linear-gradient(90deg,#E8B84B,#D4A830)',marginTop:10,borderRadius:1}}/>
                    </div>
                    <div style={{padding:'0 16px 8px'}}>
                      {finTab==='pl'&&(<>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Revenue</div>
                        <StmtRow label="Kampala premium delivery" value={fmtUGX(financialSummary.revenue.kampalaDelivery)} indent positive/>
                        <StmtRow label="Border trade — Malaba / Busia" value={fmtUGX(financialSummary.revenue.borderTrade)} indent positive/>
                        <StmtRow label="Delivery fees" value={fmtUGX(financialSummary.revenue.deliveryFees)} indent positive/>
                        <StmtRow label="Total revenue" value={fmtUGX(financialSummary.revenue.total)} subtotal positive/>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Cost of goods sold</div>
                        <StmtRow label="Stock purchases — banana" value={`(${fmtUGX(financialSummary.cogs.stockBanana)})`} indent negative/>
                        <StmtRow label="Stock purchases — other produce" value={`(${fmtUGX(financialSummary.cogs.stockOther)})`} indent negative/>
                        <StmtRow label="Gross profit" value={fmtUGX(financialSummary.grossProfit)} subtotal positive/>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Operating expenses</div>
                        <StmtRow label="Transport" value={`(${fmtUGX(financialSummary.operatingExpenses.transportLongHaul)})`} indent negative/>
                        <StmtRow label="Rider commissions" value={`(${fmtUGX(financialSummary.operatingExpenses.riderCommissions)})`} indent negative/>
                        <StmtRow label="Tricycle hire" value={`(${fmtUGX(financialSummary.operatingExpenses.tricycleHire)})`} indent negative/>
                        <StmtRow label="Packaging + other" value={`(${fmtUGX(financialSummary.operatingExpenses.packaging+financialSummary.operatingExpenses.other)})`} indent negative/>
                        <StmtRow label="Waste write-off" value={`(${fmtUGX(financialSummary.operatingExpenses.wasteWriteOff)})`} indent negative/>
                      </>)}
                      {finTab==='bs'&&(<>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Current assets</div>
                        <StmtRow label="Cash and cash equivalents" value={fmtUGX(financialSummary.cashBalance)} indent positive/>
                        <StmtRow label="Trade receivables" value={fmtUGX(financialSummary.tradeReceivables)} indent positive/>
                        <StmtRow label="Inventory — produce at hub" value={fmtUGX(financialSummary.inventory)} indent positive/>
                        <StmtRow label="Total current assets" value={fmtUGX(financialSummary.cashBalance+financialSummary.tradeReceivables+financialSummary.inventory)} subtotal positive/>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Liabilities</div>
                        <StmtRow label="Tax payable — URA" value={`(${fmtUGX(financialSummary.taxPayable)})`} indent negative/>
                        <StmtRow label="Accrued expenses" value={`(${fmtUGX(62000)})`} indent negative/>
                        <StmtRow label="Total liabilities" value={`(${fmtUGX(financialSummary.taxPayable+62000)})`} subtotal negative/>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Equity</div>
                        <StmtRow label="Founder capital" value={fmtUGX(1500000)} indent positive/>
                        <StmtRow label="Retained earnings" value={fmtUGX(407000)} indent positive/>
                        <StmtRow label="Total equity" value={fmtUGX(1907000)} subtotal positive/>
                      </>)}
                      {finTab==='cf'&&(<>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Operating activities</div>
                        <StmtRow label="Profit before tax" value={fmtUGX(financialSummary.profitBeforeTax)} indent positive/>
                        <StmtRow label="Depreciation" value={fmtUGX(5000)} indent positive/>
                        <StmtRow label="Increase in receivables" value={`(${fmtUGX(financialSummary.tradeReceivables)})`} indent negative/>
                        <StmtRow label="Net cash from operations" value={fmtUGX(financialSummary.profitBeforeTax+5000-financialSummary.tradeReceivables)} subtotal positive/>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Financing activities</div>
                        <StmtRow label="Founder capital injection" value={fmtUGX(1500000)} indent positive/>
                        <StmtRow label="Net cash from financing" value={fmtUGX(1500000)} subtotal positive/>
                      </>)}
                    </div>
                    <StmtRow label={finTab==='pl'?'Profit before tax':finTab==='bs'?'Net assets':'Closing cash balance'} value={fmtUGX(finTab==='pl'?financialSummary.profitBeforeTax:finTab==='bs'?1907000:financialSummary.cashBalance)} total positive/>
                    {finTab==='pl'&&<><div style={{padding:'0 16px'}}><StmtRow label="Income tax — 30% CIT" value={`(${fmtUGX(financialSummary.corporateIncomeTax)})`} indent negative/></div><StmtRow label="Net profit for period" value={fmtUGX(financialSummary.netProfit)} total positive/></>}
                    <div style={{textAlign:'center',fontSize:10,color:G.g400,padding:'10px 16px',borderTop:`1px solid ${G.g100}`,fontStyle:'italic'}}>Prepared in accordance with IFRS · Banello Fresh Produce Ltd · TIN: 1234567890</div>
                  </div>
                </div>
              </>
            )}

            {/* FARMERS */}
            {tab==='farmers'&&card(<div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Farmer','District','Phone','MoMo','Varieties','Grade A%','Reliability','Lifetime paid','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {farmers.map(f=>(
                    <tr key={f.id}>
                      <td style={{fontWeight:600}}>{f.name}</td>
                      <td style={{color:G.g600}}>{f.district}</td>
                      <td style={{fontFamily:'monospace',fontSize:11}}>{f.phone}</td>
                      <td style={{fontFamily:'monospace',fontSize:11,color:'#E65100'}}>{f.momoNumber}</td>
                      <td style={{fontSize:11}}>{f.varieties.join(', ')}</td>
                      <td style={{color:'#1B5E20',fontWeight:600}}>{f.gradeAYield}%</td>
                      <td>{f.reliabilityScore}/100</td>
                      <td style={{color:'#1B5E20',fontWeight:600}}>{fmtUGX(f.totalLifetimePaid,true)}</td>
                      <td><Badge status={f.isActive?'active':'review'}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>)}

            {/* CUSTOMERS */}
            {tab==='customers'&&card(<div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Customer','Type','Orders','Total spend','Last order','Status','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {Array.from(new Map(sales.map(s=>[s.customerName,s])).values()).map(s=>(
                    <tr key={s.customerName}>
                      <td style={{fontWeight:600}}>{s.customerName}</td>
                      <td style={{textTransform:'capitalize',fontSize:11,color:G.g600}}>{s.customerType.replace(/-/g,' ')}</td>
                      <td>{sales.filter(x=>x.customerName===s.customerName).length}</td>
                      <td style={{fontWeight:600,color:'#1B5E20'}}>{fmtUGX(sales.filter(x=>x.customerName===s.customerName).reduce((t,x)=>t+x.totalAmount,0),true)}</td>
                      <td style={{color:G.g600,fontSize:11}}>{fmtDate(s.date,'short')}</td>
                      <td><Badge status={s.status}/></td>
                      <td><button onClick={()=>showToast(`WhatsApp opened for ${s.customerName}`)} className="btn btn-sm" style={{background:G.pale,color:G.green,border:'none',fontSize:10}}>WhatsApp</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>)}

            {/* REPORTS */}
            {tab==='reports'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {ic:'📊',title:'P&L statement — May 2026',meta:'IFRS / IAS 1 · PDF',color:G.pale},
                  {ic:'⚖️',title:'Balance sheet — May 2026',meta:'IFRS / IAS 1 · PDF',color:G.blueL},
                  {ic:'💧',title:'Cash flow — May 2026',meta:'IAS 7 · PDF',color:G.pale},
                  {ic:'🌿',title:'Farmer payment ledger',meta:'All 8 farmers · CSV',color:G.yl},
                  {ic:'💸',title:'Full expense ledger',meta:'All entries · CSV',color:G.redL},
                  {ic:'🏛',title:'URA VAT return Q1 2026',meta:'Pre-filled · Due in 8 days',color:'#E8EAF6'},
                  {ic:'📦',title:'Stock batch analysis',meta:'All batches · CSV',color:G.yl},
                  {ic:'🌍',title:'Impact report — farmer payments',meta:'Shareable PDF',color:'#EDE9FE'},
                ].map(({ic,title,meta,color})=>(
                  <div key={title} onClick={()=>showToast(`${title} — downloading`)} style={{background:G.white,borderRadius:12,border:`1px solid ${G.g100}`,display:'flex',alignItems:'center',gap:12,padding:14,cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.04)',transition:'all .15s'}}>
                    <div style={{width:44,height:44,borderRadius:10,background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{ic}</div>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{title}</div><div style={{fontSize:11,color:G.g400}}>{meta}</div></div>
                    <div style={{fontSize:11,color:G.leaf,fontWeight:600,flexShrink:0}}>Download →</div>
                  </div>
                ))}
              </div>
            )}

            {/* URA */}
            {tab==='ura'&&(
              <>
                <div style={{background:G.blueL,border:`1px solid #BBDEFB`,borderRadius:14,padding:16,marginBottom:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:G.blue,marginBottom:4}}>🏛 Uganda Revenue Authority — Tax Filing</div>
                  <div style={{fontSize:12,color:G.blue,opacity:.75,marginBottom:12}}>Banello Fresh Produce Ltd · TIN: 1234567890 · Reg: BF-2026-001</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div style={{background:'rgba(255,255,255,.7)',borderRadius:8,padding:10}}><div style={{fontSize:16,fontWeight:600,color:'#E65100'}}>8 days</div><div style={{fontSize:11,color:G.g400}}>VAT return due</div></div>
                    <div style={{background:'rgba(255,255,255,.7)',borderRadius:8,padding:10}}><div style={{fontSize:16,fontWeight:600}}>{fmtUGX(financialSummary.corporateIncomeTax)}</div><div style={{fontSize:11,color:G.g400}}>CIT payable (UGX)</div></div>
                  </div>
                </div>
                <div style={{maxWidth:600}}>
                  <div style={{background:G.white,borderRadius:12,border:`1px solid ${G.g100}`,overflow:'hidden',marginBottom:14}}>
                    <div style={{background:G.green,padding:12}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:G.yellow}}>VAT Return — Form VAT 1</div><div style={{fontSize:11,color:'rgba(168,197,176,.8)',marginTop:2}}>Quarter ended 31 March 2026 · Uganda VAT Act Cap 349</div></div>
                    <div style={{padding:'0 16px 8px'}}>
                      <div style={{fontSize:10,fontWeight:700,color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Output VAT (sales)</div>
                      <StmtRow label="Standard rated supplies @ 18%" value={fmtUGX(8640000)} indent positive/>
                      <StmtRow label="Exempt supplies (fresh produce)" value={fmtUGX(6480000)} indent/>
                      <StmtRow label="Output VAT collected" value={fmtUGX(1555200)} subtotal positive/>
                      <div style={{fontSize:10,fontWeight:700,color:G.g400,textTransform:'uppercase',borderBottom:`1px solid ${G.g100}`,paddingBottom:4,marginBottom:6,marginTop:12}}>Input VAT</div>
                      <StmtRow label="Input VAT on transport" value={`(${fmtUGX(229500)})`} indent negative/>
                      <StmtRow label="Input VAT on packaging" value={`(${fmtUGX(32400)})`} indent negative/>
                      <StmtRow label="Total input VAT" value={`(${fmtUGX(261900)})`} subtotal negative/>
                    </div>
                    <StmtRow label="VAT payable to URA" value={fmtUGX(1293300)} total positive/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {[['Submit VAT return to URA portal','btn-primary'],['Download pre-filled VAT Form 1 (PDF)','btn-ghost'],['Prepare income tax return (ITF1)','btn-ghost'],['Export tax computation to accountant','btn-ghost']].map(([label,cls])=>(
                      <button key={label} className={`btn ${cls}`} style={{width:'100%',justifyContent:'center'}} onClick={()=>showToast(`${label} — processing`)}>{label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) translateY(${toastShow?0:16}px)`,opacity:toastShow?1:0,background:'#212121',color:'#fff',padding:'10px 20px',borderRadius:99,fontSize:12,fontWeight:500,zIndex:9999,transition:'all .2s',pointerEvents:'none',whiteSpace:'nowrap'}}>
        {toast}
      </div>
    </>
  )
}
