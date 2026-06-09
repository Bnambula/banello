import Head from 'next/head'
import{useState,useEffect}from'react'

interface CartItem{id:string;name:string;emoji:string;grade:string;origin:string;price:number;unit:string;qty:number}
interface Office{id:string;name:string;area:string;address:string;zone:string;deliveryFee:number;emoji:string}
interface Rider{id:string;name:string;zone:string;rating:number;deliveries:number;status:'available'|'on-run'}
type Page='home'|'shop'|'cart'|'checkout'|'confirmation'|'subscribe'|'about'

const PRODUCTS=[
  {id:'P001',name:'Bogoya Banana',emoji:'🍌',grade:'Grade A',origin:'Bududa',price:17000,unit:'per bunch',badge:'Premium',bc:'#1B5E20',desc:'Sweet ripe Bogoya from Mount Elgon. Large, uniform bunches. Office favourite.'},
  {id:'P002',name:'Bogoya Banana',emoji:'🍌',grade:'Grade B',origin:'Manafwa',price:13000,unit:'per bunch',badge:'Value',bc:'#1565C0',desc:'Quality Bogoya at a great price. Ideal for bulk office orders.'},
  {id:'P003',name:'Nakitembe Banana',emoji:'🍌',grade:'Grade A',origin:'Sironko',price:15000,unit:'per bunch',badge:'Popular',bc:'#6A1B9A',desc:'Long shelf life and sweet flavour. Staff canteen favourite.'},
  {id:'P004',name:'Passion Fruit',emoji:'🌿',grade:'Fresh',origin:'Masaka',price:12000,unit:'per kg',badge:'In season',bc:'#E65100',desc:'Tangy, fragrant. Perfect alongside bananas for a full fruit offering.'},
  {id:'P005',name:'Oranges',emoji:'🍊',grade:'Fresh',origin:'Luwero',price:8000,unit:'per kg',badge:'Fresh',bc:'#2E7D32',desc:'Sweet Ugandan oranges, harvested this week.'},
  {id:'P006',name:'Mangoes',emoji:'🥭',grade:'Fresh',origin:'Mbale',price:10000,unit:'per kg',badge:'Seasonal',bc:'#F57F17',desc:'World-class Mbale mangoes. Order now — seasonal stock limited.'},
  {id:'P007',name:'Tomatoes',emoji:'🍅',grade:'Fresh',origin:'Masaka',price:6000,unit:'per kg',badge:'Staple',bc:'#B71C1C',desc:'Farm-fresh tomatoes for office kitchens.'},
  {id:'P008',name:'Onions',emoji:'🧅',grade:'Fresh',origin:'Kasese',price:5000,unit:'per kg',badge:'Staple',bc:'#4E342E',desc:'Quality onions for office kitchen use.'},
]

const OFFICES:Office[]=[
  {id:'O001',name:'Communications House',area:'Kampala CBD',address:'1 Colville St, Kampala',zone:'CBD',deliveryFee:5000,emoji:'🏢'},
  {id:'O002',name:'Workers House',area:'Kampala CBD',address:'1 Pilkington Rd, Kampala',zone:'CBD',deliveryFee:5000,emoji:'🏢'},
  {id:'O003',name:'Crested Towers',area:'Kampala CBD',address:'17A Hannington Rd',zone:'CBD',deliveryFee:5000,emoji:'🏙'},
  {id:'O004',name:'Nakawa Business Park',area:'Nakawa',address:'Jinja Rd, Nakawa',zone:'Nakawa',deliveryFee:6000,emoji:'🏗'},
  {id:'O005',name:'UNICEF Uganda',area:'Kololo',address:'Plot 9 George St, Kololo',zone:'Kololo',deliveryFee:5000,emoji:'🌍'},
  {id:'O006',name:'MTN Uganda HQ',area:'Kololo',address:'Plot 22 Hannington Rd',zone:'Kololo',deliveryFee:5000,emoji:'📡'},
  {id:'O007',name:'Stanbic Bank HQ',area:'Nakasero',address:'45 Jinja Rd, Nakasero',zone:'Nakasero',deliveryFee:5000,emoji:'🏦'},
  {id:'O008',name:'Serena Hotel',area:'Nakasero',address:'Kintu Rd, Nakasero',zone:'Nakasero',deliveryFee:5000,emoji:'🏨'},
  {id:'O009',name:'Centenary Bank HQ',area:'Entebbe Rd',address:'Plot 7 Entebbe Rd',zone:'Nakasero',deliveryFee:5000,emoji:'🏦'},
  {id:'O010',name:'Ntinda Business Centre',area:'Ntinda',address:'Ntinda Rd',zone:'Ntinda',deliveryFee:7000,emoji:'🏬'},
  {id:'O011',name:'Kiwatule Complex',area:'Kiwatule',address:'Kiwatule-Kyanja Rd',zone:'Kiwatule',deliveryFee:8000,emoji:'🏢'},
  {id:'O012',name:'Garden City Mall',area:'Kololo',address:'14 Yusuf Lule Rd',zone:'Kololo',deliveryFee:5000,emoji:'🛍'},
  {id:'O013',name:'Acacia Mall',area:'Kisementi',address:'Acacia Ave, Kisementi',zone:'Kololo',deliveryFee:5000,emoji:'🛍'},
  {id:'O014',name:'Kampala Capital City Authority',area:'Nakasero',address:'Kampala Rd, Nakasero',zone:'Nakasero',deliveryFee:5000,emoji:'🏛'},
  {id:'O015',name:'Custom address',area:'Enter your location',address:'',zone:'Custom',deliveryFee:9000,emoji:'📍'},
]

const RIDERS:Rider[]=[
  {id:'R001',name:'David Kato',zone:'CBD / Nakasero / Nakawa',rating:4.8,deliveries:62,status:'available'},
  {id:'R002',name:'Jane Mukasa',zone:'Kololo / Naguru / Kisementi',rating:4.9,deliveries:108,status:'available'},
  {id:'R003',name:'Moses Ringo',zone:'Ntinda / Kiwatule / Najjera',rating:4.6,deliveries:44,status:'on-run'},
  {id:'R004',name:'Ruth Aber',zone:'Muyenga / Bugolobi / Luzira',rating:4.7,deliveries:31,status:'available'},
  {id:'R005',name:'Peter Okello',zone:'Nakawa / Banda / Kireka',rating:4.5,deliveries:27,status:'available'},
]

