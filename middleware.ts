import{NextResponse}from'next/server'
import type{NextRequest}from'next/server'
import{jwtVerify}from'jose'
const JWT_SECRET=new TextEncoder().encode(process.env.JWT_SECRET||'banello-dev-secret-minimum-32-chars-change-in-prod')
const ADMIN_SLUG=process.env.ADMIN_PATH_SLUG||'admin'
const SEC={
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'X-XSS-Protection':'1; mode=block',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(),microphone=(),geolocation=()',
}
async function verifyToken(t:string){try{const{payload}=await jwtVerify(t,JWT_SECRET,{issuer:'banello.ug',audience:'banello-platform'});return payload}catch{return null}}
function getIp(req:NextRequest):string{return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'unknown'}
export async function middleware(req:NextRequest){
  const{pathname}=req.nextUrl
  const res=NextResponse.next()
  Object.entries(SEC).forEach(([k,v])=>res.headers.set(k,v))
  if(pathname.startsWith(`/admin`)){
    const token=req.cookies.get('banello_access')?.value||null
    if(!token){const url=new URL('/login',req.url);url.searchParams.set('from',pathname);const r=NextResponse.redirect(url);Object.entries(SEC).forEach(([k,v])=>r.headers.set(k,v));return r}
    const payload=await verifyToken(token)
    if(!payload||!payload.isAdmin){return new NextResponse(JSON.stringify({error:'Access denied'}),{status:403,headers:{'Content-Type':'application/json',...SEC}})}
    res.headers.set('x-user-id',String(payload.userId||''))
    res.headers.set('x-user-role',String(payload.role||''))
  }
  return res
}
export const config={matcher:['/((?!_next/static|_next/image|favicon|public).*)','/admin/:path*']}