const ZONES=['All zones','CBD','Kololo','Nakasero','Ntinda','Nakawa','Kiwatule','Custom']

function fmtUGX(n:number){return new Intl.NumberFormat('en-UG').format(Math.round(n))}
function Stars({r}:{r:number}){return<span style={{color:'#E8B84B',fontSize:12}}>{'★'.repeat(Math.floor(r))}{'☆'.repeat(5-Math.floor(r))}<span style={{color:'#9E9E9E',fontSize:10,marginLeft:3}}>{r}</span></span>}

const G={
  green:'#1C3A28',mid:'#2D5A3D',leaf:'#4A7A5A',
  mist:'#A8C5B0',pale:'#EAF3EE',
  yellow:'#E8B84B',yd:'#D4A830',yl:'#FDF4DC',
  cream:'#F8F4EE',white:'#fff',
  g50:'#F9F9F9',g100:'#EEEEEE',g200:'#E0E0E0',
  g400:'#9E9E9E',g600:'#616161',g900:'#121212',
  red:'#B71C1C',redL:'#FFEBEE',blue:'#1565C0',
}

function Toast({msg,show}:{msg:string;show:boolean}){
  return<div style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) translateY(${show?0:16}px)`,opacity:show?1:0,zIndex:9999,pointerEvents:'none',background:G.green,color:G.yellow,padding:'11px 22px',borderRadius:99,fontSize:13,fontWeight:600,transition:'all 0.22s',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(28,58,40,0.35)'}}>{msg}</div>
}

function BanelloLogo({size=22}:{size?:number}){
  return<svg width={size} height={Math.round(size*0.64)} viewBox="0 0 22 14" fill="none">
    <path d="M2 11 Q11 1 20 6" stroke="#E8B84B" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="2" cy="11" r="1.8" fill="#E8B84B"/>
  </svg>
}

export default function BanelloHome(){
  const[page,setPage]=useState<Page>('home')
  const[cart,setCart]=useState<CartItem[]>([])
  const[selOffice,setSelOffice]=useState<Office|null>(null)
  const[selRider,setSelRider]=useState<Rider|null>(null)
  const[customAddr,setCustomAddr]=useState('')
  const[name,setName]=useState('')
  const[phone,setPhone]=useState('')
  const[email,setEmail]=useState('')
  const[company,setCompany]=useState('')
  const[delDate,setDelDate]=useState('')
  const[delNote,setDelNote]=useState('')
  const[payMethod,setPayMethod]=useState('mtn-momo')
  const[momoNum,setMomoNum]=useState('')
  const[officeSearch,setOfficeSearch]=useState('')
  const[officeZone,setOfficeZone]=useState('All zones')
  const[prodFilter,setProdFilter]=useState('All')
  const[orderRef,setOrderRef]=useState('')
  const[toastMsg,setToastMsg]=useState('')
  const[toastShow,setToastShow]=useState(false)
  const[menuOpen,setMenuOpen]=useState(false)
  const[heroIdx,setHeroIdx]=useState(0)

  const cartTotal=cart.reduce((s,i)=>s+i.price*i.qty,0)
  const cartCount=cart.reduce((s,i)=>s+i.qty,0)

  useEffect(()=>{const t=setInterval(()=>setHeroIdx(i=>(i+1)%3),4500);return()=>clearInterval(t)},[])
  useEffect(()=>{const d=new Date();d.setDate(d.getDate()+1);setDelDate(d.toISOString().split('T')[0])},[])

  function toast(msg:string){setToastMsg(msg);setToastShow(true);setTimeout(()=>setToastShow(false),2600)}

  function addToCart(p:typeof PRODUCTS[0]){
    setCart(prev=>{
      const ex=prev.find(i=>i.id===p.id)
      if(ex)return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i)
      return[...prev,{id:p.id,name:p.name,emoji:p.emoji,grade:p.grade,origin:p.origin,price:p.price,unit:p.unit,qty:1}]
    })
    toast(`${p.emoji} ${p.name} added to cart`)
  }

  function chgQty(id:string,delta:number){setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(0,i.qty+delta)}:i).filter(i=>i.qty>0))}
  function removeItem(id:string){setCart(prev=>prev.filter(i=>i.id!==id))}
  function navTo(p:Page){setPage(p);setMenuOpen(false);window.scrollTo(0,0)}

  function placeOrder(){
    const ref=`BNL-${Math.floor(Math.random()*9000)+1000}`
    setOrderRef(ref)
    setPage('confirmation')
    toast('Order placed successfully!')
  }

  const filteredOffices=OFFICES.filter(o=>{
    const ms=!officeSearch||o.name.toLowerCase().includes(officeSearch.toLowerCase())||o.area.toLowerCase().includes(officeSearch.toLowerCase())
    const mz=officeZone==='All zones'||o.zone===officeZone
    return ms&&mz
  })

  const filteredProds=prodFilter==='All'?PRODUCTS:prodFilter==='Bananas'?PRODUCTS.filter(p=>p.name.includes('Banana')):PRODUCTS.filter(p=>!p.name.includes('Banana'))
  const availRiders=RIDERS.filter(r=>r.status==='available')

  const heroSlides=[
    {headline:'Glides down the throat.',sub:'Extra fresh from the breezy mountains of Bugisu.'},
    {headline:'Farm gate to your office.',sub:'Harvested this week. Delivered by 9 AM tomorrow.'},
    {headline:'Fresh. Direct. Reliable.',sub:'30+ Bugisu farmers. 75+ Kampala offices. Every week.'},
  ]

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    html{scroll-behavior:smooth}
    body{font-family:'DM Sans',-apple-system,sans-serif;background:#F8F4EE;color:#121212;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
    button,input,select,textarea{font-family:inherit}
    button{cursor:pointer}
    ::selection{background:#E8B84B;color:#1C3A28}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:#E0E0E0;border-radius:4px}
    input:focus,select:focus,textarea:focus{outline:none;border-color:#4A7A5A!important;box-shadow:0 0 0 3px rgba(74,122,90,0.12)!important}
    .chover{transition:transform .18s,box-shadow .18s}.chover:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.10)}
    .bscale:active{transform:scale(0.97)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes heroFade{from{opacity:0}to{opacity:1}}
    .fade-in{animation:fadeUp .3s ease both}
    .hero-anim{animation:heroFade .6s ease}
    .slide-down{animation:slideDown .2s ease}
    @media(max-width:600px){.hide-m{display:none!important}.grid3m{grid-template-columns:1fr 1fr!important}.pp{padding:14px!important}}
    @media(min-width:601px){.hide-d{display:none!important}}
  `

  /* ── SHARED UI COMPONENTS ── */
  const NavBar=()=>(
    <nav style={{position:'sticky',top:0,zIndex:100,background:G.green,height:58,display:'flex',alignItems:'center',padding:'0 20px',gap:16,boxShadow:'0 1px 0 rgba(255,255,255,0.06)'}}>
      <div onClick={()=>navTo('home')} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexShrink:0}}>
        <div style={{width:36,height:36,background:G.yellow,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}><BanelloLogo size={22}/></div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:G.yellow,lineHeight:1,letterSpacing:.5}}>banello</div>
          <div style={{fontSize:9,color:G.mist,letterSpacing:'.14em',textTransform:'uppercase',lineHeight:1}}>FRESH PRODUCE</div>
        </div>
      </div>
      <div className="hide-m" style={{display:'flex',gap:4,marginLeft:16,flex:1}}>
        {(['home','shop','subscribe','about'] as Page[]).map(p=>(
          <button key={p} onClick={()=>navTo(p)} style={{background:page===p?'rgba(232,184,75,.12)':'transparent',border:'none',color:page===p?G.yellow:'rgba(255,255,255,.7)',padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:page===p?600:400,textTransform:'capitalize',transition:'all .15s'}}>{p}</button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:'auto',flexShrink:0}}>
        <button onClick={()=>navTo('cart')} className="bscale" style={{background:cartCount>0?G.yellow:'rgba(255,255,255,.1)',border:'none',borderRadius:10,padding:'8px 14px',display:'flex',alignItems:'center',gap:8,color:cartCount>0?G.green:'#fff',fontSize:13,fontWeight:600,transition:'all .18s'}}>
          <span>🛒</span>
          {cartCount>0&&<span>{cartCount} · UGX {fmtUGX(cartTotal)}</span>}
          {cartCount===0&&<span className="hide-m">Cart</span>}
        </button>
        <button className="hide-d" onClick={()=>setMenuOpen(m=>!m)} style={{background:'transparent',border:'none',color:'#fff',fontSize:22,padding:4}}>{menuOpen?'✕':'☰'}</button>
      </div>
    </nav>
  )

  const MobileMenu=()=>menuOpen?(
    <div className="hide-d slide-down" style={{background:G.green,padding:'8px 0 16px',borderBottom:`2px solid ${G.yellow}`}}>
      {(['home','shop','subscribe','about'] as Page[]).map(p=>(
        <button key={p} onClick={()=>navTo(p)} style={{display:'block',width:'100%',padding:'12px 20px',background:'transparent',border:'none',color:'rgba(255,255,255,.85)',fontSize:14,fontWeight:500,textAlign:'left',textTransform:'capitalize'}}>{p}</button>
      ))}
    </div>
  ):null

  /* ─── HOME ─── */
  if(page==='home') return(
    <>
      <Head><title>Banello — Fresh from the Mountain</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><meta name="description" content="Premium fresh bananas from Bugisu, delivered to your Kampala office by 9 AM."/><link rel="icon" href="/favicon.svg"/><link rel="manifest" href="/manifest.json"/><meta name="theme-color" content="#1C3A28"/></Head>
      <style>{css}</style>
      <NavBar/>
      <MobileMenu/>

      {/* HERO */}
      <div style={{background:G.green,padding:'52px 20px 44px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:220,height:220,borderRadius:'50%',background:'rgba(232,184,75,.06)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-40,left:-30,width:160,height:160,borderRadius:'50%',background:'rgba(168,197,176,.05)',pointerEvents:'none'}}/>
        <div key={heroIdx} className="hero-anim">
          <div style={{display:'inline-block',background:'rgba(232,184,75,.15)',border:'.5px solid rgba(232,184,75,.4)',color:G.yellow,fontSize:11,padding:'3px 14px',borderRadius:99,marginBottom:16,letterSpacing:'.1em',textTransform:'uppercase',fontWeight:600}}>📍 Sourced from Mount Elgon, Bugisu</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(26px,6vw,46px)',color:'#fff',fontWeight:500,lineHeight:1.15,marginBottom:12,letterSpacing:'-.02em'}}>{heroSlides[heroIdx].headline}</h1>
          <p style={{fontSize:'clamp(13px,2.5vw,17px)',color:'rgba(255,255,255,.72)',marginBottom:28,maxWidth:500,margin:'0 auto 28px'}}>{heroSlides[heroIdx].sub}</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navTo('shop')} className="bscale" style={{background:G.yellow,color:G.green,border:'none',padding:'13px 28px',borderRadius:10,fontSize:14,fontWeight:700,boxShadow:'0 4px 16px rgba(232,184,75,.4)',transition:'all .18s'}}>🍌 Order fresh produce</button>
            <button onClick={()=>navTo('subscribe')} className="bscale" style={{background:'transparent',color:'#fff',border:'1.5px solid rgba(255,255,255,.35)',padding:'13px 28px',borderRadius:10,fontSize:14,fontWeight:500,transition:'all .18s'}}>🔄 Subscribe &amp; save 10%</button>
          </div>
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:24}}>
          {[0,1,2].map(i=><button key={i} onClick={()=>setHeroIdx(i)} style={{width:i===heroIdx?20:7,height:7,borderRadius:99,background:i===heroIdx?G.yellow:'rgba(255,255,255,.25)',border:'none',transition:'all .3s',padding:0}}/>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,maxWidth:480,margin:'24px auto 0'}}>
          {[['48hrs','Farm to door'],['30+','Bugisu farmers'],['75+','Kampala offices']].map(([n,l])=>(
            <div key={l} style={{background:'rgba(255,255,255,.07)',border:'.5px solid rgba(255,255,255,.1)',borderRadius:12,padding:'12px 8px',textAlign:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.yellow,fontWeight:500}}>{n}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.6)',marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TRUST STRIP */}
      <div style={{background:G.pale,borderBottom:`1px solid ${G.mist}30`,display:'flex',overflowX:'auto',gap:0}}>
        {[['✅','Freshness guaranteed'],['⏰','By 9 AM delivery'],['📱','Pay via MTN MoMo'],['🔄','Flexible subscriptions'],['📋','PDF invoicing'],['🌿','Plastic-free packaging']].map(([ic,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',whiteSpace:'nowrap',fontSize:12,color:G.leaf,borderRight:`0.5px solid ${G.mist}40`,flexShrink:0}}><span>{ic}</span><span style={{fontWeight:500}}>{l}</span></div>
        ))}
      </div>

      {/* FEATURED PRODUCTS */}
      <div style={{padding:'32px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.green,marginBottom:3}}>Fresh this week</h2>
            <p style={{fontSize:12,color:G.g400}}>All sourced from Bugisu in the last 48 hours</p>
          </div>
          <button onClick={()=>navTo('shop')} style={{fontSize:12,color:G.leaf,background:'transparent',border:`1px solid ${G.leaf}`,borderRadius:8,padding:'6px 14px',fontWeight:500}}>View all →</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}} className="grid3m">
          {PRODUCTS.slice(0,6).map(p=>(
            <div key={p.id} className="chover" style={{background:G.white,borderRadius:14,border:`1px solid ${G.g100}`,overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,.05)'}}>
              <div style={{height:88,background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative'}}>
                {p.emoji}
                <span style={{position:'absolute',top:8,left:8,fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:99,background:p.bc+'22',color:p.bc,border:`.5px solid ${p.bc}55`}}>{p.badge}</span>
              </div>
              <div style={{padding:10}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:1}}>{p.name}</div>
                <div style={{fontSize:10,color:G.g400,marginBottom:6}}>📍 {p.origin} · {p.grade}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:700,color:G.green}}>UGX {fmtUGX(p.price)}</span>
                    <span style={{fontSize:10,color:G.g400}}> {p.unit}</span>
                  </div>
                  {cart.find(i=>i.id===p.id)?(
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <button onClick={()=>chgQty(p.id,-1)} style={{width:24,height:24,borderRadius:6,border:`1px solid ${G.g200}`,background:G.g50,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:G.g600}}>−</button>
                      <span style={{fontSize:13,fontWeight:700,minWidth:14,textAlign:'center'}}>{cart.find(i=>i.id===p.id)?.qty}</span>
                      <button onClick={()=>addToCart(p)} style={{width:24,height:24,borderRadius:6,border:'none',background:G.green,color:G.yellow,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                    </div>
                  ):(
                    <button onClick={()=>addToCart(p)} className="bscale" style={{width:30,height:30,borderRadius:8,background:G.green,color:G.yellow,border:'none',fontSize:19,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{background:G.green,padding:'36px 20px',textAlign:'center'}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.yellow,marginBottom:6}}>How it works</h2>
        <p style={{fontSize:12,color:G.mist,marginBottom:22}}>Order by 8 PM — delivered to your office by 9 AM</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,maxWidth:580,margin:'0 auto'}}>
          {[['🛒','Browse & order','Pick fresh produce and add to cart'],['📍','Choose office','Select your Kampala office location'],['🏍','Pick your rider','Choose available rider or auto-assign'],['📦','Done by 9 AM','Fresh before the work day starts']].map(([ic,t,s])=>(
            <div key={t} style={{background:'rgba(255,255,255,.06)',border:'.5px solid rgba(255,255,255,.1)',borderRadius:12,padding:'16px 12px'}}>
              <div style={{fontSize:28,marginBottom:8}}>{ic}</div>
              <div style={{fontSize:12,fontWeight:600,color:'#fff',marginBottom:4}}>{t}</div>
              <div style={{fontSize:11,color:G.mist}}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS */}
      <div style={{padding:'32px 20px',background:G.cream}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.green,marginBottom:16,textAlign:'center'}}>What our clients say</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
          {[
            {q:'"The bananas arrive perfectly ripe every Friday. Our staff love it. Invoicing is seamless."',a:'Christine N.',co:'UNICEF Kampala'},
            {q:'"Best passion fruit in Kampala. Delivery always on time, every single week."',a:'David K.',co:'Ntinda resident'},
            {q:'"As a hotel kitchen we need consistency. Banello delivers exactly that."',a:'Florence A.',co:'Serena Hotel'},
          ].map(({q,a,co})=>(
            <div key={a} style={{background:G.white,borderRadius:14,padding:16,border:`1px solid ${G.g100}`,boxShadow:'0 1px 6px rgba(0,0,0,.04)'}}>
              <Stars r={5}/>
              <p style={{fontSize:13,fontStyle:'italic',color:G.g600,margin:'10px 0',lineHeight:1.6}}>{q}</p>
              <div style={{fontSize:12,fontWeight:600,color:G.green}}>{a}</div>
              <div style={{fontSize:11,color:G.g400}}>{co}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHATSAPP CTA */}
      <div style={{background:G.green,padding:'32px 20px',textAlign:'center'}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:'#fff',marginBottom:6}}>Prefer WhatsApp?</h2>
        <p style={{fontSize:13,color:G.mist,marginBottom:18}}>We reply within 30 minutes · 7 AM – 8 PM daily</p>
        <a href="https://wa.me/256700000000?text=Hi%20Banello%2C%20I%27d%20like%20to%20order" style={{background:'#25D366',color:'#fff',border:'none',borderRadius:99,padding:'12px 22px',fontSize:14,fontWeight:600,display:'inline-flex',alignItems:'center',gap:8,textDecoration:'none',boxShadow:'0 4px 14px rgba(37,211,102,.35)'}}>
          💬 WhatsApp: +256 700 000 000
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{background:'#0F2419',padding:'28px 20px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:20,marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:G.yellow,marginBottom:6}}>banello</div>
            <div style={{fontSize:11,color:'rgba(168,197,176,.7)',lineHeight:1.7}}>Premium fresh produce from Mount Elgon, delivered to Kampala offices and homes.</div>
            <div style={{fontSize:10,color:'rgba(168,197,176,.4)',marginTop:8}}>Reg: BF-2026-001 · TIN: 1234567890</div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.5)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>Links</div>
            {['Shop','Subscribe','About us','Delivery zones'].map(l=><div key={l} style={{fontSize:12,color:'rgba(168,197,176,.7)',padding:'3px 0',cursor:'pointer'}}>{l}</div>)}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.5)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>Contact</div>
            <div style={{fontSize:12,color:'rgba(168,197,176,.7)',lineHeight:2}}>📱 +256 700 000 000<br/>✉ orders@banello.ug<br/>📍 Nakawa, Kampala</div>
          </div>
        </div>
        <div style={{borderTop:'.5px solid rgba(255,255,255,.08)',paddingTop:12,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:11,color:'rgba(168,197,176,.4)'}}>© 2026 Banello Fresh Produce Ltd.</div>
          <div style={{fontSize:11,color:'rgba(168,197,176,.4)',fontStyle:'italic'}}>From the slopes of Elgon. To your table.</div>
        </div>
      </footer>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── SHOP ─── */
  if(page==='shop') return(
    <>
      <Head><title>Shop — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:960,margin:'0 auto',padding:20}} className="fade-in pp">
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.green,marginBottom:4}}>Fresh produce</h1>
        <p style={{fontSize:12,color:G.g400,marginBottom:16}}>All sourced from Bugisu in the last 48 hours — harvested at peak ripeness</p>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {['All','Bananas','Other produce'].map(f=>(
            <button key={f} onClick={()=>setProdFilter(f)} style={{padding:'6px 16px',borderRadius:99,fontSize:12,fontWeight:600,border:`1.5px solid ${prodFilter===f?G.green:G.g200}`,background:prodFilter===f?G.green:'transparent',color:prodFilter===f?'#fff':G.g600,transition:'all .15s'}}>{f}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:16}}>
          {filteredProds.map(p=>(
            <div key={p.id} className="chover" style={{background:G.white,borderRadius:16,border:`1px solid ${G.g100}`,overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}>
              <div style={{height:100,background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,position:'relative'}}>
                {p.emoji}
                <span style={{position:'absolute',top:10,left:10,fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:99,background:p.bc+'22',color:p.bc,border:`.5px solid ${p.bc}66`}}>{p.badge}</span>
              </div>
              <div style={{padding:12}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{p.name}</div>
                <div style={{fontSize:11,color:G.leaf,marginBottom:2,fontWeight:500}}>{p.grade}</div>
                <div style={{fontSize:10,color:G.g400,marginBottom:8}}>📍 {p.origin}</div>
                <div style={{fontSize:11,color:G.g600,lineHeight:1.5,marginBottom:10}}>{p.desc}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:700,color:G.green}}>UGX {fmtUGX(p.price)}</span>
                    <div style={{fontSize:10,color:G.g400}}>{p.unit}</div>
                  </div>
                  {cart.find(i=>i.id===p.id)?(
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <button onClick={()=>chgQty(p.id,-1)} style={{width:27,height:27,borderRadius:6,border:`1px solid ${G.g200}`,background:G.g50,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:G.g600}}>−</button>
                      <span style={{fontSize:13,fontWeight:700,minWidth:18,textAlign:'center'}}>{cart.find(i=>i.id===p.id)?.qty}</span>
                      <button onClick={()=>addToCart(p)} style={{width:27,height:27,borderRadius:6,border:'none',background:G.green,color:G.yellow,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                    </div>
                  ):(
                    <button onClick={()=>addToCart(p)} className="bscale" style={{width:32,height:32,borderRadius:8,background:G.green,color:G.yellow,border:'none',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {cartCount>0&&(
          <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:50}}>
            <button onClick={()=>navTo('cart')} className="bscale" style={{background:G.yellow,color:G.green,border:'none',borderRadius:99,padding:'13px 28px',fontSize:14,fontWeight:700,boxShadow:'0 6px 24px rgba(232,184,75,.5)',display:'flex',alignItems:'center',gap:10,whiteSpace:'nowrap'}}>
              🛒 View cart — {cartCount} item{cartCount>1?'s':''} · UGX {fmtUGX(cartTotal)}
            </button>
          </div>
        )}
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── CART ─── */
  if(page==='cart') return(
    <>
      <Head><title>Cart — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:680,margin:'0 auto',padding:20}} className="fade-in pp">
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.green,marginBottom:4}}>Your cart</h1>
        <p style={{fontSize:12,color:G.g400,marginBottom:20}}>{cartCount} item{cartCount!==1?'s':''} · Order by 8 PM for delivery by 9 AM tomorrow</p>
        {cart.length===0?(
          <div style={{textAlign:'center',padding:'48px 20px'}}>
            <div style={{fontSize:56,marginBottom:12}}>🛒</div>
            <div style={{fontSize:16,fontWeight:600,color:G.green,marginBottom:8}}>Your cart is empty</div>
            <div style={{fontSize:13,color:G.g400,marginBottom:20}}>Add fresh produce from our shop</div>
            <button onClick={()=>navTo('shop')} style={{background:G.green,color:G.yellow,border:'none',padding:'12px 28px',borderRadius:10,fontSize:14,fontWeight:600}}>Browse produce</button>
          </div>
        ):(
          <>
            <div style={{background:G.white,borderRadius:14,border:`1px solid ${G.g100}`,overflow:'hidden',marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,.05)'}}>
              {cart.map((item,idx)=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderBottom:idx<cart.length-1?`1px solid ${G.g100}`:'none'}}>
                  <div style={{fontSize:26,width:44,height:44,background:G.cream,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{item.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                    <div style={{fontSize:11,color:G.g400}}>{item.grade} · {item.origin}</div>
                    <div style={{fontSize:11,color:G.leaf,fontWeight:500}}>UGX {fmtUGX(item.price)} {item.unit}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <button onClick={()=>chgQty(item.id,-1)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${G.g200}`,background:G.g50,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:G.g600}}>−</button>
                    <span style={{fontSize:14,fontWeight:700,minWidth:20,textAlign:'center'}}>{item.qty}</span>
                    <button onClick={()=>chgQty(item.id,1)} style={{width:28,height:28,borderRadius:7,border:'none',background:G.green,color:G.yellow,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:G.green,minWidth:80,textAlign:'right',flexShrink:0}}>UGX {fmtUGX(item.price*item.qty)}</div>
                  <button onClick={()=>removeItem(item.id)} style={{background:'transparent',border:'none',color:G.g400,fontSize:16,padding:4,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{background:G.white,borderRadius:14,border:`1px solid ${G.g100}`,padding:16,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:G.g600}}>Subtotal</span><span style={{fontWeight:500}}>UGX {fmtUGX(cartTotal)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:G.g600}}>Delivery fee</span><span style={{fontWeight:500,color:G.leaf}}>UGX {fmtUGX(selOffice?.deliveryFee||5000)}</span></div>
              <div style={{height:1,background:G.g100,margin:'10px 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:700}}><span>Total</span><span style={{color:G.green}}>UGX {fmtUGX(cartTotal+(selOffice?.deliveryFee||5000))}</span></div>
            </div>
            <button onClick={()=>navTo('checkout')} className="bscale" style={{width:'100%',padding:'14px',borderRadius:12,background:G.green,color:G.yellow,border:'none',fontSize:15,fontWeight:700,boxShadow:'0 4px 16px rgba(28,58,40,.25)',marginBottom:10}}>Proceed to checkout →</button>
            <button onClick={()=>navTo('shop')} style={{width:'100%',padding:'12px',borderRadius:12,background:'transparent',color:G.green,border:`1.5px solid ${G.green}`,fontSize:13,fontWeight:500}}>+ Add more items</button>
          </>
        )}
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── CHECKOUT ─── */
  if(page==='checkout') return(
    <>
      <Head><title>Checkout — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:720,margin:'0 auto',padding:20}} className="fade-in pp">
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:G.green,marginBottom:4}}>Checkout</h1>
        <p style={{fontSize:12,color:G.g400,marginBottom:20}}>Complete your order for delivery by 9 AM</p>

        {/* Step indicators */}
        <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
          {[['1','Your details'],['2','Choose office'],['3','Assign rider'],['4','Payment']].map(([n,l],i)=>(
            <div key={n} style={{display:'flex',alignItems:'center',flex:i<3?1:'0 0 auto'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:G.green,color:G.yellow,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{n}</div>
                <span style={{fontSize:10,color:G.g600,whiteSpace:'nowrap',fontWeight:500}} className="hide-m">{l}</span>
              </div>
              {i<3&&<div style={{flex:1,height:2,background:G.g200,margin:'0 6px',marginBottom:14}}/>}
            </div>
          ))}
        </div>

        {/* Section helper */}
        {([
          {num:'1',title:'Your details',content:(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Full name *','text',name,setName,'e.g. Grace Namutebi'],['Phone (MoMo) *','tel',phone,setPhone,'+256 7XX XXX XXX'],['Email address','email',email,setEmail,'for invoice PDF'],['Company / office','text',company,setCompany,'e.g. UNICEF Uganda']].map(([label,type,val,setter,ph])=>(
                <div key={String(label)} style={{display:'flex',flexDirection:'column',gap:4}}>
                  <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase'}}>{label as string}</label>
                  <input type={type as string} placeholder={ph as string} value={val as string} onChange={e=>(setter as(v:string)=>void)(e.target.value)} style={{padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:13,color:G.g900,background:G.white}}/>
                </div>
              ))}
            </div>
          )},
          {num:'2',title:'Delivery office',content:(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginBottom:12}}>
                <input placeholder="🔍 Search office name or area..." value={officeSearch} onChange={e=>setOfficeSearch(e.target.value)} style={{padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:13}}/>
                <select value={officeZone} onChange={e=>setOfficeZone(e.target.value)} style={{padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:12,background:G.white}}>
                  {ZONES.map(z=><option key={z}>{z}</option>)}
                </select>
              </div>
              <div style={{maxHeight:280,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                {filteredOffices.map(o=>(
                  <div key={o.id} onClick={()=>setSelOffice(o)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${selOffice?.id===o.id?G.green:G.g200}`,background:selOffice?.id===o.id?G.pale:G.white,cursor:'pointer',transition:'all .15s'}}>
                    <div style={{width:36,height:36,borderRadius:8,background:selOffice?.id===o.id?G.pale:G.g50,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{o.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:selOffice?.id===o.id?G.green:G.g900}}>{o.name}</div>
                      <div style={{fontSize:10,color:G.g400}}>📍 {o.address||o.area}</div>
                    </div>
                    <div style={{fontSize:11,color:G.leaf,fontWeight:600,textAlign:'right',flexShrink:0}}>{o.zone}<br/><span style={{color:G.g400,fontWeight:400}}>+UGX {fmtUGX(o.deliveryFee)}</span></div>
                    {selOffice?.id===o.id&&<div style={{color:G.green,fontSize:18,flexShrink:0}}>✓</div>}
                  </div>
                ))}
              </div>
              {selOffice?.id==='O015'&&(
                <div style={{marginTop:10}}>
                  <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase',display:'block',marginBottom:4}}>Your full address *</label>
                  <input placeholder="Street, building, floor, landmark..." value={customAddr} onChange={e=>setCustomAddr(e.target.value)} style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${G.green}`,borderRadius:8,fontSize:13}}/>
                </div>
              )}
            </>
          )},
          {num:'3',title:'Assign delivery rider',content:(
            <>
              <p style={{fontSize:11,color:G.g400,marginBottom:12}}>Choose a specific rider or let us auto-assign the best available for your zone.</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div onClick={()=>setSelRider(null)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${!selRider?G.green:G.g200}`,background:!selRider?G.pale:G.white,cursor:'pointer',transition:'all .15s'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:!selRider?G.pale:G.g50,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>⚡</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:!selRider?G.green:G.g900}}>Auto-assign (recommended)</div><div style={{fontSize:10,color:G.g400}}>We pick the best rider for your zone</div></div>
                  {!selRider&&<div style={{color:G.green,fontSize:18}}>✓</div>}
                </div>
                {availRiders.map(r=>(
                  <div key={r.id} onClick={()=>setSelRider(r)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${selRider?.id===r.id?G.green:G.g200}`,background:selRider?.id===r.id?G.pale:G.white,cursor:'pointer',transition:'all .15s'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:G.green,flexShrink:0}}>{r.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{r.name}</div><div style={{fontSize:10,color:G.g400}}>Zone: {r.zone}</div></div>
                    <div style={{textAlign:'right',flexShrink:0}}><Stars r={r.rating}/><div style={{fontSize:10,color:G.g400}}>{r.deliveries} deliveries</div></div>
                    {selRider?.id===r.id&&<div style={{color:G.green,fontSize:18,flexShrink:0}}>✓</div>}
                  </div>
                ))}
              </div>
            </>
          )},
          {num:'4',title:'Delivery details & payment',content:(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase',display:'block',marginBottom:4}}>Delivery date *</label>
                  <input type="date" value={delDate} onChange={e=>setDelDate(e.target.value)} style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:13,background:G.white}}/>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase',display:'block',marginBottom:4}}>Preferred time</label>
                  <select style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:13,background:G.white}}>
                    <option>By 9:00 AM (recommended)</option>
                    <option>By 12:00 PM</option>
                    <option>Afternoon 2–5 PM</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase',display:'block',marginBottom:4}}>Delivery notes (optional)</label>
                <textarea placeholder="e.g. Leave at reception. Call security on arrival. Office 301, 3rd floor." value={delNote} onChange={e=>setDelNote(e.target.value)} rows={2} style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${G.g200}`,borderRadius:8,fontSize:13,resize:'vertical',fontFamily:'inherit'}}/>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:G.green,marginBottom:10}}>Payment method</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                {[['mtn-momo','📱 MTN MoMo','Most popular — instant confirmation'],['airtel-money','📲 Airtel Money','For Airtel subscribers'],['cash','💵 Cash on delivery','Pay rider on arrival'],['bank-transfer','🏦 Bank transfer','For corporate/invoice orders']].map(([val,label,sub])=>(
                  <label key={val} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${payMethod===val?G.green:G.g200}`,background:payMethod===val?G.pale:G.white,cursor:'pointer',transition:'all .15s'}}>
                    <input type="radio" name="pay" value={val} checked={payMethod===val} onChange={()=>setPayMethod(val as string)} style={{accentColor:G.green,flexShrink:0}}/>
                    <div><div style={{fontSize:13,fontWeight:600,color:payMethod===val?G.green:G.g900}}>{label as string}</div><div style={{fontSize:11,color:G.g400}}>{sub as string}</div></div>
                  </label>
                ))}
              </div>
              {(payMethod==='mtn-momo'||payMethod==='airtel-money')&&(
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:G.g600,letterSpacing:'.07em',textTransform:'uppercase',display:'block',marginBottom:4}}>MoMo phone number *</label>
                  <input type="tel" placeholder="+256 7XX XXX XXX" value={momoNum} onChange={e=>setMomoNum(e.target.value)} style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${G.green}`,borderRadius:8,fontSize:13}}/>
                  <div style={{fontSize:11,color:G.g400,marginTop:4}}>You will receive a MoMo prompt on this number.</div>
                </div>
              )}
            </>
          )},
        ] as {num:string;title:string;content:React.ReactNode}[]).map(({num,title,content})=>(
          <div key={num} style={{background:G.white,borderRadius:14,border:`1px solid ${G.g100}`,padding:16,marginBottom:14,boxShadow:'0 1px 6px rgba(0,0,0,.04)'}}>
            <div style={{fontSize:13,fontWeight:700,color:G.green,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:22,height:22,background:G.green,color:G.yellow,borderRadius:'50%',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{num}</span>{title}
            </div>
            {content}
          </div>
        ))}

        {/* Order summary */}
        <div style={{background:G.green,borderRadius:14,padding:16,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:G.yellow,marginBottom:10}}>Order summary</div>
          {cart.map(i=>(
            <div key={i.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,.8)',marginBottom:4}}>
              <span>{i.emoji} {i.name} × {i.qty}</span><span>UGX {fmtUGX(i.price*i.qty)}</span>
            </div>
          ))}
          <div style={{height:1,background:'rgba(255,255,255,.15)',margin:'10px 0'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,.7)',marginBottom:4}}>
            <span>Delivery to {selOffice?.name||'your office'}</span><span>UGX {fmtUGX(selOffice?.deliveryFee||5000)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,color:G.yellow}}>
            <span>Total</span><span>UGX {fmtUGX(cartTotal+(selOffice?.deliveryFee||5000))}</span>
          </div>
          {selRider&&<div style={{fontSize:11,color:G.mist,marginTop:8}}>🏍 Rider: {selRider.name} · {selRider.zone}</div>}
          {selOffice&&<div style={{fontSize:11,color:G.mist,marginTop:4}}>📍 Office: {selOffice.name}</div>}
        </div>

        <div style={{background:G.pale,border:`.5px solid ${G.mist}`,borderRadius:10,padding:'10px 14px',fontSize:12,color:G.leaf,marginBottom:14,display:'flex',gap:8,alignItems:'flex-start'}}>
          <span style={{fontSize:15,flexShrink:0,marginTop:1}}>🔐</span>
          <span>Secure payment processed by Pesapal. Your MoMo PIN is entered on your phone — we never see it.</span>
        </div>

        <button onClick={placeOrder} className="bscale" style={{width:'100%',padding:'15px',borderRadius:12,background:G.yellow,color:G.green,border:'none',fontSize:15,fontWeight:700,boxShadow:'0 4px 16px rgba(232,184,75,.4)',transition:'all .18s'}}>
          ✓ Confirm &amp; place order — UGX {fmtUGX(cartTotal+(selOffice?.deliveryFee||5000))}
        </button>
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── CONFIRMATION ─── */
  if(page==='confirmation') return(
    <>
      <Head><title>Order confirmed — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:540,margin:'0 auto',padding:20,textAlign:'center'}} className="fade-in pp">
        <div style={{background:G.white,borderRadius:20,border:`1px solid ${G.g100}`,padding:'36px 24px',boxShadow:'0 4px 20px rgba(0,0,0,.07)'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px'}}>✅</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:G.green,marginBottom:6}}>Order confirmed!</h1>
          <div style={{fontSize:14,color:G.g600,marginBottom:4}}>Reference: <strong style={{color:G.green,fontFamily:'monospace'}}>{orderRef}</strong></div>
          <div style={{fontSize:13,color:G.g400,marginBottom:24}}>WhatsApp confirmation on its way</div>
          <div style={{background:G.cream,borderRadius:12,padding:16,textAlign:'left',marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:G.green,marginBottom:12}}>🚀 Delivery tracking</div>
            {[
              {label:'Order received',time:'Just now',done:true},
              {label:'Produce packed at hub',time:'Tonight',done:true},
              {label:`Rider assigned${selRider?': '+selRider.name:''}`,time:'Tomorrow 6 AM',done:false},
              {label:'Out for delivery',time:'7–9 AM',done:false},
              {label:`Delivered to ${selOffice?.name||'your office'}`,time:'By 9 AM',done:false},
            ].map(({label,time,done})=>(
              <div key={label} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'6px 0'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:done?G.green:G.g200,marginTop:4,flexShrink:0}}/>
                <div><div style={{fontSize:12,fontWeight:done?600:400,color:done?G.green:G.g600}}>{label}</div><div style={{fontSize:11,color:G.g400}}>{time}</div></div>
              </div>
            ))}
          </div>
          <a href={`https://wa.me/256700000000?text=My order ref is ${orderRef}`} style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25D366',color:'#fff',border:'none',borderRadius:99,padding:'12px 22px',fontSize:14,fontWeight:600,textDecoration:'none',marginBottom:12,boxShadow:'0 4px 14px rgba(37,211,102,.35)'}}>💬 Track via WhatsApp</a>
          <div style={{height:8}}/>
          <button onClick={()=>{setCart([]);setPage('home')}} style={{background:'transparent',border:`1.5px solid ${G.green}`,color:G.green,borderRadius:10,padding:'11px 24px',fontSize:13,fontWeight:500,width:'100%'}}>Place another order</button>
        </div>
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── SUBSCRIBE ─── */
  if(page==='subscribe') return(
    <>
      <Head><title>Subscribe — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:700,margin:'0 auto',padding:20}} className="fade-in pp">
        <div style={{textAlign:'center',marginBottom:28}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:G.green,marginBottom:6}}>Subscribe &amp; save 10%</h1>
          <p style={{fontSize:13,color:G.g400}}>Standing orders on your schedule. Pause or cancel anytime via WhatsApp.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
          {[
            {name:'Starter box',price:'45,000',freq:'Every Monday',items:['2 bunches Bogoya banana','1 kg passion fruit','Free delivery included','Skip any week via WhatsApp'],popular:false},
            {name:'Office box',price:'95,000',freq:'Mon & Thu delivery',items:['4 bunches premium banana','2 kg mixed seasonal fruit','Vegetable add-on','PDF invoice within 24hrs','Priority morning delivery','Pause or cancel anytime'],popular:true},
            {name:'Custom box',price:'Your choice',freq:'Your schedule',items:['Pick your own produce','Set your own frequency','Modify via WhatsApp','10% discount applied'],popular:false},
          ].map(({name,price,freq,items,popular})=>(
            <div key={name} style={{background:G.white,borderRadius:16,border:`${popular?2:1}px solid ${popular?G.green:G.g100}`,padding:18,position:'relative',boxShadow:popular?'0 4px 20px rgba(28,58,40,.1)':'0 1px 6px rgba(0,0,0,.04)'}}>
              {popular&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:G.green,color:G.yellow,fontSize:10,fontWeight:700,padding:'3px 12px',borderRadius:99,whiteSpace:'nowrap'}}>Most popular</div>}
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:G.green,marginBottom:4,marginTop:popular?8:0}}>{name}</div>
              <div style={{fontSize:22,fontWeight:700,color:G.green,marginBottom:2}}>UGX {price}<span style={{fontSize:12,fontWeight:400,color:G.g400}}> / week</span></div>
              <div style={{fontSize:11,color:G.g400,marginBottom:14}}>{freq}</div>
              <div style={{marginBottom:14}}>{items.map(it=><div key={it} style={{display:'flex',gap:7,alignItems:'flex-start',marginBottom:5,fontSize:12,color:G.g600}}><span style={{color:G.green,flexShrink:0}}>✓</span>{it}</div>)}</div>
              <button onClick={()=>toast(`Subscribe to ${name} — WhatsApp us to set up`)} className="bscale" style={{width:'100%',padding:'10px',borderRadius:10,background:popular?G.green:'transparent',color:popular?G.yellow:G.green,border:`1.5px solid ${G.green}`,fontSize:13,fontWeight:600,transition:'all .18s'}}>{popular?'Subscribe now →':'Choose '+name.toLowerCase()}</button>
            </div>
          ))}
        </div>
        <div style={{background:G.pale,border:`.5px solid ${G.mist}`,borderRadius:12,padding:14,marginTop:16,fontSize:12,color:G.leaf,display:'flex',gap:10}}>
          <span style={{fontSize:18,flexShrink:0}}>ℹ</span>
          <span>Subscriptions save 10% vs single orders. Skip any week with 24hrs WhatsApp notice. No lock-in — cancel anytime. PDF invoice for every corporate delivery.</span>
        </div>
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )

  /* ─── ABOUT ─── */
  return(
    <>
      <Head><title>About — Banello</title></Head>
      <style>{css}</style>
      <NavBar/><MobileMenu/>
      <div style={{maxWidth:680,margin:'0 auto',padding:20}} className="fade-in pp">
        <div style={{background:G.green,borderRadius:20,padding:'32px 24px',textAlign:'center',marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:G.yellow,marginBottom:8}}>From the slopes of Elgon.</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:'rgba(255,255,255,.85)',marginBottom:12,fontStyle:'italic'}}>Glides down the throat — extra fresh from the breezy mountains.</div>
          <div style={{fontSize:13,color:G.mist,lineHeight:1.7}}>Banello sources premium ripe bananas and fresh produce directly from 30+ smallholder farmers in Bugisu — Bududa, Manafwa, Sironko, and Mbale. We pay farmers same-day cash, grade every batch, and deliver to Kampala offices by 9 AM.</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[['30+','Farmers'],['100%','Same-day pay'],['4 districts','Bugisu'],['75+','Clients'],['48hrs','Farm to door'],['0','Plastic used']].map(([n,l])=>(
            <div key={l} style={{background:G.white,border:`1px solid ${G.g100}`,borderRadius:12,padding:14,textAlign:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:G.green,fontWeight:500}}>{n}</div>
              <div style={{fontSize:11,color:G.g400,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:G.white,border:`1px solid ${G.g100}`,borderRadius:14,padding:16}}>
          <div style={{fontSize:14,fontWeight:600,color:G.green,marginBottom:12}}>Our farmer partners</div>
          {[['Moses Wanyama','Bududa','Bogoya · 78% Grade A'],['Sarah Nabirye','Manafwa','Bogoya · 82% Grade A'],['Grace Chebet','Mbale','Bogoya · 85% Grade A'],['John Masaba','Sironko','Nfuuka · 65% Grade A']].map(([n,d,v])=>(
            <div key={n} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:`1px solid ${G.g100}`}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:G.green,flexShrink:0}}>{n.split(' ').map((x:string)=>x[0]).join('')}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{n}</div>
                <div style={{fontSize:11,color:G.g400}}>📍 {d} District</div>
                <div style={{fontSize:11,color:G.leaf}}>{v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toastMsg} show={toastShow}/>
    </>
  )
}
